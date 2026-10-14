import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { existsSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';

/** The public site (served at / by the Worker, and here by the dev server). */
const ROOT = resolve(import.meta.dirname, '../site');

/* Mirrors ALLOWED_PATHS in ../worker/index.js */
const ALLOWED_PATHS = [
  /^index\.html$/,
  /^assets\/js\/content\.js$/,
  /^content\/site\.json$/,
  /^assets\/images\/uploads\/[a-z0-9-]+\.(jpg|png|webp)$/,
];

const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
};

/** Dev only: serves the real site at / (so the preview iframe loads main.css/main.js/images)
 *  and stands in for the Cloudflare Worker at /__dev/* — publishing writes straight to disk. */
function devSite(): Plugin {
  return {
    name: 'goosebumps-dev-site',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
        const json = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };

        if (url === '/__dev/login' && req.method === 'POST') return json(200, { token: 'dev', expires: Date.now() + 8 * 3600e3 });
        if (url === '/__dev/content') {
          const text = readFileSync(resolve(ROOT, 'content/site.json'), 'utf8');
          return json(200, { site: JSON.parse(text), sha: String(statSync(resolve(ROOT, 'content/site.json')).mtimeMs) });
        }
        if (url === '/__dev/publish' && req.method === 'POST') {
          let raw = '';
          for await (const chunk of req) raw += chunk;
          const { files } = JSON.parse(raw) as { files: { path: string; b64: string }[] };
          for (const f of files) {
            if (!ALLOWED_PATHS.some((re) => re.test(f.path))) return json(400, { error: 'Path not allowed: ' + f.path });
          }
          for (const f of files) {
            const out = resolve(ROOT, f.path);
            mkdirSync(dirname(out), { recursive: true });
            writeFileSync(out, Buffer.from(f.b64, 'base64'));
          }
          return json(200, { success: true, sha: String(statSync(resolve(ROOT, 'content/site.json')).mtimeMs) });
        }

        // static site files (everything outside /admin/ and Vite's own routes)
        if (url.startsWith('/admin') || url.startsWith('/@') || url.startsWith('/node_modules') || url.startsWith('/src')) return next();
        const file = resolve(ROOT, '.' + (url.endsWith('/') ? url + 'index.html' : url));
        if (!file.startsWith(ROOT + sep)) return next();
        if (!existsSync(file) || !statSync(file).isFile()) return next();
        res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-store');
        res.end(readFileSync(file));
      });
    },
  };
}

export default defineConfig({
  base: '/admin/',
  plugins: [devSite(), svelte()],
  server: { port: 3099, strictPort: true },
  build: { outDir: '../site/admin', emptyOutDir: true },
});

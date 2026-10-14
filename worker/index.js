/**
 * Goosebumps — one Worker for the whole demo:
 *
 *   /                      public site (static files from site/, served without waking the Worker)
 *   /admin/unlock?k=KEY    opens the gate on this device (long-lived cookie), then redirects to /admin/
 *   /admin/*               the Svelte CMS (static, built from cms/) — gated
 *   /api/*                 login / content / publish — gated
 *
 * Secrets (`npx wrangler secret put <NAME>`):
 *   GH_TOKEN         GitHub token with Contents: read & write on GH_OWNER/GH_REPO
 *   CMS_PASSWORD     the CMS login password
 *   SESSION_SECRET   signs login sessions
 *   ADMIN_GATE_KEY   the key in the unlock link
 * Vars (wrangler.jsonc): GH_OWNER, GH_REPO, GH_BRANCH, SITE_DIR (repo folder holding the public site).
 *
 * API:
 *   POST /api/login    { password }                 → { token, expires }
 *   GET  /api/content  (Bearer)                     → { site, sha }   latest site.json from GitHub
 *   POST /api/publish  (Bearer) { files: [{ path, b64 }], baseSha }
 *                      → one commit; 409 if site.json changed since baseSha. Paths are relative to the site root.
 */

const SESSION_HOURS = 8;
const MAX_FILES = 60;

/* Site-relative paths the CMS may write (mirrored in cms/vite.config.ts) */
const ALLOWED_PATHS = [
  /^index\.html$/,
  /^assets\/js\/content\.js$/,
  /^content\/site\.json$/,
  /^assets\/images\/uploads\/[a-z0-9-]+\.(jpg|png|webp)$/,
];
const CONTENT_PATH = 'content/site.json';

/* ── gate ──
   A doormat in front of the CMS, not the lock: without the cookie every /admin and /api
   path answers like an unknown address — no branding, no login form for Safe Browsing
   to classify as phishing on a *.workers.dev host. The password login behind it is the lock. */

const GATE_COOKIE = 'gb_gate';
const GATE_MAX_AGE = 60 * 60 * 24 * 180;

function notFound() {
  return new Response('Not found\n', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' },
  });
}

const isLocal = (host) => host === 'localhost' || host === '127.0.0.1' || host === '[::1]';

async function sha256Hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** What the cookie must contain. Never the key itself. */
const gateToken = async (key) => (await sha256Hex(`gb-gate:v1:${key}`)).slice(0, 32);

function same(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function gateOpen(request, url, env) {
  if (isLocal(url.hostname)) return true;
  if (!env.ADMIN_GATE_KEY) return false; // fail closed: an unset key must not expose the CMS
  const found = (request.headers.get('cookie') || '').split(';').map((p) => p.trim()).find((p) => p.startsWith(GATE_COOKIE + '='));
  return !!found && same(found.slice(GATE_COOKIE.length + 1), await gateToken(env.ADMIN_GATE_KEY));
}

async function unlock(url, env) {
  const given = url.searchParams.get('k') || '';
  if (!env.ADMIN_GATE_KEY || !given || !same(given, env.ADMIN_GATE_KEY)) return notFound();
  return new Response(null, {
    status: 303,
    headers: {
      // the key must not survive in history or a referrer, so leave it behind
      location: '/admin/',
      'set-cookie': `${GATE_COOKIE}=${await gateToken(env.ADMIN_GATE_KEY)}; Path=/; Max-Age=${GATE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
      'cache-control': 'no-store',
    },
  });
}

/* ── sessions: token = "<expiresMs>.<hex HMAC-SHA256(expiresMs)>" ── */

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time comparison of arbitrary strings (compares their HMACs, so lengths always match). */
async function safeEqual(a, b, secret) {
  return same(await hmacHex(secret, a), await hmacHex(secret, b));
}

async function issueToken(env) {
  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  return { token: `${expires}.${await hmacHex(env.SESSION_SECRET, String(expires))}`, expires };
}

async function verifyToken(request, env) {
  const m = /^Bearer (\d+)\.([0-9a-f]{64})$/.exec(request.headers.get('Authorization') || '');
  if (!m || Number(m[1]) < Date.now()) return false;
  return same(m[2], await hmacHex(env.SESSION_SECRET, m[1]));
}

/* ── GitHub ── */

async function gh(env, path, init = {}) {
  if (!env.GH_TOKEN) throw new Error('GH_TOKEN is not set on the Worker (npx wrangler secret put GH_TOKEN)');
  const r = await fetch(`https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GH_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
      'User-Agent': 'GoosebumpsCMS/2.0',
    },
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`GitHub ${path.split('?')[0]}: ${body.message || r.status}`);
  return body;
}

const repoPath = (env, p) => (env.SITE_DIR || '') + p;

async function readContent(env) {
  const f = await gh(env, `/contents/${repoPath(env, CONTENT_PATH)}?ref=${env.GH_BRANCH}`);
  const bytes = Uint8Array.from(atob(f.content.replace(/\n/g, '')), (c) => c.charCodeAt(0));
  return { site: JSON.parse(new TextDecoder().decode(bytes)), sha: f.sha };
}

/** Commits all files in one commit on GH_BRANCH; returns the new blob sha of site.json. */
async function commitFiles(env, files) {
  const ref = await gh(env, `/git/refs/heads/${env.GH_BRANCH}`);
  const commit = await gh(env, `/git/commits/${ref.object.sha}`);
  const tree = [];
  let contentSha = '';
  for (const f of files) {
    const blob = await gh(env, '/git/blobs', { method: 'POST', body: JSON.stringify({ content: f.b64, encoding: 'base64' }) });
    tree.push({ path: repoPath(env, f.path), mode: '100644', type: 'blob', sha: blob.sha });
    if (f.path === CONTENT_PATH) contentSha = blob.sha;
  }
  const newTree = await gh(env, '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: commit.tree.sha, tree }) });
  const newCommit = await gh(env, '/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: 'Update content via CMS', tree: newTree.sha, parents: [ref.object.sha] }),
  });
  await gh(env, `/git/refs/heads/${env.GH_BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha }) });
  return contentSha;
}

/* ── API ── */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

async function api(request, url, env) {
  const route = url.pathname.slice('/api'.length);

  if (route === '/login' && request.method === 'POST') {
    const { password } = await request.json().catch(() => ({}));
    if (typeof password !== 'string' || !env.CMS_PASSWORD || !(await safeEqual(password, env.CMS_PASSWORD, env.SESSION_SECRET))) {
      await new Promise((r) => setTimeout(r, 600)); // slow down guessing
      return json({ error: 'Unauthorized' }, 401);
    }
    return json(await issueToken(env));
  }

  if (!(await verifyToken(request, env))) return json({ error: 'Unauthorized' }, 401);

  if (route === '/content' && request.method === 'GET') return json(await readContent(env));

  if (route === '/publish' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    const files = body && Array.isArray(body.files) ? body.files : null;
    if (!files || !files.length || files.length > MAX_FILES) return json({ error: 'Invalid number of files' }, 400);
    for (const f of files) {
      if (!f || typeof f.path !== 'string' || typeof f.b64 !== 'string' || !f.b64.length) return json({ error: 'Malformed file entry' }, 400);
      if (!ALLOWED_PATHS.some((re) => re.test(f.path))) return json({ error: 'Path not allowed: ' + f.path }, 400);
      if (f.path === 'index.html' && f.b64.length < 1000) return json({ error: 'index.html looks empty' }, 400);
    }
    if (body.baseSha) {
      const current = await gh(env, `/contents/${repoPath(env, CONTENT_PATH)}?ref=${env.GH_BRANCH}`);
      if (current.sha !== body.baseSha) return json({ error: 'Content changed since you started editing' }, 409);
    }
    return json({ success: true, sha: await commitFiles(env, files) });
  }

  return json({ error: 'Not found' }, 404);
}

/* ── router ── */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    const gated = p === '/admin' || p.startsWith('/admin/') || p.startsWith('/api/');
    if (!gated) return env.ASSETS.fetch(request);

    if (p === '/admin/unlock') return unlock(url, env);
    if (!(await gateOpen(request, url, env))) return notFound();

    if (p.startsWith('/api/')) {
      try {
        return await api(request, url, env);
      } catch (err) {
        return json({ error: err.message }, 500);
      }
    }
    // the CMS itself: static files, never cached by browsers or indexed
    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    out.headers.set('cache-control', p === '/admin/' || p === '/admin' ? 'no-store' : res.headers.get('cache-control') || 'no-cache');
    out.headers.set('x-robots-tag', 'noindex, nofollow');
    return out;
  },
};

/* Regenerates index.html + assets/js/content.js from content/site.json (same renderer the CMS uses).
   Usage (from cms/): npm run render */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '../src/lib/render.ts';
import type { Site } from '../src/lib/schema.ts';

const ROOT = resolve(import.meta.dirname, '../../site');
const site = JSON.parse(readFileSync(resolve(ROOT, 'content/site.json'), 'utf8')) as Site;
const { indexHtml, contentJs } = render(site);
writeFileSync(resolve(ROOT, 'index.html'), indexHtml);
writeFileSync(resolve(ROOT, 'assets/js/content.js'), contentJs);
console.log('wrote index.html (%d KB) and assets/js/content.js (%d KB)', Math.round(indexHtml.length / 1024), Math.round(contentJs.length / 1024));

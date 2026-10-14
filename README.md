# Goosebumps CMS (demo)

Demo of the proposed new CMS for goosebumpsevents.eu: the public site plus a Svelte editor, running as one Cloudflare Worker.

```
site/      the public site (static). index.html and assets/js/content.js are GENERATED from content/site.json
cms/       Svelte 5 + Vite + TypeScript editor; `npm run build` outputs to site/admin
worker/    gate + API (login, content, publish to GitHub)
```

| URL | What |
|---|---|
| `/` | public site |
| `/admin/unlock?k=<ADMIN_GATE_KEY>` | opens the gate on this device (cookie for 180 days) |
| `/admin/` | the CMS (plain 404 until the gate is opened) |

## How publishing works

1. The CMS renders `site.json` into `index.html` and `content.js` in the browser using `cms/src/lib/render.ts`.
2. The Worker commits those files, plus any uploaded images, to `GH_OWNER/GH_REPO` on `GH_BRANCH` in a single commit.
3. Cloudflare Workers Builds redeploys on push, and the change is live about a minute later.

## Develop

```sh
cd cms
npm install
npm run dev      # http://localhost:3099/admin/ (any password; "publish" writes into ../site)
npm run check    # type-check
npm run build    # → site/admin; commit the output
npm run render   # regenerate site/index.html + content.js from site/content/site.json
```

Never hand-edit `site/index.html` or `site/assets/js/content.js`, because the next publish overwrites them. Make markup changes in `cms/src/lib/render.ts`, then run `npm run render` and `npm run build`.

## Deploy

```sh
npx wrangler deploy
npx wrangler secret put GH_TOKEN         # fine-grained token, Contents: read & write on this repo
npx wrangler secret put CMS_PASSWORD
npx wrangler secret put SESSION_SECRET   # random, e.g. openssl rand -hex 32
npx wrangler secret put ADMIN_GATE_KEY   # random; goes in the unlock link
```

The gate fails closed: if `ADMIN_GATE_KEY` is unset, `/admin` and `/api` return 404 for everyone except localhost.

## Moving to the real site later

Copy `site/` into `DSMeridian/goosebumpsevents.eu`. Then set `GH_OWNER=DSMeridian`, `GH_REPO=goosebumpsevents.eu` and `SITE_DIR=""` in `wrangler.jsonc`, and drop the `site/` assets from the Worker. Last, give the Worker a `GH_TOKEN` for that repo.

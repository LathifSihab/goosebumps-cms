import { SvelteMap } from 'svelte/reactivity';
import { blobToB64, loadContent, publish, textToB64, type PublishFile } from './api.ts';
import { clearDraft, loadDraft, saveDraft, type Draft } from './drafts.ts';
import { withDefaults } from './legal.ts';
import { render } from './render.ts';
import type { L10n, Lang, Site } from './schema.ts';

export type Device = 'desktop' | 'tablet' | 'mobile';
export const DEVICE_WIDTH: Record<Device, number> = { desktop: 1440, tablet: 820, mobile: 390 };

export const app = $state({
  site: null as Site | null,
  /** blob sha of content/site.json the draft is based on (conflict detection on publish) */
  baseSha: '',
  publishedJson: '',
  lang: 'en' as Lang,
  device: 'desktop' as Device,
  /** editor panel: a fixed panel name or a section id */
  selected: 'hero',
  /** bumped to ask the preview to scroll to the selected section */
  scrollRequest: 0,
  publishing: false,
  message: null as null | { kind: 'ok' | 'error' | 'info'; text: string },
  /** a stored draft newer than the published content, offered for restore on load */
  pendingDraft: null as Draft | null,
});

/** Images picked in this session but not yet published: repo path → blob (+ object URL for previews). */
export const uploads = new SvelteMap<string, { blob: Blob; url: string }>();

/** The public site root, e.g. https://www.goosebumpsevents.eu/ when the CMS runs at /admin/ */
export const SITE_BASE = new URL('../', location.href).href;

/** For the preview renderer (which sets <base href=SITE_BASE>): pending uploads → blob URLs. */
export function resolveSrc(path: string): string {
  return uploads.get(path)?.url ?? path;
}

/** Absolute URL for showing a stored image inside the CMS itself (thumbnails). */
export function thumbSrc(path: string): string {
  return uploads.get(path)?.url ?? new URL(path, SITE_BASE).href;
}

export function addUpload(path: string, blob: Blob) {
  if (!uploads.has(path)) uploads.set(path, { blob, url: URL.createObjectURL(blob) });
}

export function siteJson(site: Site): string {
  return JSON.stringify(site, null, 2) + '\n';
}

export function isDirty(): boolean {
  return !!app.site && JSON.stringify(app.site) !== app.publishedJson;
}

export function select(panel: string) {
  app.selected = panel;
  app.scrollRequest++;
}

export function flash(kind: 'ok' | 'error' | 'info', text: string) {
  app.message = { kind, text };
}

/* ── loading & drafts ── */

export async function loadSite() {
  const { site, sha } = await loadContent();
  app.site = withDefaults(site);
  app.baseSha = sha;
  app.publishedJson = JSON.stringify(site);
  uploads.clear();
  const draft = await loadDraft();
  if (draft && JSON.stringify(draft.site) !== app.publishedJson) app.pendingDraft = draft;
}

export function restoreDraft() {
  const d = app.pendingDraft;
  if (!d) return;
  app.site = withDefaults(d.site);
  for (const [path, blob] of Object.entries(d.uploads)) addUpload(path, blob);
  app.pendingDraft = null;
  if (d.baseSha !== app.baseSha) flash('info', 'Draft restored. Note: the live site was changed since this draft was saved — publishing will overwrite those changes.');
}

export async function discardDraft() {
  app.pendingDraft = null;
  await clearDraft();
}

export async function persistDraft() {
  if (!app.site) return;
  if (!isDirty()) return clearDraft();
  const snap = $state.snapshot(app.site) as Site;
  const json = JSON.stringify(snap);
  const used: Record<string, Blob> = {};
  for (const [p, u] of uploads) if (json.includes(JSON.stringify(p))) used[p] = u.blob;
  await saveDraft({ site: snap, baseSha: app.baseSha, savedAt: Date.now(), uploads: used });
}

export async function discardChanges() {
  if (!app.publishedJson) return;
  app.site = JSON.parse(app.publishedJson);
  uploads.clear();
  await clearDraft();
  flash('info', 'Changes discarded.');
}

/* ── publishing ── */

export async function publishSite(force = false) {
  if (!app.site || app.publishing) return;
  app.publishing = true;
  app.message = null;
  try {
    const snap = $state.snapshot(app.site) as Site;
    const { indexHtml, contentJs } = render(snap);
    const json = siteJson(snap);
    const files: PublishFile[] = [
      { path: 'index.html', b64: textToB64(indexHtml) },
      { path: 'assets/js/content.js', b64: textToB64(contentJs) },
      { path: 'content/site.json', b64: textToB64(json) },
    ];
    for (const [path, u] of uploads) {
      if (json.includes(JSON.stringify(path))) files.push({ path, b64: await blobToB64(u.blob) });
    }
    const r = await publish(files, force ? '' : app.baseSha);
    app.baseSha = r.sha;
    app.publishedJson = JSON.stringify(snap);
    uploads.clear();
    await clearDraft();
    flash('ok', import.meta.env.DEV ? 'Written to your local checkout.' : 'Published — live in about 2 minutes.');
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) {
      flash('error', 'Your session expired. Sign out and in again — your changes are kept as a draft.');
    } else if (err.status === 409) {
      flash('error', 'Someone else published changes since you started editing. Use “Publish anyway” to overwrite them, or reload to start from the latest version.');
    } else {
      flash('error', err.message || 'Publishing failed.');
    }
  } finally {
    app.publishing = false;
  }
}

/* ── translation coverage ── */

function isL10n(v: unknown): v is L10n {
  return !!v && typeof v === 'object' && 'en' in v && 'fr' in v && 'nl' in v && typeof (v as L10n).en === 'string';
}

/** Number of texts that have English but are missing French and/or Dutch. */
export function missingTranslations(v: unknown): number {
  if (isL10n(v)) return v.en.trim() && (!v.fr.trim() || !v.nl.trim()) ? 1 : 0;
  if (Array.isArray(v)) return v.reduce((n, x) => n + missingTranslations(x), 0);
  if (v && typeof v === 'object') return Object.values(v).reduce((n: number, x) => n + missingTranslations(x), 0);
  return 0;
}

<script lang="ts">
  import { app, DEVICE_WIDTH, SITE_BASE, resolveSrc, uploads } from '../lib/state.svelte.ts';
  import { render } from '../lib/render.ts';
  import type { Site } from '../lib/schema.ts';

  /* Panel → element to scroll to in the preview */
  const PANEL_TARGET: Record<string, string> = { hero: '#hero', marquee: '.mwrap', contactInfo: 'footer', brand: '#nav', seo: '#hero', footer: 'footer', navCta: '#nav', layout: '#hero', legal: 'footer' };

  let cw = $state(0), ch = $state(0);
  // two iframes: the next render loads in the hidden one, then they swap — no white flash while typing
  let frames: HTMLIFrameElement[] = $state([]);
  let active = $state(0);
  let timer: ReturnType<typeof setTimeout>;
  let loadedOnce = false;

  const width = $derived(DEVICE_WIDTH[app.device]);
  const scale = $derived(cw ? Math.min(1, (cw - 32) / width) : 1);
  const height = $derived(Math.max(400, (ch - 32) / scale));

  function targetFor(panel: string): string {
    return PANEL_TARGET[panel] ?? '#' + CSS.escape(panel);
  }

  function scrollTo(win: Window, selector: string, smooth: boolean) {
    const el = win.document.querySelector(selector);
    if (!el) return;
    const nav = win.document.getElementById('nav');
    const top = el.getBoundingClientRect().top + win.scrollY - (selector === '#hero' ? 0 : (nav?.offsetHeight ?? 0));
    win.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' });
  }

  function load(json: string) {
    const html = render(JSON.parse(json) as Site, { preview: true, baseHref: SITE_BASE, resolve: resolveSrc }).indexHtml;
    const cur = frames[active], next = frames[1 - active];
    if (!cur || !next) return;
    const y = cur.contentWindow?.scrollY ?? 0;
    next.onload = () => {
      const win = next.contentWindow!;
      if (!loadedOnce) scrollTo(win, targetFor(app.selected), false);
      else win.scrollTo({ top: y, behavior: 'instant' });
      loadedOnce = true;
      active = 1 - active;
    };
    next.srcdoc = html;
  }

  // re-render on any content change (debounced)
  $effect(() => {
    const json = JSON.stringify(app.site);
    void uploads.size;
    void frames.length;
    clearTimeout(timer);
    timer = setTimeout(() => load(json), loadedOnce ? 250 : 0);
    return () => clearTimeout(timer);
  });

  // a different panel was selected, or the device width changed → bring that part of the page into view
  $effect(() => {
    void app.scrollRequest;
    void app.device;
    const win = frames[active]?.contentWindow;
    if (win && loadedOnce) scrollTo(win, targetFor(app.selected), true);
  });
</script>

<div class="stage" bind:clientWidth={cw} bind:clientHeight={ch}>
  <div class="device" class:framed={app.device !== 'desktop'} style:width="{width * scale}px" style:height="{height * scale}px">
    {#each [0, 1] as i}
      <iframe
        bind:this={frames[i]}
        title="Live preview"
        class:active={active === i}
        style:width="{width}px"
        style:height="{height}px"
        style:transform="scale({scale})"
      ></iframe>
    {/each}
  </div>
  <p class="caption">{width}px · {Math.round(scale * 100)}%{app.device === 'mobile' ? ` · ${app.site?.settings.mobileVariant === 'cinematic' ? 'Cinematic' : 'Classic'} mobile layout` : ''}</p>
</div>

<style>
  .stage { position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 16px 16px 0; overflow: hidden; }
  .device { position: relative; flex: none; background: #050507; box-shadow: 0 10px 40px rgba(0, 0, 0, .5); }
  .device.framed { border-radius: 14px; overflow: hidden; outline: 6px solid #1f1c2c; }
  iframe { position: absolute; top: 0; left: 0; border: 0; transform-origin: 0 0; background: #050507; visibility: hidden; }
  iframe.active { visibility: visible; }
  .caption { position: absolute; bottom: 6px; right: 14px; font-size: 11px; color: var(--muted); background: rgba(11, 10, 18, .8); padding: 2px 8px; border-radius: 10px; }
</style>

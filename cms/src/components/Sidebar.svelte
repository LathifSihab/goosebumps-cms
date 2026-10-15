<script lang="ts">
  import { app, missingTranslations, select } from '../lib/state.svelte.ts';
  import { PANELS, getPath } from '../lib/fields.ts';
  import { SECTION_TYPE_NAMES, emptyL10n, newId, type PhotoQuoteSection, type Section } from '../lib/schema.ts';

  const site = $derived(app.site!);
  let dragFrom = $state<number | null>(null);
  let dragOver = $state<number | null>(null);

  const TOP = ['hero', 'marquee'];
  const SITE = ['navCta', 'contactInfo', 'brand', 'seo', 'footer', 'legal'];
  const panel = (id: string) => PANELS.find((p) => p.id === id)!;

  function sectionName(s: Section): string {
    if (s.type === 'photoQuote') {
      const q = s.heading.en.replace(/[*“”"]/g, '').split('\n')[0].trim();
      return q ? `Quote: ${q.slice(0, 22)}${q.length > 22 ? '…' : ''}` : 'Photo quote';
    }
    return SECTION_TYPE_NAMES[s.type];
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= site.sections.length || from === to) return;
    const [s] = site.sections.splice(from, 1);
    site.sections.splice(to, 0, s);
    select(s.id);
  }

  function addQuote() {
    const used = site.sections.find((s) => s.type === 'photoQuote') as PhotoQuoteSection | undefined;
    const sec: PhotoQuoteSection = {
      id: 'quote-' + newId(), type: 'photoQuote', visible: true, nav: { show: false, label: emptyL10n('Quote') },
      heading: emptyL10n('“A new quote”'), sub: emptyL10n('Goosebumps · Europe'),
      image: used ? { ...used.image, alt: '' } : { src: site.hero.background.src, alt: '' },
    };
    const gallery = site.sections.findIndex((s) => s.type === 'gallery');
    site.sections.splice(gallery >= 0 ? gallery : site.sections.length, 0, sec);
    select(sec.id);
  }
</script>

{#snippet item(id: string, name: string, count: number)}
  <button type="button" class="nav-item" class:on={app.selected === id} onclick={() => select(id)}>
    <span class="name">{name}</span>
    {#if count}<span class="badge" title="{count} text(s) missing French or Dutch">{count}</span>{/if}
  </button>
{/snippet}

<nav class="sidebar" aria-label="Page structure">
  <h3>Top of page</h3>
  {#each TOP as id}{@render item(id, panel(id).name, missingTranslations(getPath(site, panel(id).countPath ?? panel(id).path)))}{/each}

  <h3>Sections <span class="hint">drag to reorder</span></h3>
  <ol>
    {#each site.sections as s, i (s.id)}
      <li
        class:hidden={!s.visible}
        class:over={dragOver === i && dragFrom !== i}
        draggable="true"
        ondragstart={(e) => { dragFrom = i; e.dataTransfer!.effectAllowed = 'move'; }}
        ondragover={(e) => { e.preventDefault(); dragOver = i; }}
        ondragleave={() => { if (dragOver === i) dragOver = null; }}
        ondrop={(e) => { e.preventDefault(); if (dragFrom !== null) move(dragFrom, i); dragFrom = dragOver = null; }}
        ondragend={() => (dragFrom = dragOver = null)}
      >
        <span class="grip" aria-hidden="true">⋮⋮</span>
        {@render item(s.id, sectionName(s), missingTranslations(s))}
        <button type="button" class="eye" onclick={() => (s.visible = !s.visible)}
          aria-label={s.visible ? `Hide ${sectionName(s)}` : `Show ${sectionName(s)}`} title={s.visible ? 'Visible — click to hide' : 'Hidden — click to show'}>
          {#if s.visible}
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          {:else}
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
          {/if}
        </button>
      </li>
    {/each}
  </ol>
  <button type="button" class="btn small add" onclick={addQuote}>+ Add photo quote</button>

  <h3>Site</h3>
  {@render item('layout', 'Layout & mobile', 0)}
  {#each SITE as id}{@render item(id, panel(id).name, missingTranslations(getPath(site, panel(id).countPath ?? panel(id).path)))}{/each}
</nav>

<style>
  .sidebar { padding: 14px 10px 24px; display: flex; flex-direction: column; gap: 2px; }
  h3 { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin: 16px 8px 6px; font-weight: 600; }
  h3:first-child { margin-top: 0; }
  .hint { text-transform: none; letter-spacing: 0; font-weight: 400; opacity: .7; margin-left: 4px; }
  ol { list-style: none; display: flex; flex-direction: column; gap: 2px; }
  li { display: flex; align-items: center; border-radius: var(--radius); border: 1px solid transparent; }
  li.over { border-color: var(--accent); }
  li.hidden .name { opacity: .45; text-decoration: line-through; }
  .grip { cursor: grab; color: var(--muted); font-size: 12px; letter-spacing: -2px; padding: 0 2px 0 6px; user-select: none; }
  .nav-item {
    flex: 1; min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 6px;
    background: none; border: 0; border-radius: var(--radius); padding: 7px 8px; text-align: left; color: var(--text);
  }
  .nav-item:hover { background: rgba(123, 108, 196, .08); }
  .nav-item.on { background: rgba(123, 108, 196, .2); }
  .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .eye { background: none; border: 0; color: var(--muted); padding: 6px; border-radius: var(--radius); display: grid; }
  .eye:hover { color: var(--text); background: rgba(123, 108, 196, .1); }
  .add { margin: 8px 8px 0; align-self: flex-start; }
</style>

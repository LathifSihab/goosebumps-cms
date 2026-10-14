<script lang="ts">
  import Login from './components/Login.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Editor from './components/Editor.svelte';
  import Preview from './components/Preview.svelte';
  import LayoutPanel from './components/LayoutPanel.svelte';
  import { getToken, logout } from './lib/api.ts';
  import { NAV_FIELDS, PANELS, SECTION_FIELDS, getPath } from './lib/fields.ts';
  import { LANGS, SECTION_TYPE_NAMES } from './lib/schema.ts';
  import {
    app, discardChanges, discardDraft, isDirty, loadSite, persistDraft, publishSite, restoreDraft, select, type Device,
  } from './lib/state.svelte.ts';

  let authed = $state(!!getToken());
  let loadError = $state('');
  const dirty = $derived(isDirty());

  const section = $derived(app.site?.sections.find((s) => s.id === app.selected));
  const panel = $derived(PANELS.find((p) => p.id === app.selected));

  async function start() {
    loadError = '';
    try {
      await loadSite();
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) authed = false;
      else loadError = err.message;
    }
  }

  $effect(() => {
    if (authed && !app.site) start();
  });

  // autosave the draft (incl. unpublished images) so a reload or closed tab loses nothing
  let saveTimer: ReturnType<typeof setTimeout>;
  $effect(() => {
    void JSON.stringify(app.site);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistDraft, 800);
  });

  $effect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (isDirty()) e.preventDefault(); };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  });

  function removeSection() {
    if (!section || section.type !== 'photoQuote' || !confirm('Delete this photo quote?')) return;
    const s = app.site!.sections;
    s.splice(s.indexOf(section), 1);
    select('hero');
  }

  function signOut() {
    if (dirty && !confirm('You have unpublished changes. They are kept as a draft on this computer. Sign out?')) return;
    logout();
    authed = false;
    app.site = null;
  }

  const DEVICES: { id: Device; label: string }[] = [
    { id: 'desktop', label: 'Desktop' }, { id: 'tablet', label: 'Tablet' }, { id: 'mobile', label: 'Mobile' },
  ];
</script>

{#if !authed}
  <Login onlogin={() => (authed = true)} />
{:else if !app.site}
  <div class="center">
    {#if loadError}
      <p>Could not load the site content: {loadError}</p>
      <button class="btn" onclick={start}>Try again</button>
    {:else}
      <p>Loading content…</p>
    {/if}
  </div>
{:else}
  <div class="shell">
    <header class="topbar">
      <div class="brand">Goosebumps <span>CMS</span></div>
      <div class="group">
        <span class="lbl">Editing</span>
        <div class="seg" role="group" aria-label="Editing language">
          {#each LANGS as l}
            <button type="button" aria-pressed={app.lang === l} onclick={() => (app.lang = l)}>{l.toUpperCase()}</button>
          {/each}
        </div>
      </div>
      <div class="group">
        <span class="lbl">Preview</span>
        <div class="seg" role="group" aria-label="Preview device">
          {#each DEVICES as d}
            <button type="button" aria-pressed={app.device === d.id} onclick={() => (app.device = d.id)}>{d.label}</button>
          {/each}
        </div>
      </div>
      <div class="spacer"></div>
      {#if dirty}<span class="state">Unpublished changes</span>{/if}
      <button class="btn" onclick={discardChanges} disabled={!dirty || app.publishing}>Discard</button>
      <button class="btn primary" onclick={() => publishSite()} disabled={!dirty || app.publishing}>
        {app.publishing ? 'Publishing…' : 'Publish'}
      </button>
      <button class="btn icon" onclick={signOut} title="Sign out" aria-label="Sign out">⎋</button>
    </header>

    {#if app.pendingDraft}
      <div class="banner info">
        You have unpublished changes from {new Date(app.pendingDraft.savedAt).toLocaleString()}.
        <button class="btn small" onclick={restoreDraft}>Restore them</button>
        <button class="btn small" onclick={discardDraft}>Discard</button>
      </div>
    {/if}
    {#if app.message}
      <div class="banner {app.message.kind}" role="status">
        {app.message.text}
        {#if app.message.kind === 'error' && app.message.text.includes('Publish anyway')}
          <button class="btn small danger" onclick={() => publishSite(true)}>Publish anyway</button>
        {/if}
        <button class="btn icon small close" onclick={() => (app.message = null)} aria-label="Dismiss">×</button>
      </div>
    {/if}

    <div class="main">
      <aside class="side"><Sidebar /></aside>

      <section class="editor">
        {#if section}
          <header>
            <h2>{SECTION_TYPE_NAMES[section.type]}</h2>
            {#if section.type === 'photoQuote'}<button class="btn small danger" onclick={removeSection}>Delete</button>{/if}
          </header>
          <label class="toggle"><input type="checkbox" bind:checked={section.visible} /> Show this section on the page</label>
          {#if section.type !== 'photoQuote' && section.type !== 'contact'}
            <details class="navbox">
              <summary>Menu link {section.nav.show ? '· shown' : '· hidden'}</summary>
              <Editor obj={section.nav} fields={NAV_FIELDS} />
            </details>
          {/if}
          {#key section.id}<Editor obj={section} fields={SECTION_FIELDS[section.type]} />{/key}
        {:else if app.selected === 'layout'}
          <header><h2>Layout & mobile</h2></header>
          <LayoutPanel />
        {:else if panel}
          <header><h2>{panel.name}</h2></header>
          {#if panel.desc}<p class="desc">{panel.desc}</p>{/if}
          {#key panel.id}<Editor obj={getPath(app.site, panel.path)} fields={panel.fields} />{/key}
        {/if}
      </section>

      <section class="preview"><Preview /></section>
    </div>
  </div>
{/if}

<style>
  .center { height: 100%; display: grid; place-content: center; gap: 12px; color: var(--muted); text-align: center; }
  .shell { height: 100%; display: flex; flex-direction: column; }
  .topbar {
    display: flex; align-items: center; gap: 14px; padding: 0 14px; height: 52px; flex: none;
    border-bottom: 1px solid var(--line); background: var(--panel);
  }
  .brand { font-weight: 700; letter-spacing: .02em; margin-right: 8px; }
  .brand span { color: var(--accent); font-weight: 500; }
  .group { display: flex; align-items: center; gap: 8px; }
  .lbl { font-size: 12px; color: var(--muted); }
  .spacer { flex: 1; }
  .state { font-size: 12px; color: var(--warn); }

  .banner { display: flex; align-items: center; gap: 10px; padding: 8px 14px; font-size: 13px; border-bottom: 1px solid var(--line); flex: none; }
  .banner.info { background: rgba(123, 108, 196, .12); }
  .banner.ok { background: rgba(63, 182, 122, .14); color: #a6ecc6; }
  .banner.error { background: rgba(224, 96, 90, .14); color: #ffc4c0; }
  .banner .close { margin-left: auto; border: 0; }

  .main { flex: 1; min-height: 0; display: grid; grid-template-columns: 240px 400px 1fr; }
  .side, .editor { overflow-y: auto; border-right: 1px solid var(--line); }
  .side { background: var(--panel); }
  .editor { padding: 18px 18px 40px; background: var(--panel); }
  .editor header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .editor h2 { font-size: 17px; font-weight: 600; }
  .desc { color: var(--muted); margin: -4px 0 16px; font-size: 13px; }
  .toggle { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer; }
  .toggle input { width: 16px; height: 16px; accent-color: var(--accent); }
  .navbox { border: 1px solid var(--line); border-radius: var(--radius); padding: 8px 12px; margin-bottom: 18px; }
  .navbox summary { cursor: pointer; font-size: 13px; color: var(--muted); }
  .navbox[open] summary { margin-bottom: 12px; }
  .preview { min-width: 0; background: #08070d; }

  @media (max-width: 1100px) {
    .main { grid-template-columns: 200px 340px 1fr; }
    .lbl { display: none; }
  }
</style>

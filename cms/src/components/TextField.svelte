<script lang="ts">
  import { app } from '../lib/state.svelte.ts';
  import { getPath, type Field } from '../lib/fields.ts';
  import type { L10n } from '../lib/schema.ts';

  let { obj, field }: { obj: any; field: Extract<Field, { kind: 'text' }> } = $props();

  const value = $derived(getPath(obj, field.key) as L10n);
  const id = `f-${Math.random().toString(36).slice(2, 8)}`;
  const missing = $derived(app.lang !== 'en' && !!value.en.trim() && !value[app.lang].trim());
  const multiline = $derived(field.multiline || value.en.length > 70 || value.en.includes('\n'));
</script>

<div class="field">
  <label class="label" for={id}>
    {field.label}
    <span class="lang">{app.lang.toUpperCase()}</span>
    {#if missing}<span class="badge">missing</span>{/if}
  </label>
  {#if multiline}
    <textarea {id} class="input" rows={Math.min(8, Math.max(2, Math.ceil(value.en.length / 52)))}
      bind:value={value[app.lang]} placeholder={app.lang === 'en' ? '' : 'Falls back to English'}></textarea>
  {:else}
    <input {id} class="input" bind:value={value[app.lang]} placeholder={app.lang === 'en' ? '' : 'Falls back to English'} />
  {/if}
  {#if app.lang !== 'en' && value.en}
    <p class="ref"><span>EN</span>{value.en}</p>
  {/if}
  {#if field.help}<p class="help">{field.help}</p>{/if}
</div>

<style>
  .field { margin-bottom: 16px; }
  .lang { font-size: 10px; font-weight: 700; color: var(--accent); margin-left: 4px; }
  .label .badge { margin-left: 6px; }
  .ref { font-size: 12px; color: var(--muted); margin-top: 4px; white-space: pre-line; }
  .ref span { font-size: 10px; font-weight: 700; margin-right: 6px; opacity: .7; }
</style>

<script lang="ts">
  import Editor from './Editor.svelte';
  import { addUpload, flash, thumbSrc } from '../lib/state.svelte.ts';
  import { processImage } from '../lib/image.ts';
  import type { Field } from '../lib/fields.ts';

  let { obj, field }: { obj: any; field: Extract<Field, { kind: 'list' }> } = $props();

  const items = $derived(obj[field.key] as any[]);
  let open = $state<string | null>(null);
  let dragFrom = $state<number | null>(null);
  let dragOver = $state<number | null>(null);
  let busy = $state(0);
  let fileInput = $state<HTMLInputElement>();

  function add() {
    if (field.fromImage) return fileInput?.click();
    const item = field.make!();
    items.push(item);
    open = item.id;
  }

  async function onFiles(e: Event) {
    const files = Array.from((e.currentTarget as HTMLInputElement).files ?? []);
    if (fileInput) fileInput.value = '';
    busy = files.length;
    for (const file of files) {
      try {
        const out = await processImage(file, field.fromImage!.size);
        addUpload(out.main.path, out.main.blob);
        if (out.webp) addUpload(out.webp.path, out.webp.blob);
        items.push(field.fromImage!.make({ src: out.main.path, webp: out.webp?.path, alt: '' }));
      } catch (err) {
        flash('error', (err as Error).message);
      }
      busy--;
    }
  }

  function remove(i: number) {
    if (field.min && items.length <= field.min) return;
    if (!confirm(`Remove this ${field.itemName}?`)) return;
    items.splice(i, 1);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return;
    const [it] = items.splice(from, 1);
    items.splice(to, 0, it);
  }
</script>

<div class="list">
  <div class="head">
    <span class="label">{field.label} <span class="count">{items.length}</span></span>
    <button type="button" class="btn small" onclick={add} disabled={busy > 0}>
      {busy ? `Optimising ${busy}…` : `+ Add ${field.itemName}${field.fromImage?.multiple ? 's' : ''}`}
    </button>
  </div>

  <ol class:grid={!!field.fromImage}>
    {#each items as item, i (item.id)}
      <li
        class:over={dragOver === i && dragFrom !== i}
        draggable="true"
        ondragstart={(e) => { dragFrom = i; e.dataTransfer!.effectAllowed = 'move'; }}
        ondragover={(e) => { e.preventDefault(); dragOver = i; }}
        ondragleave={() => { if (dragOver === i) dragOver = null; }}
        ondrop={(e) => { e.preventDefault(); if (dragFrom !== null) move(dragFrom, i); dragFrom = dragOver = null; }}
        ondragend={() => (dragFrom = dragOver = null)}
      >
        {#if field.fromImage}
          <button type="button" class="tile" onclick={() => (open = open === item.id ? null : item.id)} title="Edit description">
            <img src={thumbSrc(item.src)} alt={item.alt} loading="lazy" />
            {#if !item.alt}<span class="noalt" title="No description">!</span>{/if}
          </button>
          <div class="tile-actions">
            <button type="button" class="btn icon small" onclick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier">‹</button>
            <button type="button" class="btn icon small" onclick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move later">›</button>
            <button type="button" class="btn icon small danger" onclick={() => remove(i)} aria-label="Remove">×</button>
          </div>
        {:else}
          <div class="item-head">
            <span class="grip" aria-hidden="true">⋮⋮</span>
            <button type="button" class="title" onclick={() => (open = open === item.id ? null : item.id)} aria-expanded={open === item.id}>
              {field.title(item, i)}
            </button>
            <button type="button" class="btn icon small" onclick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">↑</button>
            <button type="button" class="btn icon small" onclick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
            <button type="button" class="btn icon small danger" onclick={() => remove(i)} disabled={!!field.min && items.length <= field.min} aria-label="Remove">×</button>
          </div>
        {/if}
        {#if open === item.id}
          <div class="body"><Editor obj={item} fields={field.fields} /></div>
        {/if}
      </li>
    {/each}
  </ol>
  {#if field.fromImage}
    <p class="help">Drag photos to reorder · click a photo to add its description · photos are resized and converted to WebP automatically.</p>
    <input bind:this={fileInput} type="file" accept="image/*" multiple={field.fromImage.multiple} class="sr-only" onchange={onFiles} />
  {/if}
</div>

<style>
  .list { margin-bottom: 20px; }
  .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .head .label { margin: 0; }
  .count { color: var(--accent); margin-left: 4px; }
  ol { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  li { border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel-2); }
  li.over { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .item-head { display: flex; align-items: center; gap: 4px; padding: 4px 6px 4px 4px; }
  .grip { cursor: grab; color: var(--muted); padding: 0 4px; letter-spacing: -2px; user-select: none; }
  .title { flex: 1; min-width: 0; text-align: left; background: none; border: 0; padding: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .body { padding: 12px; border-top: 1px solid var(--line); }

  ol.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  ol.grid li { position: relative; cursor: grab; }
  ol.grid li:has(.body) { grid-column: 1 / -1; }
  .tile { display: block; width: 100%; aspect-ratio: 4 / 3; padding: 0; border: 0; background: var(--bg); border-radius: var(--radius) var(--radius) 0 0; overflow: hidden; position: relative; }
  .tile img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
  ol.grid li:has(.body) .tile { aspect-ratio: 16 / 7; }
  .noalt { position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; border-radius: 50%; background: var(--warn); color: #000; font-size: 12px; font-weight: 700; display: grid; place-items: center; }
  .tile-actions { display: flex; justify-content: center; gap: 4px; padding: 4px; }
</style>

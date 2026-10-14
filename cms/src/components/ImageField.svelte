<script lang="ts">
  import { addUpload, flash, thumbSrc } from '../lib/state.svelte.ts';
  import { processImage } from '../lib/image.ts';
  import type { Field } from '../lib/fields.ts';
  import type { ImageRef } from '../lib/schema.ts';

  let { obj, field }: { obj: any; field: Extract<Field, { kind: 'image' | 'imagePath' }> } = $props();

  const isPath = $derived(field.kind === 'imagePath');
  const ref = $derived((isPath ? null : field.key ? obj[field.key] : obj) as ImageRef | null);
  const src = $derived(isPath ? (obj[field.key] as string) : (ref?.src ?? ''));
  let busy = $state(false);
  let input: HTMLInputElement;

  async function onPick(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    busy = true;
    try {
      const out = await processImage(file, field.size);
      addUpload(out.main.path, out.main.blob);
      if (isPath) {
        obj[field.key] = out.main.path;
      } else if (ref) {
        ref.src = out.main.path;
        if (out.webp) {
          addUpload(out.webp.path, out.webp.blob);
          ref.webp = out.webp.path;
        } else {
          delete ref.webp;
        }
      }
    } catch (err) {
      flash('error', (err as Error).message);
    } finally {
      busy = false;
      input.value = '';
    }
  }
</script>

<div class="field">
  <span class="label">{field.label}</span>
  <div class="row">
    <button type="button" class="thumb" onclick={() => input.click()} title="Replace image" disabled={busy}>
      {#if src}<img src={thumbSrc(src)} alt="" />{:else}<span>No image</span>{/if}
      {#if busy}<span class="busy">Optimising…</span>{/if}
    </button>
    <div class="side">
      <button type="button" class="btn small" onclick={() => input.click()} disabled={busy}>{src ? 'Replace…' : 'Upload…'}</button>
      {#if ref && field.kind === 'image' && !field.noAlt}
        <input class="input alt" bind:value={ref.alt} placeholder="Describe the photo (for Google & accessibility)" aria-label="Image description" />
      {/if}
    </div>
  </div>
  {#if field.help}<p class="help">{field.help}</p>{/if}
  <input bind:this={input} type="file" accept="image/*" class="sr-only" onchange={onPick} />
</div>

<style>
  .field { margin-bottom: 16px; }
  .row { display: flex; gap: 10px; align-items: flex-start; }
  .thumb {
    position: relative; flex: 0 0 96px; height: 72px; border-radius: var(--radius); overflow: hidden;
    border: 1px solid var(--line); background: var(--bg); padding: 0; color: var(--muted); font-size: 11px;
  }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .busy { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(11, 10, 18, .8); color: var(--text); }
  .side { flex: 1; display: flex; flex-direction: column; gap: 6px; align-items: flex-start; min-width: 0; }
  .alt { font-size: 12px; padding: 6px 8px; }
</style>

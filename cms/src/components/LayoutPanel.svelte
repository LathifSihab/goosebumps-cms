<script lang="ts">
  import { app } from '../lib/state.svelte.ts';
  import type { MobileVariant } from '../lib/schema.ts';

  const VARIANTS: { id: MobileVariant; name: string; desc: string }[] = [
    { id: 'classic', name: 'Classic', desc: 'Centred hero over the background, sections stacked in a single column.' },
    { id: 'cinematic', name: 'Cinematic', desc: 'The desktop feature photo fills the phone screen behind left-aligned text. How We Work, Services and Team become swipeable cards.' },
  ];

  function choose(id: MobileVariant) {
    app.site!.settings.mobileVariant = id;
    app.device = 'mobile';
  }
</script>

<p class="intro">Desktop always uses the same layout. Choose how the site looks on phones — the preview switches to mobile so you can compare.</p>

<div class="cards" role="radiogroup" aria-label="Mobile layout">
  {#each VARIANTS as v}
    <button type="button" role="radio" aria-checked={app.site!.settings.mobileVariant === v.id} class="card" onclick={() => choose(v.id)}>
      <span class="dot"></span>
      <strong>{v.name}</strong>
      <span>{v.desc}</span>
    </button>
  {/each}
</div>

<p class="help">Section order and visibility are changed in the sidebar: drag sections to reorder them, use the eye icon to hide one.</p>

<style>
  .intro { color: var(--muted); margin-bottom: 14px; }
  .cards { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
  .card {
    display: grid; grid-template-columns: 18px 1fr; gap: 2px 10px; text-align: left; padding: 12px;
    border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel-2);
  }
  .card > span:last-child { grid-column: 2; color: var(--muted); font-size: 13px; }
  .card[aria-checked='true'] { border-color: var(--accent); background: rgba(123, 108, 196, .12); }
  .dot { width: 14px; height: 14px; margin-top: 3px; border-radius: 50%; border: 2px solid var(--line-strong); }
  .card[aria-checked='true'] .dot { border-color: var(--accent); background: radial-gradient(var(--accent) 45%, transparent 50%); }
</style>

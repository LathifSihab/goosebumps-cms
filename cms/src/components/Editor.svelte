<script lang="ts">
  import TextField from './TextField.svelte';
  import ImageField from './ImageField.svelte';
  import ListField from './ListField.svelte';
  import type { Field } from '../lib/fields.ts';

  let { obj, fields }: { obj: any; fields: Field[] } = $props();
  const uid = Math.random().toString(36).slice(2, 8);
</script>

{#each fields as field (field.key + field.label)}
  {#if field.kind === 'text'}
    <TextField {obj} {field} />
  {:else if field.kind === 'image' || field.kind === 'imagePath'}
    <ImageField {obj} {field} />
  {:else if field.kind === 'list'}
    <ListField {obj} {field} />
  {:else if field.kind === 'toggle'}
    <label class="toggle">
      <input type="checkbox" bind:checked={obj[field.key]} />
      <span>{field.label}</span>
    </label>
  {:else if field.kind === 'plain'}
    <div class="field">
      <label class="label" for="{uid}-{field.key}">{field.label}</label>
      <input id="{uid}-{field.key}" class="input" type={field.type ?? 'text'} bind:value={obj[field.key]} />
      {#if field.help}<p class="help">{field.help}</p>{/if}
    </div>
  {/if}
{/each}

<style>
  .field { margin-bottom: 16px; }
  .toggle { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; cursor: pointer; }
  .toggle input { width: 16px; height: 16px; accent-color: var(--accent); }
</style>

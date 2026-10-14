<script lang="ts">
  import { login } from '../lib/api.ts';

  let { onlogin }: { onlogin: () => void } = $props();
  let password = $state('');
  let error = $state('');
  let busy = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    error = '';
    try {
      await login(password);
      onlogin();
    } catch (err) {
      error = (err as Error).message === 'Unauthorized' ? 'Wrong password.' : (err as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<main>
  <form onsubmit={submit}>
    <img src="../assets/images/logo-loader.png" alt="Goosebumps" />
    <h1>Content manager</h1>
    <label class="label" for="pw">Password</label>
    <!-- svelte-ignore a11y_autofocus -->
    <input id="pw" class="input" type="password" bind:value={password} autocomplete="current-password" autofocus required />
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <button class="btn primary" disabled={busy || !password}>{busy ? 'Signing in…' : 'Sign in'}</button>
    {#if import.meta.env.DEV}<p class="help">Dev mode: any password works and publishing writes to your local checkout.</p>{/if}
  </form>
</main>

<style>
  main { min-height: 100%; display: grid; place-items: center; padding: 24px;
    background: radial-gradient(ellipse at top, rgba(85, 69, 165, .25), transparent 60%), var(--bg); }
  form { width: 100%; max-width: 340px; display: flex; flex-direction: column; gap: 10px;
    padding: 28px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); }
  img { width: 160px; align-self: center; margin-bottom: 4px; }
  h1 { font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 8px; }
  .label { margin: 0; }
  .btn { height: 38px; margin-top: 4px; }
  .err { color: var(--err); font-size: 13px; }
</style>

/* Unpublished work survives a reload: the draft site.json plus not-yet-uploaded images
   are kept in IndexedDB (images are Blobs, too big for localStorage). */

import type { Site } from './schema.ts';

export type Draft = { site: Site; baseSha: string; savedAt: number; uploads: Record<string, Blob> };

const DB = 'gbcms', STORE = 'drafts', KEY = 'current';

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const r = fn(db.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function saveDraft(d: Draft): Promise<void> {
  try { await tx('readwrite', (s) => s.put(d, KEY)); } catch { /* private mode: drafts just don't persist */ }
}

export async function loadDraft(): Promise<Draft | null> {
  try { return (await tx<Draft | undefined>('readonly', (s) => s.get(KEY))) ?? null; } catch { return null; }
}

export async function clearDraft(): Promise<void> {
  try { await tx('readwrite', (s) => s.delete(KEY)); } catch { /* ignore */ }
}

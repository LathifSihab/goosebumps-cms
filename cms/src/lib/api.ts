/* Talks to the Worker API (worker/index.js), same origin as the CMS. In `npm run dev` the
   Vite dev server answers the same routes under /__dev and writes to the local checkout instead. */

import type { Site } from './schema.ts';

const BASE = import.meta.env.DEV ? '/__dev' : '/api';
const TOKEN_KEY = 'gbcms-token';

export type PublishFile = { path: string; b64: string };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(init.headers ?? {}),
    },
  });
  let body: { error?: string } & Record<string, unknown> = {};
  try { body = await res.json(); } catch { /* empty body */ }
  if (res.status === 401) clearToken();
  if (!res.ok) throw new ApiError(body.error || `Request failed (${res.status})`, res.status);
  return body as T;
}

export function getToken(): string {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return '';
    const { token, expires } = JSON.parse(raw) as { token: string; expires: number };
    return expires > Date.now() ? token : '';
  } catch {
    return '';
  }
}

function clearToken() {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
}

export async function login(password: string): Promise<void> {
  const r = await call<{ token: string; expires: number }>('/login', { method: 'POST', body: JSON.stringify({ password }) });
  try { sessionStorage.setItem(TOKEN_KEY, JSON.stringify(r)); } catch { /* storage blocked */ }
}

export function logout() {
  clearToken();
}

/** Latest site.json straight from the repository, plus its blob sha (used to detect concurrent edits). */
export function loadContent(): Promise<{ site: Site; sha: string }> {
  return call('/content');
}

/** Commits all files in one commit. Fails with 409 if site.json changed since `baseSha`. */
export function publish(files: PublishFile[], baseSha: string): Promise<{ sha: string }> {
  return call('/publish', { method: 'POST', body: JSON.stringify({ files, baseSha }) });
}

/* ── base64 helpers ── */

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export const textToB64 = (s: string) => bytesToB64(new TextEncoder().encode(s));
export const blobToB64 = async (b: Blob) => bytesToB64(new Uint8Array(await b.arrayBuffer()));

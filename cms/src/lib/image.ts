/* Browser-side image optimisation for uploads: resize to a sensible max width and encode
   a JPG (universal fallback) plus a WebP (served via <picture> / image-set). */

export type ProcessedImage = {
  /** Fallback file — JPG, or PNG when `keepPng` and the source is a PNG (e.g. a transparent logo). */
  main: { path: string; blob: Blob };
  webp?: { path: string; blob: Blob };
};

export type ImageKind = 'hero' | 'large' | 'medium' | 'logo';

const MAX_WIDTH: Record<ImageKind, number> = { hero: 2400, large: 1800, medium: 1200, logo: 800 };

function slug(name: string): string {
  return name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'image';
}

async function shortHash(blob: Blob): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()));
  return Array.from(d.slice(0, 4), (b) => b.toString(16).padStart(2, '0')).join('');
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((res) => canvas.toBlob(res, type, quality));
}

export async function processImage(file: File, kind: ImageKind): Promise<ProcessedImage> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image`);
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_WIDTH[kind] / bmp.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext('2d')!;
  const png = kind === 'logo' && file.type === 'image/png';
  if (!png) {
    ctx.fillStyle = '#050507'; // flatten transparency onto the site background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();

  const main = await toBlob(canvas, png ? 'image/png' : 'image/jpeg', 0.85);
  if (!main) throw new Error(`Could not encode ${file.name}`);
  const base = `assets/images/uploads/${slug(file.name)}-${await shortHash(main)}`;
  const out: ProcessedImage = { main: { path: `${base}.${png ? 'png' : 'jpg'}`, blob: main } };

  if (kind !== 'logo') {
    const webp = await toBlob(canvas, 'image/webp', 0.82);
    // browsers without a WebP encoder silently return PNG — skip those
    if (webp && webp.type === 'image/webp' && webp.size < main.size) out.webp = { path: `${base}.webp`, blob: webp };
  }
  return out;
}

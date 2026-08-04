import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import { env } from '../config.js';

const mediaDirectory = resolve(env.MEDIA_CACHE_DIR, 'posts');
const maxImageBytes = 15 * 1024 * 1024;
const imageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);
const pending = new Map<number, Promise<CachedImage>>();

export type CachedImage = { path: string; contentType: string };

export function isAllowedInstagramMediaUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname.endsWith('.cdninstagram.com') || url.hostname.endsWith('.fbcdn.net'));
  } catch {
    return false;
  }
}

async function existingImage(postId: number): Promise<CachedImage | null> {
  for (const [contentType, extension] of imageTypes) {
    const path = join(mediaDirectory, `${postId}.${extension}`);
    try {
      await access(path);
      return { path, contentType };
    } catch {
      // Procura o próximo formato suportado.
    }
  }
  return null;
}

async function downloadImage(postId: number, sourceUrl: string): Promise<CachedImage> {
  const cached = await existingImage(postId);
  if (cached) return cached;
  if (!isAllowedInstagramMediaUrl(sourceUrl)) throw Object.assign(new Error('Origem de imagem inválida.'), { status: 400 });

  const response = await fetch(sourceUrl, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; StudekAnalytics/1.0)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok || !isAllowedInstagramMediaUrl(response.url)) throw Object.assign(new Error('Imagem indisponível na origem.'), { status: 404 });
  const contentType = String(response.headers.get('content-type') || '').split(';')[0].toLowerCase();
  const extension = imageTypes.get(contentType);
  if (!extension) throw Object.assign(new Error('Formato de imagem não suportado.'), { status: 415 });
  const declaredSize = Number(response.headers.get('content-length') || 0);
  if (declaredSize > maxImageBytes) throw Object.assign(new Error('Imagem excede o tamanho permitido.'), { status: 413 });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > maxImageBytes) throw Object.assign(new Error('Imagem inválida ou muito grande.'), { status: 413 });

  await mkdir(mediaDirectory, { recursive: true });
  const path = join(mediaDirectory, `${postId}.${extension}`);
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, bytes, { flag: 'wx' });
  try {
    await rename(temporaryPath, path);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    const winner = await existingImage(postId);
    if (winner) return winner;
    throw error;
  }
  return { path, contentType };
}

export async function cachedPostImage(postId: number, sourceUrl: string) {
  const cached = await existingImage(postId);
  if (cached) return cached;
  const active = pending.get(postId);
  if (active) return active;
  const task = downloadImage(postId, sourceUrl).finally(() => pending.delete(postId));
  pending.set(postId, task);
  return task;
}

export async function readCachedImage(image: CachedImage) {
  return readFile(image.path);
}

export async function cachePostImages(images: Array<{ postId: number; sourceUrl: string }>, concurrency = 4) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, images.length) }, async () => {
    while (cursor < images.length) {
      const image = images[cursor++];
      try {
        await cachedPostImage(image.postId, image.sourceUrl);
      } catch (error) {
        console.warn(`Não foi possível armazenar a miniatura da publicação ${image.postId}:`, error instanceof Error ? error.message : error);
      }
    }
  });
  await Promise.all(workers);
}

import * as THREE from 'three';

/**
 * Runtime-generated CanvasTextures (no binary assets to download).
 * Each getter returns a cached singleton so textures are created once per session.
 * Callers that need different repeat/offset values should `.clone()` the texture
 * (clones share the same GPU image).
 */

const cache = new Map<string, THREE.Texture>();

/** Small deterministic PRNG (mulberry32) so textures look identical for every peer. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return [canvas, ctx];
}

function finalize(
  key: string,
  canvas: HTMLCanvasElement,
  opts: { srgb?: boolean; repeat?: boolean } = {}
): THREE.Texture {
  const tex = new THREE.CanvasTexture(canvas);
  if (opts.srgb !== false) tex.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat !== false) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

/** Speckled aggregate noise; tileable because specks wrap around the edges. */
function speckle(
  ctx: CanvasRenderingContext2D,
  size: number,
  rng: () => number,
  count: number,
  colors: string[],
  minR: number,
  maxR: number
): void {
  for (let i = 0; i < count; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = minR + rng() * (maxR - minR);
    ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        ctx.beginPath();
        ctx.arc(x + ox * size, y + oy * size, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/** Dark asphalt with aggregate specks and subtle tar patches. 1 tile ≈ 4 m. */
export function getAsphaltTexture(): THREE.Texture {
  const key = 'asphalt';
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = createRng(1337);
  ctx.fillStyle = '#2b2e33';
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.18;
  speckle(ctx, size, rng, 60, ['#1f2125', '#34383e'], 10, 26);
  ctx.globalAlpha = 0.55;
  speckle(ctx, size, rng, 2600, ['#3d4148', '#23252a', '#4a4e55', '#1b1d20'], 0.4, 1.3);
  ctx.globalAlpha = 1;
  return finalize(key, canvas);
}

/** Lush tropical grass with blade strokes and darker clumps. 1 tile ≈ 6 m. */
export function getGrassTexture(): THREE.Texture {
  const key = 'grass';
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = createRng(4242);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  // Texture is near-white so the material color can tint it per biome.
  ctx.globalAlpha = 0.22;
  speckle(ctx, size, rng, 90, ['#c9d4b8', '#e7eedc', '#b9c6a6'], 8, 22);
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 2200; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const len = 2 + rng() * 5;
    const tilt = (rng() - 0.5) * 1.6;
    ctx.strokeStyle = rng() > 0.5 ? '#b5c4a0' : '#f4f8ec';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + tilt, y - len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return finalize(key, canvas);
}

/** Packed dirt / gravel shoulder. Near-white so it can be tinted. */
export function getDirtTexture(): THREE.Texture {
  const key = 'dirt';
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 128;
  const [canvas, ctx] = makeCanvas(size);
  const rng = createRng(777);
  ctx.fillStyle = '#e8e2d8';
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.6;
  speckle(ctx, size, rng, 900, ['#c8bfb0', '#f6f2ea', '#b0a796'], 0.5, 1.8);
  ctx.globalAlpha = 1;
  return finalize(key, canvas);
}

/** Soft circular shadow blob (alpha in the red channel is not needed; uses alphaMap-ready luminance). */
export function getBlobShadowTexture(): THREE.Texture {
  const key = 'blob-shadow';
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 128;
  const [canvas, ctx] = makeCanvas(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.75)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.45)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return finalize(key, canvas, { repeat: false });
}

/** Rippled water tint texture used by canals and rivers. */
export function getWaterTexture(): THREE.Texture {
  const key = 'water';
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 128;
  const [canvas, ctx] = makeCanvas(size);
  const rng = createRng(99);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 160; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const w = 6 + rng() * 18;
    ctx.strokeStyle = rng() > 0.5 ? '#dbeafe' : '#f8fafc';
    ctx.lineWidth = 1;
    for (let ox = -1; ox <= 1; ox++) {
      ctx.beginPath();
      ctx.moveTo(x + ox * size, y);
      ctx.quadraticCurveTo(x + ox * size + w / 2, y - 2, x + ox * size + w, y);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  return finalize(key, canvas);
}

/** Highway sign / gantry board with centred text lines (cached per text). */
export function getSignTexture(
  lines: string[],
  background = '#0f6b3f',
  foreground = '#ffffff',
  aspect = 3
): THREE.Texture {
  const key = `sign:${background}:${foreground}:${aspect}:${lines.join('|')}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const w = 512;
  const h = Math.round(w / aspect);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = foreground;
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.fillStyle = foreground;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.min(54, Math.floor((h - 40) / Math.max(1, lines.length) * 0.62));
  ctx.font = `700 ${fontSize}px "Be Vietnam Pro", "Segoe UI", Arial, sans-serif`;
  lines.forEach((line, i) => {
    const y = h / 2 + (i - (lines.length - 1) / 2) * fontSize * 1.35;
    ctx.fillText(line, w / 2, y, w - 40);
  });
  return finalize(key, canvas, { repeat: false });
}

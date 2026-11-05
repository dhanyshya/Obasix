const MAX_DIMENSION = 1280;

const cache = new Map<string, Promise<string | null>>();

/**
 * Isolate the board from its studio background.
 * Returns a PNG data URL with an alpha channel, cropped to the board,
 * or null when the source cannot be processed (callers must render a
 * neutral placeholder instead of the raw image).
 */
export function isolateBoardImage(src: string | null | undefined): Promise<string | null> {
  if (!src) return Promise.resolve(null);
  const key = src.trim();
  if (!key) return Promise.resolve(null);
  const cached = cache.get(key);
  if (cached) return cached;
  const pending = doIsolate(key).catch(() => null);
  cache.set(key, pending);
  return pending;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load board image"));
    img.src = src;
  });
}

function exportableSrc(src: string): string {
  if (src.startsWith("blob:") || src.startsWith("data:") || src.startsWith("/")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=1920&q=90`;
}

async function tryLoad(src: string): Promise<HTMLImageElement | null> {
  try {
    return await loadImage(exportableSrc(src));
  } catch {
    try {
      return await loadImage(src);
    } catch {
      return null;
    }
  }
}

interface BackgroundModel {
  r: number;
  g: number;
  b: number;
  toleranceSq: number;
}

async function doIsolate(src: string): Promise<string | null> {
  const img = await tryLoad(src);
  if (!img) return null;

  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) return null;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(nw, nh));
  const w = Math.max(2, Math.floor(nw * scale));
  const h = Math.max(2, Math.floor(nh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, w, h);
  } catch {
    return null;
  }

  const original = new Uint8ClampedArray(imageData.data);
  const data = imageData.data;
  const total = w * h;

  const background = detectBackground(data, w, h);
  if (background) {
    const removed = floodClearBackground(data, w, h, background);
    if (removed > total * 0.92) {
      data.set(original);
    } else {
      featherEdges(data, w, h);
    }
  }

  const bounds = alphaBounds(data, w, h, 12);
  if (!bounds || bounds.width < 4 || bounds.height < 4) return null;

  const pad = 2;
  const sx = Math.max(0, bounds.x - pad);
  const sy = Math.max(0, bounds.y - pad);
  const sw = Math.min(w - sx, bounds.width + pad * 2);
  const sh = Math.min(h - sy, bounds.height + pad * 2);

  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  const outCtx = out.getContext("2d");
  if (!outCtx) return null;
  outCtx.putImageData(imageData, -sx, -sy);
  return out.toDataURL("image/png");
}

function detectBackground(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): BackgroundModel | null {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  const add = (index: number) => {
    const a = data[index + 3];
    if (a < 200) return;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  };

  for (let x = 0; x < w; x += 1) {
    add(x * 4);
    add(((h - 1) * w + x) * 4);
  }
  for (let y = 1; y < h - 1; y += 1) {
    add(y * w * 4);
    add((y * w + (w - 1)) * 4);
  }

  const borderTotal = 2 * w + 2 * (h - 2);
  let best: { n: number; r: number; g: number; b: number } | null = null;

  for (const bucket of buckets.values()) {
    const r = bucket.r / bucket.n;
    const g = bucket.g / bucket.n;
    const b = bucket.b / bucket.n;
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const avg = (r + g + b) / 3;
    if (maxC - minC >= 72) continue;
    if (avg < 100) continue;
    if (!best || bucket.n > best.n) best = { n: bucket.n, r, g, b };
  }

  if (!best) return null;
  const coverage = best.n / Math.max(1, borderTotal);
  if (coverage < 0.12) return null;

  const avg = (best.r + best.g + best.b) / 3;
  const tolerance = avg >= 248 ? 5 : 48;
  return { r: best.r, g: best.g, b: best.b, toleranceSq: tolerance * tolerance };
}

function floodClearBackground(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  background: BackgroundModel,
): number {
  const total = w * h;
  const cleared = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const matches = (index: number): boolean => {
    if (data[index + 3] < 200) return true;
    const dr = data[index] - background.r;
    const dg = data[index + 1] - background.g;
    const db = data[index + 2] - background.b;
    return dr * dr + dg * dg + db * db <= background.toleranceSq;
  };

  const seed = (pixel: number) => {
    if (cleared[pixel]) return;
    if (!matches(pixel * 4)) return;
    cleared[pixel] = 1;
    queue[tail] = pixel;
    tail += 1;
  };

  for (let x = 0; x < w; x += 1) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y += 1) {
    seed(y * w);
    seed(y * w + (w - 1));
  }

  while (head < tail) {
    const pixel = queue[head];
    head += 1;
    const x = pixel % w;
    if (x > 0) seed(pixel - 1);
    if (x < w - 1) seed(pixel + 1);
    if (pixel >= w) seed(pixel - w);
    if (pixel < total - w) seed(pixel + w);
  }

  let removed = 0;
  for (let pixel = 0; pixel < total; pixel += 1) {
    if (!cleared[pixel]) continue;
    data[pixel * 4 + 3] = 0;
    removed += 1;
  }
  return removed;
}

function featherEdges(data: Uint8ClampedArray, w: number, h: number) {
  for (let pass = 0; pass < 2; pass += 1) {
    const snapshot = new Uint8ClampedArray(data);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = (y * w + x) * 4;
        if (snapshot[i + 3] === 0) continue;
        let neighbours = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (snapshot[(ny * w + nx) * 4 + 3] === 0) neighbours += 1;
          }
        }
        if (neighbours === 0) continue;
        const softened = neighbours >= 3 ? 96 : 176;
        data[i + 3] = Math.min(data[i + 3], softened);
        data[i] = Math.round(data[i] * 0.92);
        data[i + 1] = Math.round(data[i + 1] * 0.92);
        data[i + 2] = Math.round(data[i + 2] * 0.92);
      }
    }
  }
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
  }
}

function alphaBounds(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  minAlpha: number,
): { x: number; y: number; width: number; height: number } | null {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * 4 + 3] < minAlpha) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

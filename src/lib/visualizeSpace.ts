import type { BoardCategory, Product, ProductSize } from "@/lib/types";
import { getAllProducts } from "@/data/catalogue";
import { isolateBoardImage } from "@/lib/boardIsolation";

export const VISUALIZE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const VISUALIZE_MAX_BYTES = 10 * 1024 * 1024;

const BOARD_CATEGORIES: BoardCategory[] = [
  "magnetic-whiteboard",
  "non-magnetic-whiteboard",
  "notice-board",
  "pin-up-board",
  "chalk-board",
  "combination-board",
  "wooden-product",
];

export function getVisualizeCatalogueProducts(): Product[] {
  return getAllProducts().filter((product) =>
    BOARD_CATEGORIES.includes(product.category),
  );
}

export function isAllowedWallImage(file: File): { ok: true } | { ok: false; message: string } {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const allowedType =
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "";
  const allowedExt =
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp");

  if (!allowedType && !allowedExt) {
    return { ok: false, message: "Please upload a JPG, JPEG, PNG, or WEBP image." };
  }
  if (file.size > VISUALIZE_MAX_BYTES) {
    return { ok: false, message: "Please keep wall photos under 10 MB." };
  }
  return { ok: true };
}

export function productAspect(product: Product, size?: ProductSize): number {
  const chosen = size ?? product.sizes[0];
  if (chosen && chosen.heightFt > 0) return chosen.widthFt / chosen.heightFt;
  return 4 / 3;
}

/** Map a catalogue size to an on-canvas width fraction. */
export function sizeToWidthFraction(product: Product, size: ProductSize): number {
  const widths = product.sizes.map((item) => item.widthFt);
  const maxW = Math.max(...widths, size.widthFt);
  const minW = Math.min(...widths, size.widthFt);
  const span = Math.max(0.01, maxW - minW);
  const t = (size.widthFt - minW) / span;
  return 0.22 + t * 0.28;
}

export interface OverlayTransform {
  /** Board centre X as 0–1 of canvas width */
  cx: number;
  /** Board centre Y as 0–1 of canvas height */
  cy: number;
  /** Board width as fraction of canvas width */
  widthFrac: number;
  /** Rotation in degrees */
  rotation: number;
}

export const defaultOverlay = (widthFrac = 0.36): OverlayTransform => ({
  cx: 0.5,
  cy: 0.46,
  widthFrac,
  rotation: 0,
});

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  const isLocal = src.startsWith("blob:") || src.startsWith("data:") || src.startsWith("/");
  return new Promise((resolve, reject) => {
    const tryLoad = (useCors: boolean) => {
      const img = new Image();
      if (useCors && !isLocal) img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (useCors && !isLocal) tryLoad(false);
        else reject(new Error("Could not load image"));
      };
      img.src = src;
    };
    tryLoad(!isLocal);
  });
}

/** Composite wall + positioned board into a PNG blob for download. */
export async function renderPreviewBlob(options: {
  wallSrc: string;
  boardSrc: string;
  transform: OverlayTransform;
  aspect: number;
  canvasWidth?: number;
}): Promise<Blob> {
  const { wallSrc, boardSrc, transform, aspect } = options;
  const wall = await loadImageElement(wallSrc);
  const isolatedSrc = await isolateBoardImage(boardSrc);
  const board = isolatedSrc ? await loadImageElement(isolatedSrc).catch(() => null) : null;

  const outW = options.canvasWidth ?? Math.min(1920, wall.naturalWidth || 1600);
  const outH = Math.round(outW * (wall.naturalHeight / wall.naturalWidth));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.drawImage(wall, 0, 0, outW, outH);

  const boardW = transform.widthFrac * outW;
  const boardH = boardW / aspect;
  const x = transform.cx * outW;
  const y = transform.cy * outH;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  if (board) {
    const scale = Math.min(boardW / board.naturalWidth, boardH / board.naturalHeight);
    const dw = board.naturalWidth * scale;
    const dh = board.naturalHeight * scale;
    ctx.drawImage(board, -dw / 2, -dh / 2, dw, dh);
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#C8C8C4";
    ctx.lineWidth = 6;
    ctx.fillRect(-boardW / 2, -boardH / 2, boardW, boardH);
    ctx.strokeRect(-boardW / 2, -boardH / 2, boardW, boardH);
  }
  ctx.restore();

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
        "image/png",
      );
    } catch {
      reject(new Error("Export failed — wall photo may be tainted by CORS"));
    }
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export const SAVED_PREVIEW_KEY = "obasix-space-visualizer-v1";

export interface SavedSpacePreview {
  productId: string;
  sizeId: string;
  transform: OverlayTransform;
  wallDataUrl?: string;
  savedAt: string;
}

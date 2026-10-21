/**
 * pixel.ts — string-art sprites baked once into offscreen canvases.
 *
 * Sprites are authored as rows of characters, one character per *art* pixel,
 * and baked at startup into a canvas each. Drawing is then one `drawImage` per
 * unit with smoothing off: fast, and genuinely pixel-exact — no filtering, no
 * half-pixel blur.
 *
 * Art is authored small (a soldier is about eleven by nineteen) and baked at
 * `SCALE`, so one authored pixel becomes a solid block on the field. That is
 * what makes it read as pixel art rather than as a small picture: the block
 * size is deliberate and uniform, and it is decided here rather than by
 * whatever size an image happened to be.
 *
 * Character slots are shared by every silhouette, so one grid is recoloured per
 * kind from that kind's five-colour ramp:
 *
 *   1 body    2 light    3 accent    4 outline    5 shade
 *   6 skin    7 skin shadow          8 gunmetal   9 gunmetal light
 *   w wood    s strap    b boot      . or space   transparent
 */

import { SHARED, type Ramp } from "./palette";

export type PixelGrid = readonly string[];

/** One authored pixel is this many device-independent pixels on the field. */
export const SCALE = 4;

export type Sprite = {
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
  /** Walk/animation frames; `canvas` is always `frames[0]`. */
  readonly frames: readonly HTMLCanvasElement[];
};

export function createLayer(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function slots(ramp: Ramp): Record<string, string> {
  return {
    "1": ramp[0],
    "2": ramp[1],
    "3": ramp[2],
    "4": ramp[3],
    "5": ramp[4],
    "6": SHARED.skin,
    "7": SHARED.skinDark,
    "8": SHARED.gun,
    "9": SHARED.gunLight,
    w: SHARED.wood,
    s: SHARED.strap,
    b: SHARED.boot,
  };
}

function gridWidth(grid: PixelGrid): number {
  return grid.reduce((w, row) => Math.max(w, row.length), 0);
}

/** Paint a grid into a context at `scale`, offset by (ox, oy) in art pixels. */
export function paintGrid(
  ctx: CanvasRenderingContext2D,
  grid: PixelGrid,
  ramp: Ramp,
  scale = SCALE,
  ox = 0,
  oy = 0,
): void {
  const colors = slots(ramp);
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const color = colors[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect((ox + x) * scale, (oy + y) * scale, scale, scale);
    }
  }
}

/** Bake one or more grids (the frames of an animation) into a sprite. */
export function bake(grids: readonly PixelGrid[], ramp: Ramp, scale = SCALE): Sprite {
  const width = Math.max(...grids.map(gridWidth));
  const height = Math.max(...grids.map((g) => g.length));
  const frames = grids.map((grid) => {
    const { canvas, ctx } = createLayer(width * scale, height * scale);
    // Centre a narrower frame so a bobbing silhouette does not drift sideways.
    const ox = Math.floor((width - gridWidth(grid)) / 2);
    const oy = height - grid.length;
    paintGrid(ctx, grid, ramp, scale, ox, oy);
    return canvas;
  });
  return { canvas: frames[0], frames, width: width * scale, height: height * scale };
}

/**
 * The passing frame: the whole figure lifted one pixel, with a blank row put
 * back underneath so the sprite keeps its height and its feet stay on the
 * ground line. At this scale a one-pixel lift reads as a stride.
 */
export function lifted(grid: PixelGrid): PixelGrid {
  return [...grid.slice(1), " ".repeat(gridWidth(grid))];
}

/** A flat silhouette in one colour, for hit flashes. */
export function silhouette(sprite: Sprite, color: string): HTMLCanvasElement {
  const { canvas, ctx } = createLayer(sprite.width, sprite.height);
  ctx.drawImage(sprite.canvas, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, sprite.width, sprite.height);
  return canvas;
}

/** Deterministic noise, so a field looks the same every time it is entered. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A filled pixel disc, snapped to the art grid — for blasts and shadows. */
export function pixelDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  scale = SCALE,
): void {
  ctx.fillStyle = color;
  const rr = r * r;
  const gx = Math.round(cx / scale);
  const gy = Math.round(cy / scale);
  const gr = Math.ceil(r / scale);
  for (let y = -gr; y <= gr; y++) {
    for (let x = -gr; x <= gr; x++) {
      const dx = x * scale;
      const dy = y * scale;
      if (dx * dx + dy * dy <= rr) ctx.fillRect((gx + x) * scale, (gy + y) * scale, scale, scale);
    }
  }
}

/** A pixel ring: the outline of a disc, one block thick. */
export function pixelRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  scale = SCALE,
  dash = 0,
): void {
  ctx.fillStyle = color;
  const steps = Math.max(12, Math.round((r * 2 * Math.PI) / scale));
  let last = "";
  for (let i = 0; i < steps; i++) {
    if (dash > 0 && i % (dash * 2) >= dash) continue;
    const a = (i / steps) * Math.PI * 2;
    const x = Math.round((cx + Math.cos(a) * r) / scale) * scale;
    const y = Math.round((cy + Math.sin(a) * r) / scale) * scale;
    const key = `${x},${y}`;
    if (key === last) continue;
    last = key;
    ctx.fillRect(x, y, scale, scale);
  }
}

/** A rectangle snapped to the art grid. */
export function pixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  scale = SCALE,
): void {
  ctx.fillStyle = color;
  const x0 = Math.round(x / scale) * scale;
  const y0 = Math.round(y / scale) * scale;
  ctx.fillRect(x0, y0, Math.max(scale, Math.round(w / scale) * scale), Math.max(scale, Math.round(h / scale) * scale));
}

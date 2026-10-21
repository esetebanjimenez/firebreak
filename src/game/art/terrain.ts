/**
 * terrain.ts — the ground, baked once per fight.
 *
 * The old field was one 160px photo tiled across the world with a flat black
 * rectangle laid over the middle for the lane, which is why it read as a brown
 * void with a band in it. This builds the whole world as one layer instead,
 * on the same four-pixel grid everything else uses:
 *
 *   1. a base of the sector's four-step ground ramp, picked by layered value
 *      noise so the ground has patches rather than static;
 *   2. the lane — the strip the two lines actually fight over — worn in with a
 *      ragged edge, so it reads as ground that has been walked on rather than
 *      as a rectangle someone drew;
 *   3. scatter: stones, tufts, cracks;
 *   4. whatever that sector alone has — a road's centre line, standing water,
 *      paving slabs.
 *
 * It is one `drawImage` per frame afterwards.
 */

import { terrainFor } from "./palette";
import { SCALE, createLayer, mulberry32 } from "./pixel";

/** Value noise on a coarse lattice, smoothed — patches, not static. */
function noiseField(w: number, h: number, cell: number, seed: number) {
  const gw = Math.ceil(w / cell) + 2;
  const gh = Math.ceil(h / cell) + 2;
  const rnd = mulberry32(seed);
  const lattice = new Float32Array(gw * gh);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rnd();
  return (x: number, y: number) => {
    const fx = x / cell;
    const fy = y / cell;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    // Smoothstep, so patches have soft shoulders instead of diamond seams.
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const at = (gx: number, gy: number) =>
      lattice[Math.min(gh - 1, Math.max(0, gy)) * gw + Math.min(gw - 1, Math.max(0, gx))];
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
    return a + (b - a) * sy;
  };
}

/**
 * A 4x4 ordered dither matrix, normalised to 0..1.
 *
 * Four flat tones over a whole field would band badly, and smoothing the
 * boundary would mean blending — which is how ground ends up looking blurred
 * rather than drawn. Dithering keeps every pixel one of the four palette
 * colours and still reads as a continuous surface, which is the trick an
 * 8-bit background is built on.
 */
const BAYER: readonly number[] = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
].map((v) => (v + 0.5) / 16);

/** A stable per-cell hash, used to break up the dither's regularity. */
function jitter(gx: number, gy: number): number {
  let h = Math.imul(gx | 0, 374761393) ^ Math.imul(gy | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Pick a ramp step for `v`, dithering across the boundary between two.
 *
 * The threshold is the Bayer cell pulled halfway toward noise. Pure Bayer over
 * a whole field reads as a halftone screen — a regular grid of dots sitting on
 * top of the picture — and pure noise reads as static. Half of each gives a
 * texture with no visible repeat.
 */
function ditherStep(v: number, steps: number, gx: number, gy: number): number {
  // Pushed away from the middle first: noise that never leaves the midtones
  // sits on a boundary everywhere at once, which is what makes a whole field
  // dither at maximum strength.
  const c = Math.max(0, Math.min(1, (v - 0.5) * 1.9 + 0.5));
  const f = c * (steps - 1);
  const base = Math.floor(f);
  const frac = f - base;
  const threshold = BAYER[(gy & 3) * 4 + (gx & 3)] * 0.5 + jitter(gx, gy) * 0.5;
  return Math.min(steps - 1, base + (frac > threshold ? 1 : 0));
}

export function buildTerrain(
  sectorIndex: number,
  worldW: number,
  worldH: number,
  portrait: boolean,
): HTMLCanvasElement {
  const t = terrainFor(sectorIndex);
  const { canvas, ctx } = createLayer(worldW, worldH);
  const gw = Math.ceil(worldW / SCALE);
  const gh = Math.ceil(worldH / SCALE);
  const seed = sectorIndex * 7919 + 101;
  const rnd = mulberry32(seed + 5);

  const coarse = noiseField(gw, gh, 14, seed);
  const mid = noiseField(gw, gh, 5, seed + 3);
  const fine = noiseField(gw, gh, 2, seed + 1);
  const laneEdge = noiseField(gw, gh, 7, seed + 2);

  // The lane runs along the axis the two lines face down.
  const across = portrait ? gw : gh;
  const laneMid = across / 2;
  const laneHalf = across * 0.21;

  const fill = (gx: number, gy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(gx * SCALE, gy * SCALE, SCALE, SCALE);
  };

  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const n = coarse(gx, gy) * 0.46 + mid(gx, gy) * 0.34 + fine(gx, gy) * 0.2;
      const step = ditherStep(n, 4, gx, gy);
      let color: string = t.ground[step];

      const off = Math.abs((portrait ? gx : gy) - laneMid);
      const wobble = (laneEdge(gx, gy) - 0.5) * across * 0.09;
      const wear = 1 - (off + wobble) / laneHalf;
      if (wear > 0) {
        // Worn through in the middle, dithering out to grass at the margins
        // rather than stopping at a line.
        const mix = Math.min(1, wear * 1.9 + (fine(gx, gy) - 0.5) * 0.7);
        const edge = BAYER[(gy & 3) * 4 + (gx & 3)] * 0.5 + jitter(gx + 7, gy + 3) * 0.5;
        if (mix > edge) color = t.lane[ditherStep(n, 2, gx + 1, gy)];
      }
      fill(gx, gy, color);
    }
  }

  // Scatter: stones and tufts, thicker off the lane than on it.
  const scatter = Math.round((gw * gh) / 220);
  for (let i = 0; i < scatter; i++) {
    const gx = Math.floor(rnd() * gw);
    const gy = Math.floor(rnd() * gh);
    const off = Math.abs((portrait ? gx : gy) - laneMid);
    if (off < laneHalf && rnd() < 0.72) continue;
    const kind = rnd();
    if (kind < 0.42) {
      // A stone: two blocks and a shadow under them.
      fill(gx, gy, t.debris[1]);
      fill(gx + 1, gy, t.debris[0]);
      fill(gx, gy + 1, t.ground[0]);
    } else if (kind < 0.8) {
      // A tuft: three blocks in the lightest ground tone.
      fill(gx, gy, t.ground[3]);
      fill(gx - 1, gy + 1, t.ground[3]);
      fill(gx + 1, gy + 1, t.ground[2]);
    } else {
      // A crack or rut, running with the lane.
      const len = 2 + Math.floor(rnd() * 5);
      for (let k = 0; k < len; k++) {
        if (portrait) fill(gx + (rnd() < 0.3 ? 1 : 0), gy + k, t.ground[0]);
        else fill(gx + k, gy + (rnd() < 0.3 ? 1 : 0), t.ground[0]);
      }
    }
  }

  sectorDressing(ctx, sectorIndex, gw, gh, portrait, laneMid, laneHalf, rnd, fill);

  // Darker at the edges so the eye stays on the lane — but stepped, not a
  // smooth gradient. A gradient is the one soft edge a field like this cannot
  // have, and at six steps the falloff still reads as depth.
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const depth = (1 - i / steps) * 0.4;
    const band = Math.ceil(((across * 0.5) / steps) * SCALE);
    ctx.fillStyle = `rgba(0,0,0,${(depth / steps).toFixed(3)})`;
    for (let s = 0; s <= i; s++) {
      if (portrait) {
        ctx.fillRect(s * band, 0, band, worldH);
        ctx.fillRect(worldW - (s + 1) * band, 0, band, worldH);
      } else {
        ctx.fillRect(0, s * band, worldW, band);
        ctx.fillRect(0, worldH - (s + 1) * band, worldW, band);
      }
    }
  }

  ctx.fillStyle = t.haze;
  ctx.fillRect(0, 0, worldW, worldH);
  return canvas;
}

/** The one thing each sector has that the others do not. */
function sectorDressing(
  ctx: CanvasRenderingContext2D,
  sectorIndex: number,
  gw: number,
  gh: number,
  portrait: boolean,
  laneMid: number,
  laneHalf: number,
  rnd: () => number,
  fill: (gx: number, gy: number, color: string) => void,
): void {
  const t = terrainFor(sectorIndex);
  const along = portrait ? gh : gw;
  const atAcross = (across: number, along2: number) =>
    portrait ? ([across, along2] as const) : ([along2, across] as const);

  switch (sectorIndex) {
    case 2: {
      // Ash Corridor: a highway. Centre line, and burn scars off the shoulder.
      for (let a = 0; a < along; a += 1) {
        if (a % 9 < 5) {
          const [x, y] = atAcross(Math.round(laneMid), a);
          fill(x, y, "#6b6150");
        }
      }
      for (let i = 0; i < 26; i++) {
        const cx = Math.floor(rnd() * gw);
        const cy = Math.floor(rnd() * gh);
        const r = 2 + Math.floor(rnd() * 3);
        for (let y = -r; y <= r; y++) {
          for (let x = -r; x <= r; x++) {
            if (x * x + y * y > r * r) continue;
            fill(cx + x, cy + y, x * x + y * y > (r - 1) * (r - 1) ? "#2a211b" : "#1b1512");
          }
        }
      }
      break;
    }
    case 3: {
      // Black Water: standing water in the low ground.
      const pool = noiseField(gw, gh, 11, 777);
      for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
          const v = pool(gx, gy);
          if (v > 0.66) fill(gx, gy, v > 0.76 ? "#16303a" : "#1b3a44");
          else if (v > 0.63) fill(gx, gy, "#24454a");
        }
      }
      // A glint on the water.
      for (let i = 0; i < 70; i++) {
        const gx = Math.floor(rnd() * gw);
        const gy = Math.floor(rnd() * gh);
        if (pool(gx, gy) > 0.7) fill(gx, gy, "#4e7f86");
      }
      break;
    }
    case 4: {
      // Red Sector: broken kerbs and slabs across the street.
      for (let i = 0; i < 22; i++) {
        const gx = Math.floor(rnd() * gw);
        const gy = Math.floor(rnd() * gh);
        const w = 2 + Math.floor(rnd() * 5);
        const h = 1 + Math.floor(rnd() * 2);
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) fill(gx + x, gy + y, y === 0 ? t.debris[1] : t.debris[0]);
        }
      }
      break;
    }
    case 5: {
      // Throne Line: the avenue is paved, and the paving is cracked.
      for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
          const off = Math.abs((portrait ? gx : gy) - laneMid);
          if (off > laneHalf * 1.35) continue;
          const slab = portrait ? gy : gx;
          const lane = portrait ? gx : gy;
          if (slab % 11 === 0 || lane % 9 === 0) fill(gx, gy, "#262224");
        }
      }
      break;
    }
    default: {
      // Green Belt and Wire Country: stumps and churned dirt off the lane.
      for (let i = 0; i < 18; i++) {
        const gx = Math.floor(rnd() * gw);
        const gy = Math.floor(rnd() * gh);
        const r = 1 + Math.floor(rnd() * 3);
        for (let y = -r; y <= r; y++) {
          for (let x = -r; x <= r; x++) {
            if (x * x + y * y > r * r) continue;
            fill(gx + x, gy + y, t.lane[0]);
          }
        }
      }
      break;
    }
  }
  void ctx;
}

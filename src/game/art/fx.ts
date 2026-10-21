/**
 * fx.ts — blasts, authored as animations rather than one picture.
 *
 * The old art drew a single explosion image and scaled it up as the effect
 * aged, which is the one thing you cannot do to a pixel sprite: an arbitrary
 * scale factor turns square pixels into rectangles of two different widths and
 * the whole illusion goes. So each effect is a handful of frames at a fixed
 * size, and the engine picks a frame by age instead of stretching one.
 *
 * Blasts are radially symmetric with an angular wobble, so they are generated
 * on the art grid rather than typed out: five near-identical 21-row blocks of
 * characters would be worse to read and worse to tune than the shape function
 * that makes them.
 */

import type { Ramp } from "./palette";
import { mulberry32, type PixelGrid } from "./pixel";

type BlastSpec = {
  /** Outer radius in art pixels. */
  readonly radius: number;
  readonly frames: number;
  /** How many lobes around the rim, and how deep they cut. */
  readonly spikes: number;
  readonly depth: number;
  /** When the centre starts blowing out into a ring, as a fraction of life. */
  readonly hollowFrom: number;
  readonly seed: number;
};

function blast(spec: BlastSpec): PixelGrid[] {
  const { radius, frames, spikes, depth, hollowFrom, seed } = spec;
  const rnd = mulberry32(seed);
  const phase = rnd() * Math.PI * 2;
  const phase2 = rnd() * Math.PI * 2;
  const size = radius * 2 + 1;
  const out: PixelGrid[] = [];

  for (let f = 0; f < frames; f++) {
    const t = frames === 1 ? 0 : f / (frames - 1);
    // Fast out, then settle: the shape of an explosion's first tenth of a second.
    const r = radius * (0.34 + 0.66 * (1 - (1 - t) * (1 - t)));
    const hollow = t <= hollowFrom ? 0 : ((t - hollowFrom) / (1 - hollowFrom)) * 0.82;
    const rows: string[] = [];

    for (let y = 0; y < size; y++) {
      let row = "";
      for (let x = 0; x < size; x++) {
        const dx = x - radius;
        const dy = y - radius;
        const d = Math.hypot(dx, dy);
        const a = Math.atan2(dy, dx);
        const lobe =
          1 - depth * (0.5 - 0.5 * Math.cos(spikes * a + phase)) - depth * 0.35 * (0.5 - 0.5 * Math.cos(spikes * 2 * a + phase2));
        const edge = r * lobe;
        const u = edge <= 0 ? 2 : d / edge;

        if (u > 1 || u < hollow) {
          row += ".";
          continue;
        }
        // Bands run bright core -> body -> rim -> outline, and the whole ramp
        // slides one step darker as the blast ages into smoke.
        const cool = t * 0.55;
        const v = u + cool;
        if (v < 0.34) row += "3";
        else if (v < 0.6) row += "2";
        else if (v < 0.84) row += "1";
        else if (v < 0.95) row += "5";
        else row += "4";
      }
      rows.push(row);
    }
    out.push(rows);
  }
  return out;
}

/** The storm bolt is spikes and nothing else, so it gets its own shape. */
function arcFlash(radius: number, frames: number, seed: number): PixelGrid[] {
  const rnd = mulberry32(seed);
  const arms = 9;
  const dirs = Array.from({ length: arms }, (_, i) => (i / arms) * Math.PI * 2 + rnd() * 0.4);
  const size = radius * 2 + 1;
  const out: PixelGrid[] = [];

  for (let f = 0; f < frames; f++) {
    const t = frames === 1 ? 0 : f / (frames - 1);
    const reach = radius * (0.4 + 0.6 * Math.min(1, t * 1.6));
    const cells = new Map<string, string>();
    const put = (x: number, y: number, c: string) => {
      const kx = Math.round(x);
      const ky = Math.round(y);
      if (kx < 0 || ky < 0 || kx >= size || ky >= size) return;
      const key = `${kx},${ky}`;
      const have = cells.get(key);
      if (have === "3" || (have === "2" && c !== "3")) return;
      cells.set(key, c);
    };

    for (const base of dirs) {
      let a = base;
      let x = radius;
      let y = radius;
      const steps = Math.max(1, Math.round(reach));
      for (let s = 0; s < steps; s++) {
        a += (rnd() - 0.5) * 0.9;
        x += Math.cos(a);
        y += Math.sin(a);
        const near = s / steps;
        put(x, y, near < 0.35 ? "2" : near < 0.75 ? "1" : "5");
        if (s % 3 === 0) put(x + Math.cos(a + 1.6), y + Math.sin(a + 1.6), "5");
      }
    }
    // A core that fades as the arms reach out.
    const core = Math.max(0, 2.4 * (1 - t));
    for (let y = -3; y <= 3; y++) {
      for (let x = -3; x <= 3; x++) {
        if (Math.hypot(x, y) <= core) put(radius + x, radius + y, "3");
      }
    }

    const rows: string[] = [];
    for (let y = 0; y < size; y++) {
      let row = "";
      for (let x = 0; x < size; x++) row += cells.get(`${x},${y}`) ?? ".";
      rows.push(row);
    }
    out.push(rows);
  }
  return out;
}

export type FxArt = { readonly frames: readonly PixelGrid[]; readonly ramp: Ramp };

export const FX: Record<string, FxArt> = {
  // Your grenade: brass and white, sharp-edged, gone quickly.
  "fx-grenade": {
    frames: blast({ radius: 9, frames: 5, spikes: 7, depth: 0.3, hollowFrom: 0.5, seed: 7 }),
    ramp: ["#ff9b2e", "#ffd36b", "#fff6d0", "#4a1c06", "#8c3a10"],
  },
  // White phosphorus: deeper reds, and it leaves smoke behind.
  "fx-fire": {
    frames: blast({ radius: 10, frames: 6, spikes: 5, depth: 0.38, hollowFrom: 0.38, seed: 19 }),
    ramp: ["#e8551f", "#ff9b2e", "#ffe9a3", "#3a1004", "#6b2a12"],
  },
  // EMP: no fireball, just arms of current.
  "fx-shock": {
    frames: arcFlash(10, 5, 31),
    ramp: ["#4f9bff", "#9ecbff", "#ffffff", "#0b1c3a", "#24407a"],
  },
  // Flash mortar: a bleached ring that blows out fast.
  "fx-flash": {
    frames: blast({ radius: 10, frames: 5, spikes: 4, depth: 0.16, hollowFrom: 0.3, seed: 53 }),
    ramp: ["#f4f0e4", "#ffffff", "#ffffff", "#6e7a86", "#b9c4cc"],
  },
  // Impact puff where a bullet lands.
  "fx-hit": {
    frames: blast({ radius: 4, frames: 3, spikes: 5, depth: 0.3, hollowFrom: 0.45, seed: 61 }),
    ramp: ["#c9a35e", "#e8d49a", "#fff6d0", "#2b1f0c", "#6b5430"],
  },
};

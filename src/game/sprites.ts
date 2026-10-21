/**
 * sprites.ts — the field's art, baked rather than downloaded.
 *
 * This used to be sixteen PNGs. They looked like pixel art from a distance but
 * were not: a 60x100 figure carrying two to three thousand distinct colours is
 * a rendered image shrunk down, and at the size a unit occupies on screen it
 * read as a brown smudge. Every figure, prop and blast is now authored on a
 * grid and baked here into a canvas at a fixed block size, so the art has a
 * real palette, a real outline, and a pixel that is the same size everywhere.
 *
 * Baking is synchronous and takes a couple of milliseconds; the promise is
 * kept so the caller does not have to change.
 */

import { FX } from "./art/fx";
import { RAMPS } from "./art/palette";
import { bake, silhouette, type Sprite } from "./art/pixel";
import { PROPS } from "./art/props";
import { UNITS } from "./art/units";

export type { Sprite } from "./art/pixel";

export type SpriteMap = Record<string, Sprite | null>;

/** White silhouettes, keyed the same way, for the flash on a unit taking a hit. */
export type FlashMap = Record<string, HTMLCanvasElement | null>;

let baked: { sprites: SpriteMap; flashes: FlashMap } | null = null;

function bakeAll() {
  if (baked) return baked;
  const sprites: SpriteMap = {};
  const flashes: FlashMap = {};

  for (const [kind, art] of Object.entries(UNITS)) {
    const ramp = RAMPS[kind] ?? RAMPS.rifle;
    const sprite = bake(art.frames, ramp);
    sprites[kind] = sprite;
    flashes[kind] = silhouette(sprite, "rgba(255,246,214,0.7)");
  }
  for (const [kind, art] of Object.entries(PROPS)) {
    sprites[kind] = bake(art.frames, art.ramp);
  }
  for (const [kind, art] of Object.entries(FX)) {
    sprites[kind] = bake(art.frames, art.ramp);
  }

  baked = { sprites, flashes };
  return baked;
}

let pending: Promise<SpriteMap> | null = null;

export function getSprites(): Promise<SpriteMap> {
  if (!pending) pending = Promise.resolve(bakeAll().sprites);
  return pending;
}

export function getFlashes(): FlashMap {
  return bakeAll().flashes;
}

/**
 * font.ts — a 3x5 bitmap font for the numbers that float off the field.
 *
 * The salvage and damage counters used to be drawn in the UI's sans-serif at
 * 12px, which put anti-aliased type on top of a field where nothing else has a
 * soft edge.
 *
 * Sizing is given in *device* pixels per glyph pixel rather than in world
 * units, with the caller passing the current device-pixels-per-world-unit to
 * convert. Two reasons. A glyph pixel has to come out as a whole number of
 * device pixels or the type goes soft again — the one thing this font exists
 * to prevent — and a size in world units cannot promise that at an arbitrary
 * zoom. And unlike a sprite, a number floating above a unit has no reason to
 * sit on the terrain's four-pixel grid, so it need not pay the coarseness that
 * would cost: rounding these to whole art blocks made the damage numbers
 * nearly as tall as the soldiers taking the damage.
 */

const GLYPHS: Record<string, readonly string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  "+": ["000", "010", "111", "010", "000"],
  "-": ["000", "000", "111", "000", "000"],
  ".": ["000", "000", "000", "000", "010"],
  k: ["100", "101", "110", "101", "101"],
  m: ["000", "000", "111", "111", "101"],
  s: ["000", "011", "110", "011", "110"],
  " ": ["000", "000", "000", "000", "000"],
};

export const GLYPH_W = 3;
export const GLYPH_H = 5;
const TRACKING = 1;

/** Width of `text` in world units, given a glyph pixel of `px` world units. */
export function textWidth(text: string, px: number): number {
  return text.length * (GLYPH_W + TRACKING) * px - TRACKING * px;
}

/**
 * Draw `text` horizontally centred on `x` and sitting *above* `y`, with a
 * one-pixel drop shadow so a bright number still reads over bright ground.
 *
 * Taking `y` as the bottom of the text rather than its top is what lets a
 * caller place a floater by the clearance it needs above a unit without
 * knowing how tall the glyphs come out at the current zoom.
 *
 * `devicePx` is one glyph pixel in device pixels; `devicePerWorld` converts
 * that into the world units the canvas transform is working in.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  devicePx: number,
  devicePerWorld: number,
  color: string,
  shadow = "rgba(0,0,0,0.65)",
): void {
  const perWorld = Math.max(0.0001, devicePerWorld);
  // A whole number of device pixels per glyph pixel, never less than one.
  const px = Math.max(1, Math.round(devicePx)) / perWorld;
  const total = textWidth(text, px);
  // Snap the origin to a device pixel too, or the whole string sits half a
  // pixel over and every edge in it softens.
  const toDevice = (v: number) => Math.round(v * perWorld) / perWorld;
  const startX = toDevice(x - total / 2);
  const startY = toDevice(y - GLYPH_H * px);

  for (const pass of [0, 1]) {
    if (pass === 0 && !shadow) continue;
    ctx.fillStyle = pass === 0 ? shadow : color;
    const off = pass === 0 ? px : 0;
    let cx = startX;
    for (const ch of text) {
      const glyph = GLYPHS[ch] ?? GLYPHS[ch.toLowerCase()] ?? GLYPHS[" "];
      for (let gy = 0; gy < GLYPH_H; gy++) {
        for (let gx = 0; gx < GLYPH_W; gx++) {
          if (glyph[gy][gx] !== "1") continue;
          ctx.fillRect(cx + gx * px + off, startY + gy * px + off, px, px);
        }
      }
      cx += (GLYPH_W + TRACKING) * px;
    }
  }
}

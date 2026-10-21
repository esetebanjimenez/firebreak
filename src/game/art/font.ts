/**
 * font.ts — a 3x5 bitmap font for the numbers that float off the field.
 *
 * The salvage counters used to be drawn in the UI's sans-serif at 12px, which
 * put anti-aliased type on top of a field where nothing else has a soft edge.
 * Three pixels by five is the smallest a digit can be and stay legible, and
 * drawn at the art scale it sits in the same world as everything else.
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

export function textWidth(text: string, scale: number): number {
  return text.length * (GLYPH_W + TRACKING) * scale - TRACKING * scale;
}

/**
 * Draw `text` centred on (x, y) in blocks of `scale`, with a one-block drop
 * shadow so a bright number still reads over bright ground.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
  color: string,
  shadow = "rgba(0,0,0,0.65)",
): void {
  const total = textWidth(text, scale);
  const startX = Math.round((x - total / 2) / scale) * scale;
  const startY = Math.round(y / scale) * scale;

  for (const pass of [0, 1]) {
    ctx.fillStyle = pass === 0 ? shadow : color;
    if (pass === 0 && !shadow) continue;
    const dx = pass === 0 ? scale : 0;
    const dy = pass === 0 ? scale : 0;
    let cx = startX;
    for (const ch of text) {
      const glyph = GLYPHS[ch] ?? GLYPHS[ch.toLowerCase()] ?? GLYPHS[" "];
      for (let gy = 0; gy < GLYPH_H; gy++) {
        for (let gx = 0; gx < GLYPH_W; gx++) {
          if (glyph[gy][gx] !== "1") continue;
          ctx.fillRect(cx + gx * scale + dx, startY + gy * scale + dy, scale, scale);
        }
      }
      cx += (GLYPH_W + TRACKING) * scale;
    }
  }
}

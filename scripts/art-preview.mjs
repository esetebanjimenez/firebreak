// Dev-only: bake the authored grids to a PNG montage so the art can be eyeballed.
// Run: node --experimental-strip-types scripts/art-preview.mjs out.png
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { UNITS } from "../src/game/art/units.ts";
import { PROPS } from "../src/game/art/props.ts";
import { FX } from "../src/game/art/fx.ts";
import { RAMPS, SHARED } from "../src/game/art/palette.ts";

const SLOTS = (ramp) => ({
  1: ramp[0], 2: ramp[1], 3: ramp[2], 4: ramp[3], 5: ramp[4],
  6: SHARED.skin, 7: SHARED.skinDark, 8: SHARED.gun, 9: SHARED.gunLight,
  w: SHARED.wood, s: SHARED.strap, b: SHARED.boot,
});

const hex = (c) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c);
  if (!m) return [255, 0, 255, 255];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
};

function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crcBuf]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
  ]);
}

let TAB = null;
function crc32(buf) {
  if (!TAB) {
    TAB = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TAB[n] = c;
    }
  }
  let c = -1;
  for (const b of buf) c = TAB[(c ^ b) & 255] ^ (c >>> 8);
  return c ^ -1;
}

const SCALE = Number(process.argv[3] ?? 6);
const entries = [];
for (const [name, art] of Object.entries(UNITS)) {
  art.frames.forEach((g, i) => entries.push([`${name}${art.frames.length > 1 ? i : ""}`, g, RAMPS[name] ?? RAMPS.rifle]));
}
for (const [name, art] of Object.entries(PROPS)) {
  art.frames.forEach((g, i) => entries.push([`${name}${art.frames.length > 1 ? i : ""}`, g, art.ramp]));
}
for (const [name, art] of Object.entries(FX)) {
  art.frames.forEach((g, i) => entries.push([`${name}${i}`, g, art.ramp]));
}

const cellW = Math.max(...entries.map(([, g]) => Math.max(...g.map((r) => r.length)))) * SCALE + 10;
const cellH = Math.max(...entries.map(([, g]) => g.length)) * SCALE + 10;
const cols = Math.min(10, entries.length);
const rows = Math.ceil(entries.length / cols);
const W = cols * cellW;
const H = rows * cellH;
const buf = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  const x = i % W, y = (i / W) | 0;
  const checker = (((x / 8) | 0) + ((y / 8) | 0)) % 2 ? 46 : 38;
  buf[i * 4] = checker; buf[i * 4 + 1] = checker + 4; buf[i * 4 + 2] = checker; buf[i * 4 + 3] = 255;
}
entries.forEach(([name, grid, ramp], idx) => {
  const colors = SLOTS(ramp);
  const c = idx % cols, r = (idx / cols) | 0;
  const gw = Math.max(...grid.map((row) => row.length));
  const ox = c * cellW + 5 + ((cellW - 10 - gw * SCALE) >> 1);
  const oy = r * cellH + 5 + (cellH - 10 - grid.length * SCALE);
  for (let gy = 0; gy < grid.length; gy++) {
    for (let gx = 0; gx < grid[gy].length; gx++) {
      const col = colors[grid[gy][gx]];
      if (!col) continue;
      const [R, G, B] = hex(col);
      for (let py = 0; py < SCALE; py++) {
        for (let px = 0; px < SCALE; px++) {
          const X = ox + gx * SCALE + px, Y = oy + gy * SCALE + py;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const o = (Y * W + X) * 4;
          buf[o] = R; buf[o + 1] = G; buf[o + 2] = B; buf[o + 3] = 255;
        }
      }
    }
  }
  void name;
});
writeFileSync(process.argv[2] ?? "art.png", png(W, H, buf));
console.log(entries.map(([n]) => n).join("  "));
console.log(`${W}x${H}`);

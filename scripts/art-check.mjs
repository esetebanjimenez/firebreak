// Dev-only: report any authored row whose width differs from its sprite's widest row.
import { UNITS } from "../src/game/art/units.ts";
import { PROPS } from "../src/game/art/props.ts";
let bad = 0;
const check = (label, frames) => {
  frames.forEach((grid, fi) => {
    const w = Math.max(...grid.map((r) => r.length));
    grid.forEach((row, y) => {
      if (row.length !== w) { bad++; console.log(`${label}[${fi}] row ${y}: ${row.length} != ${w}  "${row}"`); }
    });
  });
};
for (const [n, a] of Object.entries(UNITS)) check(n, a.frames);
for (const [n, a] of Object.entries(PROPS)) check(n, a.frames);
console.log(bad ? `${bad} ragged rows` : "all rows square");

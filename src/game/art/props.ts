/**
 * props.ts — the standing scenery, one set per sector.
 *
 * These depth-sort with the units, so they are authored to the same rules:
 * rooted on the last row, outlined, lit from above. Each sector names one in
 * its terrain entry, which is most of what makes Green Belt and Throne Line
 * feel like different places with the same fight in them.
 *
 * Tiered shapes (the conifer especially) are lit on the left and shaded on the
 * right rather than being flat, because a prop the player sees sixteen of at
 * once is where a flat fill shows up worst.
 */

import type { Ramp } from "./palette";
import type { PixelGrid } from "./pixel";

/** Green Belt: a logged wood that still has trees in it. */
const PINE: PixelGrid = [
  "........4........",
  ".......424.......",
  "......42124......",
  ".....4112114.....",
  ".....4555554.....",
  "......42124......",
  ".....4121114.....",
  "....411211214....",
  "....455555554....",
  ".....4211124.....",
  "....412111214....",
  "...41121121114...",
  "...45555555554...",
  "....421211124....",
  "...41211212114...",
  "..4112112111214..",
  ".412112112112114.",
  ".455555555555554.",
  ".......4w4.......",
  ".......4w4.......",
  ".......4w54......",
  "......45w554.....",
  ".....455555 4....",
  ".....4444444.....",
];

/** Wire Country: what the loggers left — a cut stump, rings showing. */
const STUMP: PixelGrid = [
  "....44444....",
  "..422222224..",
  ".42111111124.",
  ".42155555124.",
  ".42151115124.",
  ".42155555124.",
  ".42111111124.",
  ".45555555554.",
  ".41151115114.",
  ".45115111514.",
  ".45511115554.",
  "4555555555554",
  "4444444444444",
];

/** Ash Corridor: burned down to a standing skeleton. */
const BURNT: PixelGrid = [
  "...4...4.....",
  "..414.414....",
  "..412.214..4.",
  "...41.14..414",
  "....4114..412",
  "....4114.4214",
  "....41124214.",
  "....4111124..",
  "....4121114..",
  "....4111214..",
  "....4112114..",
  "...44111124..",
  "...45111154..",
  "..4551115554.",
  ".45555155554.",
  ".44444444444.",
];

/** Black Water: reeds standing in the flood. */
const REED: PixelGrid = [
  "..4.......4..",
  ".414.....414.",
  ".412.4...412.",
  ".412.414.412.",
  "4123.412.4123",
  "4123.412.4123",
  "4123.4123412.",
  ".412.4123412.",
  ".412.4123412.",
  ".4123412.412.",
  "..412.412.41.",
  "..412.412.41.",
  "...41.412..4.",
  "...455555 4..",
  "..45555555 4.",
  "..444444444..",
];

/** Red Sector: a slab off a building, with the rebar still in it. */
const RUBBLE: PixelGrid = [
  "...8.......8...",
  "..48......48...",
  "..48...8..48...",
  ".448..448.448..",
  "44222222222 444",
  "421111111111124",
  "421133111311124",
  "421111111111124",
  "445511111111524",
  ".44551111115544",
  "..4455555555 4.",
  "...44444444444.",
];

/** Throne Line: the avenue was colonnaded once. */
const PILLAR: PixelGrid = [
  "44444444444",
  "42222222 24",
  ".421111124.",
  ".421111524.",
  ".421111524.",
  ".421511524.",
  ".421111524.",
  ".421111524.",
  ".421511524.",
  ".421111524.",
  ".421111524.",
  ".421511524.",
  ".421111524.",
  ".421111524.",
  "44211115244",
  "42111115524",
  "45555555554",
  "44555555544",
  ".4455555544",
  "..444444444",
];

export type PropArt = { readonly frames: readonly PixelGrid[]; readonly ramp: Ramp };

export const PROPS: Record<string, PropArt> = {
  pine: { frames: [PINE], ramp: ["#2f5134", "#4c7a44", "#6b9a52", "#0c1710", "#1b3121"] },
  stump: { frames: [STUMP], ramp: ["#6b5636", "#897049", "#a98a58", "#120d07", "#43351f"] },
  burnt: { frames: [BURNT], ramp: ["#39322c", "#564c43", "#6b5f54", "#0d0b09", "#221d19"] },
  reed: { frames: [REED], ramp: ["#4a5a3a", "#64764c", "#8a9a5e", "#0e1410", "#2c3a26"] },
  rubble: { frames: [RUBBLE], ramp: ["#56504a", "#736b62", "#8a8077", "#120f0d", "#36312c"] },
  pillar: { frames: [PILLAR], ramp: ["#5d5a54", "#7c7870", "#918c80", "#121110", "#3a3833"] },
};

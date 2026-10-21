/**
 * units.ts — every figure on the field, authored a pixel at a time.
 *
 * Conventions, held by all of them:
 *
 * - **Front-facing.** The field is a three-quarter top-down, and in portrait
 *   the two lines face up and down rather than left and right, so a profile
 *   would be wrong half the time. Front-facing reads in both.
 * - **Feet on the last row.** The engine draws a unit by its feet, so the
 *   silhouette bottoms out exactly at the grid's last row.
 * - **Light from above.** Crowns and shoulder tops take `2`; undersides and
 *   the inside of limbs take `5`.
 * - **Weapons break the outline.** A gun drawn inside the body is invisible at
 *   this size. Every weapon crosses the silhouette or sticks out of it.
 * - **The accent is the faction tell.** Yours wear a pale blue optic band,
 *   theirs a red rag or plate. It is deliberately the brightest thing on the
 *   figure, because at this size hue is all the player gets to go on.
 *
 * Your line stands and shoots (the engine gives allies speed 0), so they are
 * authored in one firing pose. The enemy walks at you, so each enemy kind gets
 * a second frame with the weight on the other foot.
 */

import { lifted, type PixelGrid } from "./pixel";

// ---------------------------------------------------------------- your line

/** The officer: you. Peaked cap, long coat, brass on the shoulders. */
const OFFICER: PixelGrid = [
  "...4444444...",
  "..411111114..",
  "..422222224..",
  ".44444444444.",
  "...4666664...",
  "...4676764...",
  "....47774....",
  ".43222222234.",
  ".41222222214.",
  ".41128882114.",
  ".41131111148.",
  ".41113111149.",
  ".4sss3sssss4.",
  ".41111311114.",
  ".41111131114.",
  ".45111111154.",
  ".44444444444.",
  "..411141114..",
  "..455141554..",
  "..4bb444bb4..",
  "...4444444...",
];

/** Rifleman: the line. Rifle held level across the chest. */
const RIFLE: PixelGrid = [
  ".....444.....",
  "....42224....",
  "....41114....",
  "...4111114...",
  "...4333334...",
  "....46664....",
  "....47774....",
  "..422222224..",
  ".42111111124.",
  ".41111111114.",
  ".4ww88888899.",
  ".4161181614..",
  ".41122222114.",
  ".4sssssssss4.",
  "..411111114..",
  "..411141114..",
  "..411141114..",
  "..455141554..",
  "..4bb444bb4..",
  "..444444444..",
];

/** Marksman: lower profile, scoped rifle, scrim on the shoulders. */
const MARKS: PixelGrid = [
  ".....444.....",
  "....42524....",
  "....41514....",
  "...4151514...",
  "...4333334...",
  "....46664....",
  "....47774....",
  "..452222554..",
  ".452111121548",
  ".41111111884.",
  ".4ww888899889",
  ".4161181614..",
  ".45112221154.",
  ".4sssssssss4.",
  "..415111514..",
  "..411141114..",
  "..451141514..",
  "..455141554..",
  "..4bb444bb4..",
  "..444444444..",
];

/** Gun drone: it orbits you, so it is read from straight above. */
const DRONE_A: PixelGrid = [
  ".555.....555.",
  "52225...52225",
  ".555.....555.",
  "..41.....14..",
  "..441111144..",
  "..412232214..",
  "..413333314..",
  "..412232214..",
  "..441111144..",
  "..41.....14..",
  ".555.....555.",
  "52225...52225",
  ".555.....555.",
];
const DRONE_B: PixelGrid = [
  "..5.......5..",
  ".525.....525.",
  "..5.......5..",
  "..41.....14..",
  "..441111144..",
  "..412252214..",
  "..413333314..",
  "..412252214..",
  "..441111144..",
  "..41.....14..",
  "..5.......5..",
  ".525.....525.",
  "..5.......5..",
];

/** HESCO barrier: wire basket, fabric liner, filled with spoil. */
const WALL: PixelGrid = [
  "...4444444444..",
  "..432222222234.",
  ".43222222222234",
  "444444444444444",
  "421133113311324",
  "421133113311324",
  "444444444444444",
  "411331133113314",
  "421331133113324",
  "444444444444444",
  "421551155115524",
  "455555555555554",
  "444444444444444",
];

// --------------------------------------------------------------- their line

/** Militia: rags, a red headband, an old rifle. The chaff. */
const MILITIA: PixelGrid = [
  "...44444...",
  "..4333334..",
  "..4666664..",
  "..4676764..",
  "...46664...",
  "...47774...",
  ".412222214.",
  ".411111114.",
  ".4ww8888899",
  ".416181614.",
  ".411111114.",
  ".4sssssss4.",
  "..4111114..",
  "..4114114..",
  "..4114114..",
  "..4114114..",
  "..4bb4bb4..",
  "..4444444..",
];

/** Riot shield: a slab of plate with a man behind it. Rifles bounce. */
const SHIELD: PixelGrid = [
  "....44444....",
  "...4333334...",
  "...4111114...",
  "....46664....",
  "....47774....",
  ".44444444444.",
  ".42222222224.",
  ".44444444444.",
  ".42111111124.",
  ".42133333124.",
  ".42133333124.",
  ".42111111124.",
  ".42155555124.",
  ".45555555554.",
  ".44444444444.",
  "...4114114...",
  "...4114114...",
  "...4bb4bb4...",
  "...4444444...",
];

/** Gunner: a tube over the shoulder, and the reach to use it. */
const GUNNER: PixelGrid = [
  "....44444....",
  "....43334....",
  "....46664....",
  "....47674....",
  ".....474.....",
  "..422222224..",
  ".421111112488",
  ".41111111889.",
  ".4111118814..",
  ".4111881114..",
  ".4881111114..",
  "99811111114..",
  ".4sssssssss4.",
  "..411111114..",
  "..411141114..",
  "..411141114..",
  "..411141114..",
  "..4bb444bb4..",
  "..444444444..",
];

/** Juggernaut: crimson plate, a slit of a visor, and a belt-fed gun. */
const JUG: PixelGrid = [
  "....4444444....",
  "...422222224...",
  "...421111124...",
  "..42111111124..",
  "..43333333334..",
  "..42111111124..",
  "..44411111444..",
  "442222222222244",
  "422111111111224",
  "421151111511124",
  "421151111511124",
  "421111111111124",
  "4ww8888888891 4",
  "4161181611114 4",
  "442111111112244",
  "..44111111144..",
  "..41155511114..",
  "..4115551b114..",
  "..4bb4551bb44..",
  "..444.555.444..",
  "......444......",
];

/** The sector boss: a greatcoat, a red sash, braid on the shoulders. */
const BOSS: PixelGrid = [
  "...4444444444...",
  "..443333333344..",
  "..44444444444 ..",
  "...421111124....",
  "...421111124....",
  "....46666664....",
  "....46767664....",
  ".....477764.....",
  "..44333333344...",
  ".43122222221348.",
  ".43122222221349.",
  ".41122332211148.",
  ".41123322111149.",
  ".41133221111148.",
  ".41332211111124.",
  ".41322111111124.",
  ".41122111111124.",
  ".41112111111124.",
  ".41111111111124.",
  ".44111111111144.",
  "..411114.411114.",
  "..455114.411554.",
  "..4bb414.414bb4.",
  "..4444.....4444.",
];

/**
 * A walk cycle at this size is two frames: weight on one foot, then the other.
 * The passing frame lifts the whole figure a pixel and mirrors the legs from
 * `from` down, which is the cheapest stride that still reads as walking.
 */
function swapLegs(grid: PixelGrid, from: number): PixelGrid {
  return grid.map((row, y) => (y < from ? row : [...row].reverse().join("")));
}

export type UnitArt = { readonly frames: readonly PixelGrid[] };

export const UNITS: Record<string, UnitArt> = {
  officer: { frames: [OFFICER] },
  rifle: { frames: [RIFLE] },
  marks: { frames: [MARKS] },
  drone: { frames: [DRONE_A, DRONE_B] },
  wall: { frames: [WALL] },

  militia: { frames: [MILITIA, lifted(swapLegs(MILITIA, 12))] },
  shield: { frames: [SHIELD, lifted(swapLegs(SHIELD, 15))] },
  gunner: { frames: [GUNNER, lifted(swapLegs(GUNNER, 13))] },
  jug: { frames: [JUG, lifted(swapLegs(JUG, 17))] },
  boss: { frames: [BOSS, lifted(swapLegs(BOSS, 20))] },
};

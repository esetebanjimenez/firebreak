/**
 * palette.ts — the fixed colour set every pixel in the battlefield comes from.
 *
 * Small and flat on purpose, the way a console palette is. Two rules hold the
 * whole look together:
 *
 * 1. **Friend is cool, enemy is warm.** Allies are olive-green with a pale
 *    signal-blue accent; the enemy is rust-brown with a red one. At the size a
 *    unit occupies on screen that hue split is the only thing doing the
 *    friend/foe read, so nothing crosses it.
 * 2. **Everything is outlined in near-black.** The ground is dark, so without a
 *    hard outline a figure dissolves into it — which is exactly what the old
 *    art did.
 */

/** Slots every sprite grid shares, so weapons and skin stay consistent. */
export const SHARED = {
  skin: "#c89a6a",
  skinDark: "#8f6642",
  gun: "#20242a",
  gunLight: "#515a63",
  wood: "#6b4a2c",
  strap: "#30281c",
  boot: "#241e16",
} as const;

/** A kind's ramp: [body, light, accent, outline, shade]. */
export type Ramp = readonly [string, string, string, string, string];

export const RAMPS: Record<string, Ramp> = {
  // --- Yours: olive, with a pale blue signal flash so they read as friendly.
  officer: ["#4d5840", "#6d7a57", "#e0a33a", "#11150f", "#2d3426"],
  rifle: ["#566046", "#78855e", "#9ad6e8", "#11150f", "#333a29"],
  marks: ["#46543c", "#667a4f", "#9ad6e8", "#0f130d", "#2b3324"],
  drone: ["#4a5258", "#747d85", "#7fe3ff", "#0d1012", "#2b3034"],
  wall: ["#8a7b55", "#aa9a6f", "#6f6448", "#171208", "#5d5236"],

  // --- Theirs: rust and red. Warm against your cool line.
  militia: ["#6d4b36", "#916a49", "#d15a42", "#150d08", "#432a1d"],
  shield: ["#6f6246", "#998a63", "#d15a42", "#140e09", "#453c2a"],
  gunner: ["#5b4533", "#7d6245", "#d15a42", "#130c07", "#382717"],
  jug: ["#7c332a", "#a4493a", "#ffcf7a", "#130605", "#4c1c17"],
  boss: ["#3e4250", "#5d6274", "#e2604a", "#0b0c0e", "#242732"],
};

/** Field colours: shots, readouts and anything drawn without a sprite. */
export const FIELD = {
  shadow: "rgba(6,8,6,0.42)",
  outline: "#0e120d",

  tracerAlly: "#ffe9a3",
  tracerMarks: "#cfe8ff",
  tracerStorm: "#a9c8ff",
  tracerEnemy: "#ff9a6a",

  grenade: "#ffd36b",
  fire: "#ff7a32",
  emp: "#9ecbff",
  flash: "#f4f0e4",

  hpAlly: "#8ea36f",
  hpEnemy: "#d15a42",
  hpBoss: "#e0a33a",
  hpBack: "#120e08",

  burn: "#ff7a32",
  blood: "#7a2420",
  spark: "#ffd36b",
  credit: "#e0a33a",
  reticle: "#e0a33a",
} as const;

/**
 * Per-sector ground. Six sectors, six moods — the brief for each one named a
 * place, and the palette is how the place shows up.
 */
export type Terrain = {
  /** Four-step ramp for the ground itself, dark to light. */
  readonly ground: readonly [string, string, string, string];
  /** The worn lane the fight happens in. */
  readonly lane: readonly [string, string];
  /** Scatter: stones, stumps, rubble. */
  readonly debris: readonly [string, string];
  /** Standing scenery drawn with depth sorting. */
  readonly prop: "pine" | "stump" | "burnt" | "reed" | "rubble" | "pillar";
  /** Overall wash laid over the finished field. */
  readonly haze: string;
};

export const TERRAIN: readonly Terrain[] = [
  // Green Belt — a logged wood, still green.
  {
    ground: ["#1b2a1c", "#223425", "#2b402d", "#345036"],
    lane: ["#3a3a25", "#46452c"],
    debris: ["#4a3f2c", "#5d5038"],
    prop: "pine",
    haze: "rgba(120,160,90,0.05)",
  },
  // Wire Country — scrub and wire, the green going out of it.
  {
    ground: ["#1f2718", "#27301d", "#303a23", "#3b462a"],
    lane: ["#40392450", "#4b4229"],
    debris: ["#554a30", "#6b5d3c"],
    prop: "stump",
    haze: "rgba(150,150,90,0.05)",
  },
  // Ash Corridor — a burned highway.
  {
    ground: ["#201c18", "#28231e", "#312a23", "#3b332a"],
    lane: ["#2b2724", "#38322c"],
    debris: ["#4a4038", "#5e5149"],
    prop: "burnt",
    haze: "rgba(180,110,60,0.06)",
  },
  // Black Water — flood plain, standing water.
  {
    ground: ["#151e22", "#1b262a", "#223034", "#2a3b3f"],
    lane: ["#23302f", "#2d3c3a"],
    debris: ["#3c4440", "#4e5753"],
    prop: "reed",
    haze: "rgba(60,110,140,0.07)",
  },
  // Red Sector — an urban kill-box.
  {
    ground: ["#221a18", "#2a201d", "#332724", "#3d2f2a"],
    lane: ["#2e2726", "#3a3230"],
    debris: ["#4e433d", "#655850"],
    prop: "rubble",
    haze: "rgba(180,50,40,0.07)",
  },
  // Throne Line — the avenue, paved and lit by something burning.
  {
    ground: ["#1c1a1f", "#232026", "#2b272e", "#343037"],
    lane: ["#332d2c", "#403836"],
    debris: ["#56504c", "#6c655f"],
    prop: "pillar",
    haze: "rgba(150,40,50,0.09)",
  },
];

export function terrainFor(sectorIndex: number): Terrain {
  return TERRAIN[sectorIndex] ?? TERRAIN[0];
}

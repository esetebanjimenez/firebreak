export type Stats = {
  hp: number;
  regen: number;
  dmg: number;
  radius: number;
  cooldown: number;
  projSpeed: number;
  impact: boolean;
  splitChance: number;
  splitCount: number;
  splitRatio: number;
  everyInc: number;
  incMul: number;
  burnDur: number;
  burnDps: number;
  arty: boolean;
  artyCd: number;
  artyMul: number;
  artyRadius: number;
  artySlow: boolean;
  flash: boolean;
  flashCd: number;
  flashDur: number;
  flashSlow: number;
  emp: boolean;
  empCd: number;
  stormEvery: number;
  stormHits: number;
  stormMul: number;
  rifles: number;
  rifleMul: number;
  marks: number;
  marksMul: number;
  overwatch: boolean;
  walls: number;
  wallHp: number;
  drone: boolean;
  goldFind: number;
  exposureMul: number;
};

export type NodeDef = {
  id: string;
  branch: string;
  name: string;
  blurb: string;
  cost: number;
  req: string[];
  reqAny?: string[];
  apply: (s: Stats) => void;
};

export type Sector = {
  name: string;
  boss: string;
  brief: string;
  mult: number;
  exposure: number;
  time: number;
  power: number;
  interval: number;
  cap: number;
  weights: { militia: number; shield: number; gunner: number; jug: number };
};

export const INK = {
  bg: "#0c100e",
  brass: "#e0a33a",
  fg: "#e7e2d6",
  signal: "#d15a42",
  muted: "#8f9888",
  olive: "#8ea36f",
  haze: "rgba(209,90,66,0.13)",
};

export const BRANCHES: { id: string; name: string; hint: string }[] = [
  { id: "ordnance", name: "Ordnance", hint: "The grenade you aim" },
  { id: "armor", name: "Armor", hint: "Hit points and lifesaving" },
  { id: "frag", name: "Fragments", hint: "Shots that split" },
  { id: "fire", name: "Incendiary", hint: "Every Nth round burns" },
  { id: "arty", name: "Artillery", hint: "Heavy, slow, decisive" },
  { id: "signals", name: "Signals", hint: "Flash and grid strike" },
  { id: "rifles", name: "Rifles", hint: "The line. Weak on armor" },
  { id: "marks", name: "Marksmen", hint: "Reach and cleanup" },
  { id: "fort", name: "Barriers", hint: "Stall, then they fall" },
  { id: "support", name: "Support", hint: "Eyes overhead" },
];

function base(): Stats {
  return {
    hp: 36,
    regen: 0,
    dmg: 13,
    radius: 46,
    cooldown: 0.5,
    projSpeed: 860,
    impact: false,
    splitChance: 0,
    splitCount: 0,
    splitRatio: 0.55,
    everyInc: 0,
    incMul: 2.35,
    burnDur: 3.2,
    burnDps: 5,
    arty: false,
    artyCd: 7.4,
    artyMul: 4.4,
    artyRadius: 82,
    artySlow: false,
    flash: false,
    flashCd: 5.1,
    flashDur: 2.5,
    flashSlow: 0.4,
    emp: false,
    empCd: 6.1,
    stormEvery: 8,
    stormHits: 7,
    stormMul: 1.7,
    rifles: 1,
    rifleMul: 1,
    marks: 0,
    marksMul: 1,
    overwatch: false,
    walls: 0,
    wallHp: 120,
    drone: false,
    goldFind: 1,
    exposureMul: 1,
  };
}

export const NODES: NodeDef[] = [
  { id: "fm1", branch: "ordnance", name: "Fire Mission I", blurb: "Grenade damage up.", cost: 10, req: [], apply: (s) => { s.dmg *= 1.35; } },
  { id: "bore1", branch: "ordnance", name: "Wider Bore", blurb: "Bigger blast. Easier to catch a pack.", cost: 16, req: [], apply: (s) => { s.radius += 14; } },
  { id: "velo", branch: "ordnance", name: "Muzzle Velocity", blurb: "Grenades arrive sooner.", cost: 18, req: [], apply: (s) => { s.projSpeed += 150; } },
  { id: "cycle1", branch: "ordnance", name: "Cyclic I", blurb: "Shorter pause between grenades.", cost: 32, req: ["fm1"], apply: (s) => { s.cooldown *= 0.82; } },
  { id: "fm2", branch: "ordnance", name: "Fire Mission II", blurb: "Grenade damage up again.", cost: 70, req: ["fm1"], apply: (s) => { s.dmg *= 1.4; } },
  { id: "bore2", branch: "ordnance", name: "Wider Bore II", blurb: "Blast radius up.", cost: 160, req: ["bore1"], apply: (s) => { s.radius += 16; } },
  { id: "core", branch: "ordnance", name: "Impact Core", blurb: "The center of the blast hits much harder. Good aim matters.", cost: 180, req: ["bore1"], apply: (s) => { s.impact = true; } },
  { id: "cycle2", branch: "ordnance", name: "Cyclic II", blurb: "Faster cycle.", cost: 700, req: ["cycle1"], apply: (s) => { s.cooldown *= 0.82; } },
  { id: "fm3", branch: "ordnance", name: "Fire Mission III", blurb: "Grenade damage up.", cost: 420, req: ["fm2"], apply: (s) => { s.dmg *= 1.45; } },
  { id: "fm4", branch: "ordnance", name: "Fire Mission IV", blurb: "Grenade damage up.", cost: 4200, req: ["fm3"], apply: (s) => { s.dmg *= 1.4; } },
  { id: "fm5", branch: "ordnance", name: "Fire Mission V", blurb: "Final fire-mission charge.", cost: 22000, req: ["fm4"], apply: (s) => { s.dmg *= 1.35; } },

  { id: "plate1", branch: "armor", name: "Plate I", blurb: "+18 hit points.", cost: 12, req: [], apply: (s) => { s.hp += 18; } },
  { id: "plate2", branch: "armor", name: "Plate II", blurb: "+30 hit points.", cost: 90, req: ["plate1"], apply: (s) => { s.hp += 30; } },
  { id: "plate3", branch: "armor", name: "Plate III", blurb: "+48 hit points.", cost: 640, req: ["plate2"], apply: (s) => { s.hp += 48; } },
  { id: "plate4", branch: "armor", name: "Plate IV", blurb: "+70 hit points.", cost: 8000, req: ["plate3"], apply: (s) => { s.hp += 70; } },
  { id: "plate5", branch: "armor", name: "Plate V", blurb: "+90 hit points.", cost: 36000, req: ["plate4"], apply: (s) => { s.hp += 90; } },
  { id: "life1", branch: "armor", name: "Lifesaver I", blurb: "Slow regen. The answer to light exposure.", cost: 90, req: ["plate1"], apply: (s) => { s.regen += 0.45; } },
  { id: "life2", branch: "armor", name: "Lifesaver II", blurb: "Regen up.", cost: 640, req: ["life1"], apply: (s) => { s.regen += 1.2; } },
  { id: "life3", branch: "armor", name: "Lifesaver III", blurb: "Regen up. Needed once sectors start cooking.", cost: 4800, req: ["life2"], apply: (s) => { s.regen += 2.6; } },
  { id: "life4", branch: "armor", name: "Lifesaver IV", blurb: "Regen up. This is how Throne Line stops being a clock.", cost: 26000, req: ["life3"], apply: (s) => { s.regen += 3.4; } },

  { id: "rico", branch: "frag", name: "Ricochet", blurb: "Grenades sometimes split into two nearby targets.", cost: 80, req: ["fm1"], apply: (s) => { s.splitChance = 0.28; s.splitCount = 2; } },
  { id: "resonant", branch: "frag", name: "Resonant Fragments", blurb: "Splits hit a third target, harder.", cost: 780, req: ["rico"], apply: (s) => { s.splitCount = 3; s.splitRatio = 0.7; } },
  { id: "shrap", branch: "frag", name: "Shrapnel Doctrine", blurb: "Split chance way up.", cost: 9000, req: ["resonant"], apply: (s) => { s.splitChance = 0.5; } },

  { id: "wp", branch: "fire", name: "White Phosphorus", blurb: "Every 7th grenade is incendiary and sets a burn.", cost: 220, req: ["fm2"], apply: (s) => { s.everyInc = 7; } },
  { id: "kindle1", branch: "fire", name: "Kindled Payload", blurb: "Incendiary hits harder and burns hotter.", cost: 480, req: ["wp"], apply: (s) => { s.incMul = 3.3; s.burnDps = 9; } },
  { id: "burn", branch: "fire", name: "Burn Time", blurb: "Burn lasts much longer. Heavies feel it.", cost: 460, req: ["wp"], apply: (s) => { s.burnDur = 5.6; } },
  { id: "kindle2", branch: "fire", name: "Feed the Fire", blurb: "Every 5th grenade is incendiary.", cost: 2400, req: ["kindle1"], apply: (s) => { s.everyInc = 5; } },

  { id: "ffe", branch: "arty", name: "Fire for Effect", blurb: "Call artillery on your aim point. Slow, huge, burning.", cost: 2000, req: [], reqAny: ["wp", "fm3"], apply: (s) => { s.arty = true; } },
  { id: "battery", branch: "arty", name: "Battery Two", blurb: "Artillery comes back faster and wider.", cost: 12000, req: ["ffe"], apply: (s) => { s.artyCd *= 0.68; s.artyRadius += 20; } },
  { id: "danger", branch: "arty", name: "Danger Close", blurb: "Artillery also slows whatever survives.", cost: 28000, req: ["battery"], apply: (s) => { s.artySlow = true; } },

  { id: "flash", branch: "signals", name: "Flash Mortar", blurb: "A second tube. Slows everything in the blast.", cost: 280, req: ["bore1"], apply: (s) => { s.flash = true; } },
  { id: "haze", branch: "signals", name: "Persistent Haze", blurb: "The slow lasts longer and bites harder.", cost: 1100, req: ["flash"], apply: (s) => { s.flashDur = 3.6; s.flashSlow = 0.28; } },
  { id: "grid", branch: "signals", name: "Grid Strike", blurb: "An EMP pulse stuns. Every 8th calls a thunderhead across the pack.", cost: 3600, req: [], reqAny: ["flash", "rico"], apply: (s) => { s.emp = true; } },
  { id: "thunder", branch: "signals", name: "Thunderhead", blurb: "The storm jumps to more targets.", cost: 30000, req: ["grid"], apply: (s) => { s.stormHits = 12; s.stormMul = 2.2; } },

  { id: "sec1", branch: "rifles", name: "Rifle Section", blurb: "+3 riflemen. They mulch militia and get shrugged off by plate.", cost: 28, req: [], apply: (s) => { s.rifles += 3; } },
  { id: "sec2", branch: "rifles", name: "Rifle Section II", blurb: "+4 riflemen, a bit more bite.", cost: 140, req: ["sec1"], apply: (s) => { s.rifles += 4; s.rifleMul *= 1.15; } },
  { id: "secfire", branch: "rifles", name: "Section Fire", blurb: "Rifle damage up. Still poor against juggernauts.", cost: 260, req: ["sec1"], apply: (s) => { s.rifleMul *= 1.3; } },
  { id: "sec3", branch: "rifles", name: "Rifle Section III", blurb: "+4 riflemen. A crowd, not an answer to armor.", cost: 1400, req: ["sec2"], apply: (s) => { s.rifles += 4; s.rifleMul *= 1.15; } },

  { id: "dm1", branch: "marks", name: "Designated Marksmen", blurb: "3 marksmen. Long reach. They pick off gunners your rifles cannot.", cost: 340, req: ["sec1"], apply: (s) => { s.marks += 3; } },
  { id: "dm2", branch: "marks", name: "Marksmen II", blurb: "+2 marksmen and harder hits.", cost: 2800, req: ["dm1"], apply: (s) => { s.marks += 2; s.marksMul *= 1.22; } },
  { id: "over", branch: "marks", name: "Overwatch", blurb: "Marksmen finish the wounded first.", cost: 11000, req: ["dm2"], apply: (s) => { s.overwatch = true; s.marksMul *= 1.15; } },

  { id: "h1", branch: "fort", name: "HESCO I", blurb: "3 barriers. They stall light infantry, then die.", cost: 40, req: [], apply: (s) => { s.walls += 3; } },
  { id: "h2", branch: "fort", name: "HESCO II", blurb: "+2 barriers, tougher fill. Juggernauts still walk through.", cost: 520, req: ["h1"], apply: (s) => { s.walls += 2; s.wallHp *= 1.8; } },
  { id: "h3", branch: "fort", name: "HESCO III", blurb: "+2 barriers. Buys seconds, not a sector.", cost: 3200, req: ["h2"], apply: (s) => { s.walls += 2; s.wallHp *= 1.7; } },

  { id: "drone", branch: "support", name: "Recon Drone", blurb: "A gun-drone orbits you and plinks the nearest threat.", cost: 1200, req: [], reqAny: ["sec1", "fm2"], apply: (s) => { s.drone = true; } },
];

export const SECTORS: Sector[] = [
  { name: "Green Belt", boss: "Road Captain", brief: "Militia in a logged wood. Exposure is a rumor.", mult: 1, exposure: 0.12, time: 44, power: 1, interval: 0.82, cap: 30, weights: { militia: 1, shield: 0, gunner: 0, jug: 0 } },
  { name: "Wire Country", boss: "Wire Warden", brief: "Shields behind the wire. Salvage starts to matter.", mult: 4, exposure: 0.36, time: 46, power: 1.4, interval: 0.72, cap: 34, weights: { militia: 0.68, shield: 0.32, gunner: 0, jug: 0 } },
  { name: "Ash Corridor", boss: "Corridor Lieutenant", brief: "Rockets on a burned highway. Reach matters.", mult: 14, exposure: 1, time: 52, power: 3.1, interval: 0.58, cap: 42, weights: { militia: 0.46, shield: 0.28, gunner: 0.26, jug: 0 } },
  { name: "Black Water", boss: "Siege Breaker", brief: "Juggernauts in the flood plants. Rifles bounce off.", mult: 48, exposure: 2.4, time: 56, power: 5.6, interval: 0.5, cap: 48, weights: { militia: 0.34, shield: 0.22, gunner: 0.22, jug: 0.22 } },
  { name: "Red Sector", boss: "Red Commissar", brief: "Urban kill-box. Their commander shoots back.", mult: 160, exposure: 3.4, time: 60, power: 6.8, interval: 0.56, cap: 42, weights: { militia: 0.26, shield: 0.22, gunner: 0.26, jug: 0.26 } },
  { name: "Throne Line", boss: "Legion Marshal", brief: "The avenue. Exposure is the real enemy.", mult: 520, exposure: 5.0, time: 66, power: 7.4, interval: 0.62, cap: 36, weights: { militia: 0.22, shield: 0.2, gunner: 0.26, jug: 0.32 } },
];

export type EnemyKind = "militia" | "shield" | "gunner" | "jug" | "boss";

export type EnemyBase = {
  hp: number;
  speed: number;
  dmg: number;
  range: number;
  cd: number;
  gold: number;
  radius: number;
  rifleTaken: number;
  marksTaken: number;
  ranged: boolean;
};

export const ENEMIES: Record<Exclude<EnemyKind, "boss">, EnemyBase> = {
  militia: { hp: 34, speed: 50, dmg: 5.5, range: 22, cd: 0.7, gold: 1, radius: 13, rifleTaken: 1, marksTaken: 1, ranged: false },
  shield: { hp: 96, speed: 42, dmg: 8, range: 26, cd: 0.82, gold: 2, radius: 15, rifleTaken: 0.7, marksTaken: 1, ranged: false },
  gunner: { hp: 64, speed: 54, dmg: 7.5, range: 200, cd: 1.05, gold: 3, radius: 13, rifleTaken: 1, marksTaken: 1, ranged: true },
  jug: { hp: 320, speed: 34, dmg: 14, range: 30, cd: 0.95, gold: 7, radius: 18, rifleTaken: 0.28, marksTaken: 0.75, ranged: false },
};

export function bossBase(sector: Sector, index: number): EnemyBase & { mortar: number; mortarDmg: number } {
  const p = sector.power;
  return {
    hp: 280 * p,
    speed: 34,
    dmg: 5.2 * Math.sqrt(p),
    range: 26,
    cd: 0.88,
    gold: 34,
    radius: 18,
    rifleTaken: 0.28,
    marksTaken: 0.7,
    ranged: false,
    mortar: index >= 4 ? (index === 5 ? 2.45 : 3.35) : 0,
    mortarDmg: 6.5 * Math.sqrt(p),
  };
}

export function derive(
  owned: readonly string[],
  k9: "rifle" | "marks" | null,
  radio: "gold" | "exposure" | null,
): Stats {
  const s = base();
  const have = new Set(owned);
  for (const n of NODES) if (have.has(n.id)) n.apply(s);
  if (k9 === "rifle") s.rifleMul *= 1.2;
  if (k9 === "marks") s.marksMul *= 1.15;
  if (radio === "gold") s.goldFind *= 1.12;
  if (radio === "exposure") s.exposureMul *= 0.88;
  return s;
}

export function reqsMet(owned: readonly string[], node: NodeDef): boolean {
  if (node.req.some((id) => !owned.includes(id))) return false;
  if (node.reqAny && node.reqAny.length > 0 && !node.reqAny.some((id) => owned.includes(id))) return false;
  return true;
}

export function nodeById(id: string): NodeDef | undefined {
  return NODES.find((n) => n.id === id);
}

export function formatSalvage(n: number): string {
  const v = Math.floor(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}m`;
  if (v >= 10_000) return `${(v / 1000).toFixed(1)}k`;
  if (v >= 1000) return `${(v / 1000).toFixed(2)}k`;
  return String(v);
}

export function exposureReport(stats: Stats, sector: Sector): { ok: boolean; text: string } {
  const drain = sector.exposure * stats.exposureMul * sector.time;
  const heal = stats.regen * sector.time;
  const net = drain - heal;
  if (net < stats.hp * 0.4) return { ok: true, text: "Exposure is manageable if the line holds." };
  if (net < stats.hp * 0.85) return { ok: true, text: "Exposure will bite. End the fight before it does." };
  return { ok: false, text: "Exposure flatlines you before the clock. Buy plate or a lifesaver." };
}

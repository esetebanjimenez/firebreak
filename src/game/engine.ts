import { tone } from "./audio";
import {
  ENEMIES,
  INK,
  type EnemyKind,
  type Sector,
  type Stats,
  bossBase,
} from "./content";
import type { SpriteMap } from "./sprites";

export type BattleInput = {
  aimX: number;
  aimY: number;
  manual: boolean;
  auto: boolean;
};

export type HudSnap = {
  hp: number;
  maxHp: number;
  exposure: number;
  timeLeft: number;
  boss: boolean;
  bossName: string;
  earned: number;
  ended: "win" | "lose" | null;
  primary: number;
  flash: number;
  emp: number;
  arty: number;
  mode: string;
  alive: number;
};

type Side = "ally" | "enemy";

type Unit = {
  id: number;
  side: Side;
  kind: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  hp: number;
  maxHp: number;
  speed: number;
  dmg: number;
  range: number;
  cd: number;
  cooldown: number;
  radius: number;
  gold: number;
  rifleTaken: number;
  marksTaken: number;
  ranged: boolean;
  dead: boolean;
  dying: number;
  rewarded: boolean;
  respawn: number;
  burnT: number;
  burnDps: number;
  slowT: number;
  slowF: number;
  stunT: number;
  hitT: number;
  orbit: number;
  mortarCd: number;
  mortarEvery: number;
  mortarDmg: number;
};

type Shot = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  speed: number;
  dmg: number;
  radius: number;
  kind: "grenade" | "fire" | "flash" | "emp";
  burn: number;
  slow: number;
  slowF: number;
  stun: number;
  split: boolean;
};

type Boom = {
  x: number;
  y: number;
  t: number;
  max: number;
  dmg: number;
  radius: number;
  burn: number;
  slow: number;
  slowF: number;
  friendly: boolean;
};

type Fx = { x: number; y: number; life: number; max: number; kind: string };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type Floater = { x: number; y: number; text: string; life: number; color: string };
type Tracer = { x1: number; y1: number; x2: number; y2: number; life: number; color: string };

export function worldFor(cssW: number, cssH: number) {
  const portrait = cssH > cssW * 1.05;
  return portrait ? { w: 540, h: 900, portrait: true } : { w: 960, h: 540, portrait: false };
}

export function layout(cssW: number, cssH: number, worldW: number, worldH: number) {
  const scale = Math.min(cssW / worldW, cssH / worldH);
  return { scale, ox: (cssW - worldW * scale) / 2, oy: (cssH - worldH * scale) / 2 };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Engine {
  readonly worldW: number;
  readonly worldH: number;
  readonly portrait: boolean;
  readonly sector: Sector;
  readonly sectorIndex: number;
  readonly stats: Stats;
  sprites: SpriteMap = {};
  reduced: boolean;
  earned = 0;
  timeLeft: number;
  bossUp = false;
  ended: "win" | "lose" | null = null;
  mode = "Hold";
  aimX: number;
  aimY: number;
  private onGold: (n: number) => void;
  private onEnd: (r: { win: boolean; earned: number }) => void;
  private allies: Unit[] = [];
  private enemies: Unit[] = [];
  private officer: Unit;
  private shots: Shot[] = [];
  private booms: Boom[] = [];
  private fx: Fx[] = [];
  private sparks: Spark[] = [];
  private floaters: Floater[] = [];
  private tracers: Tracer[] = [];
  private trees: { x: number; y: number; s: number }[] = [];
  private nextId = 1;
  private spawnAcc = 0;
  private primaryCd = 0.2;
  private flashCd = 0.4;
  private empCd = 0.6;
  private artyCd = 1;
  private shotN = 0;
  private stormCharge = 0;
  private shake = 0;
  private time = 0;
  private bossSpawned = false;
  private forwardX: number;
  private forwardY: number;

  constructor(opts: {
    sector: Sector;
    sectorIndex: number;
    stats: Stats;
    worldW: number;
    worldH: number;
    portrait: boolean;
    reduced: boolean;
    onGold: (n: number) => void;
    onEnd: (r: { win: boolean; earned: number }) => void;
  }) {
    this.sector = opts.sector;
    this.sectorIndex = opts.sectorIndex;
    this.stats = opts.stats;
    this.worldW = opts.worldW;
    this.worldH = opts.worldH;
    this.portrait = opts.portrait;
    this.reduced = opts.reduced;
    this.onGold = opts.onGold;
    this.onEnd = opts.onEnd;
    this.timeLeft = opts.sector.time;
    this.forwardX = opts.portrait ? 0 : 1;
    this.forwardY = opts.portrait ? -1 : 0;
    const ox = opts.portrait ? opts.worldW / 2 : 128;
    const oy = opts.portrait ? opts.worldH - 96 : opts.worldH / 2;
    this.officer = this.makeUnit({
      side: "ally",
      kind: "officer",
      x: ox,
      y: oy,
      hp: opts.stats.hp,
      speed: 0,
      dmg: 0,
      range: 0,
      cd: 99,
      radius: 16,
      gold: 0,
    });
    this.allies.push(this.officer);
    this.aimX = ox + this.forwardX * 180;
    this.aimY = oy + this.forwardY * 180;
    this.deploy();
    this.plantTrees();
  }

  private makeUnit(p: {
    side: Side;
    kind: string;
    x: number;
    y: number;
    hp: number;
    speed: number;
    dmg: number;
    range: number;
    cd: number;
    radius: number;
    gold: number;
    rifleTaken?: number;
    marksTaken?: number;
    ranged?: boolean;
    mortarEvery?: number;
    mortarDmg?: number;
  }): Unit {
    return {
      id: this.nextId++,
      side: p.side,
      kind: p.kind,
      x: p.x,
      y: p.y,
      homeX: p.x,
      homeY: p.y,
      hp: p.hp,
      maxHp: p.hp,
      speed: p.speed,
      dmg: p.dmg,
      range: p.range,
      cd: p.cd,
      cooldown: Math.random() * p.cd,
      radius: p.radius,
      gold: p.gold,
      rifleTaken: p.rifleTaken ?? 1,
      marksTaken: p.marksTaken ?? 1,
      ranged: p.ranged ?? false,
      dead: false,
      dying: 0,
      rewarded: false,
      respawn: 0,
      burnT: 0,
      burnDps: 0,
      slowT: 0,
      slowF: 1,
      stunT: 0,
      hitT: 0,
      orbit: Math.random() * 6,
      mortarCd: p.mortarEvery ? 1.6 : 0,
      mortarEvery: p.mortarEvery ?? 0,
      mortarDmg: p.mortarDmg ?? 0,
    };
  }

  private place(dist: number, lateral: number) {
    return {
      x: this.officer.x + this.forwardX * dist + -this.forwardY * lateral,
      y: this.officer.y + this.forwardY * dist + this.forwardX * lateral,
    };
  }

  private deploy() {
    const s = this.stats;
    const cols = Math.min(4, s.rifles);
    for (let i = 0; i < s.rifles; i++) {
      const rank = Math.floor(i / cols);
      const col = i % cols;
      const p = this.place(86 + rank * 36, (col - (cols - 1) / 2) * 40);
      this.allies.push(
        this.makeUnit({
          side: "ally",
          kind: "rifle",
          ...p,
          hp: 46,
          speed: 0,
          dmg: 7 * s.rifleMul,
          range: 126,
          cd: 0.5,
          radius: 12,
          gold: 0,
        }),
      );
    }
    for (let i = 0; i < s.marks; i++) {
      const p = this.place(46, (i - (s.marks - 1) / 2) * 48);
      this.allies.push(
        this.makeUnit({
          side: "ally",
          kind: "marks",
          ...p,
          hp: 34,
          speed: 0,
          dmg: 13 * s.marksMul,
          range: 290,
          cd: 0.92,
          radius: 11,
          gold: 0,
        }),
      );
    }
    for (let i = 0; i < s.walls; i++) {
      const span = this.portrait ? this.worldW * 0.72 : this.worldH * 0.7;
      const lat = s.walls === 1 ? 0 : -span / 2 + (span / (s.walls - 1)) * i;
      const p = this.place(168, lat);
      this.allies.push(
        this.makeUnit({
          side: "ally",
          kind: "wall",
          ...p,
          hp: s.wallHp,
          speed: 0,
          dmg: 0,
          range: 0,
          cd: 99,
          radius: 20,
          gold: 0,
        }),
      );
    }
    if (s.drone) {
      this.allies.push(
        this.makeUnit({
          side: "ally",
          kind: "drone",
          x: this.officer.x,
          y: this.officer.y,
          hp: 28,
          speed: 0,
          dmg: 6,
          range: 210,
          cd: 0.38,
          radius: 10,
          gold: 0,
        }),
      );
    }
  }

  private plantTrees() {
    const rnd = mulberry32(this.sectorIndex * 97 + 13);
    const count = 16;
    for (let i = 0; i < count; i++) {
      const edge = i % 2 === 0;
      let x: number;
      let y: number;
      if (this.portrait) {
        x = edge ? 18 + rnd() * 70 : this.worldW - 18 - rnd() * 70;
        y = 30 + rnd() * (this.worldH - 80);
      } else {
        y = edge ? 16 + rnd() * 60 : this.worldH - 16 - rnd() * 60;
        x = 40 + rnd() * (this.worldW - 80);
      }
      this.trees.push({ x, y, s: 0.85 + rnd() * 0.35 });
    }
  }

  hud(): HudSnap {
    const s = this.stats;
    const ready = (cd: number, max: number) => (max <= 0 ? -1 : Math.max(0, Math.min(1, 1 - cd / max)));
    return {
      hp: Math.max(0, this.officer.hp),
      maxHp: this.officer.maxHp,
      exposure: this.sector.exposure * s.exposureMul,
      timeLeft: Math.max(0, this.timeLeft),
      boss: this.bossUp,
      bossName: this.sector.boss,
      earned: this.earned,
      ended: this.ended,
      primary: ready(this.primaryCd, s.cooldown),
      flash: s.flash ? ready(this.flashCd, s.flashCd) : -1,
      emp: s.emp ? ready(this.empCd, s.empCd) : -1,
      arty: s.arty ? ready(this.artyCd, s.artyCd) : -1,
      mode: this.mode,
      alive: this.enemies.reduce((n, e) => n + (e.hp > 0 ? 1 : 0), 0),
    };
  }

  retreat() {
    if (!this.ended) this.finish(false);
  }

  private finish(win: boolean) {
    if (this.ended) return;
    this.ended = win ? "win" : "lose";
    tone(win ? "win" : "lose");
    this.onEnd({ win, earned: this.earned });
  }

  step(dt: number, input: BattleInput) {
    if (this.ended) return;
    this.time += dt;
    this.resolveAim(input);
    this.timeLeft -= dt;
    const exposure = this.sector.exposure * this.stats.exposureMul;
    this.officer.hp -= exposure * dt;
    this.officer.hp = Math.min(this.officer.maxHp, this.officer.hp + this.stats.regen * dt);
    this.spawn(dt);
    this.weapons(dt);
    this.moveShots(dt);
    this.detonate(dt);
    this.think(dt);
    this.separate();
    this.status(dt);
    this.reap(dt);
    this.age(dt);
    if (this.bossUp && !this.enemies.some((e) => e.kind === "boss" && e.hp > 0)) this.finish(true);
    else if (this.officer.hp <= 0) this.finish(false);
    this.shake *= Math.pow(0.04, dt);
  }

  private resolveAim(input: BattleInput) {
    if (input.auto) {
      const c = this.bestCluster();
      this.aimX = c.x;
      this.aimY = c.y;
      this.mode = "Auto";
      return;
    }
    if (input.manual) {
      this.aimX = input.aimX;
      this.aimY = input.aimY;
      this.mode = "Manual";
      return;
    }
    const n = this.nearestTo(this.officer, this.enemies, 9999);
    if (n) {
      this.aimX = n.x;
      this.aimY = n.y;
    }
    this.mode = "Hold";
  }

  private living(list: Unit[]) {
    return list.filter((u) => u.hp > 0 && !u.dead);
  }

  private nearestTo(from: { x: number; y: number }, list: Unit[], range: number): Unit | null {
    let best: Unit | null = null;
    let bestD = range;
    for (const u of list) {
      if (u.hp <= 0 || u.dead) continue;
      const d = Math.hypot(u.x - from.x, u.y - from.y);
      if (d <= bestD) {
        bestD = d;
        best = u;
      }
    }
    return best;
  }

  private bestCluster() {
    const list = this.living(this.enemies);
    if (list.length === 0) {
      return { x: this.officer.x + this.forwardX * 200, y: this.officer.y + this.forwardY * 200 };
    }
    const r = this.stats.radius;
    let bestScore = -1;
    let group = [list[0]];
    for (const e of list) {
      let score = 0;
      const g: Unit[] = [];
      for (const o of list) {
        if (Math.hypot(e.x - o.x, e.y - o.y) <= r) {
          score += o.kind === "boss" ? 4 : o.kind === "jug" ? 2.5 : 1;
          g.push(o);
        }
      }
      const dist = Math.hypot(e.x - this.officer.x, e.y - this.officer.y);
      score *= 240 / (90 + dist);
      if (score > bestScore) {
        bestScore = score;
        group = g;
      }
    }
    let x = 0;
    let y = 0;
    for (const m of group) {
      x += m.x;
      y += m.y;
    }
    return { x: x / group.length, y: y / group.length };
  }

  private spawn(dt: number) {
    const alive = this.enemies.reduce((n, e) => n + (e.hp > 0 ? 1 : 0), 0);
    if (!this.bossSpawned && this.timeLeft <= 0) {
      this.bossSpawned = true;
      this.bossUp = true;
      this.spawnBoss();
      this.shake = Math.max(this.shake, 7);
      tone("boom");
    }
    if (alive >= this.sector.cap) return;
    const rush = 1 - Math.max(0, this.timeLeft) / this.sector.time;
    let interval = this.sector.interval * (1 - 0.32 * Math.min(1, rush));
    if (this.time < 2.4) interval *= 1.7;
    if (this.bossUp) interval *= 1.35;
    this.spawnAcc += dt;
    if (this.spawnAcc < interval) return;
    this.spawnAcc = 0;
    this.spawnEnemy(this.pickKind());
  }

  private pickKind(): Exclude<EnemyKind, "boss"> {
    const w = this.sector.weights;
    const bag: Exclude<EnemyKind, "boss">[] = ["militia", "shield", "gunner", "jug"];
    let total = 0;
    for (const k of bag) total += w[k];
    let r = Math.random() * total;
    for (const k of bag) {
      r -= w[k];
      if (r <= 0) return k;
    }
    return "militia";
  }

  private spawnPoint() {
    if (this.portrait) {
      const spread = this.worldW * 0.46;
      return {
        x: this.worldW / 2 - spread / 2 + Math.random() * spread,
        y: -18 - Math.random() * 36,
      };
    }
    const spread = this.worldH * 0.62;
    return {
      x: this.worldW + 12 + Math.random() * 28,
      y: this.worldH / 2 - spread / 2 + Math.random() * spread,
    };
  }

  private spawnEnemy(kind: Exclude<EnemyKind, "boss">) {
    const base = ENEMIES[kind];
    const p = this.sector.power;
    const at = this.spawnPoint();
    const scaled: EnemyBaseScale = {
      ...base,
      hp: base.hp * p,
      dmg: base.dmg * Math.sqrt(p),
    };
    this.enemies.push(this.fromBase(kind, at.x, at.y, scaled, 0, 0));
  }

  private spawnBoss() {
    const b = bossBase(this.sector, this.sectorIndex);
    const at = this.portrait
      ? { x: this.worldW / 2, y: -20 }
      : { x: this.worldW + 10, y: this.worldH / 2 };
    this.enemies.push(this.fromBase("boss", at.x, at.y, b, b.mortar, b.mortarDmg));
  }

  private fromBase(kind: string, x: number, y: number, base: EnemyBaseScale, mortar: number, mortarDmg: number) {
    const mult = this.sector.mult * this.stats.goldFind;
    return this.makeUnit({
      side: "enemy",
      kind,
      x,
      y,
      hp: base.hp,
      speed: base.speed,
      dmg: base.dmg,
      range: base.range,
      cd: base.cd,
      radius: base.radius,
      gold: Math.max(1, Math.round(base.gold * mult)),
      rifleTaken: base.rifleTaken,
      marksTaken: base.marksTaken,
      ranged: base.ranged,
      mortarEvery: mortar,
      mortarDmg,
    });
  }

  private weapons(dt: number) {
    const s = this.stats;
    this.primaryCd -= dt;
    if (this.primaryCd <= 0) {
      this.primaryCd = s.cooldown;
      this.shotN += 1;
      const inc = s.everyInc > 0 && this.shotN % s.everyInc === 0;
      this.shots.push({
        x: this.officer.x,
        y: this.officer.y - 20,
        tx: this.aimX,
        ty: this.aimY,
        speed: s.projSpeed * (inc ? 0.86 : 1),
        dmg: s.dmg * (inc ? s.incMul : 1),
        radius: s.radius * (inc ? 1.22 : 1),
        kind: inc ? "fire" : "grenade",
        burn: inc ? s.burnDps : 0,
        slow: 0,
        slowF: 1,
        stun: 0,
        split: true,
      });
      tone("shot");
    }
    if (s.flash) {
      this.flashCd -= dt;
      if (this.flashCd <= 0) {
        this.flashCd = s.flashCd;
        this.shots.push({
          x: this.officer.x,
          y: this.officer.y - 16,
          tx: this.aimX,
          ty: this.aimY,
          speed: s.projSpeed * 0.8,
          dmg: s.dmg * 0.45,
          radius: s.radius * 1.15,
          kind: "flash",
          burn: 0,
          slow: s.flashDur,
          slowF: s.flashSlow,
          stun: 0,
          split: false,
        });
      }
    }
    if (s.emp) {
      this.empCd -= dt;
      if (this.empCd <= 0) {
        this.empCd = s.empCd;
        this.shots.push({
          x: this.officer.x,
          y: this.officer.y - 16,
          tx: this.aimX,
          ty: this.aimY,
          speed: 640,
          dmg: s.dmg * 0.65,
          radius: 40,
          kind: "emp",
          burn: 0,
          slow: 0,
          slowF: 1,
          stun: 0.85,
          split: false,
        });
      }
    }
    if (s.arty) {
      this.artyCd -= dt;
      if (this.artyCd <= 0) {
        this.artyCd = s.artyCd;
        this.booms.push({
          x: this.aimX,
          y: this.aimY,
          t: 0.7,
          max: 0.7,
          dmg: s.dmg * s.artyMul,
          radius: s.artyRadius,
          burn: s.burnDps * 1.4,
          slow: s.artySlow ? 2.2 : 0,
          slowF: 0.5,
          friendly: false,
        });
        tone("spark");
      }
    }
  }

  private moveShots(dt: number) {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const p = this.shots[i];
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      const step = p.speed * dt;
      if (step >= dist) {
        this.explode(p.tx, p.ty, p);
        this.shots.splice(i, 1);
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
      }
    }
  }

  private explode(x: number, y: number, p: Shot) {
    const hit = this.blast(x, y, p.radius, p.dmg, p.burn, p.slow, p.slowF, p.stun, false, p.kind !== "flash");
    if (p.kind === "emp") {
      this.stormCharge += 1;
      if (this.stormCharge >= this.stats.stormEvery) {
        this.stormCharge = 0;
        this.thunder(x, y);
      }
    }
    if (p.split && this.stats.splitChance > 0 && Math.random() < this.stats.splitChance) {
      const rest = this.living(this.enemies)
        .filter((e) => Math.hypot(e.x - x, e.y - y) > 8)
        .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
        .slice(0, this.stats.splitCount);
      for (const e of rest) {
        this.hurt(e, p.dmg * this.stats.splitRatio, false);
        this.tracers.push({ x1: x, y1: y, x2: e.x, y2: e.y, life: 0.12, color: INK.brass });
      }
    }
    const fxKind = p.kind === "fire" ? "fx-fire" : p.kind === "emp" ? "fx-shock" : p.kind === "flash" ? "fx-flash" : "fx-grenade";
    this.fx.push({ x, y, life: 0.28, max: 0.28, kind: fxKind });
    this.burst(x, y, p.kind === "emp" ? INK.fg : p.kind === "flash" ? INK.fg : INK.brass, 8);
    if (p.kind === "fire") tone("boom");
    void hit;
  }

  private thunder(x: number, y: number) {
    const targets = this.living(this.enemies)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
      .slice(0, this.stats.stormHits);
    for (const e of targets) {
      this.hurt(e, this.stats.dmg * this.stats.stormMul, false);
      e.stunT = Math.max(e.stunT, 0.7);
      this.tracers.push({ x1: x, y1: y, x2: e.x, y2: e.y, life: 0.18, color: "#d7e4ff" });
    }
    this.shake = Math.max(this.shake, 5);
    tone("spark");
  }

  private blast(
    x: number,
    y: number,
    radius: number,
    dmg: number,
    burn: number,
    slow: number,
    slowF: number,
    stun: number,
    friendly: boolean,
    centerBonus: boolean,
  ) {
    const list = friendly ? this.allies : this.enemies;
    let n = 0;
    for (const u of list) {
      if (u.hp <= 0 || u.dead) continue;
      if (!friendly && u.kind === "wall") continue;
      const d = Math.hypot(u.x - x, u.y - y);
      if (d > radius + u.radius * 0.25) continue;
      let amount = dmg;
      if (centerBonus && this.stats.impact && d < radius * 0.4) amount *= 1.65;
      this.hurt(u, amount, centerBonus && d < radius * 0.4);
      if (burn > 0) {
        u.burnT = Math.max(u.burnT, this.stats.burnDur);
        u.burnDps = Math.max(u.burnDps, burn);
      }
      if (slow > 0) {
        u.slowT = Math.max(u.slowT, slow);
        u.slowF = Math.min(u.slowF, slowF);
      }
      if (stun > 0) u.stunT = Math.max(u.stunT, stun);
      n += 1;
    }
    return n;
  }

  private hurt(u: Unit, amount: number, crit: boolean) {
    if (u.hp <= 0 || u.dead || amount <= 0) return;
    u.hp -= amount;
    u.hitT = 0.08;
    if (this.floaters.length < 28) {
      this.floaters.push({
        x: u.x + (Math.random() * 10 - 5),
        y: u.y - 28,
        text: String(Math.max(1, Math.round(amount))),
        life: 0.55,
        color: crit ? INK.brass : INK.fg,
      });
    }
    if (u.kind === "officer") {
      tone("hurt");
      this.shake = Math.max(this.shake, 3);
    }
  }

  private detonate(dt: number) {
    for (let i = this.booms.length - 1; i >= 0; i--) {
      const b = this.booms[i];
      b.t -= dt;
      if (b.t > 0) continue;
      this.blast(b.x, b.y, b.radius, b.dmg, b.burn, b.slow, b.slowF, 0, b.friendly, false);
      this.fx.push({ x: b.x, y: b.y, life: 0.38, max: 0.38, kind: b.friendly ? "fx-shock" : "fx-fire" });
      this.burst(b.x, b.y, b.friendly ? INK.signal : INK.brass, 14);
      this.shake = Math.max(this.shake, b.friendly ? 4 : 6);
      tone("boom");
      this.booms.splice(i, 1);
    }
  }

  private think(dt: number) {
    const enemies = this.living(this.enemies);
    for (const u of this.allies) {
      if (u.dead) {
        if (u.kind === "wall" || u.kind === "officer") continue;
        u.respawn -= dt;
        if (u.respawn <= 0) {
          u.dead = false;
          u.hp = u.maxHp;
          u.x = u.homeX;
          u.y = u.homeY;
        }
        continue;
      }
      if (u.hp <= 0) continue;
      if (u.kind === "drone") {
        u.orbit += dt * 1.4;
        u.x = this.officer.x + Math.cos(u.orbit) * 78;
        u.y = this.officer.y + Math.sin(u.orbit) * 48;
      }
      if (u.dmg <= 0 || u.range <= 0) continue;
      if (u.stunT > 0) continue;
      u.cooldown -= dt;
      const target = this.pickTarget(u, enemies);
      if (!target || u.cooldown > 0) continue;
      u.cooldown = u.cd;
      let dmg = u.dmg;
      if (u.kind === "rifle" || u.kind === "drone") dmg *= target.rifleTaken;
      if (u.kind === "marks") dmg *= target.marksTaken;
      this.hurt(target, dmg, false);
      this.tracers.push({
        x1: u.x,
        y1: u.y - 16,
        x2: target.x,
        y2: target.y - 12,
        life: 0.07,
        color: u.kind === "marks" ? INK.fg : INK.olive,
      });
    }

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (e.stunT > 0) continue;
      const speedMul = e.slowT > 0 ? e.slowF : 1;
      const target = this.nearestTo(e, this.allies, e.range);
      if (target) {
        e.cooldown -= dt;
        if (e.cooldown <= 0) {
          e.cooldown = e.cd;
          this.hurt(target, e.dmg, false);
          this.tracers.push({
            x1: e.x,
            y1: e.y - 12,
            x2: target.x,
            y2: target.y - 10,
            life: 0.06,
            color: INK.signal,
          });
        }
      } else {
        const dx = this.officer.x - e.x;
        const dy = this.officer.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        e.x += (dx / d) * e.speed * speedMul * dt;
        e.y += (dy / d) * e.speed * speedMul * dt;
      }
      if (e.mortarEvery > 0) {
        e.mortarCd -= dt;
        if (e.mortarCd <= 0) {
          e.mortarCd = e.mortarEvery;
          this.booms.push({
            x: this.officer.x + (Math.random() * 30 - 15),
            y: this.officer.y + (Math.random() * 24 - 12),
            t: 0.75,
            max: 0.75,
            dmg: e.mortarDmg,
            radius: 52,
            burn: 0,
            slow: 0,
            slowF: 1,
            friendly: true,
          });
        }
      }
    }
  }

  private pickTarget(u: Unit, enemies: Unit[]): Unit | null {
    let best: Unit | null = null;
    let bestScore = Infinity;
    for (const e of enemies) {
      const d = Math.hypot(e.x - u.x, e.y - u.y);
      if (d > u.range) continue;
      const score = u.kind === "marks" && this.stats.overwatch ? e.hp / e.maxHp : d;
      if (score < bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  }

  private separate() {
    const list = this.enemies;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.hp <= 0) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (b.hp <= 0) continue;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const min = a.radius + b.radius;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 < 0.01) continue;
        const d = Math.sqrt(d2);
        const push = (min - d) * 0.4;
        dx /= d;
        dy /= d;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }
    }
  }

  private status(dt: number) {
    const all = this.allies.concat(this.enemies);
    for (const u of all) {
      if (u.hp <= 0 || u.dead) continue;
      if (u.burnT > 0) {
        u.burnT -= dt;
        this.hurt(u, u.burnDps * dt, false);
      }
      if (u.slowT > 0) {
        u.slowT -= dt;
        if (u.slowT <= 0) u.slowF = 1;
      }
      if (u.stunT > 0) u.stunT -= dt;
      if (u.hitT > 0) u.hitT -= dt;
    }
  }

  private reap(dt: number) {
    const next: Unit[] = [];
    for (const e of this.enemies) {
      if (e.hp <= 0) {
        if (!e.rewarded) {
          e.rewarded = true;
          e.dying = 0.32;
          this.earned += e.gold;
          this.onGold(e.gold);
          if (this.floaters.length < 28) {
            this.floaters.push({ x: e.x, y: e.y - 36, text: `+${e.gold}`, life: 0.7, color: INK.brass });
          }
        } else e.dying -= dt;
        if (e.dying <= 0) continue;
      }
      next.push(e);
    }
    this.enemies = next;
    for (const a of this.allies) {
      if (a.hp <= 0 && !a.dead && a.kind !== "officer") {
        a.dead = true;
        a.respawn = a.kind === "wall" ? 1e9 : a.kind === "drone" ? 6 : 9;
      }
    }
  }

  private age(dt: number) {
    this.fx = this.fx.filter((f) => (f.life -= dt) > 0);
    this.sparks = this.sparks.filter((s) => {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      return s.life > 0;
    });
    this.floaters = this.floaters.filter((f) => (f.life -= dt) > 0);
    this.tracers = this.tracers.filter((t) => (t.life -= dt) > 0);
  }

  private burst(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n && this.sparks.length < 90; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 30 + Math.random() * 80;
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.25 + Math.random() * 0.2, color });
    }
  }

  draw(ctx: CanvasRenderingContext2D, cssW: number, cssH: number, dpr: number) {
    const { scale, ox, oy } = layout(cssW, cssH, this.worldW, this.worldH);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
    ctx.imageSmoothingEnabled = false;
    const shake = this.reduced ? 0 : this.shake;
    if (shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    const ground = this.sprites.ground;
    if (ground) {
      for (let y = 0; y < this.worldH; y += ground.height) {
        for (let x = 0; x < this.worldW; x += ground.width) ctx.drawImage(ground, x, y);
      }
    } else {
      ctx.fillStyle = "#121712";
      ctx.fillRect(0, 0, this.worldW, this.worldH);
    }
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    if (this.portrait) ctx.fillRect(this.worldW * 0.3, 0, this.worldW * 0.4, this.worldH);
    else ctx.fillRect(0, this.worldH * 0.3, this.worldW, this.worldH * 0.4);
    const tints = [
      "rgba(70,90,40,0.12)",
      "rgba(0,0,0,0.06)",
      "rgba(80,40,16,0.14)",
      "rgba(10,20,40,0.16)",
      "rgba(120,20,16,0.14)",
      "rgba(90,10,10,0.2)",
    ];
    ctx.fillStyle = tints[this.sectorIndex] ?? tints[0];
    ctx.fillRect(0, 0, this.worldW, this.worldH);

    const tree = this.sprites.tree;
    if (tree) {
      for (const t of this.trees) {
        const w = tree.width * t.s;
        const h = tree.height * t.s;
        ctx.drawImage(tree, t.x - w / 2, t.y - h, w, h);
      }
    }

    for (const b of this.booms) {
      const k = 1 - b.t / b.max;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.strokeStyle = b.friendly ? INK.signal : INK.brass;
      ctx.globalAlpha = 0.35 + 0.4 * k;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const drawables = this.allies
      .filter((u) => !u.dead)
      .concat(this.enemies)
      .sort((a, b) => a.y - b.y);
    for (const u of drawables) this.drawUnit(ctx, u);

    for (const p of this.shots) {
      ctx.fillStyle = p.kind === "fire" ? "#ff7a32" : p.kind === "emp" ? "#9ecbff" : p.kind === "flash" ? "#f4f0e4" : INK.brass;
      ctx.fillRect(p.x - 2, p.y - 2, 5, 5);
    }
    for (const t of this.tracers) {
      ctx.globalAlpha = Math.max(0, t.life / 0.12);
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(t.x1, t.y1);
      ctx.lineTo(t.x2, t.y2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const f of this.fx) {
      const img = this.sprites[f.kind];
      const a = Math.max(0, f.life / f.max);
      ctx.globalAlpha = a;
      if (img) {
        const s = 64 + (1 - a) * 20;
        ctx.drawImage(img, f.x - s / 2, f.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    }
    for (const s of this.sparks) {
      ctx.globalAlpha = Math.max(0, s.life * 3);
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, 2, 2);
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.arc(this.aimX, this.aimY, this.stats.radius, 0, Math.PI * 2);
    ctx.strokeStyle = INK.brass;
    ctx.globalAlpha = 0.75;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    if (this.stats.impact) {
      ctx.beginPath();
      ctx.arc(this.aimX, this.aimY, this.stats.radius * 0.4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = INK.brass;
    ctx.fillRect(this.aimX - 1, this.aimY - 6, 2, 12);
    ctx.fillRect(this.aimX - 6, this.aimY - 1, 12, 2);

    ctx.font = "12px 'IBM Plex Sans', sans-serif";
    ctx.textAlign = "center";
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.max(0, f.life * 1.6);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y - (0.55 - f.life) * 18);
    }
    ctx.globalAlpha = 1;

    if (this.officer.hp / this.officer.maxHp < 0.35) {
      ctx.fillStyle = "rgba(209,90,66,0.16)";
      ctx.fillRect(0, 0, this.worldW, this.worldH);
    }
  }

  private drawUnit(ctx: CanvasRenderingContext2D, u: Unit) {
    const bob = this.reduced ? 0 : Math.sin(this.time * 6 + u.id) * (u.side === "enemy" ? 1 : 0.5);
    const img = this.sprites[u.kind];
    ctx.globalAlpha = u.hp <= 0 ? Math.max(0, u.dying / 0.32) : 1;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(u.x, u.y, u.radius, u.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = u.side === "ally" ? INK.olive : INK.signal;
    ctx.fillRect(u.x - 6, u.y + 1, 12, 2);
    if (img && u.kind !== "officer") {
      ctx.drawImage(img, Math.round(u.x - img.width / 2), Math.round(u.y - img.height + bob));
    } else if (img && u.kind === "officer") {
      ctx.drawImage(img, Math.round(u.x - img.width / 2), Math.round(u.y - img.height + bob));
    } else {
      ctx.fillStyle = u.side === "ally" ? INK.olive : INK.signal;
      ctx.fillRect(u.x - 8, u.y - 22, 16, 22);
    }
    if (u.hitT > 0) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#fff";
      ctx.fillRect(u.x - 10, u.y - 24, 20, 20);
    }
    ctx.globalAlpha = u.hp <= 0 ? Math.max(0, u.dying / 0.32) : 1;
    if (u.hp > 0 && u.hp < u.maxHp && u.kind !== "officer") {
      const w = u.kind === "boss" ? 36 : 22;
      const h = 3;
      const x = u.x - w / 2;
      const y = u.y - (img ? img.height : 26) - 6;
      ctx.fillStyle = "#1a140c";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = u.side === "ally" ? INK.olive : INK.signal;
      ctx.fillRect(x, y, w * Math.max(0, u.hp / u.maxHp), h);
    }
    if (u.burnT > 0 && u.hp > 0) {
      ctx.fillStyle = "#ff7a32";
      ctx.fillRect(u.x - 2, u.y - 8, 3, 3);
    }
    ctx.globalAlpha = 1;
  }
}

type EnemyBaseScale = {
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

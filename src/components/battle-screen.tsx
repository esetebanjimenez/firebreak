import { useEffect, useRef, useState } from "react";
import { unlockAudio } from "@/game/audio";
import { SECTORS, derive, formatSalvage } from "@/game/content";
import { Engine, layout, worldFor, type HudSnap } from "@/game/engine";
import { getSprites, type SpriteMap } from "@/game/sprites";
import { useGame } from "@/game/store";

export function Battle({ sectorIndex, onEnd }: { sectorIndex: number; onEnd: (r: { win: boolean; earned: number }) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const auto = useGame((s) => s.auto);
  const setAuto = useGame((s) => s.setAuto);
  const addSalvage = useGame((s) => s.addSalvage);
  const noteClear = useGame((s) => s.noteClear);
  const owned = useGame((s) => s.owned);
  const k9 = useGame((s) => s.k9);
  const radio = useGame((s) => s.radio);
  const [hud, setHud] = useState<HudSnap | null>(null);
  const [armed, setArmed] = useState(false);
  const input = useRef({ aimX: 0, aimY: 0, manual: false, auto: false });
  const ended = useRef(false);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    input.current.auto = auto;
  }, [auto]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const world = worldFor(window.innerWidth, Math.max(280, window.innerHeight - 156));
    const stats = derive(owned, k9, radio);
    const sprites: SpriteMap = {};
    const engine = new Engine({
      sector: SECTORS[sectorIndex],
      sectorIndex,
      stats,
      worldW: world.w,
      worldH: world.h,
      portrait: world.portrait,
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      onGold: (n) => addSalvage(n),
      onEnd: (r) => {
        if (ended.current) return;
        ended.current = true;
        if (r.win) noteClear(sectorIndex);
        onEnd(r);
      },
    });
    engine.sprites = sprites;
    engineRef.current = engine;
    void getSprites().then((loaded) => {
      Object.assign(sprites, loaded);
    });
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    /**
     * The canvas backing store must be exactly the device's pixels, or the
     * browser rescales it on the way to the screen and the art grid goes soft
     * again — which is what a 2.5 cap did on a 3x phone: blocks snapped to
     * whole backing pixels, then got resampled by 1.2 anyway. Capped at 3
     * because beyond that the pixel count stops buying anything.
     */
    const renderDpr = () => Math.min(window.devicePixelRatio || 1, 3);
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let hudAcc = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;
      hudAcc += dt;
      while (acc >= 1 / 60) {
        engine.step(1 / 60, input.current);
        acc -= 1 / 60;
      }
      const cssW = canvas.clientWidth || 320;
      const cssH = canvas.clientHeight || 320;
      const dpr = renderDpr();
      const bw = Math.floor(cssW * dpr);
      const bh = Math.floor(cssH * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) engine.draw(ctx, cssW, cssH, dpr);
      if (hudAcc > 0.12) {
        hudAcc = 0;
        setHud(engine.hud());
      }
      if (!ended.current) raf = requestAnimationFrame(loop);
    };
    const point = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      // Same dpr the draw path uses, or the snapped scale here would not match
      // the one on screen and the aim point would drift from the cursor.
      const box = layout(rect.width, rect.height, world.w, world.h, renderDpr());
      let x = (clientX - rect.left - box.ox) / box.scale;
      let y = (clientY - rect.top - box.oy) / box.scale;
      if (coarse) y -= 88;
      input.current.aimX = Math.max(12, Math.min(world.w - 12, x));
      input.current.aimY = Math.max(12, Math.min(world.h - 12, y));
      input.current.manual = true;
    };
    const down = (e: PointerEvent) => {
      unlockAudio();
      canvas.setPointerCapture(e.pointerId);
      point(e.clientX, e.clientY);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.buttons > 0) point(e.clientX, e.clientY);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") input.current.manual = false;
    };
    const leave = () => {
      input.current.manual = false;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(loop);
    setHud(engine.hud());
    return () => {
      cancelAnimationFrame(raf);
      engineRef.current = null;
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("pointerleave", leave);
    };
    // Doctrine is snapshotted when the fight starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectorIndex]);

  const pct = hud ? Math.max(0, Math.min(1, hud.hp / hud.maxHp)) : 1;
  const sector = SECTORS[sectorIndex];

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="safe-top shrink-0 border-b border-line bg-bg px-3 py-2">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="font-display text-xl leading-none">{Math.ceil(hud?.hp ?? 0)} HP</span>
          <span className={`font-display text-xl leading-none ${hud?.boss ? "text-signal" : "text-brass"}`}>
            {hud?.boss ? hud.bossName : `${Math.ceil(hud?.timeLeft ?? sector.time)}s`}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-sm bg-surface-2">
          <div className={`h-full ${pct < 0.35 ? "bg-signal" : "bg-brass"}`} style={{ width: `${pct * 100}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
          <span>Exposure {reportLabel(hud?.exposure ?? sector.exposure)}/s</span>
          <span className="text-brass">+{formatSalvage(hud?.earned ?? 0)}</span>
          <span>{hud?.mode ?? "Hold"}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Pips hud={hud} />
          <button
            className={`min-h-11 flex-1 rounded-md border font-display text-lg ${auto ? "border-brass bg-brass text-brass-ink" : "border-line bg-surface text-fg"}`}
            aria-pressed={auto}
            onClick={() => setAuto(!auto)}
          >
            Auto
          </button>
          <button
            className="min-h-11 flex-1 rounded-md border border-line bg-surface font-display text-lg text-signal"
            onClick={() => {
              if (!armed) {
                setArmed(true);
                window.setTimeout(() => setArmed(false), 1800);
                return;
              }
              engineRef.current?.retreat();
            }}
          >
            {armed ? "Confirm" : "Retreat"}
          </button>
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" onContextMenu={(e) => e.preventDefault()} />
      </div>
    </div>
  );
}

function Pips({ hud }: { hud: HudSnap | null }) {
  const items = [
    { name: "Gren", v: hud?.primary ?? 0 },
    { name: "Flash", v: hud?.flash ?? -1 },
    { name: "Grid", v: hud?.emp ?? -1 },
    { name: "Arty", v: hud?.arty ?? -1 },
  ].filter((item) => item.v >= 0);
  return (
    <div className="flex gap-2">
      {items.map((item) => (
        <span key={item.name} className="w-10">
          <span className="block text-xs uppercase text-muted">{item.name}</span>
          <span className="mt-1 block h-1 overflow-hidden rounded-sm bg-surface-2">
            <span className="block h-full bg-brass" style={{ width: `${item.v * 100}%` }} />
          </span>
        </span>
      ))}
    </div>
  );
}

function reportLabel(n: number) {
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

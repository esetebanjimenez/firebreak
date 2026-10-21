import { lazy, Suspense, useEffect, useState } from "react";
import Box from "lucide-react/dist/esm/icons/box.js";
import Check from "lucide-react/dist/esm/icons/check.js";
import Crosshair from "lucide-react/dist/esm/icons/crosshair.js";
import Dog from "lucide-react/dist/esm/icons/dog.js";
import Flame from "lucide-react/dist/esm/icons/flame.js";
import Radio from "lucide-react/dist/esm/icons/radio.js";
import Shield from "lucide-react/dist/esm/icons/shield.js";
import Target from "lucide-react/dist/esm/icons/target.js";
import Users from "lucide-react/dist/esm/icons/users.js";
import Volume2 from "lucide-react/dist/esm/icons/volume-2.js";
import VolumeX from "lucide-react/dist/esm/icons/volume-x.js";
import Zap from "lucide-react/dist/esm/icons/zap.js";
import { setMuted, tone, unlockAudio } from "@/game/audio";
import {
  BRANCHES,
  NODES,
  SECTORS,
  derive,
  exposureReport,
  formatSalvage,
  reqsMet,
  type NodeDef,
} from "@/game/content";
import { useGame } from "@/game/store";

const Battle = lazy(() => import("./battle-screen").then((m) => ({ default: m.Battle })));

type Screen = "title" | "hq" | "battle" | "debrief" | "k9" | "radio";

const BRANCH_ICON = {
  ordnance: Crosshair,
  armor: Shield,
  frag: Target,
  fire: Flame,
  arty: Flame,
  signals: Zap,
  rifles: Users,
  marks: Crosshair,
  fort: Box,
  support: Radio,
} as const;

export function Firebreak() {
  useEffect(() => {
    const finish = () => {
      document.querySelectorAll('link[rel="stylesheet"][media="print"]').forEach((node) => {
        if (node instanceof HTMLLinkElement && node.href.includes("fonts.googleapis.com")) node.media = "all";
      });
      const fill = document.querySelector("#boot .boot-fill");
      if (fill instanceof HTMLElement) {
        fill.style.animation = "none";
        fill.style.width = "100%";
      }
      const status = document.getElementById("boot-status");
      if (status) status.textContent = "On the line";
      const track = document.getElementById("boot-fill");
      track?.setAttribute("aria-valuenow", "100");
      window.setTimeout(() => document.getElementById("boot")?.remove(), 280);
    };
    let unsub = () => {};
    let backup = 0;
    if (useGame.persist.hasHydrated()) finish();
    else {
      unsub = useGame.persist.onFinishHydration(() => finish());
      backup = window.setTimeout(finish, 1200);
    }
    const warm = window.setTimeout(() => {
      void import("./battle-screen");
    }, 400);
    return () => {
      unsub();
      window.clearTimeout(backup);
      window.clearTimeout(warm);
    };
  }, []);
  return <Shell />;
}

function Shell() {
  const [screen, setScreen] = useState<Screen>("title");
  const [sector, setSector] = useState(0);
  const [result, setResult] = useState<{ win: boolean; earned: number; index: number } | null>(null);
  const muted = useGame((s) => s.muted);
  useEffect(() => setMuted(muted), [muted]);

  return (
    <div className="h-dvh overflow-hidden bg-bg text-fg">
      {screen === "title" && (
        <Title
          onDeploy={() => {
            unlockAudio();
            setSector(0);
            setScreen("battle");
          }}
          onHq={() => {
            unlockAudio();
            setScreen("hq");
          }}
        />
      )}
      {screen === "hq" && (
        <Hq
          onDeploy={(index) => {
            unlockAudio();
            setSector(index);
            setScreen("battle");
          }}
        />
      )}
      {screen === "battle" && (
        <Suspense fallback={<Deploying />}>
          <Battle
            sectorIndex={sector}
            onEnd={(r) => {
              setResult({ ...r, index: sector });
              setScreen("debrief");
            }}
          />
        </Suspense>
      )}
      {screen === "debrief" && result && (
        <Debrief
          result={result}
          onNext={() => {
            const g = useGame.getState();
            if (result.win && result.index === 1 && !g.k9) setScreen("k9");
            else if (result.win && result.index === 3 && !g.radio) setScreen("radio");
            else setScreen("hq");
          }}
        />
      )}
      {screen === "k9" && <K9 onDone={() => setScreen("hq")} />}
      {screen === "radio" && <RadioEvent onDone={() => setScreen("hq")} />}
    </div>
  );
}


function Deploying() {
  return (
    <main className="boot-screen">
      <div className="boot-panel">
        <p className="font-display text-5xl tracking-wide">FIREBREAK</p>
        <div className="boot-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-label="Deploying">
          <div className="boot-fill boot-fill-run" />
        </div>
        <p className="boot-status">Deploying</p>
      </div>
    </main>
  );
}

function Title({ onDeploy, onHq }: { onDeploy: () => void; onHq: () => void }) {
  const salvage = useGame((s) => s.salvage);
  const cleared = useGame((s) => s.cleared);
  const owned = useGame((s) => s.owned.length);
  const muted = useGame((s) => s.muted);
  const setMutedFlag = useGame((s) => s.setMuted);
  const reset = useGame((s) => s.reset);
  const returning = salvage > 0 || cleared > 0 || owned > 0;

  return (
    <main className="safe-top safe-bot mx-auto flex h-dvh max-w-md flex-col px-5 py-6">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm tracking-widest text-muted">HOLD THE SECTOR</p>
        <button
          className="grid h-11 w-11 place-items-center rounded-md border border-line bg-surface"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => setMutedFlag(!muted)}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-4">
        <h1 className="font-display text-6xl leading-none tracking-wide text-fg">FIREBREAK</h1>
        <p className="mt-3 max-w-sm text-base text-muted">
          You are the fire-support officer. Aim the grenades. The squad fights on its own. Salvage is permanent.
        </p>
        <ul className="mt-6 space-y-3 text-sm">
          <li>
            <span className="text-brass">Aim. </span>
            <span className="text-fg">Rounds take a moment to land. A bought Impact Core makes the center hit harder.</span>
          </li>
          <li>
            <span className="text-brass">The line. </span>
            <span className="text-fg">Rifles chew militia and bounce off armor. Marksmen reach the rocket teams.</span>
          </li>
          <li>
            <span className="text-brass">Exposure. </span>
            <span className="text-fg">The haze drains you the whole fight. Hotter sectors pay more and kill you faster.</span>
          </li>
        </ul>
      </div>
      <div className="flex shrink-0 flex-col gap-3">
        {returning ? (
          <button className="btn-primary" onClick={onHq}>Return to HQ</button>
        ) : (
          <button className="btn-primary" onClick={onDeploy}>Deploy Green Belt</button>
        )}
        {returning ? (
          <button
            className="btn-ghost"
            onClick={() => {
              if (window.confirm("Abandon this operation? Salvage and doctrine are wiped.")) reset();
            }}
          >
            Abandon operation
          </button>
        ) : (
          <button className="btn-ghost" onClick={onHq}>Open doctrine first</button>
        )}
      </div>
    </main>
  );
}

function reportLabel(n: number) {
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

function Hq({ onDeploy }: { onDeploy: (index: number) => void }) {
  const salvage = useGame((s) => s.salvage);
  const owned = useGame((s) => s.owned);
  const cleared = useGame((s) => s.cleared);
  const k9 = useGame((s) => s.k9);
  const radio = useGame((s) => s.radio);
  const buy = useGame((s) => s.buy);
  const auto = useGame((s) => s.auto);
  const setAuto = useGame((s) => s.setAuto);
  const muted = useGame((s) => s.muted);
  const setMutedFlag = useGame((s) => s.setMuted);
  const frontier = Math.min(cleared, SECTORS.length - 1);
  const [sel, setSel] = useState(frontier);
  const stats = derive(owned, k9, radio);
  const sector = SECTORS[sel];
  const report = exposureReport(stats, sector);

  return (
    <main className="safe-top mx-auto flex h-dvh max-w-6xl flex-col overflow-y-auto">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="font-display text-2xl leading-none tracking-wide">FIREBREAK</p>
          <p className="text-sm text-muted">{formatSalvage(salvage)} salvage</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`min-h-11 rounded-md border px-3 font-display text-lg ${auto ? "border-brass bg-brass text-brass-ink" : "border-line bg-surface text-fg"}`}
            aria-pressed={auto}
            onClick={() => setAuto(!auto)}
          >
            Auto aim
          </button>
          <button
            className="grid h-11 w-11 place-items-center rounded-md border border-line bg-surface"
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={() => setMutedFlag(!muted)}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </header>

      {cleared >= SECTORS.length && (
        <p className="border-b border-line bg-surface px-4 py-3 text-sm text-brass">
          The legion is broken. Sectors stay open if the doctrine is not finished.
        </p>
      )}

      <div className="border-b border-line px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SECTORS.map((s, i) => {
            const locked = i > cleared;
            const on = i === sel;
            return (
              <button
                key={s.name}
                disabled={locked}
                onClick={() => setSel(i)}
                className={`min-h-11 shrink-0 rounded-md border px-3 text-left ${on ? "border-brass bg-surface-2" : "border-line bg-surface"} disabled:opacity-40`}
              >
                <span className="block font-display text-lg leading-none">{s.name}</span>
                <span className="text-xs text-muted">
                  {i < cleared ? "Held" : i === cleared ? "Open" : "Locked"} · x{s.mult}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-fg">{sector.brief}</p>
        <p className="mt-1 text-sm text-muted">
          {sector.boss} · {sector.time}s · exposure {reportLabel(sector.exposure * stats.exposureMul)}/s · x{sector.mult} salvage
        </p>
        <p className={`mt-1 text-sm ${report.ok ? "text-muted" : "text-signal"}`}>{report.text}</p>
        <button
          className="btn-primary mt-3 w-full"
          onClick={() => {
            tone("ui");
            onDeploy(sel);
          }}
        >
          Deploy {sector.name}
        </button>
      </div>

      <div className="safe-bot min-h-80">
        <div className="flex h-96 gap-3 px-4 py-3">
          {BRANCHES.map((branch) => {
            const Icon = BRANCH_ICON[branch.id as keyof typeof BRANCH_ICON];
            const nodes = NODES.filter((n) => n.branch === branch.id);
            return (
              <section key={branch.id} className="flex h-full w-56 shrink-0 flex-col">
                <header className="mb-2 flex items-center gap-2">
                  <Icon size={16} className="text-brass" />
                  <div>
                    <h2 className="font-display text-xl leading-none">{branch.name}</h2>
                    <p className="text-xs text-muted">{branch.hint}</p>
                  </div>
                </header>
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-4">
                  {nodes.map((node) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      salvage={salvage}
                      owned={owned}
                      onBuy={() => {
                        tone("ui");
                        buy(node.id);
                      }}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function NodeCard({
  node,
  salvage,
  owned,
  onBuy,
}: {
  node: NodeDef;
  salvage: number;
  owned: string[];
  onBuy: () => void;
}) {
  const have = owned.includes(node.id);
  const open = reqsMet(owned, node);
  const afford = salvage >= node.cost;
  const needNames = node.req.map((id) => NODES.find((n) => n.id === id)?.name ?? id);
  const anyNames = (node.reqAny ?? []).map((id) => NODES.find((n) => n.id === id)?.name ?? id);
  return (
    <button
      disabled={have || !open || !afford}
      onClick={onBuy}
      className={`rounded-md border px-3 py-2 text-left ${have ? "border-brass bg-surface-2" : open && afford ? "border-brass bg-surface" : "border-line bg-surface"} disabled:opacity-70`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-display text-lg leading-none">{node.name}</span>
        {have ? <Check size={14} className="text-brass" /> : <span className="text-xs text-brass">{formatSalvage(node.cost)}</span>}
      </span>
      <span className="mt-1 block text-xs text-muted">{node.blurb}</span>
      {!open && needNames.length > 0 && <span className="mt-1 block text-xs text-signal">Needs {needNames.join(", ")}</span>}
      {!open && anyNames.length > 0 && <span className="mt-1 block text-xs text-signal">Needs one of {anyNames.join(" / ")}</span>}
    </button>
  );
}

function Debrief({
  result,
  onNext,
}: {
  result: { win: boolean; earned: number; index: number };
  onNext: () => void;
}) {
  const salvage = useGame((s) => s.salvage);
  const cleared = useGame((s) => s.cleared);
  const sector = SECTORS[result.index];
  const broken = result.win && result.index === SECTORS.length - 1 && cleared >= SECTORS.length;
  return (
    <main className="safe-top safe-bot mx-auto flex h-dvh max-w-md flex-col justify-between px-5 py-8">
      <div>
        <p className="font-display text-sm tracking-widest text-muted">{sector.name}</p>
        <h1 className="mt-2 font-display text-5xl leading-none">{result.win ? "Sector held" : "Pulled out"}</h1>
        <p className="mt-4 text-base text-muted">
          {result.win
            ? broken
              ? `${sector.boss} is down. The legion breaks. Keep running sectors if doctrine is still dark.`
              : `${sector.boss} is down. Salvage stays with you.`
            : "The haze or the line got through. Salvage from this fight is already banked."}
        </p>
      </div>
      <div>
        <p className="font-display text-4xl text-brass">+{formatSalvage(result.earned)}</p>
        <p className="text-sm text-muted">{formatSalvage(salvage)} salvage on hand</p>
        <button className="btn-primary mt-6 w-full" onClick={onNext}>
          Continue
        </button>
      </div>
    </main>
  );
}

function K9({ onDone }: { onDone: () => void }) {
  const choose = useGame((s) => s.chooseK9);
  return (
    <main className="safe-top safe-bot mx-auto flex h-dvh max-w-md flex-col justify-between px-5 py-8">
      <div>
        <Dog className="text-brass" />
        <h1 className="mt-3 font-display text-5xl leading-none">The dog stays</h1>
        <p className="mt-4 text-base text-muted">A working dog comes out of the wire and picks a squad. The bond is permanent.</p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          className="btn-primary"
          onClick={() => {
            choose("rifle");
            onDone();
          }}
        >
          Stays with the rifles · +20% rifle damage
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            choose("marks");
            onDone();
          }}
        >
          Stays with the marksmen · +15% marksman damage
        </button>
      </div>
    </main>
  );
}

function RadioEvent({ onDone }: { onDone: () => void }) {
  const choose = useGame((s) => s.chooseRadio);
  return (
    <main className="safe-top safe-bot mx-auto flex h-dvh max-w-md flex-col justify-between px-5 py-8">
      <div>
        <Radio className="text-brass" />
        <h1 className="mt-3 font-display text-5xl leading-none">A live set</h1>
        <p className="mt-4 text-base text-muted">The colonel's radio still has a battery. You only get to use it one way.</p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          className="btn-primary"
          onClick={() => {
            choose("gold");
            onDone();
          }}
        >
          Sell the frequencies · +12% salvage
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            choose("exposure");
            onDone();
          }}
        >
          Jam their spotting · −12% exposure
        </button>
      </div>
    </main>
  );
}

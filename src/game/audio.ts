let ctx: AudioContext | null = null;
let muted = false;
let lastHurt = 0;

export function setMuted(v: boolean) {
  muted = v;
}

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
}

function envGain(at: number, dur: number, peak: number) {
  if (!ctx) return null;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  g.connect(ctx.destination);
  return g;
}

export function tone(kind: "shot" | "boom" | "spark" | "ui" | "win" | "lose" | "hurt") {
  if (muted || !ctx || ctx.state !== "running") return;
  const now = ctx.currentTime;
  if (kind === "hurt") {
    const t = performance.now();
    if (t - lastHurt < 220) return;
    lastHurt = t;
  }
  if (kind === "boom" || kind === "lose" || kind === "hurt") {
    const len = kind === "boom" ? 0.18 : 0.22;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = kind === "boom" ? 420 : 180;
    const g = envGain(now, len, kind === "hurt" ? 0.05 : 0.07);
    if (!g) return;
    src.connect(filter);
    filter.connect(g);
    src.start(now);
    return;
  }
  const osc = ctx.createOscillator();
  const g = envGain(now, kind === "win" ? 0.28 : 0.07, kind === "ui" ? 0.03 : 0.04);
  if (!g) return;
  osc.type = kind === "spark" ? "square" : "triangle";
  const f = kind === "shot" ? 210 : kind === "spark" ? 640 : kind === "win" ? 520 : 480;
  osc.frequency.setValueAtTime(f, now);
  if (kind === "win") osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
  osc.connect(g);
  osc.start(now);
  osc.stop(now + 0.3);
}

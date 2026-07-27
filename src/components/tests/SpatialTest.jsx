import React, { useRef, useState } from "react";

const ROUNDS = 12;
const SHAPE = "10,10 40,10 40,25 25,25 25,55 10,55";

function makeTrials() {
  return Array.from({ length: ROUNDS }, () => ({
    angle: Math.floor(Math.random() * 8) * 45,
    mirrored: Math.random() < 0.5,
  }));
}

function Glyph({ angle = 0, mirrored = false, color = "hsl(40 24% 93%)" }) {
  return (
    <svg viewBox="0 0 64 64" className="w-24 h-24 md:w-28 md:h-28">
      <g transform={`translate(32 32) rotate(${angle}) ${mirrored ? "scale(-1 1)" : ""} translate(-32 -32)`}>
        <polygon points={SHAPE} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default function SpatialTest({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [i, setI] = useState(0);
  const trials = useRef(makeTrials());
  const start = useRef(0);
  const stats = useRef({ correct: 0, rts: [] });

  const answer = (saidMirrored) => {
    const t = trials.current[i];
    if (saidMirrored === t.mirrored) stats.current.correct++;
    stats.current.rts.push(Date.now() - start.current);

    if (i + 1 >= ROUNDS) {
      const s = stats.current;
      const accuracy = s.correct / ROUNDS;
      const meanRt = s.rts.reduce((a, b) => a + b, 0) / s.rts.length;
      const speed = Math.max(0, Math.min(1, (5000 - meanRt) / 3500));
      const score = Math.max(15, Math.min(96, Math.round(accuracy * 80 + speed * 20)));
      setPhase("done");
      onComplete({ raw: { ...s, mean_rt_ms: Math.round(meanRt), rounds: ROUNDS }, score });
      return;
    }
    start.current = Date.now();
    setI(i + 1);
  };

  if (phase === "intro") {
    return (
      <div className="text-center max-w-sm mx-auto">
        <h2 className="font-display text-2xl text-foreground">Visual–spatial</h2>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Two shapes appear side by side. Imagine turning the blue one around.
        </p>
        <div className="mt-6 space-y-2 text-left text-xs">
          <p className="aqla-panel rounded-xl px-4 py-3 text-muted-foreground">
            <span className="text-foreground">Same, turned</span> — turning it would make it match the grey shape.
          </p>
          <p className="aqla-panel rounded-xl px-4 py-3 text-muted-foreground">
            <span className="text-foreground">Flipped</span> — no matter how you turn it, it stays back-to-front.
          </p>
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground">Take your time — accuracy matters most.</p>
        <button onClick={() => { start.current = Date.now(); setPhase("running"); }}
          className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }

  if (phase === "done") return null;

  const t = trials.current[i];

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="flex items-end gap-10 md:gap-16">
        <div className="text-center">
          <Glyph color="hsl(35 12% 62%)" />
          <p className="mt-2 text-[11px] text-muted-foreground">Original</p>
        </div>
        <div className="w-px h-20 bg-border" />
        <div className="text-center">
          <Glyph angle={t.angle} mirrored={t.mirrored} color="#7B94FF" />
          <p className="mt-2 text-[11px] text-muted-foreground">This one</p>
        </div>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Is the blue shape the same shape turned around?</p>
      <div className="mt-6 flex gap-4">
        <button onClick={() => answer(false)}
          className="px-8 py-4 rounded-2xl border border-border text-sm text-foreground hover:border-foreground/40 transition-colors">Same, turned</button>
        <button onClick={() => answer(true)}
          className="px-8 py-4 rounded-2xl border border-border text-sm text-foreground hover:border-foreground/40 transition-colors">Flipped</button>
      </div>
      <p className="mt-10 text-xs text-muted-foreground tabular-nums">{i + 1} / {ROUNDS}</p>
    </div>
  );
}
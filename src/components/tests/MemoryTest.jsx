import React, { useEffect, useRef, useState } from "react";

const START = 4;
const MAX = 10;
const SPAN_SCORE = { 2: 25, 3: 42, 4: 56, 5: 70, 6: 81, 7: 90, 8: 96, 9: 98, 10: 100 };

const makeDigits = (len) => Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");

export default function MemoryTest({ onComplete }) {
  const [phase, setPhase] = useState("intro"); // intro | showing | input | done
  const [len, setLen] = useState(START);
  const [digits, setDigits] = useState("");
  const [shownIdx, setShownIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [retried, setRetried] = useState(false);
  const best = useRef(START - 1);
  const inputRef = useRef(null);

  const [gap, setGap] = useState(false);

  const startRound = (length) => {
    setDigits(makeDigits(length));
    setShownIdx(0);
    setAnswer("");
    setGap(true);
    setPhase("showing");
  };

  useEffect(() => {
    if (phase !== "showing") return;
    // Blank gap between digits so repeated digits are clearly separate.
    if (gap) {
      const t = setTimeout(() => setGap(false), shownIdx === 0 ? 800 : 260);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      if (shownIdx + 1 < digits.length) { setShownIdx(shownIdx + 1); setGap(true); }
      else setPhase("input");
    }, 700);
    return () => clearTimeout(t);
  }, [phase, shownIdx, digits, gap]);

  useEffect(() => { if (phase === "input") inputRef.current?.focus(); }, [phase]);

  const finish = () => {
    const span = best.current;
    setPhase("done");
    onComplete({ raw: { max_span: span }, score: SPAN_SCORE[Math.max(2, Math.min(MAX, span))] });
  };

  const submit = (e) => {
    e.preventDefault();
    if (answer === digits) {
      best.current = len;
      if (len >= MAX) { finish(); return; }
      setRetried(false);
      setLen(len + 1);
      startRound(len + 1);
    } else if (!retried) {
      setRetried(true);
      startRound(len);
    } else {
      finish();
    }
  };

  if (phase === "intro") {
    return (
      <div className="text-center max-w-sm mx-auto">
        <h2 className="font-display text-2xl text-foreground">Short-term recall</h2>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Digits will appear one at a time. Type them back in order. Sequences get longer as you succeed —
          starting at {START} digits.
        </p>
        <button onClick={() => startRound(START)} className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }

  if (phase === "showing") {
    return (
      <div className="text-center">
        <p className="font-display text-7xl tabular-nums h-20 flex items-center justify-center">
          {gap ? <span className="text-muted-foreground/30">·</span> : <span className="text-foreground">{digits[shownIdx]}</span>}
        </p>
        <p className="mt-8 text-xs text-muted-foreground tabular-nums">
          Digit {Math.min(shownIdx + 1, len)} of {len}{retried ? " · second attempt" : ""}
        </p>
      </div>
    );
  }

  if (phase === "done") return null;

  return (
    <form onSubmit={submit} className="text-center max-w-xs mx-auto">
      <p className="text-sm text-muted-foreground mb-5">Type the {len} digits in order</p>
      <input ref={inputRef} value={answer} inputMode="numeric" autoComplete="off"
        onChange={(e) => setAnswer(e.target.value.replace(/\D/g, "").slice(0, len))}
        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-4 text-center font-display text-2xl tracking-[0.4em] text-foreground outline-none focus:border-primary/50" />
      <button type="submit" disabled={answer.length !== len}
        className="mt-6 px-7 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-30">Submit</button>
    </form>
  );
}
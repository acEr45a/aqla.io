import React, { useEffect, useRef, useState } from "react";

// Wechsler Memory Scale (WMS-IV) / WAIS-IV Digit Span adaptation.
// Forward + Backward conditions, two trials per length, discontinue rule,
// longest-span reporting and a scale score mapped onto adult norms.
const FORWARD_START = 3;
const BACKWARD_START = 2;
const MAX_FORWARD = 9;
const MAX_BACKWARD = 8;

const randDigits = (len) =>
  Array.from({ length: len }, () => Math.floor(Math.random() * 10));

// Adult norms: average longest forward ~7, backward ~5–6 (Wechsler).
// Combined longest span ~12 maps to a mid-range score.
const spanScore = (forward, backward) => {
  const combined = forward + backward;
  return Math.max(20, Math.min(100, Math.round(20 + (combined - 6) * 8)));
};

export default function MemoryTest({ onComplete }) {
  const [condition, setCondition] = useState("forward"); // forward | backward
  const [len, setLen] = useState(FORWARD_START);
  const [trial, setTrial] = useState(0); // 0 or 1 (two trials per length)
  const [digits, setDigits] = useState([]);
  const [phase, setPhase] = useState("intro"); // intro | showing | input | switch | done
  const [shownIdx, setShownIdx] = useState(0);
  const [gap, setGap] = useState(false);
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");

  const longestF = useRef(0);
  const longestB = useRef(0);
  const lenCorrect = useRef(false); // any correct trial at current length
  const inputRef = useRef(null);

  const beginTrial = (length) => {
    setDigits(randDigits(length));
    setShownIdx(0);
    setAnswer("");
    setGap(true);
    setPhase("showing");
  };

  const beginForward = () => {
    setCondition("forward");
    setLen(FORWARD_START);
    setTrial(0);
    longestF.current = 0;
    lenCorrect.current = false;
    beginTrial(FORWARD_START);
  };

  const beginBackward = () => {
    setCondition("backward");
    setLen(BACKWARD_START);
    setTrial(0);
    longestB.current = 0;
    lenCorrect.current = false;
    setPhase("switch");
  };

  const finish = () => {
    setPhase("done");
    const f = longestF.current;
    const b = longestB.current;
    onComplete({
      raw: {
        task: "Wechsler Digit Span adaptation (Forward + Backward)",
        longest_forward: f,
        longest_backward: b,
        trials_per_length: 2,
        discontinue_rule: "0 / 2 at a length ends the condition",
      },
      score: spanScore(f, b),
    });
  };

  // Display digits one at a time with a blank gap between them.
  useEffect(() => {
    if (phase !== "showing") return;
    if (gap) {
      const t = setTimeout(() => setGap(false), shownIdx === 0 ? 800 : 260);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      if (shownIdx + 1 < digits.length) {
        setShownIdx(shownIdx + 1);
        setGap(true);
      } else {
        setPhase("input");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [phase, shownIdx, digits, gap]);

  useEffect(() => {
    if (phase === "input") inputRef.current?.focus();
  }, [phase]);

  const expected = () =>
    condition === "backward" ? [...digits].reverse() : digits;

  const submit = (e) => {
    e.preventDefault();
    const ok = answer === expected().join("");
    if (ok) {
      if (condition === "forward") longestF.current = Math.max(longestF.current, len);
      else longestB.current = Math.max(longestB.current, len);
      lenCorrect.current = true;
    }

    if (trial === 0) {
      setTrial(1);
      beginTrial(len);
      return;
    }

    const max = condition === "forward" ? MAX_FORWARD : MAX_BACKWARD;
    if (!lenCorrect.current) {
      // Discontinue condition after 0 / 2 at this length.
      if (condition === "forward") beginBackward();
      else finish();
      return;
    }
    if (len < max) {
      setLen(len + 1);
      setTrial(0);
      lenCorrect.current = false;
      beginTrial(len + 1);
    } else if (condition === "forward") {
      beginBackward();
    } else {
      finish();
    }
  };

  if (phase === "intro") {
    return (
      <div className="text-center max-w-sm mx-auto">
        <h2 className="font-display text-2xl text-foreground">Digit Span</h2>
        <p className="mt-1 text-xs text-primary tracking-wide">Wechsler Memory Scale · adapted</p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Digits appear one at a time. First, repeat them back <span className="text-foreground">in order</span>.
          Then repeat a new set <span className="text-foreground">in reverse order</span>. Two tries at each length;
          it stops after both are wrong. Adult average is about 7 forward and 5–6 backward.
        </p>
        <button onClick={beginForward}
          className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }

  if (phase === "switch") {
    return (
      <div className="text-center max-w-sm mx-auto">
        <h2 className="font-display text-2xl text-foreground">Now backward</h2>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          You reached <span className="text-foreground">{longestF.current}</span> digits forward.
          Next, repeat each sequence in <span className="text-foreground">reverse order</span> — the last digit first.
        </p>
        <button onClick={() => beginTrial(BACKWARD_START)}
          className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Continue</button>
      </div>
    );
  }

  if (phase === "showing") {
    return (
      <div className="text-center">
        <p className="font-display text-7xl tabular-nums h-20 flex items-center justify-center">
          {gap ? (
            <span className="text-muted-foreground/30">·</span>
          ) : (
            <span className="text-foreground">{digits[shownIdx]}</span>
          )}
        </p>
        <p className="mt-8 text-xs text-muted-foreground tabular-nums">
          {condition === "backward" ? "Backward" : "Forward"} · Digit {Math.min(shownIdx + 1, len)} of {len}
          {trial === 1 ? " · second try" : ""}
        </p>
      </div>
    );
  }

  if (phase === "done") return null;

  return (
    <form onSubmit={submit} className="text-center max-w-xs mx-auto">
      <p className="text-sm text-foreground mb-1">
        {condition === "backward" ? "Type the digits in reverse order" : "Type the digits in order"}
      </p>
      <p className="text-xs text-muted-foreground mb-5 tabular-nums">
        {len} digits {trial === 1 ? "· second try" : "· first try"}
      </p>
      <input ref={inputRef} value={answer} inputMode="numeric" autoComplete="off"
        onChange={(e) => setAnswer(e.target.value.replace(/\D/g, "").slice(0, len))}
        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-4 text-center font-display text-2xl tracking-[0.4em] text-foreground outline-none focus:border-primary/50" />
      <button type="submit" disabled={answer.length !== len}
        className="mt-6 px-7 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-30">Submit</button>
    </form>
  );
}
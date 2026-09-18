import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Brain, Play, RotateCcw, CheckCircle2 } from "lucide-react";

export default function PsychometricMiniLab() {
  const [gameState, setGameState] = useState("idle"); // idle | waiting | ready | finished | early
  const [reactionTime, setReactionTime] = useState(null);
  const [history, setHistory] = useState([]);
  const startTimeRef = useRef(null);
  const timeoutRef = useRef(null);

  const startTest = () => {
    setGameState("waiting");
    setReactionTime(null);

    // Random delay between 1.8s and 4.2s
    const delay = 1800 + Math.random() * 2400;
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = Date.now();
      setGameState("ready");
    }, delay);
  };

  const handleClick = () => {
    if (gameState === "idle" || gameState === "finished" || gameState === "early") {
      startTest();
    } else if (gameState === "waiting") {
      clearTimeout(timeoutRef.current);
      setGameState("early");
    } else if (gameState === "ready") {
      const elapsed = Date.now() - startTimeRef.current;
      setReactionTime(elapsed);
      setHistory(prev => [elapsed, ...prev].slice(0, 5));
      setGameState("finished");
    }
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const getPercentile = (ms) => {
    if (ms < 190) return "Top 1% (Elite Reaction)";
    if (ms < 230) return "Top 10% (High Alertness)";
    if (ms < 280) return "Average Baseline (Typical Range)";
    return "Slight Cognitive Fatigue Detected";
  };

  return (
    <section className="relative max-w-6xl mx-auto px-4 md:px-6 py-24 md:py-36">
      {/* Background illumination */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#bef264]/10 via-[#38bdf8]/5 to-transparent blur-[120px] rounded-full" />
      </div>

      <div className="relative text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#bef264]/20 bg-[#bef264]/5 text-[#bef264] text-xs font-mono mb-4">
          <Zap className="w-3.5 h-3.5" />
          Interactive Science Sandbox
        </div>
        <h2 className="text-3xl md:text-5xl font-light text-white tracking-tight leading-tight">
          Test your neural latency in <span className="text-[#bef264]">three seconds.</span>
        </h2>
        <p className="mt-4 text-base md:text-lg text-white/60 leading-relaxed">
          Experience Task 01: The Psychomotor Vigilance Task (PVT-B). Validated in over 400 aerospace and neuroscience studies to measure sub-second executive fatigue.
        </p>
      </div>

      {/* Interactive Testing Box */}
      <div className="relative max-w-2xl mx-auto">
        <div
          onClick={handleClick}
          className={`relative cursor-pointer rounded-3xl border transition-all duration-500 overflow-hidden p-8 md:p-12 min-h-[300px] flex flex-col items-center justify-center text-center select-none shadow-2xl ${
            gameState === "waiting"
              ? "border-amber-500/30 bg-amber-950/20"
              : gameState === "ready"
              ? "border-[#bef264] bg-[#bef264]/20 shadow-[0_0_80px_rgba(190,242,100,0.3)]"
              : gameState === "early"
              ? "border-rose-500/40 bg-rose-950/20"
              : "border-white/10 bg-black/60 hover:border-white/20 backdrop-blur-xl"
          }`}
        >
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "24px 24px" }} />

          <AnimatePresence mode="wait">
            {gameState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-[#bef264]/10 border border-[#bef264]/30 flex items-center justify-center text-[#bef264]">
                  <Play className="w-6 h-6 ml-1" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">Click anywhere to begin PVT-B</h3>
                  <p className="text-sm text-white/50 mt-1">Wait for the stimulus to turn green, then click as fast as possible.</p>
                </div>
              </motion.div>
            )}

            {gameState === "waiting" && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="w-16 h-16 mx-auto rounded-full border border-amber-400/40 bg-amber-400/10 flex items-center justify-center animate-pulse text-amber-400">
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                </div>
                <h3 className="text-xl font-medium text-amber-200">Wait for green...</h3>
                <p className="text-xs font-mono text-amber-400/70 uppercase tracking-widest">Hold your focus</p>
              </motion.div>
            )}

            {gameState === "ready" && (
              <motion.div
                key="ready"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1.05 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <h3 className="text-4xl md:text-5xl font-extrabold text-[#bef264] tracking-tight">CLICK NOW!</h3>
                <p className="text-xs font-mono text-[#bef264]/80 uppercase tracking-wider">Fastest response wins</p>
              </motion.div>
            )}

            {gameState === "early" && (
              <motion.div
                key="early"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="w-14 h-14 mx-auto rounded-full border border-rose-500/30 bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-medium text-rose-300">Too early! Anticipatory trigger.</h3>
                <p className="text-xs text-white/50">Click anywhere to try again.</p>
              </motion.div>
            )}

            {gameState === "finished" && reactionTime && (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#bef264]/10 text-[#bef264] text-xs font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Stimulus Captured
                </div>
                <div className="text-5xl md:text-6xl font-light text-white font-mono tracking-tight">
                  {reactionTime} <span className="text-2xl text-[#bef264]">ms</span>
                </div>
                <p className="text-sm text-white/80 font-medium">
                  {getPercentile(reactionTime)}
                </p>
                <p className="text-xs text-white/40 font-mono">
                  Feeds Domain 01: Prefrontal Vigilance & Reaction Speed
                </p>
                <div className="pt-2">
                  <span className="text-xs text-[#bef264] border-b border-[#bef264]/40 hover:border-[#bef264] pb-0.5">
                    Click to test again
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Previous trials telemetry ribbon */}
        {history.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-xs font-mono text-white/40">
            <span>Recent Trials:</span>
            {history.map((t, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                {t}ms
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4 Psychometric Tasks Overview */}
      <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: "01",
            name: "PVT-B Latency",
            target: "Sustained Vigilance",
            spec: "Reaction time variance",
            badge: "Interactive Demo Above",
          },
          {
            id: "02",
            name: "Wechsler Digit Span",
            target: "Working Memory Capacity",
            spec: "Phonological loop limit",
            badge: "In Full Assessment",
          },
          {
            id: "03",
            name: "SART Inhibitory",
            target: "Impulse & Focus Control",
            spec: "Commission error rate",
            badge: "In Full Assessment",
          },
          {
            id: "04",
            name: "Corsi Block Tapping",
            target: "Visuospatial Memory",
            spec: "Spatial buffer span",
            badge: "In Full Assessment",
          },
        ].map((task) => (
          <div
            key={task.id}
            className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all"
          >
            <div className="flex items-center justify-between text-xs text-white/40 font-mono mb-2">
              <span>TASK {task.id}</span>
              <span className="text-[#bef264]/70">{task.badge}</span>
            </div>
            <h4 className="text-base font-medium text-white mb-1">{task.name}</h4>
            <p className="text-xs text-white/60 mb-2">{task.target}</p>
            <div className="text-[11px] font-mono text-white/40">
              Metric: {task.spec}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

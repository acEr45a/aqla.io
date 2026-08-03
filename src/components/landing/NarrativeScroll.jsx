import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    color: "hsl(8 70% 62%)",
    eyebrow: "01 — The Unmanaged Mind",
    title: "Your brain is the most powerful system you own.",
    subtitle: "Nobody ever gave you the manual.",
    body: "It runs on an operating system shaped by evolution, stress, and habit — never deliberately configured. You feel the gaps every day: the afternoon crashes, the foggy mornings, the focus that won't hold. You've tried supplements, hacks, and routines. All guessing.",
  },
  {
    color: "hsl(75 82% 60%)",
    eyebrow: "02 — The Signal",
    title: "Stop guessing. Start measuring.",
    subtitle: "Seven cognitive dimensions. Measured, not assumed.",
    body: "AQLA runs the same cognitive paradigms used in neuroscience laboratories — Digit Span, Psychomotor Vigilance, Sustained Attention — to quantify your attention, memory, reaction speed, and working memory. Combined with your sleep, stress, and lifestyle data, this produces a signal, not a hunch.",
  },
  {
    color: "hsl(224 90% 72%)",
    eyebrow: "03 — The Synchronization",
    title: "A system, not a supplement.",
    subtitle: "Your data becomes a protocol calibrated to your bottleneck.",
    body: "SPARK for energy. FLOW for focus. DRIVE for endurance. LEARN for memory. RESET for recovery. DIGITAL for screen hygiene. Six protocol families, each grounded in peer-reviewed evidence, each matched to your specific cognitive profile.",
  },
  {
    color: "hsl(190 75% 62%)",
    eyebrow: "04 — The Standard",
    title: "Every claim. Graded. Every ingredient. Transparent.",
    subtitle: "Evidence you can verify, not marketing you have to trust.",
    body: "No stars. No fake percentages. Every recommendation carries a graded evidence record — study types, populations studied, realistic effect sizes, known limitations. You see exactly what the science supports, what it doesn't, and what might work for you.",
  },
];

const BRANCHES = [0, 60, 120, 180, 240, 300];

function NeuronFire({ color }) {
  return (
    <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
      <svg viewBox="0 0 128 128" className="w-full h-full overflow-visible">
        {/* Dendrites */}
        {BRANCHES.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x2 = 64 + Math.cos(rad) * 50;
          const y2 = 64 + Math.sin(rad) * 50;
          return (
            <motion.line key={i} x1="64" y1="64" x2={x2} y2={y2}
              stroke={color} strokeWidth="1.5" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.4 }}
              viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
            />
          );
        })}
        {/* Terminal nodes */}
        {BRANCHES.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = 64 + Math.cos(rad) * 50;
          const y = 64 + Math.sin(rad) * 50;
          return (
            <motion.circle key={`t-${i}`} cx={x} cy={y} r="3" fill={color}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 0.8 }}
              viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.06 }}
            />
          );
        })}
        {/* Soma glow */}
        <motion.circle cx="64" cy="64" r="14" fill={color} opacity={0.12}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
          transition={{ duration: 0.5 }}
        />
        {/* Soma core */}
        <motion.circle cx="64" cy="64" r="8" fill={color}
          initial={{ scale: 0.3, opacity: 0.2 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
          transition={{ duration: 0.4 }}
        />
        {/* Firing pulse ring */}
        <motion.circle cx="64" cy="64" r="8" fill="none" stroke={color} strokeWidth="2"
          initial={{ scale: 1, opacity: 0 }}
          whileInView={{ scale: [1, 3.5], opacity: [0.6, 0] }}
          viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

export default function NarrativeScroll({ onSectionEnter }) {
  return (
    <div className="relative">
      {SECTIONS.map((s, i) => (
        <motion.section
          key={i}
          className="relative max-w-5xl mx-auto px-4 md:px-6 py-20 md:py-32"
          onViewportEnter={() => onSectionEnter(i)}
          viewport={{ amount: "some", margin: "-45% 0px -45% 0px" }}
        >
          <div className={`flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16 text-center md:text-left ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
            <NeuronFire color={s.color} />
            <div className="flex-1">
              <motion.p
                className="text-xs tracking-widest uppercase mb-4"
                style={{ color: s.color }}
                initial={{ opacity: 0, filter: "blur(8px)" }}
                whileInView={{ opacity: 0.7, filter: "blur(0px)" }}
                viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
                transition={{ duration: 0.6 }}
              >
                {s.eyebrow}
              </motion.p>
              <motion.h2
                className="text-2xl sm:text-3xl md:text-5xl font-light leading-[1.1] text-foreground"
                initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
                transition={{ duration: 0.8 }}
              >
                {s.title}
              </motion.h2>
              <motion.p
                className="mt-3 text-lg md:text-xl font-light"
                style={{ color: s.color }}
                initial={{ opacity: 0, filter: "blur(8px)" }}
                whileInView={{ opacity: 0.85, filter: "blur(0px)" }}
                viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {s.subtitle}
              </motion.p>
              <motion.p
                className="mt-6 text-muted-foreground leading-relaxed max-w-xl text-base md:text-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {s.body}
              </motion.p>
            </div>
          </div>
        </motion.section>
      ))}

      {/* CTA */}
      <motion.section
        className="relative max-w-4xl mx-auto px-4 md:px-6 py-24 md:py-36 text-center"
        onViewportEnter={() => onSectionEnter(SECTIONS.length)}
        viewport={{ amount: "some", margin: "-45% 0px -45% 0px" }}
      >
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
          transition={{ duration: 0.6 }}
        >
          <NeuronFire color="hsl(75 82% 60%)" />
        </motion.div>
        <motion.h2
          className="text-3xl sm:text-4xl md:text-6xl font-light text-foreground leading-tight"
          initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
          transition={{ duration: 0.8 }}
        >
          Your Brain Operating System starts here.
        </motion.h2>
        <motion.p
          className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Three tasks. No account needed. See your brain in a way you never have before.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10"
        >
          <Link to="/start" className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
            Begin Your Baseline
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </motion.section>
    </div>
  );
}
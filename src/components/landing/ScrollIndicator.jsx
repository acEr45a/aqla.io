import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollIndicator({ sections, activeIndex }) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 20, restDelta: 0.001 });

  return (
    <div className="fixed right-5 md:right-7 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-center">
      <div className="relative flex flex-col items-center gap-5 py-2">
        {/* Background track */}
        <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-px bg-border/40" />
        {/* Progress overlay */}
        <motion.div
          className="absolute top-2 left-1/2 -translate-x-1/2 w-px bg-primary/70 origin-top"
          style={{ scaleY: progress, height: "calc(100% - 16px)" }}
        />

        {sections.map((label, i) => {
          const active = activeIndex === i;
          return (
            <div key={i} className="relative flex items-center justify-center">
              {/* Firing pulse */}
              {active && (
                <motion.div
                  className="absolute w-2.5 h-2.5 rounded-full bg-primary pointer-events-none"
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 3.5 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              {/* Node */}
              <motion.div
                className="w-2.5 h-2.5 rounded-full relative z-10"
                animate={{
                  backgroundColor: active ? "hsl(75 82% 60%)" : "hsl(30 9% 22%)",
                  boxShadow: active ? "0 0 10px hsl(75 82% 60% / 0.5)" : "0 0 0px transparent",
                  scale: active ? 1.4 : 1,
                }}
                transition={{ duration: 0.4 }}
              />
              {/* Label */}
              {active && (
                <motion.span
                  className="absolute right-7 whitespace-nowrap text-[10px] text-primary font-medium tracking-widest uppercase pointer-events-none"
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {label}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
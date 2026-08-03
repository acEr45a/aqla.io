import React from "react";
import { motion } from "framer-motion";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";

export default function ProtocolPlaquards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-10 max-w-2xl">
      {PROTOCOL_FAMILIES.map((p, i) => (
        <motion.div
          key={p.key}
          className="aqla-panel rounded-xl p-4 md:p-5"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span className="font-display text-sm text-foreground tracking-wide">{p.name}</span>
            <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{p.evidence}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{p.purpose}</p>
        </motion.div>
      ))}
    </div>
  );
}
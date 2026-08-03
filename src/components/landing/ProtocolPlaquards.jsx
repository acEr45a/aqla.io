import React from "react";
import { motion } from "framer-motion";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import { PROTOCOL_DETAILS } from "@/lib/protocolDetails";

export default function ProtocolPlaquards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-10 max-w-2xl">
      {PROTOCOL_FAMILIES.map((p, i) => {
        const details = PROTOCOL_DETAILS[p.key];
        return (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="relative group"
          >
            <div
              tabIndex={0}
              className="aqla-panel rounded-xl p-4 md:p-5 transition-colors hover:border-foreground/20 focus:border-foreground/20 focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="font-display text-sm text-foreground tracking-wide">{p.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{p.evidence}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{p.purpose}</p>
            </div>

            {details && (
              <div className="invisible absolute bottom-[calc(100%+8px)] left-1/2 z-30 w-64 -translate-x-1/2 rounded-xl border border-border bg-background/95 p-4 opacity-0 shadow-2xl backdrop-blur-md transition-all group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100">
                <p className="text-[10px] uppercase tracking-widest" style={{ color: p.color }}>Formulation</p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/90">{details.formulation}</p>
                <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">Benefits</p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/90">{details.benefits.join(" · ")}</p>
                <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">Ingredients</p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/90">{details.ingredients.join(" · ")}</p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
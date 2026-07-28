import React from "react";
import { motion } from "framer-motion";

const FIELDS = [
  ["What AQLA observed", "observed"],
  ["Most likely explanation", "explanation"],
  ["Recommended next action", "next_action"],
];

export default function AqlaReply({ message, compact = false }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`aqla-panel rounded-3xl rounded-bl-sm space-y-4 ${compact ? "p-4" : "p-6"}`}>
      {FIELDS.map(([label, key]) => (
        <div key={key}>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className={`mt-1.5 text-foreground/90 leading-relaxed ${compact ? "text-[13px]" : "text-sm"}`}>{message[key]}</p>
        </div>
      ))}
      <span className="inline-block px-3 py-1 rounded-full border border-border text-[11px] text-muted-foreground">
        Confidence: {message.confidence}
      </span>
      {message.safety_note && (
        <p className="text-xs text-[#F2C04E] border-t border-border/40 pt-3">{message.safety_note}</p>
      )}
    </motion.div>
  );
}
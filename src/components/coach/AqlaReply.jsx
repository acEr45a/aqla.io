import React from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";

const FIELDS = [
  ["What AQLA observed", "observed"],
  ["Most likely explanation", "explanation"],
  ["Recommended next action", "next_action"],
];

export default function AqlaReply({ message, compact = false, onSpeak, onConfirmPlanChange, onCancelPlanChange }) {
  const chat = message.mode === "chat";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`aqla-panel rounded-3xl rounded-bl-sm space-y-4 ${compact ? "p-4" : "p-6"}`}>
      {chat ? (
        <p className={`text-foreground/90 leading-relaxed whitespace-pre-line ${compact ? "text-[13px]" : "text-sm"}`}>{message.chat_reply}</p>
      ) : (
        <>
          {FIELDS.map(([label, key]) => (
            <div key={key}>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className={`mt-1.5 text-foreground/90 leading-relaxed ${compact ? "text-[13px]" : "text-sm"}`}>{message[key]}</p>
            </div>
          ))}
          <span className="inline-block px-3 py-1 rounded-full border border-border text-[11px] text-muted-foreground">
            Confidence: {message.confidence}
          </span>
        </>
      )}
      <div className="flex items-center gap-3">
        {onSpeak && (
          <button type="button" onClick={onSpeak}
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            <Volume2 className="w-3.5 h-3.5" /> Listen
          </button>
        )}
        <CopyButton
          value={chat
            ? message.chat_reply
            : FIELDS.map(([label, key]) => `${label}: ${message[key]}`).join("\n\n")}
        />
      </div>
      {message.safety_note && (
        <p className="text-xs text-[#F2C04E] border-t border-border/40 pt-3">{message.safety_note}</p>
      )}
      {message.clinical_note && (
        <p className="flex items-center gap-1.5 text-[11px] text-[#E8A28F] border-t border-border/40 pt-3">
          <span>⚑</span> {message.clinical_note}
        </p>
      )}
      {message.plan_change_requested && message.recommended_family !== "NONE" && (
        <div className="border-t border-border/40 pt-3">
          {message.plan_change_status ? <p className="text-xs text-muted-foreground">Plan change {message.plan_change_status}.</p> : (
            <div className="flex gap-2">
              <button onClick={onCancelPlanChange} className="flex-1 rounded-full border border-border py-2 text-xs">Keep current</button>
              <button onClick={onConfirmPlanChange} className="flex-1 rounded-full bg-primary py-2 text-xs font-medium text-primary-foreground">Confirm {message.recommended_family}</button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
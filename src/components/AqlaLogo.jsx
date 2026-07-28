import React from "react";

// AQLA mark: monospaced brackets enclosing a glowing neural node.
export default function AqlaLogo({ className = "", showWordmark = true }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 40 40" className="w-9 h-9 shrink-0" aria-hidden="true">
        <path d="M14 7 H7 V33 H14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
        <path d="M26 7 H33 V33 H26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
        <circle cx="20" cy="20" r="5.2" fill="hsl(var(--primary))" />
        <circle cx="20" cy="20" r="9" fill="hsl(var(--primary))" opacity="0.16" />
      </svg>
      {showWordmark && (
        <span className="font-mono text-lg tracking-[0.18em] uppercase text-foreground">Aqla</span>
      )}
    </div>
  );
}
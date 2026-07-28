import React from "react";

// Original AQLA neural mark: an open signal path converging around a single active node.
export default function AqlaLogo({ className = "", showWordmark = true }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 44 44" className="w-9 h-9 shrink-0" aria-hidden="true">
        <path d="M8 31.5 18.2 10.5 28 31.5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m28 31.5 8-9.2" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
        <path d="m12.4 22.5 8.2 0" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
        <circle cx="22.4" cy="22.5" r="3.4" fill="hsl(var(--primary))" />
        <circle cx="22.4" cy="22.5" r="6.9" fill="hsl(var(--primary))" opacity="0.13" />
      </svg>
      {showWordmark && (
        <span className="font-display text-lg font-medium tracking-[0.16em] uppercase text-foreground">AQLA</span>
      )}
    </div>
  );
}
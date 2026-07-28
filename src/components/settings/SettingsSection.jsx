import React from "react";

export default function SettingsSection({ title, hint, children }) {
  return (
    <section className="aqla-panel rounded-2xl px-5 pt-5 pb-2 mt-6">
      <p className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground/70 mt-1.5 leading-relaxed">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
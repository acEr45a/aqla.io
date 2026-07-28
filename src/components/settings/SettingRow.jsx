import React from "react";

export default function SettingRow({ title, description, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border/50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
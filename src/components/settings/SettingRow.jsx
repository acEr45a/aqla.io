import React from "react";

export default function SettingRow({ title, description, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border/50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-sm">{description}</p>
        )}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}
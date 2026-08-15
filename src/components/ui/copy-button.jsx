import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

// Universal copy-to-clipboard button. Shows a confirmed state for ~1.8s.
export default function CopyButton({ value, label = "Copy", copiedLabel = "Copied", className = "" }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!value) return;
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? copiedLabel : label}
    </button>
  );
}
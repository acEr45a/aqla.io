import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

// Universal copy-to-clipboard button. Swaps the copy icon for a green check for
// 2 seconds on success, then reverts.
export default function CopyButton({ value, label = "Copy", copiedLabel = "Copied", className = "" }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!value) return;
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? copiedLabel : label}
    </button>
  );
}
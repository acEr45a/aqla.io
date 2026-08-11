import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, Check, Loader2, TriangleAlert, Flag } from "lucide-react";

const parse = (value) => { try { return typeof value === "string" ? JSON.parse(value) : value; } catch { return value; } };

function ToolCall({ toolCall, accent, onResolve }) {
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const results = parse(toolCall.results);
  const failed = ["failed", "error"].includes(toolCall.status) || results?.success === false;
  const running = ["pending", "running", "in_progress"].includes(toolCall.status);
  const projection = toolCall.display_projection || {};
  const hidden = projection.hide_details && projection.details_redacted;
  const label = failed ? (projection.error_label || "Failed") : running ? (projection.active_label || "Working…") : (projection.label || toolCall.name);
  const checkColor = accent || "hsl(var(--primary))";

  const handleResolve = async () => {
    if (resolving || !onResolve) return;
    setResolving(true);
    try {
      await onResolve({
        name: toolCall.name,
        arguments: parse(toolCall.arguments_string),
        result: results,
        error: projection.error_label || (typeof results?.error === "string" ? results.error : "Failed"),
      });
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="mt-2 text-xs">
      <div className="flex items-center gap-2">
        <button onClick={() => !hidden && setOpen(!open)} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          {running ? <Loader2 className="h-3 w-3 animate-spin" /> : failed ? <TriangleAlert className="h-3 w-3 text-destructive" /> : <Check className="h-3 w-3" style={{ color: checkColor }} />}
          {label}
          {!hidden && <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />}
        </button>
        {failed && onResolve && (
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-2 py-0.5 text-[10px] text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            {resolving ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <TriangleAlert className="h-2.5 w-2.5" />}
            {resolving ? "Resolving…" : "Resolve with Ops"}
          </button>
        )}
      </div>
      {open && !hidden && (
        <pre className="mt-2 max-h-52 overflow-auto rounded-xl bg-secondary/60 p-3 text-[11px] text-muted-foreground">
{JSON.stringify({ parameters: parse(toolCall.arguments_string), result: results }, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function OpsMessageBubble({ message, accent, onResolve, flaggable, onFlag, flagged }) {
  const isUser = message.role === "user";
  const accentColor = accent || "hsl(var(--primary))";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[92%] min-w-0 break-all rounded-2xl px-4 py-3 sm:max-w-[85%] ${isUser ? "text-foreground" : "border border-border/60 bg-card/60"}`}
        style={isUser ? { background: `${accentColor}1a` } : undefined}
      >
        {message.content && (isUser
          ? <p className="text-sm whitespace-pre-wrap break-all">{message.content}</p>
          : <div className="prose prose-sm prose-invert max-w-none min-w-0 break-all text-sm"><ReactMarkdown
              components={{
                code: ({ inline, ...props }) =>
                  inline
                    ? <code {...props} className="break-words" style={{ overflowWrap: "anywhere" }} />
                    : <code {...props} />,
              }}
            >{message.content}</ReactMarkdown></div>)}
        {message.tool_calls?.map((toolCall, index) => <ToolCall key={index} toolCall={toolCall} accent={accentColor} onResolve={onResolve} />)}
        {!isUser && flaggable && (
          <button
            onClick={() => onFlag?.(message)}
            disabled={flagged}
            className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-[#E8A28F] disabled:opacity-100"
          >
            <Flag className="h-3 w-3" style={{ color: flagged ? "#E8A28F" : undefined }} fill={flagged ? "#E8A28F" : "none"} />
            {flagged ? "Flagged for clinician review" : "Flag for clinician review"}
          </button>
        )}
      </div>
    </div>
  );
}
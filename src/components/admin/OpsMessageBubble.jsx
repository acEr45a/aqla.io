import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, Check, Loader2, TriangleAlert } from "lucide-react";

const parse = (value) => { try { return typeof value === "string" ? JSON.parse(value) : value; } catch { return value; } };

function ToolCall({ toolCall, accent }) {
  const [open, setOpen] = useState(false);
  const results = parse(toolCall.results);
  const failed = ["failed", "error"].includes(toolCall.status) || results?.success === false;
  const running = ["pending", "running", "in_progress"].includes(toolCall.status);
  const projection = toolCall.display_projection || {};
  const hidden = projection.hide_details && projection.details_redacted;
  const label = failed ? (projection.error_label || "Failed") : running ? (projection.active_label || "Working…") : (projection.label || toolCall.name);
  const checkColor = accent || "hsl(var(--primary))";

  return (
    <div className="mt-2 text-xs">
      <button onClick={() => !hidden && setOpen(!open)} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
        {running ? <Loader2 className="h-3 w-3 animate-spin" /> : failed ? <TriangleAlert className="h-3 w-3 text-destructive" /> : <Check className="h-3 w-3" style={{ color: checkColor }} />}
        {label}
        {!hidden && <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>
      {open && !hidden && (
        <pre className="mt-2 max-h-52 overflow-auto rounded-xl bg-secondary/60 p-3 text-[11px] text-muted-foreground">
{JSON.stringify({ parameters: parse(toolCall.arguments_string), result: results }, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function OpsMessageBubble({ message, accent }) {
  const isUser = message.role === "user";
  const accentColor = accent || "hsl(var(--primary))";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? "text-foreground" : "border border-border/60 bg-card/60"}`}
        style={isUser ? { background: `${accentColor}1a` } : undefined}
      >
        {message.content && (isUser
          ? <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          : <div className="prose prose-sm prose-invert max-w-none text-sm"><ReactMarkdown>{message.content}</ReactMarkdown></div>)}
        {message.tool_calls?.map((toolCall, index) => <ToolCall key={index} toolCall={toolCall} accent={accentColor} />)}
      </div>
    </div>
  );
}
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ChevronDown,
  Check,
  Loader2,
  TriangleAlert,
  Flag,
  Wrench,
  BookOpen,
  ShieldAlert,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import CopyButton from "@/components/ui/copy-button";

const parse = (value) => {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return value;
  }
};

function ToolCallChip({ toolCall, accent, onResolve }) {
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Normalize tool format across new and legacy schemas
  const name = toolCall.tool || toolCall.name || "tool_call";
  const args = toolCall.args || parse(toolCall.arguments_string) || {};
  const result = toolCall.result || parse(toolCall.results) || null;
  const status = toolCall.status || (result?.error ? "error" : "success");
  const duration = toolCall.duration_ms ? `${toolCall.duration_ms}ms` : null;

  const failed = ["failed", "error"].includes(status) || result?.error || result?.success === false;
  const running = ["pending", "running", "in_progress"].includes(status);
  const checkColor = accent || "hsl(var(--primary))";

  // Specialized icon by tool type
  const Icon = name.includes("knowledge") ? BookOpen : Wrench;

  const handleResolve = async () => {
    if (resolving || !onResolve) return;
    setResolving(true);
    try {
      await onResolve({
        name,
        arguments: args,
        result,
        error: typeof result?.error === "string" ? result.error : "Failed",
      });
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="mt-2 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/30 px-2 py-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all"
        >
          {running ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : failed ? (
            <TriangleAlert className="h-3 w-3 text-destructive" />
          ) : (
            <Icon className="h-3 w-3" style={{ color: checkColor }} />
          )}
          <span className="font-mono text-[11px] font-medium text-foreground/90">{name}</span>
          {duration && <span className="text-[10px] text-muted-foreground/70">({duration})</span>}
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
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

      {open && (
        <div className="mt-2 max-h-60 overflow-auto rounded-xl border border-border/40 bg-secondary/40 p-3 text-[11px] text-muted-foreground">
          {Object.keys(args).length > 0 && (
            <div className="mb-2">
              <span className="font-semibold text-foreground/80">Input Arguments:</span>
              <pre className="mt-1 font-mono text-[10px]">{JSON.stringify(args, null, 2)}</pre>
            </div>
          )}
          {result && (
            <div>
              <span className="font-semibold text-foreground/80">Execution Output:</span>
              <pre className="mt-1 font-mono text-[10px] text-foreground/90">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConfirmationActionCard({ confirmation, onConfirmAction, accent }) {
  const [processing, setProcessing] = useState(false);
  const [decided, setDecided] = useState(null);

  const handleDecision = async (approved) => {
    if (processing || decided) return;
    setProcessing(true);
    try {
      if (onConfirmAction) {
        await onConfirmAction({
          tool_name: confirmation.action,
          params: confirmation.params,
          is_approved: approved,
        });
      }
      setDecided(approved ? "approved" : "cancelled");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
      <div className="flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-amber-300">Action Approval Required</div>
          <p className="mt-1 text-foreground/90 text-xs">{confirmation.prompt}</p>

          {confirmation.params && (
            <pre className="mt-2 rounded bg-black/40 p-2 text-[10px] font-mono text-muted-foreground max-h-32 overflow-auto">
              {JSON.stringify(confirmation.params, null, 2)}
            </pre>
          )}

          <div className="mt-3 flex items-center gap-2">
            {decided ? (
              <span className="inline-flex items-center gap-1 font-medium text-[11px] text-muted-foreground">
                {decided === "approved" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                )}
                {decided === "approved" ? "Confirmed & Executed" : "Action Cancelled"}
              </span>
            ) : (
              <>
                <button
                  onClick={() => handleDecision(true)}
                  disabled={processing}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Confirm & Run
                </button>
                <button
                  onClick={() => handleDecision(false)}
                  disabled={processing}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OpsMessageBubble({
  message,
  accent,
  onResolve,
  flaggable,
  onFlag,
  flagged,
  onConfirmAction,
}) {
  const isUser = message.role === "user";
  const accentColor = accent || "hsl(var(--primary))";

  // Extract pending confirmation if present
  const pendingConfirmation =
    message.metadata?.pending_confirmation ||
    message.metadata?.confirmationPayload;

  // Extract tool calls from message
  const toolCalls =
    message.tool_calls || message.metadata?.tool_executions || [];

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[92%] min-w-0 rounded-2xl px-4 py-3 sm:max-w-[85%] ${
          isUser
            ? "text-foreground"
            : "overflow-x-auto border border-border/60 bg-card/60 scrollbar-none"
        }`}
        style={isUser ? { background: `${accentColor}1a` } : undefined}
      >
        {message.content &&
          (isUser ? (
            <p className="text-sm whitespace-pre-wrap break-all">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none min-w-0 text-sm">
              <ReactMarkdown
                components={{
                  code: ({ inline, ...props }) =>
                    inline ? (
                      <code
                        {...props}
                        className="break-words"
                        style={{ overflowWrap: "anywhere" }}
                      />
                    ) : (
                      <code {...props} />
                    ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ))}

        {/* Render Interactive In-line Action Card for Mutating Actions */}
        {pendingConfirmation && (
          <ConfirmationActionCard
            confirmation={pendingConfirmation}
            onConfirmAction={onConfirmAction}
            accent={accentColor}
          />
        )}

        {/* Render Interactive Tool Call Chips */}
        {toolCalls.length > 0 && (
          <div className="mt-2 pt-1 border-t border-border/40">
            {toolCalls.map((toolCall, index) => (
              <ToolCallChip
                key={index}
                toolCall={toolCall}
                accent={accentColor}
                onResolve={onResolve}
              />
            ))}
          </div>
        )}

        {!isUser && message.content && (
          <div className="mt-2">
            <CopyButton value={message.content} />
          </div>
        )}

        {!isUser && flaggable && (
          <button
            onClick={() => onFlag?.(message)}
            disabled={flagged}
            className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-[#E8A28F] disabled:opacity-100"
          >
            <Flag
              className="h-3 w-3"
              style={{ color: flagged ? "#E8A28F" : undefined }}
              fill={flagged ? "#E8A28F" : "none"}
            />
            {flagged ? "Flagged for clinician review" : "Flag for clinician review"}
          </button>
        )}
      </div>
    </div>
  );
}
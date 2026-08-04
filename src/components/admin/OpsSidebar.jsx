import React from "react";
import { Plus, MessageSquare } from "lucide-react";

export default function OpsSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  accent,
  newLabel = "New chat",
}) {
  return (
    <div className="flex h-full flex-col gap-2 border-r border-border/60 bg-secondary/30 p-2">
      <button
        onClick={onNew}
        className="flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors"
        style={{ borderColor: `${accent}55`, color: accent }}
      >
        <Plus className="h-3.5 w-3.5" /> {newLabel}
      </button>

      <div className="flex-1 space-y-1 overflow-y-auto scrollbar-none">
        {conversations.length === 0 && (
          <p className="px-2 py-3 text-[10px] text-muted-foreground">No conversations yet.</p>
        )}
        {conversations.map((conv) => {
          const isActive = conv.id === activeId;
          const title = conv.metadata?.name || "Untitled chat";
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[11px] text-left transition-colors ${
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              <MessageSquare className="h-3 w-3 shrink-0" style={isActive ? { color: accent } : {}} />
              <span className="truncate">{title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
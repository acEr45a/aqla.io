import React from "react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";

export default function OpsSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
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
            <div
              key={conv.id}
              className={`flex items-center gap-1 rounded-lg px-1 transition-colors ${
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              <button
                onClick={() => onSelect(conv)}
                className="flex flex-1 items-center gap-2 px-1.5 py-2 text-[11px] text-left truncate"
              >
                <MessageSquare className="h-3 w-3 shrink-0" style={isActive ? { color: accent } : {}} />
                <span className="truncate">{title}</span>
              </button>
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(conv); }}
                  className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/60 hover:text-destructive"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
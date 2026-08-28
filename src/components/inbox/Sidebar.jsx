import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  Send,
  FileText,
  Star,
  Archive,
  AlertOctagon,
  Trash2,
  Tag,
  Settings,
  Plus,
  HeartPulse,
  Sparkles,
  Layers,
  ShieldAlert,
  Radio,
  ChevronRight,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
} from "lucide-react";

export default function Sidebar({
  activeFolder,
  setActiveFolder,
  activeCategory,
  setActiveCategory,
  activeTag,
  setActiveTag,
  counts = {},
  tags = ["SPARK Protocol", "Urgent Review", "Sleep", "Biomarkers", "Working Memory"],
  onCompose,
  onOpenSettings,
  collapsed,
  setCollapsed,
  isSuperAdmin,
  globalAuditMode,
  setGlobalAuditMode,
}) {
  const navigate = useNavigate();
  const [tagList, setTagList] = useState(tags);
  const [newTagInput, setNewTagInput] = useState("");
  const [showAddTag, setShowAddTag] = useState(false);

  const folders = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: counts.inbox || 0 },
    { id: "starred", label: "Starred", icon: Star, count: counts.starred || 0 },
    { id: "sent", label: "Sent", icon: Send, count: counts.sent || 0 },
    { id: "drafts", label: "Drafts", icon: FileText, count: counts.drafts || 0 },
    { id: "archive", label: "Archive", icon: Archive, count: counts.archive || 0 },
    { id: "spam", label: "Spam", icon: AlertOctagon, count: counts.spam || 0 },
    { id: "trash", label: "Trash", icon: Trash2, count: counts.trash || 0 },
  ];

  const categories = [
    { id: "all", label: "All Categories", icon: Layers },
    { id: "Primary", label: "Primary", icon: Sparkles, color: "#a3e635" },
    { id: "Patient Care", label: "Patient Care", icon: HeartPulse, color: "#38bdf8" },
    { id: "System Updates", label: "System Updates", icon: Radio, color: "#facc15" },
  ];

  const handleAddTag = () => {
    if (newTagInput.trim() && !tagList.includes(newTagInput.trim())) {
      setTagList([...tagList, newTagInput.trim()]);
      setNewTagInput("");
      setShowAddTag(false);
    }
  };

  return (
    <aside
      className={`relative flex flex-col border-r border-border/60 bg-card/40 backdrop-blur-md transition-all duration-300 z-30 select-none ${collapsed ? "w-[68px]" : "w-[240px]"
        }`}
    >
      {/* Top Header / Compose CTA */}
      <div className="p-3 border-b border-border/40 flex flex-col gap-2.5">
        {/* Back to Portal / Navigation */}
        <button
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate("/clinician");
          }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors w-fit ${collapsed ? "justify-center w-full px-0" : ""}`}
          title="Back to Clinician Portal"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-primary" />
          {!collapsed && <span className="text-[11px] tracking-wide uppercase font-semibold text-foreground/80">Exit to Portal</span>}
        </button>

        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#a3e635] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Clinical Mail
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground ml-auto"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {/* Lime Green Compose Button */}
        <Button
          onClick={onCompose}
          className={`relative group bg-[#a3e635] text-black font-semibold hover:bg-[#bef264] transition-all shadow-lg shadow-[#a3e635]/20 rounded-xl h-11 flex items-center justify-center gap-2 ${collapsed ? "w-full px-0" : "w-full"
            }`}
          title="Compose message (Press 'c')"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          {!collapsed && (
            <>
              <span className="text-sm font-semibold tracking-tight">Compose</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-black/15 px-1.5 font-mono text-[10px] font-medium text-black/80">
                c
              </kbd>
            </>
          )}
        </Button>
      </div>

      {/* Super Admin Global Audit Toggle */}
      {isSuperAdmin && (
        <div className="px-3 pt-2">
          <button
            onClick={() => setGlobalAuditMode(!globalAuditMode)}
            className={`w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors border ${globalAuditMode
                ? "border-amber-500/50 bg-amber-500/15 text-amber-300 font-medium"
                : "border-border/40 bg-secondary/30 text-muted-foreground hover:text-foreground"
              }`}
            title="Super Admin: Toggle organization-wide audit stream"
          >
            <ShieldAlert className={`h-4 w-4 ${globalAuditMode ? "text-amber-400 animate-pulse" : ""}`} />
            {!collapsed && (
              <span className="truncate">
                {globalAuditMode ? "Global Audit: ON" : "Global Audit View"}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Folders Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <div className="space-y-0.5">
          {folders.map((f) => {
            const Icon = f.icon;
            const isActive = activeFolder === f.id && !activeCategory && !activeTag && !globalAuditMode;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFolder(f.id);
                  setActiveCategory(null);
                  setActiveTag(null);
                  if (globalAuditMode) setGlobalAuditMode(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors group ${isActive
                    ? "bg-[#a3e635]/15 text-[#a3e635] font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                title={f.label}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#a3e635]" : ""}`} />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{f.label}</span>
                    {f.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${isActive
                            ? "bg-[#a3e635] text-black font-bold"
                            : "bg-secondary/80 text-muted-foreground group-hover:text-foreground"
                          }`}
                      >
                        {f.count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Smart Categories */}
        {!collapsed && (
          <div className="pt-4 pb-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Categories
            </p>
          </div>
        )}

        <div className="space-y-0.5">
          {categories.map((c) => {
            const Icon = c.icon;
            const isActive = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCategory(c.id === "all" ? null : c.id);
                  setActiveTag(null);
                  if (globalAuditMode) setGlobalAuditMode(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs transition-colors ${isActive
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                  }`}
                title={c.label}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: c.color || "inherit" }} />
                {!collapsed && <span className="truncate text-left flex-1">{c.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Tag Manager */}
        {!collapsed && (
          <div className="pt-4 pb-1 flex items-center justify-between px-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Tags
            </p>
            <button
              onClick={() => setShowAddTag(!showAddTag)}
              className="text-muted-foreground hover:text-primary transition-colors text-xs"
              title="Add custom tag"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}

        {!collapsed && showAddTag && (
          <div className="px-2 py-1 flex items-center gap-1.5">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="Tag name…"
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              className="w-full bg-secondary/50 text-xs px-2 py-1 rounded-lg border border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60"
            />
            <Button size="sm" variant="secondary" onClick={handleAddTag} className="h-6 text-[10px] px-2">
              Add
            </Button>
          </div>
        )}

        <div className="space-y-0.5">
          {tagList.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => {
                  setActiveTag(isActive ? null : tag);
                  if (globalAuditMode) setGlobalAuditMode(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-colors ${isActive
                    ? "bg-primary/10 text-primary font-medium border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                  }`}
                title={tag}
              >
                <Tag className={`h-3 w-3 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {!collapsed && <span className="truncate text-left">{tag}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Settings Button */}
      <div className="p-2 border-t border-border/40">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          title="Inbox Settings & Governance"
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate text-left font-medium">Settings & Rules</span>}
        </button>
      </div>
    </aside>
  );
}

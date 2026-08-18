import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Filter,
  Star,
  Archive,
  Trash2,
  Mail,
  MailOpen,
  Paperclip,
  ShieldCheck,
  RefreshCw,
  Clock,
  MoreVertical,
  CheckCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";

export default function ThreadList({
  threads = [],
  selectedThreadId,
  onSelectThread,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onBulkAction,
  onRefresh,
  searchQuery,
  setSearchQuery,
  loading,
}) {
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [filterHasAttachment, setFilterHasAttachment] = useState(false);
  const [filterSender, setFilterSender] = useState("");

  const allSelected = threads.length > 0 && selectedIds.length === threads.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < threads.length;

  const formatTimestamp = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "Patient Care":
        return "bg-sky-500/15 text-sky-400 border-sky-500/20";
      case "System Updates":
        return "bg-amber-500/15 text-amber-300 border-amber-500/20";
      default:
        return "bg-[#a3e635]/15 text-[#a3e635] border-[#a3e635]/20";
    }
  };

  // Filter application
  const filteredThreads = threads.filter((th) => {
    const lastMsg = th.messages?.[th.messages.length - 1] || th.last_message;
    const hasUnread = th.messages?.some((m) => !m.is_read) || th.is_unread;
    const hasAtt = th.messages?.some((m) => m.attachments?.length > 0) || th.has_attachments;

    if (filterUnreadOnly && !hasUnread) return false;
    if (filterHasAttachment && !hasAtt) return false;
    if (filterSender && !th.participant_emails?.some((e) => e.toLowerCase().includes(filterSender.toLowerCase()))) {
      return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();

    // Advanced search operator parser
    if (q.includes("is:unread") && !hasUnread) return false;
    if (q.includes("is:starred") && !th.is_starred) return false;
    if (q.includes("has:attachment") && !hasAtt) return false;

    const rawQuery = q.replace(/is:\w+|has:\w+|from:\w+/g, "").trim();
    if (!rawQuery) return true;

    return (
      th.subject?.toLowerCase().includes(rawQuery) ||
      th.participant_emails?.some((e) => e.toLowerCase().includes(rawQuery)) ||
      lastMsg?.body_html?.toLowerCase().includes(rawQuery) ||
      th.tags?.some((t) => t.toLowerCase().includes(rawQuery))
    );
  });

  return (
    <div className="w-[360px] md:w-[410px] flex flex-col border-r border-border/60 bg-card/20 backdrop-blur-sm shrink-0 h-full select-none">
      {/* Top Search & Filter Bar */}
      <div className="p-3 border-b border-border/40 space-y-2 bg-card/40">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email (from: has:attachment is:unread)…"
            className="pl-9 pr-8 h-9 text-xs bg-secondary/50 border-border/50 rounded-xl focus-visible:ring-1 focus-visible:ring-primary text-foreground placeholder:text-muted-foreground/60"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`h-8 w-8 ml-1 rounded-lg ${
              showFilterDrawer || filterUnreadOnly || filterHasAttachment
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Advanced Search Filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter Drawer */}
        {showFilterDrawer && (
          <div className="p-2.5 rounded-xl border border-border/60 bg-card/80 backdrop-blur-md space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase">
              <span>Filter Parameters</span>
              <button
                onClick={() => {
                  setFilterUnreadOnly(false);
                  setFilterHasAttachment(false);
                  setFilterSender("");
                }}
                className="text-primary hover:underline lowercase text-[10px]"
              >
                Reset
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={filterUnreadOnly}
                  onChange={(e) => setFilterUnreadOnly(e.target.checked)}
                  className="rounded border-border accent-primary"
                />
                Unread only
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground ml-3">
                <input
                  type="checkbox"
                  checked={filterHasAttachment}
                  onChange={(e) => setFilterHasAttachment(e.target.checked)}
                  className="rounded border-border accent-primary"
                />
                Has attachment
              </label>
            </div>
            <div>
              <Input
                value={filterSender}
                onChange={(e) => setFilterSender(e.target.value)}
                placeholder="Sender email contains…"
                className="h-7 text-xs bg-secondary/40 border-border/40"
              />
            </div>
          </div>
        )}

        {/* Bulk Action Header */}
        <div className="flex items-center justify-between pt-1 px-1 text-xs">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
              className="border-border/80 data-[state=checked]:bg-primary data-[state=checked]:text-black"
            />
            <span className="text-[11px] text-muted-foreground font-mono">
              {selectedIds.length > 0 ? `${selectedIds.length} selected` : `${filteredThreads.length} threads`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {selectedIds.length > 0 ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onBulkAction("markRead")}
                  title="Mark as read"
                >
                  <MailOpen className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onBulkAction("markUnread")}
                  title="Mark as unread"
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onBulkAction("star")}
                  title="Star"
                >
                  <Star className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onBulkAction("archive")}
                  title="Archive"
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/15"
                  onClick={() => onBulkAction("delete")}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onRefresh}
                title="Refresh mailbox"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Thread Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {filteredThreads.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-xs font-medium text-foreground">No conversations found</p>
            <p className="text-[11px] mt-1">Try resetting your search query or folder filter.</p>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isSelected = selectedThreadId === thread.id;
            const isChecked = selectedIds.includes(thread.id);
            const messages = thread.messages || [];
            const lastMsg = messages[messages.length - 1] || {};
            const isUnread = messages.some((m) => !m.is_read) || thread.is_unread;
            const hasAttachments = messages.some((m) => m.attachments?.length > 0) || thread.has_attachments;
            const snippet = lastMsg.body_html?.replace(/<[^>]*>/g, " ").trim() || "(No preview text)";
            const senderDisplayName =
              lastMsg.sender_name || lastMsg.sender_email?.split("@")[0] || thread.participant_emails?.[0] || "Patient";

            return (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread)}
                className={`relative group p-3.5 cursor-pointer transition-all duration-150 flex items-start gap-3 ${
                  isSelected
                    ? "bg-[#a3e635]/10 border-l-2 border-l-[#a3e635]"
                    : isUnread
                    ? "bg-card/70 hover:bg-card/90 font-medium"
                    : "hover:bg-secondary/30 text-muted-foreground"
                }`}
              >
                {/* Checkbox & Star Button */}
                <div
                  className="flex flex-col items-center gap-2 pt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => onToggleSelect(thread.id)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-black"
                  />
                  <button
                    onClick={() => onBulkAction("toggleStar", thread.id)}
                    className={`transition-colors ${
                      thread.is_starred ? "text-amber-400" : "text-muted-foreground/40 hover:text-amber-400"
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${thread.is_starred ? "fill-amber-400" : ""}`} />
                  </button>
                </div>

                {/* Main Thread Content */}
                <div className="min-w-0 flex-1">
                  {/* Top Row: Sender, Unread Dot, Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isUnread && (
                        <div className="h-2 w-2 rounded-full bg-[#a3e635] shrink-0 animate-pulse" />
                      )}
                      <p
                        className={`text-xs truncate ${
                          isUnread ? "text-foreground font-semibold" : "text-foreground/90 font-medium"
                        }`}
                      >
                        {senderDisplayName}
                      </p>
                      {messages.length > 1 && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.2 rounded-md shrink-0">
                          {messages.length}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      {formatTimestamp(lastMsg.created_at || thread.updated_at)}
                    </span>
                  </div>

                  {/* Middle Row: Subject */}
                  <p
                    className={`text-xs mt-1 truncate ${
                      isUnread ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {thread.subject}
                  </p>

                  {/* Bottom Row: Snippet + Badges */}
                  <p className="text-[11px] text-muted-foreground/80 line-clamp-1 mt-0.5">
                    {snippet}
                  </p>

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {thread.category && (
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryColor(
                          thread.category
                        )}`}
                      >
                        {thread.category}
                      </span>
                    )}

                    {hasAttachments && (
                      <span className="inline-flex items-center gap-1 text-[9px] text-primary/80 bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded-md font-mono">
                        <Paperclip className="h-2.5 w-2.5" />
                        Att
                      </span>
                    )}

                    {thread.tags?.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[9px] text-muted-foreground bg-secondary/80 border border-border/40 px-1.5 py-0.2 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

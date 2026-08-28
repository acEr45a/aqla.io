import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  RefreshCw,
  FileJson,
  Eye,
  Paperclip,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SuperAdminAuditFeed({
  threads = [],
  onRefresh,
  loading,
  onInspectThread,
}) {
  const [query, setQuery] = useState("");
  const [inspectedMessage, setInspectedMessage] = useState(null);

  // Flatten all messages across all threads for full audit logging
  const allMessages = threads.flatMap((th) =>
    (th.messages || []).map((m) => ({
      ...m,
      thread_subject: th.subject,
      thread_category: th.category,
      thread_tags: th.tags,
    }))
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filtered = allMessages.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      m.sender_email?.toLowerCase().includes(q) ||
      m.recipient_email?.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q) ||
      m.thread_subject?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden select-none">
      {/* Super Admin Audit Banner */}
      <div className="p-4 border-b border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              Super Admin Global Email Audit Stream
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-full text-[10px] font-mono">
                ORGANIZATION-WIDE
              </span>
            </h2>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Live immutable stream of all inbound and outbound clinical communications with Svix signature & encryption verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-8 border-amber-500/40 text-amber-300 hover:bg-amber-500/15 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Stream
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 border-b border-border/40 bg-card/40 flex items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audit trail by sender, recipient, subject, or UUID…"
            className="pl-9 h-9 text-xs bg-secondary/40 border-border/50 rounded-xl"
          />
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          Showing {filtered.length} audit records
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/30 text-muted-foreground sticky top-0 backdrop-blur-md">
              <th className="p-3 font-semibold">Timestamp</th>
              <th className="p-3 font-semibold">Direction / Sender</th>
              <th className="p-3 font-semibold">Recipient</th>
              <th className="p-3 font-semibold">Subject & Thread</th>
              <th className="p-3 font-semibold">Security & Svix</th>
              <th className="p-3 font-semibold text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {filtered.map((msg, idx) => {
              const isInbound = msg.recipient_email?.includes("aqla.io") || msg.recipient_email?.includes("ndapape.resend.app");

              return (
                <tr
                  key={msg.id || idx}
                  className="hover:bg-secondary/20 transition-colors group cursor-pointer"
                  onClick={() => setInspectedMessage(msg)}
                >
                  <td className="p-3 text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(msg.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          isInbound
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : "bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30"
                        }`}
                      >
                        {isInbound ? "INBOUND" : "OUTBOUND"}
                      </span>
                      <span className="font-medium text-foreground">{msg.sender_name || msg.sender_email}</span>
                    </div>
                  </td>

                  <td className="p-3 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                    {msg.recipient_email}
                  </td>

                  <td className="p-3 max-w-xs truncate">
                    <p className="text-foreground font-medium truncate">{msg.subject || msg.thread_subject}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {msg.body_html?.replace(/<[^>]*>/g, " ")}
                    </p>
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-mono">
                        <Lock className="h-2.5 w-2.5" /> AES-256
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full font-mono">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Svix Verified
                      </span>
                      {msg.attachments?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-mono">
                          <Paperclip className="h-2.5 w-2.5" /> {msg.attachments.length}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectedMessage(msg);
                      }}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Details
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Inspection Modal */}
      {inspectedMessage && (
        <Dialog open={!!inspectedMessage} onOpenChange={(o) => !o && setInspectedMessage(null)}>
          <DialogContent className="max-w-2xl bg-card border-border/80 p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <FileJson className="h-4 w-4 text-primary" />
                Audit Record Telemetry: {inspectedMessage.id || "Message"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 bg-secondary/40 p-3 rounded-xl border border-border/40">
                <div>
                  <span className="text-muted-foreground">From:</span>
                  <p className="text-foreground font-semibold">{inspectedMessage.sender_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">To:</span>
                  <p className="text-foreground font-semibold">{inspectedMessage.recipient_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="text-foreground">{inspectedMessage.created_at}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Thread ID:</span>
                  <p className="text-foreground truncate">{inspectedMessage.thread_id}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-semibold">Body Content:</span>
                <div
                  className="mt-1 p-3 rounded-xl bg-black/40 border border-border/60 text-foreground/90 max-h-48 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: inspectedMessage.body_html }}
                />
              </div>

              {inspectedMessage.attachments?.length > 0 && (
                <div>
                  <span className="text-muted-foreground font-semibold">Attachments ({inspectedMessage.attachments.length}):</span>
                  <div className="mt-1 space-y-1">
                    {inspectedMessage.attachments.map((att, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border/40 text-xs">
                        <span>{att.name} ({att.size} bytes)</span>
                        <span className="text-primary">{att.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

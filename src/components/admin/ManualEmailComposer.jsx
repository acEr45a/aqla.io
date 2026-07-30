import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, ArrowDownWideNarrow, ArrowUpWideNarrow, Search, ClipboardPaste } from "lucide-react";

const REGISTRATION_TEMPLATE = {
  subject: "Welcome to AQLA — your brain OS is ready",
  message: [
    "Your personal brain operating system is ready.",
    "Your account is verified. From here, AQLA measures how your attention, memory, energy and recovery actually behave — then builds a 14-day protocol around your own patterns rather than generic advice. The more you check in, the sharper it gets.",
    "Your first steps:",
    "1. Complete your assessment — about 8 minutes. This builds your first Brain Map across every cognitive domain.",
    "2. Run the safety screening — a short, deterministic check that keeps every recommendation appropriate for you.",
    "3. Start your first protocol — specific daily actions, chosen for your weakest link and reviewed after 14 days.",
    "4. Check in daily — under 60 seconds. This is what keeps your map, insights and protocol accurate.",
    "Meet AQLA Intelligence, your built-in brain analyst. Ask why your focus dropped, what to adjust first, or what the evidence says — it answers from your own data, and tells you when the data is too thin to be sure.",
    "Need a hand? The Help Center covers everything, and the Evidence Library shows the research behind every protocol.",
  ].join("\n\n"),
};

export default function ManualEmailComposer({ users = [], onSent }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendToAll, setSendToAll] = useState(false);
  const [selected, setSelected] = useState([]);
  const [order, setOrder] = useState("newest");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users
      .filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
      .sort((a, b) => order === "newest"
        ? new Date(b.joined) - new Date(a.joined)
        : new Date(a.joined) - new Date(b.joined));
  }, [users, search, order]);

  const toggle = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const send = async () => {
    setSending(true);
    setStatus(null);
    const response = await base44.functions.invoke("sendManualEmail", {
      subject, message, sendToAll, recipientIds: selected,
    });
    setSending(false);
    if (response.data?.error) return setStatus({ error: response.data.error });
    setStatus({ ok: `Sent to ${response.data.sent_count} member${response.data.sent_count === 1 ? "" : "s"}.` });
    setSubject(""); setMessage(""); setSelected([]); setSendToAll(false);
    onSent?.();
  };

  const canSend = subject.trim() && message.trim() && (sendToAll || selected.length > 0) && !sending;

  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-foreground">Send an email</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Compose a message and send it to selected members or everyone.</p>
        </div>
        <Button type="button" variant="outline" size="sm"
          onClick={() => { setSubject(REGISTRATION_TEMPLATE.subject); setMessage(REGISTRATION_TEMPLATE.message); }}>
          <ClipboardPaste className="mr-1.5 h-3.5 w-3.5" />Paste registration email
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6}
          placeholder="Write your message… blank lines become paragraphs." />
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
        <Checkbox checked={sendToAll} onCheckedChange={(v) => setSendToAll(Boolean(v))} />
        Send to all members ({users.length})
      </label>

      {!sendToAll && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members" className="pl-9" />
            </div>
            <Button type="button" variant="outline" size="sm"
              onClick={() => setOrder((o) => o === "newest" ? "oldest" : "newest")}>
              {order === "newest" ? <ArrowDownWideNarrow className="mr-1.5 h-3.5 w-3.5" /> : <ArrowUpWideNarrow className="mr-1.5 h-3.5 w-3.5" />}
              {order === "newest" ? "Newest first" : "Oldest first"}
            </Button>
          </div>

          <div className="mt-3 max-h-64 divide-y divide-border/40 overflow-y-auto rounded-xl border border-border/60">
            {visible.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No members match that search.</p>
            ) : visible.map((u) => (
              <label key={u.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-secondary/40">
                <Checkbox checked={selected.includes(u.id)} onCheckedChange={() => toggle(u.id)} />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{u.name}</span>
                <span className="hidden min-w-0 truncate text-xs text-muted-foreground sm:block">{u.email}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{new Date(u.joined).toLocaleDateString()}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{selected.length} selected</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={send} disabled={!canSend}>
          <Send className="mr-2 h-4 w-4" />{sending ? "Sending…" : "Send email"}
        </Button>
        {status?.ok && <p className="text-xs text-primary">{status.ok}</p>}
        {status?.error && <p className="text-xs text-destructive">{status.error}</p>}
      </div>
    </div>
  );
}
import React, { useMemo } from "react";
import { localDateKey } from "@/lib/dateKey";
import { Flag, ClipboardCheck, CalendarClock, MessageSquare, Inbox } from "lucide-react";

const TYPE_META = {
  flag: { label: "Flag", accent: "#E8756B", icon: Flag, section: "safety" },
  review: { label: "Review", accent: "#7B94FF", icon: ClipboardCheck, section: "overview" },
  overdue: { label: "Overdue Plan", accent: "#F2C04E", icon: CalendarClock, section: "protocol" },
  rec: { label: "Unread Rec", accent: "#9ca3af", icon: MessageSquare, section: "actions" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ClinicianInbox({ flags, reviews, members, recommendations, planReviews, onOpenMember }) {
  const today = localDateKey();
  const memberName = (id) => members.find((m) => m.id === id)?.name || "Unnamed member";

  const items = useMemo(() => {
    const list = [];

    // 1. Pending ClinicalFlags — oldest first (age = oldest first = ascending created_date).
    (flags || [])
      .filter((f) => f.status === "pending" && f.user_id)
      .sort((a, b) => (a.created_date < b.created_date ? -1 : 1))
      .forEach((f) => {
        list.push({
          id: `flag-${f.id}`,
          type: "flag",
          userId: f.user_id,
          memberName: f.user_name || memberName(f.user_id),
          summary: f.message_snippet?.slice(0, 110) || "Flagged content needs review.",
          timestamp: f.created_date,
        });
      });

    // 2. Pending ClinicianReviews — sorted by safety_flags count descending.
    (reviews || [])
      .filter((r) => r.status === "pending")
      .sort((a, b) => (b.safety_flags?.length || 0) - (a.safety_flags?.length || 0))
      .forEach((r) => {
        list.push({
          id: `review-${r.id}`,
          type: "review",
          userId: r.created_by_id,
          memberName: r.user_name || "Unnamed member",
          summary: r.recommendation?.slice(0, 110) || "AI recommendation awaiting decision.",
          timestamp: r.created_date,
        });
      });

    // 3. Overdue plans — protocol.review_date < today and no PlanReview with matching protocol_id.
    const reviewedProtocolIds = new Set((planReviews || []).map((p) => p.protocol_id).filter(Boolean));
    (members || []).forEach((m) => {
      const p = m.protocol;
      if (p && p.review_date && p.review_date < today && !reviewedProtocolIds.has(p.id)) {
        list.push({
          id: `overdue-${m.id}`,
          type: "overdue",
          userId: m.id,
          memberName: m.name,
          summary: `Protocol "${p.name}" review date passed ${p.review_date}.`,
          timestamp: p.review_date,
        });
      }
    });

    // 4. Unread recs — status=active older than 48h.
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    (recommendations || [])
      .filter((r) => r.status === "active" && r.user_id && new Date(r.created_date).getTime() < cutoff)
      .forEach((r) => {
        list.push({
          id: `rec-${r.id}`,
          type: "rec",
          userId: r.user_id,
          memberName: memberName(r.user_id),
          summary: r.title ? `${r.title}: ${r.message?.slice(0, 80) || ""}` : (r.message?.slice(0, 110) || "Recommendation not yet acknowledged."),
          timestamp: r.created_date,
        });
      });

    return list;
  }, [flags, reviews, members, recommendations, planReviews, today]);

  if (items.length === 0) {
    return (
      <div className="aqla-panel rounded-2xl p-10 text-center">
        <Inbox className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        <p className="mt-3 text-sm text-foreground">Inbox is clear.</p>
        <p className="mt-1 text-xs text-muted-foreground">No flags, reviews, overdue plans, or unread recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const meta = TYPE_META[item.type];
        const Icon = meta.icon;
        return (
          <button
            key={item.id}
            onClick={() => onOpenMember(item.userId, meta.section)}
            className="w-full text-left flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 transition-colors hover:bg-card/80"
            style={{ borderLeft: `3px solid ${meta.accent}` }}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: meta.accent }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground truncate">{item.memberName}</p>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: `${meta.accent}1a`, color: meta.accent }}
                >
                  {meta.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">{timeAgo(item.timestamp)}</span>
          </button>
        );
      })}
    </div>
  );
}
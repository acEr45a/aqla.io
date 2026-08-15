import React, { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

// Surfaces in-dashboard pop-up alerts to the clinician when new items arrive:
// clinical flags, pending reviews, and member-reported issues.
// Fires on load for anything unseen since the clinician's last visit, then live
// via realtime subscriptions while the dashboard is open.
const SEEN_KEY = "aqla_clinician_last_seen";

const SOURCES = [
  { entity: "ClinicalFlag", label: "New clinical flag", describe: (r) => r.message_snippet?.slice(0, 90) || "Flagged content needs review." },
  { entity: "ClinicianReview", label: "New review awaiting decision", describe: (r) => r.recommendation?.slice(0, 90) || "AI recommendation awaiting decision." },
  { entity: "UserComplaint", label: "New member report", describe: (r) => r.subject || r.detail?.slice(0, 90) || "A member submitted a report." },
];

export default function ClinicianAlerts({ onNew }) {
  const lastSeen = useRef(null);

  useEffect(() => {
    lastSeen.current = localStorage.getItem(SEEN_KEY);
    const stamp = new Date().toISOString();

    const alert = (label, description) => {
      const t = toast({ title: label, description });
      setTimeout(() => t.dismiss(), 4000);
    };

    // Catch-up pass: anything created since the clinician was last here.
    SOURCES.forEach(async ({ entity, label, describe }) => {
      if (!lastSeen.current) return;
      try {
        const rows = await base44.entities[entity].list("-created_date", 20);
        const fresh = (rows || []).filter(
          (r) => r.created_date > lastSeen.current && r.status === "pending"
        );
        if (fresh.length === 1) alert(label, describe(fresh[0]));
        else if (fresh.length > 1) alert(`${fresh.length} ${label.replace("New ", "new ")}s`, "Opened while you were away — review the inbox.");
      } catch {
        /* entity may be out of this role's read scope — skip silently */
      }
    });

    // Live pass: new records arriving while the dashboard is open.
    const unsubs = SOURCES.map(({ entity, label, describe }) => {
      try {
        return base44.entities[entity].subscribe((event) => {
          if (event?.type !== "create" || !event.data) return;
          alert(label, describe(event.data));
          onNew?.();
        });
      } catch {
        return null;
      }
    });

    localStorage.setItem(SEEN_KEY, stamp);
    return () => unsubs.forEach((u) => { try { u?.(); } catch { /* noop */ } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
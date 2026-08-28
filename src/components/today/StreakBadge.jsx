import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import { localDateKey } from "@/lib/dateKey";
import { Flame } from "lucide-react";

// Visual adherence badge. The streak integer is computed on the backend
// (timezone-aware, one grace day) — this component only renders it.
export default function StreakBadge({ refreshKey }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient.functions
      .invoke("getStreak", { today: localDateKey() })
      .then((res) => setData(res.data?.error ? null : res.data))
      .catch(() => setData(null));
  }, [refreshKey]);

  if (!data || !data.current_streak) return null;

  const days = data.current_streak;
  const filled = Math.min(days, 7);

  return (
    <div className="mt-4 flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
        <Flame className="h-3.5 w-3.5" />
        <span className="tabular-nums font-medium">{days}</span> day{days === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-4 rounded-full ${i < filled ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>
      {data.grace_day_used && (
        <span className="text-[11px] text-muted-foreground">grace day used</span>
      )}
    </div>
  );
}
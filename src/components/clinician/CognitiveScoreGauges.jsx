import React from "react";

// Horizontal bar gauges for normalized cognitive test scores (0-100).
// Color-coded: green >=70, amber 45-69, red <45.
function colorFor(score) {
  if (score == null) return "#6b7280";
  if (score >= 70) return "#C9F24E";
  if (score >= 45) return "#F2C04E";
  return "#E8756B";
}

const TEST_LABELS = {
  reaction_time: "Reaction time",
  sustained_attention: "Sustained attention",
  memory_recall: "Memory recall",
  working_memory: "Working memory",
  task_switching: "Task switching",
  visual_spatial: "Visual-spatial",
  verbal_fluency: "Verbal fluency",
};

export default function CognitiveScoreGauges({ tests }) {
  if (!tests || tests.length === 0) {
    return <p className="text-sm text-muted-foreground">No cognitive test records on file.</p>;
  }
  // Most recent score per test_type.
  const byType = {};
  [...tests]
    .sort((a, b) => (a.completed_date < b.completed_date ? 1 : -1))
    .forEach((t) => { if (!byType[t.test_type]) byType[t.test_type] = t; });

  const rows = Object.values(byType);
  return (
    <div className="space-y-3">
      {rows.map((t) => {
        const score = t.normalized_score;
        const color = colorFor(score);
        return (
          <div key={t.id}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-foreground/90">{TEST_LABELS[t.test_type] || t.test_type}</p>
              <p className="text-xs tabular-nums" style={{ color }}>{score != null ? Math.round(score) : "—"}</p>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary/60 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: score != null ? `${Math.min(Math.max(score, 0), 100)}%` : "0%", background: color }}
              />
            </div>
            {t.completed_date && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(t.completed_date).toLocaleDateString()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
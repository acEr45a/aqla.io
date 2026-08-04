// Shared render blocks for period-based Fable reports (weekly + end-of-plan).
import { readinessOf, avgOf, prettyTest, inPeriod } from "@/lib/pdf/fableCore";

export function periodData({ periodStart, periodEnd, checkIns = [], sessions = [], cognitiveTests = [] }) {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  end.setHours(23, 59, 59);
  const periodDays = Math.max(1, Math.round((end - start) / 86400000));
  return {
    start, end, periodDays,
    fmt: (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    periodCheckIns: checkIns.filter((c) => inPeriod(c.date, start, end)).sort((a, b) => a.date.localeCompare(b.date)),
    periodSessions: sessions.filter((s) => inPeriod(s.completed_date, start, end)),
    periodTests: cognitiveTests.filter((x) => inPeriod(x.completed_date, start, end)),
  };
}

export const METRIC_ROWS = [
  { label: "CLARITY", key: "clarity" },
  { label: "ENERGY", key: "energy" },
  { label: "SLEEP QUALITY", key: "sleep_quality" },
  { label: "LOW STRESS", key: "stress", invert: true },
];

export const avgMetric = (arr, key, invert) =>
  avgOf(arr.map((c) => (invert ? 10 - (c[key] ?? 5) : c[key])).filter((v) => v != null));

/* Adherence ring + metric averages with first-half vs second-half deltas */
export function adherenceDash(f, { periodCheckIns, periodDays }) {
  const { doc, t } = f;
  const adherence = Math.min(Math.round((periodCheckIns.length / periodDays) * 100), 100);
  const dashH = 110;
  f.need(dashH + 10);
  f.panel(dashH);
  const cx = f.x(0) + f.w(2), cy = f.y + dashH / 2;
  f.ring(cx, cy, 32, adherence, t.accent, 6);
  doc.setTextColor(...t.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text(`${adherence}%`, cx, cy + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...t.muted);
  doc.text("ADHERENCE", cx, cy + 17, { align: "center" });

  const half = Math.ceil(periodCheckIns.length / 2);
  const firstHalf = periodCheckIns.slice(0, half);
  const secondHalf = periodCheckIns.slice(half);
  const mx = f.x(5), mw = f.w(7) - 14;
  METRIC_ROWS.forEach((r, i) => {
    const my = f.y + 20 + i * 22;
    const avg = avgMetric(periodCheckIns, r.key, r.invert);
    const d1 = avgMetric(firstHalf, r.key, r.invert);
    const d2 = avgMetric(secondHalf, r.key, r.invert);
    const delta = d1 != null && d2 != null ? d2 - d1 : null;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...t.faint);
    doc.text(`${r.label} (AVG)`, mx, my);
    f.bar(mx, my + 4, mw - 64, avg != null ? avg * 10 : 0, t.text, 4);
    doc.setFontSize(9);
    doc.setTextColor(...t.text);
    doc.text(avg != null ? `${avg}/10` : "—", mx + mw - 24, my + 9, { align: "right" });
    if (delta != null && delta !== 0) {
      doc.setTextColor(...(delta > 0 ? t.positive : t.negative));
      doc.setFontSize(8);
      doc.text(`${delta > 0 ? "+" : ""}${delta}`, mx + mw, my + 9, { align: "right" });
    }
  });
  f.y += dashH + 16;
  return adherence;
}

/* Full-period readiness sparkline panel */
export function trendBlock(f, { periodCheckIns, periodDays }) {
  const { doc, t } = f;
  const vals = periodCheckIns.map(readinessOf).filter((v) => v != null);
  const trendH = 92;
  f.need(trendH + 10);
  f.panel(trendH);
  doc.setTextColor(...t.faint);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(`READINESS TREND — ${periodCheckIns.length} CHECK-INS ACROSS ${periodDays} DAYS`, f.x(0) + 14, f.y + 16);
  if (vals.length >= 2) {
    f.spark(f.x(0) + 14, f.y + 28, f.w(9), trendH - 48, vals, t.accent);
    const delta = vals[vals.length - 1] - vals[0];
    doc.setTextColor(...(delta >= 0 ? t.positive : t.negative));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(`${delta >= 0 ? "+" : ""}${delta}`, f.W - f.M - 38, f.y + trendH / 2, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...t.muted);
    doc.text("NET CHANGE", f.W - f.M - 38, f.y + trendH / 2 + 12, { align: "center" });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...t.faint);
    doc.text("Not enough check-ins in this period for a trend.", f.x(0) + 14, f.y + trendH / 2 + 4);
  }
  f.y += trendH + 16;
}

/* Check-in log table with automatic page-break re-headers */
export function checkInTable(f, periodCheckIns) {
  const { doc, t } = f;
  const cols = [
    { label: "DATE", w: 92 },
    { label: "CLARITY", w: 72 },
    { label: "ENERGY", w: 72 },
    { label: "STRESS", w: 72 },
    { label: "SLEEP", w: 72 },
    { label: "READY", w: 60 },
  ];
  const rowH = 18;
  const header = () => {
    let cx = f.M;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...t.faint);
    cols.forEach((c) => { doc.text(c.label, cx, f.y); cx += c.w; });
    f.y += 7;
    doc.setDrawColor(...t.border);
    doc.setLineWidth(0.5);
    doc.line(f.M, f.y, f.W - f.M, f.y);
    f.y += 13;
  };
  if (!periodCheckIns.length) {
    f.para("No check-ins recorded in this period.");
    f.gap(10);
    return;
  }
  header();
  periodCheckIns.forEach((c, i) => {
    if (f.y > f.H - 90) { f.breakPage(); header(); }
    if (i % 2 === 0) {
      doc.setFillColor(...t.panel);
      doc.rect(f.M - 4, f.y - 11, f.CW + 8, rowH - 2, "F");
    }
    let cx = f.M;
    const ready = readinessOf(c);
    const vals = [c.date, c.clarity, c.energy, c.stress, c.sleep_quality, ready != null ? `${ready}%` : "—"];
    vals.forEach((v, j) => {
      doc.setFont("helvetica", j === 0 ? "bold" : "normal");
      doc.setFontSize(8);
      doc.setTextColor(...(j === 5 ? t.accent : t.text));
      doc.text(String(v ?? "—"), cx, f.y);
      cx += cols[j].w;
    });
    f.y += rowH;
  });
  f.gap(8);
}

/* Training sessions grouped by game + cognitive tests with bars */
export function trainingBlock(f, { periodSessions, periodTests }) {
  const { doc, t } = f;
  if (periodSessions.length) {
    const byGame = {};
    periodSessions.forEach((s) => {
      byGame[s.game_id] = byGame[s.game_id] || { count: 0, best: 0 };
      byGame[s.game_id].count += 1;
      byGame[s.game_id].best = Math.max(byGame[s.game_id].best, s.score || 0);
    });
    f.para(`${periodSessions.length} training sessions completed this period:`, { color: "text" });
    f.gap(6);
    Object.entries(byGame).forEach(([game, g]) => {
      f.need(24);
      doc.setFillColor(...t.accent);
      doc.rect(f.x(0), f.y - 5, 4, 4, "F");
      f.para(`${prettyTest(game)} — ${g.count} session${g.count > 1 ? "s" : ""}, best score ${Math.round(g.best)}`, { col: 0, span: 12 });
      f.gap(2);
    });
    f.gap(8);
  } else {
    f.para("No training sessions recorded in this period.");
    f.gap(10);
  }
  f.label("Cognitive tests this period");
  if (periodTests.length) {
    f.gap(4);
    periodTests.forEach((x) => {
      f.need(22);
      doc.setTextColor(...t.text);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(prettyTest(x.test_type), f.M, f.y);
      f.bar(f.x(4), f.y - 6, f.w(7) - 34, Math.min(x.normalized_score || 0, 100), t.accent, 6);
      doc.setFont("helvetica", "bold");
      doc.text(`${Math.round(x.normalized_score || 0)}`, f.W - f.M, f.y, { align: "right" });
      f.y += 19;
    });
    f.gap(8);
  } else {
    f.gap(4);
    f.para("No cognitive tests recorded in this period.");
    f.gap(10);
  }
}

/* Brain domain profile bars */
export function domainBlock(f, domains = []) {
  const { doc, t } = f;
  if (!domains.length) {
    f.para("No brain domain data yet — complete your assessment to build your Brain Map.");
    f.gap(10);
    return;
  }
  domains.forEach((d) => {
    f.need(26);
    const score = Math.round(d.score || 0);
    doc.setTextColor(...t.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(d.domain_name || d.domain_key || "—", f.M, f.y);
    if (d.trend && d.trend !== "stable") {
      doc.setTextColor(...(d.trend === "up" ? t.positive : t.negative));
      doc.setFontSize(8);
      doc.text(d.trend === "up" ? "▲" : "▼", f.x(3) - 14, f.y);
    }
    f.bar(f.x(3), f.y - 7, f.w(8) - 30, score, t.accent, 8);
    doc.setTextColor(...t.text);
    doc.setFontSize(9);
    doc.text(`${score}`, f.W - f.M, f.y, { align: "right" });
    f.y += 24;
  });
  f.gap(8);
}

/* Auto-written insight bullets from period deltas */
export function insightBullets(f, { periodCheckIns, periodDays }) {
  const { doc, t } = f;
  const half = Math.ceil(periodCheckIns.length / 2);
  const firstHalf = periodCheckIns.slice(0, half);
  const secondHalf = periodCheckIns.slice(half);
  const bullets = [];
  const adherence = Math.min(Math.round((periodCheckIns.length / periodDays) * 100), 100);
  bullets.push(`You checked in ${periodCheckIns.length} of ${periodDays} days (${adherence}% adherence).`);
  METRIC_ROWS.forEach((r) => {
    const d1 = avgMetric(firstHalf, r.key, r.invert);
    const d2 = avgMetric(secondHalf, r.key, r.invert);
    if (d1 != null && d2 != null && d2 !== d1) {
      const name = r.label.toLowerCase().replace("low stress", "stress resilience");
      bullets.push(`${name.charAt(0).toUpperCase() + name.slice(1)} ${d2 > d1 ? "improved" : "declined"} from ${d1}/10 to ${d2}/10 between the first and second half of the period.`);
    }
  });
  if (bullets.length === 1) bullets.push("Not enough data for metric-level insights — keep checking in daily to unlock deeper analysis.");
  bullets.forEach((b) => {
    f.need(24);
    doc.setFillColor(...t.accent);
    doc.rect(f.x(0), f.y - 5, 4, 4, "F");
    f.para(b, { color: "text" });
    f.gap(4);
  });
  f.gap(8);
}
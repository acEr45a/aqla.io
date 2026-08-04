// Fable end-of-plan cycle report PDF — 6 pages.
import { localDateKey } from "@/lib/dateKey";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import { Fable } from "@/lib/pdf/fableCore";
import { periodData, adherenceDash, trendBlock, checkInTable, trainingBlock, domainBlock, insightBullets, METRIC_ROWS, avgMetric } from "@/lib/pdf/fablePeriod";

export function generateFableEndOfPlanPdf({ periodStart, periodEnd, user, protocol, checkIns = [], sessions = [], domains = [], cognitiveTests = [], theme }) {
  const pd = periodData({ periodStart, periodEnd, checkIns, sessions, cognitiveTests });
  const firstName = user?.full_name?.split(" ")[0] || "there";
  const familyMeta = PROTOCOL_FAMILIES.find((x) => x.key === protocol?.family);

  const f = new Fable({
    docTitle: "End of Plan Report",
    rightTop: `${pd.fmt(pd.start)} — ${pd.fmt(pd.end)}`,
    rightBottom: `${firstName}'s cycle report`,
    theme,
  });

  /* ════ PAGE 1 — cycle overview ════ */
  f.para(`This is your complete ${protocol?.duration_days || pd.periodDays}-day cycle report for ${protocol?.name || "your protocol"}. It aggregates every check-in, training session and cognitive test recorded during the cycle, so you can see exactly what changed before deciding to continue or switch.`, { color: "text", size: 10, lh: 14 });
  f.gap(14);
  f.section("Cycle at a glance");
  adherenceDash(f, pd);
  const counts = [
    ["CHECK-INS", pd.periodCheckIns.length],
    ["TRAINING SESSIONS", pd.periodSessions.length],
    ["COGNITIVE TESTS", pd.periodTests.length],
    ["CYCLE DAYS", pd.periodDays],
  ];
  const cardH = 58;
  f.need(cardH + 10);
  counts.forEach(([lab, val], i) => {
    const col = i * 3;
    f.panel(cardH, { col, span: 3 });
    f.doc.setTextColor(...f.t.text);
    f.doc.setFont("helvetica", "bold");
    f.doc.setFontSize(18);
    f.doc.text(String(val), f.x(col) + 12, f.y + 30);
    f.doc.setFontSize(6.5);
    f.doc.setTextColor(...f.t.faint);
    f.doc.text(lab, f.x(col) + 12, f.y + 44);
  });
  f.y += cardH + 16;

  /* ════ PAGE 2 — trend & first vs second half ════ */
  f.breakPage();
  f.section("Readiness across the cycle");
  trendBlock(f, pd);
  f.section("First half vs second half");
  const half = Math.ceil(pd.periodCheckIns.length / 2);
  const firstHalf = pd.periodCheckIns.slice(0, half);
  const secondHalf = pd.periodCheckIns.slice(half);
  if (pd.periodCheckIns.length >= 4) {
    METRIC_ROWS.forEach((r) => {
      const d1 = avgMetric(firstHalf, r.key, r.invert);
      const d2 = avgMetric(secondHalf, r.key, r.invert);
      f.need(26);
      f.doc.setFont("helvetica", "bold");
      f.doc.setFontSize(6.8);
      f.doc.setTextColor(...f.t.faint);
      f.doc.text(r.label, f.M, f.y);
      f.bar(f.x(3), f.y - 6, f.w(4) - 10, d1 != null ? d1 * 10 : 0, f.t.muted, 6);
      f.bar(f.x(7), f.y - 6, f.w(4) - 40, d2 != null ? d2 * 10 : 0, f.t.accent, 6);
      const delta = d1 != null && d2 != null ? d2 - d1 : null;
      f.doc.setFontSize(9);
      f.doc.setTextColor(...(delta > 0 ? f.t.positive : delta < 0 ? f.t.negative : f.t.text));
      f.doc.text(delta != null ? `${delta > 0 ? "+" : ""}${delta}` : "—", f.W - f.M, f.y, { align: "right" });
      f.y += 24;
    });
    f.gap(4);
    f.para("Gray = first-half average, purple = second-half average, right column = net change.", { size: 8 });
    f.gap(10);
  } else {
    f.para("Not enough check-ins in this cycle for a half-by-half comparison.");
    f.gap(10);
  }

  /* ════ PAGE 3 — check-in log ════ */
  f.breakPage();
  f.section("Check-in log");
  checkInTable(f, pd.periodCheckIns);

  /* ════ PAGE 4 — cognitive testing ════ */
  f.breakPage();
  f.section("Cognitive testing deep dive");
  f.para("Normalized scores (0–100) for every cognitive test completed during the cycle, newest first. Scores are an interpretative layer over your raw metrics — trends matter more than single results.", { size: 9 });
  f.gap(12);
  trainingBlock(f, { periodSessions: [], periodTests: pd.periodTests });

  /* ════ PAGE 5 — training & domains ════ */
  f.breakPage();
  f.section("Training sessions");
  trainingBlock(f, { periodSessions: pd.periodSessions, periodTests: [] });
  f.section("Brain domain profile");
  domainBlock(f, domains);

  /* ════ PAGE 6 — findings & next steps ════ */
  f.breakPage();
  f.section("Findings");
  insightBullets(f, pd);
  if (protocol?.safety_notes) {
    f.section("Safety review");
    f.para(protocol.safety_notes);
    f.gap(12);
  }
  f.section("Next steps");
  if (protocol) {
    f.para(`${protocol.name} (${familyMeta?.name || protocol.family} family) — ${protocol.objective || ""}`, { color: "text" });
    f.gap(6);
  }
  f.para("Your cycle is complete. Open the AQLA dashboard to run your structured plan review — AQLA will analyze this data with you and recommend whether to continue this family or switch. You make the final call.");
  f.gap(8);

  f.ensurePages(6);
  f.footersAndSave(localDateKey(), `AQLA-Cycle-Report-${localDateKey(pd.start)}.pdf`);
}
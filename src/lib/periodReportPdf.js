import { jsPDF } from "jspdf";
import { localDateKey } from "@/lib/dateKey";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import { DOMAINS } from "@/lib/scoring";
import {
  PAL, FAMILY_RGB, DOMAIN_RGB, mix, newPage, checkPage, drawRing, drawBar,
  drawSparkline, sectionHeader, panel, paragraph, drawHeader, drawFooters,
  readinessOf, avgOf, prettyTest,
} from "@/lib/pdf/pdfCore";

const inPeriod = (dateStr, start, end) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
};

/* Detailed weekly / end-of-plan report using ALL data collected in the timeframe */
export function generatePeriodReportPdf({ kind, periodStart, periodEnd, user, protocol, checkIns = [], sessions = [], domains = [], cognitiveTests = [] }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  const CW = W - M * 2;
  const today = localDateKey();
  const firstName = user?.full_name?.split(" ")[0] || "there";

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  end.setHours(23, 59, 59);
  const periodDays = Math.max(1, Math.round((end - start) / 86400000));
  const fmt = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  const familyKey = protocol?.family || "SPARK";
  const familyColor = FAMILY_RGB[familyKey] || PAL.green;
  const familyMeta = PROTOCOL_FAMILIES.find((f) => f.key === familyKey);

  const periodCheckIns = checkIns.filter((c) => inPeriod(c.date, start, end)).sort((a, b) => a.date.localeCompare(b.date));
  const periodSessions = sessions.filter((s) => inPeriod(s.completed_date, start, end));
  const periodTests = cognitiveTests.filter((t) => inPeriod(t.completed_date, start, end));

  let y = drawHeader(doc, {
    subtitle: kind === "weekly" ? "Weekly Report" : "Plan Cycle Report",
    rightTop: `${fmt(start)} — ${fmt(end)}`,
    rightBottom: `${firstName}'s report`,
    familyColor,
    badge: familyMeta?.name || familyKey,
    badgeNote: familyMeta?.evidence || "",
  });

  /* ── Intro paragraph ── */
  y = paragraph(doc, M, y, CW,
    kind === "weekly"
      ? `This report covers every signal AQLA collected from ${fmt(start)} to ${fmt(end)}: ${periodCheckIns.length} daily check-ins, ${periodSessions.length} training sessions and ${periodTests.length} cognitive tests, analyzed against your Brain Map and active protocol.`
      : `This is your complete ${protocol?.duration_days || periodDays}-day cycle report for ${protocol?.name || "your protocol"}. It aggregates every check-in, training session and cognitive test recorded during the cycle, so you can see exactly what changed before deciding to continue or switch.`,
    { size: 10, color: PAL.text, lh: 14.5 }) + 14;

  /* ── Adherence + averages dashboard ── */
  const readinessVals = periodCheckIns.map(readinessOf).filter((v) => v != null);
  const adherence = Math.round((periodCheckIns.length / periodDays) * 100);
  const dashH = 108;
  panel(doc, M, y, CW, dashH);
  const ringCx = M + 62;
  const ringCy = y + dashH / 2;
  drawRing(doc, ringCx, ringCy, 31, Math.min(adherence, 100), familyColor, 6);
  doc.setTextColor(...PAL.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text(`${Math.min(adherence, 100)}%`, ringCx, ringCy + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...PAL.muted);
  doc.text("ADHERENCE", ringCx, ringCy + 17, { align: "center" });

  /* First-half vs second-half deltas */
  const half = Math.ceil(periodCheckIns.length / 2);
  const firstHalf = periodCheckIns.slice(0, half);
  const secondHalf = periodCheckIns.slice(half);
  const avgMetric = (arr, key, invert) => avgOf(arr.map((c) => (invert ? 10 - (c[key] ?? 5) : c[key])).filter((v) => v != null));
  const rows = [
    { label: "CLARITY", key: "clarity", color: [123, 148, 255] },
    { label: "ENERGY", key: "energy", color: PAL.green },
    { label: "SLEEP QUALITY", key: "sleep_quality", color: [95, 212, 232] },
    { label: "LOW STRESS", key: "stress", invert: true, color: [232, 162, 143] },
  ];
  const mx = M + 122;
  const mw = CW - 138;
  rows.forEach((r, i) => {
    const my = y + 17 + i * 22;
    const avg = avgMetric(periodCheckIns, r.key, r.invert);
    const d1 = avgMetric(firstHalf, r.key, r.invert);
    const d2 = avgMetric(secondHalf, r.key, r.invert);
    const delta = d1 != null && d2 != null ? d2 - d1 : null;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...PAL.muted);
    doc.text(`${r.label} (AVG)`, mx, my);
    drawBar(doc, mx, my + 4, mw - 76, avg != null ? avg * 10 : 0, r.color, 4);
    doc.setTextColor(...PAL.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(avg != null ? `${avg}/10` : "—", mx + mw - 68, my + 8);
    if (delta != null && delta !== 0) {
      doc.setTextColor(...(delta > 0 ? PAL.green : PAL.red));
      doc.setFontSize(8);
      doc.text(`${delta > 0 ? "+" : ""}${delta}`, mx + mw - 24, my + 8);
    }
  });
  y += dashH + 16;

  /* ── Readiness trend across the full period ── */
  if (readinessVals.length >= 2) {
    const trendH = 90;
    panel(doc, M, y, CW, trendH);
    doc.setTextColor(...PAL.muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(`READINESS TREND — ${periodCheckIns.length} CHECK-INS ACROSS ${periodDays} DAYS`, M + 16, y + 18);
    drawSparkline(doc, M + 16, y + 30, CW - 130, trendH - 50, readinessVals, PAL.green);
    const delta = readinessVals[readinessVals.length - 1] - readinessVals[0];
    doc.setTextColor(...(delta >= 0 ? PAL.green : PAL.red));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`${delta >= 0 ? "+" : ""}${delta}`, W - M - 50, y + trendH / 2, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...PAL.muted);
    doc.text("NET CHANGE", W - M - 50, y + trendH / 2 + 13, { align: "center" });
    y += trendH + 18;
  }

  /* ── Check-in log table ── */
  if (periodCheckIns.length) {
    y = checkPage(doc, y, 140);
    y = sectionHeader(doc, M, y, "Check-in log", familyColor);
    const cols = [
      { label: "DATE", w: 90 },
      { label: "CLARITY", w: 70 },
      { label: "ENERGY", w: 70 },
      { label: "STRESS", w: 70 },
      { label: "SLEEP", w: 70 },
      { label: "READY", w: 60 },
    ];
    const rowH = 18;
    const drawTableHeader = () => {
      let cx = M;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...PAL.faint);
      cols.forEach((c) => { doc.text(c.label, cx, y); cx += c.w; });
      y += 8;
      doc.setDrawColor(...PAL.panelBorder);
      doc.setLineWidth(0.5);
      doc.line(M, y, W - M, y);
      y += 12;
    };
    drawTableHeader();
    periodCheckIns.forEach((c, i) => {
      if (y > doc.internal.pageSize.getHeight() - 90) { y = newPage(doc); drawTableHeader(); }
      if (i % 2 === 0) {
        doc.setFillColor(...PAL.panel);
        doc.rect(M - 4, y - 11, CW + 8, rowH - 2, "F");
      }
      let cx = M;
      const vals = [c.date, c.clarity, c.energy, c.stress, c.sleep_quality, readinessOf(c) != null ? `${readinessOf(c)}%` : "—"];
      vals.forEach((v, j) => {
        doc.setFont("helvetica", j === 0 ? "bold" : "normal");
        doc.setFontSize(8);
        doc.setTextColor(...(j === 5 ? PAL.green : PAL.text));
        doc.text(String(v ?? "—"), cx, y);
        cx += cols[j].w;
      });
      y += rowH;
    });
    y += 8;
  }

  /* ── Training + testing ── */
  if (periodSessions.length || periodTests.length) {
    y = checkPage(doc, y, 120);
    y = sectionHeader(doc, M, y, "Training & testing", familyColor);
    if (periodSessions.length) {
      const byGame = {};
      periodSessions.forEach((s) => {
        byGame[s.game_id] = byGame[s.game_id] || { count: 0, best: 0 };
        byGame[s.game_id].count += 1;
        byGame[s.game_id].best = Math.max(byGame[s.game_id].best, s.score || 0);
      });
      y = paragraph(doc, M, y, CW, `${periodSessions.length} training sessions completed this period:`, { size: 9.5, color: PAL.text }) + 4;
      Object.entries(byGame).forEach(([game, g]) => {
        y = checkPage(doc, y, 30);
        doc.setFillColor(...familyColor);
        doc.circle(M + 4, y - 3, 2, "F");
        y = paragraph(doc, M + 14, y, CW - 16, `${prettyTest(game)} — ${g.count} session${g.count > 1 ? "s" : ""}, best score ${Math.round(g.best)}`, { size: 9.5 }) + 4;
      });
      y += 6;
    }
    if (periodTests.length) {
      y = checkPage(doc, y, 80);
      doc.setTextColor(...PAL.muted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("COGNITIVE TESTS THIS PERIOD", M, y);
      y += 12;
      periodTests.slice(0, 8).forEach((t) => {
        y = checkPage(doc, y, 30);
        doc.setTextColor(...PAL.text);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(prettyTest(t.test_type), M, y);
        drawBar(doc, M + 150, y - 6, CW - 200, Math.min(t.normalized_score || 0, 100), familyColor, 6);
        doc.setFont("helvetica", "bold");
        doc.text(`${Math.round(t.normalized_score || 0)}`, W - M, y, { align: "right" });
        y += 18;
      });
      y += 6;
    }
  }

  /* ── Brain domain profile ── */
  if (domains?.length) {
    y = checkPage(doc, y, 140);
    y = sectionHeader(doc, M, y, "Brain domain profile", PAL.green);
    const labelW = 112;
    const barW = CW - labelW - 44;
    domains.forEach((d) => {
      y = checkPage(doc, y, 36);
      const dc = DOMAIN_RGB[d.domain_key || d.key] || PAL.muted;
      const dname = d.domain_name || DOMAINS.find((dd) => dd.key === d.key)?.label || "";
      const dscore = Math.round(d.score || 0);
      doc.setTextColor(...PAL.text);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(dname, M, y);
      drawBar(doc, M + labelW, y - 7, barW, dscore, dc, 8);
      doc.setFontSize(9);
      doc.text(`${dscore}`, M + labelW + barW + 8, y);
      y += 22;
    });
    y += 10;
  }

  /* ── Protocol context ── */
  if (protocol) {
    y = checkPage(doc, y, 120);
    y = sectionHeader(doc, M, y, "Protocol context", familyColor);
    y = paragraph(doc, M, y, CW,
      `${protocol.name} (${familyMeta?.name || familyKey} family) — ${protocol.objective || ""} Started ${protocol.start_date || "—"} for ${protocol.duration_days || 14} days.`,
      { size: 9.5, color: PAL.text }) + 6;
    if (protocol.why_selected) {
      y = paragraph(doc, M, y, CW, `Why it was selected: ${protocol.why_selected}`, { size: 9.5 }) + 6;
    }
    if (kind === "end_of_plan") {
      y = paragraph(doc, M, y, CW,
        "Your cycle is complete. Open the AQLA dashboard to run your structured plan review — AQLA will analyze this data with you and recommend whether to continue this family or switch, and you make the final call.",
        { size: 9.5 }) + 6;
    }
  }

  drawFooters(doc, today);
  doc.save(`AQLA-${kind === "weekly" ? "Weekly" : "Cycle"}-Report-${localDateKey(start)}.pdf`);
}
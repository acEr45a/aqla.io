// Fable daily protocol PDF — 2 pages.
import { localDateKey } from "@/lib/dateKey";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import { Fable, readinessOf, prettyTest } from "@/lib/pdf/fableCore";

export function generateFableDailyPdf({ user, protocol, checkIns = [], domains = [], healthProfile, cognitiveTests = [], theme }) {
  const today = localDateKey();
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const firstName = user?.full_name?.split(" ")[0] || "there";
  const familyMeta = PROTOCOL_FAMILIES.find((x) => x.key === protocol?.family);

  const f = new Fable({ docTitle: "Daily Protocol", rightTop: dateStr, rightBottom: `${firstName}'s plan`, theme });
  const { doc, t } = f;
  const latest = checkIns[0];
  const checkedInToday = checkIns.some((c) => c.date === today);

  /* ════ PAGE 1 — readiness & priority ════ */
  if (!checkedInToday) {
    const msg = latest
      ? `Your most recent check-in is from ${latest.date} — the metrics below are dated. Complete today's 60-second check-in in the AQLA dashboard, then re-download this plan.`
      : `No daily check-in has been recorded yet — the metrics below use defaults. Complete your first check-in for an accurate plan.`;
    const lines = doc.splitTextToSize(msg, f.CW - 28);
    const h = 28 + lines.length * 11;
    f.panel(h);
    doc.setFillColor(...t.warning);
    doc.rect(f.x(0), f.y, 3, h, "F");
    doc.setTextColor(...t.warning);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("DATA NOTICE — DAILY CHECK-IN MISSING", f.x(0) + 14, f.y + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...t.muted);
    doc.text(lines, f.x(0) + 14, f.y + 27);
    f.y += h + 14;
  }

  // Cycle progress
  const startD = protocol?.start_date ? new Date(protocol.start_date) : new Date();
  const dayNum = Math.max(1, Math.floor((new Date() - startD) / 86400000) + 1);
  const totalDays = protocol?.duration_days || 14;
  f.label(`Cycle progress — Day ${Math.min(dayNum, totalDays)} of ${totalDays}${familyMeta ? ` · ${familyMeta.name}` : ""}`);
  f.bar(f.x(0), f.y, f.CW, Math.min((dayNum / totalDays) * 100, 100), t.accent, 5);
  f.y += 24;

  // Readiness dashboard — ring (cols 0-4) + metric bars (cols 5-11)
  const readiness = readinessOf(latest);
  const dashH = 112;
  f.panel(dashH);
  const cx = f.x(0) + f.w(2), cy = f.y + dashH / 2;
  f.ring(cx, cy, 33, readiness ?? 0, t.accent, 6);
  doc.setTextColor(...t.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(readiness != null ? `${readiness}` : "—", cx, cy + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...t.muted);
  doc.text("READINESS", cx, cy + 17, { align: "center" });
  const mx = f.x(5), mw = f.w(7) - 14;
  [
    ["CLARITY", latest?.clarity],
    ["ENERGY", latest?.energy],
    ["SLEEP QUALITY", latest?.sleep_quality],
    ["LOW STRESS", latest?.stress != null ? 10 - latest.stress : null],
  ].forEach(([lab, v], i) => {
    const my = f.y + 21 + i * 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...t.faint);
    doc.text(lab, mx, my);
    f.bar(mx, my + 4, mw - 44, v != null ? v * 10 : 0, t.text, 4);
    doc.setFontSize(9);
    doc.setTextColor(...t.text);
    doc.text(v != null ? `${v}/10` : "—", mx + mw, my + 9, { align: "right" });
  });
  f.y += dashH + 16;

  // 7-day readiness trend
  const week = [...checkIns].filter((c) => readinessOf(c) != null).slice(0, 7).reverse();
  const trendH = 88;
  f.panel(trendH);
  doc.setTextColor(...t.faint);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("READINESS TREND — LAST 7 CHECK-INS", f.x(0) + 14, f.y + 16);
  if (week.length >= 2) {
    const vals = week.map(readinessOf);
    f.spark(f.x(0) + 14, f.y + 28, f.w(9), trendH - 48, vals, t.accent);
    const delta = vals[vals.length - 1] - vals[0];
    doc.setTextColor(...(delta >= 0 ? t.positive : t.negative));
    doc.setFontSize(15);
    doc.text(`${delta >= 0 ? "+" : ""}${delta}`, f.W - f.M - 38, f.y + trendH / 2, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...t.muted);
    doc.text("VS. WEEK START", f.W - f.M - 38, f.y + trendH / 2 + 12, { align: "center" });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Not enough check-ins yet for a trend line.", f.x(0) + 14, f.y + trendH / 2 + 4);
  }
  f.y += trendH + 16;

  // Today's priority
  const priority = protocol?.actions?.[0]?.title || protocol?.objective || "Complete your assessment in the AQLA dashboard to receive your first personalized protocol.";
  const priLines = doc.splitTextToSize(priority, f.CW - 28);
  const priH = 36 + priLines.length * 16;
  f.need(priH + 10);
  f.panel(priH, { accent: true });
  doc.setTextColor(...t.accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("TODAY'S PRIORITY", f.x(0) + 14, f.y + 16);
  doc.setTextColor(...t.text);
  doc.setFontSize(13);
  doc.text(priLines, f.x(0) + 14, f.y + 34);
  f.y += priH + 16;

  /* ════ PAGE 2 — plan detail & profile ════ */
  f.breakPage();
  f.section("Step-by-step plan");
  if (protocol?.actions?.length) {
    protocol.actions.forEach((a, i) => {
      f.need(64);
      doc.setDrawColor(...t.accent);
      doc.setLineWidth(1);
      doc.circle(f.x(0) + 9, f.y, 10, "S");
      doc.setTextColor(...t.accent);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(String(i + 1), f.x(0) + 9, f.y + 3.5, { align: "center" });
      doc.setDrawColor(...t.border);
      doc.rect(f.x(0) + 27, f.y - 7, 11, 11, "S");
      const tx = f.x(0) + 48;
      const tw = f.CW - 48 - (a.time ? 72 : 0);
      doc.setTextColor(...t.text);
      doc.setFontSize(10.5);
      const titleLines = doc.splitTextToSize(a.title, tw);
      doc.text(titleLines, tx, f.y);
      let dy = f.y + titleLines.length * 13;
      if (a.detail) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...t.muted);
        const dl = doc.splitTextToSize(a.detail, tw);
        doc.text(dl, tx, dy);
        dy += dl.length * 11.5;
      }
      if (a.time) {
        doc.setDrawColor(...t.accent);
        doc.setLineWidth(0.8);
        doc.rect(f.W - f.M - 66, f.y - 9, 66, 17, "S");
        doc.setTextColor(...t.accent);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(a.time, f.W - f.M - 33, f.y + 2, { align: "center" });
      }
      f.y = dy + 16;
    });
  } else {
    f.para("No specific timed actions today. Follow your supporting habits and keep your check-in streak going — consistency is the strongest signal AQLA has for tuning your plan.");
    f.gap(12);
  }

  if (protocol?.supporting_actions?.length) {
    f.section("Supporting actions");
    protocol.supporting_actions.forEach((s) => {
      f.need(26);
      doc.setFillColor(...t.accent);
      doc.rect(f.x(0), f.y - 5, 4, 4, "F");
      f.para(s, { color: "text" });
      f.gap(4);
    });
    f.gap(8);
  }

  f.section("About your protocol");
  if (protocol) {
    f.para(`${protocol.name} is a ${totalDays}-day ${familyMeta?.name || protocol.family} protocol built for one objective: ${protocol.objective || familyMeta?.purpose || ""}`, { color: "text", size: 10, lh: 14 });
    f.gap(8);
    if (protocol.why_selected) {
      f.para(`Why AQLA selected it for you: ${protocol.why_selected}`);
      f.gap(8);
    }
    f.para(`This document regenerates every day from your live data. As check-ins accumulate, AQLA re-weights your readiness and adjusts today's priority. At day ${totalDays} you'll complete a structured review before continuing or switching families.`);
    f.gap(12);
  } else {
    f.para("No active protocol. Complete your assessment in the AQLA dashboard and your first personalized protocol will appear here.");
    f.gap(12);
  }

  if (domains?.length) {
    f.section("Brain domain profile");
    domains.forEach((d) => {
      f.need(26);
      const score = Math.round(d.score || 0);
      doc.setTextColor(...t.text);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(d.domain_name || d.domain_key || "—", f.M, f.y);
      f.bar(f.x(3), f.y - 7, f.w(8) - 30, score, t.accent, 8);
      doc.setFontSize(9);
      doc.text(`${score}`, f.W - f.M, f.y, { align: "right" });
      f.y += 24;
    });
    f.gap(8);
  }

  if (healthProfile?.eligibility_status || cognitiveTests.length) {
    f.section("Your profile snapshot");
    if (healthProfile?.eligibility_status) {
      f.para(`Safety screening status: ${healthProfile.eligibility_status.replace(/_/g, " ")}. Completed ${healthProfile.completed_date ? new Date(healthProfile.completed_date).toLocaleDateString() : "—"}. Every recommendation in this plan respects that screening.`);
      f.gap(8);
    }
    if (cognitiveTests.length) {
      f.label("Recent cognitive testing");
      f.gap(4);
      cognitiveTests.slice(0, 6).forEach((x) => {
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
    }
  }

  if (protocol?.safety_notes) {
    const sl = doc.splitTextToSize(protocol.safety_notes, f.CW - 28);
    const sH = 30 + sl.length * 11;
    f.need(sH + 10);
    f.panel(sH);
    doc.setFillColor(...t.warning);
    doc.rect(f.x(0), f.y, 3, sH, "F");
    doc.setTextColor(...t.warning);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("SAFETY NOTES", f.x(0) + 14, f.y + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...t.muted);
    doc.text(sl, f.x(0) + 14, f.y + 27);
    f.y += sH + 14;
  }

  f.ensurePages(2);
  f.footersAndSave(today, `AQLA-Daily-Plan-${today}.pdf`);
}
import { jsPDF } from "jspdf";
import { localDateKey } from "@/lib/dateKey";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import { DOMAINS } from "@/lib/scoring";
import {
  PAL, FAMILY_RGB, DOMAIN_RGB, mix, newPage, checkPage, drawRing, drawBar,
  drawSparkline, sectionHeader, panel, paragraph, drawHeader, drawFooters,
  readinessOf, avgOf, prettyTest,
} from "@/lib/pdf/pdfCore";

export function generateDailyPlanPdf({ user, protocol, checkIns = [], domains = [], healthProfile, cognitiveTests = [] }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  const CW = W - M * 2;
  const today = localDateKey();
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const firstName = user?.full_name?.split(" ")[0] || "there";

  const familyKey = protocol?.family || "SPARK";
  const familyColor = FAMILY_RGB[familyKey] || PAL.green;
  const familyMeta = PROTOCOL_FAMILIES.find((f) => f.key === familyKey);

  let y = drawHeader(doc, {
    subtitle: "Daily Brain Protocol",
    rightTop: dateStr,
    rightBottom: `${firstName}'s plan`,
    familyColor,
    badge: familyMeta?.name || familyKey,
    badgeNote: familyMeta?.evidence || "",
  });

  /* ── Stale-data disclaimer ── */
  const latest = checkIns[0];
  const checkedInToday = checkIns.some((c) => c.date === today);
  if (!checkedInToday) {
    const noticeText = latest
      ? `This plan was generated on ${today}, but your most recent daily check-in is from ${latest.date}. The readiness metrics below are dated. Complete today's 60-second check-in in the AQLA dashboard, then re-download this plan for fully current guidance.`
      : `No daily check-in has been recorded yet. The readiness metrics below use defaults, not your real data. Complete your first 60-second check-in in the AQLA dashboard for an accurate plan.`;
    const noticeLines = doc.splitTextToSize(noticeText, CW - 32);
    const nH = 30 + noticeLines.length * 12;
    doc.setFillColor(...mix(PAL.amber, PAL.bg, 0.88));
    doc.setDrawColor(...PAL.amber);
    doc.setLineWidth(0.8);
    doc.roundedRect(M, y, CW, nH, 8, 8, "FD");
    doc.setFillColor(...PAL.amber);
    doc.roundedRect(M, y, 4, nH, 2, 2, "F");
    doc.setTextColor(...PAL.amber);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("DATA NOTICE — DAILY CHECK-IN MISSING", M + 16, y + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...mix(PAL.amber, PAL.text, 0.4));
    doc.text(noticeLines, M + 16, y + 30);
    y += nH + 14;
  }

  /* ── Cycle progress ── */
  const startD = protocol?.start_date ? new Date(protocol.start_date) : new Date();
  const dayNum = Math.max(1, Math.floor((new Date() - startD) / 86400000) + 1);
  const totalDays = protocol?.duration_days || 14;
  doc.setTextColor(...PAL.faint);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("CYCLE PROGRESS", M, y);
  doc.setTextColor(...PAL.text);
  doc.setFontSize(10);
  doc.text(`Day ${Math.min(dayNum, totalDays)} of ${totalDays}`, W - M, y, { align: "right" });
  y += 6;
  drawBar(doc, M, y, CW, Math.min((dayNum / totalDays) * 100, 100), familyColor, 5);
  y += 22;

  /* ── Readiness dashboard: ring + metric bars ── */
  const readiness = readinessOf(latest);
  const dashH = 108;
  panel(doc, M, y, CW, dashH);
  const ringCx = M + 62;
  const ringCy = y + dashH / 2;
  drawRing(doc, ringCx, ringCy, 31, readiness ?? 0, PAL.green, 6);
  if (readiness != null) {
    doc.setTextColor(...PAL.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(21);
    doc.text(`${readiness}`, ringCx, ringCy + 4, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...PAL.muted);
    doc.text("READINESS", ringCx, ringCy + 17, { align: "center" });
  } else {
    doc.setTextColor(...PAL.faint);
    doc.setFontSize(8);
    doc.text("No data", ringCx, ringCy + 3, { align: "center" });
  }
  const mx = M + 122;
  const mw = CW - 138;
  const metrics = [
    { label: "CLARITY", value: latest?.clarity, color: [123, 148, 255] },
    { label: "ENERGY", value: latest?.energy, color: PAL.green },
    { label: "SLEEP QUALITY", value: latest?.sleep_quality, color: [95, 212, 232] },
    { label: "LOW STRESS", value: latest?.stress != null ? 10 - latest.stress : null, color: [232, 162, 143] },
  ];
  metrics.forEach((m, i) => {
    const my = y + 17 + i * 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...PAL.muted);
    doc.text(m.label, mx, my);
    drawBar(doc, mx, my + 4, mw - 40, m.value != null ? m.value * 10 : 0, m.color, 4);
    doc.setTextColor(...PAL.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(m.value != null ? `${m.value}/10` : "—", mx + mw - 32, my + 8);
  });
  y += dashH + 16;

  /* ── 7-day readiness trend ── */
  const week = [...checkIns].filter((c) => readinessOf(c) != null).slice(0, 7).reverse();
  if (week.length >= 2) {
    const trendH = 84;
    panel(doc, M, y, CW, trendH);
    doc.setTextColor(...PAL.muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("READINESS TREND — LAST 7 CHECK-INS", M + 16, y + 18);
    const vals = week.map(readinessOf);
    drawSparkline(doc, M + 16, y + 28, CW - 130, trendH - 46, vals, PAL.green);
    const delta = vals[vals.length - 1] - vals[0];
    doc.setTextColor(...(delta >= 0 ? PAL.green : PAL.red));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`${delta >= 0 ? "+" : ""}${delta}`, W - M - 50, y + trendH / 2 - 2, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...PAL.muted);
    doc.text("VS. WEEK START", W - M - 50, y + trendH / 2 + 12, { align: "center" });
    y += trendH + 16;
  }

  /* ── Today's priority ── */
  if (protocol) {
    const priority = protocol.actions?.[0]?.title || protocol.objective;
    const priLines = doc.splitTextToSize(priority, CW - 32);
    const detail = protocol.actions?.[0]?.detail;
    const detLines = detail ? doc.splitTextToSize(detail, CW - 32) : [];
    const priH = 34 + priLines.length * 17 + detLines.length * 12;
    y = checkPage(doc, y, priH + 40);
    panel(doc, M, y, CW, priH, familyColor);
    doc.setTextColor(...familyColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("TODAY'S PRIORITY", M + 16, y + 18);
    doc.setTextColor(...PAL.text);
    doc.setFontSize(14);
    doc.text(priLines, M + 16, y + 36);
    if (detLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...PAL.muted);
      doc.text(detLines, M + 16, y + 36 + priLines.length * 17);
    }
    y += priH + 20;
  }

  /* ── Step-by-step plan ── */
  y = checkPage(doc, y, 140);
  y = sectionHeader(doc, M, y, "Step-by-step plan", familyColor);
  if (protocol?.actions?.length) {
    protocol.actions.forEach((action, i) => {
      y = checkPage(doc, y, 90);
      doc.setFillColor(...mix(familyColor, PAL.bg, 0.85));
      doc.setDrawColor(...familyColor);
      doc.setLineWidth(1);
      doc.circle(M + 10, y, 11, "FD");
      doc.setTextColor(...familyColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(String(i + 1), M + 10, y + 3.5, { align: "center" });

      const cbX = M + 28;
      doc.setDrawColor(...PAL.panelBorder);
      doc.setLineWidth(1);
      doc.roundedRect(cbX, y - 7, 12, 12, 2, 2, "S");

      const tx = cbX + 22;
      const tw = CW - (tx - M) - (action.time ? 76 : 0);
      doc.setTextColor(...PAL.text);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const titleLines = doc.splitTextToSize(action.title, tw);
      doc.text(titleLines, tx, y);
      let dy = y + titleLines.length * 14;
      if (action.detail) {
        dy = paragraph(doc, tx, dy, tw, action.detail, { size: 9, lh: 12 });
      }
      if (action.time) {
        doc.setFillColor(...mix(familyColor, PAL.bg, 0.85));
        doc.roundedRect(W - M - 68, y - 8, 68, 18, 4, 4, "F");
        doc.setTextColor(...familyColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(action.time, W - M - 34, y + 3, { align: "center" });
      }
      y = dy + 18;
    });
  } else {
    y = paragraph(doc, M, y, CW, "No specific timed actions today. Follow your supporting habits below and keep your check-in streak going — consistency is the strongest signal AQLA has for tuning your plan.", { size: 10 });
    y += 12;
  }

  /* ── Supporting actions ── */
  if (protocol?.supporting_actions?.length) {
    y = checkPage(doc, y, 100);
    y = sectionHeader(doc, M, y, "Supporting actions", familyColor);
    protocol.supporting_actions.forEach((s) => {
      y = checkPage(doc, y, 40);
      doc.setFillColor(...familyColor);
      doc.circle(M + 4, y - 3, 2, "F");
      y = paragraph(doc, M + 14, y, CW - 16, s, { size: 10, color: PAL.text }) + 5;
    });
  }

  /* ── About your protocol — detailed paragraphs ── */
  y = newPage(doc);
  y = sectionHeader(doc, M, y, "About your protocol", familyColor);
  if (protocol) {
    y = paragraph(doc, M, y, CW,
      `${protocol.name} is a ${totalDays}-day ${familyMeta?.name || familyKey} protocol built for one objective: ${protocol.objective || familyMeta?.purpose || ""}`,
      { size: 10.5, color: PAL.text, lh: 15 }) + 8;
    if (protocol.why_selected) {
      y = paragraph(doc, M, y, CW, `Why AQLA selected it for you: ${protocol.why_selected}`, { size: 9.5 }) + 8;
    }
    if (familyMeta) {
      y = paragraph(doc, M, y, CW,
        `The ${familyMeta.name} family targets ${familyMeta.purpose.toLowerCase().replace(/\.$/, "")}. Its approach: ${familyMeta.direction} Evidence level: ${familyMeta.evidence}. Every recommendation in this plan is derived from your own assessment, cognitive testing and daily check-in data — never from generic advice.`,
        { size: 9.5 }) + 8;
    }
    y = paragraph(doc, M, y, CW,
      `This document regenerates every day. As your check-ins accumulate, AQLA re-weights your readiness, adjusts today's priority, and flags when your data suggests the plan should change. At day ${totalDays} you'll complete a structured review before continuing or switching families.`,
      { size: 9.5 }) + 6;
  } else {
    y = paragraph(doc, M, y, CW, "No active protocol. Complete your assessment in the AQLA dashboard and your first personalized protocol will appear here.", { size: 10 }) + 6;
  }
  y += 10;

  /* ── Brain domain profile ── */
  if (domains?.length) {
    y = checkPage(doc, y, 120);
    y = sectionHeader(doc, M, y, "Brain domain profile", PAL.green);
    const labelW = 112;
    const barW = CW - labelW - 44;
    domains.forEach((d) => {
      y = checkPage(doc, y, 40);
      const dc = DOMAIN_RGB[d.domain_key || d.key] || PAL.muted;
      const dname = d.domain_name || DOMAINS.find((dd) => dd.key === d.key)?.label || "";
      const dscore = Math.round(d.score || 0);
      doc.setTextColor(...PAL.text);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(dname, M, y);
      if (d.trend && d.trend !== "stable") {
        doc.setTextColor(...(d.trend === "up" ? PAL.green : PAL.red));
        doc.setFontSize(8);
        doc.text(d.trend === "up" ? "+" : "-", M + labelW - 12, y);
      }
      drawBar(doc, M + labelW, y - 7, barW, dscore, dc, 8);
      doc.setTextColor(...PAL.text);
      doc.setFontSize(9);
      doc.text(`${dscore}`, M + labelW + barW + 8, y);
      y += 24;
    });
    y += 6;

    const weakest = domains.reduce((a, b) => (b.score < a.score ? b : a));
    if (weakest) {
      y = checkPage(doc, y, 90);
      const focusText = weakest.next_action || weakest.summary || "";
      const fl = focusText ? doc.splitTextToSize(focusText, CW - 100) : [];
      const faH = 44 + fl.length * 12;
      panel(doc, M, y, CW, faH, PAL.green);
      doc.setTextColor(...PAL.muted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("PRIMARY FOCUS AREA", M + 16, y + 16);
      doc.setTextColor(...PAL.text);
      doc.setFontSize(12);
      doc.text(weakest.domain_name || "—", M + 16, y + 32);
      if (fl.length) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...PAL.muted);
        doc.text(fl, M + 16, y + 46);
      }
      doc.setFillColor(...mix(PAL.green, PAL.bg, 0.85));
      doc.roundedRect(W - M - 58, y + 10, 44, 28, 4, 4, "F");
      doc.setTextColor(...PAL.green);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(`${Math.round(weakest.score)}`, W - M - 36, y + 29, { align: "center" });
      y += faH + 18;
    }
  }

  /* ── Profile snapshot: health status + recent cognitive tests ── */
  if (healthProfile || cognitiveTests.length) {
    y = checkPage(doc, y, 110);
    y = sectionHeader(doc, M, y, "Your profile snapshot", familyColor);
    if (healthProfile?.eligibility_status) {
      const statusLabel = healthProfile.eligibility_status.replace(/_/g, " ");
      y = paragraph(doc, M, y, CW,
        `Safety screening status: ${statusLabel}. Completed ${healthProfile.completed_date ? new Date(healthProfile.completed_date).toLocaleDateString() : "—"}. Every recommendation in this plan respects that screening.`,
        { size: 9.5 }) + 8;
    }
    if (cognitiveTests.length) {
      doc.setTextColor(...PAL.muted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("RECENT COGNITIVE TESTING", M, y);
      y += 12;
      cognitiveTests.slice(0, 6).forEach((t) => {
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

  /* ── Expected benefits + measuring ── */
  if (protocol?.expected_benefits?.length) {
    y = checkPage(doc, y, 90);
    y = sectionHeader(doc, M, y, "Expected benefits", familyColor);
    protocol.expected_benefits.forEach((b) => {
      y = checkPage(doc, y, 26);
      doc.setDrawColor(...familyColor);
      doc.setLineWidth(1.2);
      doc.line(M + 1, y - 3, M + 4, y);
      doc.line(M + 4, y, M + 9, y - 7);
      y = paragraph(doc, M + 18, y, CW - 24, b, { size: 10, color: PAL.text }) + 4;
    });
    y += 8;
  }
  if (protocol?.measuring?.length) {
    y = checkPage(doc, y, 70);
    y = sectionHeader(doc, M, y, "What we're measuring", familyColor);
    let tx = M;
    protocol.measuring.forEach((m) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const tw = doc.getTextWidth(m) + 22;
      if (tx + tw > W - M) { tx = M; y += 28; }
      doc.setFillColor(...PAL.panel);
      doc.setDrawColor(...PAL.panelBorder);
      doc.setLineWidth(0.6);
      doc.roundedRect(tx, y - 12, tw, 20, 5, 5, "FD");
      doc.setTextColor(...PAL.text);
      doc.text(m, tx + 11, y + 1);
      tx += tw + 8;
    });
    y += 26;
  }

  /* ── Safety notes ── */
  if (protocol?.safety_notes) {
    y = checkPage(doc, y, 90);
    const sl = doc.splitTextToSize(protocol.safety_notes, CW - 32);
    const sH = 34 + sl.length * 12;
    doc.setFillColor(...mix(PAL.amber, PAL.bg, 0.88));
    doc.setDrawColor(...PAL.amber);
    doc.setLineWidth(0.8);
    doc.roundedRect(M, y, CW, sH, 8, 8, "FD");
    doc.setFillColor(...PAL.amber);
    doc.roundedRect(M, y, 4, sH, 2, 2, "F");
    doc.setTextColor(...PAL.amber);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("SAFETY NOTES", M + 16, y + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...mix(PAL.amber, PAL.text, 0.4));
    doc.text(sl, M + 16, y + 30);
    y += sH + 14;
  }

  drawFooters(doc, today);
  doc.save(`AQLA-Daily-Plan-${today}.pdf`);
}
import { jsPDF } from "jspdf";
import { localDateKey } from "@/lib/dateKey";

const AQLA_GREEN = [201, 242, 78];
const AQLA_DARK = [26, 14, 6];
const AQLA_TEXT = [40, 30, 25];
const AQLA_MUTED = [120, 110, 105];
const AQLA_LIGHT = [245, 240, 234];
const AQLA_BORDER = [220, 215, 208];

export function generateDailyPlanPdf({ user, protocol, checkIns, domains }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const today = localDateKey();
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const firstName = user?.full_name?.split(" ")[0] || "there";

  /* ── Header band ── */
  doc.setFillColor(...AQLA_DARK);
  doc.rect(0, 0, W, 96, "F");
  doc.setTextColor(AQLA_GREEN[0], AQLA_GREEN[1], AQLA_GREEN[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("AQLA", M, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(AQLA_LIGHT[0], AQLA_LIGHT[1], AQLA_LIGHT[2]);
  doc.text("Daily Brain Protocol", M, 62);
  doc.text(dateStr, W - M, 44, { align: "right" });
  doc.text(`${firstName}'s plan`, W - M, 62, { align: "right" });

  /* ── Readiness strip ── */
  const latest = checkIns?.[0];
  const readiness = latest ? Math.round(((latest.clarity + latest.energy + latest.sleep_quality + (10 - latest.stress)) / 40) * 100) : null;
  const weakest = domains?.length ? domains.reduce((a, b) => (b.score < a.score ? b : a)) : null;

  let y = 124;
  const stripY = y;
  const stripH = 64;
  doc.setFillColor(AQLA_LIGHT[0], AQLA_LIGHT[1], AQLA_LIGHT[2]);
  doc.roundedRect(M, stripY, W - M * 2, stripH, 8, 8, "F");

  const colW = (W - M * 2) / 3;
  const metrics = [
    { label: "Readiness", value: readiness != null ? `${readiness}%` : "—" },
    { label: "Sleep recovery", value: latest?.sleep_quality != null ? `${latest.sleep_quality}/10` : "—" },
    { label: "Focus area", value: weakest?.domain_name || "—" },
  ];
  metrics.forEach((m, i) => {
    const cx = M + 16 + i * colW;
    doc.setTextColor(AQLA_MUTED[0], AQLA_MUTED[1], AQLA_MUTED[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(m.label.toUpperCase(), cx, stripY + 24);
    doc.setTextColor(AQLA_TEXT[0], AQLA_TEXT[1], AQLA_TEXT[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(m.value, cx, stripY + 46);
  });

  y = stripY + stripH + 28;

  /* ── Today's priority ── */
  if (protocol) {
    doc.setTextColor(AQLA_GREEN[0], AQLA_GREEN[1], AQLA_GREEN[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("TODAY'S PRIORITY", M, y);
    y += 16;
    doc.setTextColor(AQLA_TEXT[0], AQLA_TEXT[1], AQLA_TEXT[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const priority = protocol.actions?.[0]?.title || protocol.objective;
    const priorityLines = doc.splitTextToSize(priority, W - M * 2);
    doc.text(priorityLines, M, y);
    y += priorityLines.length * 20;
    if (protocol.actions?.[0]?.detail) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(AQLA_MUTED[0], AQLA_MUTED[1], AQLA_MUTED[2]);
      const detailLines = doc.splitTextToSize(protocol.actions[0].detail, W - M * 2);
      doc.text(detailLines, M, y);
      y += detailLines.length * 14 + 8;
    }
  }

  /* ── Step-by-step actions ── */
  y += 8;
  doc.setDrawColor(AQLA_GREEN[0], AQLA_GREEN[1], AQLA_GREEN[2]);
  doc.setLineWidth(2);
  doc.line(M, y, M + 28, y);
  y += 18;
  doc.setTextColor(AQLA_TEXT[0], AQLA_TEXT[1], AQLA_TEXT[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Step-by-step plan", M, y);
  y += 20;

  if (protocol?.actions?.length) {
    protocol.actions.forEach((action, i) => {
      if (y > H - 140) { doc.addPage(); y = M; }

      /* checkbox + number */
      doc.setDrawColor(AQLA_BORDER[0], AQLA_BORDER[1], AQLA_BORDER[2]);
      doc.setLineWidth(1.5);
      doc.roundedRect(M, y - 12, 18, 18, 3, 3, "S");
      doc.setTextColor(AQLA_GREEN[0], AQLA_GREEN[1], AQLA_GREEN[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(String(i + 1), M + 9, y, { align: "center" });

      /* title + detail */
      const tx = M + 32;
      const tw = W - M - tx - (action.time ? 60 : 0);
      doc.setTextColor(AQLA_TEXT[0], AQLA_TEXT[1], AQLA_TEXT[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const titleLines = doc.splitTextToSize(action.title, tw);
      doc.text(titleLines, tx, y);
      let dy = y + titleLines.length * 14;
      if (action.detail) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(AQLA_MUTED[0], AQLA_MUTED[1], AQLA_MUTED[2]);
        const detailLines = doc.splitTextToSize(action.detail, tw);
        doc.text(detailLines, tx, dy);
        dy += detailLines.length * 12;
      }
      if (action.time) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(AQLA_GREEN[0], AQLA_GREEN[1], AQLA_GREEN[2]);
        doc.text(action.time, W - M, y, { align: "right" });
      }
      y = dy + 16;
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(AQLA_MUTED[0], AQLA_MUTED[1], AQLA_MUTED[2]);
    doc.text("No active protocol actions for today.", M, y);
    y += 20;
  }

  /* ── Supporting actions ── */
  if (protocol?.supporting_actions?.length) {
    if (y > H - 120) { doc.addPage(); y = M; }
    y += 8;
    doc.setTextColor(AQLA_MUTED[0], AQLA_MUTED[1], AQLA_MUTED[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("SUPPORTING ACTIONS", M, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(AQLA_TEXT[0], AQLA_TEXT[1], AQLA_TEXT[2]);
    protocol.supporting_actions.forEach((s) => {
      if (y > H - 100) { doc.addPage(); y = M; }
      const lines = doc.splitTextToSize(`·  ${s}`, W - M * 2);
      doc.text(lines, M, y);
      y += lines.length * 13 + 4;
    });
  }

  /* ── Brain domain focus ── */
  if (weakest) {
    if (y > H - 100) { doc.addPage(); y = M; }
    y += 14;
    doc.setDrawColor(AQLA_GREEN[0], AQLA_GREEN[1], AQLA_GREEN[2]);
    doc.setLineWidth(2);
    doc.line(M, y, M + 28, y);
    y += 18;
    doc.setTextColor(AQLA_TEXT[0], AQLA_TEXT[1], AQLA_TEXT[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Current focus", M, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(AQLA_MUTED[0], AQLA_MUTED[1], AQLA_MUTED[2]);
    const focusText = `${weakest.domain_name} is your lowest domain at ${Math.round(weakest.score)}. ${weakest.next_action || weakest.summary || ""}`;
    const focusLines = doc.splitTextToSize(focusText, W - M * 2);
    doc.text(focusLines, M, y);
    y += focusLines.length * 13 + 8;
  }

  /* ── Safety notes ── */
  if (protocol?.safety_notes) {
    if (y > H - 100) { doc.addPage(); y = M; }
    y += 10;
    doc.setFillColor(252, 240, 220);
    doc.roundedRect(M, y, W - M * 2, 50, 6, 6, "F");
    doc.setTextColor(180, 130, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("SAFETY NOTES", M + 16, y + 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 90, 30);
    const safetyLines = doc.splitTextToSize(protocol.safety_notes, W - M * 2 - 32);
    doc.text(safetyLines, M + 16, y + 36);
    y += 58;
  }

  /* ── Footer ── */
  const footerY = H - 32;
  doc.setDrawColor(AQLA_BORDER[0], AQLA_BORDER[1], AQLA_BORDER[2]);
  doc.setLineWidth(0.5);
  doc.line(M, footerY, W - M, footerY);
  doc.setTextColor(AQLA_MUTED[0], AQLA_MUTED[1], AQLA_MUTED[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`AQLA · Neural wellness, not medical advice · Generated ${today}`, M, footerY + 14);
  doc.text("aqla.app", W - M, footerY + 14, { align: "right" });

  doc.save(`AQLA-Daily-Plan-${today}.pdf`);
}
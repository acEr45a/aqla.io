import { jsPDF } from "jspdf";
import { localDateKey } from "@/lib/dateKey";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import { DOMAINS } from "@/lib/scoring";

/* ── Brand palette ── */
const C = {
  green: [201, 242, 78],
  dark: [26, 14, 6],
  darker: [18, 10, 5],
  text: [38, 32, 28],
  muted: [128, 118, 110],
  light: [245, 240, 234],
  lighter: [250, 247, 243],
  border: [225, 218, 210],
  borderLt: [235, 230, 224],
  white: [255, 255, 255],
  amber: [180, 130, 30],
  amberBg: [252, 240, 220],
};

/* Protocol family colors (hex → rgb) */
const FAMILY_RGB = {
  SPARK: [201, 242, 78],
  FLOW: [95, 212, 232],
  DRIVE: [123, 148, 255],
  LEARN: [232, 162, 143],
  RESET: [143, 232, 194],
  DIGITAL: [184, 156, 246],
};

/* Domain colors (hex → rgb) */
const DOMAIN_RGB = {};
DOMAINS.forEach((d) => {
  const hex = d.color.replace("#", "");
  DOMAIN_RGB[d.key] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
});

/* ── Helpers ── */
const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const lerp = (a, b, t) => a + (b - a) * t;

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/* Draw a circular progress ring */
function drawRing(doc, cx, cy, r, pct, color, lineWidth) {
  // background ring
  doc.setDrawColor(...C.borderLt);
  doc.setLineWidth(lineWidth);
  doc.setLineCap("round");
  doc.circle(cx, cy, r, "S");

  // progress arc — approximate with line segments
  if (pct > 0) {
    doc.setDrawColor(...color);
    const segments = Math.max(2, Math.ceil((pct / 100) * 120));
    const startAngle = -Math.PI / 2; // start at top
    for (let i = 0; i < segments; i++) {
      const a1 = startAngle + (i / segments) * (pct / 100) * Math.PI * 2;
      const a2 = startAngle + ((i + 1) / segments) * (pct / 100) * Math.PI * 2;
      doc.line(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
    }
  }
  doc.setLineCap("butt");
}

/* Draw a horizontal bar with value */
function drawBar(doc, x, y, w, pct, color, height = 6) {
  doc.setFillColor(...C.borderLt);
  doc.roundedRect(x, y, w, height, height / 2, height / 2, "F");
  if (pct > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, (w * pct) / 100, height, height / 2, height / 2, "F");
  }
}

/* Section divider with accent line and title */
function sectionHeader(doc, x, y, w, title, accentColor) {
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(2.5);
  doc.setLineCap("round");
  doc.line(x, y, x + 32, y);
  doc.setLineCap("butt");
  doc.setTextColor(...C.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, x, y + 16);
  return y + 28;
}

/* Check pagination */
function checkPage(doc, y, threshold = 100) {
  const H = doc.internal.pageSize.getHeight();
  if (y > H - threshold) {
    doc.addPage();
    return 48;
  }
  return y;
}

/* ── Main generator ── */
export function generateDailyPlanPdf({ user, protocol, checkIns, domains }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const CW = W - M * 2; // content width
  const today = localDateKey();
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const firstName = user?.full_name?.split(" ")[0] || "there";

  /* Protocol family styling */
  const familyKey = protocol?.family || "SPARK";
  const familyColor = FAMILY_RGB[familyKey] || C.green;
  const familyMeta = PROTOCOL_FAMILIES.find((f) => f.key === familyKey);

  /* ── PAGE 1: HEADER ── */
  // Dark gradient header band (simulated with layered rects)
  doc.setFillColor(...C.darker);
  doc.rect(0, 0, W, 120, "F");
  doc.setFillColor(...C.dark);
  doc.rect(0, 60, W, 60, "F");

  // AQLA logo mark — concentric circles (neural icon)
  const logoCx = M + 8;
  const logoCy = 44;
  doc.setDrawColor(...familyColor);
  doc.setLineWidth(1.5);
  doc.circle(logoCx, logoCy, 12, "S");
  doc.setLineWidth(1);
  doc.circle(logoCx, logoCy, 7, "S");
  doc.setFillColor(...familyColor);
  doc.circle(logoCx, logoCy, 2.5, "F");
  // Neural rays
  doc.setDrawColor(...familyColor);
  doc.setLineWidth(0.8);
  for (let a = 0; a < 6; a++) {
    const ang = (a / 6) * Math.PI * 2;
    doc.line(logoCx + Math.cos(ang) * 14, logoCy + Math.sin(ang) * 14, logoCx + Math.cos(ang) * 18, logoCy + Math.sin(ang) * 18);
  }

  // Brand text
  doc.setTextColor(...familyColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("AQLA", M + 28, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 150, 142);
  doc.text("DAILY BRAIN PROTOCOL", M + 28, 56);

  // Right side: date + user
  doc.setTextColor(160, 150, 142);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(dateStr, W - M, 32, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.white);
  doc.text(`${firstName}'s plan`, W - M, 50, { align: "right" });

  // Family badge
  if (familyMeta) {
    doc.setFillColor(familyColor[0], familyColor[1], familyColor[2], 0.15);
    doc.roundedRect(W - M - 90, 64, 90, 22, 4, 4, "S");
    doc.setDrawColor(...familyColor);
    doc.setFillColor(familyColor[0], familyColor[1], familyColor[2]);
    doc.circle(W - M - 78, 75, 3, "F");
    doc.setTextColor(...familyColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(familyMeta.name, W - M - 68, 78);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(140, 130, 122);
    doc.text(familyMeta.evidence || "", W - M - 10, 78, { align: "right" });
  }

  // Thin accent line under header
  doc.setDrawColor(...familyColor);
  doc.setLineWidth(2);
  doc.line(0, 120, W, 120);

  /* ── DAY PROGRESS BAR ── */
  let y = 140;
  const startD = protocol?.start_date ? new Date(protocol.start_date) : new Date();
  const dayNum = Math.max(1, Math.floor((new Date() - startD) / 86400000) + 1);
  const totalDays = protocol?.duration_days || 14;
  const dayPct = clamp((dayNum / totalDays) * 100, 5, 100);

  doc.setTextColor(...C.muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(`CYCLE PROGRESS`, M, y);
  doc.setTextColor(...C.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Day ${dayNum} of ${totalDays}`, W - M, y, { align: "right" });
  y += 6;
  drawBar(doc, M, y, CW, dayPct, familyColor, 5);
  y += 22;

  /* ── READINESS DASHBOARD ── */
  const latest = checkIns?.[0];
  const readiness = latest ? Math.round(((latest.clarity + latest.energy + latest.sleep_quality + (10 - latest.stress)) / 40) * 100) : null;
  const weakest = domains?.length ? domains.reduce((a, b) => (b.score < a.score ? b : a)) : null;
  const strongest = domains?.length ? domains.reduce((a, b) => (b.score > a.score ? b : a)) : null;

  // Readiness ring card
  const dashY = y;
  const dashH = 110;
  doc.setFillColor(...C.lighter);
  doc.setDrawColor(...C.borderLt);
  doc.setLineWidth(0.5);
  doc.roundedRect(M, dashY, CW, dashH, 10, 10, "FD");

  // Left: readiness ring
  const ringCx = M + 65;
  const ringCy = dashY + dashH / 2;
  const ringR = 32;
  const ringLW = 6;

  if (readiness != null) {
    drawRing(doc, ringCx, ringCy, ringR, readiness, C.green, ringLW);
    doc.setTextColor(...C.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(`${readiness}`, ringCx, ringCy + 4, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text("READINESS", ringCx, ringCy + 18, { align: "center" });
  } else {
    drawRing(doc, ringCx, ringCy, ringR, 0, C.green, ringLW);
    doc.setTextColor(...C.muted);
    doc.setFontSize(9);
    doc.text("No data", ringCx, ringCy + 3, { align: "center" });
  }

  // Right: metric mini-bars
  const mx = M + 130;
  const mw = CW - 145;
  const metrics = [
    { label: "Clarity", value: latest?.clarity, max: 10, color: [123, 148, 255] },
    { label: "Energy", value: latest?.energy, max: 10, color: C.green },
    { label: "Sleep", value: latest?.sleep_quality, max: 10, color: [95, 212, 232] },
    { label: "Stress", value: latest?.stress != null ? 10 - latest.stress : null, max: 10, color: [232, 162, 143], invertLabel: "Low stress" },
  ];

  const metricRowH = 22;
  metrics.forEach((m, i) => {
    const my = dashY + 16 + i * metricRowH;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(m.invertLabel || m.label.toUpperCase(), mx, my);
    const pct = m.value != null ? (m.value / m.max) * 100 : 0;
    drawBar(doc, mx, my + 4, mw - 40, pct, m.color, 4);
    doc.setTextColor(...C.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(m.value != null ? `${m.value}/${m.max}` : "—", mx + mw - 32, my + 8);
  });

  y = dashY + dashH + 16;

  /* ── TODAY'S PRIORITY ── */
  if (protocol) {
    y = checkPage(doc, y, 160);
    const priH = 64;
    doc.setFillColor(...C.lighter);
    doc.setDrawColor(familyColor[0], familyColor[1], familyColor[2]);
    doc.setLineWidth(0);
    doc.roundedRect(M, y, CW, priH, 8, 8, "FD");
    // Left accent bar
    doc.setFillColor(...familyColor);
    doc.roundedRect(M, y, 4, priH, 2, 2, "F");

    doc.setTextColor(...C.muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("TODAY'S PRIORITY", M + 16, y + 18);
    doc.setTextColor(...C.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    const priority = protocol.actions?.[0]?.title || protocol.objective;
    const priorityLines = doc.splitTextToSize(priority, CW - 32);
    doc.text(priorityLines, M + 16, y + 36);
    if (protocol.actions?.[0]?.detail) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...C.muted);
      const detailLines = doc.splitTextToSize(protocol.actions[0].detail, CW - 32);
      doc.text(detailLines, M + 16, y + 36 + priorityLines.length * 16);
    }
    y += priH + 20;
  }

  /* ── STEP-BY-STEP PLAN ── */
  y = checkPage(doc, y, 140);
  y = sectionHeader(doc, M, y, CW, "Step-by-step plan", familyColor);

  if (protocol?.actions?.length) {
    protocol.actions.forEach((action, i) => {
      y = checkPage(doc, y, 90);

      // Numbered circle badge
      doc.setFillColor(familyColor[0], familyColor[1], familyColor[2], 0.12);
      doc.setDrawColor(...familyColor);
      doc.setLineWidth(1);
      doc.circle(M + 10, y, 11, "FD");
      doc.setTextColor(...familyColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(String(i + 1), M + 10, y + 3.5, { align: "center" });

      // Checkbox
      const cbX = M + 28;
      doc.setDrawColor(...C.border);
      doc.setLineWidth(1);
      doc.roundedRect(cbX, y - 7, 12, 12, 2, 2, "S");

      // Title
      const tx = cbX + 22;
      const tw = CW - (tx - M) - (action.time ? 72 : 0);
      doc.setTextColor(...C.text);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const titleLines = doc.splitTextToSize(action.title, tw);
      doc.text(titleLines, tx, y);
      let dy = y + titleLines.length * 14;

      // Detail
      if (action.detail) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...C.muted);
        const detailLines = doc.splitTextToSize(action.detail, tw);
        doc.text(detailLines, tx, dy);
        dy += detailLines.length * 12;
      }

      // Time badge
      if (action.time) {
        doc.setFillColor(familyColor[0], familyColor[1], familyColor[2], 0.1);
        doc.roundedRect(W - M - 66, y - 8, 66, 18, 4, 4, "F");
        doc.setTextColor(...familyColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(action.time, W - M - 33, y + 3, { align: "center" });
      }

      y = dy + 18;
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...C.muted);
    doc.text("No active protocol actions for today.", M, y);
    y += 20;
  }

  /* ── SUPPORTING ACTIONS ── */
  if (protocol?.supporting_actions?.length) {
    y = checkPage(doc, y, 100);
    y += 6;
    y = sectionHeader(doc, M, y, CW, "Supporting actions", familyColor);

    protocol.supporting_actions.forEach((s, i) => {
      y = checkPage(doc, y, 40);
      // Accent dot
      doc.setFillColor(...familyColor);
      doc.circle(M + 4, y - 2, 2, "F");
      const lines = doc.splitTextToSize(s, CW - 16);
      doc.setTextColor(...C.text);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(lines, M + 14, y);
      y += lines.length * 13 + 6;
    });
  }

  /* ── PAGE 2: DOMAIN CHART ── */
  if (domains?.length) {
    doc.addPage();
    y = 56;

    y = sectionHeader(doc, M, y, CW, "Brain domain profile", C.green);

    // Bar chart of all domains
    const barRowH = 26;
    const labelW = 110;
    const barW = CW - labelW - 50;

    domains.forEach((d, i) => {
      y = checkPage(doc, y, barRowH + 4);
      const dc = DOMAIN_RGB[d.domain_key || d.key] || C.muted;
      const dname = d.domain_name || DOMAINS.find((dd) => dd.key === d.key)?.label || d.domain_key || "";
      const dscore = Math.round(d.score || 0);

      // Label
      doc.setTextColor(...C.text);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(dname, M, y);
      // Trend arrow
      if (d.trend === "up") {
        doc.setTextColor(80, 160, 80);
        doc.text("▲", M + labelW - 12, y);
      } else if (d.trend === "down") {
        doc.setTextColor(200, 80, 80);
        doc.text("▼", M + labelW - 12, y);
      }

      // Bar
      drawBar(doc, M + labelW, y - 7, barW, dscore, dc, 8);
      // Score
      doc.setTextColor(...C.text);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`${dscore}`, M + labelW + barW + 8, y);
      y += barRowH;
    });

    y += 8;

    /* ── FOCUS AREA ── */
    if (weakest) {
      y = checkPage(doc, y, 100);
      const faH = 56;
      doc.setFillColor(...C.lighter);
      doc.setDrawColor(...C.borderLt);
      doc.setLineWidth(0.5);
      doc.roundedRect(M, y, CW, faH, 8, 8, "FD");
      doc.setFillColor(...C.green);
      doc.roundedRect(M, y, 4, faH, 2, 2, "F");

      doc.setTextColor(...C.muted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("PRIMARY FOCUS AREA", M + 16, y + 16);
      doc.setTextColor(...C.text);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(weakest.domain_name || "—", M + 16, y + 32);
      if (weakest.next_action || weakest.summary) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...C.muted);
        const fl = doc.splitTextToSize(weakest.next_action || weakest.summary, CW - 32);
        doc.text(fl, M + 16, y + 46);
      }
      // Score badge
      if (weakest.score != null) {
        doc.setFillColor(C.green[0], C.green[1], C.green[2], 0.1);
        doc.roundedRect(W - M - 56, y + 12, 44, 28, 4, 4, "F");
        doc.setTextColor(...C.green);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`${Math.round(weakest.score)}`, W - M - 34, y + 30, { align: "center" });
      }
      y += faH + 18;
    }

    /* ── EXPECTED BENEFITS ── */
    if (protocol?.expected_benefits?.length) {
      y = checkPage(doc, y, 80);
      y = sectionHeader(doc, M, y, CW, "Expected benefits", familyColor);

      protocol.expected_benefits.forEach((b, i) => {
        y = checkPage(doc, y, 24);
        doc.setFillColor(...familyColor);
        doc.setLineWidth(0.8);
        doc.setDrawColor(...familyColor);
        // Checkmark circle
        doc.circle(M + 5, y - 2, 4, "S");
        doc.line(M + 2.5, y - 2.5, M + 4, y - 4.5);
        doc.line(M + 4, y - 4.5, M + 8, y - 0.5);
        const lines = doc.splitTextToSize(b, CW - 24);
        doc.setTextColor(...C.text);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(lines, M + 16, y);
        y += lines.length * 13 + 5;
      });
      y += 6;
    }

    /* ── MEASURING ── */
    if (protocol?.measuring?.length) {
      y = checkPage(doc, y, 60);
      y = sectionHeader(doc, M, y, CW, "What we're measuring", familyColor);

      const tagH = 20;
      const gap = 8;
      let tx = M;
      protocol.measuring.forEach((m, i) => {
        const tw = doc.getTextWidth(m) + 20;
        doc.setFont("helvetica", "normal");
        if (tx + tw > W - M) { tx = M; y += tagH + gap; }
        doc.setFillColor(...C.lighter);
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.5);
        doc.roundedRect(tx, y - 12, tw, tagH, 4, 4, "FD");
        doc.setTextColor(...C.text);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(m, tx + 10, y + 1);
        tx += tw + gap;
      });
      y += tagH + 12;
    }

    /* ── SAFETY NOTES ── */
    if (protocol?.safety_notes) {
      y = checkPage(doc, y, 80);
      const sH = 56;
      doc.setFillColor(...C.amberBg);
      doc.setDrawColor(...C.amber);
      doc.setLineWidth(1);
      doc.roundedRect(M, y, CW, sH, 8, 8, "FD");
      doc.setFillColor(...C.amber);
      doc.roundedRect(M, y, 4, sH, 2, 2, "F");

      doc.setTextColor(...C.amber);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("SAFETY NOTES", M + 16, y + 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 90, 30);
      const safetyLines = doc.splitTextToSize(protocol.safety_notes, CW - 32);
      doc.text(safetyLines, M + 16, y + 34);
      y += sH + 14;
    }
  }

  /* ── FOOTER (on every page) ── */
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const fY = H - 30;
    doc.setDrawColor(...C.borderLt);
    doc.setLineWidth(0.5);
    doc.line(M, fY, W - M, fY);
    doc.setTextColor(...C.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(`AQLA · Neural wellness, not medical advice · Generated ${today}`, M, fY + 12);
    doc.text(`Page ${p} of ${pageCount}`, W - M, fY + 12, { align: "right" });
  }

  doc.save(`AQLA-Daily-Plan-${today}.pdf`);
}
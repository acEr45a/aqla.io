// Shared drawing engine for all AQLA branded PDFs (dark, fully-colored theme).
import { DOMAINS } from "@/lib/scoring";

export const PAL = {
  bg: [17, 12, 8],
  header: [12, 8, 5],
  panel: [30, 22, 16],
  panelBorder: [56, 45, 36],
  text: [241, 235, 225],
  muted: [158, 148, 138],
  faint: [104, 96, 88],
  green: [201, 242, 78],
  amber: [242, 192, 78],
  track: [48, 39, 31],
  red: [230, 120, 100],
};

export const FAMILY_RGB = {
  SPARK: [201, 242, 78],
  FLOW: [95, 212, 232],
  DRIVE: [123, 148, 255],
  LEARN: [232, 162, 143],
  RESET: [143, 232, 194],
  DIGITAL: [184, 156, 246],
};

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export const DOMAIN_RGB = {};
DOMAINS.forEach((d) => { DOMAIN_RGB[d.key] = hexToRgb(d.color); });

/* Blend two rgb colors: t=0 → a, t=1 → b */
export const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

export function paintBg(doc) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...PAL.bg);
  doc.rect(0, 0, W, H, "F");
}

export function newPage(doc) {
  doc.addPage();
  paintBg(doc);
  return 60;
}

export function checkPage(doc, y, threshold = 110) {
  const H = doc.internal.pageSize.getHeight();
  return y > H - threshold ? newPage(doc) : y;
}

/* AQLA neural mark — clean concentric circles, matching the app logo */
export function drawLogo(doc, cx, cy, color, r = 11) {
  doc.setDrawColor(...color);
  doc.setLineWidth(1.6);
  doc.circle(cx, cy, r, "S");
  doc.setLineWidth(0.9);
  doc.circle(cx, cy, r * 0.55, "S");
  doc.setFillColor(...color);
  doc.circle(cx, cy, r * 0.18, "F");
}

/* Circular progress ring */
export function drawRing(doc, cx, cy, r, pct, color, lineWidth = 6) {
  doc.setDrawColor(...PAL.track);
  doc.setLineWidth(lineWidth);
  doc.setLineCap("round");
  doc.circle(cx, cy, r, "S");
  if (pct > 0) {
    doc.setDrawColor(...color);
    const segments = Math.max(2, Math.ceil((pct / 100) * 120));
    const start = -Math.PI / 2;
    for (let i = 0; i < segments; i++) {
      const a1 = start + (i / segments) * (pct / 100) * Math.PI * 2;
      const a2 = start + ((i + 1) / segments) * (pct / 100) * Math.PI * 2;
      doc.line(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
    }
  }
  doc.setLineCap("butt");
}

/* Horizontal bar */
export function drawBar(doc, x, y, w, pct, color, h = 5) {
  doc.setFillColor(...PAL.track);
  doc.roundedRect(x, y, w, h, h / 2, h / 2, "F");
  if (pct > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, Math.max(h, (w * Math.min(pct, 100)) / 100), h, h / 2, h / 2, "F");
  }
}

/* Trend sparkline: values oldest → newest (0-100) */
export function drawSparkline(doc, x, y, w, h, values, color) {
  if (!values?.length) return;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(4, max - min);
  const pts = values.map((v, i) => [
    x + (values.length === 1 ? w / 2 : (i / (values.length - 1)) * w),
    y + h - ((v - min) / range) * h,
  ]);
  // baseline grid
  doc.setDrawColor(...PAL.track);
  doc.setLineWidth(0.5);
  doc.line(x, y + h, x + w, y + h);
  doc.line(x, y, x + w, y);
  // line
  doc.setDrawColor(...color);
  doc.setLineWidth(1.6);
  doc.setLineCap("round");
  for (let i = 1; i < pts.length; i++) doc.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  doc.setLineCap("butt");
  // dots
  doc.setFillColor(...color);
  pts.forEach((p) => doc.circle(p[0], p[1], 1.8, "F"));
}

/* Section title with accent tick */
export function sectionHeader(doc, x, y, title, accent) {
  doc.setDrawColor(...accent);
  doc.setLineWidth(2.5);
  doc.setLineCap("round");
  doc.line(x, y, x + 32, y);
  doc.setLineCap("butt");
  doc.setTextColor(...PAL.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, x, y + 17);
  return y + 32;
}

/* Rounded panel with optional left accent bar */
export function panel(doc, x, y, w, h, accent) {
  doc.setFillColor(...PAL.panel);
  doc.setDrawColor(...PAL.panelBorder);
  doc.setLineWidth(0.6);
  doc.roundedRect(x, y, w, h, 9, 9, "FD");
  if (accent) {
    doc.setFillColor(...accent);
    doc.roundedRect(x, y, 4, h, 2, 2, "F");
  }
}

/* Body paragraph; returns next y */
export function paragraph(doc, x, y, w, text, { size = 9.5, color = PAL.muted, lh = 13.5, style = "normal" } = {}) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, w);
  doc.text(lines, x, y);
  return y + lines.length * lh;
}

/* Branded header band; returns content start y */
export function drawHeader(doc, { subtitle, rightTop, rightBottom, familyColor, badge, badgeNote }) {
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  paintBg(doc);
  doc.setFillColor(...PAL.header);
  doc.rect(0, 0, W, 112, "F");

  drawLogo(doc, M + 12, 46, familyColor, 12);
  doc.setTextColor(...familyColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("AQLA", M + 34, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...PAL.muted);
  doc.text(subtitle.toUpperCase(), M + 34, 58);

  doc.setTextColor(...PAL.muted);
  doc.setFontSize(8);
  doc.text(rightTop, W - M, 36, { align: "right" });
  doc.setTextColor(...PAL.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(rightBottom, W - M, 52, { align: "right" });

  if (badge) {
    const bw = doc.getTextWidth(badge) + (badgeNote ? doc.getTextWidth(badgeNote) : 0) + 46;
    const bx = W - M - bw;
    doc.setFillColor(...mix(familyColor, PAL.header, 0.85));
    doc.setDrawColor(...familyColor);
    doc.setLineWidth(0.8);
    doc.roundedRect(bx, 64, bw, 22, 5, 5, "FD");
    doc.setFillColor(...familyColor);
    doc.circle(bx + 12, 75, 3, "F");
    doc.setTextColor(...familyColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(badge, bx + 20, 78);
    if (badgeNote) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...PAL.muted);
      doc.text(badgeNote, bx + bw - 8, 78, { align: "right" });
    }
  }

  doc.setDrawColor(...familyColor);
  doc.setLineWidth(2);
  doc.line(0, 112, W, 112);
  return 134;
}

/* Footer on every page */
export function drawFooters(doc, generatedKey) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const count = doc.internal.getNumberOfPages();
  for (let p = 1; p <= count; p++) {
    doc.setPage(p);
    const fY = H - 30;
    doc.setDrawColor(...PAL.panelBorder);
    doc.setLineWidth(0.5);
    doc.line(M, fY, W - M, fY);
    doc.setTextColor(...PAL.faint);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(`AQLA · Neural wellness, not medical advice · Generated ${generatedKey}`, M, fY + 12);
    doc.text(`Page ${p} of ${count}`, W - M, fY + 12, { align: "right" });
  }
}

export const readinessOf = (c) =>
  c && c.clarity != null ? Math.round(((c.clarity + c.energy + c.sleep_quality + (10 - c.stress)) / 40) * 100) : null;

export const avgOf = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);

export const prettyTest = (t) => (t || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
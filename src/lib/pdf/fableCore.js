// Fable PDF engine — strict 12-column grid, hard #0A0A0A pages, AQLA branding on every page.
// All drawing goes through this class: the cursor (this.y) is the single source of truth,
// page breaks repaint the background + header automatically. No incremental coordinate math.
import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";

const hexToRgb = (hex) => {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

export const DEFAULT_THEME = {
  bg: "#0A0A0A",
  panel: "#121212",
  border: "#262626",
  text: "#F4F1EC",
  muted: "#A3A3A3",
  faint: "#6B6B6B",
  primary: "#C9F24E",
  accent: "#8B5CF6",
  positive: "#4ADE80",
  negative: "#F87171",
  warning: "#FBBF24",
};

/* Latest saved theme (edited via the admin PDF Studio), merged over defaults. */
export async function loadPdfTheme() {
  try {
    const rows = await base44.entities.PdfTheme.list("-updated_date", 1);
    return { ...DEFAULT_THEME, ...(rows[0]?.config || {}) };
  } catch {
    return DEFAULT_THEME;
  }
}

export const readinessOf = (c) =>
  c && c.clarity != null ? Math.round(((c.clarity + c.energy + c.sleep_quality + (10 - c.stress)) / 40) * 100) : null;

export const avgOf = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);

export const prettyTest = (t) => (t || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const inPeriod = (dateStr, start, end) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
};

export class Fable {
  constructor({ docTitle, rightTop, rightBottom, theme }) {
    const merged = { ...DEFAULT_THEME, ...(theme || {}) };
    this.t = {};
    Object.keys(DEFAULT_THEME).forEach((k) => {
      this.t[k] = hexToRgb(merged[k]) || hexToRgb(DEFAULT_THEME[k]);
    });
    this.doc = new jsPDF({ unit: "pt", format: "a4" });
    this.W = this.doc.internal.pageSize.getWidth();
    this.H = this.doc.internal.pageSize.getHeight();
    this.M = 44;
    this.G = 12;
    this.colW = (this.W - this.M * 2 - this.G * 11) / 12;
    this.docTitle = docTitle;
    this.rightTop = rightTop;
    this.rightBottom = rightBottom;
    this.y = 0;
    this._paintPage();
  }

  /* Grid: x position of column i (0-11), width of a span of n columns */
  x(col) { return this.M + col * (this.colW + this.G); }
  w(span) { return span * this.colW + (span - 1) * this.G; }
  get CW() { return this.w(12); }

  _paintPage() {
    const { doc, W, M, t } = this;
    doc.setFillColor(...t.bg);
    doc.rect(0, 0, W, this.H, "F");
    // AQLA neural mark — open signal path converging on an active node (matches AqlaLogo)
    const s = 0.5;
    const ox = M + 11 - 22.4 * s;
    const oy = 38 - 22.5 * s;
    const sx = (x) => ox + x * s;
    const sy = (y) => oy + y * s;
    doc.setDrawColor(...t.text);
    doc.setLineWidth(1.05);
    doc.setLineCap("round");
    doc.line(sx(8), sy(31.5), sx(18.2), sy(10.5));
    doc.line(sx(18.2), sy(10.5), sx(28), sy(31.5));
    doc.line(sx(28), sy(31.5), sx(36), sy(22.3));
    doc.line(sx(12.4), sy(22.5), sx(20.6), sy(22.5));
    doc.setLineCap("butt");
    // node glow + core, in the brand primary (lime)
    doc.setGState(new doc.GState({ opacity: 0.15 }));
    doc.setFillColor(...t.primary);
    doc.circle(sx(22.4), sy(22.5), 6.9 * s, "F");
    doc.setGState(new doc.GState({ opacity: 1 }));
    doc.circle(sx(22.4), sy(22.5), 3.4 * s, "F");
    doc.setTextColor(...t.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("AQLA", M + 24, 43, { charSpace: 2.4 });
    // Centered document title
    doc.setFontSize(8);
    doc.setTextColor(...t.muted);
    doc.text(this.docTitle.toUpperCase().split("").join(" "), W / 2, 41, { align: "center" });
    // Right meta
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...t.muted);
    doc.text(this.rightTop || "", W - M, 33, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...t.text);
    doc.text(this.rightBottom || "", W - M, 47, { align: "right" });
    // Accent rule
    doc.setDrawColor(...t.accent);
    doc.setLineWidth(1.4);
    doc.line(M, 60, W - M, 60);
    this.y = 84;
  }

  breakPage() { this.doc.addPage(); this._paintPage(); }
  need(h) { if (this.y + h > this.H - 64) this.breakPage(); }
  ensurePages(n) { while (this.doc.internal.getNumberOfPages() < n) this.breakPage(); }

  gap(h = 14) { this.y += h; }

  section(title) {
    this.need(50);
    const { doc, t } = this;
    doc.setDrawColor(...t.accent);
    doc.setLineWidth(2.4);
    doc.line(this.M, this.y, this.M + 28, this.y);
    doc.setTextColor(...t.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.text(title.toUpperCase(), this.M, this.y + 16);
    this.y += 30;
  }

  label(text, col = 0) {
    const { doc, t } = this;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...t.faint);
    doc.text(text.toUpperCase(), this.x(col), this.y);
    this.y += 11;
  }

  para(text, { col = 0, span = 12, size = 9.5, color = "muted", lh = 13, style = "normal", advance = true } = {}) {
    const { doc, t } = this;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...(t[color] || t.muted));
    const lines = doc.splitTextToSize(text, this.w(span));
    if (advance) this.need(lines.length * lh + 6);
    doc.text(lines, this.x(col), this.y);
    if (advance) this.y += lines.length * lh;
    return lines.length * lh;
  }

  /* Sharp-cornered panel at the cursor; does NOT advance y (draw content inside, then advance). */
  panel(h, { col = 0, span = 12, accent = false } = {}) {
    const { doc, t } = this;
    doc.setFillColor(...t.panel);
    doc.setDrawColor(...t.border);
    doc.setLineWidth(0.7);
    doc.rect(this.x(col), this.y, this.w(span), h, "FD");
    if (accent) {
      doc.setFillColor(...t.accent);
      doc.rect(this.x(col), this.y, 3, h, "F");
    }
  }

  bar(x, y, w, pct, color, h = 5) {
    const { doc, t } = this;
    doc.setFillColor(...t.border);
    doc.rect(x, y, w, h, "F");
    if (pct > 0) {
      doc.setFillColor(...color);
      doc.rect(x, y, Math.max(2, (w * Math.min(pct, 100)) / 100), h, "F");
    }
  }

  ring(cx, cy, r, pct, color, lw = 6) {
    const { doc, t } = this;
    doc.setDrawColor(...t.border);
    doc.setLineWidth(lw);
    doc.circle(cx, cy, r, "S");
    if (pct > 0) {
      doc.setDrawColor(...color);
      doc.setLineCap("round");
      const seg = Math.max(2, Math.ceil((pct / 100) * 120));
      const start = -Math.PI / 2;
      for (let i = 0; i < seg; i++) {
        const a1 = start + (i / seg) * (pct / 100) * Math.PI * 2;
        const a2 = start + ((i + 1) / seg) * (pct / 100) * Math.PI * 2;
        doc.line(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
      }
      doc.setLineCap("butt");
    }
  }

  spark(x, y, w, h, values, color) {
    const { doc, t } = this;
    doc.setDrawColor(...t.border);
    doc.setLineWidth(0.5);
    doc.line(x, y, x + w, y);
    doc.line(x, y + h, x + w, y + h);
    if (!values || values.length < 2) return;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(4, max - min);
    const pts = values.map((v, i) => [x + (i / (values.length - 1)) * w, y + h - ((v - min) / range) * h]);
    doc.setDrawColor(...color);
    doc.setLineWidth(1.5);
    doc.setLineCap("round");
    for (let i = 1; i < pts.length; i++) doc.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    doc.setLineCap("butt");
    doc.setFillColor(...color);
    pts.forEach((p) => doc.circle(p[0], p[1], 1.6, "F"));
  }

  /* Metric row: LABEL, bar, value — spans given columns at the cursor, advances y */
  metricRow(labelText, value10, color) {
    const { doc, t } = this;
    this.need(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...t.faint);
    doc.text(labelText.toUpperCase(), this.x(0), this.y);
    this.bar(this.x(0), this.y + 4, this.CW - 52, value10 != null ? value10 * 10 : 0, color || t.accent, 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...t.text);
    doc.text(value10 != null ? `${value10}/10` : "—", this.W - this.M, this.y + 9, { align: "right" });
    this.y += 24;
  }

  applyFooters(generatedKey) {
    const { doc, W, H, M, t } = this;
    const count = doc.internal.getNumberOfPages();
    for (let p = 1; p <= count; p++) {
      doc.setPage(p);
      const fY = H - 34;
      doc.setDrawColor(...t.border);
      doc.setLineWidth(0.5);
      doc.line(M, fY, W - M, fY);
      doc.setTextColor(...t.faint);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(`AQLA · Neural wellness, not medical advice · Generated ${generatedKey}`, M, fY + 12);
      doc.setDrawColor(...t.accent);
      doc.setLineWidth(1.2);
      doc.line(W - M - 90, fY, W - M - 60, fY);
      doc.text(`Page ${p} of ${count}`, W - M, fY + 12, { align: "right" });
    }
  }

  footersAndSave(generatedKey, filename) {
    this.applyFooters(generatedKey);
    this.doc.save(filename);
  }

  footersAndDataUri(generatedKey) {
    this.applyFooters(generatedKey);
    return this.doc.output("datauristring");
  }

  footersAndBlob(generatedKey) {
    this.applyFooters(generatedKey);
    return this.doc.output("blob");
  }
}
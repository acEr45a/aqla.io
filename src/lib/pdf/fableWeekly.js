// Fable weekly summary PDF — 4 pages.
import { localDateKey } from "@/lib/dateKey";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import { Fable } from "@/lib/pdf/fableCore";
import { periodData, adherenceDash, trendBlock, checkInTable, trainingBlock, domainBlock, insightBullets } from "@/lib/pdf/fablePeriod";

export function generateFableWeeklyPdf({ periodStart, periodEnd, user, protocol, checkIns = [], sessions = [], domains = [], cognitiveTests = [], theme }) {
  const pd = periodData({ periodStart, periodEnd, checkIns, sessions, cognitiveTests });
  const firstName = user?.full_name?.split(" ")[0] || "there";
  const familyMeta = PROTOCOL_FAMILIES.find((x) => x.key === protocol?.family);

  const f = new Fable({
    docTitle: "Weekly Summary",
    rightTop: `${pd.fmt(pd.start)} — ${pd.fmt(pd.end)}`,
    rightBottom: `${firstName}'s report`,
    theme,
  });

  /* ════ PAGE 1 — overview ════ */
  f.para(`This report covers every signal AQLA collected from ${pd.fmt(pd.start)} to ${pd.fmt(pd.end)}: ${pd.periodCheckIns.length} daily check-ins, ${pd.periodSessions.length} training sessions and ${pd.periodTests.length} cognitive tests, analyzed against your Brain Map${protocol ? ` and your active ${familyMeta?.name || protocol.family} protocol` : ""}.`, { color: "text", size: 10, lh: 14 });
  f.gap(14);
  f.section("Week at a glance");
  adherenceDash(f, pd);
  trendBlock(f, pd);

  /* ════ PAGE 2 — check-in log ════ */
  f.breakPage();
  f.section("Check-in log");
  checkInTable(f, pd.periodCheckIns);

  /* ════ PAGE 3 — training & testing ════ */
  f.breakPage();
  f.section("Training & testing");
  trainingBlock(f, pd);

  /* ════ PAGE 4 — domains, insights & context ════ */
  f.breakPage();
  f.section("Brain domain profile");
  domainBlock(f, domains);
  f.section("Weekly insights");
  insightBullets(f, pd);
  if (protocol) {
    f.section("Protocol context");
    f.para(`${protocol.name} (${familyMeta?.name || protocol.family} family) — ${protocol.objective || ""} Started ${protocol.start_date || "—"} for ${protocol.duration_days || 14} days.`, { color: "text" });
    f.gap(6);
    if (protocol.why_selected) f.para(`Why it was selected: ${protocol.why_selected}`);
  }

  f.ensurePages(4);
  f.footersAndSave(localDateKey(), `AQLA-Weekly-Report-${localDateKey(pd.start)}.pdf`);
}
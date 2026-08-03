// Steps for the first-visit dashboard walkthrough.
export const TOUR_STEPS = [
  {
    selector: null,
    title: "Welcome to AQLA",
    body: "This is your neural wellness dashboard. Let me show you around — it takes about 30 seconds.",
  },
  {
    selector: '[data-tour="signals"]',
    title: "Your daily signals",
    body: "Readiness, sleep recovery, your primary bottleneck and check-in consistency — updated from your own data every day.",
  },
  {
    selector: '[data-tour="protocol"]',
    title: "Today's protocol",
    body: "Your active 14-day protocol shows the specific actions to take today, in order of priority.",
  },
  {
    selector: null,
    title: "Download today's plan",
    body: "Want your protocol on paper? Tap “Download today's plan (PDF)” to get a branded, step-by-step daily plan — it refreshes every morning with your latest data.",
  },
  {
    selector: '[data-tour="checkin"]',
    title: "Daily check-in",
    body: "Under 60 seconds each day. This is what keeps your Brain Map and protocol accurate.",
  },
  {
    selector: '[data-tour="calendar"]',
    title: "Never miss a check-in",
    body: "Add a recurring 8:00 reminder for your whole cycle. Use the Google button, or download the .ics invite — that works with Apple Calendar, Outlook and any other calendar app.",
  },
  {
    selector: '[data-tour="coach"]',
    title: "Meet AQLA Intelligence",
    body: "This is your personal brain analyst. It reads your check-ins, tests and Brain Map, then explains what changed and what to adjust first — with the evidence behind it, and honest uncertainty when data is thin. Ask it anything in plain language, by text or voice.",
  },
  {
    selector: 'a[href="/map"]',
    title: "Your Brain Map",
    body: "Explore your cognitive domains, ranks and trends here. Tests, training and progress live in the same menu.",
  },
  {
    selector: null,
    title: "You're set",
    body: "Start with your assessment or today's check-in, and AQLA will build from there.",
  },
];
export const DOMAINS = [
  { key: "focus", label: "Focus", color: "#7B94FF" },
  { key: "memory", label: "Memory", color: "#A9B9FF" },
  { key: "mental_energy", label: "Mental Energy", color: "#C9F24E" },
  { key: "stress_regulation", label: "Stress Regulation", color: "#F2C04E" },
  { key: "sleep_recovery", label: "Sleep Recovery", color: "#5FD4E8" },
  { key: "cognitive_resilience", label: "Cognitive Resilience", color: "#8FE8C2" },
  { key: "lifestyle_protection", label: "Lifestyle Protection", color: "#D9D4C5" },
  { key: "learning_capacity", label: "Learning Capacity", color: "#E8A28F" },
];

const s = (v, fallback = 5) => (typeof v === "number" ? v : fallback) * 10;
const inv = (v, fallback = 5) => 100 - s(v, fallback);
const avg = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
const clamp = (n) => Math.max(15, Math.min(96, n));

export function computeDomains(r = {}) {
  const lateCaffeine = r.caffeine_late === "often" ? 30 : r.caffeine_late === "sometimes" ? 55 : 80;
  const screens = r.screens_evening === "most_nights" ? 35 : r.screens_evening === "sometimes" ? 60 : 85;
  const latency = r.sleep_latency === "over_45" ? 30 : r.sleep_latency === "15_45" ? 60 : 85;
  const exercise = r.exercise === "regular" ? 85 : r.exercise === "occasional" ? 55 : 30;
  const interruptions = r.work_interruptions === "constant" ? 30 : r.work_interruptions === "frequent" ? 50 : 80;

  const sleep = avg([s(r.restored), s(r.sleep_consistency), latency, lateCaffeine, screens]);
  const stress = avg([inv(r.stress), inv(r.overwhelm), s(r.restored)]);
  const energy = avg([s(r.energy_morning), s(r.energy_afternoon), sleep, s(r.hydration), exercise]);
  const focus = avg([s(r.focus_duration), inv(r.distractibility), interruptions, sleep, stress]);
  const memory = avg([s(r.memory_self), sleep, stress]);
  const resilience = avg([stress, sleep, exercise]);
  const lifestyle = avg([s(r.hydration), exercise, screens, lateCaffeine]);
  const learning = avg([memory, focus, s(r.focus_duration)]);

  const scores = {
    focus, memory, mental_energy: energy, stress_regulation: stress,
    sleep_recovery: sleep, cognitive_resilience: resilience,
    lifestyle_protection: lifestyle, learning_capacity: learning,
  };
  return DOMAINS.map((d) => ({ ...d, score: clamp(scores[d.key]) }));
}

export function primaryBottleneck(domains) {
  return [...domains].sort((a, b) => a.score - b.score)[0];
}
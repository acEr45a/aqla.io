// AQLA cognitive ranks — the progression ladder shown on the Brain Map.
export const RANKS = [
  { key: "foundational", name: "Foundational", min: 0, max: 35, color: "#8A8578" },
  { key: "adaptive", name: "Adaptive", min: 35, max: 50, color: "#5FD4E8" },
  { key: "synchronized", name: "Synchronized", min: 50, max: 65, color: "#7B94FF" },
  { key: "resonant", name: "Resonant", min: 65, max: 80, color: "#8FE8C2" },
  { key: "polymath", name: "Polymath", min: 80, max: 92, color: "#C9F24E" },
  { key: "superhuman", name: "Superhuman", min: 92, max: 101, color: "#F2E08C" },
];

export function rankFor(score = 0) {
  return RANKS.find((r) => score >= r.min && score < r.max) || RANKS[RANKS.length - 1];
}

// 0–1 progress inside the current rank, plus the next rank (null at the top).
export function rankProgress(score = 0) {
  const rank = rankFor(score);
  const next = RANKS[RANKS.indexOf(rank) + 1] || null;
  const pct = Math.min(1, Math.max(0, (score - rank.min) / (rank.max - rank.min)));
  return { rank, next, pct };
}
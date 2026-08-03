export const TIER_META = {
  big_idea: { label: "Big idea", color: "#B89CF6", order: 0 },
  feature: { label: "Feature", color: "#7B94FF", order: 1 },
  improvement: { label: "Improvement", color: "#5FD4E8", order: 2 },
  small_fix: { label: "Small fix", color: "#C9F24E", order: 3 },
};

export const TIER_ORDER = ["big_idea", "feature", "improvement", "small_fix"];

export const byTier = (a, b) =>
  (TIER_META[a.tier]?.order ?? 9) - (TIER_META[b.tier]?.order ?? 9);
// Shared cognitive baseline definitions used by the QA pass-through (frontend)
// and the admin-driven auto-complete (backend function / Backend Ops agent).

export const TEST_TYPES = [
  "reaction_time",
  "sustained_attention",
  "memory_recall",
  "working_memory",
  "task_switching",
  "visual_spatial",
  "verbal_fluency",
];

// Passing records used to auto-complete the baseline without playing the tasks.
export const QA_DEFAULTS = {
  reaction_time: { score: 72, raw: { task: "Brief Psychomotor Vigilance Task (PVT-B) adaptation", trials: [252, 248, 255, 249, 251, 247, 253, 250], mean_rt_ms: 251, lapses: 0, lapse_threshold_ms: 500, fastest_10pct_ms: 247, qa: true } },
  sustained_attention: { score: 76, raw: { task: "Sustained Attention to Response Task (SART; Robertson et al., 1997)", hits: 32, misses: 0, false_alarms: 0, commission_errors: 0, omissions: 0, correct_rejections: 4, rounds: 36, target: 3, qa: true } },
  memory_recall: { score: 74, raw: { task: "Wechsler Digit Span (auto)", max_span_forward: 8, max_span_backward: 6, qa: true } },
  working_memory: { score: 70, raw: { task: "N-back (auto)", hits: 14, misses: 0, false_alarms: 0, qa: true } },
  task_switching: { score: 75, raw: { task: "Cognitive flexibility (auto)", correct: 18, errors: 0, qa: true } },
  visual_spatial: { score: 71, raw: { task: "Mental rotation (auto)", correct: 16, errors: 2, qa: true } },
  verbal_fluency: { score: 69, raw: { task: "Verbal fluency (auto)", unique_words: 22, qa: true } },
};

// Blend measured test scores into Brain Map domains: [domain_key, test_type, weight]
export const BLEND = [
  ["focus", "sustained_attention", 0.35],
  ["focus", "reaction_time", 0.15],
  ["focus", "working_memory", 0.2],
  ["memory", "memory_recall", 0.4],
  ["memory", "working_memory", 0.3],
  ["learning_capacity", "memory_recall", 0.25],
  ["learning_capacity", "task_switching", 0.2],
  ["learning_capacity", "visual_spatial", 0.15],
  ["learning_capacity", "verbal_fluency", 0.2],
  ["cognitive_resilience", "reaction_time", 0.2],
  ["cognitive_resilience", "task_switching", 0.2],
];
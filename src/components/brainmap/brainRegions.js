// Glass brain cross-section: each domain maps to a glowing volume inside the
// brain render. x/y are percentages of the square image box, size is the fill
// diameter as % of width. Sizes are kept tight so the glow stays within the
// brain silhouette. lx/ly are label positions, offset so callouts never overlap.
export const BRAIN_IMAGE =
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/a7e59034b_generated_image.png";

export const REGIONS = [
  { key: "focus", region: "Prefrontal cortex", role: "Executive control & attention", x: 24, y: 45, size: 24, lx: 18, ly: 39 },
  { key: "mental_energy", region: "Frontal lobe", role: "Drive, initiation & effort", x: 35, y: 31, size: 24, lx: 32, ly: 23 },
  { key: "cognitive_resilience", region: "Parietal lobe", role: "Integration under load", x: 58, y: 27, size: 26, lx: 62, ly: 18 },
  { key: "learning_capacity", region: "Occipital lobe", role: "Processing & encoding new input", x: 75, y: 42, size: 23, lx: 82, ly: 36 },
  { key: "stress_regulation", region: "Insula & limbic system", role: "Emotion & threat regulation", x: 48, y: 48, size: 20, lx: 52, ly: 48 },
  { key: "memory", region: "Temporal lobe · hippocampus", role: "Memory formation & recall", x: 38, y: 60, size: 24, lx: 31, ly: 63 },
  { key: "sleep_recovery", region: "Brainstem · pons & medulla", role: "Sleep–wake cycles & recovery", x: 57, y: 73, size: 19, lx: 54, ly: 84 },
  { key: "lifestyle_protection", region: "Cerebellum", role: "Habit, rhythm & coordination", x: 71, y: 63, size: 22, lx: 78, ly: 66 },
];
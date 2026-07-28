// Glass brain cross-section: each domain maps to a glowing volume inside the
// brain render. x/y are percentages of the square image box, size is the fill
// diameter as % of width (sized to cover the whole anatomical region).
// lx/ly are the label positions, offset so callouts never overlap.
export const BRAIN_IMAGE =
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/a7e59034b_generated_image.png";

export const REGIONS = [
  { key: "focus", region: "Prefrontal cortex", role: "Executive control & attention", x: 16, y: 44, size: 26, lx: 13, ly: 40 },
  { key: "mental_energy", region: "Frontal lobe", role: "Drive, initiation & effort", x: 33, y: 27, size: 28, lx: 30, ly: 22 },
  { key: "cognitive_resilience", region: "Parietal lobe", role: "Integration under load", x: 60, y: 23, size: 27, lx: 62, ly: 17 },
  { key: "learning_capacity", region: "Occipital lobe", role: "Processing & encoding new input", x: 80, y: 39, size: 25, lx: 86, ly: 36 },
  { key: "stress_regulation", region: "Insula & limbic system", role: "Emotion & threat regulation", x: 43, y: 47, size: 24, lx: 44, ly: 45 },
  { key: "memory", region: "Temporal lobe · hippocampus", role: "Memory formation & recall", x: 38, y: 62, size: 25, lx: 30, ly: 64 },
  { key: "sleep_recovery", region: "Brainstem · pons & medulla", role: "Sleep–wake cycles & recovery", x: 61, y: 78, size: 20, lx: 55, ly: 85 },
  { key: "lifestyle_protection", region: "Cerebellum", role: "Habit, rhythm & coordination", x: 72, y: 67, size: 23, lx: 80, ly: 66 },
];
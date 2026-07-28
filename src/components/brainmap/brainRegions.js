// Glass brain cross-section: each domain maps to a glowing volume inside the
// brain render. x/y are percentages of the square image box, size is the fill
// diameter as % of width (sized to cover the whole anatomical region).
// lx/ly are the label positions, offset so callouts never overlap.
export const BRAIN_IMAGE =
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/a7e59034b_generated_image.png";

export const REGIONS = [
  { key: "focus", region: "Prefrontal cortex", role: "Executive control & attention", x: 17, y: 44, size: 33, lx: 12, ly: 39 },
  { key: "mental_energy", region: "Frontal lobe", role: "Drive, initiation & effort", x: 34, y: 27, size: 35, lx: 30, ly: 21 },
  { key: "cognitive_resilience", region: "Parietal lobe", role: "Integration under load", x: 60, y: 23, size: 34, lx: 63, ly: 16 },
  { key: "learning_capacity", region: "Occipital lobe", role: "Processing & encoding new input", x: 80, y: 39, size: 31, lx: 87, ly: 35 },
  { key: "stress_regulation", region: "Insula & limbic system", role: "Emotion & threat regulation", x: 44, y: 47, size: 26, lx: 45, ly: 45, z: 2 },
  { key: "memory", region: "Temporal lobe · hippocampus", role: "Memory formation & recall", x: 38, y: 62, size: 31, lx: 29, ly: 65 },
  { key: "sleep_recovery", region: "Brainstem · pons & medulla", role: "Sleep–wake cycles & recovery", x: 61, y: 78, size: 24, lx: 55, ly: 86 },
  { key: "lifestyle_protection", region: "Cerebellum", role: "Habit, rhythm & coordination", x: 72, y: 67, size: 28, lx: 81, ly: 66 },
];
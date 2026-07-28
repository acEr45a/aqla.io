// Glass brain cross-section: each domain maps to a glowing volume inside the
// brain render. x/y are percentages of the square image box, size is the fill
// diameter as % of width (sized to cover the region without bleeding into its
// neighbours, so each rank colour stays readable).
// lx/ly are the label positions, offset so callouts never overlap.
export const BRAIN_IMAGE =
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/a7e59034b_generated_image.png";

export const REGIONS = [
  { key: "focus", region: "Prefrontal cortex", role: "Executive control & attention", x: 17, y: 44, size: 26, lx: 12, ly: 39 },
  { key: "mental_energy", region: "Frontal lobe", role: "Drive, initiation & effort", x: 33, y: 27, size: 27, lx: 30, ly: 21 },
  { key: "cognitive_resilience", region: "Parietal lobe", role: "Integration under load", x: 61, y: 22, size: 27, lx: 63, ly: 16 },
  { key: "learning_capacity", region: "Occipital lobe", role: "Processing & encoding new input", x: 81, y: 39, size: 24, lx: 87, ly: 35 },
  { key: "stress_regulation", region: "Insula & limbic system", role: "Emotion & threat regulation", x: 45, y: 47, size: 21, lx: 45, ly: 45, z: 2 },
  { key: "memory", region: "Temporal lobe · hippocampus", role: "Memory formation & recall", x: 37, y: 63, size: 25, lx: 29, ly: 65 },
  { key: "sleep_recovery", region: "Brainstem · pons & medulla", role: "Sleep–wake cycles & recovery", x: 61, y: 79, size: 19, lx: 55, ly: 86 },
  { key: "lifestyle_protection", region: "Cerebellum", role: "Habit, rhythm & coordination", x: 73, y: 67, size: 23, lx: 81, ly: 66 },
];
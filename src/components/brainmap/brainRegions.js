// Glass brain cross-section: each domain maps to a glowing volume inside the
// brain render. x/y are percentages of the square image box, size is the blob
// diameter as % of width.
export const BRAIN_IMAGE =
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/a7e59034b_generated_image.png";

export const REGIONS = [
  { key: "focus", region: "Prefrontal cortex", role: "Executive control & attention", x: 16, y: 44, size: 16 },
  { key: "mental_energy", region: "Frontal lobe", role: "Drive, initiation & effort", x: 33, y: 26, size: 17 },
  { key: "cognitive_resilience", region: "Parietal lobe", role: "Integration under load", x: 60, y: 23, size: 16 },
  { key: "learning_capacity", region: "Occipital lobe", role: "Processing & encoding new input", x: 80, y: 39, size: 15 },
  { key: "stress_regulation", region: "Insula & limbic system", role: "Emotion & threat regulation", x: 43, y: 47, size: 15 },
  { key: "memory", region: "Temporal lobe · hippocampus", role: "Memory formation & recall", x: 40, y: 60, size: 16 },
  { key: "sleep_recovery", region: "Brainstem · pons & medulla", role: "Sleep–wake cycles & recovery", x: 61, y: 77, size: 12 },
  { key: "lifestyle_protection", region: "Cerebellum", role: "Habit, rhythm & coordination", x: 71, y: 67, size: 14 },
];
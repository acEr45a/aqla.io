// Glass brain cross-section: each domain maps to a glowing volume inside the
// brain render. x/y are percentages of the square image box, size is the fill
// diameter as % of width. Sizes overlap generously so the fills together cover
// the whole brain — the colour shifts mark where one region ends and the next
// begins. lx/ly are label positions, offset so callouts never overlap.
export const BRAIN_IMAGE =
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/a7e59034b_generated_image.png";

export const REGIONS = [
  { key: "focus", region: "Prefrontal cortex", role: "Executive control & attention", x: 16, y: 44, size: 44, lx: 12, ly: 39 },
  { key: "mental_energy", region: "Frontal lobe", role: "Drive, initiation & effort", x: 32, y: 27, size: 44, lx: 30, ly: 21 },
  { key: "cognitive_resilience", region: "Parietal lobe", role: "Integration under load", x: 60, y: 22, size: 46, lx: 63, ly: 16 },
  { key: "learning_capacity", region: "Occipital lobe", role: "Processing & encoding new input", x: 81, y: 40, size: 42, lx: 87, ly: 35 },
  { key: "stress_regulation", region: "Insula & limbic system", role: "Emotion & threat regulation", x: 48, y: 48, size: 34, lx: 52, ly: 48 },
  { key: "memory", region: "Temporal lobe · hippocampus", role: "Memory formation & recall", x: 36, y: 61, size: 44, lx: 29, ly: 65 },
  { key: "sleep_recovery", region: "Brainstem · pons & medulla", role: "Sleep–wake cycles & recovery", x: 59, y: 76, size: 34, lx: 55, ly: 86 },
  { key: "lifestyle_protection", region: "Cerebellum", role: "Habit, rhythm & coordination", x: 75, y: 64, size: 40, lx: 81, ly: 66 },
];
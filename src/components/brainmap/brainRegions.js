// Glass brain cross-section: each domain maps to a glowing volume inside the
// brain render. x/y are percentages of the square image box, size is the fill
// diameter as % of width. Sizes overlap generously so the fills together cover
// the whole brain — the colour shifts mark where one region ends and the next
// begins. lx/ly are label positions, offset so callouts never overlap.
export const BRAIN_IMAGE =
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/a7e59034b_generated_image.png";

export const REGIONS = [
  { key: "focus", region: "Prefrontal cortex", role: "Executive control & attention", x: 16, y: 44, size: 44, lx: 13, ly: 46 },
  { key: "mental_energy", region: "Frontal lobe", role: "Drive, initiation & effort", x: 32, y: 27, size: 44, lx: 32, ly: 30 },
  { key: "cognitive_resilience", region: "Parietal lobe", role: "Integration under load", x: 60, y: 22, size: 46, lx: 61, ly: 27 },
  { key: "learning_capacity", region: "Occipital lobe", role: "Processing & encoding new input", x: 81, y: 40, size: 42, lx: 84, ly: 42 },
  { key: "stress_regulation", region: "Insula & limbic system", role: "Emotion & threat regulation", x: 48, y: 48, size: 34, lx: 47, ly: 52 },
  { key: "memory", region: "Temporal lobe · hippocampus", role: "Memory formation & recall", x: 36, y: 61, size: 44, lx: 32, ly: 63 },
  { key: "sleep_recovery", region: "Brainstem · pons & medulla", role: "Sleep–wake cycles & recovery", x: 59, y: 76, size: 34, lx: 56, ly: 80 },
  { key: "lifestyle_protection", region: "Cerebellum", role: "Habit, rhythm & coordination", x: 75, y: 64, size: 40, lx: 77, ly: 66 },
];
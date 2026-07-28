// Glass brain cross-section: each domain maps to a glowing volume inside the
// brain render. x/y are the anatomical centers used by both the volumetric fill
// and its label; size is the fill diameter as a percentage of the image width.
// Sizes overlap generously so the fills together cover the whole brain.
export const BRAIN_IMAGE =
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/a7e59034b_generated_image.png";

export const REGIONS = [
  { key: "focus", region: "Prefrontal cortex", role: "Executive control & attention", x: 17, y: 45, size: 44 },
  { key: "mental_energy", region: "Frontal lobe", role: "Drive, initiation & effort", x: 34, y: 32, size: 44 },
  { key: "cognitive_resilience", region: "Parietal lobe", role: "Integration under load", x: 52, y: 27, size: 46 },
  { key: "learning_capacity", region: "Occipital lobe", role: "Processing & encoding new input", x: 76, y: 43, size: 42 },
  { key: "stress_regulation", region: "Insula & limbic system", role: "Emotion & threat regulation", x: 48, y: 49, size: 34 },
  { key: "memory", region: "Temporal lobe · hippocampus", role: "Memory formation & recall", x: 38, y: 61, size: 44 },
  { key: "sleep_recovery", region: "Brainstem · pons & medulla", role: "Sleep–wake cycles & recovery", x: 58, y: 78, size: 34 },
  { key: "lifestyle_protection", region: "Cerebellum", role: "Habit, rhythm & coordination", x: 75, y: 64, size: 40 },
];
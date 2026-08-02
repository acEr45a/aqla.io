export const PROTOCOL_FAMILIES = [
  {
    key: "SPARK",
    name: "SPARK",
    purpose: "Attention, alertness, and focused work.",
    tone: "Sharp, precise, active.",
    direction: "Controlled caffeine and L-theanine formulation.",
    color: "#C9F24E",
    evidence: "B — Moderate",
  },
  {
    key: "FLOW",
    name: "FLOW",
    purpose: "Calm focus for mental overload or overstimulation.",
    tone: "Quiet, controlled, stable.",
    direction: "Caffeine-free calming focus formulation.",
    color: "#5FD4E8",
    evidence: "B — Moderate",
  },
  {
    key: "DRIVE",
    name: "DRIVE",
    purpose: "Cognitive endurance and resistance to prolonged mental fatigue.",
    tone: "Sustained, strong, resilient.",
    direction: "Creatine-centered formula with hydration support.",
    color: "#7B94FF",
    evidence: "A — Strong",
  },
  {
    key: "LEARN",
    name: "LEARN",
    purpose: "Memory, retention, and structured learning.",
    tone: "Layered, reflective, adaptive.",
    direction: "Evidence-reviewed memory-support formula.",
    color: "#E8A28F",
    evidence: "C — Emerging",
  },
  {
    key: "RESET",
    name: "RESET",
    purpose: "Sleep recovery, circadian consistency, and mental restoration.",
    tone: "Restorative, slow, minimal.",
    direction: "Behavior-first recovery protocol.",
    color: "#8FE8C2",
    evidence: "A — Strong",
  },
  {
    key: "DIGITAL",
    name: "DIGITAL",
    purpose: "Digital environment design, screen hygiene, and attention-protective habits.",
    tone: "Architectural, environmental, structural.",
    direction: "Behavior-only protocol — no formula, structured digital habits.",
    color: "#B89CF6",
    evidence: "B — Moderate",
  },
];

export function protocolFit(bottleneckKey) {
  const fits = {
    RESET: { status: "Recommended", reason: "Your current data indicates that sleep recovery is the dominant constraint. A behavior-first reset addresses the primary cause before any formula is evaluated." },
    FLOW: { status: "Potentially suitable", reason: "May help if stress and overstimulation remain elevated after your recovery baseline stabilizes." },
    DRIVE: { status: "Potentially suitable", reason: "Cognitive endurance support could be relevant once sleep timing is consistent." },
    LEARN: { status: "Not currently recommended", reason: "Your current data is insufficient to evaluate memory-support needs." },
    SPARK: { status: "Not currently recommended", reason: "Your current caffeine exposure and sleep pattern increase the likelihood of worsening evening recovery." },
    DIGITAL: { status: "Not currently recommended", reason: "Digital environment restructuring may help if attention failures stem from workplace interruptions and screen fragmentation." },
  };
  if (bottleneckKey === "stress_regulation") {
    fits.FLOW = { status: "Recommended", reason: "Your concentration difficulty appears more closely related to stress and overstimulation than low alertness." };
    fits.RESET = { status: "Potentially suitable", reason: "Recovery consistency would strengthen stress regulation over time." };
  }
  return fits;
}
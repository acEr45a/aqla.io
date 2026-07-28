import ReactionTest from "@/components/tests/ReactionTest";
import AttentionTest from "@/components/tests/AttentionTest";
import MemoryTest from "@/components/tests/MemoryTest";
import NBackTest from "@/components/tests/NBackTest";
import TaskSwitchTest from "@/components/tests/TaskSwitchTest";
import SpatialTest from "@/components/tests/SpatialTest";
import { Zap, Eye, Layers, Brain, Shuffle, Box } from "lucide-react";

// Every game trains one mental function and is recorded as a cognitive test,
// so repeated play feeds Progress and the Brain Map.
export const GAMES = [
  {
    id: "signal_strike", name: "Signal Strike", testType: "reaction_time", Component: ReactionTest,
    icon: Zap, minutes: "1 min", trains: "Processing speed",
    desc: "React the instant the signal fires. Trains raw neural conduction speed.",
    domains: ["focus", "cognitive_resilience"], categories: ["speed", "focus"],
  },
  {
    id: "vigil", name: "Vigil", testType: "sustained_attention", Component: AttentionTest,
    icon: Eye, minutes: "1 min", trains: "Sustained attention",
    desc: "Respond to every letter except X. Trains attention stability over time.",
    domains: ["focus"], categories: ["focus", "control"],
  },
  {
    id: "digit_span", name: "Digit Span", testType: "memory_recall", Component: MemoryTest,
    icon: Layers, minutes: "2 min", trains: "Short-term recall",
    desc: "Recall sequences that grow longer each round. Expands memory span.",
    domains: ["memory", "learning_capacity"], categories: ["memory"],
  },
  {
    id: "echo_chamber", name: "Echo Chamber", testType: "working_memory", Component: NBackTest,
    icon: Brain, minutes: "1 min", trains: "Working memory",
    desc: "Tap when a letter repeats the one right before it. The core executive workout.",
    domains: ["memory", "focus"], categories: ["memory", "focus", "control"],
  },
  {
    id: "shift", name: "Shift", testType: "task_switching", Component: TaskSwitchTest,
    icon: Shuffle, minutes: "1 min", trains: "Cognitive flexibility",
    desc: "The rule keeps changing mid-stream. Trains switching without losing accuracy.",
    domains: ["cognitive_resilience", "learning_capacity"], categories: ["control", "speed"],
  },
  {
    id: "rotate", name: "Rotate", testType: "visual_spatial", Component: SpatialTest,
    icon: Box, minutes: "1 min", trains: "Visual–spatial reasoning",
    desc: "Same shape turned around, or mirrored? Trains mental rotation and imagery.",
    domains: ["learning_capacity"], categories: ["spatial"],
  },
];

export const CATEGORIES = [
  { key: "focus", name: "Focus & Attention", blurb: "Hold a target without drifting." },
  { key: "memory", name: "Memory & Recall", blurb: "Hold, manipulate and retrieve information." },
  { key: "speed", name: "Processing Speed", blurb: "Shorten the gap between input and action." },
  { key: "control", name: "Executive Control", blurb: "Switch rules, resist impulses, stay accurate." },
  { key: "spatial", name: "Spatial Reasoning", blurb: "Rotate and manipulate images in your mind." },
];

export const gamesIn = (categoryKey) => GAMES.filter((g) => g.categories.includes(categoryKey));
export const gameById = (id) => GAMES.find((g) => g.id === id);
import ReactionTest from "@/components/tests/ReactionTest";
import AttentionTest from "@/components/tests/AttentionTest";
import MemoryTest from "@/components/tests/MemoryTest";
import NBackTest from "@/components/tests/NBackTest";
import TaskSwitchTest from "@/components/tests/TaskSwitchTest";
import SpatialTest from "@/components/tests/SpatialTest";
import { Zap, Eye, Layers, Brain, Shuffle, Box, CircleDot, Grid3X3, GitFork } from "lucide-react";
import StreamTapGame from "@/components/games/StreamTapGame";
import PatternForgeGame from "@/components/games/PatternForgeGame";
import RuleRushGame from "@/components/games/RuleRushGame";

// Every game trains one mental function and is recorded as a cognitive test,
// so repeated play feeds Progress and the Brain Map.
export const GAMES = [
  {
    id: "signal_strike", name: "Signal Strike", testType: "reaction_time", Component: ReactionTest,
    icon: Zap, minutes: "1 min", trains: "Processing speed",
    desc: "React the instant the signal fires. Trains raw neural conduction speed.",
    thumbnail: "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/16025bf76_generated_image.png",
    domains: ["focus", "cognitive_resilience"], categories: ["speed", "focus"],
  },
  {
    id: "vigil", name: "Vigil", testType: "sustained_attention", Component: AttentionTest,
    icon: Eye, minutes: "1 min", trains: "Sustained attention",
    desc: "Respond to every letter except X. Trains attention stability over time.",
    thumbnail: "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/f0e22643a_generated_image.png",
    domains: ["focus"], categories: ["focus", "control"],
  },
  {
    id: "digit_span", name: "Digit Span", testType: "memory_recall", Component: MemoryTest,
    icon: Layers, minutes: "2 min", trains: "Short-term recall",
    desc: "Recall sequences that grow longer each round. Expands memory span.",
    thumbnail: "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/56967dbb4_generated_image.png",
    domains: ["memory", "learning_capacity"], categories: ["memory"],
  },
  {
    id: "echo_chamber", name: "Echo Chamber", testType: "working_memory", Component: NBackTest,
    icon: Brain, minutes: "1 min", trains: "Working memory",
    desc: "Tap when a letter repeats the one right before it. The core executive workout.",
    thumbnail: "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/a9d479c57_generated_image.png",
    domains: ["memory", "focus"], categories: ["memory", "focus", "control"],
  },
  {
    id: "shift", name: "Shift", testType: "task_switching", Component: TaskSwitchTest,
    icon: Shuffle, minutes: "1 min", trains: "Cognitive flexibility",
    desc: "The rule keeps changing mid-stream. Trains switching without losing accuracy.",
    thumbnail: "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/914daac5d_generated_image.png",
    domains: ["cognitive_resilience", "learning_capacity"], categories: ["control", "speed"],
  },
  {
    id: "rotate", name: "Rotate", testType: "visual_spatial", Component: SpatialTest,
    icon: Box, minutes: "1 min", trains: "Visual–spatial reasoning",
    desc: "Same shape turned around, or mirrored? Trains mental rotation and imagery.",
    thumbnail: "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/ed0dec324_generated_image.png",
    domains: ["learning_capacity"], categories: ["spatial"],
  },
  {
    id: "stream_tap", name: "Stream Tap", testType: "reaction_time", Component: StreamTapGame,
    icon: CircleDot, minutes: "1 min", trains: "Target tracking",
    desc: "Track a fast-changing target across a live number field.",
    thumbnail: "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/ff7e8bf5b_generated_image.png",
    domains: ["focus", "cognitive_resilience"], categories: ["speed", "focus"],
  },
  {
    id: "pattern_forge", name: "Pattern Forge", testType: "working_memory", Component: PatternForgeGame,
    icon: Grid3X3, minutes: "2 min", trains: "Sequence memory",
    desc: "Build back colour sequences under pressure, one pattern at a time.",
    thumbnail: "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/14f3fe6e8_generated_image.png",
    domains: ["memory", "learning_capacity"], categories: ["memory", "spatial"],
  },
  {
    id: "rule_rush", name: "Rule Rush", testType: "task_switching", Component: RuleRushGame,
    icon: GitFork, minutes: "1 min", trains: "Rule control",
    desc: "Apply a changing rule quickly while keeping every decision accurate.",
    thumbnail: "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/ab12a88fc_generated_image.png",
    domains: ["focus", "cognitive_resilience"], categories: ["control", "speed"],
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
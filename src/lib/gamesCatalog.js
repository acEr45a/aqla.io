import ReactionTest from "@/components/tests/ReactionTest";
import AttentionTest from "@/components/tests/AttentionTest";
import MemoryTest from "@/components/tests/MemoryTest";
import EchoChamberGame from "@/components/games/EchoChamberGame";
import TaskSwitchTest from "@/components/tests/TaskSwitchTest";
import SpatialTest from "@/components/tests/SpatialTest";
import { Zap, Eye, Layers, AudioLines, Shuffle, Box, CircleDot, Grid3X3, GitFork, Waves, Hand, Type, Map, Binary, Timer } from "lucide-react";
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
    art: "from-chart-1/30 via-secondary to-background", iconTone: "text-chart-1",
    domains: ["focus", "cognitive_resilience"], categories: ["speed", "focus"],
  },
  {
    id: "vigil", name: "Vigil", testType: "sustained_attention", Component: AttentionTest,
    icon: Eye, minutes: "1 min", trains: "Sustained attention",
    desc: "Respond to every letter except X. Trains attention stability over time.",
    art: "from-chart-2/30 via-secondary to-background", iconTone: "text-chart-2",
    domains: ["focus"], categories: ["focus", "control"],
  },
  {
    id: "digit_span", name: "Digit Span", testType: "memory_recall", Component: MemoryTest,
    icon: Layers, minutes: "2 min", trains: "Short-term recall",
    desc: "Recall sequences that grow longer each round. Expands memory span.",
    art: "from-chart-4/25 via-secondary to-background", iconTone: "text-chart-4",
    domains: ["memory", "learning_capacity"], categories: ["memory"],
  },
  {
    id: "echo_chamber", name: "Echo Chamber", testType: "sustained_attention", Component: EchoChamberGame,
    icon: AudioLines, minutes: "2 min", trains: "Auditory focus",
    desc: "Type the message as layered echoes grow deeper, longer, and harder to separate.",
    art: "from-chart-3/30 via-secondary to-background", iconTone: "text-chart-3",
    domains: ["focus", "cognitive_resilience"], categories: ["focus", "control"],
  },
  {
    id: "shift", name: "Shift", testType: "task_switching", Component: TaskSwitchTest,
    icon: Shuffle, minutes: "1 min", trains: "Cognitive flexibility",
    desc: "The rule keeps changing mid-stream. Trains switching without losing accuracy.",
    art: "from-chart-5/25 via-secondary to-background", iconTone: "text-chart-5",
    domains: ["cognitive_resilience", "learning_capacity"], categories: ["control", "speed"],
  },
  {
    id: "rotate", name: "Rotate", testType: "visual_spatial", Component: SpatialTest,
    icon: Box, minutes: "1 min", trains: "Visual–spatial reasoning",
    desc: "Same shape turned around, or mirrored? Trains mental rotation and imagery.",
    art: "from-primary/20 via-chart-2/10 to-background", iconTone: "text-primary",
    domains: ["learning_capacity"], categories: ["spatial"],
  },
  {
    id: "stream_tap", name: "Stream Tap", testType: "reaction_time", Component: StreamTapGame,
    icon: CircleDot, minutes: "1 min", trains: "Target tracking",
    desc: "Track a fast-changing target across a live number field.",
    art: "from-chart-5/30 via-chart-3/10 to-background", iconTone: "text-chart-5",
    domains: ["focus", "cognitive_resilience"], categories: ["speed", "focus"],
  },
  {
    id: "pattern_forge", name: "Pattern Forge", testType: "working_memory", Component: PatternForgeGame,
    icon: Grid3X3, minutes: "2 min", trains: "Sequence memory",
    desc: "Build back colour sequences under pressure, one pattern at a time.",
    art: "from-chart-2/25 via-chart-4/10 to-background", iconTone: "text-chart-4",
    domains: ["memory", "learning_capacity"], categories: ["memory", "spatial"],
  },
  {
    id: "rule_rush", name: "Rule Rush", testType: "task_switching", Component: RuleRushGame,
    icon: GitFork, minutes: "1 min", trains: "Rule control",
    desc: "Apply a changing rule quickly while keeping every decision accurate.",
    art: "from-chart-4/25 via-chart-5/10 to-background", iconTone: "text-chart-4",
    domains: ["focus", "cognitive_resilience"], categories: ["control", "speed"],
  },
];

// Training modules in development — displayed as locked previews only.
export const UPCOMING_GAMES = [
  {
    id: "dual_stream", name: "Dual Stream", icon: Waves, trains: "Divided attention",
    desc: "Hold two competing input streams at once without losing either thread.",
    art: "from-chart-3/25 via-chart-2/10 to-background", iconTone: "text-chart-3",
  },
  {
    id: "inhibit", name: "Inhibit", icon: Hand, trains: "Impulse control",
    desc: "Stop a prepared response the instant the signal reverses.",
    art: "from-chart-5/25 via-secondary to-background", iconTone: "text-chart-5",
  },
  {
    id: "word_forge", name: "Word Forge", icon: Type, trains: "Verbal fluency",
    desc: "Generate valid words under tightening category and time constraints.",
    art: "from-chart-4/25 via-secondary to-background", iconTone: "text-chart-4",
  },
  {
    id: "maze_mind", name: "Maze Mind", icon: Map, trains: "Spatial navigation",
    desc: "Build and hold a mental map, then navigate it from memory.",
    art: "from-primary/20 via-chart-3/10 to-background", iconTone: "text-primary",
  },
  {
    id: "logic_gate", name: "Logic Gate", icon: Binary, trains: "Abstract reasoning",
    desc: "Infer the hidden rule behind each sequence before time runs out.",
    art: "from-chart-2/25 via-chart-5/10 to-background", iconTone: "text-chart-2",
  },
  {
    id: "tempo_lock", name: "Tempo Lock", icon: Timer, trains: "Timing precision",
    desc: "Lock onto an interval and reproduce it without the cue.",
    art: "from-chart-1/25 via-secondary to-background", iconTone: "text-chart-1",
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
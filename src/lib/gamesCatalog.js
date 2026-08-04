import ReactionTest from "@/components/tests/ReactionTest";
import AttentionTest from "@/components/tests/AttentionTest";
import MemoryTest from "@/components/tests/MemoryTest";
import EchoChamberGame from "@/components/games/EchoChamberGame";
import TaskSwitchTest from "@/components/tests/TaskSwitchTest";
import SpatialTest from "@/components/tests/SpatialTest";
import { Zap, Eye, Layers, AudioLines, Shuffle, Box, CircleDot, Grid3X3, GitFork, Waves, Hand, Type, Map, Binary, Timer, Orbit, Brain, Gauge, Crosshair, Sparkles, Activity, Compass, Fingerprint, Radio, Target, Workflow } from "lucide-react";
import StreamTapGame from "@/components/games/StreamTapGame";
import PatternForgeGame from "@/components/games/PatternForgeGame";
import RuleRushGame from "@/components/games/RuleRushGame";
import DualStreamGame from "@/components/games/DualStreamGame";
import InhibitGame from "@/components/games/InhibitGame";
import WordForgeGame from "@/components/games/WordForgeGame";
import MazeMindGame from "@/components/games/MazeMindGame";
import LogicGateGame from "@/components/games/LogicGateGame";
import TempoLockGame from "@/components/games/TempoLockGame";
import NexusGame from "@/components/games/NexusGame";
import MnemoraGame from "@/components/games/MnemoraGame";
import VelocityGame from "@/components/games/VelocityGame";
import ConflictGame from "@/components/games/ConflictGame";
import ConstellationGame from "@/components/games/ConstellationGame";

// Every game trains one mental function and is recorded as a cognitive test,
// so repeated play feeds Progress and the Brain Map.
export const GAMES = [
  // — Specialty games: deeper, more interactive training per category —
  {
    id: "nexus", name: "Nexus", testType: "sustained_attention", Component: NexusGame, specialty: true,
    icon: Orbit, minutes: "3 min", trains: "Multi-object tracking",
    desc: "Track several targets as every dot scatters and drifts together. Sustained, divided attention under motion.",
    art: "from-chart-3/30 via-chart-1/10 to-background", iconTone: "text-chart-3",
    domains: ["focus", "cognitive_resilience"], categories: ["focus"],
  },
  {
    id: "mnemora", name: "Mnemora", testType: "working_memory", Component: MnemoraGame, specialty: true,
    icon: Brain, minutes: "3 min", trains: "Dual working memory",
    desc: "Judge position and sound matches against the 2-back at the same time. Two memory streams, one load.",
    art: "from-chart-4/30 via-chart-2/10 to-background", iconTone: "text-chart-4",
    domains: ["memory", "learning_capacity"], categories: ["memory"],
  },
  {
    id: "velocity", name: "Velocity", testType: "reaction_time", Component: VelocityGame, specialty: true,
    icon: Gauge, minutes: "1 min", trains: "Adaptive speed",
    desc: "Sort a relentless symbol stream that speeds up with every streak and slows on every slip.",
    art: "from-chart-5/30 via-chart-1/10 to-background", iconTone: "text-chart-5",
    domains: ["focus", "cognitive_resilience"], categories: ["speed"],
  },
  {
    id: "conflict", name: "Conflict", testType: "task_switching", Component: ConflictGame, specialty: true,
    icon: Crosshair, minutes: "2 min", trains: "Interference control",
    desc: "Read the cue, then report the word or the ink — never both. Stroop interference under constant reconfiguration.",
    art: "from-chart-2/30 via-chart-4/10 to-background", iconTone: "text-chart-2",
    domains: ["cognitive_resilience", "focus"], categories: ["control"],
  },
  {
    id: "constellation", name: "Constellation", testType: "visual_spatial", Component: ConstellationGame, specialty: true,
    icon: Sparkles, minutes: "3 min", trains: "Rotation + recall",
    desc: "Memorise a star pattern, then re-place it after the whole grid rotates a quarter turn.",
    art: "from-primary/25 via-chart-3/10 to-background", iconTone: "text-primary",
    domains: ["learning_capacity"], categories: ["spatial"],
  },
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
  // — Formerly coming soon, now playable —
  {
    id: "dual_stream", name: "Dual Stream", testType: "sustained_attention", Component: DualStreamGame,
    icon: Waves, minutes: "1 min", trains: "Divided attention",
    desc: "Hold two competing input streams at once without losing either thread.",
    art: "from-chart-3/25 via-chart-2/10 to-background", iconTone: "text-chart-3",
    domains: ["focus", "cognitive_resilience"], categories: ["focus"],
  },
  {
    id: "inhibit", name: "Inhibit", testType: "reaction_time", Component: InhibitGame,
    icon: Hand, minutes: "1 min", trains: "Impulse control",
    desc: "Stop a prepared response the instant the signal reverses.",
    art: "from-chart-5/25 via-secondary to-background", iconTone: "text-chart-5",
    domains: ["cognitive_resilience"], categories: ["control"],
  },
  {
    id: "word_forge", name: "Word Forge", testType: "verbal_fluency", Component: WordForgeGame,
    icon: Type, minutes: "2 min", trains: "Verbal fluency",
    desc: "Generate valid words under tightening category and time constraints.",
    art: "from-chart-4/25 via-secondary to-background", iconTone: "text-chart-4",
    domains: ["learning_capacity", "memory"], categories: ["memory"],
  },
  {
    id: "maze_mind", name: "Maze Mind", testType: "visual_spatial", Component: MazeMindGame,
    icon: Map, minutes: "2 min", trains: "Spatial navigation",
    desc: "Build and hold a mental map, then navigate it from memory.",
    art: "from-primary/20 via-chart-3/10 to-background", iconTone: "text-primary",
    domains: ["learning_capacity"], categories: ["spatial"],
  },
  {
    id: "logic_gate", name: "Logic Gate", testType: "task_switching", Component: LogicGateGame,
    icon: Binary, minutes: "2 min", trains: "Abstract reasoning",
    desc: "Infer the hidden rule behind each sequence before time runs out.",
    art: "from-chart-2/25 via-chart-5/10 to-background", iconTone: "text-chart-2",
    domains: ["cognitive_resilience", "learning_capacity"], categories: ["control"],
  },
  {
    id: "tempo_lock", name: "Tempo Lock", testType: "reaction_time", Component: TempoLockGame,
    icon: Timer, minutes: "1 min", trains: "Timing precision",
    desc: "Lock onto an interval and reproduce it without the cue.",
    art: "from-chart-1/25 via-secondary to-background", iconTone: "text-chart-1",
    domains: ["focus", "cognitive_resilience"], categories: ["speed"],
  },
];

// Training modules in development — displayed as locked previews only.
export const UPCOMING_GAMES = [
  {
    id: "spectra", name: "Spectra", icon: Activity, trains: "Spectral attention",
    desc: "Track a signal that shifts across frequency bands while noise rises and falls.",
    art: "from-chart-3/25 via-chart-2/10 to-background", iconTone: "text-chart-3",
  },
  {
    id: "compass_trail", name: "Compass Trail", icon: Compass, trains: "Directional recall",
    desc: "Hold a sequence of headings in mind and replay the route under reversal cues.",
    art: "from-primary/20 via-chart-4/10 to-background", iconTone: "text-primary",
  },
  {
    id: "crosshair_field", name: "Crosshair Field", icon: Crosshair, trains: "Target acquisition",
    desc: "Acquire moving targets in a fixed order while distractors crowd the field.",
    art: "from-chart-5/25 via-secondary to-background", iconTone: "text-chart-5",
  },
  {
    id: "glyph_cipher", name: "Glyph Cipher", icon: Fingerprint, trains: "Pattern decryption",
    desc: "Decode evolving glyph pairs by deducing the substitution rule behind them.",
    art: "from-chart-2/25 via-chart-5/10 to-background", iconTone: "text-chart-2",
  },
  {
    id: "resonance", name: "Resonance", icon: Radio, trains: "Auditory sequencing",
    desc: "Replay tonal sequences by ear as chords layer and the tempo climbs.",
    art: "from-chart-4/25 via-secondary to-background", iconTone: "text-chart-4",
  },
  {
    id: "workflow", name: "Workflow", icon: Workflow, trains: "Multi-step planning",
    desc: "Plan and reorder a chain of operations under a shifting resource budget.",
    art: "from-chart-1/25 via-chart-3/10 to-background", iconTone: "text-chart-1",
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
export const CHAPTERS = [
  {
    id: "goals",
    title: "Your goals",
    subtitle: "What matters most to you right now.",
    domains: ["focus", "learning_capacity"],
    questions: [
      { key: "goal", type: "choice", label: "Which outcome matters most to you right now?", options: [
        { value: "focus", label: "Sustained focus" }, { value: "energy", label: "Stable mental energy" },
        { value: "memory", label: "Memory & learning" }, { value: "calm", label: "Calm under pressure" },
        { value: "sleep", label: "Better sleep recovery" }] },
      { key: "focus_duration", type: "scale", label: "How long can you work before becoming mentally fatigued?", low: "Under 20 min", high: "2+ hours" },
      { key: "distractibility", type: "scale", label: "How often does your attention drift during focused work?", low: "Rarely", high: "Constantly" },
      { key: "memory_self", type: "scale", label: "How well do you retain what you read or learn?", low: "Poorly", high: "Very well" },
    ],
  },
  {
    id: "rhythm",
    title: "Your daily rhythm",
    subtitle: "When your mind is at its best — and worst.",
    domains: ["mental_energy"],
    questions: [
      { key: "sharp_time", type: "choice", label: "At what time do you usually feel mentally sharpest?", options: [
        { value: "early_morning", label: "Early morning" }, { value: "late_morning", label: "Late morning" },
        { value: "afternoon", label: "Afternoon" }, { value: "evening", label: "Evening" }, { value: "varies", label: "It varies" }] },
      { key: "decline_time", type: "choice", label: "When does your focus usually decline?", options: [
        { value: "late_morning", label: "Late morning" }, { value: "early_afternoon", label: "Early afternoon" },
        { value: "late_afternoon", label: "Late afternoon" }, { value: "evening", label: "Evening" }] },
      { key: "energy_morning", type: "scale", label: "How is your mental energy in the morning?", low: "Very low", high: "Very high" },
      { key: "energy_afternoon", type: "scale", label: "How is your mental energy in the afternoon?", low: "Very low", high: "Very high" },
    ],
  },
  {
    id: "sleep",
    title: "Sleep and recovery",
    subtitle: "How your brain restores itself.",
    domains: ["sleep_recovery"],
    questions: [
      { key: "restored", type: "scale", label: "How often do you wake feeling restored?", low: "Almost never", high: "Almost always" },
      { key: "sleep_consistency", type: "scale", label: "How consistent are your sleep and wake times?", low: "Very irregular", high: "Very consistent" },
      { key: "sleep_latency", type: "choice", label: "How long does it usually take you to fall asleep?", options: [
        { value: "under_15", label: "Under 15 minutes" }, { value: "15_45", label: "15–45 minutes" }, { value: "over_45", label: "Over 45 minutes" }] },
      { key: "screens_evening", type: "choice", label: "How often do you use screens in the hour before bed?", options: [
        { value: "most_nights", label: "Most nights" }, { value: "sometimes", label: "Sometimes" }, { value: "rarely", label: "Rarely" }] },
    ],
  },
  {
    id: "stress",
    title: "Stress and emotional load",
    subtitle: "How pressure shapes your cognition.",
    domains: ["stress_regulation", "cognitive_resilience"],
    questions: [
      { key: "stress", type: "scale", label: "How high is your typical daily stress?", low: "Very low", high: "Very high" },
      { key: "overwhelm", type: "scale", label: "How often do you feel mentally overloaded?", low: "Rarely", high: "Daily" },
      { key: "work_interruptions", type: "choice", label: "How often is your work interrupted?", options: [
        { value: "constant", label: "Constantly" }, { value: "frequent", label: "Frequently" }, { value: "occasional", label: "Occasionally" }] },
      { key: "prolonged_focus", type: "choice", label: "What happens when you attempt prolonged concentration?", options: [
        { value: "fatigue", label: "Mental fatigue builds quickly" }, { value: "restless", label: "I become restless" },
        { value: "fine", label: "I can usually sustain it" }] },
    ],
  },
  {
    id: "lifestyle",
    title: "Substances and lifestyle",
    subtitle: "What you're already running on.",
    domains: ["lifestyle_protection"],
    questions: [
      { key: "caffeine_cups", type: "choice", label: "How much caffeine do you consume daily?", options: [
        { value: "none", label: "None" }, { value: "1_2", label: "1–2 servings" }, { value: "3_4", label: "3–4 servings" }, { value: "5_plus", label: "5+ servings" }] },
      { key: "caffeine_late", type: "choice", label: "How often do you have caffeine after 2:00 PM?", options: [
        { value: "often", label: "Often" }, { value: "sometimes", label: "Sometimes" }, { value: "rarely", label: "Rarely or never" }] },
      { key: "hydration", type: "scale", label: "How well do you stay hydrated through the day?", low: "Poorly", high: "Very well" },
      { key: "exercise", type: "choice", label: "How often do you exercise?", options: [
        { value: "regular", label: "3+ times a week" }, { value: "occasional", label: "1–2 times a week" }, { value: "rare", label: "Rarely" }] },
    ],
  },
];
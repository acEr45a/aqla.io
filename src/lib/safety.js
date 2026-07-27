export const SCREENING_QUESTIONS = [
  { id: "age_band", question: "What is your age?", options: [
    { value: "under_18", label: "Under 18" }, { value: "18_45", label: "18–45" },
    { value: "46_60", label: "46–60" }, { value: "over_60", label: "Over 60" }] },
  { id: "pregnancy", question: "Are you currently pregnant or breastfeeding?", options: [
    { value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "na", label: "Not applicable" }] },
  { id: "medications", question: "Do you take prescription medications that affect the heart, brain, or mood?", options: [
    { value: "none", label: "No medications" }, { value: "other", label: "Yes, but unrelated" },
    { value: "interacting", label: "Yes — heart, brain, or mood related" }] },
  { id: "cardiovascular", question: "Do you have any known cardiovascular condition (arrhythmia, hypertension, heart disease)?", options: [
    { value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
  { id: "kidney_liver", question: "Do you have any known kidney or liver condition?", options: [
    { value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
  { id: "stimulant_sensitivity", question: "How do you respond to stimulants such as caffeine?", options: [
    { value: "none", label: "No issues" }, { value: "mild", label: "Mild jitteriness sometimes" },
    { value: "strong", label: "Strong reactions — anxiety, palpitations" }] },
  { id: "sleep_difficulty", question: "How would you describe your sleep difficulties?", options: [
    { value: "none", label: "None" }, { value: "occasional", label: "Occasional" },
    { value: "severe", label: "Severe or chronic insomnia" }] },
  { id: "caffeine", question: "How much caffeine do you consume daily?", options: [
    { value: "low", label: "0–1 cups" }, { value: "moderate", label: "2–3 cups" },
    { value: "high", label: "4+ cups" }] },
  { id: "mental_health", question: "How is your mental health currently?", options: [
    { value: "stable", label: "Stable" }, { value: "managing", label: "Managing some challenges" },
    { value: "acute", label: "Experiencing severe symptoms" }] },
  { id: "neuro_symptoms", question: "Have you had recent unexplained neurological symptoms (fainting, numbness, sudden severe headaches)?", options: [
    { value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
];

export const STATUS_META = {
  eligible: { label: "Eligible for full protocol", color: "#C9F24E",
    message: "No safety restrictions detected. All protocol families, including supplement formulas, may be considered — subject to evidence review." },
  stimulant_free: { label: "Stimulant-free protocols only", color: "#F2C04E",
    message: "Your profile suggests stimulant-based formulas (like SPARK) could worsen sleep or anxiety. FLOW, DRIVE, LEARN, and RESET remain available." },
  paused: { label: "Supplement recommendations paused", color: "#F2C04E",
    message: "Based on your answers, AQLA has paused supplement recommendations. Digital behavior-first protocols remain fully available." },
  clinician_review: { label: "Clinician review recommended", color: "#E8A28F",
    message: "Your answers indicate a supplement recommendation should be reviewed by a clinician before proceeding. Digital protocols remain available." },
  medical_evaluation: { label: "Medical evaluation recommended", color: "#E8756B",
    message: "Some of your answers describe symptoms that deserve professional medical evaluation. Please speak with a doctor. AQLA will pause all supplement recommendations." },
};

export function evaluateEligibility(r) {
  const flags = [];
  if (r.neuro_symptoms === "yes") {
    return { status: "medical_evaluation", flags: ["Recent unexplained neurological symptoms"] };
  }
  if (r.age_band === "under_18") flags.push("Under 18");
  if (r.pregnancy === "yes") flags.push("Pregnancy or breastfeeding");
  if (flags.length) return { status: "paused", flags };
  if (r.mental_health === "acute") flags.push("Acute mental health symptoms");
  if (r.cardiovascular === "yes") flags.push("Cardiovascular condition");
  if (r.kidney_liver === "yes") flags.push("Kidney or liver condition");
  if (r.medications === "interacting") flags.push("Potentially interacting medications");
  if (flags.length) return { status: "clinician_review", flags };
  if (r.stimulant_sensitivity === "strong") flags.push("Strong stimulant sensitivity");
  if (r.sleep_difficulty === "severe") flags.push("Severe sleep difficulty");
  if (r.caffeine === "high") flags.push("High existing caffeine intake");
  if (flags.length) return { status: "stimulant_free", flags };
  return { status: "eligible", flags: [] };
}
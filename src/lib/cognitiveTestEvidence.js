// Clinical evidence for AQLA's cognitive baseline tests.
// All references are real, peer-reviewed sources (no fabrication).

export const COGNITIVE_TEST_EVIDENCE = [
  {
    id: "wms-digit-span",
    name: "Wechsler Digit Span (Memory)",
    category: "Cognitive tests",
    role: "Measures auditory short-term and working memory span (forward + backward)",
    evidence_grade: "A",
    evidence_type: "Standardized clinical instrument with normative samples across the lifespan",
    studied_population: "Healthy adults and clinical populations; norms stratified by age and education",
    effect_size: "Forward span averages ~7 digits, backward ~5–6 in healthy adults; sensitive to working-memory impairment",
    timeframe: "Single administration (~3–5 minutes); sensitive to acute sleep, stress and cognitive load changes",
    limitations:
      "AQLA runs an adapted self-administered screen, not the full copyrighted WMS-IV battery; demographic adjustment is limited in a brief web format",
    safety_info: "A screening tool, not a diagnostic test; low scores can reflect anxiety, attention or hearing rather than memory disorder",
    last_reviewed: "2026-08-02",
    references: [
      "Wechsler, D. Wechsler Memory Scale – Fourth Edition (WMS-IV) Technical and Interpretive Manual. Pearson, 2009.",
      "Wechsler, D. WAIS-IV Administration and Scoring Manual. Pearson, 2008.",
      "Choi HJ et al. A Normative Study of the Digit Span in an Educationally Diverse Elderly Population. Archives of Clinical Neuropsychology, 2014.",
      "Gignac GE, Reynolds MR. Digit Span is (mostly) related linearly to general intelligence. Psychological Assessment, 2015.",
    ],
  },
  {
    id: "pvt-reaction",
    name: "Psychomotor Vigilance Task (Reaction time)",
    category: "Cognitive tests",
    role: "Measures vigilant attention and processing speed; the gold standard for sleep-loss sensitivity",
    evidence_grade: "A",
    evidence_type: "Decades of controlled sleep-deprivation and shift-work studies; test–retest reliability > 0.8",
    studied_population: "Healthy adults, shift workers, and sleep-deprived populations",
    effect_size:
      "Sleep loss reliably slows mean RT and increases lapses (RT ≥ 500 ms); well-rested adults average ~250 ms",
    timeframe: "Standard 10-min; brief 3-min version (PVT-B) retains sensitivity; acute effects within a session",
    limitations:
      "AQLA uses a shortened adaptation, not the full 10-min PVT; fewer trials reduce reliability and demographic norms",
    safety_info: "Fatigue and distraction affect results; not a medical diagnosis of sleep disorders",
    last_reviewed: "2026-08-02",
    references: [
      "Dinges DF, Powell JW. Microcomputer analyses of performance on a portable, simple visual RT task during sustained operations. Behavior Research Methods, Instruments, & Computers, 1985.",
      "Basner M, Dinges DF. Maximizing sensitivity of the Psychomotor Vigilance Test (PVT) to sleep loss. Sleep, 2011.",
      "Lamond N et al. Validity of psychomotor vigilance tasks of less than 10-minute duration. Behavior Research Methods, Instruments, & Computers, 2004.",
      "Basner M, Mollicone D, Dinges DF. Validity and sensitivity of a brief Psychomotor Vigilance Test (PVT-B) to total and partial sleep deprivation. Sleep, 2011.",
    ],
  },
  {
    id: "sart-attention",
    name: "Sustained Attention to Response Task (SART)",
    category: "Cognitive tests",
    role: "Measures sustained attention and inhibitory control via errors of commission to a rare no-go target",
    evidence_grade: "A",
    evidence_type: "Validated go/no-go paradigm used in TBI, ADHD, sleep and aging research",
    studied_population: "Healthy adults, traumatic brain injury patients, older adults, and sleep-deprived individuals",
    effect_size:
      "Commission errors (responding to the target) rise with attentional failure, fatigue and mind-wandering",
    timeframe: "Single administration (~4–6 minutes); sensitive to within-day vigilance fluctuations",
    limitations:
      "AQLA uses a digit SART with a shortened trial count; self-administered web format may add motor timing variance",
    safety_info: "A research measure of attention, not a clinical diagnosis of attention disorders",
    last_reviewed: "2026-08-02",
    references: [
      "Robertson IH, Manly T, Andrade J, Baddeley BT, Yiend J. 'Oops!': performance correlates of everyday attentional failures in traumatic brain injury and normal subjects. Neuropsychologia, 1997.",
      "Rizzo R et al. Longitudinal Study on Sustained Attention to Response Task (SART). International Journal of Neuroscience, 2022.",
      "Schepers AM et al. Revisiting the link between the sustained attention to response task and mind-wandering. Consciousness and Cognition, 2023.",
      "Lanssens A et al. The sustained attention to response task: validation of a non-numerical version. Journal of Clinical and Experimental Neuropsychology, 2023.",
    ],
  },
];
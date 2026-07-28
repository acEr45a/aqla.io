// Stylized side-profile brain (facing left), tiled into regions mapped to AQLA domains.
// Region shapes are rough polygons clipped by the brain silhouette, so only the
// outer edge needs to look organic. Each region declares its bbox (for the
// bottom-up "liquid" fill) plus a label anchor (ax/ay on the brain) and label
// position (lx/ly) with text anchor.

export const OUTLINES = [
  // cerebrum
  "M 95 215 C 82 165, 108 108, 165 78 C 222 48, 320 42, 380 68 C 436 92, 466 138, 462 188 C 459 224, 443 254, 412 275 C 375 299, 322 310, 272 310 C 210 310, 148 298, 120 268 C 102 248, 99 232, 95 215 Z",
  // cerebellum
  "M 350 292 C 360 274, 402 266, 432 276 C 458 285, 462 310, 444 326 C 423 343, 375 343, 358 324 C 348 313, 344 302, 350 292 Z",
  // brainstem
  "M 322 300 C 328 322, 332 348, 322 378 L 352 386 C 350 358, 352 328, 360 310 Z",
];

export const REGIONS = [
  { // prefrontal — Focus
    key: "focus",
    d: "M 70 40 L 185 40 C 175 130, 178 230, 195 320 L 70 320 Z",
    xMin: 95, xMax: 190, yMin: 55, yMax: 305,
    ax: 130, ay: 130, lx: 55, ly: 65, anchor: "end",
  },
  { // frontal — Mental Energy
    d: "M 185 40 L 292 40 C 288 100, 285 145, 285 192 C 250 198, 215 197, 182 188 C 178 135, 180 85, 185 40 Z",
    key: "mental_energy",
    xMin: 180, xMax: 292, yMin: 50, yMax: 196,
    ax: 235, ay: 90, lx: 190, ly: 22, anchor: "end",
  },
  { // limbic — Stress Regulation
    key: "stress_regulation",
    d: "M 182 188 C 215 197, 250 198, 285 192 C 287 240, 284 275, 279 320 L 195 320 C 184 270, 180 225, 182 188 Z",
    xMin: 182, xMax: 287, yMin: 190, yMax: 308,
    ax: 232, ay: 265, lx: 185, ly: 400, anchor: "end",
  },
  { // parietal — Cognitive Resilience
    key: "cognitive_resilience",
    d: "M 292 40 L 400 40 C 398 95, 392 145, 382 184 C 352 192, 318 195, 285 192 C 285 145, 288 100, 292 40 Z",
    xMin: 285, xMax: 398, yMin: 48, yMax: 192,
    ax: 340, ay: 85, lx: 355, ly: 20, anchor: "start",
  },
  { // temporal — Memory
    key: "memory",
    d: "M 279 320 C 284 275, 287 240, 285 192 C 318 195, 352 192, 382 184 C 378 220, 368 255, 352 285 C 330 305, 305 315, 279 320 Z",
    xMin: 280, xMax: 380, yMin: 186, yMax: 308,
    ax: 320, ay: 260, lx: 300, ly: 415, anchor: "middle",
  },
  { // occipital — Learning Capacity
    key: "learning_capacity",
    d: "M 400 40 L 500 40 L 500 275 L 368 275 C 380 200, 393 120, 400 40 Z",
    xMin: 370, xMax: 462, yMin: 65, yMax: 272,
    ax: 430, ay: 130, lx: 480, ly: 85, anchor: "start",
  },
  { // cerebellum — Lifestyle Protection
    key: "lifestyle_protection",
    d: "M 344 262 L 465 262 L 465 345 L 344 345 Z",
    xMin: 346, xMax: 460, yMin: 270, yMax: 340,
    ax: 435, ay: 315, lx: 480, ly: 330, anchor: "start",
  },
  { // brainstem — Sleep Recovery
    key: "sleep_recovery",
    d: "M 315 296 L 365 296 L 365 390 L 315 390 Z",
    xMin: 318, xMax: 360, yMin: 300, yMax: 386,
    ax: 340, ay: 365, lx: 400, ly: 395, anchor: "start",
  },
];
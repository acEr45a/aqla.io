// Textbook lateral view of the human brain (facing left) in a 660x560 viewBox:
// gyri-bumped cerebral cortex divided by the central sulcus (frontal | parietal),
// the lateral (Sylvian) fissure with the temporal lobe below it, the insula deep
// at the fissure, the parieto-occipital line, a foliated cerebellum and the
// brainstem (pons → medulla → spinal cord) descending in front of it.
// Each region: closed path + bbox [x,y,w,h] for the score-fill gauge,
// label [x,y] pill position, optional anchor [x,y] leader-line target.

// Outer outlines of the three anatomical bodies — used for the base shading,
// the sulci clip and the crisp outer stroke.
export const OUTLINES = [
  // cerebrum (bumpy gyral edge)
  "M 300 101 A 90 90 0 0 0 206 117 A 45 45 0 0 0 159 141 A 38 38 0 0 0 123 176 A 32 32 0 0 0 112 215 A 22 22 0 0 0 116 246 A 30 30 0 0 0 159 294 A 45 45 0 0 0 215 320 A 55 55 0 0 0 284 334 A 55 55 0 0 0 352 334 A 55 55 0 0 0 425 322 A 40 40 0 0 0 478 292 A 32 32 0 0 0 517 254 A 32 32 0 0 0 530 215 A 44 44 0 0 0 517 176 A 44 44 0 0 0 474 148 A 52 52 0 0 0 425 115 A 42 42 0 0 0 356 102 A 42 42 0 0 0 300 101 Z",
  // cerebellum
  "M 400 372 C 404 348, 424 330, 452 326 A 26 26 0 0 1 500 330 A 30 30 0 0 1 540 356 A 26 26 0 0 1 550 392 A 26 26 0 0 1 532 428 A 30 30 0 0 1 490 448 A 30 30 0 0 1 440 440 C 414 428, 398 402, 400 372 Z",
  // brainstem + spinal cord
  "M 352 316 C 372 318, 388 326, 396 342 C 404 358, 404 372, 398 384 C 392 396, 388 410, 390 424 C 392 448, 396 476, 396 498 C 396 508, 384 510, 378 502 C 372 470, 364 430, 358 396 C 352 370, 348 340, 352 316 Z",
];

// Continuous sulci across the cortex, temporal gyri, cerebellar folia and
// brainstem striations. Clipped to the outlines above.
export const SULCI = [
  "M 128 232 C 132 172, 176 128, 240 112 C 320 92, 412 104, 470 140 C 512 166, 528 208, 524 250",
  "M 148 244 C 152 190, 192 148, 250 132 C 322 114, 404 126, 456 158 C 494 182, 508 214, 504 252",
  "M 172 252 C 176 206, 212 168, 264 152 C 328 136, 398 148, 442 176 C 476 198, 488 224, 486 252",
  "M 196 254 C 200 218, 230 188, 278 174 C 334 160, 390 170, 428 194 C 456 212, 466 232, 464 252",
  "M 140 268 C 176 296, 248 308, 312 302 C 366 296, 412 292, 446 282",
  "M 152 286 C 190 310, 254 320, 314 314 C 364 308, 406 304, 438 296",
  "M 406 366 C 444 348, 496 350, 534 368",
  "M 402 388 C 442 372, 500 374, 548 392",
  "M 406 412 C 444 398, 498 400, 534 418",
  "M 356 352 C 368 356, 382 358, 396 358",
  "M 366 400 C 376 404, 386 406, 396 407",
  "M 372 448 C 380 452, 388 454, 394 455",
];

export const REGIONS = [
  {
    key: "focus", region: "Prefrontal cortex", role: "Executive control & attention",
    path: "M 206 117 A 45 45 0 0 0 159 141 A 38 38 0 0 0 123 176 A 32 32 0 0 0 112 215 A 22 22 0 0 0 116 240 C 134 250, 156 256, 176 258 C 186 210, 196 162, 206 117 Z",
    bbox: [110, 112, 100, 150], label: [88, 368], anchor: [130, 254],
  },
  {
    key: "mental_energy", region: "Frontal lobe", role: "Drive, initiation & effort",
    path: "M 300 101 A 90 90 0 0 0 206 117 C 196 162, 186 210, 176 258 C 200 262, 226 260, 250 255 C 262 210, 280 160, 300 101 Z",
    bbox: [174, 98, 130, 162], label: [232, 38], anchor: [250, 104],
  },
  {
    key: "cognitive_resilience", region: "Parietal lobe", role: "Integration under load",
    path: "M 300 101 A 42 42 0 0 1 356 102 A 52 52 0 0 1 425 115 A 44 44 0 0 1 474 148 C 466 190, 458 232, 452 268 C 400 282, 320 268, 250 255 C 262 210, 280 160, 300 101 Z",
    bbox: [248, 96, 232, 186], label: [424, 38], anchor: [400, 102],
  },
  {
    key: "learning_capacity", region: "Occipital lobe", role: "Processing & encoding new input",
    path: "M 474 148 A 44 44 0 0 1 517 176 A 32 32 0 0 1 530 215 A 32 32 0 0 1 517 254 A 40 40 0 0 1 478 292 C 470 284, 460 276, 452 268 C 458 232, 466 190, 474 148 Z",
    bbox: [450, 144, 84, 152], label: [556, 108], anchor: [512, 180],
  },
  {
    key: "sleep_recovery", region: "Brainstem · pons & medulla", role: "Sleep–wake cycles & recovery",
    path: "M 352 316 C 372 318, 388 326, 396 342 C 404 358, 404 372, 398 384 C 392 396, 388 410, 390 424 C 392 448, 396 476, 396 498 C 396 508, 384 510, 378 502 C 372 470, 364 430, 358 396 C 352 370, 348 340, 352 316 Z",
    bbox: [346, 314, 60, 198], label: [292, 500], anchor: [378, 492],
  },
  {
    key: "lifestyle_protection", region: "Cerebellum", role: "Habit, rhythm & coordination",
    path: "M 400 372 C 404 348, 424 330, 452 326 A 26 26 0 0 1 500 330 A 30 30 0 0 1 540 356 A 26 26 0 0 1 550 392 A 26 26 0 0 1 532 428 A 30 30 0 0 1 490 448 A 30 30 0 0 1 440 440 C 414 428, 398 402, 400 372 Z",
    bbox: [396, 324, 158, 126], label: [548, 478], anchor: [516, 434],
  },
  {
    key: "memory", region: "Temporal lobe · hippocampus", role: "Memory formation & recall",
    path: "M 116 246 C 150 264, 200 268, 252 262 C 322 275, 400 288, 456 276 C 452 300, 440 316, 425 322 A 55 55 0 0 1 356 334 A 55 55 0 0 1 284 334 A 55 55 0 0 1 215 320 A 45 45 0 0 1 159 294 A 30 30 0 0 1 116 246 Z",
    bbox: [114, 244, 344, 96], label: [286, 314], anchor: null,
  },
  {
    key: "stress_regulation", region: "Insula & limbic system", role: "Emotion & threat regulation",
    path: "M 214 236 C 216 216, 244 204, 268 210 C 292 216, 300 234, 288 250 C 274 268, 236 270, 220 256 C 214 250, 213 243, 214 236 Z",
    bbox: [212, 202, 90, 70], label: [250, 232], anchor: null,
  },
];
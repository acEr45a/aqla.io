// Simplified anatomical brain (side profile facing left) in a 660x560 viewBox.
// Divisions follow real anatomy: central sulcus (frontal/parietal), lateral
// fissure (temporal below), parieto-occipital boundary, cerebellum + brainstem.
// Each region: closed path + bbox [x,y,w,h] for the score-fill gauge,
// label [x,y] pill position, optional anchor [x,y] leader-line target.

export const SILHOUETTE =
  "M 215 112 C 260 88, 305 84, 352 92 C 392 88, 435 92, 468 108 C 520 128, 558 190, 562 255 C 564 295, 552 320, 535 332 C 546 342, 552 350, 548 360 C 558 388, 542 415, 505 424 C 478 431, 452 428, 434 414 C 428 406, 422 400, 418 398 C 421 422, 420 448, 415 470 C 403 475, 391 473, 383 465 C 378 435, 379 400, 386 366 C 350 380, 310 380, 280 372 C 225 362, 185 340, 172 315 C 162 310, 154 308, 148 305 C 100 300, 80 268, 88 220 C 100 165, 150 125, 215 112 Z";

// Gyri lines per region — each set is clipped to its own region path so the
// lines always sit inside the correct functional area.
export const GYRI = {
  focus: [
    "M 120 130 C 150 160, 158 215, 146 290",
    "M 96 160 C 126 190, 132 240, 122 300",
    "M 78 200 C 104 226, 110 262, 104 300",
  ],
  mental_energy: [
    "M 232 96 C 226 150, 218 210, 208 275",
    "M 272 90 C 268 145, 258 205, 246 268",
    "M 314 88 C 310 142, 300 200, 288 256",
  ],
  cognitive_resilience: [
    "M 372 90 C 364 142, 352 198, 336 252",
    "M 412 88 C 408 140, 400 196, 390 252",
    "M 452 96 C 452 148, 448 202, 442 258",
  ],
  learning_capacity: [
    "M 478 110 C 500 150, 510 200, 506 270",
    "M 506 122 C 528 160, 540 208, 536 280",
    "M 532 148 C 552 184, 560 226, 556 282",
  ],
  memory: [
    "M 188 296 C 250 276, 330 280, 440 296",
    "M 196 322 C 258 304, 340 308, 444 322",
    "M 210 348 C 268 332, 342 336, 430 344",
  ],
  lifestyle_protection: [
    "M 436 350 C 476 336, 522 344, 548 366",
    "M 430 376 C 472 362, 520 368, 552 388",
    "M 432 400 C 472 388, 516 392, 544 408",
  ],
  sleep_recovery: [
    "M 388 380 C 400 384, 410 386, 418 388",
    "M 386 414 C 398 418, 408 420, 419 422",
    "M 385 446 C 396 450, 406 452, 417 454",
  ],
};

export const REGIONS = [
  {
    key: "focus", region: "Prefrontal cortex", role: "Executive control & attention",
    path: "M 215 112 C 150 125, 100 165, 88 220 C 80 268, 100 300, 148 305 C 168 304, 184 294, 196 280 C 205 225, 208 165, 215 112 Z",
    bbox: [78, 108, 140, 200], label: [96, 370], anchor: [112, 300],
  },
  {
    key: "mental_energy", region: "Frontal lobe", role: "Drive, initiation & effort",
    path: "M 215 112 C 260 88, 305 84, 352 92 C 340 145, 322 200, 298 248 C 265 252, 230 258, 200 272 C 202 220, 207 165, 215 112 Z",
    bbox: [196, 82, 160, 192], label: [246, 34], anchor: [270, 92],
  },
  {
    key: "cognitive_resilience", region: "Parietal lobe", role: "Integration under load",
    path: "M 352 92 C 392 88, 435 92, 468 108 C 466 165, 462 225, 452 268 C 405 258, 350 250, 298 248 C 322 200, 340 145, 352 92 Z",
    bbox: [296, 86, 175, 185], label: [430, 34], anchor: [400, 94],
  },
  {
    key: "learning_capacity", region: "Occipital lobe", role: "Processing & encoding new input",
    path: "M 468 108 C 520 128, 558 190, 562 255 C 564 295, 552 320, 535 332 C 505 322, 478 300, 462 275 C 456 273, 452 268, 452 268 C 462 225, 466 165, 468 108 Z",
    bbox: [450, 105, 116, 230], label: [566, 70], anchor: [520, 145],
  },
  {
    key: "memory", region: "Temporal lobe · hippocampus", role: "Memory formation & recall",
    path: "M 196 282 C 230 262, 268 252, 298 250 C 350 252, 405 260, 452 270 C 448 300, 435 330, 412 350 C 380 372, 330 380, 280 372 C 225 362, 185 340, 172 315 C 178 300, 186 290, 196 282 Z",
    bbox: [170, 248, 285, 132], label: [300, 322], anchor: null,
  },
  {
    key: "stress_regulation", region: "Limbic system", role: "Emotion & threat regulation",
    path: "M 290 200 C 300 175, 340 168, 368 180 C 392 192, 398 214, 384 234 C 366 256, 322 260, 296 246 C 278 234, 280 216, 290 200 Z",
    bbox: [276, 166, 124, 96], label: [338, 206], anchor: null,
  },
  {
    key: "lifestyle_protection", region: "Cerebellum", role: "Habit, rhythm & coordination",
    path: "M 460 330 C 495 318, 535 330, 548 360 C 558 388, 542 415, 505 424 C 468 432, 435 420, 426 393 C 420 368, 434 342, 460 330 Z",
    bbox: [418, 316, 136, 116], label: [545, 470], anchor: [498, 426],
  },
  {
    key: "sleep_recovery", region: "Brainstem", role: "Sleep–wake cycles & recovery",
    path: "M 390 355 C 404 362, 414 375, 418 395 C 422 420, 420 448, 415 470 C 403 475, 391 473, 383 465 C 378 428, 380 390, 390 355 Z",
    bbox: [376, 352, 48, 122], label: [310, 516], anchor: [392, 468],
  },
];
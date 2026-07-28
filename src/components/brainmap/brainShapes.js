// Textbook lateral view of the human brain (facing left) in a 660x560 viewBox.
// Every lobe border is a wiggling gyral/sulcal line — never a straight cut —
// and adjacent lobes share the exact same curve (written forward in one region,
// reversed in its neighbour) so the boundaries meet with no seams:
//   central sulcus (frontal | parietal), lateral/Sylvian fissure (above | temporal),
//   parieto-occipital line, and the prefrontal border inside the frontal lobe.
// Each region: closed path + bbox [x,y,w,h] for the score-fill gauge,
// label [x,y] pill position, optional anchor [x,y] leader-line target.

// Outer outlines of the three anatomical bodies — base shading + crisp outer stroke.
export const OUTLINES = [
  // cerebrum (bumpy gyral edge)
  "M 300 101 A 90 90 0 0 0 206 117 A 45 45 0 0 0 159 141 A 38 38 0 0 0 123 176 A 32 32 0 0 0 112 215 A 22 22 0 0 0 116 246 A 30 30 0 0 0 159 294 A 45 45 0 0 0 215 320 A 55 55 0 0 0 284 334 A 55 55 0 0 0 352 334 A 55 55 0 0 0 425 322 A 40 40 0 0 0 478 292 A 32 32 0 0 0 517 254 A 32 32 0 0 0 530 215 A 44 44 0 0 0 517 176 A 44 44 0 0 0 474 148 A 52 52 0 0 0 425 115 A 42 42 0 0 0 356 102 A 42 42 0 0 0 300 101 Z",
  // cerebellum
  "M 400 372 C 404 348, 424 330, 452 326 A 26 26 0 0 1 500 330 A 30 30 0 0 1 540 356 A 26 26 0 0 1 550 392 A 26 26 0 0 1 532 428 A 30 30 0 0 1 490 448 A 30 30 0 0 1 440 440 C 414 428, 398 402, 400 372 Z",
  // brainstem + spinal cord
  "M 352 316 C 372 318, 388 326, 396 342 C 404 358, 404 372, 398 384 C 392 396, 388 410, 390 424 C 392 448, 396 476, 396 498 C 396 508, 384 510, 378 502 C 372 470, 364 430, 358 396 C 352 370, 348 340, 352 316 Z",
];

// Winding gyri/sulci, clipped region by region in the component.
export const SULCI = [
  "M 128 234 C 128 210, 142 196, 152 176 C 162 156, 184 148, 200 132 C 220 114, 250 116, 274 108 C 302 100, 336 112, 366 108 C 400 104, 424 126, 452 138 C 480 150, 500 176, 512 200 C 522 218, 522 226, 524 244",
  "M 150 246 C 148 222, 164 208, 174 190 C 184 172, 202 166, 218 152 C 236 136, 262 138, 284 130 C 310 122, 340 132, 368 128 C 398 124, 420 144, 444 156 C 468 168, 486 190, 496 210 C 504 226, 504 236, 504 250",
  "M 174 252 C 172 232, 186 220, 196 204 C 206 188, 222 184, 236 172 C 252 158, 276 160, 296 154 C 318 148, 344 156, 368 152 C 394 148, 412 164, 432 174 C 452 184, 468 202, 476 218 C 484 232, 484 242, 486 254",
  "M 198 256 C 196 240, 208 230, 218 218 C 228 206, 242 202, 254 192 C 268 182, 288 184, 306 180 C 324 176, 346 182, 366 178 C 388 174, 402 188, 418 196 C 434 204, 448 218, 454 230 C 460 240, 462 248, 464 256",
  "M 134 262 C 148 276, 162 280, 180 286 C 200 292, 220 294, 244 296 C 268 298, 290 294, 314 296 C 340 298, 360 292, 384 292 C 408 292, 424 288, 444 282",
  "M 148 284 C 162 296, 178 300, 196 304 C 216 308, 236 310, 258 310 C 280 310, 300 306, 322 308 C 346 310, 364 304, 386 302 C 406 300, 420 298, 436 294",
  "M 406 366 C 428 352, 456 346, 484 350 C 510 354, 526 360, 534 368",
  "M 402 388 C 426 374, 460 368, 494 372 C 524 376, 542 384, 548 392",
  "M 406 412 C 428 400, 458 394, 486 398 C 512 402, 528 410, 534 418",
  "M 356 352 C 368 356, 382 358, 396 358",
  "M 366 400 C 376 404, 386 406, 396 407",
  "M 372 448 C 380 452, 388 454, 394 455",
];

export const REGIONS = [
  {
    key: "focus", region: "Prefrontal cortex", role: "Executive control & attention",
    path: "M 206 117 A 45 45 0 0 0 159 141 A 38 38 0 0 0 123 176 A 32 32 0 0 0 112 215 A 22 22 0 0 0 116 240 C 138 250, 152 244, 172 252 C 174 254, 175 256, 176 258 C 176 250, 178 244, 184 232 C 196 212, 188 196, 198 174 C 208 152, 198 140, 206 117 Z",
    bbox: [110, 112, 100, 150], label: [88, 368], anchor: [130, 254],
  },
  {
    key: "mental_energy", region: "Frontal lobe", role: "Drive, initiation & effort",
    path: "M 300 101 A 90 90 0 0 0 206 117 C 198 140, 208 152, 198 174 C 188 196, 196 212, 184 232 C 178 244, 176 250, 176 258 C 186 262, 206 250, 224 258 C 234 262, 242 258, 250 255 C 252 230, 274 222, 268 200 C 262 178, 284 172, 280 150 C 276 128, 296 122, 300 101 Z",
    bbox: [174, 98, 130, 162], label: [232, 38], anchor: [250, 104],
  },
  {
    key: "cognitive_resilience", region: "Parietal lobe", role: "Integration under load",
    path: "M 300 101 A 42 42 0 0 1 356 102 A 52 52 0 0 1 425 115 A 44 44 0 0 1 474 148 C 462 172, 474 186, 466 206 C 458 226, 468 244, 452 268 C 432 262, 416 278, 392 270 C 368 262, 346 274, 320 266 C 296 258, 274 268, 250 255 C 252 230, 274 222, 268 200 C 262 178, 284 172, 280 150 C 276 128, 296 122, 300 101 Z",
    bbox: [248, 96, 232, 186], label: [424, 38], anchor: [400, 102],
  },
  {
    key: "learning_capacity", region: "Occipital lobe", role: "Processing & encoding new input",
    path: "M 474 148 A 44 44 0 0 1 517 176 A 32 32 0 0 1 530 215 A 32 32 0 0 1 517 254 A 40 40 0 0 1 478 292 C 470 284, 460 276, 452 268 C 468 244, 458 226, 466 206 C 474 186, 462 172, 474 148 Z",
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
    path: "M 116 248 C 140 258, 154 252, 176 260 C 198 268, 210 258, 228 266 C 246 274, 258 268, 278 274 C 306 282, 330 272, 356 280 C 384 288, 408 276, 432 282 C 442 284, 450 280, 456 276 C 452 300, 440 316, 425 322 A 55 55 0 0 1 356 334 A 55 55 0 0 1 284 334 A 55 55 0 0 1 215 320 A 45 45 0 0 1 159 294 A 30 30 0 0 1 116 248 Z",
    bbox: [114, 244, 344, 96], label: [286, 314], anchor: null,
  },
  {
    key: "stress_regulation", region: "Insula & limbic system", role: "Emotion & threat regulation",
    path: "M 214 236 C 216 216, 244 204, 268 210 C 292 216, 300 234, 288 250 C 274 268, 236 270, 220 256 C 214 250, 213 243, 214 236 Z",
    bbox: [212, 202, 90, 70], label: [250, 232], anchor: null,
  },
];
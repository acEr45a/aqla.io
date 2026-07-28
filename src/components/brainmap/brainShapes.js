// Left lateral view of the brain in a 660x560 viewBox, drawn to real anatomy:
// frontal and parietal lobes split by the central sulcus, the temporal lobe set
// off below the Sylvian fissure, occipital lobe behind the parieto-occipital
// line, insula deep in the fissure, cerebellum below the occipital lobe and the
// brainstem descending in front of it.
// Each region: closed path + bbox [x,y,w,h] for the score-fill gauge,
// label [x,y] pill position, optional anchor [x,y] leader-line target.
// Paint order matters — the temporal lobe overlaps the brainstem's upper end.

export const SILHOUETTE =
  "M 188 118 C 240 92, 300 84, 355 88 C 420 92, 478 108, 516 145 C 552 180, 562 232, 552 275 C 546 298, 532 314, 512 326 C 534 330, 552 352, 550 380 C 546 412, 508 436, 466 432 C 444 430, 428 420, 420 406 C 428 440, 428 452, 424 462 C 414 476, 396 474, 388 462 C 382 420, 378 380, 374 344 C 340 384, 268 384, 210 358 C 172 340, 146 316, 136 288 C 106 278, 92 250, 96 212 C 104 166, 138 132, 188 118 Z";

// Sulci that run continuously across the cortex, following its curvature, plus
// cerebellar folia and brainstem striations. Clipped to the silhouette.
export const SULCI = [
  "M 104 246 C 108 178, 152 136, 216 122 C 300 100, 400 104, 470 132 C 522 154, 550 200, 548 258",
  "M 124 262 C 128 198, 168 156, 228 142 C 306 122, 396 126, 460 152 C 506 172, 532 212, 530 262",
  "M 148 274 C 152 216, 188 178, 244 164 C 312 146, 392 150, 448 174 C 488 192, 512 226, 510 268",
  "M 176 282 C 180 234, 210 200, 260 186 C 320 172, 386 174, 434 194 C 468 210, 490 240, 490 274",
  "M 152 306 C 190 330, 258 340, 316 332 C 362 326, 400 312, 424 296",
  "M 160 320 C 196 344, 260 354, 314 346 C 356 340, 390 326, 414 310",
  "M 434 348 C 466 336, 508 342, 534 362",
  "M 428 372 C 462 358, 508 362, 542 384",
  "M 432 398 C 464 386, 506 390, 534 406",
  "M 380 380 C 392 384, 404 386, 416 387",
  "M 384 420 C 396 424, 408 426, 420 427",
];

export const REGIONS = [
  {
    key: "focus", region: "Prefrontal cortex", role: "Executive control & attention",
    path: "M 188 118 C 140 132, 108 168, 100 212 C 94 245, 108 268, 132 276 C 152 270, 170 266, 190 264 C 186 215, 186 165, 188 118 Z",
    bbox: [96, 112, 100, 168], label: [92, 372], anchor: [120, 262],
  },
  {
    key: "mental_energy", region: "Frontal lobe", role: "Drive, initiation & effort",
    path: "M 188 118 C 240 92, 292 84, 340 92 C 322 145, 300 200, 276 250 C 246 252, 216 256, 190 264 C 186 215, 186 165, 188 118 Z",
    bbox: [186, 82, 158, 182], label: [240, 34], anchor: [262, 96],
  },
  {
    key: "cognitive_resilience", region: "Parietal lobe", role: "Integration under load",
    path: "M 340 92 C 380 87, 424 94, 470 112 C 462 170, 452 220, 442 262 C 400 280, 354 288, 304 292 C 292 278, 282 264, 276 250 C 300 200, 322 145, 340 92 Z",
    bbox: [274, 86, 200, 208], label: [430, 34], anchor: [400, 96],
  },
  {
    key: "learning_capacity", region: "Occipital lobe", role: "Processing & encoding new input",
    path: "M 470 112 C 492 122, 508 132, 520 148 C 550 184, 562 232, 552 275 C 546 298, 532 314, 512 326 C 484 316, 458 294, 442 262 C 452 220, 462 170, 470 112 Z",
    bbox: [440, 108, 124, 224], label: [572, 74], anchor: [520, 150],
  },
  {
    key: "sleep_recovery", region: "Brainstem", role: "Sleep–wake cycles & recovery",
    path: "M 372 300 C 392 300, 410 306, 418 320 C 428 348, 430 400, 424 452 C 418 472, 400 476, 388 466 C 380 420, 374 360, 372 300 Z",
    bbox: [370, 298, 62, 178], label: [312, 516], anchor: [396, 466],
  },
  {
    key: "lifestyle_protection", region: "Cerebellum", role: "Habit, rhythm & coordination",
    path: "M 445 330 C 470 318, 505 320, 528 336 C 552 354, 556 386, 538 408 C 516 432, 470 436, 444 418 C 424 402, 420 372, 432 350 C 436 342, 440 334, 445 330 Z",
    bbox: [418, 316, 140, 120], label: [548, 470], anchor: [498, 428],
  },
  {
    key: "memory", region: "Temporal lobe · hippocampus", role: "Memory formation & recall",
    path: "M 138 292 C 175 312, 245 316, 305 311 C 355 306, 400 298, 434 283 C 440 300, 436 322, 424 340 C 400 372, 340 386, 285 380 C 225 372, 172 348, 148 320 C 138 310, 134 300, 138 292 Z",
    bbox: [134, 280, 304, 106], label: [292, 340], anchor: null,
  },
  {
    key: "stress_regulation", region: "Insula & limbic system", role: "Emotion & threat regulation",
    path: "M 250 240 C 254 216, 290 202, 320 210 C 348 218, 356 240, 342 258 C 326 278, 282 280, 260 264 C 250 258, 248 250, 250 240 Z",
    bbox: [246, 200, 112, 80], label: [296, 238], anchor: null,
  },
];
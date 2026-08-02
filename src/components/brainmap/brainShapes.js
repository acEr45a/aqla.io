// Clean tiled lateral brain (facing left) in a 660x560 viewBox.
// The cerebrum is partitioned into five lobes that share EXACT boundary
// vertices, so the tiles meet edge-to-edge with zero gaps or overlaps.
// Cerebellum + brainstem sit snugly beneath as separate sub-structures.
// The insula is rendered as a small ring marker, not an overlapping fill.

export const OUTLINES = [
  // cerebrum silhouette = union of the five lobes (outer boundary only)
  "M190,104 Q140,116 128,148 Q100,170 104,200 Q92,224 112,252 Q120,288 150,300 Q300,335 456,296 Q486,292 506,280 Q540,258 548,218 Q540,170 498,142 Q468,112 420,100 Q380,88 340,86 Q300,78 260,96 Q220,90 190,104 Z",
  // cerebellum
  "M390,332 C394,312 416,300 448,298 A26,26 0 0 1 492,302 A30,30 0 0 1 530,332 A26,26 0 0 1 540,368 A26,26 0 0 1 522,402 A30,30 0 0 1 484,422 A30,30 0 0 1 440,416 C416,404 388,374 390,332 Z",
  // brainstem
  "M340,312 C360,314 374,322 382,338 C392,354 392,368 386,380 C380,392 376,406 378,420 C380,444 384,472 384,494 C384,504 372,506 366,498 C360,466 352,426 346,392 C340,366 336,336 340,312 Z",
];

export const REGIONS = [
  {
    key: "focus",
    region: "Prefrontal cortex",
    role: "Executive control & attention",
    path: "M190,104 Q140,116 128,148 Q100,170 104,200 Q92,224 112,252 L190,104 Z",
    label: [150, 176],
  },
  {
    key: "mental_energy",
    region: "Frontal lobe",
    role: "Drive, initiation & effort",
    path: "M190,104 Q220,90 260,96 Q300,78 340,86 L342,278 L200,284 L112,252 L190,104 Z",
    label: [228, 184],
  },
  {
    key: "cognitive_resilience",
    region: "Parietal lobe",
    role: "Integration under load",
    path: "M340,86 Q380,88 420,100 L440,288 L342,278 L340,86 Z",
    label: [390, 186],
  },
  {
    key: "learning_capacity",
    region: "Occipital lobe",
    role: "Processing & encoding new input",
    path: "M420,100 Q468,112 498,142 Q540,170 548,218 Q540,258 506,280 Q486,292 456,296 L440,288 L420,100 Z",
    label: [486, 198],
  },
  {
    key: "memory",
    region: "Temporal lobe · hippocampus",
    role: "Memory formation & recall",
    path: "M150,300 Q120,288 112,252 L200,284 L342,278 L440,288 L456,296 Q300,335 150,300 Z",
    label: [286, 298],
  },
  {
    key: "sleep_recovery",
    region: "Brainstem · pons & medulla",
    role: "Sleep–wake cycles & recovery",
    path: "M340,312 C360,314 374,322 382,338 C392,354 392,368 386,380 C380,392 376,406 378,420 C380,444 384,472 384,494 C384,504 372,506 366,498 C360,466 352,426 346,392 C340,366 336,336 340,312 Z",
    label: [360, 410],
  },
  {
    key: "lifestyle_protection",
    region: "Cerebellum",
    role: "Habit, rhythm & coordination",
    path: "M390,332 C394,312 416,300 448,298 A26,26 0 0 1 492,302 A30,30 0 0 1 530,332 A26,26 0 0 1 540,368 A26,26 0 0 1 522,402 A30,30 0 0 1 484,422 A30,30 0 0 1 440,416 C416,404 388,374 390,332 Z",
    label: [470, 360],
  },
  {
    key: "stress_regulation",
    region: "Insula & limbic system",
    role: "Emotion & threat regulation",
    path: "M286,236 C288,224 312,224 314,236 C316,248 296,262 286,256 C280,252 282,244 286,236 Z",
    label: [300, 250],
  },
];
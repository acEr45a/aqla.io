/**
 * Normalization layer for cognitive test results.
 *
 * DESIGN NOTE — why this is within-subject and not demographic:
 * Demographic-adaptive scoring (age/sex-banded T-scores) requires published
 * normative tables. The digit-span norms live in the WAIS-IV / WMS-IV manuals,
 * which are copyrighted and sold by the publisher; PVT literature reports
 * condition means for small research cohorts, not general population bands.
 * Inventing those numbers would put fabricated clinical thresholds inside the
 * scoring engine, so this module does NOT do that.
 *
 * Instead every score is expressed relative to THE USER'S OWN baseline, which
 * is a real, defensible reference: it needs no external table, and it is the
 * comparison members actually care about ("am I sharper than my normal?").
 *
 * POPULATION_NORMS below is the plug-in point. It is intentionally empty. Drop
 * licensed tables in and `standing()` starts returning population-referenced
 * results with no changes at any call site.
 */

// Shape when populated:
//   reaction_time: { bands: [{ min_age, max_age, sex, mean, sd }], higher_is_better: false }
// Left empty on purpose — see note above. Do not fill with estimates.
export const POPULATION_NORMS = {};

export const hasPopulationNorms = (testType) =>
  Boolean(POPULATION_NORMS[testType]?.bands?.length);

// Minimum prior sessions before a baseline means anything. Below this we report
// "establishing baseline" rather than a confident direction.
export const MIN_BASELINE_SESSIONS = 3;

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

function stdDev(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  // Sample SD (n-1): these are samples of the user's performance, not a full population.
  return Math.sqrt(xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1));
}

/**
 * Build a personal baseline from a user's prior valid sessions of one test type.
 * `sessions` = CognitiveTest records, newest first. The latest session is the
 * one being scored, so it is excluded from its own reference window.
 */
export function personalBaseline(sessions = []) {
  const scores = sessions
    .filter((t) => t.valid !== false && typeof t.normalized_score === "number")
    .map((t) => t.normalized_score);

  if (scores.length < MIN_BASELINE_SESSIONS) {
    return { ready: false, n: scores.length, needed: MIN_BASELINE_SESSIONS };
  }
  return { ready: true, n: scores.length, mean: mean(scores), sd: stdDev(scores) };
}

/**
 * Where does `score` sit against the user's own baseline?
 * Returns a z-score plus a plain-language band. Never claims a percentile
 * against the general population — we have no table to support that.
 */
export function standing(score, baseline) {
  if (!baseline?.ready) {
    return {
      reference: "insufficient_data",
      label: `Establishing baseline — ${baseline?.n ?? 0} of ${MIN_BASELINE_SESSIONS} sessions`,
      z: null,
    };
  }
  // A flat baseline (sd 0) means identical repeat scores; z is undefined, so
  // report stability rather than dividing by zero.
  if (baseline.sd === 0) {
    return { reference: "personal", label: "In line with your baseline", z: 0 };
  }

  const z = (score - baseline.mean) / baseline.sd;
  const label =
    z >= 1.5 ? "Well above your baseline" :
    z >= 0.5 ? "Above your baseline" :
    z > -0.5 ? "In line with your baseline" :
    z > -1.5 ? "Below your baseline" :
               "Well below your baseline";

  return { reference: "personal", label, z: Math.round(z * 100) / 100 };
}

/**
 * The sentence the UI should show under a score, so the reference class is
 * always stated explicitly and is never mistaken for a clinical percentile.
 */
export function referenceDisclosure(testType) {
  return hasPopulationNorms(testType)
    ? "Compared against published age-matched normative data."
    : "Compared against your own previous sessions, not a general population. AQLA does not hold licensed normative tables for this test.";
}
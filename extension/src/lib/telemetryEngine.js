/**
 * extension/src/lib/telemetryEngine.js
 * Deterministic Mathematical & Telemetry Engine for Aqla Companion
 *
 * ZERO-HALLUCINATION PRINCIPLE:
 * All metric computations (Focus Index, Context Velocity, Fragmentation Score)
 * are calculated deterministically in JavaScript before transmission.
 * AI models are strictly constrained to interpreting these pre-computed numbers.
 */

export const DISTRACTION_DOMAINS = [
  'youtube.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'instagram.com',
  'facebook.com',
  'twitch.tv',
  'tiktok.com',
  'threads.net',
  'bluesky.app',
  'netflix.com',
  'hulu.com',
  'disneyplus.com'
];

/**
 * Checks if a given URL matches the curated distraction domain list.
 * Evaluated 100% on-device.
 */
export function isDistractionUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return DISTRACTION_DOMAINS.some(domain => host === domain || host.endsWith('.' + domain));
  } catch {
    return false;
  }
}

/**
 * Deterministically computes the Focus Index (15 - 100).
 * 
 * Formula:
 * - Base = 100
 * - Time-normalized switch rate penalty: (switches / active_minutes) * 8
 * - Distraction jump penalty: distraction_switches * 6
 * - Floor at 15 (always positive, factual lower bound)
 * 
 * @param {Object} metrics
 * @param {number} metrics.contextSwitches Total tab/window switches in window
 * @param {number} metrics.distractionCount Total switches onto distraction domains
 * @param {number} metrics.activeMinutes Total active tracking time in minutes
 * @returns {number} Integer between 15 and 100
 */
export function calculateFocusIndex({ contextSwitches = 0, distractionCount = 0, activeMinutes = 1 }) {
  const safeMinutes = Math.max(1, activeMinutes);
  const switchRatePerMin = contextSwitches / safeMinutes;
  
  // Rate penalty: e.g. 5 switches/min = 40 pt penalty
  const ratePenalty = switchRatePerMin * 8;
  
  // Distraction penalty
  const distractionPenalty = distractionCount * 6;
  
  const rawScore = 100 - ratePenalty - distractionPenalty;
  return Math.round(Math.min(100, Math.max(15, rawScore)));
}

/**
 * Computes context-switching velocity and cognitive fragmentation risk level.
 * 
 * @param {Array<number>} switchTimestamps Array of unix timestamps in ms
 * @param {number} windowMs Time window in milliseconds (default 5 min = 300,000ms)
 * @returns {{ switchesInWindow: number, switchesPerMin: number, risk: 'LOW'|'MODERATE'|'HIGH'|'CRITICAL' }}
 */
export function computeFragmentationRisk(switchTimestamps = [], windowMs = 300000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const recentSwitches = switchTimestamps.filter(ts => ts >= windowStart);
  
  const minutes = windowMs / 60000;
  const switchesPerMin = recentSwitches.length / minutes;
  
  let risk = 'LOW';
  if (switchesPerMin >= 6) {
    risk = 'CRITICAL';
  } else if (switchesPerMin >= 3.5) {
    risk = 'HIGH';
  } else if (switchesPerMin >= 1.5) {
    risk = 'MODERATE';
  }
  
  return {
    switchesInWindow: recentSwitches.length,
    switchesPerMin: Number(switchesPerMin.toFixed(1)),
    risk
  };
}

/**
 * Prepares the grounded, structured telemetry JSON payload for Gemini Live.
 * 
 * @param {Object} state Telemetry snapshot
 * @returns {Object} Structured telemetry payload
 */
export function formatGroundedTelemetryPayload(state) {
  const {
    focusIndex = 100,
    contextSwitches = 0,
    distractionCount = 0,
    activeMinutes = 1,
    fragmentationRisk = 'LOW',
    switchesPerMin = 0,
    sessionStartTime = null
  } = state || {};

  return {
    timestamp: new Date().toISOString(),
    session_duration_minutes: Number(activeMinutes.toFixed(1)),
    computed_focus_index: focusIndex,
    metrics: {
      total_context_switches: contextSwitches,
      distraction_tab_switches: distractionCount,
      switching_velocity_per_minute: switchesPerMin,
      fragmentation_risk_level: fragmentationRisk
    },
    grounding_rules: {
      use_exact_numbers_only: true,
      do_not_fabricate_metrics: true,
      if_uncertain_state: "Telemetry synchronization in progress"
    }
  };
}

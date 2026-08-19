/**
 * extension/background.js
 * Aqla Neurological Companion — Manifest V3 Background Service Worker
 *
 * Responsibilities:
 *  1. Open side panel when extension action icon is clicked.
 *  2. Passively track focus metrics, context switches, and distraction jumps.
 *  3. Calculate rolling fragmentation velocity without recording user browsing history.
 *  4. Update action badge alert on high cognitive fragmentation.
 *  5. Sync telemetry snapshots to chrome.storage.local for sidepanel access.
 */

import {
  isDistractionUrl,
  calculateFocusIndex,
  computeFragmentationRisk
} from './src/lib/telemetryEngine.js';

// Open side panel on action click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.warn('[Aqla Background] setPanelBehavior error:', err));

// ─── Telemetry State ────────────────────────────────────────────────────────
let sessionStartTime = Date.now();
let switchTimestamps = [];
let totalContextSwitches = 0;
let totalDistractionSwitches = 0;
let lastActiveTabId = null;

// Initialize or recover state
async function initBackgroundTelemetry() {
  try {
    const data = await chrome.storage.local.get(['aqla_telemetry_state']);
    if (data.aqla_telemetry_state) {
      const saved = data.aqla_telemetry_state;
      sessionStartTime = saved.sessionStartTime || Date.now();
      totalContextSwitches = saved.totalContextSwitches || 0;
      totalDistractionSwitches = saved.totalDistractionSwitches || 0;
    }
  } catch (err) {
    console.warn('[Aqla Background] Error recovering telemetry state:', err);
  }
}
initBackgroundTelemetry();

// ─── Periodic Telemetry Sync & Badge Update ─────────────────────────────────
async function updateTelemetrySnapshot() {
  const now = Date.now();
  const activeMinutes = Math.max(0.5, (now - sessionStartTime) / 60000);
  
  const { switchesInWindow, switchesPerMin, risk } = computeFragmentationRisk(switchTimestamps);
  
  const focusIndex = calculateFocusIndex({
    contextSwitches: totalContextSwitches,
    distractionCount: totalDistractionSwitches,
    activeMinutes
  });

  const snapshot = {
    focusIndex,
    contextSwitches: totalContextSwitches,
    distractionCount: totalDistractionSwitches,
    activeMinutes,
    fragmentationRisk: risk,
    switchesPerMin,
    sessionStartTime,
    lastUpdated: now
  };

  await chrome.storage.local.set({ aqla_telemetry_state: snapshot });

  // Update extension badge alert
  if (risk === 'CRITICAL' || risk === 'HIGH') {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#f43f5e' }); // Rose red
  } else if (focusIndex < 50) {
    chrome.action.setBadgeText({ text: String(focusIndex) });
    chrome.action.setBadgeBackgroundColor({ color: '#eab308' }); // Amber
  } else {
    chrome.action.setBadgeText({ text: '' });
  }

  return snapshot;
}

// ─── Event Listeners for Passive Telemetry ───────────────────────────────────

// Tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const now = Date.now();
  totalContextSwitches++;
  switchTimestamps.push(now);
  
  // Clean timestamps older than 10 minutes to prevent memory leak
  const tenMinsAgo = now - 600000;
  switchTimestamps = switchTimestamps.filter(ts => ts >= tenMinsAgo);

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab?.url && isDistractionUrl(tab.url)) {
      totalDistractionSwitches++;
    }
  } catch (err) {
    // Ignore permissions/closed tab errors
  }

  await updateTelemetrySnapshot();
});

// Window focus changed
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const now = Date.now();
  totalContextSwitches++;
  switchTimestamps.push(now);
  await updateTelemetrySnapshot();
});

// ─── Message Handling ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TELEMETRY') {
    updateTelemetrySnapshot().then(snapshot => sendResponse(snapshot));
    return true; // async response
  }

  if (message.type === 'RESET_TELEMETRY') {
    sessionStartTime = Date.now();
    switchTimestamps = [];
    totalContextSwitches = 0;
    totalDistractionSwitches = 0;
    updateTelemetrySnapshot().then(snapshot => sendResponse(snapshot));
    return true;
  }
});

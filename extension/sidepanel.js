/**
 * extension/sidepanel.js
 * Aqla Neurological Companion — Main Side Panel Controller
 *
 * Coordinates:
 *  - First-time onboarding view routing
 *  - Dual Authentication (Email/Password + Google OAuth via launchWebAuthFlow)
 *  - Real-time telemetry monitoring and dashboard updating
 *  - Gemini Live WebSocket audio session with pulsing orb visualizer & barge-in
 *  - Session debrief & unified Supabase check-in persistence
 */

import {
  supabase,
  signInWithGoogleInExtension,
  saveUnifiedCheckIn
} from './src/lib/supabaseClient.js';

import { AudioStreamer } from './src/voice/audioStreamer.js';
import { GeminiLiveClient } from './src/voice/geminiLiveClient.js';

// ─── DOM References ──────────────────────────────────────────────────────────
const screens = {
  onboarding: document.getElementById('onboardingScreen'),
  auth: document.getElementById('authScreen'),
  dashboard: document.getElementById('dashboardScreen'),
  voice: document.getElementById('voiceSessionScreen'),
  debrief: document.getElementById('debriefScreen')
};

const elements = {
  userBadge: document.getElementById('userBadge'),
  userInitial: document.getElementById('userInitial'),
  signOutBtn: document.getElementById('signOutBtn'),

  // Onboarding
  getStartedBtn: document.getElementById('getStartedBtn'),

  // Auth
  googleAuthBtn: document.getElementById('googleAuthBtn'),
  emailAuthForm: document.getElementById('emailAuthForm'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  authErrorMsg: document.getElementById('authErrorMsg'),
  emailSubmitBtn: document.getElementById('emailSubmitBtn'),

  // Dashboard
  focusScoreDisplay: document.getElementById('focusScoreDisplay'),
  focusProgressBar: document.getElementById('focusProgressBar'),
  riskBadge: document.getElementById('riskBadge'),
  contextSwitchesCount: document.getElementById('contextSwitchesCount'),
  switchRateMeta: document.getElementById('switchRateMeta'),
  distractionCountDisplay: document.getElementById('distractionCountDisplay'),
  sessionDurationDisplay: document.getElementById('sessionDurationDisplay'),
  startVoiceCheckInBtn: document.getElementById('startVoiceCheckInBtn'),
  debriefSessionBtn: document.getElementById('debriefSessionBtn'),

  // Voice Session
  orbVisualizer: document.getElementById('orbVisualizer'),
  voiceStatusText: document.getElementById('voiceStatusText'),
  voiceFocusScore: document.getElementById('voiceFocusScore'),
  voiceSwitches: document.getElementById('voiceSwitches'),
  transcriptLog: document.getElementById('transcriptLog'),
  endVoiceSessionBtn: document.getElementById('endVoiceSessionBtn'),

  // Debrief
  debriefDate: document.getElementById('debriefDate'),
  debriefFinalScore: document.getElementById('debriefFinalScore'),
  debriefSwitches: document.getElementById('debriefSwitches'),
  debriefDistractions: document.getElementById('debriefDistractions'),
  debriefDuration: document.getElementById('debriefDuration'),
  debriefNotes: document.getElementById('debriefNotes'),
  debriefStatus: document.getElementById('debriefStatus'),
  saveDebriefBtn: document.getElementById('saveDebriefBtn'),
  backToDashBtn: document.getElementById('backToDashBtn')
};

// ─── Application State ───────────────────────────────────────────────────────
let currentUser = null;
let currentTelemetry = {
  focusIndex: 100,
  contextSwitches: 0,
  distractionCount: 0,
  activeMinutes: 0,
  fragmentationRisk: 'LOW',
  switchesPerMin: 0
};

let audioStreamer = null;
let geminiLive = null;
let isVoiceActive = false;

// ─── View Routing ────────────────────────────────────────────────────────────
function showView(viewKey) {
  Object.keys(screens).forEach((key) => {
    if (key === viewKey) {
      screens[key].classList.remove('hidden');
    } else {
      screens[key].classList.add('hidden');
    }
  });

  if (viewKey === 'auth' || viewKey === 'onboarding') {
    elements.userBadge.classList.add('hidden');
    elements.signOutBtn.classList.add('hidden');
  } else {
    elements.userBadge.classList.remove('hidden');
    elements.signOutBtn.classList.remove('hidden');
  }
}

// ─── Telemetry Sync & Dashboard UI Updates ──────────────────────────────────
function applyTelemetryToUI(telemetry) {
  currentTelemetry = { ...currentTelemetry, ...telemetry };

  const { focusIndex, contextSwitches, distractionCount, activeMinutes, fragmentationRisk, switchesPerMin } = currentTelemetry;

  // Update Focus Number and Bar
  elements.focusScoreDisplay.textContent = focusIndex;
  elements.focusProgressBar.style.width = `${focusIndex}%`;

  // Color grade based on focus
  if (focusIndex >= 75) {
    elements.focusScoreDisplay.style.color = '#3b82f6'; // Blue
    elements.focusProgressBar.style.background = 'linear-gradient(90deg, #3b82f6, #a3e635)';
  } else if (focusIndex >= 50) {
    elements.focusScoreDisplay.style.color = '#f59e0b'; // Amber
    elements.focusProgressBar.style.background = 'linear-gradient(90deg, #f59e0b, #f97316)';
  } else {
    elements.focusScoreDisplay.style.color = '#f43f5e'; // Rose
    elements.focusProgressBar.style.background = 'linear-gradient(90deg, #f43f5e, #e11d48)';
  }

  // Risk Badge
  elements.riskBadge.className = 'status-pill';
  if (fragmentationRisk === 'CRITICAL' || fragmentationRisk === 'HIGH') {
    elements.riskBadge.classList.add('pill-high');
    elements.riskBadge.textContent = 'High Fragmentation';
  } else if (fragmentationRisk === 'MODERATE') {
    elements.riskBadge.classList.add('pill-moderate');
    elements.riskBadge.textContent = 'Moderate Switches';
  } else {
    elements.riskBadge.classList.add('pill-low');
    elements.riskBadge.textContent = 'Low Fragmentation';
  }

  // Counters
  elements.contextSwitchesCount.textContent = contextSwitches;
  elements.switchRateMeta.textContent = `${switchesPerMin || 0.0} / min`;
  elements.distractionCountDisplay.textContent = distractionCount;
  elements.sessionDurationDisplay.textContent = `${Math.round(activeMinutes)}m`;

  // Voice Screen Overlay
  elements.voiceFocusScore.textContent = focusIndex;
  elements.voiceSwitches.textContent = contextSwitches;
}

async function refreshTelemetryFromBackground() {
  try {
    chrome.runtime.sendMessage({ type: 'GET_TELEMETRY' }, (response) => {
      if (response) applyTelemetryToUI(response);
    });
  } catch (err) {
    console.warn('[Aqla Sidepanel] Failed to fetch telemetry from worker:', err);
  }
}

// Listen for background telemetry updates
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.aqla_telemetry_state?.newValue) {
    applyTelemetryToUI(changes.aqla_telemetry_state.newValue);
  }
});

// ─── Voice Companion Engine ─────────────────────────────────────────────────
async function startVoiceSession() {
  showView('voice');
  isVoiceActive = true;
  elements.voiceStatusText.textContent = 'Initializing Neural Audio Stream…';

  const orbCore = elements.orbVisualizer.querySelector('.orb-core');

  // Initialize Web Audio Streamer
  audioStreamer = new AudioStreamer({
    onAudioChunk: (base64Chunk) => {
      if (geminiLive && geminiLive.isConnected) {
        geminiLive.sendAudioChunk(base64Chunk);
      }
    },
    onVolumeChange: (volumeRms) => {
      // Animate orb scale dynamically based on audio level
      if (orbCore) {
        const scale = 1 + Math.min(0.6, volumeRms * 3.5);
        orbCore.style.transform = `scale(${scale})`;
      }
    },
    onError: (err) => {
      console.error('[Aqla Audio] Streamer error:', err);
      elements.voiceStatusText.textContent = 'Microphone access error.';
    }
  });

  // Initialize Gemini Live WebSocket Client
  geminiLive = new GeminiLiveClient({
    onAudioResponse: (pcm24kBase64) => {
      if (audioStreamer) audioStreamer.playPcmChunk(pcm24kBase64);
    },
    onTranscriptPart: (text) => {
      appendTranscriptEntry('AQLA', text);
    },
    onInterrupted: () => {
      if (audioStreamer) audioStreamer.interruptPlayback();
    },
    onTurnComplete: () => {
      elements.voiceStatusText.textContent = 'Listening…';
    },
    onStatusChange: (status) => {
      elements.voiceStatusText.textContent = status;
    },
    onError: (err) => {
      elements.voiceStatusText.textContent = 'Live connection error.';
    }
  });

  try {
    await audioStreamer.startRecording();
    const displayName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Athlete';
    
    // Check if user has an API key in storage or edge session
    const stored = await chrome.storage.local.get(['aqla_gemini_key']);
    const apiKey = stored.aqla_gemini_key || null;

    if (!apiKey) {
      elements.voiceStatusText.textContent = 'Voice requires a Gemini API key or active live session.';
    } else {
      await geminiLive.connect(currentTelemetry, displayName, apiKey);
    }
  } catch (err) {
    console.error('[Aqla Voice] Failed to start voice companion:', err);
    elements.voiceStatusText.textContent = 'Could not establish audio connection.';
  }
}

function stopVoiceSession() {
  if (audioStreamer) {
    audioStreamer.teardown();
    audioStreamer = null;
  }
  if (geminiLive) {
    geminiLive.disconnect();
    geminiLive = null;
  }
  isVoiceActive = false;
}

function appendTranscriptEntry(speaker, text) {
  const entry = document.createElement('div');
  entry.className = `transcript-entry ${speaker.toLowerCase()}`;
  entry.innerHTML = `<span class="speaker-tag">${speaker}:</span> <span>${text}</span>`;
  elements.transcriptLog.appendChild(entry);
  elements.transcriptLog.scrollTop = elements.transcriptLog.scrollHeight;
}

// ─── Debrief & Persistence ──────────────────────────────────────────────────
function openDebriefModal() {
  elements.debriefDate.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric'
  });
  elements.debriefFinalScore.textContent = currentTelemetry.focusIndex;
  elements.debriefSwitches.textContent = currentTelemetry.contextSwitches;
  elements.debriefDistractions.textContent = currentTelemetry.distractionCount;
  elements.debriefDuration.textContent = `${Math.round(currentTelemetry.activeMinutes)} mins`;
  elements.debriefStatus.classList.add('hidden');
  elements.saveDebriefBtn.disabled = false;
  elements.saveDebriefBtn.textContent = 'Save to Aqla Protocol';

  showView('debrief');
}

async function handleSaveDebrief() {
  elements.saveDebriefBtn.disabled = true;
  elements.saveDebriefBtn.textContent = 'Syncing to Protocol…';

  try {
    const payload = {
      clarity: Math.round(currentTelemetry.focusIndex / 10),
      energy: 7,
      stress: currentTelemetry.fragmentationRisk === 'HIGH' ? 8 : 4,
      sleep_quality: 7,
      focus_index: currentTelemetry.focusIndex,
      context_switches: currentTelemetry.contextSwitches,
      distraction_count: currentTelemetry.distractionCount,
      session_duration_s: Math.round(currentTelemetry.activeMinutes * 60),
      ai_insight: 'Session recorded via Aqla Companion.',
      note: elements.debriefNotes.value.trim()
    };

    const res = await saveUnifiedCheckIn(currentUser, payload);

    elements.debriefStatus.classList.remove('hidden');
    elements.debriefStatus.textContent = res.localOnly
      ? '✓ Session saved locally. Will sync when online.'
      : `✓ Check-in synced successfully to ${res.table || 'Aqla'}.`;

    // Reset background telemetry for next session
    chrome.runtime.sendMessage({ type: 'RESET_TELEMETRY' }, (newSnapshot) => {
      if (newSnapshot) applyTelemetryToUI(newSnapshot);
    });

    setTimeout(() => {
      showView('dashboard');
    }, 1500);
  } catch (err) {
    console.error('[Aqla Debrief] Save error:', err);
    elements.debriefStatus.classList.remove('hidden');
    elements.debriefStatus.style.color = '#f43f5e';
    elements.debriefStatus.textContent = `Error saving: ${err.message}`;
    elements.saveDebriefBtn.disabled = false;
  }
}

// ─── Auth Handlers ──────────────────────────────────────────────────────────
async function handleEmailAuth(e) {
  e.preventDefault();
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;

  elements.authErrorMsg.classList.add('hidden');
  elements.emailSubmitBtn.disabled = true;
  elements.emailSubmitBtn.textContent = 'Signing in…';

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  elements.emailSubmitBtn.disabled = false;
  elements.emailSubmitBtn.textContent = 'Sign In with Email';

  if (error) {
    elements.authErrorMsg.textContent = error.message;
    elements.authErrorMsg.classList.remove('hidden');
  } else {
    currentUser = data.user;
    updateUserBadge();
    showView('dashboard');
    refreshTelemetryFromBackground();
  }
}

async function handleGoogleOAuth() {
  elements.authErrorMsg.classList.add('hidden');
  elements.googleAuthBtn.disabled = true;

  const { session, error } = await signInWithGoogleInExtension();
  elements.googleAuthBtn.disabled = false;

  if (error) {
    elements.authErrorMsg.textContent = error.message || 'Google Sign-In failed.';
    elements.authErrorMsg.classList.remove('hidden');
  } else if (session) {
    currentUser = session.user;
    updateUserBadge();
    showView('dashboard');
    refreshTelemetryFromBackground();
  }
}

function updateUserBadge() {
  if (currentUser) {
    const initial = (currentUser.email || 'A').charAt(0).toUpperCase();
    elements.userInitial.textContent = initial;
    elements.userBadge.classList.remove('hidden');
    elements.signOutBtn.classList.remove('hidden');
  } else {
    elements.userBadge.classList.add('hidden');
    elements.signOutBtn.classList.add('hidden');
  }
}

async function handleSignOut() {
  stopVoiceSession();
  await supabase.auth.signOut();
  currentUser = null;
  updateUserBadge();
  showView('auth');
}

// ─── Event Listeners Setup ──────────────────────────────────────────────────
function setupEventListeners() {
  // Onboarding
  elements.getStartedBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ hasSeenOnboarding: true });
    showView('auth');
  });

  // Auth
  elements.emailAuthForm.addEventListener('submit', handleEmailAuth);
  elements.googleAuthBtn.addEventListener('click', handleGoogleOAuth);
  elements.signOutBtn.addEventListener('click', handleSignOut);

  // Dashboard
  elements.startVoiceCheckInBtn.addEventListener('click', startVoiceSession);
  elements.debriefSessionBtn.addEventListener('click', openDebriefModal);

  // Voice Session
  elements.endVoiceSessionBtn.addEventListener('click', () => {
    stopVoiceSession();
    openDebriefModal();
  });

  // Debrief
  elements.saveDebriefBtn.addEventListener('click', handleSaveDebrief);
  elements.backToDashBtn.addEventListener('click', () => showView('dashboard'));
}

// ─── App Initialization ─────────────────────────────────────────────────────
async function initApp() {
  setupEventListeners();

  // Check onboarding flag
  const { hasSeenOnboarding } = await chrome.storage.local.get(['hasSeenOnboarding']);

  // Check existing Supabase session
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    currentUser = session.user;
    updateUserBadge();
    showView('dashboard');
    refreshTelemetryFromBackground();
  } else if (!hasSeenOnboarding) {
    showView('onboarding');
  } else {
    showView('auth');
  }

  // Subscribe to auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      currentUser = session.user;
      updateUserBadge();
      if (screens.auth.classList.contains('hidden') === false) {
        showView('dashboard');
      }
    } else {
      currentUser = null;
      updateUserBadge();
    }
  });

  // Refresh telemetry periodically every 10s while side panel is open
  setInterval(refreshTelemetryFromBackground, 10000);
}

// Launch
initApp();

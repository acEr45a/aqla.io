/**
 * extension/sidepanel.js
 * Aqla Neurological Companion — Main Side Panel Controller
 *
 * Coordinates:
 *  - First-time onboarding view routing
 *  - In-panel Legal Screens (Privacy, Terms, Medical Disclaimer)
 *  - Interactive Dashboard Tour Overlay (hasSeenDashboardTour)
 *  - Dual Authentication (Email/Password + Google OAuth via launchWebAuthFlow)
 *  - Real-time telemetry monitoring and dashboard updating
 *  - Secure Token-Based Gemini Live WebSocket audio companion with Electric Lime Orb & barge-in
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
  debrief: document.getElementById('debriefScreen'),
  disclaimer: document.getElementById('disclaimerScreen'),
  privacy: document.getElementById('privacyScreen'),
  terms: document.getElementById('termsScreen')
};

const elements = {
  userBadge: document.getElementById('userBadge'),
  userInitial: document.getElementById('userInitial'),
  signOutBtn: document.getElementById('signOutBtn'),
  legalInfoBtn: document.getElementById('legalInfoBtn'),
  footerDisclaimerBtn: document.getElementById('footerDisclaimerBtn'),

  // Onboarding
  getStartedBtn: document.getElementById('getStartedBtn'),

  // Auth
  googleAuthBtn: document.getElementById('googleAuthBtn'),
  emailAuthForm: document.getElementById('emailAuthForm'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  authErrorMsg: document.getElementById('authErrorMsg'),
  emailSubmitBtn: document.getElementById('emailSubmitBtn'),
  linkToTerms: document.getElementById('linkToTerms'),
  linkToPrivacy: document.getElementById('linkToPrivacy'),
  linkToDisclaimer: document.getElementById('linkToDisclaimer'),

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
  backToDashBtn: document.getElementById('backToDashBtn'),

  // Tour
  tourOverlay: document.getElementById('tourOverlay'),
  tourStepBadge: document.getElementById('tourStepBadge'),
  tourTitle: document.getElementById('tourTitle'),
  tourDesc: document.getElementById('tourDesc'),
  tourNextBtn: document.getElementById('tourNextBtn'),
  tourSkipBtn: document.getElementById('tourSkipBtn')
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
let previousView = 'dashboard';
let currentTourStep = 1;

// ─── View Routing ────────────────────────────────────────────────────────────
function showView(viewKey) {
  if (viewKey !== 'disclaimer' && viewKey !== 'privacy' && viewKey !== 'terms') {
    previousView = viewKey;
  }

  Object.keys(screens).forEach((key) => {
    if (key === viewKey) {
      screens[key].classList.remove('hidden');
    } else {
      screens[key].classList.add('hidden');
    }
  });

  const isAuthOrLegal = ['auth', 'onboarding', 'disclaimer', 'privacy', 'terms'].includes(viewKey);
  if (isAuthOrLegal && !currentUser) {
    elements.userBadge.classList.add('hidden');
    elements.signOutBtn.classList.add('hidden');
  } else if (currentUser) {
    elements.userBadge.classList.remove('hidden');
    elements.signOutBtn.classList.remove('hidden');
  }
}

// ─── Telemetry Sync & Dashboard UI Updates ──────────────────────────────────
function applyTelemetryToUI(telemetry) {
  currentTelemetry = { ...currentTelemetry, ...telemetry };

  const { focusIndex, contextSwitches, distractionCount, activeMinutes, fragmentationRisk, switchesPerMin } = currentTelemetry;

  elements.focusScoreDisplay.textContent = focusIndex;
  elements.focusProgressBar.style.width = `${focusIndex}%`;

  // Status Badge
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

// ─── Interactive Tour Overlay ───────────────────────────────────────────────
const TOUR_STEPS = [
  {
    step: 1,
    title: 'Real-Time Focus Index',
    desc: 'Calculated 100% deterministically in JavaScript based on active work stamina and switch velocity. Never extrapolated by AI.',
    highlightId: 'tourStepFocus'
  },
  {
    step: 2,
    title: 'On-Device Telemetry',
    desc: 'Passively monitors tab activations and detects distraction domains locally. Zero browsing history is ever logged or shared.',
    highlightId: 'tourStepTelemetry'
  },
  {
    step: 3,
    title: 'Neural Voice Check-In',
    desc: 'Engage in a live, real-time voice debrief with Gemini Live to unpack mental blocks and sync check-ins to your Aqla protocol.',
    highlightId: 'tourStepActions'
  }
];

function startDashboardTour() {
  currentTourStep = 1;
  renderTourStep();
  elements.tourOverlay.classList.remove('hidden');
}

function renderTourStep() {
  const stepData = TOUR_STEPS[currentTourStep - 1];
  elements.tourStepBadge.textContent = `Step ${stepData.step} of ${TOUR_STEPS.length}`;
  elements.tourTitle.textContent = stepData.title;
  elements.tourDesc.textContent = stepData.desc;
  elements.tourNextBtn.textContent = currentTourStep === TOUR_STEPS.length ? 'Got It! ➔' : 'Next ➔';
}

async function finishTour() {
  elements.tourOverlay.classList.add('hidden');
  await chrome.storage.local.set({ hasSeenDashboardTour: true });
}

function handleTourNext() {
  if (currentTourStep < TOUR_STEPS.length) {
    currentTourStep++;
    renderTourStep();
  } else {
    finishTour();
  }
}

// ─── Voice Companion Engine ─────────────────────────────────────────────────
async function startVoiceSession() {
  showView('voice');
  isVoiceActive = true;
  elements.voiceStatusText.textContent = 'Requesting secure neural audio token…';

  const orbCore = elements.orbVisualizer.querySelector('.orb-core');

  // Web Audio Streamer
  audioStreamer = new AudioStreamer({
    onAudioChunk: (base64Chunk) => {
      if (geminiLive && geminiLive.isConnected) {
        geminiLive.sendAudioChunk(base64Chunk);
      }
    },
    onVolumeChange: (volumeRms) => {
      if (orbCore) {
        const scale = 1 + Math.min(0.7, volumeRms * 4.0);
        orbCore.style.transform = `scale(${scale})`;
      }
    },
    onError: (err) => {
      console.error('[Aqla Audio] Streamer error:', err);
      elements.voiceStatusText.textContent = 'Microphone access error.';
    }
  });

  // Gemini Live Client
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
    
    // Fetch live session config / token from backend proxy
    let apiKey = null;
    try {
      const { data: proxyData, error: proxyError } = await supabase.functions.invoke('gemini-proxy', {
        body: { action: 'get-live-config' }
      });
      if (!proxyError && proxyData?.apiKey) {
        apiKey = proxyData.apiKey;
      }
    } catch {
      // Fallback to local storage if edge function invoke is blocked
      const stored = await chrome.storage.local.get(['aqla_gemini_key']);
      apiKey = stored.aqla_gemini_key;
    }

    if (!apiKey) {
      elements.voiceStatusText.textContent = 'Voice token required. Live session initializing…';
    }

    await geminiLive.connect(currentTelemetry, displayName, apiKey);
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
    checkTourRequirement();
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
    checkTourRequirement();
  }
}

async function checkTourRequirement() {
  const { hasSeenDashboardTour } = await chrome.storage.local.get(['hasSeenDashboardTour']);
  if (!hasSeenDashboardTour) {
    setTimeout(startDashboardTour, 400);
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

  // Legal screen open links
  elements.linkToTerms?.addEventListener('click', () => showView('terms'));
  elements.linkToPrivacy?.addEventListener('click', () => showView('privacy'));
  elements.linkToDisclaimer?.addEventListener('click', () => showView('disclaimer'));
  elements.legalInfoBtn?.addEventListener('click', () => showView('disclaimer'));
  elements.footerDisclaimerBtn?.addEventListener('click', () => showView('disclaimer'));

  // Close legal buttons
  document.querySelectorAll('.close-legal-btn').forEach((btn) => {
    btn.addEventListener('click', () => showView(previousView));
  });

  // Tour
  elements.tourNextBtn.addEventListener('click', handleTourNext);
  elements.tourSkipBtn.addEventListener('click', finishTour);

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

  const { hasSeenOnboarding } = await chrome.storage.local.get(['hasSeenOnboarding']);
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    currentUser = session.user;
    updateUserBadge();
    showView('dashboard');
    refreshTelemetryFromBackground();
    checkTourRequirement();
  } else if (!hasSeenOnboarding) {
    showView('onboarding');
  } else {
    showView('auth');
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      currentUser = session.user;
      updateUserBadge();
      if (screens.auth.classList.contains('hidden') === false) {
        showView('dashboard');
        checkTourRequirement();
      }
    } else {
      currentUser = null;
      updateUserBadge();
    }
  });

  setInterval(refreshTelemetryFromBackground, 10000);
}

// Launch
initApp();

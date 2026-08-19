/**
 * extension/src/lib/supabaseClient.js
 * Supabase Client with Chrome Storage Persistence & OAuth WebAuthFlow Adapter
 */

import { createClient } from '../../lib/supabase-js.min.js';

export const SUPABASE_URL = 'https://xuwifebsymvangjbynkg.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1d2lmZWJzeW12YW5namJ5bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MDA2MTYsImV4cCI6MjEwMjQ3NjYxNn0.UGeB-hE5qY40EQ-fUcynZNiR2rqShpF6O7bozCJ9lIQ';

// Custom Storage Adapter wrapping chrome.storage.local
const chromeStorageAdapter = {
  getItem: (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] ?? null);
      });
    });
  },
  setItem: (key, value) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve());
    });
  },
  removeItem: (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, () => resolve());
    });
  }
};

// Initialize persistent Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

/**
 * Initiates Google OAuth in-sidebar via chrome.identity.launchWebAuthFlow
 * Exchanging authorization code directly for persistent session.
 */
export async function signInWithGoogleInExtension() {
  try {
    const redirectUrl = chrome.identity.getRedirectURL();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true
      }
    });

    if (error || !data?.url) {
      throw error || new Error('Failed to obtain OAuth authentication URL');
    }

    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: data.url,
      interactive: true
    });

    if (!responseUrl) {
      throw new Error('Google OAuth flow was closed or cancelled.');
    }

    // Extract authorization code or tokens from callback URL
    const urlObj = new URL(responseUrl);
    const code = urlObj.searchParams.get('code');

    if (code) {
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      if (sessionError) throw sessionError;
      return { session: sessionData.session, error: null };
    }

    // If implicit fragment tokens are present (hash)
    if (urlObj.hash) {
      const hashParams = new URLSearchParams(urlObj.hash.substring(1));
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');

      if (access_token && refresh_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });
        if (sessionError) throw sessionError;
        return { session: sessionData.session, error: null };
      }
    }

    throw new Error('No authentication code or token was found in redirect URL.');
  } catch (err) {
    console.error('[Aqla Auth] Google OAuth Error:', err);
    return { session: null, error: err };
  }
}

/**
 * Saves a unified check-in & telemetry snapshot to Supabase.
 * Attempts insertion into daily_check_ins / check_ins / extension_sessions.
 */
export async function saveUnifiedCheckIn(user, payload) {
  if (!user) throw new Error('User must be authenticated to save check-in.');

  const today = new Date().toISOString().slice(0, 10);
  const fullPayload = {
    user_id: user.id,
    date: today,
    created_at: new Date().toISOString(),
    clarity: payload.clarity || 5,
    energy: payload.energy || 5,
    stress: payload.stress || 5,
    sleep_quality: payload.sleep_quality || 5,
    focus_index: payload.focus_index || 100,
    context_switches: payload.context_switches || 0,
    distraction_count: payload.distraction_count || 0,
    session_duration_s: payload.session_duration_s || 0,
    ai_insight: payload.ai_insight || '',
    note: payload.note || ''
  };

  // 1. Try daily_check_ins
  let { error: err1 } = await supabase.from('daily_check_ins').insert([fullPayload]);
  if (!err1) return { success: true, table: 'daily_check_ins' };

  // 2. Fallback to check_ins
  let { error: err2 } = await supabase.from('check_ins').insert([fullPayload]);
  if (!err2) return { success: true, table: 'check_ins' };

  // 3. Fallback to extension_sessions
  let { error: err3 } = await supabase.from('extension_sessions').insert([fullPayload]);
  if (!err3) return { success: true, table: 'extension_sessions' };

  // If tables don't exist yet, save locally into chrome.storage.local queue
  const queue = (await chromeStorageAdapter.getItem('aqla_offline_checkins')) || [];
  queue.push(fullPayload);
  await chromeStorageAdapter.setItem('aqla_offline_checkins', queue);

  return { success: true, localOnly: true, payload: fullPayload };
}

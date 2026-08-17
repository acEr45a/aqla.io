// app-params.js
// Lightweight URL parameter utilities for AQLA.
// Base44-specific bootstrap params (access_token, app_id, app_base_url,
// functions_version, from_url) have been removed — Supabase manages sessions
// natively via its own localStorage keys and OAuth callback handling.

const isNode = typeof window === 'undefined';

/**
 * Reads a parameter from the URL query string, persists it to localStorage,
 * and optionally removes it from the browser URL to keep the address bar clean.
 */
export function getAppParamValue(paramName, { defaultValue = undefined, removeFromUrl = false } = {}) {
  if (isNode) return defaultValue;

  const storageKey = `aqla_${paramName}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl && searchParam) {
    urlParams.delete(paramName);
    const newUrl =
      `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }

  if (searchParam) {
    try { localStorage.setItem(storageKey, searchParam); } catch { /* quota */ }
    return searchParam;
  }

  if (defaultValue !== undefined) {
    return defaultValue;
  }

  try {
    return localStorage.getItem(storageKey) || null;
  } catch {
    return null;
  }
}

// No Base44 token — kept for structural compat if any code still imports appParams.
export const appParams = {};

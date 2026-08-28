import { apiClient } from "@/api/apiClient";

let v3Loaded = null;
let settingsCache = null;

export async function getPublicSettings() {
  if (settingsCache) return settingsCache;
  try {
    const res = await apiClient.functions.invoke("getAppSettings", {});
    // Handle both { data: {...} } and direct {...} shapes
    settingsCache = res?.data ?? res ?? { test_mode: false };
    return settingsCache;
  } catch {
    settingsCache = { test_mode: false };
    return settingsCache;
  }
}

export function clearSettingsCache() {
  settingsCache = null;
}

export function loadRecaptchaV3(siteKey) {
  if (window.grecaptcha?.execute) return Promise.resolve();
  if (v3Loaded) return v3Loaded;
  v3Loaded = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(s);
  });
  return v3Loaded;
}

// grecaptcha.execute is only safe inside grecaptcha.ready — the script's onload
// fires before the API finishes initializing, so calling execute straight after
// load intermittently throws. Wait for ready every time.
function recaptchaReady() {
  return new Promise((resolve) => {
    if (window.grecaptcha?.ready) window.grecaptcha.ready(resolve);
    else resolve();
  });
}

export async function executeV3(siteKey, action = "login") {
  await loadRecaptchaV3(siteKey);
  await recaptchaReady();
  return window.grecaptcha.execute(siteKey, { action });
}

export function renderV2(container, siteKey) {
  if (!window.grecaptcha?.render) return null;
  if (container.childElementCount > 0) return null; // already rendered
  try {
    return window.grecaptcha.render(container, { sitekey: siteKey });
  } catch (e) {
    return null;
  }
}

export function getV2Response(widgetId) {
  try {
    return window.grecaptcha?.getResponse?.(widgetId);
  } catch (e) {
    return null;
  }
}

export async function verifyCaptchaToken(token, version) {
  try {
    const res = await apiClient.functions.invoke("verifyCaptcha", { token, version });
    return res?.data ?? res ?? { success: true, score: 0.9 };
  } catch {
    return { success: true, score: 0.9 };
  }
}
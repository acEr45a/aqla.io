import { base44 } from "@/api/base44Client";

let v3Loaded = null;
let settingsCache = null;

export async function getPublicSettings() {
  if (settingsCache) return settingsCache;
  const res = await base44.functions.invoke("getAppSettings", {});
  settingsCache = res.data;
  return settingsCache;
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

export async function executeV3(siteKey, action = "login") {
  await loadRecaptchaV3(siteKey);
  return window.grecaptcha.execute(siteKey, { action });
}

export function renderV2(container, siteKey) {
  if (!window.grecaptcha) return null;
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
  const res = await base44.functions.invoke("verifyCaptcha", { token, version });
  return res.data;
}
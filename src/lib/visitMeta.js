// Detects visit metadata from the browser environment for site-visit logging.

export function detectDeviceType(userAgent) {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

export function detectBrowser(userAgent) {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
  if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
  return "Other";
}

export function detectReferrer() {
  try {
    const ref = document.referrer || "";
    if (!ref) return "direct";
    const url = new URL(ref);
    const host = url.hostname.replace(/^www\./, "");
    if (host === window.location.hostname.replace(/^www\./, "")) return "direct";
    return host;
  } catch {
    return "direct";
  }
}

export function getVisitMeta() {
  return {
    device_type: detectDeviceType(),
    browser: detectBrowser(),
    referrer: detectReferrer(),
  };
}
// Shared by the auth pages (Login, Register, and any page that resumes a flow
// after sign-in). Keep the redirect validation in one place — it is
// security-sensitive and easy to drift.

// Resolve ?returnTo= to a safe same-origin path, else "/".
//
// The same-origin check alone is not enough: a value like /.//evil.com or
// /\evil.com parses same-origin but normalizes to a protocol-relative
// //evil.com when assigned to location.href — an open redirect. So require the
// resolved path to be exactly one leading slash (no "//" prefix, no backslash).
export function safeReturnTo() {
  const raw = new URLSearchParams(window.location.search).get("returnTo");
  if (!raw) return "/";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    // Strip Supabase OAuth response params from returnTo — a crafted returnTo
    // containing these could replay auth tokens or error states into a fresh
    // session. Normal app-flow params (e.g. returnTo itself) are kept.
    for (const p of ["access_token", "refresh_token", "token_type", "error", "error_description", "error_code"]) {
      url.searchParams.delete(p);
    }
    const path = url.pathname + url.search;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
    return path;
  } catch {
    return "/";
  }
}

// Post-auth dashboard destination. On the production custom domain (aqla.io)
// we return an absolute URL so the OAuth callback redirects back to the custom domain.
// In preview/dev we stay same-origin with a relative path so the session token set by the callback isn't lost.
export function dashboardDestination() {
  const host = window.location.hostname;
  if (host === "aqla.io" || host.endsWith(".aqla.io")) {
    return "https://aqla.io/dashboard";
  }
  return "/dashboard";
}
// Shared by the auth pages (Login, Register, and any page that resumes a flow
// after sign-in). Keep the redirect validation in one place — it is
// security-sensitive and easy to drift.

// Resolve ?returnTo= to a safe same-origin path, else "/dashboard".
export function safeReturnTo() {
  if (typeof window === "undefined") return "/dashboard";
  const raw = new URLSearchParams(window.location.search).get("returnTo");
  if (!raw) return "/dashboard";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/dashboard";
    // Strip Supabase OAuth response params from returnTo
    for (const p of ["access_token", "refresh_token", "token_type", "error", "error_description", "error_code"]) {
      url.searchParams.delete(p);
    }
    const path = url.pathname + url.search;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/dashboard";
    if (path === "/login" || path === "/register" || path.startsWith("/login?") || path.startsWith("/register?")) return "/dashboard";
    return path;
  } catch {
    return "/dashboard";
  }
}

// Post-auth dashboard destination.
// Resolves to an absolute URL pointing to /dashboard on the current origin
// so Supabase OAuth can accurately redirect back in any environment (local, preview, prod).
export function dashboardDestination() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/dashboard`;
  }
  return "/dashboard";
}
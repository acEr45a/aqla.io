import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Registered users go back to their dashboard; guests go to the landing page.
export default function useHomePath() {
  const [path, setPath] = useState("/");
  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => setPath(authed ? "/dashboard" : "/"));
  }, []);
  return path;
}
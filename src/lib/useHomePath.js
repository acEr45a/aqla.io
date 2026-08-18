import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Registered users go back to their dashboard; guests go to the landing page.
export default function useHomePath() {
  const [path, setPath] = useState("/");
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setPath(session?.user ? "/dashboard" : "/");
    }).catch(() => setPath("/"));
  }, []);
  return path;
}
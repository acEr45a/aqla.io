import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Sends the AQLA welcome email once per account, on first authenticated app load.
// Covers email sign-ups and Google sign-ups; the backend is idempotent.
export default function WelcomeEmailTrigger() {
  useEffect(() => {
    base44.auth.me().then((user) => {
      if (!user || user.welcome_email_sent) return;
      base44.functions.invoke("sendRegistrationEmail", {});
    }).catch(() => {});
  }, []);
  return null;
}
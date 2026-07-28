import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Mail, Loader2 } from "lucide-react";
import { isAdminVerified, markAdminVerified } from "@/lib/adminSession";

export default function AdminSecurityGate({ children }) {
  const [verified, setVerified] = useState(isAdminVerified);
  const [stage, setStage] = useState("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (verified) return children;

  const sendCode = async () => {
    setBusy(true); setError("");
    const res = await base44.functions.invoke("sendAdminOtp", {});
    setBusy(false);
    if (res.data?.sent) { setEmail(res.data.email); setStage("code"); }
    else setError(res.data?.error || "Could not send the code.");
  };

  const verify = async () => {
    setBusy(true); setError("");
    const res = await base44.functions.invoke("verifyAdminOtp", { code });
    setBusy(false);
    if (res.data?.verified) { markAdminVerified(); setVerified(true); }
    else setError(res.data?.error || "Verification failed.");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="aqla-panel rounded-3xl p-6 sm:p-8">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary w-fit"><ShieldCheck className="h-5 w-5" /></div>
        <h1 className="mt-4 text-2xl font-light text-foreground">Verify it's you</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The admin console requires a second sign-in every session. We'll email you a one-time code — this repeats after every page reload.
        </p>

        {stage === "request" ? (
          <Button onClick={sendCode} disabled={busy} className="mt-6 w-full rounded-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Email me a verification code
          </Button>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-xs text-muted-foreground">Code sent to {email}. It expires in 10 minutes.</p>
            <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric" placeholder="000000"
              className="text-center text-lg tracking-[0.4em] tabular-nums" />
            <Button onClick={verify} disabled={busy || code.length !== 6} className="w-full rounded-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Enter admin console
            </Button>
            <button onClick={sendCode} disabled={busy} className="w-full text-xs text-muted-foreground hover:text-foreground">
              Resend code
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
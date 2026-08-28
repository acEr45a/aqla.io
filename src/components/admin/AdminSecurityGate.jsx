import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Mail, Loader2, Fingerprint } from "lucide-react";
import { isAdminVerified, markAdminVerified } from "@/lib/adminSession";

const DEVICE_KEY = "aqla_admin_device_id";

function getDeviceId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() || `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export default function AdminSecurityGate({ children }) {
  const [verified, setVerified] = useState(isAdminVerified);
  const [deviceId, setDeviceId] = useState("");
  const [isTrusted, setIsTrusted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!session?.user) return;
        const { data: profile } = await supabase.from("profiles").select("admin_trusted_devices").eq("id", session.user.id).maybeSingle();
        const trusted = Array.isArray(profile?.admin_trusted_devices) && profile.admin_trusted_devices.includes(id);
        setIsTrusted(trusted);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  // Trusted devices auto-verify on mount — no passcode needed.
  useEffect(() => {
    if (checking || verified || !isTrusted || !deviceId) return;
    const autoVerify = async () => {
      setBusy(true);
      try {
        const res = await apiClient.functions.invoke("verifyAdminAccess", {
          device_id: deviceId,
        });
        const isVer = res?.data?.verified ?? res?.verified;
        if (isVer) {
          markAdminVerified();
          setVerified(true);
        } else {
          // Device fell out of trust (admin removed it) — fall through to OTP flow.
          setIsTrusted(false);
          setError(res?.data?.error || res?.error || "This device is no longer trusted.");
        }
      } catch (e) {
        setError(e?.message || "Could not verify this device.");
      } finally {
        setBusy(false);
      }
    };
    autoVerify();
  }, [checking, isTrusted, deviceId, verified]);

  if (verified) return children;

  const sendOtp = async () => {
    setBusy(true); setError("");
    try {
      const res = await apiClient.functions.invoke("sendAdminOtp", {});
      const sent = res?.data?.sent ?? res?.sent;
      if (sent) setOtpSent(true);
      else setError(res?.data?.error || res?.error || "Could not send the code.");
    } catch (e) {
      setError(e?.message || "Could not send the code.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true); setError("");
    try {
      const res = await apiClient.functions.invoke("verifyAdminAccess", {
        device_id: deviceId,
        otp: code,
        trust_device: trustDevice,
      });
      const isVer = res?.data?.verified ?? res?.verified;
      if (isVer) {
        markAdminVerified();
        setVerified(true);
      } else {
        setError(res?.data?.error || res?.error || "Verification failed.");
      }
    } catch (e) {
      setError(e?.message || "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  if (checking || (isTrusted && !error)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="aqla-panel rounded-3xl p-6 sm:p-8">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary w-fit"><ShieldCheck className="h-5 w-5" /></div>
        <h1 className="mt-4 text-2xl font-light text-foreground">Verify it's you</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          New device detected. Verify with a one-time email code to open the admin console.
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> Email verification code
            </span>
            {!otpSent && (
              <button onClick={sendOtp} disabled={busy} className="text-xs text-primary hover:underline">
                Send code
              </button>
            )}
          </div>
          {otpSent && (
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              className="text-center text-lg tracking-[0.4em] tabular-nums bg-secondary/50"
            />
          )}
          {otpSent && (
            <button onClick={sendOtp} disabled={busy} className="text-xs text-muted-foreground hover:text-foreground">
              Resend code
            </button>
          )}
          <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Fingerprint className="h-3.5 w-3.5" /> Trust this device (skip the code next time)
            </span>
          </label>
        </div>

        <Button
          onClick={verifyOtp}
          disabled={busy || !otpSent || code.length !== 6}
          className="mt-6 w-full rounded-full"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Enter admin console
        </Button>

        {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
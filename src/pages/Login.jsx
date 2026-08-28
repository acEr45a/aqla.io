import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { getPublicSettings, executeV3, renderV2, getV2Response, verifyCaptchaToken } from "@/lib/captcha";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import TypewriterHeading from "@/components/auth/TypewriterHeading";
import { useAuth } from "@/lib/AuthContext";
import { safeReturnTo, dashboardDestination } from "@/lib/authReturnTo";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem("aqla_remembered_email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(() => !!localStorage.getItem("aqla_remembered_email"));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const raw = safeReturnTo();
  const returnTo = raw === "/" ? "/dashboard" : raw;

  const [settings, setSettings] = useState(null);
  const [showV2, setShowV2] = useState(false);
  const v2Ref = useRef(null);
  const [v2WidgetId, setV2WidgetId] = useState(null);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, returnTo, navigate]);

  useEffect(() => { getPublicSettings().then(setSettings).catch(() => {}); }, []);
  useEffect(() => {
    if (showV2 && v2Ref.current && settings?.captcha?.v2_site_key) {
      setV2WidgetId(renderV2(v2Ref.current, settings.captcha.v2_site_key));
    }
  }, [showV2, settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (rememberEmail) localStorage.setItem("aqla_remembered_email", email);
    else localStorage.removeItem("aqla_remembered_email");
    try {
      if (!settings?.test_mode && settings?.captcha) {
        if (showV2 && v2WidgetId != null) {
          const v2Token = getV2Response(v2WidgetId);
          if (!v2Token) { setError("Please complete the reCAPTCHA."); setLoading(false); return; }
          const verify = await verifyCaptchaToken(v2Token, "v2");
          if (!verify.success) { setError("reCAPTCHA verification failed. Try again."); setLoading(false); return; }
        } else {
          const v3Token = await executeV3(settings.captcha.v3_site_key, "login");
          const verify = await verifyCaptchaToken(v3Token, "v3");
          if (!verify.success || (verify.score ?? 1) < (verify.threshold ?? 0.5)) {
            setShowV2(true);
            setError("Please complete the security check below.");
            setLoading(false);
            return;
          }
        }
      }
      await apiClient.auth.loginViaEmailPassword(email, password);
      navigate(returnTo, { replace: true });
    } catch (err) {
      // Collision guard: an account created through Google has no password, so
      // point the user at the right button instead of "invalid password".
      const msg = String(err?.message || "");
      if (/google|provider|no password|social/i.test(msg)) {
        setError("This email is registered with Google. Use “Continue with Google” above.");
      } else {
        setError(msg || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      // Always hand the provider an explicit, validated destination so the
      // platform callback returns to the right host (custom domain in prod).
      await apiClient.auth.loginWithProvider("google", returnTo || dashboardDestination());
    } catch (err) {
      setError(err?.message || "Google sign-in could not start. Please try again.");
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title={<TypewriterHeading />}
      subtitle={
        <span className="text-muted-foreground/80 text-xs sm:text-sm tracking-wide">
          Authenticate to decrypt your <strong className="font-semibold text-foreground">neural telemetry</strong>
        </span>
      }
      footer={
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <span>Don't have an account?</span>
          <Link
            to={"/register" + (raw !== "/" ? "?returnTo=" + encodeURIComponent(raw) : "")}
            className="text-primary font-bold hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </div>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-semibold rounded-xl border-border/80 bg-secondary/30 hover:bg-secondary/60 hover:border-primary/30 transition-all shadow-sm"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2.5" />
        Continue with Google
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest font-mono">
          <span className="bg-card px-3 text-muted-foreground/70">or with email</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm leading-relaxed flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Email Address
          </Label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-secondary/30 border-border/70 rounded-xl font-medium placeholder:text-muted-foreground/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 hover:border-border transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
              Password
            </Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-11 h-12 bg-secondary/30 border-border/70 rounded-xl font-medium placeholder:text-muted-foreground/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 hover:border-border transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground p-1 transition-colors rounded-lg focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-email"
              checked={rememberEmail}
              onCheckedChange={setRememberEmail}
              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-border/80"
            />
            <Label htmlFor="remember-email" className="text-xs font-normal text-muted-foreground cursor-pointer select-none">
              Remember email
            </Label>
          </div>
          <span className="text-[11px] text-muted-foreground/60">Encrypted session</span>
        </div>

        {showV2 && (
          <div className="space-y-2 pt-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Security Verification</Label>
            <div ref={v2Ref} className="min-h-[78px] rounded-xl overflow-hidden" />
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 font-bold tracking-wide text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(75_82%_60%/0.25)] hover:shadow-[0_0_28px_hsl(75_82%_60%/0.4)] transition-all duration-200 mt-2"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Authenticating...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Log In</span>
              <Sparkles className="w-3.5 h-3.5 opacity-70" />
            </span>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
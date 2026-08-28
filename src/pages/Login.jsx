import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { getPublicSettings, executeV3, renderV2, getV2Response, verifyCaptchaToken } from "@/lib/captcha";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { useAuth } from "@/lib/AuthContext";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem("aqla_remembered_email") || "");
  const [password, setPassword] = useState("");
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
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to={"/register" + (raw !== "/" ? "?returnTo=" + encodeURIComponent(raw) : "")}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="remember-email" checked={rememberEmail} onCheckedChange={setRememberEmail} />
          <Label htmlFor="remember-email" className="text-sm font-normal text-muted-foreground">Remember my email on this device</Label>
        </div>
        <p className="text-xs text-muted-foreground">You stay signed in on this device until you sign out.</p>
        {showV2 && (
          <div className="space-y-2">
            <Label>Security check</Label>
            <div ref={v2Ref} className="min-h-[78px]" />
          </div>
        )}
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { KeyRound, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CaptchaEditor() {
  const [config, setConfig] = useState({ v3_site_key: "", v3_secret_key: "", v2_site_key: "", v2_secret_key: "", score_threshold: 0.5 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await base44.functions.invoke("superAdminOps", { action: "getCaptcha" });
    if (res.data?.config) setConfig({ score_threshold: 0.5, ...res.data.config });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      const res = await base44.functions.invoke("superAdminOps", { action: "saveCaptcha", config });
      if (res.data?.error) throw new Error(res.data.error);
      setMsg("Saved. Test Mode bypasses CAPTCHA while on.");
    } catch (e) { setMsg(e.message); }
    setSaving(false);
  };

  if (loading) return <div className="flex h-20 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="h-4 w-4 text-primary" />
        <p className="font-display text-foreground">reCAPTCHA configuration</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>v3 site key</Label>
          <Input value={config.v3_site_key || ""} onChange={(e) => setConfig({ ...config, v3_site_key: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>v3 secret key</Label>
          <Input type="password" value={config.v3_secret_key || ""} onChange={(e) => setConfig({ ...config, v3_secret_key: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>v2 site key</Label>
          <Input value={config.v2_site_key || ""} onChange={(e) => setConfig({ ...config, v2_site_key: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>v2 secret key</Label>
          <Input type="password" value={config.v2_secret_key || ""} onChange={(e) => setConfig({ ...config, v2_secret_key: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Score threshold</Label>
          <Input type="number" step="0.1" min="0" max="1" value={config.score_threshold ?? 0.5} onChange={(e) => setConfig({ ...config, score_threshold: parseFloat(e.target.value) })} />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save configuration</Button>
        {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
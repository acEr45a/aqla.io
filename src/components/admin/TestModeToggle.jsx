import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import { Switch } from "@/components/ui/switch";
import { getPublicSettings, clearSettingsCache } from "@/lib/captcha";
import { Beaker, Loader2 } from "lucide-react";

export default function TestModeToggle() {
  const [testMode, setTestMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPublicSettings().then((s) => { setTestMode(!!s.test_mode); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggle = async (checked) => {
    setSaving(true);
    try {
      await apiClient.functions.invoke("updateAppSettings", { test_mode: checked });
      setTestMode(checked);
      clearSettingsCache();
    } catch (e) { /* ignore */ }
    setSaving(false);
  };

  return (
    <div className="aqla-panel rounded-2xl p-5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary"><Beaker className="h-4 w-4" /></div>
        <div>
          <p className="font-display text-foreground">Test Mode</p>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-md">For thorough QA testing only. Enables the Landing skip button and CAPTCHA bypass. Disable when not testing. Invisible to public users.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <Switch checked={testMode} onCheckedChange={toggle} disabled={loading || saving} />
      </div>
    </div>
  );
}
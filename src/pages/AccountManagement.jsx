import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SettingRow from "@/components/settings/SettingRow";
import SettingsSection from "@/components/settings/SettingsSection";
import { ArrowLeft, Loader2, Settings as SettingsIcon } from "lucide-react";

const DEFAULTS = {
  display_name: "",
  occupation: "",
  primary_goal: "focus",
  email_updates: false,
  email_protocol: true,
  email_review: true,
  email_frequency: "weekly",
  privacy_level: "standard",
  research_contribution: false,
  ai_memory: true,
};

const GOALS = [
  { value: "focus", label: "Sharper focus" },
  { value: "memory", label: "Better memory" },
  { value: "energy", label: "More mental energy" },
  { value: "stress", label: "Lower stress load" },
  { value: "sleep", label: "Better sleep and recovery" },
];

const PRIVACY = [
  { value: "minimal", label: "Minimal — store only what the app needs to function" },
  { value: "standard", label: "Standard — keep history for personalised insights" },
  { value: "open", label: "Open — allow anonymised aggregate research use" },
];

export default function AccountManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setPrefs({ ...DEFAULTS, display_name: u.full_name || "", ...(u.preferences || {}) });
    });
  }, []);

  const update = async (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    await base44.auth.updateMe({ preferences: next });
    setSaving(false);
  };

  const toggle = (key) => <Switch checked={!!prefs[key]} onCheckedChange={(v) => update({ [key]: v })} />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-5 md:px-10 pt-10 md:pt-14 pb-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-3 gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Account management</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-light tracking-tight text-foreground">Your account</h1>
          <p className="text-sm text-muted-foreground mt-2">{user?.email || "—"}</p>
        </div>
        {saving && <Loader2 className="w-4 h-4 mt-2 animate-spin text-muted-foreground" />}
      </div>

      <SettingsSection title="Profile" hint="How AQLA addresses you and frames your protocols.">
        <SettingRow title="Display name">
          <Input value={prefs.display_name} className="w-44"
            onChange={(e) => setPrefs((p) => ({ ...p, display_name: e.target.value }))}
            onBlur={(e) => update({ display_name: e.target.value })} />
        </SettingRow>
        <SettingRow title="Occupation" description="Used only to interpret your cognitive demands.">
          <Input value={prefs.occupation} className="w-44" placeholder="e.g. Engineer"
            onChange={(e) => setPrefs((p) => ({ ...p, occupation: e.target.value }))}
            onBlur={(e) => update({ occupation: e.target.value })} />
        </SettingRow>
        <SettingRow title="Primary goal">
          <Select value={prefs.primary_goal} onValueChange={(v) => update({ primary_goal: v })}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{GOALS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Email address" description="Your sign-in email can't be changed here.">
          <span className="text-xs text-muted-foreground">{user?.email || "—"}</span>
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Email preferences" hint="Choose exactly which emails AQLA sends you.">
        <SettingRow title="Progress summaries" description="A recap of your check-ins, tests and trends.">
          {toggle("email_updates")}
        </SettingRow>
        <SettingRow title="Protocol emails" description="When a protocol starts, ends or needs attention.">
          {toggle("email_protocol")}
        </SettingRow>
        <SettingRow title="Cycle review emails" description="When your 14-day cycle is ready for review.">
          {toggle("email_review")}
        </SettingRow>
        <SettingRow title="Frequency">
          <Select value={prefs.email_frequency} onValueChange={(v) => update({ email_frequency: v })}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Privacy level" hint="Controls how much of your data AQLA retains and reuses.">
        <SettingRow title="Data retention level">
          <Select value={prefs.privacy_level} onValueChange={(v) => update({ privacy_level: v })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{PRIVACY.map((p) => <SelectItem key={p.value} value={p.value}>{p.value}</SelectItem>)}</SelectContent>
          </Select>
        </SettingRow>
        <p className="pb-3 text-xs text-muted-foreground leading-relaxed">
          {PRIVACY.find((p) => p.value === prefs.privacy_level)?.label}
        </p>
        <SettingRow title="Contribute to research" description="Share fully anonymised, aggregated results only.">
          {toggle("research_contribution")}
        </SettingRow>
        <SettingRow title="AQLA Intelligence memory" description="Let the coach reference your history for personalised answers.">
          {toggle("ai_memory")}
        </SettingRow>
      </SettingsSection>

      <div className="mt-6 mb-4">
        <Link to="/settings">
          <Button variant="outline" size="sm" className="gap-2 rounded-full">
            <SettingsIcon className="w-4 h-4" /> App settings & notifications
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Lock, LogOut, ShieldCheck, Loader2 } from "lucide-react";
import SettingRow from "@/components/settings/SettingRow";
import SettingsSection from "@/components/settings/SettingsSection";

const DEFAULTS = {
  // notifications
  daily_reminder: true,
  reminder_time: "08:00",
  weekly_review_day: "sunday",
  protocol_alerts: true,
  experiment_alerts: true,
  email_updates: false,
  // experience
  show_uncertainty: true,
  supplement_content: true,
  reduced_motion: false,
  // privacy
  research_contribution: false,
  clinician_sharing: false,
  ai_memory: true,
  usage_analytics: true,
};

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setPrefs({ ...DEFAULTS, ...(u.preferences || {}) });
    });
  }, []);

  const update = async (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    await base44.auth.updateMe({ preferences: next });
    setSaving(false);
  };

  const toggle = (key) => (
    <Switch checked={!!prefs[key]} onCheckedChange={(v) => update({ [key]: v })} />
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-5 md:px-10 pt-10 md:pt-14">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-3 gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Account</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-light tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-2">{user?.email || "—"}</p>
        </div>
        {saving && <Loader2 className="w-4 h-4 mt-2 animate-spin text-muted-foreground" />}
      </div>

      <SettingsSection title="Notifications" hint="How and when AQLA reaches out to you.">
        <SettingRow title="Daily check-in reminder" description="A nudge to log clarity, energy, stress and sleep.">
          {toggle("daily_reminder")}
        </SettingRow>
        <SettingRow title="Reminder time">
          <Input type="time" value={prefs.reminder_time} className="w-28"
            onChange={(e) => update({ reminder_time: e.target.value })} />
        </SettingRow>
        <SettingRow title="Weekly review day" description="When AQLA summarises your week and reviews protocols.">
          <Select value={prefs.weekly_review_day} onValueChange={(v) => update({ weekly_review_day: v })}>
            <SelectTrigger className="w-36 capitalize"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Protocol alerts" description="Notify me when a protocol starts, ends or is due for review.">
          {toggle("protocol_alerts")}
        </SettingRow>
        <SettingRow title="Experiment alerts" description="Notify me when an experiment reaches a decision point.">
          {toggle("experiment_alerts")}
        </SettingRow>
        <SettingRow title="Email updates" description="Weekly progress summaries by email.">
          {toggle("email_updates")}
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Experience" hint="How insights are presented across the app.">
        <SettingRow title="Show uncertainty indicators" description="Display confidence levels and evidence limits alongside insights.">
          {toggle("show_uncertainty")}
        </SettingRow>
        <SettingRow title="Supplement content" description="Include ingredient protocols and evidence passports.">
          {toggle("supplement_content")}
        </SettingRow>
        <SettingRow title="Reduce motion" description="Minimise animated visuals across the app.">
          {toggle("reduced_motion")}
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Data & privacy" hint="You stay in control of how your cognitive data is used.">
        <SettingRow title="Contribute to research" description="Share fully anonymised, aggregated results to improve AQLA's models.">
          {toggle("research_contribution")}
        </SettingRow>
        <SettingRow title="Clinician sharing" description="Allow a reviewing clinician to see your protocols and safety flags.">
          {toggle("clinician_sharing")}
        </SettingRow>
        <SettingRow title="AQLA Intelligence memory" description="Let the coach reference your history for more personalised answers.">
          {toggle("ai_memory")}
        </SettingRow>
        <SettingRow title="Usage analytics" description="Anonymous product analytics that help improve the experience.">
          {toggle("usage_analytics")}
        </SettingRow>
        <SettingRow title="Safety screening" description="Review your eligibility answers and flags.">
          <Link to="/safety">
            <Button variant="outline" size="sm" className="gap-2"><ShieldCheck className="w-4 h-4" /> Open</Button>
          </Link>
        </SettingRow>
        <SettingRow title="Account management" description="Profile, email preferences and privacy level.">
          <Link to="/account-management">
            <Button variant="outline" size="sm">Open</Button>
          </Link>
        </SettingRow>
        <SettingRow title="Trust & data" description="How your data is stored, used and governed.">
          <Link to="/trust">
            <Button variant="outline" size="sm" className="gap-2"><Lock className="w-4 h-4" /> Open</Button>
          </Link>
        </SettingRow>
      </SettingsSection>

      <div className="mt-6 mb-10">
        <Button variant="ghost" onClick={() => base44.auth.logout("/")}
          className="gap-2 text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </div>
    </motion.div>
  );
}
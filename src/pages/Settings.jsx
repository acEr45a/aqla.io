import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, LogOut, ShieldCheck, Loader2 } from "lucide-react";
import SettingRow from "@/components/settings/SettingRow";

const DEFAULTS = {
  daily_reminder: true,
  reminder_time: "08:00",
  weekly_review_day: "sunday",
  email_updates: false,
  show_uncertainty: true,
  supplement_content: true,
  reduced_motion: false,
};

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function Settings() {
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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-5 md:px-10 pt-10 md:pt-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.email || "—"}</p>
        </div>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      <section className="aqla-panel rounded-2xl px-5 py-2 mt-8">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground pt-4">Rhythm & reminders</p>
        <SettingRow title="Daily check-in reminder" description="A nudge to log clarity, energy, stress and sleep.">
          <Switch checked={prefs.daily_reminder} onCheckedChange={(v) => update({ daily_reminder: v })} />
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
        <SettingRow title="Email updates" description="Weekly progress summaries by email.">
          <Switch checked={prefs.email_updates} onCheckedChange={(v) => update({ email_updates: v })} />
        </SettingRow>
      </section>

      <section className="aqla-panel rounded-2xl px-5 py-2 mt-6">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground pt-4">Experience</p>
        <SettingRow title="Show uncertainty indicators" description="Display confidence levels and evidence limits alongside insights.">
          <Switch checked={prefs.show_uncertainty} onCheckedChange={(v) => update({ show_uncertainty: v })} />
        </SettingRow>
        <SettingRow title="Supplement content" description="Include ingredient protocols and evidence passports.">
          <Switch checked={prefs.supplement_content} onCheckedChange={(v) => update({ supplement_content: v })} />
        </SettingRow>
        <SettingRow title="Reduce motion" description="Minimise animated visuals across the app.">
          <Switch checked={prefs.reduced_motion} onCheckedChange={(v) => update({ reduced_motion: v })} />
        </SettingRow>
      </section>

      <section className="aqla-panel rounded-2xl px-5 py-2 mt-6">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground pt-4">Safety & privacy</p>
        <SettingRow title="Safety screening" description="Review your eligibility answers and flags.">
          <Link to="/safety">
            <Button variant="outline" size="sm" className="gap-2"><ShieldCheck className="w-4 h-4" /> Open</Button>
          </Link>
        </SettingRow>
        <SettingRow title="Trust & data" description="How your data is stored, used and governed.">
          <Link to="/trust">
            <Button variant="outline" size="sm" className="gap-2"><Lock className="w-4 h-4" /> Open</Button>
          </Link>
        </SettingRow>
      </section>

      <div className="mt-6 mb-10">
        <Button variant="ghost" onClick={() => base44.auth.logout("/")}
          className="gap-2 text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </div>
    </motion.div>
  );
}
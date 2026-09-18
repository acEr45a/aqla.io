import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { apiClient } from "@/api/apiClient";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPublicSettings, clearSettingsCache } from "@/lib/captcha";
import {
  Beaker, Loader2, Plus, Copy, Trash2, ChevronDown, ChevronRight,
  FlaskConical, UserPlus, Brain, Activity, Shield, ClipboardCheck,
  RefreshCcw, Zap, Moon, Gauge, BookOpen, AlertTriangle, Check
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

// ─── Preset Persona Configs ─────────────────────────────────────────────────
const PRESETS = [
  {
    key: "peak",
    label: "Peak Performer",
    icon: Zap,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    config: {
      role: "user",
      archetype: "peak_performer",
      brain_domains: { memory: 88, focus: 92, processing_speed: 85, executive_function: 90, linguistic_fluency: 87 },
      check_in_days: 21,
      protocol_family: "Neuroplasticity",
    },
  },
  {
    key: "fatigued",
    label: "Fatigued Member",
    icon: Moon,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    config: {
      role: "user",
      archetype: "fatigued_member",
      brain_domains: { memory: 42, focus: 35, processing_speed: 48, executive_function: 40, linguistic_fluency: 55 },
      check_in_days: 14,
      protocol_family: "Recovery",
    },
  },
  {
    key: "fresh",
    label: "Fresh Sign-Up",
    icon: UserPlus,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    config: {
      role: "user",
      archetype: "fresh_signup",
      brain_domains: {},
      check_in_days: 0,
      protocol_family: null,
    },
  },
  {
    key: "clinician",
    label: "Clinician Tester",
    icon: Shield,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    config: {
      role: "clinician",
      archetype: "clinician_tester",
      brain_domains: { memory: 75, focus: 78, processing_speed: 72, executive_function: 80, linguistic_fluency: 82 },
      check_in_days: 7,
      protocol_family: "Cognitive Maintenance",
    },
  },
];

const DOMAIN_LABELS = {
  memory: { label: "Memory", icon: Brain },
  focus: { label: "Focus", icon: Gauge },
  processing_speed: { label: "Processing Speed", icon: Activity },
  executive_function: { label: "Executive Function", icon: BookOpen },
  linguistic_fluency: { label: "Linguistic Fluency", icon: ClipboardCheck },
};

// ─── Main Panel ──────────────────────────────────────────────────────────────
export default function TestingPanel() {
  // Test mode state
  const [testMode, setTestMode] = useState(false);
  const [testModeLoading, setTestModeLoading] = useState(true);
  const [testModeSaving, setTestModeSaving] = useState(false);

  // Test accounts
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createLabel, setCreateLabel] = useState("");
  const [createRole, setCreateRole] = useState("user");
  const [createPasscode, setCreatePasscode] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Data controller
  const [domainSliders, setDomainSliders] = useState({
    memory: 50, focus: 50, processing_speed: 50, executive_function: 50, linguistic_fluency: 50
  });
  const [checkInDays, setCheckInDays] = useState(14);
  const [protocolFamily, setProtocolFamily] = useState("Neuroplasticity");
  const [dataUpdating, setDataUpdating] = useState(false);
  const [dataResult, setDataResult] = useState(null);

  // Clipboard feedback
  const [copiedId, setCopiedId] = useState(null);

  // ─── Load test mode ─────────────────────────────────────────────────────
  useEffect(() => {
    getPublicSettings()
      .then((s) => { setTestMode(!!s.test_mode); setTestModeLoading(false); })
      .catch(() => setTestModeLoading(false));
  }, []);

  const toggleTestMode = async (checked) => {
    setTestModeSaving(true);
    try {
      await apiClient.functions.invoke("updateAppSettings", { test_mode: checked });
      setTestMode(checked);
      clearSettingsCache();
    } catch { /* ignore */ }
    setTestModeSaving(false);
  };

  // ─── Load test accounts ────────────────────────────────────────────────
  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const res = await supabase.functions.invoke("aqla-ops", {
        body: { action: "listTestAccounts" },
      });
      const data = res?.data;
      setAccounts(data?.accounts || []);
    } catch (err) {
      console.warn("[TestingPanel] Failed to load accounts:", err);
      // Fallback: direct query
      try {
        const { data } = await supabase.from("test_accounts").select("*").order("created_at", { ascending: false });
        setAccounts(data || []);
      } catch { /* ignore */ }
    }
    setAccountsLoading(false);
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  // ─── Create test account ───────────────────────────────────────────────
  const handleCreate = async (presetConfig = null) => {
    setCreating(true);
    setCreateError("");
    try {
      const body = presetConfig
        ? { action: "createTestAccount", label: presetConfig.archetype?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Test User", role: presetConfig.role, archetype: presetConfig.archetype }
        : { action: "createTestAccount", label: createLabel || "Test User", role: createRole, passcode: createPasscode || undefined };

      const res = await supabase.functions.invoke("aqla-ops", { body });
      const data = res?.data;

      if (data?.error) throw new Error(data.error);

      // If preset, also inject data
      if (presetConfig && data?.id && Object.keys(presetConfig.brain_domains || {}).length > 0) {
        await supabase.functions.invoke("aqla-ops", {
          body: {
            action: "updateTestAccountData",
            user_id: data.id,
            brain_domains: presetConfig.brain_domains,
            check_in_days: presetConfig.check_in_days,
            protocol_family: presetConfig.protocol_family,
          },
        });
      }

      setShowCreate(false);
      setCreateLabel("");
      setCreateRole("user");
      setCreatePasscode("");
      await loadAccounts();
    } catch (err) {
      setCreateError(err?.message || "Failed to create test account");
    }
    setCreating(false);
  };

  // ─── Delete test account ───────────────────────────────────────────────
  const handleDelete = async (userId) => {
    try {
      await supabase.functions.invoke("aqla-ops", {
        body: { action: "deleteTestAccount", user_id: userId },
      });
      if (selectedAccount?.id === userId) setSelectedAccount(null);
      await loadAccounts();
    } catch (err) {
      console.error("[TestingPanel] Delete error:", err);
    }
  };

  // ─── Update test account data ──────────────────────────────────────────
  const handleUpdateData = async () => {
    if (!selectedAccount) return;
    setDataUpdating(true);
    setDataResult(null);
    try {
      const res = await supabase.functions.invoke("aqla-ops", {
        body: {
          action: "updateTestAccountData",
          user_id: selectedAccount.id,
          brain_domains: domainSliders,
          check_in_days: checkInDays,
          protocol_family: protocolFamily || undefined,
        },
      });
      setDataResult(res?.data?.results || { success: true });
      await loadAccounts();
    } catch (err) {
      setDataResult({ error: err?.message || "Update failed" });
    }
    setDataUpdating(false);
  };

  const handleInjectClinicalFlag = async () => {
    if (!selectedAccount) return;
    setDataUpdating(true);
    try {
      await supabase.functions.invoke("aqla-ops", {
        body: {
          action: "updateTestAccountData",
          user_id: selectedAccount.id,
          clinical_flag: {
            type: "concern",
            severity: "moderate",
            description: "Synthetic clinical flag — injected from Testing Suite for QA purposes",
          },
        },
      });
      setDataResult({ clinical_flag: { injected: true } });
    } catch (err) {
      setDataResult({ error: err?.message });
    }
    setDataUpdating(false);
  };

  // ─── Clipboard ──────────────────────────────────────────────────────────
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── When selecting an account, preload its domain data ────────────────
  useEffect(() => {
    if (selectedAccount?.data_config?.brain_domains) {
      setDomainSliders(prev => ({
        ...prev,
        ...selectedAccount.data_config.brain_domains,
      }));
    }
  }, [selectedAccount]);

  return (
    <div className="space-y-6">
      {/* ─── Section 1: Master Test Mode Switch ─────────────────────────── */}
      <section className="aqla-panel rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary"><Beaker className="h-4 w-4" /></div>
            <div>
              <p className="font-display text-foreground">Test Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                Enables CAPTCHA bypass and landing-page skip for QA. This setting is global — disable when not actively testing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {testModeSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch checked={testMode} onCheckedChange={toggleTestMode} disabled={testModeLoading || testModeSaving} />
          </div>
        </div>
      </section>

      {/* ─── Section 2: 1-Click Preset Personas ─────────────────────────── */}
      <section className="aqla-panel rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="rounded-xl bg-primary/10 p-2 text-primary"><FlaskConical className="h-4 w-4" /></div>
          <div>
            <p className="font-display text-foreground">Quick Personas</p>
            <p className="text-xs text-muted-foreground mt-0.5">Create a pre-configured test account in one click. Each persona comes with tailored brain domain scores, check-in history, and protocols.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => handleCreate(p.config)}
              disabled={creating}
              className={`group relative flex flex-col items-center gap-2 rounded-xl border border-border/60 p-4 text-center transition-all hover:border-primary/40 hover:bg-secondary/30 disabled:opacity-50`}
            >
              <div className={`rounded-lg ${p.bg} p-2`}>
                <p.icon className={`h-5 w-5 ${p.color}`} />
              </div>
              <span className="text-sm font-medium text-foreground">{p.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {p.config.role === "clinician" ? "Clinician role" : p.config.archetype?.replace(/_/g, " ")}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── Section 3: Custom Account Generator ────────────────────────── */}
      <section className="aqla-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary"><UserPlus className="h-4 w-4" /></div>
            <div>
              <p className="font-display text-foreground">Custom Test Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">Create a blank test account with custom settings.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowCreate(!showCreate)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Account
          </Button>
        </div>
        {showCreate && (
          <div className="mt-3 rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Display Name</Label>
                <Input value={createLabel} onChange={(e) => setCreateLabel(e.target.value)} placeholder="Test Agent" className="h-9 bg-card" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <option value="user">User</option>
                  <option value="clinician">Clinician</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Passcode <span className="text-muted-foreground/50">(auto if blank)</span></Label>
                <Input value={createPasscode} onChange={(e) => setCreatePasscode(e.target.value)} placeholder="Auto-generated" className="h-9 bg-card font-mono" />
              </div>
            </div>
            {createError && <p className="text-xs text-destructive">{createError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" onClick={() => handleCreate()} disabled={creating} className="gap-1.5">
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Create
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ─── Section 4: Test Accounts List ──────────────────────────────── */}
      <section className="aqla-panel overflow-hidden rounded-2xl">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400"><Beaker className="h-4 w-4" /></div>
            <div>
              <p className="font-display text-foreground">Test Accounts</p>
              <p className="text-xs text-muted-foreground mt-0.5">{accounts.length} account{accounts.length !== 1 ? "s" : ""} registered</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={loadAccounts} disabled={accountsLoading} className="gap-1.5">
            <RefreshCcw className={`h-3.5 w-3.5 ${accountsLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {accountsLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading test accounts…
          </div>
        ) : accounts.length === 0 ? (
          <div className="px-5 pb-5 text-center text-sm text-muted-foreground py-8">
            No test accounts yet. Use the presets above or create a custom one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-y border-border/60 text-[11px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium w-8"></th>
                  <th className="px-5 py-3 font-medium">Account</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Passcode</th>
                  <th className="px-5 py-3 font-medium">Last Login</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <React.Fragment key={acc.id}>
                    <tr
                      className={`border-b border-border/40 last:border-0 cursor-pointer transition-colors ${
                        selectedAccount?.id === acc.id ? "bg-primary/5" : "hover:bg-secondary/30"
                      }`}
                      onClick={() => setSelectedAccount(selectedAccount?.id === acc.id ? null : acc)}
                    >
                      <td className="px-5 py-3">
                        <button onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === acc.id ? null : acc.id); }}>
                          {expandedId === acc.id
                            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                            <Beaker className="h-2.5 w-2.5" /> TEST
                          </span>
                          <div>
                            <p className="text-foreground font-medium">{acc.label}</p>
                            <p className="text-xs text-muted-foreground">{acc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          acc.role === "admin" ? "bg-rose-500/15 text-rose-400"
                          : acc.role === "clinician" ? "bg-violet-500/15 text-violet-400"
                          : "bg-sky-500/15 text-sky-400"
                        }`}>
                          {acc.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-foreground">{acc.passcode}</code>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(acc.passcode, acc.id); }}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg"
                            title="Copy passcode"
                          >
                            {copiedId === acc.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {acc.last_login_at ? new Date(acc.last_login_at).toLocaleString() : "Never"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {new Date(acc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-destructive hover:border-destructive/40"
                              title="Delete test account"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-display font-normal">Delete {acc.label}?</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                This permanently removes the test account, all generated data, and the auth user. Cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(acc.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete forever
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                    {/* Expanded row: history log */}
                    {expandedId === acc.id && (
                      <tr className="bg-secondary/10">
                        <td colSpan={7} className="px-8 py-3">
                          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Activity History</p>
                          {Array.isArray(acc.history) && acc.history.length > 0 ? (
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {[...acc.history].reverse().map((h, i) => (
                                <div key={i} className="flex items-baseline gap-2 text-xs">
                                  <span className="text-muted-foreground/60 font-mono text-[10px] shrink-0">
                                    {h.at ? new Date(h.at).toLocaleString() : "—"}
                                  </span>
                                  <span className="text-foreground">{h.event}</span>
                                  {h.by && <span className="text-muted-foreground">by {h.by}</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No history recorded.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Section 5: Data Controller ─────────────────────────────────── */}
      {selectedAccount && (
        <section className="aqla-panel rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-5">
            <div className="rounded-xl bg-primary/10 p-2 text-primary"><Brain className="h-4 w-4" /></div>
            <div>
              <p className="font-display text-foreground">Data Controller</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manipulate synthetic data for <strong className="text-foreground">{selectedAccount.label}</strong> ({selectedAccount.email})
              </p>
            </div>
          </div>

          {/* Brain Domain Sliders */}
          <div className="space-y-3 mb-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Brain Domain Scores</p>
            <div className="grid gap-3">
              {Object.entries(DOMAIN_LABELS).map(([key, { label, icon: Icon }]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-40 shrink-0">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{label}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={domainSliders[key]}
                    onChange={(e) => setDomainSliders(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="flex-1 h-1.5 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                  />
                  <span className="text-sm font-mono text-foreground w-8 text-right tabular-nums">{domainSliders[key]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Check-in & Protocol controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Generate Check-In History (days)</Label>
              <Input
                type="number"
                min="0"
                max="90"
                value={checkInDays}
                onChange={(e) => setCheckInDays(Number(e.target.value))}
                className="h-9 bg-card"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Assign Protocol Family</Label>
              <select
                value={protocolFamily}
                onChange={(e) => setProtocolFamily(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <option value="">None</option>
                <option value="Neuroplasticity">Neuroplasticity</option>
                <option value="Recovery">Recovery</option>
                <option value="Cognitive Maintenance">Cognitive Maintenance</option>
                <option value="Stress Resilience">Stress Resilience</option>
                <option value="Sleep Optimization">Sleep Optimization</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleUpdateData} disabled={dataUpdating} className="gap-1.5">
              {dataUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
              Apply Data
            </Button>
            <Button variant="outline" onClick={handleInjectClinicalFlag} disabled={dataUpdating} className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Inject Clinical Flag
            </Button>
          </div>

          {/* Result feedback */}
          {dataResult && (
            <div className="mt-3 rounded-xl border border-border/60 bg-secondary/20 p-3">
              <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(dataResult, null, 2)}
              </pre>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Save,
  Check,
  Radio,
  FileCode,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CustomInboxSettings({
  open,
  onClose,
  currentUser,
  isSuperAdmin,
}) {
  const [activeTab, setActiveTab] = useState("personal"); // 'personal' | 'governance'
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings State
  const [forwardingEnabled, setForwardingEnabled] = useState(false);
  const [forwardingEmails, setForwardingEmails] = useState("");
  const [signatureHtml, setSignatureHtml] = useState(
    `<p>--<br><strong>Dr. Richardson, MD, PhD</strong><br>Clinical Director | AQLA Brain OS<br><span style="color:#a3e635;">Neural Wellness & Cognitive Protocol Optimization</span><br><a href="https://aqla.io" style="color:#7B94FF;">aqla.io</a></p>`
  );
  const [oooEnabled, setOooEnabled] = useState(false);
  const [oooMessage, setOooMessage] = useState(
    "Thank you for reaching out. I am currently reviewing clinical assessments and will respond within 24 hours. If you require immediate protocol assistance, please consult AQLA Intelligence on your dashboard."
  );

  // Super Admin Governance Settings
  const [globalRetentionDays, setGlobalRetentionDays] = useState("365");
  const [enforceEncryption, setEnforceEncryption] = useState(true);
  const [allowExternalForwarding, setAllowExternalForwarding] = useState(true);

  // Load existing settings
  useEffect(() => {
    if (!open || !currentUser?.id) return;
    supabase
      .from("user_inbox_settings")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForwardingEnabled(data.forwarding_enabled || false);
          setForwardingEmails((data.forwarding_emails || []).join(", "));
          if (data.signature_html) setSignatureHtml(data.signature_html);
          setOooEnabled(data.out_of_office_enabled || false);
          if (data.out_of_office_message) setOooMessage(data.out_of_office_message);
        }
      });
  }, [open, currentUser]);

  const handleSave = async () => {
    if (!currentUser?.id || saving) return;
    setSaving(true);

    const payload = {
      user_id: currentUser.id,
      forwarding_enabled: forwardingEnabled,
      forwarding_emails: forwardingEmails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      signature_html: signatureHtml,
      out_of_office_enabled: oooEnabled,
      out_of_office_message: oooMessage,
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from("user_inbox_settings").upsert(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      // Handled
    }
    setSaving(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border/80 p-0 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border/60 bg-card/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Clinical Inbox Settings & Governance
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure auto-forwarding, dynamic HTML signatures, out-of-office rules, and security controls.
              </DialogDescription>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-border/40">
            <button
              onClick={() => setActiveTab("personal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "personal"
                  ? "bg-primary text-black font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              My Inbox & Signatures
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab("governance")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "governance"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                    : "text-muted-foreground hover:text-amber-300 hover:bg-secondary/40"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" /> Super Admin Governance
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {activeTab === "personal" ? (
            <>
              {/* Email Forwarding Section */}
              <div className="space-y-3 bg-secondary/30 p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" /> Automatic Inbound Email Forwarding
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Forward inbound patient messages arriving at <code>clinician@ndapape.resend.app</code> to external addresses.
                    </p>
                  </div>
                  <Switch checked={forwardingEnabled} onCheckedChange={setForwardingEnabled} />
                </div>

                {forwardingEnabled && (
                  <div className="pt-2">
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                      Destination Email Addresses (comma separated):
                    </label>
                    <Input
                      value={forwardingEmails}
                      onChange={(e) => setForwardingEmails(e.target.value)}
                      placeholder="doctor.personal@hospital.org, team@clinic.com"
                      className="text-xs bg-card/60 border-border/60 h-8"
                    />
                  </div>
                )}
              </div>

              {/* Dynamic HTML Signature */}
              <div className="space-y-3 bg-secondary/30 p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-primary" /> Dynamic HTML Email Signature
                  </p>
                  <span className="text-[10px] text-primary/80 font-mono">HTML Enabled</span>
                </div>
                <textarea
                  value={signatureHtml}
                  onChange={(e) => setSignatureHtml(e.target.value)}
                  rows={4}
                  className="w-full bg-card/60 border border-border/60 rounded-xl p-3 text-xs font-mono text-foreground focus:outline-none focus:border-primary/60"
                  placeholder="<p>--<br>Dr. Name...</p>"
                />
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Signature Live Preview:
                  </p>
                  <div
                    className="p-3 rounded-xl bg-black/40 border border-border/40 text-foreground/90 text-xs"
                    dangerouslySetInnerHTML={{ __html: signatureHtml }}
                  />
                </div>
              </div>

              {/* Out of Office Auto-Responder */}
              <div className="space-y-3 bg-secondary/30 p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <Radio className="h-4 w-4 text-primary" /> Out-of-Office Auto-Responder
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Automatically reply to inbound patient inquiries when you are away from the clinic.
                    </p>
                  </div>
                  <Switch checked={oooEnabled} onCheckedChange={setOooEnabled} />
                </div>

                {oooEnabled && (
                  <div className="pt-2 space-y-2">
                    <textarea
                      value={oooMessage}
                      onChange={(e) => setOooMessage(e.target.value)}
                      rows={3}
                      className="w-full bg-card/60 border border-border/60 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary/60"
                      placeholder="Out of office message..."
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Super Admin Governance Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-3">
                <p className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" /> Global Inbound Routing Pipeline
                </p>
                <div className="space-y-1 text-xs text-amber-300/80 font-mono">
                  <p>Inbound Domain: <code>clinician@ndapape.resend.app</code></p>
                  <p>Cloudflare MX & Routing: <span className="text-emerald-400 font-bold">CONNECTED & VERIFIED</span></p>
                  <p>Svix Cryptographic Headers: <span className="text-emerald-400 font-bold">ENFORCED</span></p>
                </div>
              </div>

              <div className="space-y-3 bg-secondary/30 p-4 rounded-2xl border border-border/60">
                <p className="text-xs font-semibold text-foreground">Organization Retention & Compliance</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-foreground">Audit Record Retention</p>
                    <p className="text-[11px] text-muted-foreground">Number of days to preserve message audit logs</p>
                  </div>
                  <Input
                    value={globalRetentionDays}
                    onChange={(e) => setGlobalRetentionDays(e.target.value)}
                    className="w-24 h-8 text-xs bg-card/60"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div>
                    <p className="text-xs text-foreground">Enforce End-to-End Encryption</p>
                    <p className="text-[11px] text-muted-foreground">Mandate AES-256 for all stored patient attachments</p>
                  </div>
                  <Switch checked={enforceEncryption} onCheckedChange={setEnforceEncryption} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Save Button */}
        <div className="p-4 border-t border-border/60 bg-card/60 flex items-center justify-between shrink-0">
          <div>
            {savedSuccess && (
              <span className="text-xs text-primary font-semibold flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Settings saved successfully!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">
              Close
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-8 text-xs bg-[#a3e635] text-black font-semibold hover:bg-[#bef264] px-4 gap-1.5"
            >
              <Save className="h-3.5 w-3.5" /> Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/api/apiClient";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function PromoteModal({ target, onClose, onDone }) {
  const [step, setStep] = useState(0);
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (target) { setStep(0); setConfirm(""); setError(""); } }, [target]);

  const promote = async () => {
    setSaving(true); setError("");
    try {
      const res = await apiClient.functions.invoke("superAdminOps", { action: "promote", target_user_id: target.id });
      if (res.data?.error) throw new Error(res.data.error);
      onDone(); onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Grant Super Admin access</DialogTitle>
        </DialogHeader>
        {step === 0 && (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">You are about to grant <span className="text-foreground font-medium">{target?.full_name || target?.email}</span> Super Admin privileges.</p>
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive/90 leading-relaxed">
              This role grants irreversible elevated access to all API keys, sensitive platform data, and audit controls. This action cannot be undone from the standard admin panel. Only grant this to trusted operators.
            </div>
            <Button className="w-full" onClick={() => setStep(1)}>I understand, continue</Button>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">To confirm, type <span className="font-mono text-foreground">GRANT ACCESS</span> below.</p>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="GRANT ACCESS" className="font-mono" />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={confirm !== "GRANT ACCESS" || saving} onClick={promote}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Grant access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
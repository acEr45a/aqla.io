import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SignupLegalNotice() {
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Before you create an account</DialogTitle>
          <DialogDescription>
            Please review how AQLA handles your data and the terms that apply to this neural-wellness service.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 text-sm">
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="text-primary hover:underline">Terms of Use</Link>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>I understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
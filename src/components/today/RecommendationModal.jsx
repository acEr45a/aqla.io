import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiClient } from "@/api/apiClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Stethoscope, Check, X } from "lucide-react";

// Surfaces active clinician recommendations as a pop-up on the member dashboard.
export default function RecommendationModal() {
  const [rec, setRec] = useState(null);
  const [open, setOpen] = useState(false);
  const [acting, setActing] = useState(false);

  const load = async () => {
    try {
      // Scope to the signed-in member: clinicians/admins can read all
      // recommendations, so an unscoped query would surface other members'.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const me = { id: session.user.id };
      const list = await apiClient.entities.MemberRecommendation.filter(
        { status: "active", user_id: me.id },
        "-created_date",
        1
      );
      if (list && list.length) {
        setRec(list[0]);
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (status) => {
    if (!rec || acting) return;
    setActing(true);
    try {
      await apiClient.entities.MemberRecommendation.update(rec.id, { status });
      setRec(null);
      setOpen(false);
    } catch {
      /* ignore */
    }
    setActing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !acting) act("acknowledged"); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {rec?.title || "A new recommendation from your clinician"}
              </DialogTitle>
              <DialogDescription className="text-xs">From your AQLA clinician</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <p className="text-sm text-foreground/90 leading-relaxed">{rec?.message}</p>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" disabled={acting} onClick={() => act("dismissed")}>
            <X className="w-4 h-4 mr-1" /> Dismiss
          </Button>
          <Button size="sm" disabled={acting} onClick={() => act("acknowledged")}>
            <Check className="w-4 h-4 mr-1" /> Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
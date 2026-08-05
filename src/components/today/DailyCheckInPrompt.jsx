import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { localDateKey } from "@/lib/dateKey";
import CheckInDialog from "@/components/today/CheckInDialog";

export default function DailyCheckInPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const today = localDateKey();
    const promptKey = `aqla-daily-check-in-prompt-${today}`;
    if (localStorage.getItem(promptKey)) return;

    base44.entities.DailyCheckIn.filter({ date: today, valid: { $ne: false } }, "-created_date", 1).then((rows) => {
      if (rows.length) return;
      localStorage.setItem(promptKey, "shown");
      setOpen(true);
    });
  }, []);

  const handleSaved = () => {
    window.dispatchEvent(new Event("aqla:check-in-saved"));
  };

  return <CheckInDialog open={open} onOpenChange={setOpen} onSaved={handleSaved} />;
}
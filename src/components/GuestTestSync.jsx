import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

// After login/registration, persist any baseline tests taken as a guest.
export default function GuestTestSync() {
  useEffect(() => {
    const raw = localStorage.getItem("aqla_guest_tests");
    if (!raw) return;
    const records = JSON.parse(raw);
    base44.entities.CognitiveTest.bulkCreate(records).then(() => {
      localStorage.removeItem("aqla_guest_tests");
    });
  }, []);
  return null;
}
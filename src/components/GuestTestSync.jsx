import { useEffect } from "react";
import { apiClient } from "@/api/apiClient";

// After login/registration, persist any baseline tests taken as a guest.
export default function GuestTestSync() {
  useEffect(() => {
    const raw = localStorage.getItem("aqla_guest_tests");
    if (!raw) return;
    const records = JSON.parse(raw);
    apiClient.entities.CognitiveTest.bulkCreate(records).then(() => {
      localStorage.removeItem("aqla_guest_tests");
    });
  }, []);
  return null;
}
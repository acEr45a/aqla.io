import React from "react";
import LegalPage from "@/components/legal/LegalPage";

export default function TermsOfUse() {
  return (
    <LegalPage title="Terms of Use" updated="July 28, 2026">
      <section><h2 className="text-xl text-foreground">Using AQLA</h2><p className="mt-3">AQLA provides tools to help you understand cognitive patterns, habits, and neural-wellness goals. You are responsible for the accuracy of the information you enter and for keeping your account credentials secure.</p></section>
      <section><h2 className="text-xl text-foreground">Not medical advice</h2><p className="mt-3">AQLA does not diagnose, treat, prevent, or cure any condition. Its assessments, protocols, AI responses, and educational content are for general wellness and informational purposes only. They do not replace care from a qualified clinician.</p></section>
      <section><h2 className="text-xl text-foreground">Safety</h2><p className="mt-3">Do not use AQLA to make medication decisions or delay professional care. Seek qualified medical advice for symptoms, safety concerns, or questions about supplements, interactions, or health conditions. Follow any safety prompts shown in the app.</p></section>
      <section><h2 className="text-xl text-foreground">Acceptable use</h2><p className="mt-3">Use AQLA lawfully and only for your own authorised purposes. Do not attempt to access other users’ accounts or data, interfere with the service, or use the platform to distribute harmful or unlawful material.</p></section>
      <section><h2 className="text-xl text-foreground">Updates and access</h2><p className="mt-3">We may update, improve, suspend, or discontinue parts of AQLA. Continued use after an updated version of these terms is published means you accept the revised terms.</p></section>
    </LegalPage>
  );
}
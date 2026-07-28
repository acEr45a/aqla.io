import React from "react";
import LegalPage from "@/components/legal/LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="July 28, 2026">
      <section><h2 className="text-xl text-foreground">What we collect</h2><p className="mt-3">AQLA stores the account details you provide, assessment responses, cognitive-task results, daily check-ins, protocol history, and experiment outcomes. We use this information to provide your personalised neural-wellness experience.</p></section>
      <section><h2 className="text-xl text-foreground">How we use your data</h2><p className="mt-3">Your information is used to generate Brain Map insights, personalise protocols, track progress, and provide AQLA Intelligence responses. AQLA does not sell personal data. Aggregated and anonymised information may be used to improve the product only when you enable research contribution in Settings.</p></section>
      <section><h2 className="text-xl text-foreground">Sharing and safety</h2><p className="mt-3">We limit access to your data to what is needed to operate AQLA. A reviewing clinician may only access relevant information when you enable clinician sharing or where a safety review requires it. AQLA is a neural-wellness platform and not a medical provider.</p></section>
      <section><h2 className="text-xl text-foreground">Your choices</h2><p className="mt-3">You can adjust preferences in Settings, download an export of your AQLA records, and delete your assessment, test, Brain Map, protocol, experiment, and check-in data from the Trust &amp; Data area. Deletion is permanent.</p></section>
      <section><h2 className="text-xl text-foreground">Security and changes</h2><p className="mt-3">We use reasonable safeguards to protect your information. No online service can guarantee absolute security. We may update this policy as AQLA evolves; the date above will show when it was last revised.</p></section>
    </LegalPage>
  );
}
import React from "react";
import LegalPage from "@/components/legal/LegalPage";

export default function TermsOfUse() {
  return (
    <LegalPage title="Terms of Use" updated="August 20, 2026">
      <section>
        <h2 className="text-xl text-foreground font-medium">1. Agreement to Terms</h2>
        <p className="mt-3">
          By accessing or using the AQLA web platform (<a href="https://aqla.io" className="text-primary underline">aqla.io</a>), our mobile-responsive interfaces, APIs, and the AQLA Neurological Companion Chrome Extension (collectively, the "Service"), you agree to be bound by these Terms of Use. If you do not agree to these terms, do not access or use the Service.
        </p>
      </section>

      <section>
        <h2 className="text-xl text-foreground font-medium">2. Medical &amp; Clinical Non-Diagnosis Disclaimer</h2>
        <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-foreground">
          <p className="font-semibold text-rose-400">CRITICAL MEDICAL DISCLAIMER:</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            AQLA is an investigational cognitive fitness, focus stamina, and neural-wellness companion. <strong>AQLA IS NOT A MEDICAL DEVICE AND DOES NOT PROVIDE CLINICAL MEDICAL ADVICE, PSYCHIATRIC DIAGNOSIS, PHARMACOLOGICAL PRESCRIPTIONS, OR MEDICAL TREATMENT.</strong>
          </p>
        </div>
        <p className="mt-3">
          All assessments, Brain Map scores, Cognitive Toolkit formulas, telemetry metrics, and AI Voice Companion responses are designed solely for self-directed personal wellness, habit formation, and performance optimization. They are never a substitute for direct consultation with a licensed physician, neurologist, or mental health clinician.
        </p>
        <p className="mt-2">
          Never ignore or delay professional medical evaluation due to any score, observation, or insight provided by AQLA. If you experience severe mental distress, acute cognitive impairment, or emergency symptoms, seek immediate professional medical care.
        </p>
      </section>

      <section>
        <h2 className="text-xl text-foreground font-medium">3. Companion Chrome Extension &amp; Telemetry Usage</h2>
        <p className="mt-3">
          The AQLA Neurological Companion Chrome Extension provides passive, privacy-preserving work telemetry:
        </p>
        <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-muted-foreground">
          <li><strong>On-Device Processing:</strong> Telemetry metrics (such as tab activation velocity and distraction blocklist matching) are computed exclusively on your local device.</li>
          <li><strong>No Content Inspection:</strong> The extension does not record, intercept, or analyze web page text, passwords, search queries, or form inputs.</li>
          <li><strong>Voluntary Voice Check-Ins:</strong> Microphone access is requested solely during explicit, user-initiated voice check-in sessions. You may terminate microphone streaming at any time.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl text-foreground font-medium">4. User Account &amp; Security Responsibilities</h2>
        <p className="mt-3">
          You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to immediately notify our security team at <a href="mailto:developer@aqla.io" className="text-primary underline font-mono">developer@aqla.io</a> of any unauthorized access or security breach.
        </p>
      </section>

      <section>
        <h2 className="text-xl text-foreground font-medium">5. Acceptable Use Policy</h2>
        <p className="mt-3">
          You agree not to:
        </p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Reverse engineer, decompile, or extract source algorithms from the AQLA computational engine or neural voice pipeline.</li>
          <li>Circumvent rate limits, access controls, or security barriers of our Supabase or AI edge proxy systems.</li>
          <li>Use the platform to distribute malicious scripts, harvest unauthorized user telemetry, or misrepresent clinical credentials.</li>
          <li>Rely on AQLA as a clinical diagnostic tool in medical or psychiatric facilities without formal regulatory licensing.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl text-foreground font-medium">6. User Content &amp; Data Ownership</h2>
        <p className="mt-3">
          You retain complete ownership of all daily check-in logs, journal reflections, Brain Map metrics, and voice session transcripts that you generate. By using AQLA, you grant us a limited, worldwide license solely to process, host, and render your data to deliver your personalized neural-wellness experience in accordance with our Privacy Policy.
        </p>
      </section>

      <section>
        <h2 className="text-xl text-foreground font-medium">7. Disclaimers of Warranties &amp; Limitation of Liability</h2>
        <p className="mt-3">
          The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. To the maximum extent permitted by law, AQLA disclaims all warranties, express or implied, including fitness for a particular purpose and non-infringement.
        </p>
        <p className="mt-2">
          Under no circumstances shall AQLA, its founders, engineers, or clinicians be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl text-foreground font-medium">8. Contact &amp; Legal Inquiries</h2>
        <p className="mt-3">
          For questions regarding these Terms of Use, developer API agreements, or legal notices, contact:
        </p>
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-foreground">
          <p className="font-mono text-sm">
            <strong>Developer &amp; Legal Contact:</strong> <a href="mailto:developer@aqla.io" className="text-primary underline">developer@aqla.io</a>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            AQLA Legal &amp; Developer Relations
          </p>
        </div>
      </section>
    </LegalPage>
  );
}
import React from "react";
import LegalPage from "@/components/legal/LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="August 20, 2026">
      <section>
        <h2 className="text-xl text-foreground font-medium">1. Overview & Commitment</h2>
        <p className="mt-3">
          AQLA ("we", "us", or "our") is dedicated to protecting your privacy and personal cognitive telemetry. This Privacy Policy governs your use of the AQLA web platform (<a href="https://aqla.io" className="text-primary underline">aqla.io</a>), our backend infrastructure, and the AQLA Neurological Companion Chrome Extension.
        </p>
        <p className="mt-2">
          We operate under a strict <strong>Zero Data-Broker Policy</strong>: we never sell, rent, monetize, or distribute your personal data, cognitive metrics, or browsing telemetry to third-party advertisers or data brokers.
        </p>
      </section>

      <section>
        <h2 className="text-xl text-foreground font-medium">2. Information We Collect</h2>
        <p className="mt-3">
          To provide precision neuro-performance tracking, personalized protocols, and live companion coaching, AQLA collects and processes the following categories of information:
        </p>
        
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-border/60 bg-card/50 p-4">
            <h3 className="text-base text-foreground font-medium">A. Account & Profile Information</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Your name, email address, password hash, authentication identifiers (including Google OAuth tokens via Supabase Auth), and communication preferences.
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/50 p-4">
            <h3 className="text-base text-foreground font-medium">B. Cognitive Assessments & Brain Map Data</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Questionnaire responses across core cognitive domains (Focus, Processing Speed, Memory, Cognitive Fatigue, Stress Resilience), reaction time logs, task accuracy, baseline benchmark scores, and active protocol assignments.
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/50 p-4">
            <h3 className="text-base text-foreground font-medium">C. Daily Check-Ins & Lifestyle Signals</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Self-reported numerical ratings (1–10) for mental clarity, physical energy, acute stress, and restorative sleep quality; caffeine intake amounts and timestamps; daily demand reflections; and subjective journal reflections.
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/50 p-4">
            <h3 className="text-base text-foreground font-medium">D. Companion Extension Telemetry (On-Device & Passive)</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              The AQLA Neurological Companion Chrome Extension measures work stamina and context-switching patterns using a privacy-first, on-device architecture:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-muted-foreground">
              <li><strong>Tab Switching Velocity:</strong> Frequency of active tab transitions per minute to compute cognitive fragmentation risk levels.</li>
              <li><strong>Local Distraction Detection:</strong> Active hostnames are checked in volatile memory against a local distraction blocklist (e.g., social media domains).</li>
              <li><strong>Zero Browsing History Logging:</strong> We <strong>NEVER</strong> record, inspect, log, or transmit your full URLs, browsing history, keystrokes, form inputs, or page contents.</li>
              <li><strong>Computed Focus Index:</strong> Final deterministic scores ($15–100$) and session durations are synced to your database only when you explicitly save a session debrief.</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/50 p-4">
            <h3 className="text-base text-foreground font-medium">E. Voice Companion & Microphone Data</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              When you initiate an optional, user-authorized Live Voice Check-In via the companion extension or web app, 16kHz PCM audio is captured through the Web Audio API and securely streamed in real time to our neural model pipeline. Audio streams are utilized strictly to facilitate the immediate conversation and are never stored as raw audio files. Voice transcripts and debrief summaries are stored with row-level security in your personal account.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl text-foreground font-medium">3. How We Use Your Data</h2>
        <p className="mt-3">
          Your information is used solely to power and refine your personal cognitive readiness experience:
        </p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Calculating and rendering your dynamic Brain Map visualizations.</li>
          <li>Recommending targeted protocol families (e.g., SPARK, FLOW, DRIVE, LEARN, RESET).</li>
          <li>Grounding AI Assistant and Voice Companion feedback with strict zero-hallucination guardrails.</li>
          <li>Tracking 14-day protocol cycles, recovery trajectories, and longitudinal habit progress.</li>
          <li>Maintaining encrypted session memory so your AI coach retains continuity across check-ins.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl text-foreground font-medium">4. Data Sharing & Security Architecture</h2>
        <p className="mt-3">
          We implement rigorous technical safeguards including encrypted database connections (PostgreSQL over TLS), Row-Level Security (RLS) policies isolating user records, and server-side secret management via edge proxies.
        </p>
        <p className="mt-2">
          We do not disclose your data except in the following limited situations:
        </p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li><strong>Clinician Sharing:</strong> Only if you explicitly opt-in and designate a clinical supervisor or coach.</li>
          <li><strong>Infrastructure Service Providers:</strong> Trusted cloud infrastructure vendors (Supabase for authentication/database, Google Cloud for low-latency neural speech inference) operating under strict data processing agreements.</li>
          <li><strong>Legal Compliance:</strong> Where required by valid subpoena, court order, or applicable regulatory mandate.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl text-foreground font-medium">5. Your Rights, Data Export & Deletion</h2>
        <p className="mt-3">
          You maintain full sovereignty over your data:
        </p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li><strong>Data Export:</strong> Download a full JSON/CSV archive of your check-in history, Brain Map scores, and protocol records at any time via Account Settings.</li>
          <li><strong>Permanent Deletion:</strong> You can permanently erase your assessments, check-ins, telemetry logs, and account profile directly from the Trust &amp; Data dashboard. Deletion is irreversible.</li>
          <li><strong>Conversation Purge:</strong> You may wipe AI coach memory and chat history independently without deleting your benchmark scores.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl text-foreground font-medium">6. Developer & Privacy Inquiries</h2>
        <p className="mt-3">
          For technical inquiries, bug disclosures, API verification, or data privacy requests, contact our engineering and privacy team directly:
        </p>
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-foreground">
          <p className="font-mono text-sm">
            <strong>Developer Contact:</strong> <a href="mailto:developer@aqla.io" className="text-primary underline">developer@aqla.io</a>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            AQLA Engineering &amp; Data Governance Team
          </p>
        </div>
      </section>
    </LegalPage>
  );
}
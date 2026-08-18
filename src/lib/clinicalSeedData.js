/**
 * Realistic Starter Clinical Email Seed Data
 * Automatically loaded if the inbox has no threads yet.
 */

export const STARTER_THREADS = [
  {
    id: "th-seed-1",
    subject: "Protocol Calibration & Midday Mental Energy Crash",
    participant_emails: ["elena.vance@stanford.edu", "clinician@ndapape.resend.app"],
    category: "Patient Care",
    is_starred: true,
    is_archived: false,
    is_spam: false,
    is_trashed: false,
    tags: ["SPARK Protocol", "Urgent Review", "Sleep"],
    updated_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "msg-seed-1-1",
        thread_id: "th-seed-1",
        email_id: "em-seed-1-1",
        sender_email: "elena.vance@stanford.edu",
        sender_name: "Dr. Elena Vance (Patient)",
        recipient_email: "clinician@ndapape.resend.app",
        subject: "Protocol Calibration & Midday Mental Energy Crash",
        body_html: `<p>Hello Clinician,</p>
<p>I have completed Day 12 on the SPARK protocol. My morning focus scores on the sustained attention task have improved by ~14%, which is fantastic. However, around 2:30 PM I am experiencing a pronounced cognitive slump and slight headache.</p>
<p>I have attached my continuous biometric log and the recent blood panel report for your review. Should we adjust the timing of the morning protocol actions or incorporate a hydration electrolyte intervention?</p>
<p>Thank you,<br>Elena</p>`,
        attachments: [
          {
            name: "Elena_Vance_Biomarker_Panel_Q3.pdf",
            size: 245760,
            type: "application/pdf",
            url: "https://pdfobject.com/pdf/sample.pdf",
            previewText: "LABORATORY REPORT\nPatient: Elena Vance | DOB: 1988-04-12\nTest: Comprehensive Metabolic & Neuroendocrine Panel\n- Serum Cortisol AM: 18.2 ug/dL (Normal: 6.0-19.4)\n- Serum Cortisol PM: 9.4 ug/dL (Elevated)\n- Vitamin D (25-OH): 48 ng/mL (Optimal)\n- Fasting Glucose: 88 mg/dL (Normal)\nClinical Assessment: Mild circadian phase shift with elevated afternoon cortisol.",
          },
          {
            name: "Brain_Readiness_Heatmap_Day12.png",
            size: 184320,
            type: "image/png",
            url: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "7_Day_Hourly_Energy_Log.csv",
            size: 4096,
            type: "text/csv",
            previewText: "Timestamp,Cognitive_Score,Energy_Level,HeartRate_BPM,Focus_Depth\n2026-08-12 08:00,84,8.5,64,High\n2026-08-12 12:00,88,8.2,72,High\n2026-08-12 14:30,62,4.1,78,Low (Crash)\n2026-08-12 17:00,70,5.8,70,Moderate\n2026-08-13 08:00,86,8.6,62,High\n2026-08-13 14:30,59,3.8,81,Low (Crash)",
          },
        ],
        is_read: false,
        is_encrypted: true,
        created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "th-seed-2",
    subject: "Lab Review & Digit Span Adaptation Score (+22%)",
    participant_emails: ["marcus.chen@biotech.io", "clinician@ndapape.resend.app"],
    category: "Primary",
    is_starred: false,
    is_archived: false,
    is_spam: false,
    is_trashed: false,
    tags: ["Working Memory", "FLOW Protocol"],
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "msg-seed-2-1",
        thread_id: "th-seed-2",
        email_id: "em-seed-2-1",
        sender_email: "marcus.chen@biotech.io",
        sender_name: "Marcus Chen",
        recipient_email: "clinician@ndapape.resend.app",
        subject: "Lab Review & Digit Span Adaptation Score (+22%)",
        body_html: `<p>Hi team,</p>
<p>Just finished my weekly review on the FLOW protocol. Digit Span working memory jumped from 7 items to 9 items forwards, and reaction latency on PVT dropped to 215ms.</p>
<p>Attaching my raw test telemetry CSV for the clinician portal.</p>
<p>Best,<br>Marcus</p>`,
        attachments: [
          {
            name: "Marcus_Chen_PVT_DigitSpan_Telemetry.csv",
            size: 8192,
            type: "text/csv",
            previewText: "Trial,Paradigm,Stimulus_MS,Response_MS,Accuracy,Errors\n1,Digit_Span_Forward,1000,420,100%,0\n2,Digit_Span_Forward,1000,390,100%,0\n3,Digit_Span_Forward,1000,440,100%,0\n4,Digit_Span_Backward,1200,610,100%,0\n5,PVT_Sustained,Variable,215,Optimal,0\n6,PVT_Sustained,Variable,218,Optimal,0",
          },
        ],
        is_read: true,
        is_encrypted: true,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-seed-2-2",
        thread_id: "th-seed-2",
        email_id: "em-seed-2-2",
        sender_email: "clinician@ndapape.resend.app",
        sender_name: "Dr. Richardson (AQLA Clinician)",
        recipient_email: "marcus.chen@biotech.io",
        subject: "Re: Lab Review & Digit Span Adaptation Score (+22%)",
        body_html: `<p>Hi Marcus,</p>
<p>Outstanding progress. A 22% improvement in backward digit span indicates enhanced prefrontal cortex recruitment and working memory stabilization.</p>
<p>Let's maintain this active FLOW protocol through the end of the 30-day cycle before introducing the next cognitive stressor.</p>
<p>Best regards,<br>Dr. Richardson</p>`,
        attachments: [],
        is_read: true,
        is_encrypted: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "th-seed-3",
    subject: "AQLA Platform Diagnostic: Automatic Realtime Sync Verification",
    participant_emails: ["system-ops@aqla.io", "clinician@ndapape.resend.app"],
    category: "System Updates",
    is_starred: false,
    is_archived: false,
    is_spam: false,
    is_trashed: false,
    tags: ["System", "Compliance"],
    updated_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "msg-seed-3-1",
        thread_id: "th-seed-3",
        email_id: "em-seed-3-1",
        sender_email: "system-ops@aqla.io",
        sender_name: "AQLA Security & Ops Daemon",
        recipient_email: "clinician@ndapape.resend.app",
        subject: "AQLA Platform Diagnostic: Automatic Realtime Sync Verification",
        body_html: `<p><strong>AQLA SECURITY & AUDIT DISPATCH</strong></p>
<p>All inbound clinical channels connected to <code>clinician@ndapape.resend.app</code> are actively monitored with Svix cryptographic signature validation.</p>
<ul>
  <li>Realtime WebSocket Channels: <strong>HEALTHY (0ms jitter)</strong></li>
  <li>Attachment Encryption: <strong>AES-256 Storage Enforced</strong></li>
  <li>AI Intelligence Engine: <strong>Gemini 3.6/3.7 Ultra-Fast Latency Mode Active</strong></li>
</ul>`,
        attachments: [],
        is_read: true,
        is_encrypted: true,
        created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "th-seed-4",
    subject: "Sleep Latency & Oura Ring Integration Data",
    participant_emails: ["sarah.k@nordicneurolab.org", "clinician@ndapape.resend.app"],
    category: "Patient Care",
    is_starred: false,
    is_archived: false,
    is_spam: false,
    is_trashed: false,
    tags: ["Sleep", "Biomarkers"],
    updated_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "msg-seed-4-1",
        thread_id: "th-seed-4",
        email_id: "em-seed-4-1",
        sender_email: "sarah.k@nordicneurolab.org",
        sender_name: "Sarah Lindqvist",
        recipient_email: "clinician@ndapape.resend.app",
        subject: "Sleep Latency & Oura Ring Integration Data",
        body_html: `<p>Dear Dr. Richardson,</p>
<p>I have synced my sleep staging data from the past 14 nights. Deep sleep increased from 42 mins to 1 hour 18 mins after implementing the RESET evening protocol.</p>
<p>Attaching the sleep staging hypnogram image and summary PDF.</p>
<p>Kind regards,<br>Sarah</p>`,
        attachments: [
          {
            name: "Sarah_Sleep_Hypnogram_Staging.png",
            size: 312000,
            type: "image/png",
            url: "https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "14_Day_Sleep_Recovery_Report.pdf",
            size: 154000,
            type: "application/pdf",
            url: "https://pdfobject.com/pdf/sample.pdf",
            previewText: "SLEEP MEDICINE / NEURAL RECOVERY REPORT\nPatient: Sarah Lindqvist\nMetric: Total Sleep Time (TST), REM, N3 Deep Sleep\nBaseline N3: 42 min (Suboptimal)\nCurrent N3: 78 min (Clinically Significant Adaptation +85%)\nSleep Latency: Decreased from 38m to 14m\nRecommendation: Continue RESET supplementation and 10:00 PM digital blackout.",
          },
        ],
        is_read: true,
        is_encrypted: true,
        created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

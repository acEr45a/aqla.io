/**
 * Enterprise Clinical Email Templates & Macro Library
 * Fast 1-click injection into reply/new message composer.
 */

export const CLINICAL_TEMPLATES = [
  {
    id: "protocol_onboarding",
    name: "Protocol Onboarding & Baseline Welcome",
    category: "Onboarding",
    subject: "Welcome to your AQLA Cognitive Protocol",
    body: `<p>Dear {{patient_name}},</p>
<p>Welcome to your personalized AQLA protocol cycle. Based on your initial 7-dimension cognitive baseline and lifestyle questionnaire, we have calibrated your active protocol family to <strong>{{protocol_family}}</strong>.</p>
<p><strong>Your Key Focus Areas for this Cycle:</strong></p>
<ul>
  <li>Primary Target: Optimizing focus depth and sustained attention during morning blocks.</li>
  <li>Sleep Recovery: Implementing a 45-minute digital sunset prior to sleep latency measurement.</li>
  <li>Daily Adherence: Complete your 60-second check-in each morning to keep recommendations tuned.</li>
</ul>
<p>If you experience any sudden shifts in energy or clarity, please reply directly to this thread.</p>
<p>Warm regards,<br>{{clinician_name}}<br><em>AQLA Clinical Care Team</em></p>`,
  },
  {
    id: "lab_review",
    name: "Biomarker & Lab Review Follow-Up",
    category: "Diagnostics",
    subject: "Clinical Review: Your Recent Biomarker & Cognitive Data",
    body: `<p>Dear {{patient_name}},</p>
<p>I have reviewed the lab reports and biomarker panel you submitted. Here is our clinical summary:</p>
<p><strong>Assessment Summary:</strong></p>
<ul>
  <li>Metabolic & Micronutrient Markers: Within target therapeutic range for cognitive optimization.</li>
  <li>Cortisol Rhythm / Stress Response: Slight afternoon elevation consistent with reported midday fatigue.</li>
</ul>
<p><strong>Recommendation:</strong> We suggest delaying morning caffeine intake by 90 minutes post-wake to support natural cortisol clearance and prevent 2:00 PM energy crashes.</p>
<p>Please review the attached breakdown and let me know if you have any questions.</p>
<p>Sincerely,<br>{{clinician_name}}</p>`,
  },
  {
    id: "missed_checkin",
    name: "Adherence Check & Missed Check-In Follow-Up",
    category: "Adherence",
    subject: "AQLA Protocol Check-In: Staying on Track",
    body: `<p>Dear {{patient_name}},</p>
<p>We noticed you haven't logged your daily signals over the last couple of days. Consistent daily check-ins are crucial for our AI calibration algorithms to detect your cognitive readiness patterns.</p>
<p>Could you take 60 seconds today to log your clarity, sleep quality, and current mental energy?</p>
<p><a href="{{dashboard_url}}" style="color: #a3e635; font-weight: bold;">Log Today's Check-In Now &rarr;</a></p>
<p>We are here to support your progress.</p>
<p>Best regards,<br>{{clinician_name}}</p>`,
  },
  {
    id: "cognitive_reassessment",
    name: "Cognitive Re-Assessment Invitation",
    category: "Evaluation",
    subject: "Time for Your 30-Day Cognitive Re-Assessment",
    body: `<p>Dear {{patient_name}},</p>
<p>You have completed 30 consecutive days on your active protocol! It is now time to measure your cognitive adaptations.</p>
<p>Your 30-day reassessment battery includes:</p>
<ul>
  <li>Digit Span (Working Memory & Processing)</li>
  <li>Psychomotor Vigilance Task (Sustained Attention & Reaction)</li>
  <li>Pattern Recognition (Cognitive Flexibility)</li>
</ul>
<p>Please allocate approximately 10 uninterrupted minutes in a quiet environment to complete the battery.</p>
<p>Looking forward to reviewing your neural improvements!</p>
<p>Warmly,<br>{{clinician_name}}</p>`,
  },
  {
    id: "clinical_note_export",
    name: "Formal Clinician SOAP Note Format",
    category: "Documentation",
    subject: "Clinical Documentation / Chart Note",
    body: `<p><strong>CLINICAL CONSULTATION & MANAGEMENT NOTE</strong></p>
<p><strong>Patient ID:</strong> {{patient_id}} | <strong>Date:</strong> {{current_date}}</p>
<p><strong>SUBJECTIVE (S):</strong> Patient reports progressive improvement in mental energy with intermittent afternoon focus attenuation.</p>
<p><strong>OBJECTIVE (O):</strong> 7-Day Cognitive Readiness Average: 78%. Sustained Attention Paradigm Score: 84th percentile. Sleep Recovery Score: 7.8/10.</p>
<p><strong>ASSESSMENT (A):</strong> Stable cognitive profile with mild circadian rhythm desynchronization.</p>
<p><strong>PLAN (P):</strong> Maintain SPARK protocol. Incorporate 15-minute natural light exposure within 30 minutes of waking. Follow-up in 14 days.</p>`,
  },
];

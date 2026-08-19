# AQLA Platform: Comprehensive Clinical, Neuro-Performance & Technical Architecture Reference

> **AQLA (aqla.io)** is an evidence-based precision cognitive health, neuroplasticity optimization, and clinical intelligence platform. This document provides an exhaustive, machine-readable reference designed for Large Language Models (LLMs) and intelligent agents interacting with, indexing, or analyzing the AQLA platform.

---

## Table of Contents
1. [Platform Overview & Clinical Mission](#1-platform-overview--clinical-mission)
2. [Neuroscience Framework & 5 Cognitive Domains](#2-neuroscience-framework--5-cognitive-domains)
3. [Cognitive Scoring & Readiness Mathematical Model](#3-cognitive-scoring--readiness-mathematical-model)
4. [Adaptive Protocol Families & Phase Progression](#4-adaptive-protocol-families--phase-progression)
5. [Psychometric & Gamified Cognitive Test Battery](#5-psychometric--gamified-cognitive-test-battery)
6. [3D Brain Topography & Neural Visualization Engine](#6-3d-brain-topography--neural-visualization-engine)
7. [Clinical Messaging & Governance Suite](#7-clinical-messaging--governance-suite)
8. [Automated Clinical PDF Engine (Fable Architecture)](#8-automated-clinical-pdf-engine-fable-architecture)
9. [Safety Screening, Contraindications & Crisis Triage](#9-safety-screening-contraindications--crisis-triage)
10. [Technical Stack, Data Flow & Security Standards](#10-technical-stack-data-flow--security-standards)
11. [Complete Application Route Directory & User Journeys](#11-complete-application-route-directory--user-journeys)

---

## 1. Platform Overview & Clinical Mission

AQLA bridges the gap between clinical neuropsychology, real-time lifestyle telemetry, and personalized neuroplasticity protocols. The system is architected to:
- Continuously quantify user cognitive state across five fundamental brain domains.
- Deliver personalized, non-pharmacological neuroplasticity protocols based on daily biological readiness.
- Facilitate high-trust collaboration between patients and licensed neuro-specialists through encrypted communication, data-grounded clinical AI assistants, and standardized medical reports.
- Empower individuals with actionable self-advocacy data, longitudinal trend analytics, and gamified cognitive resilience training.

---

## 2. Neuroscience Framework & 5 Cognitive Domains

AQLA maps cognitive capacity into five core neuro-functional domains:

| Domain | Neurobiological Substrate | Assessment Metrics | Clinical Relevance |
| :--- | :--- | :--- | :--- |
| **Focus & Attention Depth** | Dorsal Attention Network (DAN), Prefrontal Cortex (PFC), Locus Coeruleus | Sustained vigilance, distraction resistance, target discrimination | Attentional drift, ADHD management, flow-state induction. |
| **Working Memory & Recall** | Dorsolateral Prefrontal Cortex (dlPFC), Posterior Parietal Cortex, Hippocampal loop | N-Back span, Corsi spatial capacity, digit recall | Information retention, multi-variable problem solving. |
| **Executive Control** | Anterior Cingulate Cortex (ACC), Frontoparietal Control Network | Stroop interference resolution, response inhibition, error recovery | Cognitive flexibility, impulsive response mitigation, task switching. |
| **Processing Speed** | Cortical myelination, thalamocortical pathways | Choice reaction time, Trail Making completion latency | Neural efficiency, mental fatigue velocity, acute neuro-recovery. |
| **Cognitive Resilience** | Ventromedial PFC, Amygdala-PFC connectivity, Autonomic Nervous System | Performance stability under cognitive load, post-stress recovery | Burnout resistance, emotional regulation under pressure. |

---

## 3. Cognitive Scoring & Readiness Mathematical Model

### 3.1 Daily Readiness Score ($R$)
Daily readiness is evaluated on a 0–100 scale computed from multi-variable subjective and objective inputs collected during morning check-ins:
- **Sleep Quality & Duration ($S$)**: Weighted 30%
- **Physical & Mental Energy ($E$)**: Weighted 25%
- **Subjective Mood & Stress Load ($M$)**: Weighted 20%
- **Cognitive Clarity / Focus Baseline ($C$)**: Weighted 25%

$$\text{Readiness Index } (R) = 0.30 \cdot S + 0.25 \cdot E + 0.20 \cdot M + 0.25 \cdot C$$

- **Optimal Readiness ($80 - 100$)**: Full intensity cognitive load; activation protocols recommended.
- **Moderate Readiness ($60 - 79$)**: Maintenance load; balanced focus sessions with structured recovery.
- **Low / Recovery Needed ($< 60$)**: Autonomic stabilization; down-regulation, parasympathetic breathwork, restorative sleep protocols.

### 3.2 Domain Score Normalization
Cognitive test scores are normalized against peer percentiles ($0 - 100$) utilizing standardized Z-score transformation:
$$Z = \frac{X - \mu}{\sigma}, \quad \text{Domain Score} = \text{clamp}\left(50 + 15 \cdot Z, 0, 100\right)$$

### 3.3 Primary Bottleneck Identification
The platform continuously detects the lowest-performing domain relative to baseline, flagging it as the **Primary Clinical Bottleneck** to target high-yield daily interventions.

---

## 4. Adaptive Protocol Families & Phase Progression

AQLA delivers structured, multi-week protocols tailored to cognitive goals and readiness states:

1. **SPARK (Morning Activation & Dopaminergic Prime)**:
   - *Goal*: Fast-track morning alertness, circadian alignment, and focus readiness.
   - *Interventions*: 500ml hydration with electrolytes, 10 minutes 10,000+ lux optical photon intake, 4-7-8 parasympathetic resetting breathwork.
2. **RESTORE (Neuro-Recovery & Sleep Optimization)**:
   - *Goal*: Glymphatic clearance enhancement, evening autonomic down-regulation.
   - *Interventions*: Blue-spectrum light attenuation, temperature manipulation, non-sleep deep rest (NSDR).
3. **HYPERFOCUS (Deep Work & Sustained Attention)**:
   - *Goal*: Maximizing dorsal attention network endurance and distraction suppression.
   - *Interventions*: 90-minute ultradian block structuring, binaural gamma stimulation, environmental cue isolation.
4. **NEUROSHIELD (Cognitive Resilience & Stress Adaptation)**:
   - *Goal*: Amygdala-PFC balance, acute cortisol buffering, cognitive endurance under pressure.
   - *Interventions*: Box breathing under cognitive demand, dual-task physical-mental challenges.
5. **FLOW (Executive Function & Creative Integration)**:
   - *Goal*: Frontoparietal flexibility, divergent thinking, fluid task-switching.
   - *Interventions*: Unstructured active reflection, cross-domain problem sets.

---

## 5. Psychometric & Gamified Cognitive Test Battery

AQLA features five core interactive cognitive test modules:

1. **Reaction Time Challenge**: Tests simple and choice latency to millisecond precision; measures baseline motor-processing efficiency.
2. **Dual N-Back**: Dual auditory and visual working memory expansion; validates working memory updates and hippocampal loading.
3. **Stroop Color-Word Interference**: Evaluates inhibitory control, conflict detection, and ACC executive regulation.
4. **Trail Making (Part A & B)**: Evaluates visual search speed, sequential scanning, and mental flexibility.
5. **Corsi Block-Tapping**: Visuospatial short-term and working memory span calibration.

---

## 6. 3D Brain Topography & Neural Visualization Engine

The AQLA BrainMap features a real-time WebGL/Three.js interactive neural scene:
- **Neural Topography**: A dense point-cloud mesh visualizing distinct anatomical regions (Prefrontal Cortex, Parietal Lobe, Temporal Lobe, Occipital Lobe, Cerebellum).
- **Dynamic Color Mapping**: Color vertices reflect real-time domain scores:
  - *Lime / Chartreuse (`#a3e635`)*: Optimal performance ($> 80$).
  - *Cyan / Blue*: Moderate baseline ($60 - 79$).
  - *Amber / Coral*: Limiting bottleneck ($< 60$).
- **Orbital Manipulation & Focus Inspection**: Interactive rotation, zoom, and regional telemetry drill-down.

---

## 7. Clinical Messaging & Governance Suite

The Clinical Inbox is an enterprise-grade, high-contrast, dark-mode workspace at `/inbox` and `/clinician/inbox`:
- **Realtime Synchronization**: Live thread and message persistence over Supabase Realtime channels.
- **Patient Context Integration**: Clinicians drafting or reading messages automatically view recipient health profiles, active protocol status, readiness averages, and domain scores.
- **AI Intelligence Suite**: Integrated Gemini-powered thread summarizer, context-grounded smart reply chips, and soap-note draft composer.
- **In-App Record Previewer**: Native rendering for embedded clinical records including vector PDFs, medical imaging (zoom/rotate), CSV tables, and JSON scorecards.
- **Clinical Governance**: Super-admin audit telemetry, configurable retention policies, and cryptographic webhook verification for external routing.

---

## 8. Automated Clinical PDF Engine (Fable Architecture)

AQLA utilizes an in-memory client-side PDF engine (`fableCore.js`, `fableDaily.js`, `fableWeekly.js`, `fablePeriod.js`) generating vector PDF reports:
- **Daily Clinical Action Plan**: Summary of target protocol, scheduled interventions, contraindications, and domain focus.
- **7-Day Readiness & Trend Report**: Comprehensive multi-page clinical dossier incorporating adherence dashboards, domain radar visualizations, readiness trend lines, and clinical insight bullets.
- **Zero-Storage In-Memory Delivery**: PDFs are generated as memory blobs / base64 data URIs, supporting instant local viewing, direct printing, or 1-click email attachment without persisting PHI to unencrypted third-party storage.

---

## 9. Safety Screening, Contraindications & Crisis Triage

AQLA strictly adheres to proactive clinical safety protocols:
- **Pre-Enrollment Safety Screening**: Identifies cardiovascular risks, seizure histories, severe sleep disorders, and psychotropic medication interactions before prescribing protocols.
- **Automated Contraindication Routing**: If a user reports acute distress, severe dizziness, or contraindicated symptoms during daily check-ins, high-intensity protocols are instantly locked and replaced with gentle recovery protocols.
- **Crisis Escalation Protocols**: Automated UI prompts with local and national crisis helpline routing (e.g., 988 Suicide & Crisis Lifeline) when acute clinical risk flags are detected.

---

## 10. Technical Stack, Data Flow & Security Standards

- **Frontend Architecture**: React 18, Vite, Tailwind CSS with custom HSL dark-mode tokens, Lucide icons, Three.js / WebGL.
- **Backend & Database**: Supabase PostgreSQL with strict Row-Level Security (RLS) policies ensuring users can only read/write their own records.
- **Realtime Infrastructure**: PostgreSQL publication channels enabling sub-100ms multi-device synchronization.
- **AI Privacy & Grounding**: LLM calls are orchestrated with strictly minimal clinical context tokens, ensuring zero model training on patient telemetry and zero exposure of sensitive administrative keys.

---

## 11. Complete Application Route Directory & User Journeys

| Route | Name | Target Role | Key Capabilities |
| :--- | :--- | :--- | :--- |
| `/` | Landing Page | Public | Interactive neural visualizer, platform capabilities, value proposition, instant auth bypass. |
| `/science` | Evidence Library | Public | Peer-reviewed research citations, methodology papers, cognitive science evidence. |
| `/safety-screening` | Safety Screening | Public / User | Contraindication assessments, risk triage, protocol safety guidelines. |
| `/trust` | Trust & Security | Public | Privacy policies, compliance posture, data encryption standards. |
| `/start` | Onboarding Flow | New User | Initial baseline cognitive questionnaire, protocol family recommendation. |
| `/today` | Daily Dashboard | Patient | Daily readiness check-in, active protocol steps, daily brain tip, quick cognitive games. |
| `/brainmap` | 3D Brain Map | Patient | Interactive WebGL neural topography, domain scorecards, bottleneck analysis. |
| `/assessment` | Cognitive Test Hub | Patient | Full psychometric testing suite (Reaction Time, N-Back, Stroop, Trail Making). |
| `/protocols` | Protocol Catalog | Patient | Explore and activate neuroplasticity protocols (SPARK, RESTORE, HYPERFOCUS, etc.). |
| `/protocol/:id` | Protocol Detail | Patient | Detailed day-by-day intervention calendar, phase tracking, milestone history. |
| `/progress` | Longitudinal Analytics| Patient | 7-day, 30-day, and 90-day readiness and domain trends, adherence statistics. |
| `/coach` | AI Health Coach | Patient | Voice and text-enabled conversational cognitive performance assistant. |
| `/inbox` | Clinical Inbox | Patient / Clinician | Gmail-inspired dark workspace, secure messaging, patient data attachments. |
| `/clinician` | Clinician Portal | Clinician | Patient cohort dashboard, clinical flags triage, direct protocol adjustment. |
| `/admin` | Admin Console | Administrator | Platform health metrics, super-admin audit log, system settings. |

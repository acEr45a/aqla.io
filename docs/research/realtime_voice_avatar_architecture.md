# Real-Time Conversational Voice Avatar: Architecture & Free/Hobby Tier Research

## Executive Summary
This document outlines the architectural blueprint for integrating an **interactive, real-time lip-syncing AI woman / coach** into the AQLA Voice Check-In. The system leverages AQLA's existing **Vercel AI Gateway** (`https://ai-gateway.vercel.sh/v1`) for sub-200ms LLM intelligence, combined with **free/hobby-tier speech and avatar engines** to deliver a zero-cost or near-zero-cost real-time conversational experience.

---

## 1. System Pipeline & Latency Budget

```
[ User Speaks ]
       │
       ▼ (0ms - local client)
1. Web Speech Recognition (continuous SpeechRecognition stream)
       │
       ▼ (~150ms - 250ms streaming TTFT)
2. Vercel AI Gateway (deepseek/deepseek-v3.1 or gemini-2.5-flash)
       │
       ▼ (~50ms - 100ms)
3. Neural TTS / Speech Synthesis
       │
       ├──► Web Audio API AnalyserNode (frequency & volume extraction)
       │
       ▼ (<30ms client-side / <300ms WebRTC)
4. Real-Time Lip-Syncing Avatar Face
   - Mode A: Three.js / WebGL 52 ARKit Blendshapes (100% Free Forever)
   - Mode B: Simli WebRTC Video Stream (50 Free Min / Month)
```

**Target Glass-to-Glass Latency:** **<450ms**, enabling natural, human-like turn-taking without awkward pauses.

---

## 2. Model & Service Evaluation

### A. The Brain: Vercel AI Gateway (Already Integrated)
- **Endpoint:** `https://ai-gateway.vercel.sh/v1/chat/completions`
- **Assigned Models:**
  - `deepseek/deepseek-v3.1`: $0.25/M tokens in, $0.95/M tokens out. A 5-turn voice check-in costs ~$0.0001 (effectively free).
  - `google/gemini-2.5-flash`: Ultra-fast streaming generation.
- **Protocol:** Server-Sent Events (`stream: true`) through Supabase Edge Functions (`ai-run` / `aqla-ops`).

### B. The Ears (Speech-to-Text):
1. **Web Speech API (`webkitSpeechRecognition`):**
   - **Cost:** 100% FREE.
   - **Latency:** 0ms network latency (processed on-device in modern Chromium/Safari).
   - **Interruption Support:** Instant. User speech immediately halts audio playback.
2. **Groq Whisper Large V3 (Alternative Cloud Tier):**
   - **Cost:** Free tier allows **200,000 audio seconds per hour** and 300 RPM.
   - **Latency:** ~120ms.

### C. The Voice (Text-to-Speech):
1. **Kokoro-82M (Client-Side ONNX / WebGPU):**
   - **Cost:** 100% FREE & Open Source (Apache 2.0).
   - **Voice Quality:** Studio-grade natural female voices (`af_bella`, `af_sky`, `af_sarah`).
   - **Runtime:** Runs in-browser via `kokoro-js` with WebGPU acceleration.
2. **Browser Native SpeechSynthesis:**
   - **Cost:** 100% FREE, 0 dependencies, instant playback.

### D. The Face (Lip-Syncing Avatar):
1. **Procedural 3D WebGL / Canvas Mesh (TalkingHead & ARKit Visemes):**
   - **Cost:** $0.00 / month forever, unlimited users and minutes.
   - **Tech:** Three.js (already in AQLA dependencies: `@react-three/fiber`, `three`).
   - **Lip-Sync:** Audio frequency binning maps volume to vowel visemes (`viseme_aa`, `viseme_O`, `viseme_E`, `viseme_rest`).
2. **Simli WebRTC (Hobby Free Tier):**
   - **Cost:** 50 free minutes per month top-up.
   - **Tech:** WebRTC video stream over LiveKit / simple peer connection.
   - **Visual:** Photorealistic AI-generated portrait of an AQLA female neuroscientist.
3. **Tavus CVI (Hobby Free Tier):**
   - **Cost:** 20–25 free minutes of Conversational Video Interface.
   - **Visual:** Photorealistic interactive video avatar with bidirectional WebRTC.

---

## 3. Recommended Phased Implementation

1. **Phase 1 (Immediate Zero-Cost Baseline):**
   - Deploy `LipSyncAvatar.jsx` using client-side Web Audio API audio analysis + Three.js / Canvas procedural female avatar face.
   - 100% free, 60fps smooth animation, zero streaming costs, zero third-party video subscriptions.
2. **Phase 2 (Cloud Photorealistic Upgrade):**
   - Add optional WebRTC hook for Simli (`SIMLI_API_KEY`) to allow toggling between the procedural 3D neural avatar and photorealistic video.

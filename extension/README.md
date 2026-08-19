# Aqla Neurological Companion — Chrome Extension (Manifest V3)

A production-grade Manifest V3 companion Chrome Extension for [aqla.io](https://aqla.io) featuring:
- **Persistent Side Panel (`chrome.sidePanel`)** with seamless action click trigger.
- **Privacy-First Background Telemetry**: 100% on-device detection of context switches, time-normalized switch velocity, and local distraction pattern matching.
- **Zero-Hallucination Guardrails**: Deterministic JavaScript math for Focus Index ($15 - 100$) and cognitive fragmentation velocity.
- **Real-Time Gemini Live Voice Companion**: Zero-latency, bidirectional 16kHz PCM audio stream with instant barge-in support and pulsing neural orb visualizer.
- **In-Sidebar Dual Authentication**: Email/Password + Google OAuth via `chrome.identity.launchWebAuthFlow` and persistent `chrome.storage.local` session adapter.
- **Unified Data Model**: Saves check-in snapshots and telemetry metrics directly to Supabase (`daily_check_ins` / `check_ins`).

---

## 📁 Package Structure

```
extension/
├── manifest.json                  # Manifest V3 configuration with strict CSP & permissions
├── background.js                  # Background worker: distraction detection, switch rate, badge alerts
├── sidepanel.html                 # UI shell: Onboarding, Dual Auth, Telemetry Dashboard, Voice Orb, Debrief
├── sidepanel.css                  # Dark-mode styling (#0f172a, #3b82f6, #10b981, #f43f5e)
├── sidepanel.js                   # Application coordinator & state manager
├── src/
│   ├── lib/
│   │   ├── supabaseClient.js      # Supabase client with chrome.storage adapter & WebAuthFlow
│   │   └── telemetryEngine.js     # Deterministic mathematical formulas for Focus Index
│   └── voice/
│       ├── audioStreamer.js       # Web Audio API 16kHz capture & 24kHz playback queue + barge-in
│       └── geminiLiveClient.js    # Gemini Live WebSocket client (setup payload + bidi audio)
├── lib/
│   └── supabase-js.min.js         # Local ESM bundle of @supabase/supabase-js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🚀 Loading in Chrome (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top-right toggle.
3. Click **Load unpacked**.
4. Select the `extension/` directory from this repository.
5. Click the extension puzzle icon in your browser toolbar and pin **Aqla Companion**.
6. Click the extension icon to open the persistent side panel!

---

## 🛡️ Chrome Web Store Review Justifications

When submitting to the Chrome Developer Dashboard, use the following justification statements for your permissions:

| Permission | Store Justification Statement |
|---|---|
| `sidePanel` | Provides a persistent workspace companion allowing users to view focus metrics and check in without leaving their current tab. |
| `storage` | Persists user authentication sessions and locally computed daily focus benchmarks across browser restarts. |
| `activeTab` / `tabs` | Reads the active tab hostname strictly in memory to match against a local distraction blocklist (e.g. social media). **No browsing history or page content is ever recorded, stored, or transmitted.** |
| `identity` | Required exclusively to allow users to sign in with their Google account via secure OAuth 2.0 WebAuthFlow. |
| `audioCapture` | Captures microphone input strictly during explicit, user-initiated voice check-in sessions with the AI coach. Audio tracks are released immediately upon session end. |
| `alarms` | Schedules lightweight local telemetry aggregation intervals. |

---

## 🧠 Zero-Hallucination Verification

To guarantee that no numbers or metrics are fabricated by the AI:
1. **Focus Index Formula**:
   $$F = \max\left(15, 100 - \left(\frac{\text{switches}}{\text{active minutes}} \times 8\right) - (\text{distraction switches} \times 6)\right)$$
2. **Deterministic Setup Frame**: During the Gemini Live WebSocket handshake, the system prompt is strictly injected with pre-calculated numbers and commanded with `temperature: 0.1` to interpret only provided telemetry JSON.

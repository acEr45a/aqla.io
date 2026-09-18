<p align="center">
  <img src="public/images/aqla-logo.svg" width="72" height="72" alt="AQLA Logo" />
</p>

<h1 align="center">AQLA</h1>

<p align="center">
  <b>Personal Brain Operating System & Precision Cognitive Performance Platform</b>
</p>

<p align="center">
  <img src="public/images/aqla-banner.jpg" width="100%" alt="AQLA Neural Brand Banner" />
</p>

---

## Overview

AQLA is a high-performance web platform engineered to measure, analyze, and optimize cognitive readiness. By processing reaction variance, working memory paradigms, and stress markers, AQLA builds personalized, data-driven neuroplasticity protocols designed to unlock peak mental performance.

---

## Core Capabilities

- **5-Domain Cognitive Architecture**: Continuous measurement across Focus Depth, Working Memory, Executive Control, Processing Speed, and Cognitive Resilience.
- **Adaptive Neuroplasticity Regimens**: Dynamic 7-day and 14-day protocol progressions (SPARK, RESTORE, HYPERFOCUS, NEUROSHIELD, FLOW) tailored to daily baseline scores.
- **Gamified Psychometric Battery**: Standardized assessment paradigms including Reaction Time, N-Back, Stroop Interference, Trail Making, and Corsi Block Tapping.
- **Dynamic 3D Brain Mapping**: WebGL-powered 3D neural topography visualizer showing real-time domain balance and longitudinal trends.
- **AI Intelligence Coach**: Evidence-backed conversational assistant built for cognitive readiness guidance and habit adherence.
- **Chrome Companion Extension**: Side-panel browser integration delivering micro-interventions and real-time focus prompts during active work.

---

## Documentation

Comprehensive documentation is split between product-facing guides on the web app and technical reference guides in the repository:

| Guide | Target Audience | Location |
|---|---|---|
| **Product Documentation** | Users & Overview | [aqla.io/docs](https://aqla.io/docs) |
| **System Architecture** | Developers & Engineers | [`docs/architecture.md`](docs/architecture.md) |
| **Getting Started Guide** | Local Setup & Verification | [`docs/getting-started.md`](docs/getting-started.md) |
| **Contributing Standards** | Contributors & PR Reviewers | [`docs/contributing.md`](docs/contributing.md) |

---

## Tech Stack & Infrastructure

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Three.js / React Three Fiber
- **Backend & Database**: Supabase (PostgreSQL 17, Row-Level Security, Auth, Realtime)
- **AI Infrastructure**: Vercel AI Gateway abstraction layer (`gateway.ts`) routing DeepSeek v3.1, Claude Sonnet 4.5, and OpenAI Vector Embeddings (`vector(768)`)
- **Hosting & CI/CD**: Vercel continuous deployment pipeline tied to `main` branch

---

## Getting Started Locally

### 1. Clone the repository

```bash
git clone https://github.com/aqla-io/aqla.io.git
cd aqla.io
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy `.env.example` to `.env` and populate your Supabase configuration:

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the development server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Verification & Build Script Commands

Before submitting pull requests, run verification scripts:

```bash
# Typecheck TypeScript & JavaScript configs
npm run typecheck

# Production build test
npm run build

# Code style lint check
npm run lint
```

---

## License

Private and proprietary project. All rights reserved. Unauthorized copying, modification, distribution, or commercial use is strictly prohibited.

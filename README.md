# Aqla.io

A premium personal brain operating system that analyzes your unique cognitive patterns, lifestyle, and habits to build a data-driven, evidence-informed protocol for peak mental performance.
 
---

## 📑 Table of Contents

1. [Overview](https://www.google.com/search?q=%23overview)
2. [Tech Stack & Infrastructure](https://www.google.com/search?q=%23tech-stack--infrastructure)
3. [Project Structure](https://www.google.com/search?q=%23project-structure)
4. [Development Workflow](https://www.google.com/search?q=%23development-workflow)
5. [Environment Variables](https://www.google.com/search?q=%23environment-variables)
6. [Getting Started Locally](https://www.google.com/search?q=%23getting-started-locally)

---

## 🔍 Overview

Aqla.io is a production-grade web application engineered to function as a personal brain operating system. It processes user cognitive patterns, lifestyle metrics, and daily habits to generate data-driven, evidence-informed performance protocols. 

---

## 🚀 Tech Stack & Infrastructure

* **Frontend Framework:** React / Vite styled with Tailwind CSS
* **Hosting & CI/CD:** Vercel (Automatic continuous deployments tied to the `main` branch)
* **Domain & DNS Management:** Cloudflare routing (`aqla.io`)
* **Authentication:** Google OAuth client configuration
* **UI & Component Generation:** v0 by Vercel (Isolated Pull Requests for visual updates)
* **Backend & Logic Management:** Google Antigravity (Local desktop AI execution, database structuring, and API logic)
* **Version Control:** GitHub

---

## 📁 Project Structure

```text
aqla.io/
├── public/               # Static assets, logos, and favicons
├── src/
│   ├── components/       # Reusable UI components (v0 & manual edits)
│   ├── pages/            # Main application views and routing
│   ├── hooks/            # Custom application hooks
│   ├── services/         # API integrations, Google OAuth, and core services
│   ├── App.jsx           # Root application component
│   └── main.jsx          # Application entry point
├── .env.example          # Template for environment variables
├── package.json          # Project dependencies and npm scripts
└── README.md             # Project documentation

```

---

## 🛠️ Development Workflow

This project is powered by a decentralized multi-tool setup:

1. **Frontend & Interface Updates (v0):**
* Prompt v0 to construct or update UI features.
* Review code changes inside automatically generated Pull Requests on GitHub before merging into `main`.


2. **Backend, Database & Core Logic (Google Antigravity):**
* Open the repository locally on your desktop via Google Antigravity.
* Use desktop AI agents to manage database configurations, schema migrations, and backend functions.


3. **Continuous Deployment (Vercel & Cloudflare):**
* Every successful merge into the `main` branch instantly triggers a production build on Vercel, deploying updates live to `aqla.io`.



---

## 🔐 Environment Variables

Ensure your local `.env` or `.env.local` file contains the appropriate configurations before running the app:

```env
VITE_API_URL=your_backend_api_url_here
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

```

---

## 💻 Getting Started Locally

To clone and run Aqla.io on your local machine using Google Antigravity or a terminal:

1. **Clone the repository:**
```bash
git clone <your-repository-url>
cd aqla-io

```


2. **Install dependencies:**
```bash
npm install

```


3. **Run the development server:**
```bash
npm run dev

```



---

## 📄 License

Private project. All rights reserved.

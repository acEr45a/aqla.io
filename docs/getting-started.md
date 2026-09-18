# Getting Started with AQLA

This guide covers setting up your local development environment for the AQLA application.

---

## Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: latest version

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/aqla-io/aqla.io.git
cd aqla.io
```

### 2. Environment Configuration

Copy the example environment configuration file to `.env`:

```bash
cp .env.example .env
```

Ensure your `.env` contains the required keys:

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Local Development Server

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## Verification & Build Commands

Run these checks to verify code correctness before opening pull requests:

```bash
# Type check TypeScript & JavaScript configs
npm run typecheck

# Production build verification
npm run build

# Run linter
npm run lint
```

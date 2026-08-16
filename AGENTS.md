# AGENTS.md

## Project Context

This is the aqla.io web application repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

## Key Files

- `src/`: frontend application source.
- `src/lib/supabase.js`: Supabase JS client setup.
- `src/api/apiClient.js`: API client for database entities and authentication.
- `vite.config.js`: Vite build and dev server configuration.
- `.env`: environment variables for Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## Working Notes

- Use `npm run dev` to start the local Vite development server.
- Run `npm run build` or `npm run typecheck` to verify changes before completing tasks.

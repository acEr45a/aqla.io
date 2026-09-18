# Contributing Guidelines

Thank you for your interest in contributing to AQLA. Please review these guidelines before submitting changes.

---

## Code Quality Standards

1. **Strict Type Safety**: All TypeScript and JavaScript code must pass `npm run typecheck` without errors.
2. **Clean Builds**: Production builds via `npm run build` must complete cleanly with zero compilation warnings or broken imports.
3. **Security Boundary Compliance**: Never bypass Postgres Row Level Security (RLS). Rely on server-side policies for data isolation rather than client-side filtering.
4. **Style Consistency**: Follow Tailwind CSS conventions and existing UI component patterns (`src/components/ui`).

---

## Development Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit changes with clear, descriptive commit messages.
3. Run verification commands before opening a Pull Request:
   ```bash
   npm run typecheck
   npm run build
   ```
4. Push your branch and open a Pull Request against `main`.

---

## Inter-Agent Protocol & Notebook

When working alongside AI agents in this repository, always inspect and update `AGENT_NOTEBOOK.md` to document system state changes and maintain architectural alignment.

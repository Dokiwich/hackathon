# DEVELOPMENT-WORKFLOW.md

## 1. Branching & Commit Standard
- `main`: Always deployable; triggers GitHub Pages multi-track Hub deployment via `.github/workflows/deploy-pages.yml`.
- Feature branches: `feat/<track>-<scope>`, `fix/<track>-<scope>`, `ci/<scope>`.
- Conventional Commits examples:
  - `feat(de1): add dynamic QR token countdown`
  - `fix(de2): preserve GPS permission header on Vercel`
  - `ci(deploy): add matrix verification for 4 standalone apps`

## 2. Working With AI Coding Agents
1. Read root [`AGENTS.md`](AGENTS.md) and the target track's local `<track>/AGENTS.md`.
2. Keep edits scoped strictly to the target folder unless updating shared deploy/CI automation.
3. Verify affected track(s) with `npm run build:de<N>` (or `npm run build:all` + `npm run build:gh` for root changes).

## 3. Pre-Release Checklist
- [ ] `npm run build:all` exits `0`.
- [ ] `npm run build:gh` exits `0` and produces `dist-pages/de-{1..4}/index.html` + `pitch-deck.html`.
- [ ] No `.env*`, tokens, or temporary artifacts staged (`git status` clean).

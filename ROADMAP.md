# ROADMAP.md

## Phase 1 — Multi-Track Ready Foundation (Current)
- [x] **Đề 2 (`de-2-tai-mat-cong-dan/`):** Full MVP (citizen GPS/watermark reporting, 95-ward Leaflet map, agency dispatch, SLA leaderboard, 10-slide Pitch Deck).
- [x] **Đề 1, Đề 3, Đề 4 (`de-1-*`, `de-3-*`, `de-4-*`):** Clean standalone starter skeletons preconfigured with React 18, Vite 5, Tailwind 3, Router v7, ErrorBoundary, SEO/PWA, CSP headers, ESLint 9, Vitest, and track-specific `AGENTS.md`.
- [x] **Automation:** Unified CI matrix (`lint`, `test`, `build`, `audit`), GitHub Pages Hub deploy, single-track cloud deploy (`deploy.ps1` / `deploy.sh`), and `.zip` packager (`scripts/pack.mjs`).

## Phase 2 — Competition Execution (Pick Drawn Track)
- [ ] Build the drawn track's screens and `public/pitch-deck.html` directly inside its isolated folder guided by its local `AGENTS.md` and `docs/BLUEPRINTS_4_PROJECTS.md`.
- [ ] Run `npm run verify`, `npm run pack:de<N>`, and `.\scripts\deploy.ps1 -App de<N> -Target vercel|cloudflare|gh-pages -Prod`.

## Phase 3 — Pilot Production
- [ ] Connect `<track>/src/services/` to NestJS/Fastify + PostgreSQL (+ PostGIS for Đề 2) + Cloudflare R2 + Zalo Mini App auth.

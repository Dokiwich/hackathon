# AGENTS.md — AI Coding Agent Guide (4 Standalone Tracks)

> Universal instruction file following the `agents.md` standard (compatible with GitHub Copilot, Cursor, Windsurf, Claude Code, Codex, Devin, Gemini CLI).

## 1. Repository Structure (4 Independent Folders)
Each hackathon track lives in its own standalone Vite + React 18 + Tailwind CSS 3 + React Router v7 folder. You can build, copy, package, or deploy any folder independently without touching the other 3 tracks.

| Track | Folder | Status | Local `AGENTS.md` |
|---|---|---|---|
| **Đề 1** | `de-1-so-tay-chi-doan/` | Starter Skeleton (chỉ khung cấu trúc, sẵn sàng code) | [`de-1-so-tay-chi-doan/AGENTS.md`](de-1-so-tay-chi-doan/AGENTS.md) |
| **Đề 2** | `de-2-tai-mat-cong-dan/` | Full MVP (95 xã/phường, GPS/Watermark, Leaflet, SLA, Pitch Deck) | [`de-2-tai-mat-cong-dan/AGENTS.md`](de-2-tai-mat-cong-dan/AGENTS.md) |
| **Đề 3** | `de-3-ocop-len-san/` | Starter Skeleton (chỉ khung cấu trúc, sẵn sàng code) | [`de-3-ocop-len-san/AGENTS.md`](de-3-ocop-len-san/AGENTS.md) |
| **Đề 4** | `de-4-chong-lua-101/` | Starter Skeleton (chỉ khung cấu trúc, sẵn sàng code) | [`de-4-chong-lua-101/AGENTS.md`](de-4-chong-lua-101/AGENTS.md) |

- **Market-ready full-stack blueprints for all 4 tracks:** [`docs/BLUEPRINTS_4_PROJECTS.md`](docs/BLUEPRINTS_4_PROJECTS.md)

## 2. Essential Commands (Run From Repo Root)
| Task | Command | Notes |
|---|---|---|
| Install all 4 apps | `npm run install:all` | Installs frontend dependencies in all 4 folders |
| Install all 4 backends | `npm run install:backend:all` | Installs `<track>/backend/` dependencies |
| Dev server per track | `npm run dev:de1` / `dev:de2` / `dev:de3` / `dev:de4` | Ports `5174`, `5173`, `5175`, `5176` |
| Dev backend per track | `npm run dev:api:de1` / `dev:api:de2` / `dev:api:de3` / `dev:api:de4` | Ports `4001`, `4002`, `4003`, `4004` |
| Verify all 4 tracks | `npm run verify` | Runs frontend (`lint:all`, `test:all`, `build:all`) + `verify:backend` |
| Deploy Cloudflare Pages (1 cmd) | `npm run cf:de1` / `cf:de2` / `cf:de3` / `cf:de4` | Builds & publishes `<track>/dist` to `https://<project>.pages.dev` |
| Cloudflare Quick Tunnel | `npm run tunnel:de1..de4` / `tunnel:api:de1..de4` | Exposes local FE or BE via `https://*.trycloudflare.com` |
| Package `.zip` releases | `npm run pack` (or `pack:de1`..`pack:de4`) | Outputs `release/<track>-dist.zip` & `<track>-source.zip` |
| Deploy (other hosts / custom) | `.\scripts\deploy.ps1 -App <de1..de4> -Target <cloudflare\|vercel\|netlify> -Prod` | Bash: `./scripts/deploy.sh <target> --app <de1..de4> --prod` |

## 3. Non-Negotiable Coding & Architecture Rules
1. **Track Isolation Rule:** When asked to work on a single track, ONLY read/edit inside that track's folder and obey its local `AGENTS.md`. Never bleed code or dependencies from one track into another.
2. **Subpath & SPA Safety:**
   - Every track uses `base: process.env.VITE_BASE_PATH || '/'` in `vite.config.js` and `BrowserRouter basename={import.meta.env.BASE_URL}` in `src/main.jsx`.
   - Always resolve `public/` assets (`favicon.svg`, `manifest.webmanifest`, `pitch-deck.html`) with `${import.meta.env.BASE_URL}` (or `%BASE_URL%` in `index.html`).
3. **Clean Boundaries:**
   - Frontend: UI components in `<track>/src/components/` handle rendering and interactions; move pure logic, formatters, and exporters into `<track>/src/utils/`; keep `localStorage` and HTTP adapters under `<track>/src/services/`.
   - Backend (`<track>/backend/`): strict Modular Layered Architecture (`routes -> controller -> service -> repository`) enforced by ESLint (`no-restricted-imports`) and `.cursor/rules/15-backend-architecture.mdc`. Cross-module imports must go through `index.js` only.
4. **UX/UI, Anti-AI-Slop & Accessibility (WCAG 2.2 AA):**
   - Mobile-first responsive layouts; minimum `44x44px` tap targets; proper Vietnamese diacritics (`Be Vietnam Pro` / `JetBrains Mono` + `tabular-nums`).
   - Semantic HTML (`<main>`, `<nav>`, `<button type="button">`, `<label htmlFor=...>`, descriptive `alt`).
   - Anti-AI-Slop: use each track's semantic tokens (`bg-canvas`, `bg-surface`, `bg-brand`, `border-line`) and 1 Primary CTA per view; ban purple/neon gradients, decorative emojis, and nested card clutter (details in `.cursor/rules/10-frontend-ui-ux.mdc`).
5. **Security Guardrails:**
   - Never commit `.env*` (except `.env.example`), API tokens, private keys, or credentials.
   - Never use `dangerouslySetInnerHTML`, `eval`, or `new Function` on untrusted input.
   - Escape HTML entities and CSV formula prefixes (`=`, `+`, `-`, `@`) in exports.
   - Follow [`docs/agents/security.md`](docs/agents/security.md) for all GitHub Actions and agent workflows.

## 4. Verification Before Finishing Any Change
1. If editing one track: run `npm run lint && npm test && npm run build` inside that track folder.
2. If editing shared deploy scripts, packaging scripts, or workflows: run `npm run verify` and `npm run pack`.
3. Inspect `git status` and `git diff` to ensure clean isolation and zero leaked secrets.

## 5. Reference Documents
- Architecture: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Product roadmap: [`ROADMAP.md`](ROADMAP.md)
- Architecture Decision Records: [`DECISIONS.md`](DECISIONS.md)
- Testing strategy: [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md)
- Git & Agent workflow: [`DEVELOPMENT-WORKFLOW.md`](DEVELOPMENT-WORKFLOW.md)
- CI/CD & Agent security: [`docs/agents/security.md`](docs/agents/security.md)
- Deployment & packaging guide: [`docs/DEPLOY.md`](docs/DEPLOY.md)

## 6. CodeGraph & Token Optimization
- **CodeGraph First:** If the target track has `.codegraph/`, call `codegraph_explore(projectPath="<absolute-track-path>", query="...", maxFiles=6)` BEFORE grep/read loops, and do not re-read returned files. Initialize indexes manually with `npm run codegraph:init` (or `.\scripts\init-codegraph.ps1 -App de<N>`).
- **Context-Mode:** Route long command outputs (`npm run verify`, `audit`, `docs/BLUEPRINTS_4_PROJECTS.md`) through `ctx_execute` / `ctx_index` + `ctx_search` when available.
- **Token Hygiene:** Respect `.cursorignore` / `.aiignore` — never read `package-lock.json`, `node_modules/`, `dist/`, `dist-pages/`, `release/`, `*.pdf`, or static pitch HTML unless explicitly asked; read narrow line ranges and batch independent tool calls.

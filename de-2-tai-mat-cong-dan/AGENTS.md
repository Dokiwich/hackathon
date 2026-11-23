# AGENTS.md — Đề 2: Tai Mắt Công Dân Đồng Nai

> Standalone guide for `de-2-tai-mat-cong-dan/`. Inherits root repo security and accessibility rules in `../AGENTS.md`.

## 1. Track Snapshot
- **App:** `tai-mat-cong-dan-dong-nai` — Citizen infrastructure reporting & 95-ward dispatch/SLA ranking dashboard.
- **Stack:** React 18, Vite 5, Tailwind CSS 3, React Router v7 (`basename={import.meta.env.BASE_URL}`), Leaflet `1.9.4`, Lucide React.
- **Persistence:** `localStorage` (`dong_nai_citizen_reports_v2`, `dong_nai_auth_role_v2`).

## 2. Key Files
- `src/App.jsx` — Auth switcher, report state, route guards (`/citizen`, `/map`, `/agency/dispatch`, `/dashboard`, `/login`).
- `src/components/ReportForm.jsx` — Camera capture, GPS, watermark, Leaflet pinpicker.
- `src/components/PublicMap.jsx` — Public map across 95 wards + filter & detail drawer.
- `src/components/WardDispatch.jsx` — Agency workflow & resolution proof.
- `src/components/DashboardStats.jsx` — SLA/MTTR KPIs & 95-ward leaderboard.
- `src/data/wardsData.js` & `src/data/accountsData.js` — 95 administrative units of Đồng Nai & demo accounts.
- `src/utils/watermark.js` — Client-side GPS/timestamp watermarking.
- `public/pitch-deck.html` — Served at `${import.meta.env.BASE_URL}pitch-deck.html`.

## 3. Non-Negotiable Track Rules
1. Preserve all 95 administrative units in `src/data/wardsData.js`, existing watermark logic, and `PitchDeck-Mockup/` parity.
2. Keep `geolocation=(self), camera=(self)` in `vercel.json` and `public/_headers` so mobile reporting works.
3. Resolve `public/` URLs using `import.meta.env.BASE_URL`.
4. **Design Direction (Field Civic Operations):** Preserve the existing crisp black/white/sky-blue (`#0284C7`) civic field aesthetic and Leaflet map layout; never replace it with purple SaaS gradients or generic template cards.
5. Verify edits with `npm run build` and `npm run build:gh` inside `de-2-tai-mat-cong-dan/`.
6. Backend (`backend/`): port `4002`, `docker-compose.yml` uses `postgis/postgis:16-3.4-alpine`; prepared module dirs: `auth`, `geo-routing`, `reports`, `assignments`, `sla-engine`, `analytics`.

## 4. CodeGraph & Token Optimization
- When `.codegraph/` is present, call `codegraph_explore(projectPath="d:\\hackathon\\de-2-tai-mat-cong-dan", query="...", maxFiles=6)` before running grep/read loops; skip `PitchDeck-Mockup/*.html`, `*.pdf`, and `package-lock.json` unless explicitly asked.
- `src/data/wardsData.js` (430+ lines) and `src/components/ReportForm.jsx` (800+ lines): locate exact symbols first and read only targeted line ranges (`< 150` lines).

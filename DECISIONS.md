# DECISIONS.md — Architecture Decision Records (ADR)

## ADR-001: Vite + React 18 + Tailwind CSS Across All 4 Tracks
- **Context:** Hackathon execution requires instant local HMR, consistent component patterns, and static CDN deployment.
- **Decision:** Standardize every track on React 18 + Vite 5 + Tailwind CSS 3 + React Router v7 + Lucide React.
- **Consequence:** Shared AI agent rules and build/deploy scripts work identically across all 4 folders.

## ADR-002: Subpath-Safe `BrowserRouter` via `VITE_BASE_PATH`
- **Context:** Tracks may deploy at root `/` (standalone Vercel/Cloudflare/Netlify) or under `/<repo>/de-X/` (GitHub Pages Hub).
- **Decision:** Every track configures `base: process.env.VITE_BASE_PATH || '/'` and `<BrowserRouter basename={import.meta.env.BASE_URL}>`.
- **Consequence:** Zero asset or pitch-deck 404s across both single-app and Hub deployments.

## ADR-003: Least-Privilege `Permissions-Policy` Per Track
- **Context:** Each track needs different browser hardware capabilities (Đề 2 needs GPS + Camera; Đề 4 needs neither).
- **Decision:** Configure `vercel.json` and `public/_headers` per track (`de-1`: camera; `de-2`: geolocation + camera; `de-3`: camera + microphone; `de-4`: none).
- **Consequence:** Minimal browser attack surface without breaking required UX features.

## ADR-004: Safe Client-Side Exports Without Vulnerable Sheet Parsers
- **Context:** Đề 1 requires 1-click Word and Excel-compatible reports without introducing `xlsx` prototype-pollution CVEs.
- **Decision:** Implement pure UTF-8 BOM `.csv` with formula-injection escaping (`'`), and HTML-escaped `.doc` Word export in `de-1-so-tay-chi-doan/src/utils/reportExport.js`.
- **Consequence:** Zero high-severity npm audit warnings and full Vietnamese diacritic support in Microsoft Word/Excel.

## ADR-005: Multi-Target Auto-Deploy (Portal Hub or Single Track)
- **Context:** Organizers or judges may need a single URL showing all 4 apps, or a dedicated URL for one specific track.
- **Decision:** `scripts/build-all-pages.mjs` bundles all 4 apps into `dist-pages/`, while `scripts/deploy.ps1`, `scripts/deploy.sh`, and `deploy-cloud.yml` accept `-App all|de1|de2|de3|de4`.
- **Consequence:** Flexible instant deployment for any competition draw outcome.

## ADR-006: 4 Independent Folders Over a Tightly Coupled Monorepo Workspace
- **Context:** Any track folder may be extracted into its own standalone repository or deployed via Vercel/Cloudflare Root Directory after the draw.
- **Decision:** Keep each track self-contained with its own `package.json`, `package-lock.json`, `vite.config.js`, `AGENTS.md`, and `public/pitch-deck.html`.
- **Consequence:** Zero dependency conflicts (`leaflet` only in Đề 2, `qrcode` only in Đề 1) and clean folder extraction at any time.

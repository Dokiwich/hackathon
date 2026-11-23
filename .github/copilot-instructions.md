# GitHub Copilot Repository Instructions

Follow root [`AGENTS.md`](../AGENTS.md) and the active track's `<track>/AGENTS.md`.

## Multi-Track Workspace
The repo contains 4 independent React 18 + Vite 5 + Tailwind CSS 3 + React Router v7 + Lucide React apps:
- `de-1-so-tay-chi-doan/` (Youth Union management, dynamic QR, Word/CSV export)
- `de-2-tai-mat-cong-dan/` (95-ward citizen reporting, Leaflet map, GPS/watermark)
- `de-3-ocop-len-san/` (OCOP 3-tap seller app, Video Studio, affiliate network, 90-day pilot)
- `de-4-chong-lua-101/` (Anti-scam simulation game/chatbot, Canvas PNG certificate)

## Key Rules for Every Suggestion
1. **Track Isolation:** Keep code, packages, and domain logic strictly inside the track being edited.
2. **Vietnamese UI Quality:** Keep all labels, errors, empty states, and accessibility labels in natural Vietnamese with full diacritics.
3. **Subpath Compatibility:** Always resolve `public/` assets via `import.meta.env.BASE_URL` and keep `BrowserRouter` `basename={import.meta.env.BASE_URL}`.
4. **Clean Separation:**
   - Frontend: keep UI views in `src/components/`, datasets in `src/data/`, and pure utilities in `src/utils/`.
   - Backend (`<track>/backend/`): follow [`instructions/backend-api.instructions.md`](instructions/backend-api.instructions.md) — strict `routes -> controller -> service -> repository` layers and cross-module imports via `index.js` only.
5. **Accessibility, Anti-AI-Slop & Security:** Follow WCAG 2.2 AA (`>= 44px` tap targets, semantic HTML) and [`instructions/ui-ux-accessibility.instructions.md`](instructions/ui-ux-accessibility.instructions.md) (use per-track semantic tokens `canvas`/`surface`/`brand`, max 1 Primary CTA per view, zero purple/neon gradients or decorative emojis); never embed secrets in `VITE_*` variables, never use `dangerouslySetInnerHTML` on untrusted data, and keep per-track `vercel.json` / `_headers` policies intact.
6. **CodeGraph & Token Efficiency:** Follow [`instructions/token-codegraph.instructions.md`](instructions/token-codegraph.instructions.md) — use `codegraph_explore` scoped to the active track if `.codegraph/` exists, route heavy outputs through `context-mode`, and skip `package-lock.json`, `*.pdf`, and `dist/`.
7. **Verification:** Run `npm run build` in the modified track (and `npm run build:all` + `npm run build:gh` when modifying root deploy/CI files).

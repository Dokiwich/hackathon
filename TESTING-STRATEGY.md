# TESTING-STRATEGY.md

## 1. Current Verification Baseline (All 4 Tracks)
Every PR and local edit must pass:
1. **Individual Production Builds:** `npm run build:all` builds `de-1`, `de-2`, `de-3`, `de-4` independently with exit code `0`.
2. **Portal Hub & Subpath Build:** `npm run build:gh` (`node scripts/build-all-pages.mjs`) generates `dist-pages/index.html`, `dist-pages/404.html`, and `dist-pages/de-{1,2,3,4}/` with rewritten `/<base>/de-X/assets/*` paths and `pitch-deck.html`.
3. **Deploy Script Syntax Checks:**
   - PowerShell AST parser on `scripts/deploy.ps1` → `0` parse errors.
   - `bash -n scripts/deploy.sh` → exit `0`.
   - `node --check scripts/build-all-pages.mjs` and each `de-*/scripts/build-pages.mjs` → exit `0`.

## 2. Per-Track Smoke Tests Before Demo
- **Đề 1 (`de-1`):** Add member → Check-in dynamic QR → verify social work hours increment → Export `.doc` and `.csv`.
- **Đề 2 (`de-2`):** Submit report with photo/GPS/manual pin → Switch to Agency role → Update status → Verify Public Map & 95-ward leaderboard + Pitch Deck link.
- **Đề 3 (`de-3`):** Sync OCOP product → Open Video Studio Template → Copy Affiliate link & simulate order → Verify Dashboard revenue & 90-day pilot progress.
- **Đề 4 (`de-4`):** Play scenario → Verify Red-Flag instant feedback & score update → Generate & download PNG certificate.

## 3. Target Test Pyramid (Phase 2 Production)
- Unit tests (`Vitest`) for exporters, watermark/canvas math, SLA rules, scenario scoring.
- Component tests (`React Testing Library`) and E2E accessibility checks (`Playwright` + `@axe-core/playwright`).

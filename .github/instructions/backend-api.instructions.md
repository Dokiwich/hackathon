---
applyTo: "**/backend/**"
---
# Backend API & Modular Architecture Instructions

1. **Enforced 3-Tier Module Layout (`src/modules/<feature>/`):**
   - `routes` → binds HTTP routes & auth middleware → `controller`.
   - `controller` → validates input with Zod (`validateSchema`) → `service` → `okResponse`. Never touch `db/` or `*.repository.js` directly.
   - `service` → enforces business invariants, idempotency, and tenant/ward ownership (`org_id`/`ward_id`).
   - `repository` → parameterized queries only; never import `controller` or `routes`.
   - Cross-module imports MUST target `../<other-module>/index.js` only (enforced by ESLint `no-restricted-imports`).

2. **API Contract & Error Discipline:**
   - Return `{ ok: true, data, meta?, requestId }` or `{ ok: false, error: { code, message, details? }, requestId }`.
   - Throw typed `AppError` subclasses from `src/common/errors.js` rather than ad-hoc status responses.

3. **Security & Production Readiness:**
   - Validate environment configuration at startup (`src/config/env.js`).
   - Protect sensitive headers/logs with Pino `redact` and Helmet; keep CORS strictly allowlisted.
   - Provide `/api/v1/health` and `/api/v1/ready` endpoints; verify changes with `npm run lint` and `npm test` inside `<track>/backend/`.

---
applyTo: "**/*"
---
# Security Instructions for AI Coding Agents

1. **Secrets & Environment Variables:**
   - Never commit `.env`, API tokens, OAuth client secrets, or database URLs.
   - Remember that any `VITE_*` variable is embedded into public browser JS. Put only public configuration there; keep secrets strictly on backend/CI secrets.

2. **XSS & Injection Prevention:**
   - Never render untrusted strings via `dangerouslySetInnerHTML`, `innerHTML`, or `eval`.
   - Sanitize or strictly validate URL parameters, file names, and SVG/canvas inputs before rendering.
   - When writing backend SQL (Phase 2 PostGIS/PostgreSQL), always use parameterized queries / Prisma / Drizzle; never string-concatenate SQL.

3. **File Uploads & Citizen Media:**
   - Validate image MIME types (`image/jpeg`, `image/png`, `image/webp`) and enforce file size caps before reading blobs or uploading.
   - Strip sensitive EXIF metadata from public-facing images on the server side in production.

4. **Authorization & RBAC:**
   - Client-side route guards (`citizen` vs `agency`) are UX-only. All production mutations must verify JWT session and `ward_id` / `org_id` ownership server-side.

5. **CI/CD & GitHub Actions:**
   - Follow [`docs/agents/security.md`](../../docs/agents/security.md): minimal `permissions: contents: read`, pinned action majors, no secret leakage, no untrusted PR script execution.

# Security Baseline (OWASP Top 10)

This document tracks the minimum security controls required for enterprise
deployments and maps them to the OWASP Top 10.

## A01: Broken Access Control
- RBAC enforced for admin-only areas (`/admin`).
- Row Level Security enabled in Supabase policies.
- Profile role changes restricted to service role only (DB trigger).
- Answer writes restricted to non-viewer roles via RLS (admin/manager/analyst/user).
- User-scoped config writes (assessment_meta, custom catalog, disabled lists, annotations, snapshots) restricted to non-viewer roles.
- UI gating disables domain/framework selection for viewer to align with RLS.
- Admin-only write policies for shared catalog tables (security_domains, domains, subcategories, default_frameworks, default_questions).
- Admin-only write policies for AI providers and SIEM integrations.

## A02: Cryptographic Failures
- Secrets never stored in client code or Docker images.
- Use KMS/Secrets Manager or equivalent for server-side secrets.
- Inline secrets disabled by default; use env/file references or secret injection.
- External secret resolver supported for `secret:` references via `SECRET_PROVIDER_URL`.

## A03: Injection
- Use parameterized queries via Supabase client.
- Validate XLSX imports and sanitize user inputs.
- XLSX import allowlist, size limits, row limits, and formula blocking.
- XLSX macro/embedded object indicators blocked before import.
- Optional XLSX malware scan hook via `VITE_IMPORT_MALWARE_SCAN_URL` (enforce with `VITE_IMPORT_MALWARE_SCAN_REQUIRED`).
- Recommend antivirus scanning for catalog import files.
- AI assistant input limits via `MAX_AI_MESSAGES`, `MAX_AI_MESSAGE_CHARS`, `MAX_AI_TOTAL_CHARS`.
- Audit/SIEM payloads enforce entity/action allowlists and size limits.

## A04: Insecure Design
- Admin-only configuration separated from user preferences.
- Explicit gates in execution plan and ADRs.

## A05: Security Misconfiguration
- Non-root container runtime.
- Nginx security headers enabled.
- CSP Report-Only enabled to baseline policy before enforcement.
- Edge Function CORS allowlist supported via `ALLOWED_ORIGINS`.
- Request body size limits supported via `MAX_REQUEST_BODY_BYTES`.
- Edge Functions enforce `Content-Type: application/json` for POST payloads.
- Import limits configurable via `VITE_IMPORT_MAX_FILE_BYTES`, `VITE_IMPORT_MAX_CELL_CHARS`, and `VITE_IMPORT_MAX_ROWS`.
- Edge Function rate limits configurable via `RATE_LIMIT_WINDOW_SECONDS` and `*_RATE_LIMIT_MAX`.
- Edge Function rate limits are in-memory; enforce strict limits at ingress/WAF for multi-instance deployments.
- Outbound proxy support via `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY`.
- Custom CA trust via `CUSTOM_CA_CERT` or `CUSTOM_CA_CERT_BASE64`.

## A06: Vulnerable and Outdated Components
- Dependabot/SCA required in CI (planned).

## A07: Identification and Authentication Failures
- Admin-provisioned accounts only (no self-signup).
- Rate limiting on login (client-side).
- Edge Functions require verified JWTs.
- Optional idle and absolute session timeout enforced client-side.

## A08: Software and Data Integrity Failures
- Secure SDLC (SAST/SCA/SBOM/signing) planned.

## A09: Security Logging and Monitoring Failures
- Audit logs and SIEM integration available.
- Geo lookup disabled by default (`AUDIT_GEO_LOOKUP_ENABLED=false`).
- Edge Functions emit structured logs with request IDs.
- Edge Function logs redact tokens and secrets.

## A10: Server-Side Request Forgery (SSRF)
- Restrict outbound calls in server-side integrations.
- Validate URLs for SIEM/AI endpoints (http/https only, no credentials).
- Validate analytics export URL; local/private requires `ALLOW_LOCAL_ENDPOINTS=true`.
- Validate `SECRET_PROVIDER_URL` and block local/private endpoints unless `ALLOW_LOCAL_ENDPOINTS=true`.
- Local/private endpoints require `ALLOW_LOCAL_ENDPOINTS=true` for Edge Functions
  and `VITE_ALLOW_LOCAL_ENDPOINTS=true` for the frontend.

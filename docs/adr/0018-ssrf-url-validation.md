# ADR 0018: SSRF Guardrails for External Endpoints

- Status: Accepted
- Date: 2026-01-17

## Context
The platform allows administrators to configure external endpoints (SIEM, AI,
and custom STT). These inputs can be abused for SSRF if not validated.

## Decision
Introduce client and server-side URL validation to block non-HTTP(S) schemes,
embedded credentials, and local/private hosts by default. Provide explicit
opt-in flags (`VITE_ALLOW_LOCAL_ENDPOINTS=true` for frontend validation and
`ALLOW_LOCAL_ENDPOINTS=true` for Edge Functions) for trusted environments.

## Consequences
- Safer defaults for external integrations.
- Local endpoints require explicit environment toggles on both frontend and
  Edge Functions when applicable.

## Alternatives Considered
- Server-only validation (not sufficient for client-only integrations).

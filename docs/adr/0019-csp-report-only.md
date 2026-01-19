# ADR 0019: CSP Report-Only Baseline

- Status: Proposed
- Date: 2026-01-17

## Context
The frontend needs a gradual CSP rollout to avoid breaking existing assets
and third-party connections.

## Decision
Enable Content-Security-Policy in Report-Only mode in the frontend Nginx
configuration with a permissive baseline. Tighten the policy after observing
violations.

## Consequences
- No immediate blocking; visibility into CSP violations.
- Future hardening will require documenting allowed sources.

## Alternatives Considered
- Enforce CSP immediately (risk of runtime breakage).

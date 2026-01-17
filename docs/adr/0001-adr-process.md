# ADR 0001: Adopt ADRs for Technical Decisions

- Status: Accepted
- Date: 2026-01-17

## Context
The project is evolving toward enterprise deployment (EKS/AKS) and will undergo
significant refactors. We need a lightweight, durable way to document decisions
and rationale.

## Decision
Adopt Architecture Decision Records (ADRs) in `docs/adr/` and record material
technical decisions going forward.

## Consequences
- Future decisions will be captured in ADRs with status, context, and trade-offs.
- ADRs become a primary reference for onboarding and audits.
- Additional maintenance overhead is expected but minimal.

## Alternatives Considered
- Relying on commit history only (insufficient for rationale).
- Storing decisions in a single changelog (hard to search and evolve).


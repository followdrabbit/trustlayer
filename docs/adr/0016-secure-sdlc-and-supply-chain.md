# ADR 0016: Secure SDLC and Supply Chain Controls

- Status: Proposed
- Date: 2026-01-17

## Context
Enterprise customers require secure development practices and supply chain
controls (SBOM, vulnerability scanning, and image signing).

## Decision
Adopt a Secure SDLC baseline including SAST/SCA, SBOM generation, container
image scanning, and signed releases. These checks are mandatory release gates.

## Consequences
- Requires CI/CD updates and security tooling integration.
- May increase build times but improves auditability and risk posture.

## Alternatives Considered
- Manual or ad-hoc scanning (inconsistent and insufficient).


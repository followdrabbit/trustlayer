# ADR 0011: Container Hardening and Dockerfile Standards

- Status: Proposed
- Date: 2026-01-17

## Context
Enterprise deployments require hardened container images and secure defaults.
Running containers as root is not acceptable.

## Decision
Adopt Dockerfile standards that ensure:
- Non-root runtime user.
- Minimal base images.
- No secrets baked into images.
- Read-only filesystem where feasible.
- Health checks and explicit ports.

## Consequences
- Requires updates to build pipelines and runtime manifests.
- Some packages may need additional permissions or init steps.

## Alternatives Considered
- Default Docker images (insufficient for enterprise security requirements).


# ADR 0003: Containerized Services and Kubernetes Deployment

- Status: Proposed
- Date: 2026-01-17

## Context
The product will be deployed inside customer environments using EKS, AKS, or
equivalent. Both frontend and backend services must be containerized and
operated with standard Kubernetes practices, with support for split deployments
where frontend and backend run in different environments.

## Decision
Containerize frontend and backend services and deploy via Helm (or equivalent
manifests) to Kubernetes. Support two deployment modes: fully in-cluster, or
split deployment with frontend in-cluster and backend services external (or
vice-versa). Configuration will use environment variables and Kubernetes
Secrets/ConfigMaps. Health checks will be exposed for readiness and liveness
probes.

## Consequences
- Establishes a clear delivery model for on-prem enterprise deployments.
- Requires CI/CD pipelines to build, scan, and publish container images.
- Enforces standardized config management and observability practices.
- Requires clear network, DNS, and TLS guidance for split deployments.

## Alternatives Considered
- VM-based deployment (less portable, harder to scale/manage).
- Single-container monolith (limits scaling and operational clarity).

# ADR 0002: Use Self-Hosted Supabase for Enterprise Deployments

- Status: Accepted
- Date: 2026-01-17

## Context
The system must run inside customer environments (EKS/AKS or equivalent) while
preserving existing capabilities: Postgres, Auth, RLS, Edge Functions, and
storage. Deployments must be flexible: all-in-cluster or split (frontend in
cluster, backend/external services elsewhere). The roadmap also includes SSO and
enterprise features.

## Decision
Adopt self-hosted Supabase in Kubernetes as the primary API platform for
enterprise deployments (assuming local use is free), while allowing external
Postgres targets (e.g., RDS or on-prem BDS) when required by the customer.

## Consequences
- Keeps APIs, SDKs, schema, and RLS compatible with current code.
- Enables in-cluster deployment with network policies and private data paths.
- Requires operating Postgres, Auth, Storage, and Functions in K8s.
- Adds responsibility for backups, upgrades, monitoring, and HA.
- Requires a supported configuration path for managed Postgres (RDS/BDS) and
  secure connectivity from in-cluster services.

## Alternatives Considered
- Postgres + custom backend (maximum control, higher engineering cost).
- SQLite local-only (simple, but incompatible with multi-user enterprise needs).

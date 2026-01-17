# ADR 0004: Support Flexible Data Stores and Deployment Topologies

- Status: Proposed
- Date: 2026-01-17

## Context
Enterprise customers may require different deployment topologies (all-in-cluster,
split frontend/backend, or fully on-prem) and different data store locations.
They may use managed cloud services such as RDS or ADX, or local/on-prem database
services (BDS or equivalent).

## Decision
Support multiple deployment topologies and external data store integrations:
- Primary transactional database remains Postgres-compatible.
- Allow external Postgres targets (RDS/on-prem BDS) alongside in-cluster
  self-hosted Supabase.
- Add optional analytics integration for services like ADX when needed.

## Consequences
- Increases deployment flexibility for enterprise customers.
- Requires configuration validation, network hardening, and secure connectivity.
- May require a data access abstraction to keep core features compatible.

## Alternatives Considered
- One-size-fits-all deployment (simpler, but blocks enterprise adoption).


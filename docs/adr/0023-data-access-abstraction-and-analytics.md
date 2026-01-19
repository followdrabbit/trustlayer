# ADR 0023: Data Access Abstraction and Analytics Integration

- Status: Accepted
- Date: 2026-01-18

## Context
Enterprise deployments may use Supabase Postgres, RDS, or on-prem databases,
and optionally integrate with analytics platforms like ADX. The application
needs a consistent data access strategy and a clear integration boundary.

## Decision
Introduce a data access abstraction layer to decouple application logic from
the underlying database provider. Define adapters for:
- Supabase Postgres (default)
- External Postgres (RDS/on-prem)
- Optional analytics export (ADX or equivalent) via a separate pipeline

Implement an optional analytics export hook:
- Frontend sends maturity snapshot payloads to a dedicated Edge Function.
- Edge Function validates payload size/shape and forwards to `ANALYTICS_EXPORT_URL`.
- URL validation blocks local/private endpoints unless `ALLOW_LOCAL_ENDPOINTS=true`.
- Payloads are sanitized and truncated to avoid over-sharing.
- Token-based auth supported via `ANALYTICS_EXPORT_TOKEN`.

Keep OLTP operations in Postgres. Analytics ingestion is asynchronous and does
not block user workflows.

## Consequences
- Requires repository/service interfaces and provider-specific adapters.
- Requires connection health checks and observability per provider.
- Analytics integration needs retention and privacy alignment.

## Alternatives Considered
- Direct DB access in application code (harder to support multiple backends).
- Analytics queries on OLTP (performance and isolation risks).

# Observability Baseline

This document defines the minimum observability baseline for enterprise
deployments. It focuses on logs, metrics, traces, and SLOs, plus the runbooks
needed for on-call response.

## Goals
- Detect outages and degradation quickly.
- Measure user-facing reliability with SLOs.
- Provide evidence for incident response and audits.

## Scope
- Frontend (browser)
- Edge Functions (ai-assistant, audit-log, siem-forward)
- Database (Supabase/Postgres)
- External integrations (AI providers, SIEM endpoints)

## Logs
- Structured JSON logs for Edge Functions.
- Required fields: `timestamp`, `level`, `message`, `requestId`, `path`, `userId`.
- `X-Request-Id` is returned to clients for log correlation.

## Metrics (Minimum)
### Frontend
- Page load time (p50/p95)
- API error rate
- Auth login failure rate

### Edge Functions
- Request count by status
- Latency (p50/p95/p99)
- Error rate (4xx/5xx)
- AI provider response errors
- SIEM forward latency and failures

### Database
- Connection pool usage
- Query latency (p95)
- Slow query count
- Replication lag (if HA)

### Integrations
- External API failure rate
- Timeout rate
- Circuit breaker open count (if enabled)

## Tracing (Planned)
- Adopt OpenTelemetry for traces and metrics export.
- Use `traceparent` for distributed tracing once backend instrumentation is
  available.
- Correlate spans with `X-Request-Id`.

## SLOs (Baseline)
Define SLOs for the most critical user journeys. Targets are measured over a
rolling 28-day window.

### SLO 1: Login Availability
- Target: 99.9% successful logins
- SLI: successful login responses / total login attempts
- Error budget: 0.1%

### SLO 2: Assessment Load Latency
- Target: p95 < 2.0s for assessment load
- SLI: time from navigation to first question render

### SLO 3: AI Assistant First Token
- Target: p95 < 2.5s to first token
- SLI: time from prompt submit to first SSE chunk

## Dashboards (Minimum)
- Overall availability and error rate
- Latency by endpoint
- Auth failures and lockouts
- AI assistant latency and error rate
- SIEM forwarding success/failure

## Alerting (Minimum)
- 5xx error rate > 2% for 5 minutes
- p95 latency > 2x SLO target for 10 minutes
- SIEM forward failures > 5% for 15 minutes
- No logs received in 10 minutes (ingestion failure)

## Runbooks
- Incident response: `docs/runbooks/INCIDENT_RESPONSE.md`
- Alert playbooks: `docs/runbooks/ALERTS.md`

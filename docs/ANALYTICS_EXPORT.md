# Analytics Export

This document describes the optional analytics export pipeline used to forward
snapshot data to external systems (ADX or equivalent).

## Overview

When enabled, the frontend sends maturity snapshots to the
`/functions/v1/analytics-export` Edge Function. That function validates and
sanitizes the payload, then forwards it to `ANALYTICS_EXPORT_URL`.

## Flow

1. Frontend builds a normalized snapshot payload.
2. Edge Function validates request/auth/rate limits.
3. Payload is forwarded to `ANALYTICS_EXPORT_URL`.

## Configuration

Required (enable export):
- `VITE_ANALYTICS_EXPORT_ENABLED=true`
- `ANALYTICS_EXPORT_URL=https://analytics.local/ingest`

Optional:
- `ANALYTICS_EXPORT_TOKEN=env:ANALYTICS_EXPORT_TOKEN`
- `ANALYTICS_EXPORT_TIMEOUT_MS=10000`
- `ANALYTICS_EXPORT_INCLUDE_USER_ID=false`
- `ANALYTICS_EXPORT_RATE_LIMIT_MAX=60`

Local/private endpoints are blocked unless `ALLOW_LOCAL_ENDPOINTS=true`.

## Payload Shape (Outbound)

```json
{
  "eventType": "maturity_snapshot",
  "exportedAt": "2026-01-19T12:00:00Z",
  "snapshot": {
    "snapshotDate": "2026-01-19",
    "snapshotType": "automatic",
    "securityDomainId": "AI_SECURITY",
    "overallScore": 0.72,
    "overallCoverage": 0.65,
    "evidenceReadiness": 0.6,
    "maturityLevel": 3,
    "totalQuestions": 120,
    "answeredQuestions": 80,
    "criticalGaps": 12,
    "domainMetrics": [],
    "frameworkMetrics": [],
    "frameworkCategoryMetrics": []
  },
  "context": {
    "userId": "uuid"
  }
}
```

`context.userId` is included only when `ANALYTICS_EXPORT_INCLUDE_USER_ID=true`.

## Local Demo Receiver

Use the demo receiver for local testing:

```bash
node scripts/analytics-export-demo.mjs
```

Then configure:
```bash
ANALYTICS_EXPORT_URL=http://127.0.0.1:8788/ingest
ANALYTICS_EXPORT_TOKEN=env:ANALYTICS_EXPORT_TOKEN
```

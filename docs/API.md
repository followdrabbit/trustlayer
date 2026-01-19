# TrustLayer API Documentation

Documentation for the Edge Functions exposed by TrustLayer.

## Index

- Authentication
- AI Assistant
- Audit Log
- SIEM Forward
- Analytics Export
- Error Codes

## Authentication

All APIs require JWT Bearer authentication.

```
Authorization: Bearer <jwt_token>
```

Responses include `X-Request-Id` for troubleshooting and log correlation.

## AI Assistant

### Endpoint

```
POST /functions/v1/ai-assistant
```

Headers:
- `Content-Type: application/json`

### Request Body

```json
{
  "messages": [
    { "role": "user", "content": "Quais sao os principais gaps?" }
  ],
  "context": {
    "overallScore": 72.5,
    "maturityLevel": 3,
    "criticalGaps": 12,
    "securityDomain": "AI_SECURITY"
  },
  "provider": {
    "providerType": "lovable",
    "modelId": "google/gemini-3-flash-preview",
    "maxTokens": 4096,
    "temperature": 0.7
  }
}
```

### Response (SSE)

```
data: {"choices":[{"delta":{"content":"Os principais"},"index":0}]}

data: {"choices":[{"delta":{"content":" gaps identificados"},"index":0}]}

data: [DONE]
```

## Audit Log

### Endpoint

```
POST /functions/v1/audit-log
```

Headers:
- `Content-Type: application/json`

### Request Body

```json
{
  "action": "update",
  "entityType": "framework",
  "entityId": "NIST_AI_RMF",
  "changes": {
    "field": "isEnabled",
    "value": true
  },
  "sessionId": "optional-session-id"
}
```

## SIEM Forward

### Endpoint

```
POST /functions/v1/siem-forward
```

Headers:
- `Content-Type: application/json`

### Request Body

```json
{
  "userId": "uuid",
  "event": {
    "id": 123,
    "action": "update",
    "entityType": "framework",
    "entityId": "NIST_AI_RMF",
    "changes": {
      "field": "isEnabled",
      "value": true
    },
    "createdAt": "2026-01-17T12:00:00Z"
  }
}
```

## Analytics Export

### Endpoint

```
POST /functions/v1/analytics-export
```

Headers:
- `Content-Type: application/json`

### Request Body

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
    "domainMetrics": [
      { "domainId": "GOV", "domainName": "Governance", "score": 0.8, "coverage": 0.7, "criticalGaps": 2 }
    ],
    "frameworkMetrics": [
      { "framework": "NIST_AI_RMF", "score": 0.7, "coverage": 0.6, "totalQuestions": 40, "answeredQuestions": 25 }
    ],
    "frameworkCategoryMetrics": [
      { "categoryId": "core", "categoryName": "Fundamental", "score": 0.75, "coverage": 0.7 }
    ]
  }
}
```

## Error Codes

### HTTP Error Shape

```json
{
  "error": "Descricao do erro",
  "details": "Detalhes adicionais (opcional)"
}
```

## Runtime Configuration

Edge Functions support enterprise runtime settings:

- Proxy: `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`.
- Custom CA trust: `CUSTOM_CA_CERT` or `CUSTOM_CA_CERT_BASE64`.
- Secret references: `env:NAME`, `file:/path`, or `secret:ref` for secrets injected at runtime.
- AI message limits: `MAX_AI_MESSAGES`, `MAX_AI_MESSAGE_CHARS`, `MAX_AI_TOTAL_CHARS`.
- Rate limits: `RATE_LIMIT_WINDOW_SECONDS` and `*_RATE_LIMIT_MAX` (AI_ASSISTANT, AUDIT_LOG, SIEM_FORWARD, ANALYTICS_EXPORT).
- URL validation: `ALLOW_LOCAL_ENDPOINTS=true` to allow local/private endpoints for Edge Functions.
- Analytics export: `ANALYTICS_EXPORT_URL`, `ANALYTICS_EXPORT_TOKEN`, `ANALYTICS_EXPORT_TIMEOUT_MS`, `ANALYTICS_EXPORT_INCLUDE_USER_ID`.

# Alert Playbooks

Guidance for triaging common alerts.

## High 5xx Error Rate
1) Check Edge Function logs using `X-Request-Id`.
2) Inspect recent deploys or config changes.
3) Validate upstream dependencies (AI providers, database).
4) Roll back if error rate persists.

## Latency Breach (p95)
1) Confirm whether latency is global or endpoint-specific.
2) Check DB latency and connection pool saturation.
3) Inspect external API calls for timeouts.
4) Apply rate limiting or shed load if needed.

## SIEM Forward Failures
1) Verify endpoint URL and auth settings.
2) Check timeout errors and retry behavior.
3) Disable integration if repeated failures.

## Log Ingestion Gap
1) Validate collector/agent health.
2) Confirm storage capacity and retention.
3) Escalate if no logs for >10 minutes.

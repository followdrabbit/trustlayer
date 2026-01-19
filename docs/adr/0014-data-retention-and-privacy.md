# ADR 0014: Data Retention and Privacy Compliance

- Status: Accepted
- Date: 2026-01-17

## Context
Enterprises require formal data retention, deletion, and privacy compliance
policies (e.g., LGPD/GDPR) across user data and audit logs.

## Decision
Adopt explicit data retention and privacy compliance policies, including data
subject request workflows, deletion SLAs, and legal hold handling.

Implement a baseline retention cleanup script:
- Scheduled CLI runs remove audit logs, snapshots, and SIEM metrics past policy thresholds.
- Deletion runs are opt-in (`RETENTION_APPLY=true`) and support dry-run by default.

## Consequences
- Requires data lifecycle tooling and admin workflows.
- Requires clear documentation and audit evidence.

## Alternatives Considered
- No formal retention policy (non-compliant for enterprise use).

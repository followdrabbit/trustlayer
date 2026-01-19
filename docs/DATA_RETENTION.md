# Data Retention and Privacy

This document defines the baseline approach for data retention, deletion, and
privacy compliance. Retention is enforced out-of-band via scheduled jobs so the
application remains stateless.

## Scope

Default retention targets:
- `change_logs` (audit logs)
- `maturity_snapshots` (analytics snapshots)
- `siem_metrics` (delivery health metrics)

Other data sets (answers, profiles, catalog) are governed by customer policy
and should be handled via custom workflows or contractual retention rules.

## Retention Cleanup Script

The script supports dry runs by default. Set `RETENTION_APPLY=true` to delete.

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
RETENTION_CHANGE_LOGS_DAYS=365 \
RETENTION_SNAPSHOTS_DAYS=730 \
RETENTION_SIEM_METRICS_DAYS=90 \
RETENTION_APPLY=true \
npm run retention:cleanup
```

### Environment Variables

- `RETENTION_CHANGE_LOGS_DAYS`: delete audit logs older than N days.
- `RETENTION_SNAPSHOTS_DAYS`: delete snapshots older than N days.
- `RETENTION_SIEM_METRICS_DAYS`: delete SIEM metrics older than N days.
- `RETENTION_APPLY=true`: apply deletes (omit for dry-run).

## Operational Guidance

- Run the script from a trusted admin environment.
- Use a service role key with least privilege (scoped where possible).
- Schedule via cron or CI (e.g., weekly/monthly).
- Document retention policy decisions and align with LGPD/GDPR requirements.

## Legal Hold

When a legal hold is required, suspend retention jobs and document the scope
and timeline. Re-enable cleanup only after hold release.

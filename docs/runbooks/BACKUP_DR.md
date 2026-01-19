# Backup and Disaster Recovery Runbook

This runbook defines minimum backup, restore, and DR steps for enterprise
deployments. Tailor schedules and targets to your environment.

## Scope
- Postgres database (Supabase self-hosted, RDS, or on-prem).
- Object storage (S3-compatible).
- Configuration and secrets (runtime env, KMS/Vault, deployment manifests).

## RPO/RTO Targets
- Define explicit targets before go-live.
- Record them here:
  - RPO: ____ (e.g., 24h)
  - RTO: ____ (e.g., 4h)

## Backup Strategy (Baseline)
- Daily full database backup.
- Continuous WAL/PITR where supported.
- Object storage versioning + lifecycle retention.
- Encrypted backups with KMS-managed keys.
- Access restricted to backup operators only.

## Backup Procedures
### Postgres (Self-hosted)
1) Verify free storage capacity for backup artifacts.
2) Run `pg_dump` (logical) or `pg_basebackup` (physical) per policy.
3) Archive WAL for PITR if enabled.
4) Store artifacts in encrypted object storage.
5) Record backup metadata (timestamp, size, checksum).

### Postgres (RDS/Managed)
1) Enable automated snapshots and PITR.
2) Export snapshots to an encrypted bucket if required.
3) Record snapshot IDs and retention policy.

### Object Storage
1) Enable versioning and lifecycle policies.
2) Verify retention window aligns with RPO/RTO.
3) Periodically validate access to restore buckets.

## Restore Procedure (Test)
1) Restore database to an isolated environment.
2) Apply WAL/PITR to a target timestamp if needed.
3) Restore object storage data and validate hashes.
4) Run smoke tests and catalog integrity checks.
5) Record results and remediate failures.

## Disaster Recovery (Failover)
1) Declare DR event and assign an incident commander.
2) Promote standby (if configured) or restore from latest backup.
3) Update DNS/ingress to route traffic to DR environment.
4) Validate authentication, assessments, dashboards, and admin console.
5) Announce recovery and monitor for 24 hours.

## Verification Checklist
- Latest backup completed and stored.
- Restore test completed within RTO.
- Audit logs and critical tables present.
- Admin login and catalog import verified.
- Runbook updated after each DR test.

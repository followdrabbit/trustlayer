# ADR 0013: Backup and Disaster Recovery

- Status: Accepted
- Date: 2026-01-17

## Context
Enterprise deployments require defined RPO/RTO targets and tested recovery
procedures for databases, storage, and configurations.

## Decision
Define backup, restore, and DR procedures with explicit RPO/RTO targets and
periodic recovery testing. This applies to Postgres, object storage, and any
critical configuration data.

## Consequences
- Requires scheduled backups, retention policies, and restore verification.
- Requires runbooks and incident response alignment.

## Alternatives Considered
- Best-effort backups only (insufficient for enterprise SLAs).

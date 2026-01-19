# ADR 0010: Secret Management and KMS Integration

- Status: Accepted
- Date: 2026-01-17

## Context
Enterprise deployments require secure handling of credentials, API keys, and
encryption keys. Environments may use cloud services (AWS, Azure) or on-prem
vaults.

## Decision
Support secret management integrations with cloud KMS and on-prem vaults:
- Kubernetes Secrets for baseline deployment.
- AWS Secrets Manager / KMS.
- Azure Key Vault / Managed HSM.
- On-prem vaults (e.g., HashiCorp Vault).
- Support `env:` and `file:` secret references for integration credentials.
- Support `secret:` references resolved via `SECRET_PROVIDER_URL` for external secret providers.
- Inline secrets are disabled by default in the UI and require
  `VITE_ALLOW_INLINE_SECRETS=true` to enable.

## Consequences
- Requires abstraction for secret retrieval and rotation.
- Requires deployment documentation per provider.
- Requires secret scanning, redaction, and strict logging policies to prevent
  exposure of passwords, API keys, or credentials.
- Requires deployment-time injection of env vars or mounted secret files.

## Alternatives Considered
- Environment variables only (insufficient for enterprise requirements).

# Execution Plan (Enterprise)

This plan defines a logical sequence of work with test gates between phases.
Do not proceed to the next phase until the gate passes.

## Phase 0 - Governance and Readiness
- Define "done" criteria (coverage, docs, changelog, ADR approvals).
- Confirm release gate policy (tests, security checks, doc updates).
- Output: validated execution checklist and sign-off.
- Gate: existing test suite + doc policy check (README/llm.txt/docs/CHANGELOG updated).

## Phase 1 - Data Foundation (DB-only Catalog)
- Migrate domains/frameworks/questions to database-only source.
- Create idempotent seed/migrations and rollback strategy.
- Output: catalog fully DB-driven.
- Gate: migration tests + catalog integrity checks + regression on dashboards.

## Phase 2 - Auth and Provisioning (Enterprise)
- Remove self-signup and demo flows.
- Implement initial admin provisioning.
- Add local user management and prepare for SSO (OIDC/SAML).
- Output: controlled provisioning and admin bootstrap.
- Gate: auth flow tests + RBAC checks + audit log validation.

## Phase 3 - Admin Console (Global Settings)
- Move global settings (SIEM, AI, TTS, logs, health) to Admin Console.
- Keep user settings only for profile preferences.
- Output: restricted admin UI and separated settings.
- Gate: permission tests + UI regression + config persistence tests.

## Phase 4 - Deployment and Container Hardening
- Build Dockerfiles (non-root, minimal base, no secrets baked).
- Add Helm/manifests for in-cluster, split, and on-prem deployments.
- Output: secure images and deploy artifacts.
- Gate: image scan + smoke deploy + non-root runtime verification.

## Phase 5 - Security Baseline (OWASP, Secrets, API)
- Implement OWASP Top 10 mapping and mitigations.
- Add rate limits, session hardening, API validation, secret redaction.
- Output: security baseline checklist and controls.
- Gate: security tests + checklist sign-off.

## Phase 6 - Observability and Operations
- Add logs/metrics/traces and define SLOs.
- Create alerts and incident response runbooks.
- Output: observability stack and SLO dashboards.
- Gate: monitoring tests + alert simulation.

## Phase 7 - Secure XLSX Import
- Implement secure XLSX pipeline (validation, scan, audit logs).
- Add template versioning and import preview/dry-run.
- Output: secure import workflow.
- Gate: import tests (valid/invalid files) + audit verification.

## Phase 8 - Modular Dashboards
- Create widget catalog and admin layout editor.
- Support multiple dashboards per role/profile.
- Output: configurable dashboards with persistence.
- Gate: layout tests + permissions + data source validation.

## Phase 9 - Integrations (KMS/Vault, Proxy, ADX)
- Add secrets manager integrations and proxy support.
- Optional analytics integration (ADX).
- Output: provider-specific configs and docs.
- Gate: integration tests per provider + connectivity checks.

## Phase 10 - Compliance and Data Lifecycle
- Implement retention, deletion, legal hold, and privacy workflows.
- Align with LGPD/GDPR requirements.
- Output: compliance workflows and audit evidence.
- Gate: data lifecycle tests + privacy request simulations.

## Test Gates (Minimum)
- Unit tests + component tests
- Integration tests for DB, auth, and imports
- Security checks (SAST/SCA/SBOM/image scan)
- Docs updated (README/llm.txt/docs/CHANGELOG)


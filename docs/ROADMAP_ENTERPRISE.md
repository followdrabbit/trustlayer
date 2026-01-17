# TrustLayer Enterprise Roadmap (Comparativo)

This document compares the current state vs. the required enterprise target
state, and lists gaps and TODOs.

## Current State (High-Level)
- React/Vite frontend with dashboards, assessments, and settings
- Supabase backend (Postgres, Auth, RLS, Edge Functions)
- AI assistant, audit logging, SIEM forwarding, exports
- Basic auth with email/password
- Multi-domain assessments with scoring

## Target Enterprise Capabilities
- On-prem/K8s deployment (EKS/AKS) with containerized services
- Flexible deployment modes (all-in-cluster, split frontend/backend, or fully on-prem)
- Pluggable data stores (in-cluster Supabase, RDS, on-prem BDS, optional ADX)
- Admin-driven framework catalog with standardized XLSX import
- All domains, frameworks, and questions loaded from the database (no static JSON)
- Full code coverage with complete usage and maintenance documentation
- Admin console for global settings (restricted access)
- User settings limited to profile-specific preferences
- Admin-controlled user provisioning (no self-signup)
- Modular dashboards with admin-configurable layouts and catalog
- No demo user or demo data in enterprise builds
- Security best practices for sessions, APIs, and data protection
- Documentation discipline for all changes (README, llm.txt, docs, and changelog)
- Secret management integrations (cloud KMS and on-prem vaults)
- Secure container images (non-root, minimal base, hardened runtime)
- No exposure of secrets, passwords, or API keys
- OWASP Top 10 coverage for web security risks
- Proxy-ready networking configuration
- Observability with SLOs, alerts, and incident response readiness
- Backup/DR with defined RPO/RTO and retention
- Data retention and privacy compliance (LGPD/GDPR) policies
- Secure SDLC (SAST/SCA, SBOM, image signing, vulnerability scanning)
- Enterprise Auth: SSO (OIDC/SAML), MFA, SCIM (optional)
- Strong RBAC, tenant isolation, and auditability
- High availability, backup/restore, DR strategy
- Observability, security scanning, and compliance reporting
- Support for large orgs (scale, data retention, performance)

## Gap Analysis and TODOs

| Area | Current | Target | TODO |
| --- | --- | --- | --- |
| Deployment | Vite dev/prod local | K8s-ready images and Helm charts | Create Dockerfiles, Helm charts, and CI image pipeline |
| Deployment Modes | Single default | Split + in-cluster + on-prem | Document supported topologies and network/TLS patterns |
| Backend Platform | Managed Supabase | Self-hosted Supabase in K8s | Define cluster topology, storage, and upgrades |
| Database | Supabase Postgres | HA Postgres + backups | Add backup/restore, PITR, monitoring, and PGBouncer |
| External DB | Not supported | RDS/on-prem BDS | Add configuration, connectivity checks, and support guides |
| Analytics | Not supported | Optional ADX | Define export pipeline or connector |
| Framework Catalog | Static JSON | Admin-managed catalog | Build UI + API to create/update frameworks/domains/questions |
| XLSX Import | Not supported | Standardized import | Define template, validation, and import pipeline |
| XLSX Security | Not defined | Secure import pipeline | Add size limits, validation, malware scan, audit logs, and rate limits |
| Data Source | Mixed | Database-only | Move all domains/frameworks/questions to DB and remove static JSON usage |
| Test Coverage | Unknown | Full coverage | Define coverage targets, enforce in CI, add missing tests |
| Documentation | Partial | Complete | Add user/admin/ops docs and maintenance runbooks |
| Doc Governance | Not defined | Mandatory updates | Update README/llm.txt/docs/CHANGELOG on every change |
| Admin Console | Not defined | Restricted admin UI | Build admin panel for global settings and health |
| User Settings | Mixed scope | Profile-only | Move global settings to admin; keep personal prefs only |
| User Provisioning | Self-signup | Admin-controlled | Remove self-signup; admin creates users or LDAP/EntraID |
| Demo Access | Demo user/data | Disabled | Remove demo user and demo data paths from enterprise builds |
| Security Baseline | Partial | Enterprise baseline | Define session security, API hardening, and data protection controls |
| Dashboards | Fixed layouts | Modular + configurable | Create catalog of widgets and admin layout editor |
| Auth | Email/password | SSO (OIDC/SAML), MFA | Implement enterprise SSO, enforce policies |
| IAM | Basic user profile | RBAC + tenant roles | Define roles/permissions and enforce in UI + backend |
| Audit | Edge audit logs | Centralized, immutable audit | Extend audit to all sensitive actions and export to SIEM |
| Observability | Limited | Logs, metrics, traces | Add OpenTelemetry, dashboards, alerts |
| Secrets | .env file | Secret manager | Integrate with K8s Secrets/Vault/ASM/KeyVault |
| KMS/Vault | Not supported | Multi-provider | Add integrations for KMS and on-prem vaults |
| Compliance | Partial | Evidence + reports | Add compliance packs, exportable evidence, retention |
| Storage | Supabase storage | Encrypted + retention | Configure S3-compatible storage, encryption at rest |
| Multi-tenancy | RLS | RLS + org isolation | Validate RLS, add org boundary checks |
| Data residency | N/A | Configurable | Define deployment options per region |
| CI/CD | Basic scripts | Build/scan/release | Add image signing and SCA/SAST in pipeline |
| Security | Basic policies | Hardening | Add network policies, WAF, rate limits |
| Container Hardening | Not defined | Non-root images | Create Dockerfiles with non-root user and minimal base |
| Secret Exposure | Not defined | Zero exposure | Enforce secret scanning, redaction, and secure logging |
| OWASP Top 10 | Not defined | Covered | Map controls to OWASP Top 10 and verify mitigations |
| Proxy Support | Not defined | Supported | Add proxy configuration for outbound services and docs |
| Observability | Limited | SLO-based | Define logs/metrics/traces, SLOs, alerting, on-call |
| Backup/DR | Not defined | RPO/RTO defined | Define backup, restore tests, and DR playbooks |
| Data Retention | Not defined | Policy-driven | Define retention, deletion, and legal hold |
| Privacy Compliance | Partial | LGPD/GDPR aligned | Add consent, data subject workflows, and DPIA |
| Secure SDLC | Partial | Full coverage | Add SAST/SCA, SBOM, image signing, vuln scanning |
| Incident Response | Not defined | Defined | Create incident response and escalation runbooks |
| Release Gates | Partial | Enforced | Block releases on coverage, docs, security checks |
| SLAs | None | Enterprise SLAs | Define availability and incident response |

## Next ADRs to Create
- ADR: SSO provider strategy (OIDC/SAML, IdP list)
- ADR: RBAC model (roles, scopes, and permission mapping)
- ADR: Data retention and backup strategy
- ADR: Observability stack selection
- ADR: Data access abstraction and analytics integration
- ADR: Framework catalog defaults and XLSX import
- ADR: Admin console, auth, and provisioning model
- ADR: Modular dashboard catalog and layout management
- ADR: Security baseline and hardening checklist
- ADR: Secret management and KMS integration
- ADR: Container hardening and Dockerfile standards
- ADR: Observability and SLOs
- ADR: Backup and disaster recovery
- ADR: Data retention and privacy compliance
- ADR: Proxy support
- ADR: Secure SDLC and supply chain controls

## Default Framework Catalog (Out-of-the-Box)

### 1) Guarda-chuva (maturidade cross-domain)
- NIST Cybersecurity Framework (CSF) 2.0
- NIST SP 800-53 Rev.5
- CIS Critical Security Controls v8/v8.1

### 2) DevSecOps (maturidade no SDLC/pipeline)
- NIST SSDF (SP 800-218)
- OWASP SAMM
- OWASP ASVS
- SLSA + OpenSSF Scorecard

### 3) CloudSec (maturidade de controles em cloud)
- CSA Cloud Controls Matrix (CCM) v4 + CAIQ
- CIS Benchmarks (incl. Foundations por provedor)

### 4) AI / ML / GenAI Security
- NIST AI Risk Management Framework (AI RMF 1.0)
- ISO/IEC 42001:2023
- OWASP Top 10 for LLM Applications
- MITRE ATLAS
- NIST SP 800-218A (SSDF Community Profile para GenAI/dual-use models)

## Admin Flexibility
- Administrators can enable/disable frameworks by persona or domain.
- Administrators can edit or replace frameworks as needed.

## Notes
This is a living document. Update as decisions are made and ADRs are added.

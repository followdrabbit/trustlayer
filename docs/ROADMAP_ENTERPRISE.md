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
- Admin-driven initial catalog import (post-install)
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
| Deployment | Vite dev/prod local | K8s-ready images and Helm charts | Dockerfile criado; Helm/CI pipeline pendentes |
| Deployment Modes | Single default | Split + in-cluster + on-prem | Document supported topologies and network/TLS patterns |
| Backend Platform | Managed Supabase | Self-hosted Supabase in K8s | Define cluster topology, storage, and upgrades |
| Database | Supabase Postgres | HA Postgres + backups | Add backup/restore, PITR, monitoring, and PGBouncer |
| External DB | Not supported | RDS/on-prem BDS | Add configuration, connectivity checks, and support guides |
| Analytics | Not supported | Optional ADX | Export hook via Edge Function added; ADX adapter pending |
| Framework Catalog | Static JSON | Admin-managed catalog | UI de gerenciamento existente; policies admin-only para escrita de catalogo implementadas |
| XLSX Import | Not supported | Standardized import | Template XLSX e validacao implementados; preview/dry-run concluido |
| XLSX Security | Not defined | Secure import pipeline | Limites de tamanho, linhas e formulas aplicados; rate limits server-side basicos implementados; bloqueio de macros/objetos embutidos e hook opcional de malware scan adicionados |
| Data Source | Mixed | Database-only | Concluido (catalogo somente no DB) |
| Test Coverage | Unknown | Full coverage | Define coverage targets, enforce in CI, add missing tests |
| Documentation | Partial | Complete | Add user/admin/ops docs and maintenance runbooks |
| Doc Governance | Not defined | Mandatory updates | Update README/llm.txt/docs/CHANGELOG on every change |
| Admin Console | Not defined | Restricted admin UI | Concluido (rota protegida /admin) + RLS admin-only para integracoes globais |
| User Settings | Mixed scope | Profile-only | Concluido (somente preferencias pessoais) |
| User Provisioning | Self-signup | Admin-controlled | Concluido (sem signup; provisionamento admin) |
| Initial Catalog | Not defined | Admin import | Documentado; UI admin usa import existente |
| Demo Access | Demo user/data | Disabled | Concluido (demo removido) |
| Security Baseline | Partial | Enterprise baseline | Baseline criado; hardening adicional pendente |
| Dashboards | Fixed layouts | Modular + configurable | Concluido (catalogo de widgets, layouts admin configuraveis) |
| Auth | Email/password | SSO (OIDC/SAML), MFA | Implement enterprise SSO, enforce policies |
| IAM | Basic user profile | RBAC + tenant roles | Roles baseline documented; constraints + RLS for viewer on writes; UI gating completed (domain/framework selection + voice commands) |
| Audit | Edge audit logs | Centralized, immutable audit | Extend audit to all sensitive actions and export to SIEM |
| Observability | Limited | Logs, metrics, traces | Structured logs com request ID; baseline de observabilidade e runbooks adicionados; OpenTelemetry, dashboards e alertas pendentes |
| Secrets | .env + secret refs | Secret manager | Concluido (env/file secret references + docs) |
| KMS/Vault | Not supported | Multi-provider | Parcial: env/file refs + resolver externo (secret:); provider adapters pending |
| Compliance | Partial | Evidence + reports | Add compliance packs, exportable evidence, retention |
| Storage | Supabase storage | Encrypted + retention | Configure S3-compatible storage, encryption at rest |
| Multi-tenancy | RLS | RLS + org isolation | Validate RLS, add org boundary checks |
| Data residency | N/A | Configurable | Define deployment options per region |
| CI/CD | Basic scripts | Build/scan/release | Add image signing and SCA/SAST in pipeline |
| Security | Basic policies | Hardening | Headers, SSRF baseline, JWT enforcement, CORS allowlist e limites de payload aplicados; rate limits basicos e timeouts de sessao (client-side) implementados; WAF/ingress pendente |
| Container Hardening | Not defined | Non-root images | Concluido (Dockerfile non-root) |
| Secret Exposure | Not defined | Zero exposure | Log redaction implemented; secret scanning and CI policies pending |
| OWASP Top 10 | Not defined | Covered | Mapeamento criado; mitigacoes parciais aplicadas (API auth/CORS/limites) |
| Proxy Support | Not defined | Supported | Concluido (HTTP_PROXY/HTTPS_PROXY/NO_PROXY + custom CA docs) |
| Observability | Limited | SLO-based | SLOs definidos em documentacao; alertas, dashboards e on-call pendentes |
| Backup/DR | Not defined | RPO/RTO defined | Runbook documented; define RPO/RTO per deployment and execute restore tests |
| Data Retention | Not defined | Policy-driven | Policy doc + cleanup script for audit/snapshots/metrics; legal hold workflow pending |
| Privacy Compliance | Partial | LGPD/GDPR aligned | Add consent, data subject workflows, and DPIA |
| Secure SDLC | Partial | Full coverage | Add SAST/SCA, SBOM, image signing, vuln scanning |
| Incident Response | Not defined | Defined | Create incident response and escalation runbooks |
| Release Gates | Partial | Enforced | Block releases on coverage, docs, security checks |
| SLAs | None | Enterprise SLAs | Define availability and incident response |

## ADRs for Enterprise Gaps
- `docs/adr/0021-sso-provider-strategy.md`
- `docs/adr/0022-rbac-model.md`
- `docs/adr/0023-data-access-abstraction-and-analytics.md`
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


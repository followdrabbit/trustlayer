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
| Deployment | Vite dev/prod local | K8s-ready images and Helm charts | ✅ **CONCLUÍDO**: Dockerfile + Helm charts completos com HPA, NetworkPolicies, SecurityContext |
| Deployment Modes | Single default | Split + in-cluster + on-prem | ✅ **CONCLUÍDO**: Helm values suportam 3 modos (in-cluster/split/on-prem); documentar patterns de rede |
| Backend Platform | Managed Supabase | Self-hosted Supabase in K8s | ✅ **CONCLUÍDO**: Helm charts incluem Supabase self-hosted + external option |
| Database | Supabase Postgres | HA Postgres + backups | ✅ **CONCLUÍDO**: Helm integra Bitnami PostgreSQL com HA (replication) + automated backups via CronJob |
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
| Auth | Email/password | SSO (OIDC/SAML), MFA | ✅ **CONCLUÍDO**: OIDC e SAML implementados (7 providers) com JIT provisioning; MFA (TOTP + WebAuthn) implementado; SCIM pendente |
| IAM | Basic user profile | RBAC + tenant roles | Roles baseline documented; constraints + RLS for viewer on writes; UI gating completed (domain/framework selection + voice commands) |
| Audit | Edge audit logs | Centralized, immutable audit | Extend audit to all sensitive actions and export to SIEM |
| Observability | Limited | Logs, metrics, traces | Structured logs com request ID; baseline de observabilidade e runbooks adicionados; OpenTelemetry, dashboards e alertas pendentes |
| Secrets | .env + secret refs | Secret manager | Concluido (env/file secret references + docs) |
| KMS/Vault | Not supported | Multi-provider | Parcial: env/file refs + resolver externo (secret:); provider adapters pending |
| Compliance | Partial | Evidence + reports | Add compliance packs, exportable evidence, retention |
| Storage | Supabase storage | Encrypted + retention | Configure S3-compatible storage, encryption at rest |
| Multi-tenancy | RLS | RLS + org isolation | Validate RLS, add org boundary checks |
| Data residency | N/A | Configurable | Define deployment options per region |
| CI/CD | Basic scripts | Build/scan/release | ✅ **CONCLUÍDO**: GitHub Actions workflow com SAST (Semgrep), SCA (npm audit), secret scan (TruffleHog), container scan (Trivy), SBOM (Syft), image signing (Cosign) |
| Security | Basic policies | Hardening | ✅ **CONCLUÍDO**: Headers, SSRF baseline, JWT enforcement, CORS allowlist, limites de payload, rate limits, NetworkPolicies, WAF (ModSecurity + OWASP CRS) |
| Container Hardening | Not defined | Non-root images | ✅ **CONCLUÍDO**: Dockerfile non-root + PodSecurityContext + SecurityContext (read-only FS, drop ALL capabilities) |
| Secret Exposure | Not defined | Zero exposure | Log redaction implemented; ✅ **CONCLUÍDO**: TruffleHog no CI pipeline |
| OWASP Top 10 | Not defined | Covered | ✅ **PARCIAL**: Mapeamento criado; WAF (ModSecurity) protege contra SQL Injection, XSS, Path Traversal, RCE; mitigações adicionais em API (auth/CORS/limites) |
| Proxy Support | Not defined | Supported | Concluido (HTTP_PROXY/HTTPS_PROXY/NO_PROXY + custom CA docs) |
| Observability | Limited | SLO-based | ✅ **PARCIAL**: SLOs definidos, Prometheus/Grafana/Loki/OTEL via Helm, 15+ alerts (PrometheusRule), 2 dashboards (Overview, SLOs); instrumentação OpenTelemetry pendente |
| Backup/DR | Not defined | RPO/RTO defined | ✅ **CONCLUÍDO**: Automated backup CronJob + S3 upload + retention policy; restore tests pendentes |
| Data Retention | Not defined | Policy-driven | ✅ **CONCLUÍDO**: CronJob automatizado para cleanup (change_logs/snapshots/siem_metrics); legal hold workflow pending |
| Privacy Compliance | Partial | LGPD/GDPR aligned | Add consent, data subject workflows, and DPIA |
| Secure SDLC | Partial | Full coverage | ✅ **CONCLUÍDO**: SAST (Semgrep), SCA (npm audit), SBOM (CycloneDX+SPDX), image signing (Cosign), vuln scanning (Trivy) |
| Incident Response | Not defined | Defined | ✅ **PARCIAL**: Runbooks documentados (INCIDENT_RESPONSE.md, ALERTS.md); falta automação e on-call integration |
| Release Gates | Partial | Enforced | ✅ **CONCLUÍDO**: CI bloqueia em vulnerabilidades CRITICAL/HIGH, test failures, e lint errors |
| SLAs | None | Enterprise SLAs | Define availability and incident response |

## New Features Roadmap (Phase 2)

As melhorias abaixo foram planejadas para a próxima fase do projeto:

### 📚 Documentation (Phase 2.1 - Q1 2026)

| Feature | Status | Priority | ADR |
|---------|--------|----------|-----|
| **Multi-Profile Docs** | ✅ Done | HIGH | ADR-0025 |
| - Admin documentation (PT/EN/ES) | ✅ PT-BR Done | HIGH | - |
| - Developer/Sustentação docs (PT/EN/ES) | ✅ PT-BR Done | HIGH | - |
| - QA/Test documentation (PT/EN/ES) | ✅ PT-BR Done | MEDIUM | - |
| - User guides (PT/EN/ES) | ✅ PT-BR Done | HIGH | - |
| - Auditor documentation (PT/EN/ES) | ✅ PT-BR Done | MEDIUM | - |
| **Documentation Portal** | ⏳ Pending | MEDIUM | ADR-0025 |
| - Search functionality | ⏳ Pending | MEDIUM | - |
| - PDF export | ⏳ Pending | LOW | - |
| - Version tracking | ⏳ Pending | LOW | - |

### 🏗️ Architecture & Infrastructure (Phase 2.2 - Q1 2026)

| Feature | Status | Priority | ADR |
|---------|--------|----------|-----|
| **Modular Architecture** | ✅ Done | HIGH | ADR-0024 |
| - Module loader system | ✅ Done | HIGH | - |
| - Event bus | ✅ Done | HIGH | - |
| - Service registry | ✅ Done | HIGH | - |
| - Governance module refactoring | ✅ Done | MEDIUM | - |
| **On-Prem Deployment** | ⏳ Pending | HIGH | - |
| - Separate Dockerfiles (FE/BE) | ⏳ Pending | HIGH | - |
| - Docker Compose (all-in-one) | ⏳ Pending | HIGH | - |
| - Installation guide | ⏳ Pending | HIGH | - |
| **CI/CD Enhancements** | ✅ Partial | HIGH | - |
| - Danger.js PR review | ✅ Done | HIGH | - |
| - Dependabot config | ✅ Done | HIGH | - |
| - ESLint + Prettier | ✅ Done | HIGH | - |
| - Pre-commit hooks | ⏳ Pending | MEDIUM | - |

### 🎨 UX/UI Enhancements (Phase 2.3 - Q1-Q2 2026)

| Feature | Status | Priority | ADR |
|---------|--------|----------|-----|
| **Theme System** | ✅ Done | HIGH | ADR-0027 |
| - 5+ built-in themes | ✅ Done | HIGH | - |
| - Custom colors/fonts | ✅ Done | HIGH | - |
| - Theme customization UI | ⏳ Pending | MEDIUM | - |
| - High contrast mode (WCAG) | ✅ Done | HIGH | - |
| **Animations** | ✅ Done | MEDIUM | ADR-0027 |
| - Page transitions | ✅ Done | MEDIUM | - |
| - Component animations | ✅ Done | LOW | - |
| - Stagger effects | ✅ Done | LOW | - |
| **AI Assistant Enhancements** | ✅ Done | MEDIUM | ADR-0027 |
| - Draggable positioning | ✅ Done | MEDIUM | - |
| - User enable/disable | ⏳ Pending | HIGH | - |
| - Global admin toggle | ⏳ Pending | HIGH | - |
| **Personalization** | ✅ Partial | MEDIUM | ADR-0027 |
| - User avatars/photos | ✅ Done | MEDIUM | - |
| - Custom organization logo | ⏳ Pending | HIGH | - |
| - Favicon customization | ⏳ Pending | LOW | - |
| **Custom Dashboards** | ⏳ Pending | HIGH | ADR-0027 |
| - Dashboard builder UI | ⏳ Pending | HIGH | - |
| - Widget library | ⏳ Pending | HIGH | - |
| - Admin controls (enable/disable) | ⏳ Pending | HIGH | - |
| **Design System** | ⏳ Pending | HIGH | - |
| - Component library documentation | ⏳ Pending | MEDIUM | - |
| - Design patterns guide | ⏳ Pending | MEDIUM | - |
| - Layout templates | ⏳ Pending | MEDIUM | - |

### 📊 Reporting System (Phase 2.4 - Q2 2026)

| Feature | Status | Priority | ADR |
|---------|--------|----------|-----|
| **Advanced Reporting** | ✅ Done | HIGH | ADR-0026 |
| - Reports page/dashboard | ✅ Done | HIGH | - |
| - On-demand generation | ✅ Done | HIGH | - |
| - Scheduled reports | ✅ Done | HIGH | - |
| - Email distribution | ✅ Done | HIGH | - |
| **Report Templates** | ✅ Done | HIGH | ADR-0026 |
| - Executive summary | ⏳ Pending | HIGH | - |
| - Compliance status | ⏳ Pending | HIGH | - |
| - Audit reports | ⏳ Pending | HIGH | - |
| - Custom templates | ⏳ Pending | MEDIUM | - |
| **Multi-format Export** | ⏳ Pending | HIGH | ADR-0026 |
| - PDF generation | ⏳ Pending | HIGH | - |
| - Excel export | ⏳ Pending | HIGH | - |
| - CSV export | ⏳ Pending | MEDIUM | - |
| - JSON export | ⏳ Pending | LOW | - |

### 🔍 Auditor Role (Phase 2.5 - Q2 2026)

| Feature | Status | Priority | ADR |
|---------|--------|----------|-----|
| **Auditor Role** | 📋 Planned | HIGH | ADR-0028 |
| - Role definition & permissions | ⏳ Pending | HIGH | - |
| - RLS policies | ⏳ Pending | HIGH | - |
| - Audit timeline UI | ⏳ Pending | HIGH | - |
| - User activity dashboard | ⏳ Pending | HIGH | - |
| - Forensic investigation tools | ⏳ Pending | MEDIUM | - |
| **Enhanced Logging** | ⏳ Pending | HIGH | ADR-0028 |
| - Session tracking | ⏳ Pending | HIGH | - |
| - Geolocation capture | ⏳ Pending | MEDIUM | - |
| - Device fingerprinting | ⏳ Pending | MEDIUM | - |
| - Before/after state capture | ⏳ Pending | HIGH | - |
| **Compliance Reports** | ⏳ Pending | MEDIUM | ADR-0028 |
| - Audit report templates | ⏳ Pending | MEDIUM | - |
| - Anomaly detection | ⏳ Pending | LOW | - |
| - Relationship graphs | ⏳ Pending | LOW | - |

### 🔌 Observability Integrations (Phase 2.6 - Q2 2026)

| Feature | Status | Priority | ADR |
|---------|--------|----------|-----|
| **Grafana Integration** | ✅ Partial | HIGH | ADR-0020 |
| - Pre-built dashboards | ✅ Done | HIGH | - |
| - Custom metrics | ⏳ Pending | MEDIUM | - |
| - Alert manager | ⏳ Pending | MEDIUM | - |
| **ELK Stack Integration** | ⏳ Pending | MEDIUM | - |
| - Logstash pipeline | ⏳ Pending | MEDIUM | - |
| - Elasticsearch index templates | ⏳ Pending | MEDIUM | - |
| - Kibana dashboards | ⏳ Pending | MEDIUM | - |
| **Other Integrations** | ⏳ Pending | LOW | - |
| - Datadog | ⏳ Pending | LOW | - |
| - New Relic | ⏳ Pending | LOW | - |
| - Splunk | ⏳ Pending | LOW | - |

### 📅 Timeline Summary

**Q1 2026** (Jan-Mar):
- Documentation multi-perfil (3 idiomas)
- Modular architecture
- On-prem deployment
- Theme system (5+ temas)

**Q2 2026** (Apr-Jun):
- Reporting system completo
- Auditor role & forensics
- Custom dashboards
- Observability integrations

**Q3 2026** (Jul-Sep):
- Future modules (Risk Management, Policy Management)
- Advanced analytics
- ML-based features

## ADRs for Enterprise Gaps

**Existing ADRs:**
- `docs/adr/0021-sso-provider-strategy.md` ✅
- `docs/adr/0022-rbac-model.md` ✅
- `docs/adr/0023-data-access-abstraction-and-analytics.md` ✅

**New ADRs (Phase 2):**
- `docs/adr/0024-modular-architecture.md` ✅
- `docs/adr/0025-multi-profile-documentation.md` ✅
- `docs/adr/0026-reporting-system.md` ✅
- `docs/adr/0027-ux-enhancements.md` ✅
- `docs/adr/0028-auditor-role.md` ✅
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


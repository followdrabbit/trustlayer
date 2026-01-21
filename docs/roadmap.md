# TrustLayer - Roadmap

Este documento descreve o roadmap de desenvolvimento do TrustLayer.

**Última atualização**: 2026-01-21

---

## Visão Geral

O TrustLayer é uma plataforma de governança de segurança multi-domínio. O roadmap está organizado em fases com foco em estabilidade, funcionalidades enterprise e expansão de domínios.

---

## Status das Fases

| Fase | Status | Período |
| ---- | ------ | ------- |
| 1.0 - Core Platform | ✅ Concluído | Q3 2025 |
| 1.1 - AI & Voice | ✅ Concluído | Q4 2025 |
| 1.2 - Enterprise | ✅ Concluído | Q1 2026 |
| 1.3 - Developer Experience | 🚧 Em Andamento | Q1 2026 |
| 2.0 - Platform Expansion | 📋 Planejado | Q2 2026 |

---

## Fase 1.0 - Core Platform ✅

**Status**: Concluído (Q3 2025)

### Objetivos

- [x] Assessment multi-domínio (AI Security, Cloud Security, DevSecOps)
- [x] Dashboards especializados (Executive, GRC, Specialist)
- [x] Sistema de scoring e maturidade
- [x] Gap analysis e roadmap de remediação
- [x] Exportação de relatórios HTML
- [x] Autenticação via Supabase
- [x] Row Level Security (RLS)
- [x] Internacionalização (PT-BR, EN-US, ES-ES)

### ADRs Relacionados

- ADR-0001: ADR Process
- ADR-0002: Self-Hosted Supabase
- ADR-0003: Containerized K8s Deployment
- ADR-0004: Flexible Data and Deployment Topologies
- ADR-0005: Framework Catalog and XLSX Import

---

## Fase 1.1 - AI & Voice ✅

**Status**: Concluído (Q4 2025)

### Objetivos

- [x] Assistente de IA com múltiplos provedores
- [x] Lovable AI Gateway como padrão
- [x] Text-to-Speech (Web Speech API)
- [x] Speech-to-Text (Web Speech API / Whisper)
- [x] Speaker verification com perfil de voz
- [x] Comandos de voz para navegação
- [x] Integração SIEM (JSON, CEF, LEEF, Syslog)
- [x] Catálogo migrado para banco de dados

### ADRs Relacionados

- ADR-0007: Modular Dashboards and Catalog

---

## Fase 1.2 - Enterprise ✅

**Status**: Concluído (Q1 2026)

### Objetivos

- [x] SSO/SAML integration
- [x] RBAC model completo
- [x] Observability stack (OpenTelemetry, Grafana, Prometheus)
- [x] CI/CD pipeline completo
- [x] Container hardening
- [x] Security baseline (OWASP Top 10)
- [x] Backup e disaster recovery
- [x] Data retention policies

### ADRs Relacionados

- ADR-0008: Security Baseline
- ADR-0010: Secret Management KMS
- ADR-0011: Container Hardening
- ADR-0012: Observability and SLOs
- ADR-0013: Backup and Disaster Recovery
- ADR-0014: Data Retention and Privacy
- ADR-0016: Secure SDLC and Supply Chain
- ADR-0018: SSRF URL Validation
- ADR-0019: CSP Report Only
- ADR-0020: Observability Stack Selection
- ADR-0021: SSO Provider Strategy
- ADR-0022: RBAC Model

---

## Fase 1.3 - Developer Experience 🚧

**Status**: Em Andamento (Q1 2026)

### Objetivos

- [x] Arquitetura modular (ADR-0024)
- [x] Documentação multi-perfil (ADR-0025)
- [x] Sistema de relatórios avançado (ADR-0026)
- [x] Melhorias de UX (ADR-0027)
- [x] Role de auditor (ADR-0028)
- [x] Local development experience (ADR-0029)
  - [x] docker-compose.local.yml
  - [x] scripts/setup.sh
  - [x] .env.local.example
  - [x] Makefile
- [ ] DevContainer support
- [ ] Storybook para componentes UI
- [ ] API documentation (OpenAPI/Swagger)

### ADRs Relacionados

- ADR-0024: Modular Architecture
- ADR-0025: Multi-Profile Documentation
- ADR-0026: Reporting System
- ADR-0027: UX Enhancements
- ADR-0028: Auditor Role
- ADR-0029: Local Development Experience

---

## Fase 2.0 - Platform Expansion 📋

**Status**: Planejado (Q2 2026)

### Objetivos

#### Novos Módulos

- [ ] **Risk Management Module**
  - Risk register
  - Risk matrix (5x5)
  - Risk treatment plans
  - Risk appetite configuration

- [ ] **Compliance Module**
  - Compliance calendar
  - Control mapping
  - Evidence management
  - Audit trail

- [ ] **Asset Management Module**
  - Asset inventory
  - Asset classification
  - Vulnerability tracking
  - Asset risk scoring

- [ ] **Incident Response Module**
  - Incident ticketing
  - Playbook execution
  - Timeline tracking
  - Post-mortem reports

#### Integrações

- [ ] Jira/ServiceNow integration
- [ ] Slack/Teams notifications
- [ ] AWS Security Hub
- [ ] Azure Sentinel
- [ ] Splunk SIEM

#### Infrastructure

- [ ] Multi-region deployment
- [ ] Edge caching
- [ ] GraphQL API
- [ ] Webhook system

---

## Fase 2.1 - AI Evolution 📋

**Status**: Planejado (Q3 2026)

### Objetivos

- [ ] RAG (Retrieval Augmented Generation) com documentos
- [ ] Auto-assessment suggestions
- [ ] Anomaly detection em métricas
- [ ] Natural language queries para dashboards
- [ ] AI-powered remediation suggestions
- [ ] Compliance gap prediction

---

## Fase 3.0 - Marketplace 📋

**Status**: Planejado (Q4 2026)

### Objetivos

- [ ] Plugin architecture
- [ ] Custom module SDK
- [ ] Framework marketplace
- [ ] Integration templates
- [ ] White-label support
- [ ] Multi-tenant SaaS offering

---

## Backlog Priorizado

### Alta Prioridade

1. DevContainer configuration
2. Storybook setup
3. OpenAPI documentation
4. Risk Management module MVP
5. Jira integration

### Média Prioridade

6. Compliance module MVP
7. Slack notifications
8. GraphQL API
9. Multi-region support
10. RAG implementation

### Baixa Prioridade

11. Asset Management module
12. Incident Response module
13. Marketplace infrastructure
14. White-label support
15. Mobile app

---

## Métricas de Sucesso

| Métrica | Target Q2 2026 |
| ------- | -------------- |
| Time to first assessment | < 10 min |
| Setup time (new developer) | < 5 min |
| Test coverage | > 80% |
| Lighthouse score | > 90 |
| API response time (p95) | < 200ms |
| Uptime SLA | 99.9% |

---

## Como Contribuir

1. Veja as [issues abertas](https://github.com/trustlayer/trustlayer/issues)
2. Leia o [guia de contribuição](docs/developer/pt-BR/contributing.md)
3. Participe das discussões no GitHub Discussions
4. Submeta PRs seguindo o processo definido

---

## Changelog

Para histórico detalhado de mudanças, veja o [CHANGELOG.md](../CHANGELOG.md).

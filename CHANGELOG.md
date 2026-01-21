# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

#### Node.js 20 Upgrade
- **Dockerfiles**: Atualizado `node:18-alpine` para `node:20-alpine` em Dockerfile.frontend e Dockerfile.backend
- **CI/CD Workflows**: Atualizado Node.js de 18 para 20 em ci.yml e ci-cd.yml
- **Documentation**: Atualizado requisito mínimo de Node.js para 20.0+ em LOCAL_DEVELOPMENT.md e setup.sh
- **Motivation**: Supabase SDK v2.90.1 requer Node.js >= 20.0.0

#### Environment Variable Standardization
- **VITE_SUPABASE_ANON_KEY**: Padronizado nome da variável em todo o projeto (anteriormente havia inconsistência com `VITE_SUPABASE_PUBLISHABLE_KEY`)
- Arquivos atualizados: client.ts, .env.example, .env.local.example, Dockerfile, docker-compose.yml, CI/CD, Helm templates, documentação

#### Docker Compose
- Removido atributo obsoleto `version: '3.8'` do docker-compose.yml
- Corrigido flag obsoleto `--only=production` para `--omit=dev` no npm ci
- Adicionado `--ignore-scripts` no Dockerfile.backend para evitar erro do husky em produção

#### Dependencies
- Atualizado `jsdom` de 20.0.3 para 27.4.0 (remove warnings de APIs deprecadas)
- Adicionado `husky` e `lint-staged` às devDependencies
- Script `prepare` tornado resiliente para ambientes sem husky instalado

### Added

#### Local Development Experience (ADR-0029)
- **docker-compose.local.yml**: Docker Compose otimizado para desenvolvimento local
  - PostgreSQL com seed automático
  - Mailhog para testes de email
  - Redis opcional (profile `with-cache`)
  - Adminer opcional (profile `with-tools`)
- **scripts/setup.sh**: Script de setup automatizado
  - Verificação de requisitos (Docker, Node.js)
  - Configuração automática de variáveis de ambiente
  - Instalação de dependências
  - Seed do banco e provisionamento de admin
- **.env.local.example**: Template de variáveis para desenvolvimento
  - Valores padrão funcionais
  - Configurações relaxadas para dev
  - Documentação inline
- **Makefile**: Interface unificada de comandos
  - `make setup/dev/up/down/logs`
  - `make db-shell/db-reset/db-dump`
  - `make test/lint/format`
  - `make help` com documentação
- **postgres/seed-local.sql**: Dados iniciais para desenvolvimento

#### Multi-Profile Documentation (ADR-0025)
- Documentação completa para todos os perfis:
  - **Admin** (23 arquivos): Deployment, segurança, observabilidade, manutenção
  - **Developer** (7 arquivos): API, contribuição, testes, database schema
  - **User** (6 arquivos): Guias de uso, FAQ, assessments
  - **QA** (5 arquivos): Planos de teste, automação, performance
  - **Auditor** (4 arquivos): Compliance, audit trails, reports
- Documentação em PT-BR seguindo padrão ISO

#### Enterprise Features (ADR-0026, ADR-0027, ADR-0028)
- **Sistema de Relatórios**: PDF, HTML, Excel com scheduling
- **Melhorias de UX**: Onboarding wizard, quick actions, breadcrumbs
- **Role de Auditor**: Acesso read-only para compliance

#### Core Infrastructure (ADR-0024)
- **ModuleLoader**: Registro, ativação e agregação de rotas/navegação de módulos
- **EventBus**: Sistema de eventos para comunicação entre módulos
- **ServiceRegistry**: Registro centralizado de serviços
- **AppRouter**: Renderização dinâmica de rotas dos módulos ativos
- **MainLayout**: Sidebar dinâmica baseada nos módulos ativos

### Changed

#### Modular Architecture
- Migração de features de governança para `src/modules/governance`
- Migração de código compartilhado para `src/shared`
- Renderização correta de ícones dinâmicos no sidebar
- Rota 404 movida para dentro do MainLayout

### Fixed

- Renderização de ícones faltantes na navegação do sidebar
- Consistência do layout da página 404
- Componentes de página faltantes referenciados no manifest do módulo governance
- Definições de tipos compartilhados (`Answer`, `UserProfile`)
- Componente `DashboardCard` e integração com `useDashboardMetrics`
- Página `Assessment` com lista de seleção de domínios
- `DashboardGRC` com gráficos e `DashboardSpecialist` com listas de gaps
- `useDashboardMetrics` fornecendo dados mock para gráficos e scores de domínio

---

## [1.2.0] - 2026-01-15

### Added

- **Observability Stack** (ADR-0020)
  - OpenTelemetry instrumentation (traces, metrics, logs)
  - Grafana dashboards pré-configurados
  - Prometheus AlertManager com regras de alerta
  - Loki para agregação de logs

- **Complete CI/CD Pipeline**
  - GitHub Actions com stages de build, test, security scan
  - Semgrep SAST scanning
  - Codecov integration
  - Docker image building e push automático
  - Helm chart validation

- **Security Features** (ADR-0008, ADR-0016)
  - Rate limiting por endpoint
  - CORS configuration refinada
  - CSP em modo report-only (ADR-0019)
  - SSRF protection com URL validation (ADR-0018)
  - Container hardening (ADR-0011)

- **SSO/SAML Integration** (ADR-0021)
  - SAML 2.0 support
  - OIDC support
  - Auto-provisioning de usuários

- **RBAC Model** (ADR-0022)
  - Roles: admin, manager, analyst, auditor, viewer
  - Row Level Security (RLS) policies
  - Permission matrix por módulo

### Changed

- Atualização de dependências de segurança
- Melhorias de performance no carregamento de dashboards
- Refinamento das políticas de retenção de dados (ADR-0014)

### Security

- Correção de vulnerabilidades em dependências npm
- Hardening de configurações Docker
- Implementação de secret management (ADR-0010)

---

## [1.1.0] - 2025-12-01

### Added

- **AI Assistant** com múltiplos provedores
  - Lovable AI Gateway (padrão)
  - OpenAI, Claude, Gemini, Ollama support
  - Context-aware responses baseadas no assessment

- **Voice Features**
  - Text-to-Speech (Web Speech API)
  - Speech-to-Text (Web Speech API / Whisper)
  - Speaker verification com perfil de voz
  - Comandos de voz para navegação

- **SIEM Integration**
  - Formatos: JSON, CEF, LEEF, Syslog
  - Health monitoring
  - Configurable endpoints

- **Internationalization**
  - PT-BR, EN-US, ES-ES
  - Sincronização de preferência no perfil

### Changed

- Migração de catálogo para banco de dados
- Melhorias no sistema de snapshots de maturidade
- Refinamento de dashboards por perfil

---

## [1.0.0] - 2025-10-01

### Added

- **Multi-Domain Security Assessment**
  - AI Security (NIST AI RMF, ISO 23894)
  - Cloud Security (CSA CCM, ISO 27017)
  - DevSecOps (NIST SSDF, OWASP)

- **Dashboards**
  - Executive Dashboard para CISO
  - GRC Dashboard para compliance
  - Specialist Dashboard para técnicos

- **Core Features**
  - Assessment questionnaires
  - Maturity scoring
  - Gap analysis
  - Remediation roadmap
  - HTML report export

- **Authentication**
  - Supabase Auth integration
  - User provisioning
  - Role-based access

- **Infrastructure**
  - React 18 + TypeScript + Vite
  - Tailwind CSS + shadcn/ui
  - Supabase (self-hosted capable)
  - PostgreSQL with RLS

### Security

- Row Level Security em todas as tabelas
- Audit logging
- Input validation com Zod

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.2.0 | 2026-01-15 | Observability, CI/CD, SSO |
| 1.1.0 | 2025-12-01 | AI Assistant, Voice, SIEM |
| 1.0.0 | 2025-10-01 | Initial release |

## Migration Guides

- [Migrating from 1.1.x to 1.2.x](docs/admin/pt-BR/version-migration.md#v11-para-v12)
- [Migrating from 1.0.x to 1.1.x](docs/admin/pt-BR/version-migration.md#v10-para-v11)

# 📋 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Adicionado

- **OpenTelemetry Dependencies**: Pacotes completos para instrumentação frontend (Phase 6)
  - @opentelemetry/api, @opentelemetry/sdk-trace-web, @opentelemetry/sdk-metrics
  - Exporters OTLP HTTP para traces e métricas
  - Auto-instrumentações: fetch, XHR, document-load, user-interaction
  - Context zone e recursos para propagação de contexto
- **Report Generator Edge Function**: Geração completa de relatórios (ADR-0026)
  - Suporte a PDF, Excel, CSV e HTML
  - Templates configuráveis com seções e styling
  - Upload automático para Supabase Storage
  - Integração com report-scheduler para relatórios agendados
  - Busca de dados dinâmica (executive summary, compliance, audit, assessments, trends)
  - Placeholder para notificações por email
- **Device Fingerprinting Service**: Fingerprinting para segurança e detecção de fraude (ADR-0028)
  - Coleta de características do dispositivo (browser, screen, hardware, timezone)
  - Canvas fingerprint, WebGL fingerprint, Audio fingerprint, Font detection
  - Hash SHA-256 para privacidade
  - Comparação de fingerprints com score de similaridade
  - Cálculo de risco baseado em mudanças de dispositivo
  - Extração automática de DeviceInfo (type, os, browser, screenResolution)
  - Cache de fingerprint com TTL de 5 minutos
- **Anomaly Detection Service**: Detecção de anomalias e padrões suspeitos (ADR-0028)
  - 13 algoritmos de detecção:
    - multiple_failed_logins, brute_force_attempt
    - ip_change, location_change, impossible_travel
    - unusual_hours, rapid_actions
    - privilege_escalation, unauthorized_access
    - bulk_export, bulk_delete
    - new_device, concurrent_sessions
  - Configuração customizável de thresholds
  - User baseline learning (padrões típicos de comportamento)
  - Cálculo de risk score (0-100) com fatores ponderados
  - Severidades: low, medium, high, critical
  - Suporte a geolocalização e cálculo de distância (Haversine)
- **Kubernetes Deployment**: Helm charts completos para deployment enterprise (Phase 4)
  - Support para deployment modes: in-cluster, split frontend/backend, on-prem
  - HorizontalPodAutoscaler para frontend (CPU/Memory-based)
  - NetworkPolicies para isolamento de rede
  - PodSecurityContext e SecurityContext para hardening
  - Liveness e Readiness probes para health checking
  - Suporte para external PostgreSQL (RDS/on-prem BDS)
  - Integração com external Supabase instance
- **Automated Backups**: CronJob para backups automáticos do PostgreSQL (Phase 10)
  - Upload para S3-compatible storage
  - Retention policy enforcement
  - Support para PITR (Point-in-Time Recovery) via WAL archiving
- **Data Retention**: CronJob automatizado para limpeza de dados antigos (Phase 10)
  - Cleanup de change_logs, maturity_snapshots, siem_metrics
  - Configurável via Helm values (retention periods)
- **CI/CD Pipeline**: GitHub Actions workflow completo com security gates (ADR-0016)
  - SAST com Semgrep (OWASP Top 10, secrets, security-audit)
  - SCA com npm audit
  - Secret scanning com TruffleHog
  - Container scanning com Trivy (CRITICAL/HIGH vulnerabilities)
  - SBOM generation (CycloneDX + SPDX)
  - Image signing com Cosign
  - SLSA provenance attestation
  - Automated deployment para staging (develop branch)
  - Manual approval para production (release tags)
- **Observability Foundations**: Estrutura base para OpenTelemetry (Phase 6)
  - Helm values para Prometheus, Grafana, Loki
  - ServiceMonitors para PostgreSQL metrics
  - Structured logging preparado para OTEL Collector
  - Alert rules e dashboards placeholder
- **Security Hardening**:
  - PodSecurityStandards enforcement (restricted profile)
  - Non-root container runtime enforcement
  - Read-only root filesystem para frontend
  - Capabilities drop (ALL)
  - SeccompProfile (RuntimeDefault)
- **SSO Integration** (ADR-0021): Suporte enterprise para Single Sign-On
  - OIDC provider integration (Azure AD, Okta, Keycloak, Google, Auth0)
  - PKCE support para public clients
  - Just-in-Time (JIT) user provisioning
  - Role mapping automático (IdP groups → TrustLayer roles)
  - Edge Functions: sso-provision-user, sso-signin
  - Componentes React: SSOLoginButton, SSOCallbackHandler
  - Documentação completa em [docs/SSO_INTEGRATION.md](docs/SSO_INTEGRATION.md)
- **Observability Enhancements**:
  - PrometheusRule com 15+ alertas (availability, latency, database, resources)
  - ServiceMonitors para PostgreSQL e frontend
  - Grafana dashboards pré-configurados (Overview, SLOs)
  - Métricas SLO: Login availability (99.9%), Assessment latency (P95 < 2.0s), AI first token (P95 < 2.5s)
- **Helm Charts Additions**:
  - PgBouncer deployment com connection pooling
  - Backup PVC para persistent storage
  - NetworkPolicies para frontend e PostgreSQL
  - ConfigMaps para Grafana dashboards
- **OpenTelemetry Instrumentation** (Fase 6): Observabilidade completa com traces, metrics e logs
  - Frontend SDK com auto-instrumentation (fetch, XHR, clicks, page loads)
  - Edge Functions SDK para Deno runtime
  - Custom metrics para negócio (assessment completion, dashboard load, AI latency, voice commands)
  - SLO metrics tracking (login availability, latency)
  - Distributed tracing com W3C Trace Context propagation
  - React hooks: usePageViewTracking, useRenderTracking
  - Helper functions: traceAsync, traceSync, recordMetric
  - OTLP exporters para Prometheus, Tempo/Jaeger, Loki
  - Documentação completa em [docs/OPENTELEMETRY.md](docs/OPENTELEMETRY.md)
- **Restore Testing Automation** (Fase 10): Validação automática de backups
  - Script bash automatizado para restore testing (test-restore.sh)
  - Validação de integridade de dados (table count, FK constraints)
  - RPO/RTO compliance checking
  - CronJob semanal no Helm para testes automatizados
  - Relatórios de teste com métricas detalhadas
  - Alertas em caso de falha de restore
- **SAML 2.0 Support** (ADR-0021): Autenticação SAML para provedores enterprise
  - SAML provider integration (Azure AD SAML, Okta SAML, Keycloak, Google Workspace, OneLogin, Ping, ADFS)
  - SP metadata generation automático
  - Attribute mapping configurável
  - Role mapping baseado em grupos SAML
  - Edge Function: saml-validate (validação server-side de SAML responses)
  - Componentes React: SAMLCallbackHandler, SAMLACSPage
  - Just-in-Time (JIT) provisioning para usuários SAML
  - Documentação expandida em [docs/SSO_INTEGRATION.md](docs/SSO_INTEGRATION.md)
- **Multi-Factor Authentication (MFA)**: Autenticação de múltiplos fatores
  - **TOTP Support** (RFC 6238):
    - Compatível com Google Authenticator, Microsoft Authenticator, Authy
    - QR code generation para easy setup
    - Backup codes (8 códigos one-time, SHA-256 hashed)
    - Edge Functions: mfa-totp-enable, mfa-totp-verify-setup, mfa-totp-verify-login, mfa-totp-disable
  - **WebAuthn Support** (FIDO2):
    - Security keys (YubiKey, etc.)
    - Platform authenticators (TouchID, FaceID, Windows Hello)
    - Multiple credentials per user
    - Edge Functions: mfa-webauthn-register-begin/complete, mfa-webauthn-login-begin/complete
  - Tabela `mfa_factors` para armazenar credentials
  - Tabela `mfa_challenges` para WebAuthn challenges temporários
  - Audit logging de eventos MFA
  - Componente React: MFASettings (setup e gerenciamento)
  - Admin-enforceable MFA (campo `mfa_required` em profiles)
- **Web Application Firewall (WAF)**: Proteção ModSecurity para Ingress
  - ModSecurity WAF integration via NGINX Ingress Controller
  - OWASP Core Rule Set (CRS) 3.3.x support
  - TrustLayer custom rules (SQL Injection, XSS, Path Traversal, RCE, CSRF)
  - Rate limiting baseado em IP (configurável)
  - Scanner detection (Nikto, Nmap, SQLMap, etc.)
  - File upload protection (extensões perigosas bloqueadas)
  - Protocol violation detection
  - Admin endpoint protection
  - 3 modos de operação: DetectionOnly, On, Off
  - ConfigMaps: modsecurity-config, modsecurity-rules, modsecurity-data
  - Documentação completa em [docs/WAF_CONFIGURATION.md](docs/WAF_CONFIGURATION.md)

### Modificado
- Documentacao atualizada para requisitos enterprise (admin console, sem demo, self-hosted).
- Roadmap enterprise atualizado com observabilidade, backup/DR, privacidade, proxy e SDLC seguro.
- Catalogo migrado para leitura via banco de dados (remocao de JSON estatico).
- Documentacao ajustada para bootstrap admin e importacao inicial do catalogo.
- Fluxo de autenticacao atualizado para provisionamento por admin (sem signup/demo).
- Hook de autenticacao ajustado para remover sign-up do cliente.
- Pagina de configuracoes limitada a preferencias do usuario.
- Dashboards agora renderizam layouts a partir do catalogo de widgets.
- Edge Functions now enforce JWT auth, CORS allowlists, and payload size limits.
- AI assistant now requires authenticated sessions.
- SIEM forward validates endpoint URLs and applies request timeouts.
- Edge Function URL validation blocks local/private endpoints unless `ALLOW_LOCAL_ENDPOINTS=true` is set (frontend uses `VITE_ALLOW_LOCAL_ENDPOINTS=true`).
- Edge Function URL validation no longer falls back to frontend flags; use `ALLOW_LOCAL_ENDPOINTS=true`.
- AI provider endpoint validation now respects `VITE_ALLOW_LOCAL_ENDPOINTS` for local endpoints (including Ollama).
- Audit geo lookup disabled by default (opt-in).
- Preferencias de STT nao retornam API keys quando inline secrets estao desabilitados.
- Inicializacao de STT agora valida API key/endpoint e bloqueia uso quando a politica de inline secrets nao permite.
- Edge Functions agora exigem `Content-Type: application/json` e validam roles de mensagens no AI assistant.
- Audit Log e SIEM Forward validam payloads (allowlist de entity/action e limites basicos de tamanho).
- Avaliacao em modo somente leitura para role viewer (UI bloqueia edicao).
- RLS em answers agora bloqueia escrita para role viewer.
- RLS agora bloqueia escrita para viewer em assessment_meta, custom catalog, disabled lists, annotations, snapshots e question_versions.
- Seletores de dominio e frameworks agora respeitam role viewer (somente leitura).
- Comandos de voz bloqueiam troca de dominio para perfis somente leitura.
- Captura de snapshots agora respeita role viewer (sem escrita).
- Bootstrap de assessment_meta nao falha quando a role nao permite escrita.
- Cache de role com TTL por usuario para reduzir consultas repetidas ao perfil.
- Estado local reverte selecoes de dominio/framework quando a persistencia falha.
- Avaliacao read-only usa frameworks habilitados quando nao ha selecao salva.
- Importacao XLSX agora bloqueia macros/objetos embutidos e suporta malware scan opcional.
- Secret references agora suportam resolver externo via prefixo secret: e SECRET_PROVIDER_URL.
- Resolver externo agora valida URL, usa proxy e timeout configuravel (SECRET_PROVIDER_TIMEOUT_MS).
- Documentado contrato do resolver externo e demo local para `secret:`.
- Exportacao de snapshots para analytics via Edge Function (opcional) e hook no frontend.
- Documentado contrato de exportacao analytics e demo local.
- Script de limpeza de retencao para audit logs/snapshots/metricas e politica documentada.

### Adicionado
- ADR 0009 para governanca de documentacao e CHANGELOG.
- ADRs 0012-0016 para observabilidade, backup/DR, privacidade, proxy e SDLC seguro.
- ADR 0017 para separacao do Admin Console e configuracoes de usuario.
- ADR 0018 para validacao de URLs e protecao SSRF.
- ADR 0019 para CSP em modo report-only no frontend.
- ADR 0021 para estrategia de SSO (OIDC/SAML).
- ADR 0022 para modelo de RBAC e mapeamento de roles.
- ADR 0023 para abstracao de acesso a dados e integracao analitica.
- Dockerfile com runtime non-root e Nginx unprivileged para o frontend.
- Headers de seguranca no Nginx do frontend.
- Documento de baseline de seguranca com mapeamento OWASP Top 10.
- Validacao de URLs para endpoints de integracoes (SSRF baseline).
- Bloqueio de URLs com credenciais embutidas nas integracoes.
- HSTS adicionado ao Nginx do frontend.
- Permissions-Policy ajustado para permitir microfone no frontend.
- CSP em modo report-only para baseline do frontend.
- Template de ambiente `.env.example` para configuracao local.
- Roadmap enterprise atualizado com status das entregas concluídas.
- Documentacao do Admin Console adicionada.
- Documentacao atualizada para remover referencias de demo (API, screenshots, post).
- README/llm.txt limpos de referencias a init-demo.
- Ajuste no Settings para passar estado de salvamento no STT.
- Remocao de textos/chaves de demo das traducoes e snapshots de i18n.
- Edge functions de demo removidas do Supabase config e codigo.
- Migracao para remover artefatos de demo (policies e usuario) no banco.
- docs/API.md refeito com endpoints atuais (sem demo).
- Roadmap enterprise atualizado com status de seguranca/OWASP.
- Testes basicos para validacao de URL (SSRF baseline).
- README atualizado com contagem correta de Edge Functions.
- docs/SETUP.md atualizado com passo do .env.example.
- Plano de execucao enterprise com gates de teste.
- Script de seed do catalogo no banco para ambiente local.
- Documentos de setup e catalogo para importacao inicial.
- Script de provisionamento do usuario admin via service role.
- Script de provisionamento de usuarios locais via service role.
- Painel administrativo com rota protegida e separacao de configuracoes globais.
- Shared Edge Function HTTP helpers for CORS and security headers.
- Structured Edge Function logging with request IDs for traceability.
- Observability baseline and runbooks (incident response + alerts).
- Backup/DR runbook added.
- ADR 0013 marked as Accepted (backup and DR baseline).
- ADR 0020 for observability stack selection.
- ADR 0012 marked as Accepted (observability/SLO baseline).
- XLSX template and secure validation for domain catalog import.
- Domain catalog import now includes preview/dry-run with sample records and integrity warnings.
- XLSX catalog template now includes templateVersion metadata.
- Domain catalog import now logs audit events.
- Bulk question import enforces XLSX-only, size, row, and formula limits.
- Layouts de dashboards persistidos com editor admin e catalogo de widgets.
- Outbound proxy support for Edge Functions via HTTP_PROXY/HTTPS_PROXY/NO_PROXY.
- Secret references (env/file) for AI provider and SIEM credentials.
- Inline secrets disabled by default (opt-in via VITE_ALLOW_INLINE_SECRETS).
- API-key STT providers now require VITE_ALLOW_INLINE_SECRETS to store keys.
- Edge Function logs redact tokens and secrets.
- Edge Functions accept env/file secret refs for service role and Lovable keys.
- Admin list queries no longer return stored secret fields.
- Rate limits configuraveis por Edge Function (AI assistant, audit log, SIEM forward).
- Limites configuraveis para tamanho total e por mensagem no AI assistant.
- Politica opcional de timeout de sessao e idle logout configuravel no frontend.
- Trigger para impedir escalacao de role em perfis por usuarios autenticados.
- RLS policies para escrita admin-only nas tabelas globais de catalogo.
- Constraint de roles no perfil (admin, manager, analyst, viewer, user).
- Provisionamento de usuario atualizado para aceitar novos roles via USER_ROLE.
- .env.example atualizado com ALLOWED_ORIGINS, MAX_REQUEST_BODY_BYTES e AUDIT_GEO_LOOKUP_ENABLED.
- AI providers e SIEM integrations agora permitem escrita apenas por administradores.

### Removido
- Paginas e fluxos de demo/signup no app.

## [1.2.0] - 2025-01-17

### Adicionado

#### 🎨 Sistema de Design
- Novo sistema de skeleton loading animado com efeitos shimmer e pulse
- Componentes `ShimmerSkeleton`, `PulseSkeleton`, `StatsCardSkeleton`, `TableSkeleton`, `ChartSkeleton`
- Skeletons específicos para `AuditLogsPanel`, `SIEMIntegrationsPanel`, `AIProvidersPanel`
- Animações de entrada em cascata (stagger) para cards em todas as abas de Settings
- Efeitos de hover com scale e glow em cards interativos

#### 🔧 Configurações
- Painel de Preferências centralizado na página de Settings
- Busca global de configurações com suporte i18n
- Filtros e ordenação para listas de gerenciamento

#### 📊 Analytics
- Comparação de períodos side-by-side nos dashboards
- Anotações em gráficos para marcar milestones
- Indicadores específicos por domínio (NIST Functions, CSA Domains, SDLC Phases)

#### 🔗 Integrações
- Painel de saúde SIEM com métricas de latência e taxa de sucesso
- Logs de auditoria com captura de IP, geolocalização e device info
- Múltiplos formatos de export SIEM (JSON, CEF, LEEF, Syslog)

### Modificado

- Skeletons de loading agora usam animações Framer Motion
- Cards de configurações com estados de loading animados
- Header de Settings alinhado a 56px para consistência com sidebar

### Corrigido

- Tooltip de charts funcionando fora de ChartContainer
- Z-index de dropdowns em modais
- Overflow de conteúdo em cards de dashboard

---

## [1.1.0] - 2025-01-16

### Adicionado

#### 🎤 Sistema de Voz
- **Voice Profile**: Cadastro biométrico de voz do usuário
  - Níveis de enrollment: Padrão (6 frases) e Avançado (12 frases)
  - Extração de features via Web Worker (MFCC, Pitch, Spectral, Energy)
  - Visualização de ondas sonoras em tempo real (12 barras de frequência)
  - Barra de progresso durante processamento de áudio
  - Sensibilidade ajustável de verificação
- **Speech-to-Text**: Suporte a Web Speech API, OpenAI Whisper e endpoints customizados
- **Text-to-Speech**: Fila de prioridade, controles de reprodução, pré-processamento de texto
- **Comandos de Voz**: Navegação, troca de domínios, consultas de dados, exportação

#### 🤖 Assistente de IA
- Suporte ao Lovable AI Gateway (sem necessidade de API key)
- Múltiplos provedores: OpenAI, Claude, Gemini, Ollama, Hugging Face
- Respostas streaming via SSE
- Contexto automático do assessment
- Indicador visual de verificação de voz

#### 📊 Dashboards Multi-Domínio
- **DomainSwitcher**: Alternância entre AI Security, Cloud Security, DevSecOps
- **Indicadores Específicos**: 
  - AI Security: NIST AI RMF Functions (Govern, Map, Measure, Manage)
  - Cloud Security: CSA CCM Control Domains
  - DevSecOps: NIST SSDF SDLC Phases
- **Period Comparison**: Comparação visual de dois períodos (30 dias vs. anteriores)

#### 📋 Gestão de Conteúdo
- Import/Export de questões via Excel
- Versionamento de questões com diff e rollback
- Frameworks customizáveis por domínio

### Modificado

- Migração de `xlsx` para `exceljs` (correção de vulnerabilidades de segurança)
- Dashboards agora são 100% domain-aware
- Sistema de navegação para gaps críticos com highlight visual

---

## [1.0.0] - 2025-01-15

### Adicionado

#### 🏗️ Arquitetura Base
- Plataforma React 18 + TypeScript + Vite
- Integração Supabase (Auth, PostgreSQL, Edge Functions)
- Design system com shadcn/ui + Tailwind CSS
- Internacionalização completa (PT-BR, EN-US, ES-ES)

#### 🔐 Autenticação
- Login/Signup com email/senha
- Auto-confirm de email habilitado
- Rate limiting no login com exponential backoff
- Password strength meter com requisitos visuais

#### 📊 Dashboards
- **Executivo**: KPIs estratégicos, roadmap 30/60/90 dias, top gaps
- **GRC**: Cobertura por framework, distribuição de respostas, métricas de evidência
- **Especialista**: Análise por categoria, ownership, gaps por domínio L2

#### 📝 Assessment
- Questionário estruturado por taxonomia L1/L2
- Respostas: Sim, Parcial, Não, NA
- Campos de evidência com links e notas
- Filtros por framework e criticidade

#### 🔒 Segurança
- Row Level Security em todas as tabelas
- Triggers de auto-populate para user_id
- Isolamento multi-tenant por usuário e domínio
- Audit logging básico

#### 📄 Exportação
- Relatórios HTML standalone com gráficos SVG
- Exportação Excel (ExcelJS)

### Estrutura de Dados

- **3 domínios**: AI Security, Cloud Security, DevSecOps
- **143 questões** de AI Security (NIST AI RMF, ISO 42001, etc.)
- **36 questões** de Cloud Security (CSA CCM, CIS Controls, etc.)
- **44 questões** de DevSecOps (NIST SSDF, OWASP SAMM, etc.)
- **20+ frameworks** mapeados

---

## Tipos de Mudanças

- **Adicionado** para novas funcionalidades
- **Modificado** para mudanças em funcionalidades existentes
- **Obsoleto** para funcionalidades que serão removidas em breve
- **Removido** para funcionalidades removidas
- **Corrigido** para correções de bugs
- **Segurança** para vulnerabilidades corrigidas

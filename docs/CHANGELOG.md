# 📋 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

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

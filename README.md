# 🛡️ TrustLayer - Security Governance Platform

Uma plataforma completa de governança de segurança multi-domínio para **AI Security**, **Cloud Security** e **DevSecOps**, baseada em frameworks reconhecidos internacionalmente como NIST AI RMF, ISO 27001/27002, LGPD, CSA CCM, OWASP e outros.

<div align="center">

<!-- Build & Quality -->
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?logo=github&logoColor=white)](https://ai-assess-insight.lovable.app)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen?logo=vitest&logoColor=white)](https://ai-assess-insight.lovable.app)
[![Coverage](https://img.shields.io/badge/coverage-85%25-green?logo=codecov&logoColor=white)](https://ai-assess-insight.lovable.app)
[![Code Quality](https://img.shields.io/badge/code%20quality-A-brightgreen?logo=codacy&logoColor=white)](https://ai-assess-insight.lovable.app)

<!-- Version & Tech -->
[![Version](https://img.shields.io/badge/version-1.2.0-blue?logo=semanticrelease&logoColor=white)](https://ai-assess-insight.lovable.app)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<!-- Backend & Infra -->
[![Supabase](https://img.shields.io/badge/Supabase-Self--Hosted-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![Edge Functions](https://img.shields.io/badge/Edge%20Functions-3-3ecf8e?logo=deno&logoColor=white)](https://supabase.com/docs/guides/functions)

<!-- License & Community -->
[![License](https://img.shields.io/badge/license-MIT-blue?logo=opensourceinitiative&logoColor=white)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?logo=github&logoColor=white)](https://ai-assess-insight.lovable.app)
[![i18n](https://img.shields.io/badge/i18n-3%20languages-blueviolet?logo=googletranslate&logoColor=white)](https://ai-assess-insight.lovable.app)

<!-- Frameworks Supported -->
[![NIST](https://img.shields.io/badge/NIST-AI%20RMF%20%7C%20SSDF-orange)](https://www.nist.gov/)
[![ISO](https://img.shields.io/badge/ISO-27001%20%7C%2027002%20%7C%2023894-blue)](https://www.iso.org/)
[![CSA](https://img.shields.io/badge/CSA-CCM%20v4-yellow)](https://cloudsecurityalliance.org/)
[![OWASP](https://img.shields.io/badge/OWASP-Top%2010-red)](https://owasp.org/)

</div>

## 📸 Screenshots

<div align="center">

### 🔐 Login - Autenticação Segura
![Login](docs/screenshots/login.png)
*Tela de login com credenciais pre-provisionadas*

---

### 📋 Assessment - Questionário de Avaliação
![Assessment](src/assets/screenshots/assessment.png)
*Questionário estruturado por domínios L1/L2 com campos de evidência*

---

### 📊 Dashboard Executivo
![Executive Dashboard](src/assets/screenshots/dashboard-executive.png)
*Visão estratégica com KPIs, gráficos de maturidade e roadmap para CISO*

---

### 📈 Dashboard GRC
![GRC Dashboard](src/assets/screenshots/dashboard-grc.png)
*Governança, Riscos e Compliance com cobertura de frameworks e conformidade*

---

### 🔧 Dashboard Especialista
![Specialist Dashboard](src/assets/screenshots/dashboard-specialist.png)
*Detalhes técnicos com métricas por categoria e gaps críticos*

---

### 🤖 Assistente de IA
![AI Assistant](src/assets/screenshots/ai-assistant.png)
*Chat interativo com análise contextual do assessment*

---

### ⚙️ Configurações - Gestão de Frameworks
![Settings Frameworks](src/assets/screenshots/frameworks.png)
*Gerenciamento de frameworks padrão e customizados*

</div>

---

## 📋 Sobre o Projeto

Esta ferramenta permite que organizações avaliem sua postura de segurança em múltiplos domínios, identificando gaps críticos, gerando roadmaps de remediação e acompanhando a evolução da maturidade ao longo do tempo.

### ✨ Principais Funcionalidades

#### 🎯 Avaliação Multi-Domínio
- **AI Security**: Avaliação baseada em NIST AI RMF, ISO 23894
- **Cloud Security**: Avaliação baseada em CSA CCM, ISO 27017
- **DevSecOps**: Avaliação baseada em NIST SSDF, OWASP

#### 📊 Dashboards Especializados
- **Executivo**: Visão estratégica para CISO e liderança com KPIs consolidados
- **GRC**: Governança, Riscos e Compliance com foco em cobertura de frameworks
- **Especialista**: Detalhes técnicos para arquitetos e engenheiros de segurança
- **Layouts Modulares (Admin)**: Catalogo de widgets e layouts configuraveis por perfil

#### 📈 Análise de Tendências
- **Histórico de Maturidade**: Snapshots automáticos diários para acompanhamento temporal
- **Comparação de Períodos**: Visualização side-by-side de diferentes intervalos de tempo
- **Anotações em Gráficos**: Marcação de eventos e milestones importantes
- **Indicadores por Domínio**: Métricas específicas (NIST Functions, CSA Domains, SDLC Phases)

#### 🤖 Assistente de IA
- **Chat Interativo**: Análise contextual do assessment com suporte a múltiplos provedores
- **Provedores de IA Configuráveis**: OpenAI, Claude, Gemini, Ollama, Hugging Face
- **Padrão IA**: Utiliza **Lovable AI Gateway** por padrão (sem necessidade de API key)
  - Modelos suportados: GPT-5, GPT-5-mini, Gemini 2.5 Pro/Flash, entre outros
  - Fallback automático para provedores configurados pelo usuário

#### 🎙️ Sistema de Voz Inteligente

**Text-to-Speech (TTS):**
- **Padrão**: Web Speech API nativa do navegador (sem custo, funciona offline)
- Configurações personalizáveis: idioma, velocidade, tom, volume e voz preferida
- Auto-speak opcional para respostas do assistente

**Speech-to-Text (STT):**
- **Padrão**: Web Speech API (reconhecimento em tempo real, gratuito)
- **Alternativas configuráveis**:
  - OpenAI Whisper (alta precisão, requer API key)
  - Endpoint customizado (para modelos próprios)
- Suporte a transcrição de arquivos de áudio
- Se o provedor exigir API key e ela nao estiver configurada (ou inline secrets desabilitados), o STT fica desativado.

**Perfil de Voz (Speaker Verification):**
- **Cadastro biométrico**: Grave frases para treinar o sistema a reconhecer sua voz
- **Níveis de enrollment**: Padrão (6 frases, ~2min) ou Avançado (12 frases, ~5min)
- **Verificação automática**: Filtra comandos de vozes não cadastradas
- **Processamento em Web Worker**: Extração de features em background sem bloquear UI
- **Visualização em tempo real**: Barras de áudio que respondem ao volume do microfone
- **Barra de progresso**: Indicador visual durante processamento de áudio
- **Indicador visual**: Mostra status de verificação em tempo real no chat
- **Sensibilidade ajustável**: Slider para calibrar rigor da verificação

**Features de Áudio Extraídas:**
- MFCC (13 coeficientes) - Timbre vocal
- Pitch Mean/Std - Tom de voz
- RMS Energy - Intensidade
- Zero Crossing Rate - Características espectrais
- Speaking Rate - Ritmo da fala

**Comandos de Voz:**
- Navegação entre páginas por comando de voz
- Consulta de dados e métricas
- Troca de domínios de segurança
- Exportação de relatórios

#### 🔗 Integrações
- **SIEM Integration**: Encaminhamento de eventos em JSON, CEF, LEEF, Syslog
- **Monitoramento de Saúde**: Métricas de latência, taxa de sucesso e status de conexão
- **Audit Logging**: Logs detalhados com IP, user-agent e geolocalização

#### 📋 Gestão de Conteúdo
- **Frameworks Customizáveis**: Adicionar, editar ou desabilitar frameworks
- **Questões Personalizadas**: Criar questões específicas da organização
- **Versionamento**: Histórico de alterações com diff e rollback
- **Import/Export**: Importação em massa via Excel e exportação de configurações

#### 🌐 Internacionalização
- Suporte completo a **Português (BR)**, **English (US)** e **Español (ES)**
- Sincronização de preferência de idioma no perfil do usuário

#### 📄 Exportação de Relatórios
- **HTML Standalone**: Relatórios fiéis ao estado atual do dashboard
- **Gráficos SVG**: Visualizações vetoriais de alta qualidade
- **Roadmap Estratégico**: Priorização em horizontes de 30/60/90 dias

## 🛠️ Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| [React 18](https://react.dev/) | Framework UI |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática |
| [Vite](https://vitejs.dev/) | Build tool e dev server |
| [Tailwind CSS](https://tailwindcss.com/) | Estilização |
| [shadcn/ui](https://ui.shadcn.com/) | Componentes UI |
| [Zustand](https://zustand-demo.pmnd.rs/) | Gerenciamento de estado |
| [Recharts](https://recharts.org/) | Visualização de dados |
| [Supabase](https://supabase.com/) | Backend (banco de dados, auth, edge functions) |
| [TanStack Query](https://tanstack.com/query) | Gerenciamento de dados assíncronos |
| [React Router](https://reactrouter.com/) | Roteamento |
| [i18next](https://www.i18next.com/) | Internacionalização |
| [ExcelJS](https://github.com/exceljs/exceljs) | Importação/Exportação Excel |
| [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) | TTS/STT nativo do navegador |
| [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | Análise de áudio em tempo real |
| [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) | Processamento em background |
| [Framer Motion](https://www.framer.com/motion/) | Animações |

## 🔊 Configuração Padrão de IA e Voz

### Inteligência Artificial

| Configuração | Padrão | Alternativas |
|--------------|--------|--------------|
| **Gateway** | Lovable AI Gateway | Provedores customizados |
| **Modelo LLM** | GPT-5 / Gemini 2.5 Pro | GPT-5-mini, Gemini Flash, Claude, Ollama |
| **API Key** | Não necessária (gateway) | Obrigatória para provedores externos |
| **Contexto** | Assessment atual + histórico | Personalizável por provedor |

### Síntese de Voz (TTS)

| Configuração | Padrão | Faixa |
|--------------|--------|-------|
| **Provedor** | Web Speech API | Nativo do navegador |
| **Idioma** | pt-BR | pt-BR, en-US, es-ES |
| **Velocidade** | 1.0x | 0.5x - 2.0x |
| **Tom (Pitch)** | 1.0 | 0.5 - 2.0 |
| **Volume** | 1.0 | 0.0 - 1.0 |
| **Auto-Speak** | Desativado | Ativável por toggle |

### Reconhecimento de Voz (STT)

| Configuração | Padrão | Alternativas |
|--------------|--------|--------------|
| **Provedor** | Web Speech API | OpenAI Whisper, Custom Endpoint |
| **Modo** | Tempo real | Transcrição de arquivo (Whisper) |
| **Idioma** | pt-BR | Configurável no perfil |
| **API Key** | Não necessária | Obrigatória para Whisper |

### Perfil de Voz (Verificação de Locutor)

| Configuração | Padrão | Descrição |
|--------------|--------|-----------|
| **Status** | Desativado | Ativado após enrollment |
| **Nível** | Padrão (6 frases) | Avançado (12 frases) disponível |
| **Sensibilidade** | 65% | Ajustável de 40% a 90% |
| **Processamento** | Web Worker | Background thread, não bloqueia UI |
| **Visualização** | Tempo real | 12 barras de frequência animadas |
| **Features** | MFCC, Pitch, Spectral, Energy | Análise multi-dimensional |

## 📦 Pré-requisitos

- **Node.js** 18.x ou superior
- **npm** 9.x ou superior (ou yarn/pnpm)

## 🚀 Instalação e Execução Local

### 1. Clone o repositório

```bash
git clone https://github.com/trustlayer/trustlayer.git
cd trustlayer
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Bootstrap do admin e catálogo

Veja `docs/SETUP.md` para:
- criar o usuário administrador
  - provisionar usuarios locais (sem signup)
- importar o catálogo inicial (domínios, frameworks, perguntas)
  - painel administrativo em /admin (nao aparece na sidebar)
  - revisar o preview/dry-run do XLSX antes de importar

### 4. Execute o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

> **Nota**: O backend utiliza Supabase self-hosted ou Postgres externo, conforme o modo de implantacao.

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Visualiza o build de produção localmente |
| `npm run lint` | Executa o linter (ESLint) |
| `npm run test` | Executa os testes |
| `npm run provision:admin` | Provisiona o usuario administrador inicial |
| `npm run provision:user` | Provisiona usuarios locais (sem signup) |
| `USER_ROLE=admin|manager|analyst|viewer|user` | Define role ao provisionar usuarios (user = legado) |

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes React reutilizáveis
│   ├── ui/              # Componentes shadcn/ui
│   ├── dashboard/       # Componentes de dashboard
│   ├── settings/        # Componentes de configuração
│   ├── ai-assistant/    # Componentes do assistente IA
│   └── auth/            # Componentes de autenticação
├── data/                # (legacy) catálogo migrado para o banco de dados
├── hooks/               # Custom React hooks
├── i18n/                # Arquivos de internacionalização
│   └── locales/         # Traduções (pt-BR, en-US, es-ES)
├── integrations/        # Integrações externas (Supabase)
├── lib/                 # Utilitários e lógica de negócio
│   ├── database.ts      # Operações de banco de dados
│   ├── scoring.ts       # Cálculos de maturidade e métricas
│   ├── frameworks.ts    # Gerenciamento de frameworks
│   ├── securityDomains.ts # Gerenciamento de domínios
│   ├── siemIntegration.ts # Integração SIEM
│   ├── auditLog.ts      # Sistema de auditoria
│   └── stores.ts        # Stores Zustand
├── pages/               # Páginas da aplicação
│   ├── Home.tsx         # Página inicial com onboarding
│   ├── Assessment.tsx   # Questionário de avaliação
│   ├── Dashboard*.tsx   # Dashboards (Executive, GRC, Specialist)
│   ├── Profile.tsx      # Perfil do usuário
│   └── Settings.tsx     # Configurações
└── test/                # Testes

supabase/
├── functions/           # Edge Functions
│   ├── ai-assistant/    # Assistente de IA
│   ├── audit-log/       # Registro de auditoria
│   ├── siem-forward/    # Encaminhamento SIEM
└── config.toml          # Configuração Supabase
```

## 🗄️ Banco de Dados

### Principais Tabelas

| Tabela | Descrição |
|--------|-----------|
| `security_domains` | Domínios de segurança (AI, Cloud, DevSecOps) |
| `domains` | Categorias L1 da taxonomia |
| `subcategories` | Subcategorias L2 da taxonomia |
| `default_questions` | Questões padrão do sistema |
| `custom_questions` | Questões personalizadas do usuário |
| `answers` | Respostas do assessment |
| `default_frameworks` | Frameworks padrão |
| `custom_frameworks` | Frameworks personalizados |
| `assessment_meta` | Metadados (frameworks habilitados/selecionados) |
| `maturity_snapshots` | Histórico de maturidade |
| `chart_annotations` | Anotações em gráficos |
| `ai_providers` | Configurações de provedores IA |
| `siem_integrations` | Integrações SIEM |
| `siem_metrics` | Métricas de saúde SIEM |
| `change_logs` | Logs de auditoria |
| `question_versions` | Versionamento de questões |
| `profiles` | Perfis de usuário |
| `voice_profiles` | Perfis de voz para verificação de locutor |
| `voice_enrollment_samples` | Amostras de áudio do enrollment |

## 🎯 Fluxo de Uso

1. **Login**: Acesse com suas credenciais fornecidas pelo administrador
2. **Selecione o Domínio**: Escolha entre AI Security, Cloud Security ou DevSecOps
3. **Configure Frameworks**: Habilite os frameworks relevantes para sua organização
4. **Avaliação**: Responda às questões (Sim/Parcial/Não/NA) com evidências
5. **Dashboards**: Analise métricas, gaps e roadmap por perfil (Executivo/GRC/Especialista)
6. **Compare Períodos**: Visualize evolução comparando diferentes intervalos de tempo
7. **Exporte**: Gere relatórios HTML para compartilhamento

## 🔒 Segurança

- **Row Level Security (RLS)**: Habilitado em todas as tabelas
- **Autenticação**: Contas provisionadas pelo administrador; SSO opcional (OIDC/SAML)
- **Rate Limiting**: Proteção contra brute-force no login
- **API Payload Validation**: Allowlist de entity/action e limites de tamanho em audit/siem.
- **Role Escalation Guard**: Role de perfil so pode ser alterada via service role.
- **RBAC Baseline**: Roles admin/manager/analyst/viewer (viewer = leitura).
- **RLS Answers**: Escrita de respostas permitida apenas para admin/manager/analyst/user.
- **RLS Config**: Escrita de configuracoes e anotacoes bloqueada para viewer.
- **Catalog Write Policies**: Escrita em tabelas globais restrita a administradores.
- **Admin-Only Integrations**: Escrita em AI providers e SIEM restrita a administradores.
- **Validação de Senha**: Requisitos de complexidade (8+ chars, maiúsculas, números, símbolos)
- **Auditoria**: Logs detalhados de todas as ações
- **Isolamento Multi-Tenant**: Dados segregados por usuário e domínio

## 🧪 Testes

```bash
# Executar todos os testes
npm run test

# Testes incluem:
# - Validação de chaves i18n
# - Consistência de placeholders
# - Snapshots de traduções
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- Abra uma issue para reportar bugs
- Discussões e sugestões são bem-vindas

## 📚 Documentação Adicional

- [API Reference](docs/API.md) - Documentação das Edge Functions
- [Architecture](docs/ARCHITECTURE.md) - Diagramas de arquitetura do sistema
- [Contributing](docs/CONTRIBUTING.md) - Guia de contribuição
- [Admin Console](docs/ADMIN_CONSOLE.md) - Painel administrativo
- [Backup and DR Runbook](docs/runbooks/BACKUP_DR.md) - Procedimentos de backup e recuperacao.
- [Data Retention](docs/DATA_RETENTION.md) - Politicas de retencao e limpeza de dados.
- [Analytics Export](docs/ANALYTICS_EXPORT.md) - Pipeline de exportacao para analytics.
- [Secret Provider](docs/SECRET_PROVIDER.md) - Resolver externo de segredos.
- [Changelog](docs/CHANGELOG.md) - Histórico de mudanças
- [LLM Reference](llm.txt) - Referência para assistentes de IA

## Documentation Policy

- Every feature, fix, or change must update the relevant docs, including README, llm.txt, and CHANGELOG.

## Security Baseline

See `docs/SECURITY_BASELINE.md` for the OWASP Top 10 control mapping and enterprise baseline.
Edge Functions include `X-Request-Id` for log correlation.
Viewer role uses read-only gating for domain/framework selection (UI and voice commands).
Read-only roles skip maturity snapshot writes.
Role lookups are cached client-side (60s TTL) to reduce repeated profile queries.
Domain/framework selection rolls back locally if persistence fails.
Read-only assessment defaults to enabled frameworks when no selection is stored.

## Observability

Baseline and runbooks live in:
- `docs/OBSERVABILITY.md`
- `docs/runbooks/INCIDENT_RESPONSE.md`
- `docs/runbooks/ALERTS.md`

---

Desenvolvido com ❤️ para a comunidade de segurança



## Docker (Frontend)

Build and run the frontend image:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=http://127.0.0.1:54321 \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key \
  -t trustlayer-web .

docker run --rm -p 8080:8080 trustlayer-web
```

Health check endpoint: `http://localhost:8080/healthz`.

Optional env flags:
- `VITE_ALLOW_LOCAL_ENDPOINTS=true` (frontend) and `ALLOW_LOCAL_ENDPOINTS=true` (Edge Functions) to allow local/private endpoints for admin-configured integrations.
- `VITE_IMPORT_MAX_FILE_BYTES=5242880` to cap XLSX/JSON import file size.
- `VITE_IMPORT_MAX_CELL_CHARS=2000` to cap cell length in XLSX imports.
- `VITE_IMPORT_MAX_ROWS=5000` to cap XLSX import row count.
- `VITE_IMPORT_MALWARE_SCAN_URL=https://scanner.local/scan` to enable optional XLSX antivirus scanning (expects multipart file upload and JSON response).
- `VITE_IMPORT_MALWARE_SCAN_REQUIRED=true` to block imports when the scanner is unavailable or not configured.
- `VITE_ALLOW_INLINE_SECRETS=true` to allow storing raw secrets in the database (not recommended; required for API-key STT providers).
- `SECRET_PROVIDER_URL=https://secrets.local/resolve` to enable external secret resolver for `secret:` references (Edge Functions).
- `SECRET_PROVIDER_TOKEN=env:SECRET_PROVIDER_TOKEN` optional auth token for the external secret resolver (supports `env:` or `file:`).
- `SECRET_PROVIDER_TIMEOUT_MS=10000` to set the external secret resolver timeout (ms).
- See `docs/SECRET_PROVIDER.md` for the external resolver contract.
- `VITE_ANALYTICS_EXPORT_ENABLED=true` to enable analytics export hooks from the frontend.
- `ANALYTICS_EXPORT_URL=https://analytics.local/ingest` to enable the analytics export Edge Function.
- `ANALYTICS_EXPORT_TOKEN=env:ANALYTICS_EXPORT_TOKEN` optional auth token for analytics export (supports `env:` or `file:`).
- `ANALYTICS_EXPORT_TIMEOUT_MS=10000` to set the analytics export timeout (ms).
- `ANALYTICS_EXPORT_INCLUDE_USER_ID=false` to control whether user IDs are included in analytics payloads.
- See `docs/ANALYTICS_EXPORT.md` for the analytics export contract.
- `VITE_IDLE_TIMEOUT_MINUTES=0` to disable/enable idle logout (set to minutes > 0).
- `VITE_SESSION_MAX_MINUTES=0` to disable/enable absolute session timeout (minutes > 0).
- STT API keys are only fetched from profiles when `VITE_ALLOW_INLINE_SECRETS=true`.
- `ALLOWED_ORIGINS=https://app.example.com` to restrict Edge Function CORS origins.
- `MAX_REQUEST_BODY_BYTES=1048576` to cap Edge Function payload size.
- `AUDIT_GEO_LOOKUP_ENABLED=true` to enable external geo lookup enrichment.
- `MAX_AI_MESSAGES=50` to cap AI message payload size.
- `MAX_AI_MESSAGE_CHARS=4000` to cap characters per AI message.
- `MAX_AI_TOTAL_CHARS=20000` to cap total characters across AI messages.
- `RATE_LIMIT_WINDOW_SECONDS=60` to define the Edge Function rate limit window.
- `AI_ASSISTANT_RATE_LIMIT_MAX=60` to cap AI assistant requests per window.
- `AUDIT_LOG_RATE_LIMIT_MAX=120` to cap audit log requests per window.
- `SIEM_FORWARD_RATE_LIMIT_MAX=60` to cap SIEM forward requests per window.
- `ANALYTICS_EXPORT_RATE_LIMIT_MAX=60` to cap analytics export requests per window.
- `HTTP_PROXY=http://proxy.local:8080` to proxy outbound Edge Function traffic.
- `HTTPS_PROXY=http://proxy.local:8443` to proxy outbound HTTPS traffic.
- `NO_PROXY=localhost,127.0.0.1,::1,.internal` to bypass the proxy for specific hosts.
- `CUSTOM_CA_CERT=...` to trust a custom CA bundle (PEM) for TLS inspection.
- `CUSTOM_CA_CERT_BASE64=...` to trust a custom CA bundle (base64) for TLS inspection.




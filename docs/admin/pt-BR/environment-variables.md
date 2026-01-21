---
profile: admin
language: pt-BR
version: 1.2.0
last_updated: 2026-01-20
---

# Variaveis de Ambiente

## Visao Geral

Este documento descreve todas as variaveis de ambiente utilizadas pelo TrustLayer, tanto para o frontend quanto para as Edge Functions do Supabase.

## Publico-Alvo

- Administradores de sistema
- DevOps engineers
- Equipe de infraestrutura

---

## 1. Variaveis Obrigatorias

### 1.1 Supabase

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave publica (anon key) | `eyJhbGc...` |

### 1.2 Backend (Edge Functions)

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `SUPABASE_URL` | URL interna do Supabase | `http://kong:8000` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de servico | `eyJhbGc...` |
| `SUPABASE_DB_URL` | Connection string PostgreSQL | `postgresql://...` |

---

## 2. Variaveis de AI

### 2.1 Provedores de IA

| Variavel | Descricao | Obrigatorio |
|----------|-----------|-------------|
| `OPENAI_API_KEY` | Chave da API OpenAI | Se usar OpenAI |
| `ANTHROPIC_API_KEY` | Chave da API Anthropic (Claude) | Se usar Claude |
| `GOOGLE_AI_API_KEY` | Chave da API Google (Gemini) | Se usar Gemini |
| `OLLAMA_BASE_URL` | URL do servidor Ollama | Se usar Ollama local |

### 2.2 Limites de IA

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `MAX_AI_MESSAGES` | Maximo de mensagens por request | `50` |
| `MAX_AI_MESSAGE_CHARS` | Maximo de caracteres por mensagem | `4000` |
| `MAX_AI_TOTAL_CHARS` | Maximo total de caracteres | `20000` |

---

## 3. Variaveis de Seguranca

### 3.1 CORS e Origens

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `ALLOWED_ORIGINS` | Origens permitidas (separadas por virgula) | `*` |

**Exemplo:**
```env
ALLOWED_ORIGINS=https://app.trustlayer.io,https://admin.trustlayer.io
```

### 3.2 Rate Limiting

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `RATE_LIMIT_WINDOW_SECONDS` | Janela de rate limit | `60` |
| `AI_ASSISTANT_RATE_LIMIT_MAX` | Max requests AI por janela | `60` |
| `AUDIT_LOG_RATE_LIMIT_MAX` | Max requests audit por janela | `120` |
| `SIEM_FORWARD_RATE_LIMIT_MAX` | Max requests SIEM por janela | `60` |
| `ANALYTICS_EXPORT_RATE_LIMIT_MAX` | Max requests analytics por janela | `60` |

### 3.3 Payloads

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `MAX_REQUEST_BODY_BYTES` | Tamanho maximo de payload | `1048576` (1MB) |

### 3.4 Sessao

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `VITE_IDLE_TIMEOUT_MINUTES` | Timeout de inatividade (0=desabilitado) | `0` |
| `VITE_SESSION_MAX_MINUTES` | Timeout absoluto de sessao (0=desabilitado) | `0` |

---

## 4. Variaveis de Importacao

### 4.1 Limites de Arquivo

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `VITE_IMPORT_MAX_FILE_BYTES` | Tamanho maximo de arquivo | `5242880` (5MB) |
| `VITE_IMPORT_MAX_ROWS` | Maximo de linhas em XLSX | `5000` |
| `VITE_IMPORT_MAX_CELL_CHARS` | Maximo de caracteres por celula | `2000` |

### 4.2 Malware Scan

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `VITE_IMPORT_MALWARE_SCAN_URL` | URL do scanner de malware | - |
| `VITE_IMPORT_MALWARE_SCAN_REQUIRED` | Bloquear se scanner indisponivel | `false` |

---

## 5. Variaveis de Integracao

### 5.1 SIEM

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `SIEM_ENDPOINT_URL` | URL do endpoint SIEM | - |
| `SIEM_AUTH_TYPE` | Tipo de autenticacao (none/basic/bearer/api_key) | `none` |
| `SIEM_AUTH_TOKEN` | Token de autenticacao | - |

### 5.2 Email (SMTP)

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `SMTP_HOST` | Servidor SMTP | - |
| `SMTP_PORT` | Porta SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | - |
| `SMTP_PASS` | Senha SMTP | - |
| `SMTP_FROM` | Email remetente | `noreply@trustlayer.io` |

### 5.3 Email (Providers Externos)

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `RESEND_API_KEY` | Chave da API Resend | - |
| `SENDGRID_API_KEY` | Chave da API SendGrid | - |
| `MAILGUN_API_KEY` | Chave da API Mailgun | - |
| `MAILGUN_DOMAIN` | Dominio Mailgun | - |

### 5.4 SSO

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `AZURE_AD_CLIENT_ID` | Client ID Azure AD | - |
| `AZURE_AD_CLIENT_SECRET` | Client Secret Azure AD | - |
| `AZURE_AD_TENANT_ID` | Tenant ID Azure AD | - |
| `OKTA_CLIENT_ID` | Client ID Okta | - |
| `OKTA_CLIENT_SECRET` | Client Secret Okta | - |
| `OKTA_DOMAIN` | Dominio Okta | - |
| `GOOGLE_CLIENT_ID` | Client ID Google | - |
| `GOOGLE_CLIENT_SECRET` | Client Secret Google | - |

---

## 6. Variaveis de Analytics

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `VITE_ANALYTICS_EXPORT_ENABLED` | Habilitar export de analytics | `false` |
| `ANALYTICS_EXPORT_URL` | URL do endpoint de analytics | - |
| `ANALYTICS_EXPORT_TOKEN` | Token de autenticacao | - |
| `ANALYTICS_EXPORT_TIMEOUT_MS` | Timeout de export | `10000` |
| `ANALYTICS_EXPORT_INCLUDE_USER_ID` | Incluir user ID nos eventos | `false` |

---

## 7. Variaveis de Secrets

### 7.1 Secret Provider Externo

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `SECRET_PROVIDER_URL` | URL do provedor de secrets | - |
| `SECRET_PROVIDER_TOKEN` | Token de autenticacao (env: ou file:) | - |
| `SECRET_PROVIDER_TIMEOUT_MS` | Timeout de resolucao | `10000` |

### 7.2 Secrets Inline

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `VITE_ALLOW_INLINE_SECRETS` | Permitir secrets no DB | `false` |

> **Aviso:** Nao recomendado em producao. Use um secret manager.

---

## 8. Variaveis de Proxy

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `HTTP_PROXY` | Proxy HTTP | - |
| `HTTPS_PROXY` | Proxy HTTPS | - |
| `NO_PROXY` | Hosts a ignorar proxy | `localhost,127.0.0.1,::1` |

---

## 9. Variaveis de Certificados

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `CUSTOM_CA_CERT` | CA bundle em PEM | - |
| `CUSTOM_CA_CERT_BASE64` | CA bundle em Base64 | - |

---

## 10. Variaveis de Retencao de Dados

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `RETENTION_CHANGE_LOGS_DAYS` | Dias para manter audit logs | `365` |
| `RETENTION_SNAPSHOTS_DAYS` | Dias para manter snapshots | `730` |
| `RETENTION_SIEM_METRICS_DAYS` | Dias para manter metricas SIEM | `90` |
| `RETENTION_APPLY` | Aplicar delecoes (false=dry-run) | `false` |

---

## 11. Variaveis de Observabilidade

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Endpoint do OTLP collector | - |
| `OTEL_SERVICE_NAME` | Nome do servico | `trustlayer` |
| `AUDIT_GEO_LOOKUP_ENABLED` | Habilitar lookup de geolocalizacao | `false` |

---

## 12. Outras Variaveis

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `VITE_ALLOW_LOCAL_ENDPOINTS` | Permitir endpoints locais/privados | `false` |
| `ALLOW_LOCAL_ENDPOINTS` | (Edge Functions) Idem | `false` |
| `NODE_ENV` | Ambiente (development/production) | `development` |

---

## 13. Arquivo .env de Exemplo

```env
# ===========================================
# TrustLayer Environment Variables
# ===========================================

# --- Supabase ---
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# --- AI Providers ---
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_AI_API_KEY=...

# --- Security ---
ALLOWED_ORIGINS=https://app.trustlayer.io
RATE_LIMIT_WINDOW_SECONDS=60
AI_ASSISTANT_RATE_LIMIT_MAX=60

# --- Session ---
VITE_IDLE_TIMEOUT_MINUTES=30
VITE_SESSION_MAX_MINUTES=480

# --- Email (escolha um) ---
# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM=noreply@trustlayer.io

# Ou Resend
# RESEND_API_KEY=re_...

# --- SSO (se utilizar) ---
# AZURE_AD_CLIENT_ID=...
# AZURE_AD_CLIENT_SECRET=...
# AZURE_AD_TENANT_ID=...

# --- Data Retention ---
RETENTION_CHANGE_LOGS_DAYS=365
RETENTION_SNAPSHOTS_DAYS=730
RETENTION_APPLY=false

# --- Import ---
VITE_IMPORT_MAX_FILE_BYTES=5242880
VITE_IMPORT_MAX_ROWS=5000
```

---

## 14. Boas Praticas

### 14.1 Nunca Commitar Secrets

- Use `.env.example` com valores de exemplo
- Adicione `.env` ao `.gitignore`
- Use secret managers em producao

### 14.2 Rotacionar Chaves Regularmente

- API keys a cada 90 dias
- Service role keys a cada 180 dias
- Documente o processo de rotacao

### 14.3 Minimo Privilegio

- Use chaves com escopos limitados
- ALLOWED_ORIGINS especificos, nunca `*` em producao
- Desabilite features nao utilizadas

### 14.4 Monitorar Uso

- Configure alertas para rate limits
- Monitore tentativas de acesso negadas
- Revise logs de auditoria regularmente

---

## Referencias

- [Instalacao On-Premises](installation-on-prem.md)
- [Troubleshooting](troubleshooting.md)
- [Supabase Environment Variables](https://supabase.com/docs/guides/self-hosting#environment-variables)

---

*Ultima atualizacao: 20 de Janeiro de 2026*

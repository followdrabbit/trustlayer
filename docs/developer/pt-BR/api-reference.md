---
profile: developer
language: pt-BR
version: 1.2.0
last_updated: 2026-01-20
---

# API Reference (Referencia da API)

## Visao Geral

Este documento descreve as APIs disponiveis no TrustLayer, incluindo Edge Functions do Supabase e endpoints REST. Todas as APIs requerem autenticacao via JWT.

## Publico-Alvo

- Desenvolvedores integrando com TrustLayer
- DevOps configurando automacoes
- Arquitetos planejando integracoes

---

## 1. Autenticacao

### 1.1 Obtendo Token JWT

Todas as requisicoes devem incluir um token JWT no header:

```http
Authorization: Bearer <token>
```

**Obtendo o token via Supabase Auth:**

```typescript
import { supabase } from '@/integrations/supabase/client';

const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### 1.2 Refresh Token

Tokens expiram apos 1 hora. O Supabase client faz refresh automatico. Para refresh manual:

```typescript
const { data: { session }, error } = await supabase.auth.refreshSession();
```

---

## 2. Edge Functions

### 2.1 AI Assistant

**Endpoint:** `POST /functions/v1/ai-assistant`

**Descricao:** Envia mensagens para o assistente de IA e recebe respostas contextuais.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "O que e NIST AI RMF?"
    }
  ],
  "context": {
    "currentPage": "assessment",
    "domain": "ai-security",
    "recentAnswers": [...]
  },
  "provider": "openai",
  "stream": true
}
```

**Parametros:**
| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| messages | array | Sim | Historico de mensagens |
| context | object | Nao | Contexto da sessao atual |
| provider | string | Nao | Provider de IA (openai, claude, gemini) |
| stream | boolean | Nao | Habilita Server-Sent Events |

**Response (sem streaming):**
```json
{
  "response": "O NIST AI RMF e um framework...",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200
  }
}
```

**Response (com streaming):**
```
data: {"content": "O "}
data: {"content": "NIST "}
data: {"content": "AI RMF..."}
data: [DONE]
```

**Codigos de Erro:**
| Codigo | Descricao |
|--------|-----------|
| 400 | Parametros invalidos |
| 401 | Token invalido ou expirado |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |

---

### 2.2 Audit Log

**Endpoint:** `POST /functions/v1/audit-log`

**Descricao:** Registra eventos de auditoria para rastreabilidade.

**Request Body:**
```json
{
  "entity": "assessment",
  "action": "answer_updated",
  "entityId": "uuid-da-pergunta",
  "details": {
    "questionId": "q123",
    "oldValue": "no",
    "newValue": "yes"
  }
}
```

**Parametros:**
| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| entity | string | Sim | Tipo de entidade (assessment, user, report) |
| action | string | Sim | Acao realizada (created, updated, deleted) |
| entityId | string | Nao | ID da entidade afetada |
| details | object | Nao | Detalhes adicionais do evento |

**Acoes Permitidas (allowlist):**
- `login_success`, `login_failed`, `logout`
- `answer_created`, `answer_updated`, `answer_deleted`
- `evidence_attached`, `evidence_removed`
- `report_generated`, `report_scheduled`
- `user_created`, `user_updated`, `role_changed`
- `settings_updated`, `export_data`

**Response:**
```json
{
  "success": true,
  "eventId": "uuid-do-evento"
}
```

---

### 2.3 SIEM Forward

**Endpoint:** `POST /functions/v1/siem-forward`

**Descricao:** Encaminha eventos para sistemas SIEM externos.

**Request Body:**
```json
{
  "events": [
    {
      "timestamp": "2026-01-20T10:30:00Z",
      "eventType": "login_success",
      "userId": "user-uuid",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "details": {}
    }
  ],
  "format": "json"
}
```

**Formatos Suportados:**
| Formato | Descricao |
|---------|-----------|
| json | JSON padrao |
| cef | Common Event Format (ArcSight) |
| leef | Log Event Extended Format (QRadar) |
| syslog | RFC 5424 Syslog |

**Response:**
```json
{
  "success": true,
  "forwarded": 5,
  "failed": 0
}
```

---

### 2.4 Report Generator

**Endpoint:** `POST /functions/v1/report-generator`

**Descricao:** Gera relatorios em diversos formatos.

**Request Body:**
```json
{
  "templateId": "executive-summary",
  "format": "pdf",
  "filters": {
    "domain": "ai-security",
    "frameworks": ["nist-ai-rmf", "iso-42001"],
    "dateRange": {
      "start": "2026-01-01",
      "end": "2026-01-20"
    }
  },
  "options": {
    "includeEvidence": true,
    "includeRecommendations": true
  }
}
```

**Parametros:**
| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| templateId | string | Sim | ID do template de relatorio |
| format | string | Sim | Formato de saida (pdf, excel, csv, html) |
| filters | object | Nao | Filtros para os dados |
| options | object | Nao | Opcoes de geracao |

**Templates Disponiveis:**
- `executive-summary`
- `compliance-status`
- `gap-analysis`
- `audit-report`

**Response:**
```json
{
  "success": true,
  "reportId": "uuid-do-relatorio",
  "downloadUrl": "https://storage.../report.pdf",
  "expiresAt": "2026-01-21T10:30:00Z"
}
```

---

### 2.5 Report Scheduler

**Endpoint:** `POST /functions/v1/report-scheduler`

**Descricao:** Executa automaticamente schedules de relatorios pendentes. Chamada tipicamente via cron job.

**Request Body:**
```json
{
  "dryRun": false
}
```

**Response:**
```json
{
  "success": true,
  "processed": 3,
  "queued": 3,
  "errors": []
}
```

---

### 2.6 Email Service

**Endpoint:** `POST /functions/v1/email-service`

**Descricao:** Envia emails usando multiplos providers.

**Request Body:**
```json
{
  "to": ["user@example.com"],
  "cc": [],
  "bcc": [],
  "subject": "Seu relatorio esta pronto",
  "html": "<h1>Relatorio</h1><p>Segue anexo...</p>",
  "text": "Relatorio\n\nSegue anexo...",
  "attachments": [
    {
      "filename": "report.pdf",
      "url": "https://storage.../report.pdf"
    }
  ],
  "template": {
    "id": "report-ready",
    "variables": {
      "reportName": "Executive Summary",
      "generatedAt": "2026-01-20"
    }
  }
}
```

**Templates Disponiveis:**
- `report-ready` - Notificacao de relatorio pronto
- `scheduled-report` - Relatorio agendado
- `anomaly-alert` - Alerta de anomalia detectada

**Response:**
```json
{
  "success": true,
  "messageId": "msg-uuid",
  "provider": "resend"
}
```

---

### 2.7 SSO Signin

**Endpoint:** `POST /functions/v1/sso-signin`

**Descricao:** Processa callback de SSO e cria sessao.

**Request Body:**
```json
{
  "provider": "azure-ad",
  "code": "authorization-code",
  "redirectUri": "https://app.trustlayer.io/callback"
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1705761000
  },
  "user": {
    "id": "user-uuid",
    "email": "user@company.com",
    "role": "analyst"
  }
}
```

---

### 2.8 SSO Provision User

**Endpoint:** `POST /functions/v1/sso-provision-user`

**Descricao:** Provisiona usuario via JIT (Just-In-Time) durante SSO.

**Request Body:**
```json
{
  "email": "newuser@company.com",
  "name": "New User",
  "groups": ["security-team", "analysts"],
  "provider": "azure-ad",
  "providerId": "azure-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user-uuid",
  "role": "analyst",
  "isNewUser": true
}
```

---

## 3. Supabase Database API

### 3.1 Answers (Respostas)

**Buscar respostas:**
```typescript
const { data, error } = await supabase
  .from('answers')
  .select('*')
  .eq('user_id', userId);
```

**Criar/atualizar resposta:**
```typescript
const { data, error } = await supabase
  .from('answers')
  .upsert({
    user_id: userId,
    question_id: questionId,
    response: 'yes',
    evidence: 'Documentado na politica...',
    updated_at: new Date().toISOString()
  });
```

### 3.2 Maturity Snapshots

**Buscar historico:**
```typescript
const { data, error } = await supabase
  .from('maturity_snapshots')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

### 3.3 Reports

**Listar relatorios gerados:**
```typescript
const { data, error } = await supabase
  .from('report_runs')
  .select(`
    *,
    template:report_templates(name, type)
  `)
  .eq('generated_by', userId)
  .order('created_at', { ascending: false });
```

**Buscar agendamentos:**
```typescript
const { data, error } = await supabase
  .from('report_schedules')
  .select(`
    *,
    template:report_templates(name, type)
  `)
  .eq('created_by', userId);
```

---

## 4. Rate Limiting

### 4.1 Limites por Endpoint

| Endpoint | Limite | Janela |
|----------|--------|--------|
| ai-assistant | 60 req | 1 min |
| audit-log | 120 req | 1 min |
| siem-forward | 60 req | 1 min |
| report-generator | 10 req | 1 min |
| email-service | 30 req | 1 min |

### 4.2 Headers de Rate Limit

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705761060
```

### 4.3 Tratando Rate Limit

Quando exceder o limite, voce recebe:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
```

Implemente backoff exponencial:

```typescript
async function requestWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

## 5. Webhooks (Futuro)

### 5.1 Eventos Disponiveis

| Evento | Descricao |
|--------|-----------|
| `assessment.completed` | Assessment finalizado |
| `report.generated` | Relatorio gerado |
| `anomaly.detected` | Anomalia detectada |
| `user.created` | Novo usuario provisionado |

### 5.2 Payload de Webhook

```json
{
  "event": "assessment.completed",
  "timestamp": "2026-01-20T10:30:00Z",
  "data": {
    "assessmentId": "uuid",
    "userId": "uuid",
    "score": 72.5
  },
  "signature": "sha256=..."
}
```

---

## 6. Exemplos de Integracao

### 6.1 Python

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.post(
    'https://your-project.supabase.co/functions/v1/report-generator',
    headers=headers,
    json={
        'templateId': 'executive-summary',
        'format': 'pdf'
    }
)

report = response.json()
print(f"Download: {report['downloadUrl']}")
```

### 6.2 Node.js

```javascript
const fetch = require('node-fetch');

async function generateReport() {
  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/report-generator',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templateId: 'executive-summary',
        format: 'pdf'
      })
    }
  );

  const report = await response.json();
  console.log(`Download: ${report.downloadUrl}`);
}
```

### 6.3 cURL

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/report-generator \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"templateId": "executive-summary", "format": "pdf"}'
```

---

## 7. Tratamento de Erros

### 7.1 Formato de Erro

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "O parametro 'templateId' e obrigatorio",
    "details": {
      "field": "templateId",
      "expected": "string"
    }
  },
  "requestId": "req-uuid"
}
```

### 7.2 Codigos de Erro Comuns

| Codigo | HTTP | Descricao |
|--------|------|-----------|
| INVALID_PARAMETER | 400 | Parametro invalido ou ausente |
| UNAUTHORIZED | 401 | Token invalido ou expirado |
| FORBIDDEN | 403 | Sem permissao para a acao |
| NOT_FOUND | 404 | Recurso nao encontrado |
| RATE_LIMITED | 429 | Limite de requisicoes excedido |
| INTERNAL_ERROR | 500 | Erro interno do servidor |

---

## Referencias

- [Arquitetura](architecture.md)
- [Database Schema](database-schema.md)
- [Sistema de Modulos](module-system.md)
- [Supabase Docs](https://supabase.com/docs)

---

*Ultima atualizacao: 20 de Janeiro de 2026*

# Visualizar Audit Logs - TrustLayer

---
**Perfil**: Auditor
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Os Audit Logs são registros imutáveis de todas as ações realizadas na plataforma TrustLayer. Como auditor, você tem acesso de leitura a todos os logs da organização.

## Acessando Audit Logs

### Via Interface

1. No menu lateral, clique em **"Audit Logs"**
2. A lista de logs será exibida em ordem cronológica (mais recentes primeiro)
3. Use os filtros para refinar a busca

### Via API (Read-Only)

```bash
# Listar audit logs
curl -X GET "https://api.trustlayer.com/v1/audit-logs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Filtrar por data
curl -X GET "https://api.trustlayer.com/v1/audit-logs?from=2026-01-01&to=2026-01-31" \
  -H "Authorization: Bearer $TOKEN"

# Filtrar por tipo de evento
curl -X GET "https://api.trustlayer.com/v1/audit-logs?event_type=auth.login" \
  -H "Authorization: Bearer $TOKEN"
```

## Estrutura de um Audit Log

### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único do log |
| `timestamp` | ISO 8601 | Data/hora do evento (UTC) |
| `event_type` | String | Tipo do evento (ex: `auth.login`) |
| `action` | Enum | CREATE, READ, UPDATE, DELETE |
| `user_id` | UUID | ID do usuário que realizou ação |
| `user_email` | String | Email do usuário |
| `user_role` | String | Role do usuário no momento |
| `resource_type` | String | Tipo do recurso afetado |
| `resource_id` | UUID | ID do recurso afetado |
| `before_state` | JSON | Estado antes da mudança (se aplicável) |
| `after_state` | JSON | Estado após a mudança (se aplicável) |
| `metadata` | JSON | Informações adicionais |

### Campos de Metadata

```json
{
  "metadata": {
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
    "geolocation": {
      "city": "São Paulo",
      "region": "SP",
      "country": "Brazil",
      "country_code": "BR",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "timezone": "America/Sao_Paulo"
    },
    "device": {
      "type": "desktop",
      "os": "Windows 11",
      "os_version": "10.0.22000",
      "browser": "Chrome",
      "browser_version": "120.0.6099.130"
    },
    "session_id": "sess_abc123",
    "correlation_id": "corr_xyz789",
    "request_id": "req_def456"
  }
}
```

## Tipos de Eventos

### Autenticação

| Event Type | Descrição | Severidade |
|------------|-----------|------------|
| `auth.login` | Login bem-sucedido | Info |
| `auth.login_failed` | Tentativa de login falhou | Warning |
| `auth.logout` | Logout realizado | Info |
| `auth.password_reset_requested` | Reset de senha solicitado | Info |
| `auth.password_reset_completed` | Senha resetada | Warning |
| `auth.mfa_enabled` | MFA habilitado | Info |
| `auth.mfa_disabled` | MFA desabilitado | Warning |
| `auth.mfa_verified` | Código MFA verificado | Info |
| `auth.mfa_failed` | Código MFA incorreto | Warning |
| `auth.session_expired` | Sessão expirou | Info |
| `auth.session_revoked` | Sessão revogada manualmente | Warning |

### Assessments

| Event Type | Descrição | Severidade |
|------------|-----------|------------|
| `assessment.create` | Assessment criado | Info |
| `assessment.update` | Assessment modificado | Info |
| `assessment.delete` | Assessment deletado | Warning |
| `assessment.submit` | Assessment submetido | Info |
| `assessment.archive` | Assessment arquivado | Info |
| `assessment.restore` | Assessment restaurado | Info |
| `assessment.duplicate` | Assessment duplicado | Info |
| `assessment.answer_update` | Resposta modificada | Info |
| `assessment.evidence_upload` | Evidência anexada | Info |
| `assessment.evidence_delete` | Evidência removida | Warning |

### Usuários

| Event Type | Descrição | Severidade |
|------------|-----------|------------|
| `user.create` | Usuário criado | Info |
| `user.update` | Usuário modificado | Info |
| `user.delete` | Usuário deletado | Critical |
| `user.role_change` | Role alterada | Warning |
| `user.deactivate` | Usuário desativado | Warning |
| `user.reactivate` | Usuário reativado | Info |
| `user.invite_sent` | Convite enviado | Info |
| `user.invite_accepted` | Convite aceito | Info |

### Relatórios

| Event Type | Descrição | Severidade |
|------------|-----------|------------|
| `report.generate` | Relatório gerado | Info |
| `report.download` | Relatório baixado | Info |
| `report.email_sent` | Relatório enviado por email | Info |
| `report.schedule_create` | Agendamento criado | Info |
| `report.schedule_delete` | Agendamento removido | Info |

### Sistema

| Event Type | Descrição | Severidade |
|------------|-----------|------------|
| `settings.update` | Configuração alterada | Warning |
| `organization.update` | Organização modificada | Warning |
| `api_key.create` | API key criada | Warning |
| `api_key.revoke` | API key revogada | Warning |
| `export.bulk` | Exportação em massa | Warning |

## Filtros Disponíveis

### Filtro por Data

```
┌─────────────────────────────────────┐
│ Date Range                          │
├─────────────────────────────────────┤
│ ○ Last 24 hours                     │
│ ○ Last 7 days                       │
│ ● Last 30 days                      │
│ ○ Last 90 days                      │
│ ○ Last year                         │
│ ○ Custom range                      │
│   From: [2026-01-01] To: [2026-01-31]│
└─────────────────────────────────────┘
```

### Filtro por Tipo de Evento

```
┌─────────────────────────────────────┐
│ Event Types                         │
├─────────────────────────────────────┤
│ ☑ All                               │
│ ☐ Authentication                    │
│   ☐ Login                          │
│   ☐ Logout                         │
│   ☐ MFA                            │
│ ☐ Assessments                       │
│   ☐ Create                         │
│   ☐ Update                         │
│   ☐ Delete                         │
│ ☐ Users                             │
│ ☐ Reports                           │
│ ☐ System                            │
└─────────────────────────────────────┘
```

### Filtro por Usuário

```
┌─────────────────────────────────────┐
│ User Filter                         │
├─────────────────────────────────────┤
│ Search: [________________] 🔍       │
│                                     │
│ Recent:                             │
│ ☐ admin@acme.com (543 events)      │
│ ☐ manager@acme.com (234 events)    │
│ ☐ analyst@acme.com (156 events)    │
└─────────────────────────────────────┘
```

### Filtro por Severidade

```
┌─────────────────────────────────────┐
│ Severity                            │
├─────────────────────────────────────┤
│ ☑ All                               │
│ ☐ Critical (security-sensitive)    │
│ ☐ Warning (potential issues)        │
│ ☐ Info (normal operations)         │
└─────────────────────────────────────┘
```

### Filtro por IP/Localização

```
┌─────────────────────────────────────┐
│ Location Filter                     │
├─────────────────────────────────────┤
│ IP Address: [________________]      │
│                                     │
│ Country:                            │
│ ☐ Brazil                            │
│ ☐ United States                     │
│ ☐ Other (show all)                  │
└─────────────────────────────────────┘
```

## Visualização de Logs

### Lista (Padrão)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Timestamp        │ Event Type      │ User              │ Resource │ Action│
├──────────────────────────────────────────────────────────────────────────┤
│ 2026-01-21 14:32 │ assessment.update│ analyst@acme.com │ ASS-001  │ UPDATE│
│ 2026-01-21 14:28 │ auth.login       │ analyst@acme.com │ -        │ -     │
│ 2026-01-21 13:45 │ report.generate  │ manager@acme.com │ RPT-023  │ CREATE│
│ 2026-01-21 11:20 │ user.role_change │ admin@acme.com   │ USR-045  │ UPDATE│
│ 2026-01-21 09:15 │ auth.login_failed│ unknown@test.com │ -        │ -     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Detalhes do Log

Clique em uma linha para ver detalhes completos:

```
┌─────────────────────────────────────────────────────────────────┐
│ LOG DETAILS                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Event ID: log_abc123def456                                     │
│ Timestamp: 2026-01-21T14:32:15.234Z                           │
│ Event Type: assessment.update                                   │
│ Action: UPDATE                                                  │
│                                                                 │
│ ─── User ───────────────────────────────────────────────────   │
│ Email: analyst@acme.com                                         │
│ Role: Analyst                                                   │
│ User ID: user_xyz789                                           │
│                                                                 │
│ ─── Resource ───────────────────────────────────────────────   │
│ Type: Assessment                                                │
│ ID: assessment_def456                                          │
│ Name: NIST-CSF Assessment Q1 2026                              │
│                                                                 │
│ ─── Changes ────────────────────────────────────────────────   │
│ Before:                    │ After:                            │
│ {                          │ {                                 │
│   "status": "draft",       │   "status": "completed",         │
│   "score": null,           │   "score": 85,                   │
│   "updated_at": "..."      │   "updated_at": "..."            │
│ }                          │ }                                 │
│                                                                 │
│ ─── Metadata ───────────────────────────────────────────────   │
│ IP Address: 192.168.1.100                                      │
│ Location: São Paulo, Brazil                                     │
│ Device: Windows 11 / Chrome 120                                │
│ Session ID: sess_abc123                                        │
│ Correlation ID: corr_xyz789                                    │
│                                                                 │
│ [View Timeline] [View User Activity] [Export]                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Busca Avançada

### Sintaxe de Busca

```
# Busca simples
assessment.update

# Busca por usuário
user:analyst@acme.com

# Busca por recurso
resource:assessment_abc123

# Busca por IP
ip:192.168.1.100

# Busca por período
from:2026-01-01 to:2026-01-15

# Combinações
user:admin@acme.com AND event_type:user.delete

# Excluir resultados
NOT event_type:auth.login

# Wildcards
user:*@acme.com
```

### Exemplos de Busca

| Objetivo | Query |
|----------|-------|
| Todos os logins falhos | `event_type:auth.login_failed` |
| Ações do admin | `user:admin@acme.com` |
| Deletions | `action:DELETE` |
| De IP específico | `ip:192.168.1.100` |
| Eventos críticos | `severity:critical` |
| Assessment específico | `resource:assessment_abc123` |
| Última semana | `from:2026-01-14 to:2026-01-21` |

## Exportar Logs

### Formatos Disponíveis

- **CSV**: Dados tabulares para análise
- **JSON**: Dados estruturados completos
- **PDF**: Relatório formatado para compliance

### Processo de Exportação

1. Aplique os filtros desejados
2. Clique em **"Export"** no canto superior direito
3. Selecione o formato
4. Escolha os campos a incluir:
   - ☑ Basic info (timestamp, event_type, user)
   - ☑ Resource details
   - ☑ Before/after states
   - ☑ Metadata (IP, geolocation)
   - ☑ Device info
5. Clique **"Generate Export"**
6. Aguarde processamento
7. Download automático ou link enviado por email

### Limites de Exportação

| Período | Limite de Registros | Tempo Estimado |
|---------|---------------------|----------------|
| 24 horas | 10,000 | < 1 min |
| 7 dias | 50,000 | 1-2 min |
| 30 dias | 200,000 | 5-10 min |
| 90 dias | 500,000 | 15-30 min |
| Custom | 1,000,000 | Via email |

## Alertas de Audit

Configure alertas automáticos para eventos específicos:

### Criar Alerta

1. Vá em **Settings > Audit Alerts**
2. Clique **"New Alert"**
3. Configure:
   - **Name**: Nome do alerta
   - **Condition**: Evento que dispara
   - **Threshold**: Quantidade (ex: 5 em 10 min)
   - **Notification**: Email, Slack, webhook
4. Salve o alerta

### Alertas Recomendados

| Alerta | Condição | Threshold |
|--------|----------|-----------|
| Brute Force | `auth.login_failed` | 5 em 10 min |
| After Hours | Qualquer evento | 23:00 - 06:00 |
| Unusual Location | Login de país diferente | 1 |
| Bulk Export | `export.bulk` | 100+ itens |
| Role Change | `user.role_change` | Qualquer |
| Account Delete | `user.delete` | Qualquer |

## Integrações

### SIEM Integration

Envie logs para seu SIEM:

```yaml
# Configuração de integração
siem:
  provider: splunk  # splunk, elastic, datadog
  endpoint: https://splunk.company.com:8088
  token: $SPLUNK_HEC_TOKEN
  index: trustlayer-audit
  filters:
    - event_type: auth.*
    - severity: critical
```

### Webhook

Receba logs em tempo real:

```bash
POST /your-webhook-endpoint
Content-Type: application/json

{
  "event_id": "log_abc123",
  "event_type": "auth.login_failed",
  "timestamp": "2026-01-21T14:32:15.234Z",
  "user_email": "unknown@test.com",
  "ip_address": "192.168.1.100",
  "metadata": {...}
}
```

## Compliance

### Retenção de Dados

Os audit logs são retidos por:
- **Padrão**: 7 anos (compliance SOX/HIPAA)
- **Mínimo configurável**: 1 ano
- **Máximo**: Indefinido

### Imutabilidade

- Logs são **write-once, read-many**
- Não podem ser modificados após criação
- Hash de integridade em cada registro
- Verificação de cadeia de custódia

### Auditoria de Auditores

Suas próprias ações como auditor também são logadas:

```json
{
  "event_type": "audit_log.view",
  "user_role": "auditor",
  "action": "READ",
  "resource": "audit_logs",
  "filters_applied": {
    "date_range": "2026-01-01 to 2026-01-31",
    "user_filter": "manager@acme.com"
  }
}
```

## Troubleshooting

### Log não encontrado

- Verifique se tem permissão para acessar
- Verifique o date range aplicado
- Logs podem demorar até 1 min para aparecer

### Exportação lenta

- Reduza o date range
- Aplique mais filtros
- Solicite export assíncrono (via email)

### Dados inconsistentes

- Verifique timezone (todos os timestamps são UTC)
- Before/after states podem ser null em alguns eventos
- Metadata pode variar por tipo de evento

## Referências

- [Event Types Reference](./event-types.md)
- [Filtros Avançados](./filters.md)
- [Exportar Logs](./export-logs.md)
- [Timeline View](./timeline.md)

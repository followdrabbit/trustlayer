# Guia do Auditor - TrustLayer

---
**Perfil**: Auditor
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Esta seção da documentação é destinada a **auditores** responsáveis por investigar, auditar e garantir compliance através de análise de logs, rastreamento de atividades e investigação forense.

## Público-Alvo

- Auditores internos
- Auditores externos
- Compliance officers
- Security analysts (investigação)
- Forensic investigators

## O que Auditores Podem Fazer

Como auditor, você tem acesso **somente leitura** a:

✅ **Audit Logs**: Todos os eventos do sistema
✅ **Change Logs**: Histórico de modificações (before/after)
✅ **User Activity**: Atividades de usuários
✅ **Timeline View**: Visualização cronológica de eventos
✅ **Forensic Investigation**: Ferramentas de análise forense
✅ **Export Capabilities**: Exportar logs e relatórios

❌ **Não pode**: Criar, editar ou deletar dados

## Índice

### 1. Primeiros Passos
- [Login e Acesso](./getting-started.md)
- [Interface do Auditor](./interface.md)
- [Permissões e Limitações](./permissions.md)

### 2. Audit Logs
- [Visualizar Audit Logs](./audit-logs.md)
- [Filtros e Busca](./filters.md)
- [Entendendo Event Types](./event-types.md)
- [Exportar Logs](./export-logs.md)

### 3. Change Logs
- [Visualizar Change History](./change-logs.md)
- [Before/After States](./before-after.md)
- [Track Data Changes](./data-changes.md)

### 4. User Activity
- [User Activity Dashboard](./user-activity.md)
- [Session Tracking](./sessions.md)
- [Login History](./login-history.md)
- [Activity Heatmap](./activity-heatmap.md)

### 5. Forensic Investigation
- [Timeline View](./timeline.md)
- [Correlation Analysis](./correlation.md)
- [Relationship Graphs](./relationship-graphs.md)
- [Investigation Workflow](./investigation-workflow.md)

### 6. Compliance Reports
- [Generate Audit Reports](./audit-reports.md)
- [Compliance Evidence](./compliance-evidence.md)
- [Data Retention](./data-retention.md)

## Quick Start: Sua Primeira Auditoria

### Passo 1: Login

1. Acesse https://trustlayer.com
2. Faça login com suas credenciais de auditor
3. Você será redirecionado para **Audit Dashboard**

### Passo 2: Visualizar Audit Logs

1. No menu lateral, clique em **"Audit Logs"**
2. Você verá todos os eventos do sistema
3. Use filtros para refinar:
   - **Date Range**: Últimos 7 dias, 30 dias, custom
   - **Event Type**: Login, Create, Update, Delete
   - **User**: Filtrar por usuário específico
   - **Resource**: Filtrar por tipo de recurso (assessment, user, etc.)

### Passo 3: Investigar Atividade Suspeita

**Exemplo: Investigar múltiplos logins de um usuário**

1. Na barra de busca, digite o email do usuário
2. Clique em **"View User Activity"**
3. Visualize:
   - **Login History**: Todos os logins recentes
   - **IP Addresses**: De onde usuário logou
   - **Geolocation**: Mapa de localizações
   - **Devices**: Dispositivos usados
4. Se suspeito, exporte relatório para análise

### Passo 4: Análise de Timeline

1. Clique em **"Timeline View"**
2. Selecione date range (ex: última semana)
3. Visualize eventos cronologicamente
4. Identifique padrões ou anomalias
5. Drill-down em eventos específicos

### Passo 5: Exportar para Compliance

1. Após investigação, clique em **"Export"**
2. Selecione formato: **PDF**, **Excel** ou **CSV**
3. Relatório incluirá:
   - Todos os logs filtrados
   - Before/after states
   - IP addresses e geolocation
   - Timestamps precisos

## Interface do Auditor

### Dashboard Principal

```
┌─────────────────────────────────────────────────┐
│              AUDIT DASHBOARD                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  📊 Total Events (30d): 12,543                  │
│  👥 Active Users (30d): 87                      │
│  🚨 Failed Logins (30d): 23                     │
│  📝 Changes Made (30d): 1,234                   │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Event Types  │  │ Top Users    │             │
│  │   Chart      │  │   Table      │             │
│  └──────────────┘  └──────────────┘             │
│                                                  │
│  ┌─────────────────────────────────┐            │
│  │   Recent Suspicious Activities   │            │
│  │ • Multiple failed logins         │            │
│  │ • Unusual login location         │            │
│  │ • After-hours activity           │            │
│  └─────────────────────────────────┘            │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Sidebar (Menu Lateral)

```
┌─────────────────────┐
│ 🏠 Audit Dashboard  │
│ 📋 Audit Logs       │
│ 📝 Change Logs      │
│ 👥 User Activity    │
│ ⏱️  Timeline View   │
│ 🔍 Investigation    │
│ 📄 Audit Reports    │
│ ⚙️  Settings        │
└─────────────────────┘
```

## Audit Logs

### Estrutura de um Audit Log Entry

```json
{
  "id": "log-uuid-123",
  "timestamp": "2026-01-21T14:32:15.234Z",
  "event_type": "assessment.update",
  "user": {
    "id": "user-uuid-456",
    "email": "analyst@acme.com",
    "role": "analyst"
  },
  "resource": {
    "type": "assessment",
    "id": "assessment-uuid-789",
    "name": "NIST-CSF Assessment Q1 2026"
  },
  "action": "UPDATE",
  "before_state": {
    "status": "draft",
    "score": null
  },
  "after_state": {
    "status": "completed",
    "score": 85
  },
  "metadata": {
    "ip_address": "192.168.1.100",
    "geolocation": {
      "city": "São Paulo",
      "country": "Brazil",
      "lat": -23.5505,
      "lon": -46.6333
    },
    "device": {
      "type": "desktop",
      "os": "Windows 11",
      "browser": "Chrome 120.0"
    },
    "session_id": "session-uuid-abc"
  }
}
```

### Event Types

| Event Type | Descrição | Exemplo |
|------------|-----------|---------|
| `auth.login` | Login bem-sucedido | User logged in via SSO |
| `auth.login_failed` | Tentativa de login falhou | Invalid password |
| `auth.logout` | Logout | User logged out |
| `auth.mfa_verified` | MFA verificado | TOTP code verified |
| `assessment.create` | Assessment criado | New NIST-CSF assessment |
| `assessment.update` | Assessment modificado | Status changed to completed |
| `assessment.delete` | Assessment deletado | Assessment archived |
| `user.create` | Usuário criado | New analyst added |
| `user.update` | Usuário modificado | Role changed to manager |
| `user.delete` | Usuário removido | User deactivated |
| `settings.update` | Configuração alterada | MFA enabled globally |
| `export.generate` | Relatório exportado | PDF report generated |

## Investigação Forense

### Workflow de Investigação

```
1. Identificar Alerta
   ↓
2. Coletar Logs Relevantes
   ↓
3. Análise de Timeline
   ↓
4. Correlation Analysis
   ↓
5. Identificar Root Cause
   ↓
6. Documentar Findings
   ↓
7. Gerar Audit Report
   ↓
8. Recomendar Remediação
```

### Exemplo: Investigar Acesso Não Autorizado

**Cenário**: Alerta de login suspeito de localização incomum.

**Passo 1: Identificar Evento**
```
Event: auth.login
User: manager@acme.com
Time: 2026-01-21 03:45:00 UTC (after-hours)
Location: Moscou, Rússia (unusual)
```

**Passo 2: Coletar Contexto**
- Verificar login history do usuário
- IP address anterior: São Paulo, Brasil
- Última atividade normal: 18:00 UTC (15h BRT)
- Device novo: Android (usuário costuma usar Windows)

**Passo 3: Timeline Analysis**
```
18:00 UTC - Último login normal (São Paulo)
18:05 UTC - Logout normal
03:45 UTC - Login de Moscou (9h depois, localização diferente)
03:50 UTC - Acesso a assessments sensíveis
04:15 UTC - Export de relatórios
04:20 UTC - Logout
```

**Passo 4: Correlation**
- Impossível viajar de São Paulo para Moscou em 9h
- Device fingerprint diferente
- User-Agent diferente
- **Conclusão**: Provável credential compromise

**Passo 5: Ações**
- Notificar Security Team
- Forçar reset de senha
- Invalidar sessões ativas
- Habilitar MFA (se não tinha)
- Verificar se dados foram exfiltrados

**Passo 6: Documentar**
Gerar **Investigation Report** com:
- Timeline completo
- Evidências (screenshots, logs)
- IP addresses e geolocation
- Ações tomadas
- Recomendações

## Filtros Avançados

### Por Date Range

```
• Últimas 24 horas
• Últimos 7 dias
• Últimos 30 dias
• Últimos 90 dias
• Custom (selecionar intervalo específico)
```

### Por Event Type

```
✓ All Events
□ Authentication
  ├─ Login
  ├─ Logout
  └─ MFA
□ Data Changes
  ├─ Create
  ├─ Update
  └─ Delete
□ Admin Actions
  ├─ User Management
  └─ Settings
□ Exports
```

### Por User

```
Search: [email or name]

Recent Users:
• manager@acme.com (234 events)
• analyst@acme.com (156 events)
• admin@acme.com (89 events)
```

### Por Resource

```
Resource Type:
• Assessments
• Users
• Organizations
• Reports
• Settings
```

### Por Severity

```
• 🔴 Critical (security-sensitive)
• 🟠 High (data changes)
• 🟡 Medium (normal operations)
• 🟢 Low (read-only)
```

## User Activity Dashboard

### Métricas Principais

```
┌──────────────────────────────────────┐
│         USER ACTIVITY                │
├──────────────────────────────────────┤
│ User: manager@acme.com               │
│                                      │
│ Total Sessions (30d): 47             │
│ Total Events (30d): 1,234            │
│ Last Login: 2026-01-21 09:15 BRT    │
│ Last IP: 192.168.1.100              │
│                                      │
│ ┌──────────────┐  ┌──────────────┐  │
│ │ Activity     │  │ Login        │  │
│ │ Heatmap      │  │ Locations    │  │
│ └──────────────┘  └──────────────┘  │
│                                      │
│ Top Actions:                         │
│ • assessment.update (234)            │
│ • dashboard.view (156)               │
│ • report.export (45)                 │
│                                      │
└──────────────────────────────────────┘
```

### Activity Heatmap

Mostra padrões de atividade por hora/dia:

```
       Mon Tue Wed Thu Fri Sat Sun
00-06  ⬜  ⬜  ⬜  ⬜  ⬜  ⬜  ⬜
06-12  🟨  🟨  🟨  🟨  🟨  ⬜  ⬜
12-18  🟩  🟩  🟩  🟩  🟩  ⬜  ⬜
18-24  🟦  🟦  🟦  ⬜  ⬜  ⬜  ⬜

⬜ No activity
🟦 Low (1-10 events)
🟨 Medium (11-50 events)
🟩 High (51+ events)
```

**Anomalias visíveis:**
- Atividade em horários incomuns (03:00-06:00)
- Atividade em finais de semana
- Picos de atividade anormais

## Timeline View

Visualização cronológica interativa:

```
2026-01-21
├─ 09:15 🟢 auth.login (São Paulo)
├─ 09:20 🟡 assessment.update
├─ 10:45 🟡 dashboard.view
├─ 11:30 🟠 user.update (role changed)
├─ 14:20 🟡 report.export
└─ 18:00 🟢 auth.logout

2026-01-19
├─ 08:45 🟢 auth.login
├─ 09:00 🟡 assessment.create
├─ 15:30 🔴 assessment.delete (critical)
└─ 17:45 🟢 auth.logout
```

**Features:**
- Zoom in/out temporal
- Filter por event type
- Color-coded por severity
- Hover para detalhes
- Click para drill-down

## Relationship Graphs

Visualize conexões entre entidades:

```
        ┌───────────┐
        │   User    │
        │ manager@  │
        │ acme.com  │
        └─────┬─────┘
              │
     ┌────────┼────────┐
     │        │        │
┌────▼───┐ ┌─▼────┐ ┌─▼────┐
│Assessment│ │Report│ │Session│
│ A        │ │ R1   │ │ S1    │
└──────────┘ └──────┘ └───────┘
```

**Use cases:**
- Rastrear quem modificou um assessment
- Ver todos os relatórios gerados por um usuário
- Identificar sessões concorrentes

## Compliance Reports

### Gerar Audit Report

1. Defina escopo:
   - Date range
   - Event types
   - Users (all ou specific)
2. Selecione formato: PDF, Excel, CSV
3. Inclua:
   - [ ] Before/after states
   - [ ] IP addresses
   - [ ] Geolocation
   - [ ] Device info
   - [ ] Executive summary
4. Click **"Generate Report"**

### Report Sections

```markdown
# Audit Report

## Executive Summary
- Total events analyzed: 12,543
- Date range: 2026-01-01 to 2026-01-31
- Users audited: 87
- Anomalies detected: 3

## Key Findings
1. Unauthorized access attempt detected
2. After-hours activity by 2 users
3. Multiple failed login attempts

## Detailed Logs
[Table with all events]

## Recommendations
1. Enforce MFA for all users
2. Review access controls
3. Implement IP whitelisting
```

## Data Retention

### Retention Policies

| Data Type | Retention Period | Deletion Method |
|-----------|------------------|-----------------|
| Audit Logs | 7 years | Auto-delete after 7y |
| Change Logs | 7 years | Auto-delete after 7y |
| Session Data | 90 days | Auto-delete after 90d |
| Login History | 1 year | Auto-delete after 1y |
| Exports | 30 days | Auto-delete after 30d |

**Compliance:**
- SOX: 7 years
- HIPAA: 6 years
- GDPR: Varies by context
- ISO 27001: Minimum 1 year

## Best Practices

### ✅ Auditoria Eficaz

1. **Defina Scope**: Não tente auditar tudo de uma vez
2. **Use Filtros**: Refine resultados para focar em suspeitas
3. **Timeline Analysis**: Identifique padrões temporais
4. **Correlate Events**: Conecte eventos relacionados
5. **Document Findings**: Sempre documente suas conclusões
6. **Follow Up**: Verifique se remediações foram implementadas

### ✅ Investigação Forense

1. **Preserve Evidence**: Exporte logs antes de filtrar
2. **Chain of Custody**: Documente quem acessou o quê
3. **Non-Repudiation**: Timestamps e hashes garantem integridade
4. **Root Cause Analysis**: Não pare no sintoma, encontre causa raiz

### ✅ Compliance

1. **Regular Audits**: Agende auditorias periódicas (mensais/trimestrais)
2. **Automated Alerts**: Configure alertas para eventos críticos
3. **Reporting**: Gere relatórios executivos para stakeholders
4. **Training**: Mantenha-se atualizado sobre compliance requirements

## Alertas e Notificações

Auditores podem configurar alertas para:

- 🚨 Multiple failed logins (>5 em 10min)
- 🚨 Login de localização incomum
- 🚨 After-hours activity (23:00-06:00)
- 🚨 Bulk data export (>100 assessments)
- 🚨 Privilege escalation (role change to admin)
- 🚨 Account deletion
- 🚨 Settings change (security-related)

## Suporte

Para questões de auditoria:
- **Email**: audit@trustlayer.com
- **Compliance Team**: compliance@trustlayer.com
- **Documentation**: [Audit Logs Guide](./audit-logs.md)

## Referências

- [ADR-0028: Auditor Role](../../adr/0028-auditor-role.md)
- [NIST SP 800-92: Guide to Computer Security Log Management](https://csrc.nist.gov/publications/detail/sp/800-92/final)
- [ISO 27001:2022 - A.12.4 Logging and Monitoring](https://www.iso.org/standard/27001)

## Glossário

- **Audit Log**: Registro de evento do sistema
- **Change Log**: Registro de modificação de dados (before/after)
- **Session**: Período de atividade contínua de um usuário
- **Event Type**: Categoria de evento (login, create, update, etc.)
- **Correlation ID**: ID único que conecta eventos relacionados
- **Geolocation**: Localização geográfica derivada de IP
- **Device Fingerprint**: Identificador único de dispositivo
- **Forensic Investigation**: Investigação detalhada de incidente
- **Timeline**: Visualização cronológica de eventos
- **RLS**: Row Level Security (você só vê logs permitidos)

---

**Precisa de ajuda?** Contate audit@trustlayer.com

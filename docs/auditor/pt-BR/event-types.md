# Event Types Reference - TrustLayer Auditor Guide

---
**Perfil**: Auditor
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este documento lista todos os tipos de eventos registrados nos audit logs do TrustLayer, organizados por categoria.

## Estrutura do Event Type

```
{categoria}.{ação}

Exemplos:
- auth.login
- assessment.create
- user.role_change
```

## Categorias de Eventos

### 1. Authentication (auth.*)

Eventos relacionados a autenticação e sessões.

| Event Type | Descrição | Severidade | Dados Incluídos |
|------------|-----------|------------|-----------------|
| `auth.login` | Login bem-sucedido | Info | IP, device, method |
| `auth.login_failed` | Tentativa de login falhou | Warning | IP, reason, email |
| `auth.logout` | Logout realizado | Info | session_id |
| `auth.session_created` | Nova sessão criada | Info | session_id, device |
| `auth.session_expired` | Sessão expirou | Info | session_id, duration |
| `auth.session_revoked` | Sessão revogada manualmente | Warning | session_id, revoked_by |
| `auth.password_reset_requested` | Reset de senha solicitado | Info | email |
| `auth.password_reset_completed` | Senha foi resetada | Warning | user_id |
| `auth.password_changed` | Usuário alterou sua senha | Info | user_id |
| `auth.mfa_enabled` | MFA habilitado | Info | method (totp/webauthn) |
| `auth.mfa_disabled` | MFA desabilitado | Warning | method, disabled_by |
| `auth.mfa_verified` | Código MFA verificado | Info | method |
| `auth.mfa_failed` | Código MFA incorreto | Warning | method, attempts |
| `auth.mfa_recovery_used` | Código de recuperação usado | Warning | codes_remaining |
| `auth.sso_initiated` | Login SSO iniciado | Info | provider |
| `auth.sso_completed` | Login SSO completado | Info | provider, user_id |
| `auth.sso_failed` | Login SSO falhou | Warning | provider, error |
| `auth.token_refresh` | Token de acesso renovado | Info | session_id |
| `auth.token_revoked` | Token revogado | Warning | reason |

### 2. User Management (user.*)

Eventos relacionados a gerenciamento de usuários.

| Event Type | Descrição | Severidade | Dados Incluídos |
|------------|-----------|------------|-----------------|
| `user.create` | Usuário criado | Info | user_id, email, role |
| `user.update` | Dados do usuário atualizados | Info | user_id, fields_changed |
| `user.delete` | Usuário deletado | Critical | user_id, deleted_by |
| `user.invite_sent` | Convite enviado | Info | email, role |
| `user.invite_accepted` | Convite aceito | Info | user_id |
| `user.invite_expired` | Convite expirou | Info | email |
| `user.invite_cancelled` | Convite cancelado | Info | email, cancelled_by |
| `user.role_change` | Role do usuário alterada | Warning | user_id, old_role, new_role |
| `user.deactivate` | Usuário desativado | Warning | user_id, deactivated_by |
| `user.reactivate` | Usuário reativado | Info | user_id, reactivated_by |
| `user.avatar_upload` | Avatar atualizado | Info | user_id |
| `user.avatar_delete` | Avatar removido | Info | user_id |
| `user.profile_view` | Perfil visualizado | Info | viewer_id, viewed_id |

### 3. Assessment (assessment.*)

Eventos relacionados a assessments.

| Event Type | Descrição | Severidade | Dados Incluídos |
|------------|-----------|------------|-----------------|
| `assessment.create` | Assessment criado | Info | id, name, framework |
| `assessment.update` | Assessment atualizado | Info | id, fields_changed |
| `assessment.delete` | Assessment deletado | Warning | id, deleted_by |
| `assessment.view` | Assessment visualizado | Info | id, viewer_id |
| `assessment.submit` | Assessment submetido | Info | id, score |
| `assessment.reopen` | Assessment reaberto | Warning | id, reopened_by |
| `assessment.archive` | Assessment arquivado | Info | id |
| `assessment.restore` | Assessment restaurado | Info | id |
| `assessment.duplicate` | Assessment duplicado | Info | original_id, new_id |
| `assessment.assign` | Assessment atribuído | Info | id, assignee_id |
| `assessment.unassign` | Atribuição removida | Info | id, assignee_id |
| `assessment.answer_create` | Resposta criada | Info | assessment_id, question_id |
| `assessment.answer_update` | Resposta atualizada | Info | assessment_id, question_id, before, after |
| `assessment.answer_delete` | Resposta deletada | Warning | assessment_id, question_id |
| `assessment.evidence_upload` | Evidência anexada | Info | assessment_id, file_name |
| `assessment.evidence_delete` | Evidência removida | Warning | assessment_id, file_name |
| `assessment.comment_add` | Comentário adicionado | Info | assessment_id, question_id |
| `assessment.comment_delete` | Comentário removido | Info | assessment_id, comment_id |
| `assessment.score_recalculate` | Score recalculado | Info | assessment_id, old_score, new_score |

### 4. Dashboard (dashboard.*)

Eventos relacionados a dashboards.

| Event Type | Descrição | Severidade | Dados Incluídos |
|------------|-----------|------------|-----------------|
| `dashboard.view` | Dashboard visualizado | Info | type (executive/grc/specialist) |
| `dashboard.export` | Dashboard exportado | Info | type, format |
| `dashboard.widget_add` | Widget adicionado | Info | dashboard_id, widget_type |
| `dashboard.widget_remove` | Widget removido | Info | dashboard_id, widget_id |
| `dashboard.widget_configure` | Widget configurado | Info | widget_id, config |
| `dashboard.layout_save` | Layout salvo | Info | dashboard_id |
| `dashboard.share` | Dashboard compartilhado | Info | dashboard_id, shared_with |
| `dashboard.unshare` | Compartilhamento removido | Info | dashboard_id |

### 5. Report (report.*)

Eventos relacionados a relatórios.

| Event Type | Descrição | Severidade | Dados Incluídos |
|------------|-----------|------------|-----------------|
| `report.generate` | Relatório gerado | Info | type, format, filters |
| `report.download` | Relatório baixado | Info | report_id |
| `report.email_sent` | Relatório enviado por email | Info | report_id, recipients |
| `report.schedule_create` | Agendamento criado | Info | schedule_id, cron |
| `report.schedule_update` | Agendamento atualizado | Info | schedule_id |
| `report.schedule_delete` | Agendamento removido | Info | schedule_id |
| `report.schedule_run` | Relatório agendado executado | Info | schedule_id, report_id |
| `report.template_create` | Template criado | Info | template_id, name |
| `report.template_update` | Template atualizado | Info | template_id |
| `report.template_delete` | Template deletado | Info | template_id |

### 6. Organization (organization.*)

Eventos relacionados a organizações.

| Event Type | Descrição | Severidade | Dados Incluídos |
|------------|-----------|------------|-----------------|
| `organization.create` | Organização criada | Info | org_id, name |
| `organization.update` | Organização atualizada | Warning | org_id, fields_changed |
| `organization.delete` | Organização deletada | Critical | org_id, deleted_by |
| `organization.logo_upload` | Logo atualizado | Info | org_id |
| `organization.logo_delete` | Logo removido | Info | org_id |
| `organization.settings_update` | Configurações atualizadas | Warning | org_id, settings |
| `organization.domain_add` | Domínio adicionado | Info | org_id, domain |
| `organization.domain_remove` | Domínio removido | Warning | org_id, domain |
| `organization.domain_verify` | Domínio verificado | Info | org_id, domain |

### 7. Settings (settings.*)

Eventos relacionados a configurações do sistema.

| Event Type | Descrição | Severidade | Dados Incluídos |
|------------|-----------|------------|-----------------|
| `settings.security_update` | Config de segurança alterada | Warning | setting_name, before, after |
| `settings.mfa_policy_update` | Política MFA alterada | Warning | policy |
| `settings.password_policy_update` | Política de senha alterada | Warning | policy |
| `settings.session_policy_update` | Política de sessão alterada | Warning | policy |
| `settings.sso_configure` | SSO configurado | Warning | provider |
| `settings.sso_disable` | SSO desabilitado | Warning | provider |
| `settings.email_configure` | Email configurado | Info | provider |
| `settings.notification_update` | Notificações atualizadas | Info | settings |
| `settings.theme_update` | Tema atualizado | Info | theme |
| `settings.feature_toggle` | Feature flag alterada | Warning | feature, enabled |
| `settings.rate_limit_update` | Rate limit alterado | Warning | limits |

### 8. API (api.*)

Eventos relacionados a API e integrações.

| Event Type | Descrição | Severidade | Dados Incluídos |
|------------|-----------|------------|-----------------|
| `api.key_create` | API key criada | Warning | key_id, name, scope |
| `api.key_revoke` | API key revogada | Warning | key_id, revoked_by |
| `api.key_expire` | API key expirou | Info | key_id |
| `api.request` | Requisição API | Info | endpoint, method, status |
| `api.rate_limit_hit` | Rate limit atingido | Warning | key_id, endpoint |
| `api.webhook_create` | Webhook criado | Info | webhook_id, url |
| `api.webhook_update` | Webhook atualizado | Info | webhook_id |
| `api.webhook_delete` | Webhook deletado | Info | webhook_id |
| `api.webhook_trigger` | Webhook disparado | Info | webhook_id, event |
| `api.webhook_fail` | Webhook falhou | Warning | webhook_id, error |

### 9. Export (export.*)

Eventos relacionados a exportação de dados.

| Event Type | Descrição | Severidade | Dados Incluídos |
|------------|-----------|------------|-----------------|
| `export.data_request` | Exportação de dados solicitada | Info | type, filters |
| `export.data_complete` | Exportação concluída | Info | export_id, size |
| `export.data_download` | Exportação baixada | Info | export_id |
| `export.bulk_start` | Exportação em massa iniciada | Warning | type, count |
| `export.bulk_complete` | Exportação em massa concluída | Info | export_id |
| `export.audit_logs` | Audit logs exportados | Info | date_range, filters |

### 10. AI Assistant (ai.*)

Eventos relacionados ao assistente de IA.

| Event Type | Descrição | Severidade | Dados Incluídos |
|------------|-----------|------------|-----------------|
| `ai.query` | Consulta ao AI Assistant | Info | query_type, context |
| `ai.response` | Resposta do AI Assistant | Info | response_type, tokens |
| `ai.feedback` | Feedback sobre resposta | Info | rating, comment |
| `ai.suggestion_accepted` | Sugestão aceita | Info | suggestion_id |
| `ai.suggestion_rejected` | Sugestão rejeitada | Info | suggestion_id |

### 11. System (system.*)

Eventos de sistema (geralmente automáticos).

| Event Type | Descrição | Severidade | Dados Incluídos |
|------------|-----------|------------|-----------------|
| `system.startup` | Sistema iniciado | Info | version |
| `system.shutdown` | Sistema encerrado | Info | reason |
| `system.maintenance_start` | Manutenção iniciada | Warning | scheduled |
| `system.maintenance_end` | Manutenção concluída | Info | duration |
| `system.backup_start` | Backup iniciado | Info | type |
| `system.backup_complete` | Backup concluído | Info | size, duration |
| `system.backup_fail` | Backup falhou | Critical | error |
| `system.cleanup` | Limpeza automática executada | Info | type, records_affected |
| `system.migration` | Migração executada | Warning | version, status |

---

## Níveis de Severidade

| Severidade | Descrição | Cor |
|------------|-----------|-----|
| Critical | Evento de segurança crítico | 🔴 Vermelho |
| Warning | Evento que requer atenção | 🟠 Laranja |
| Info | Evento informativo normal | 🟢 Verde |

---

## Exemplo de Log Entry

```json
{
  "id": "evt_abc123def456",
  "event_type": "assessment.submit",
  "timestamp": "2026-01-21T14:32:15.234Z",
  "severity": "info",
  "actor": {
    "id": "usr_xyz789",
    "email": "analyst@company.com",
    "role": "analyst",
    "ip_address": "192.168.1.100"
  },
  "resource": {
    "type": "assessment",
    "id": "ass_123456",
    "name": "NIST-CSF Q1 2026"
  },
  "data": {
    "score": 85,
    "questions_answered": 100,
    "gaps_identified": 15
  },
  "metadata": {
    "session_id": "sess_abc123",
    "user_agent": "Mozilla/5.0...",
    "geolocation": {
      "city": "São Paulo",
      "country": "Brazil"
    }
  }
}
```

---

## Referências

- [Audit Logs](./audit-logs.md)
- [Filters](./filters.md)
- [Timeline](./timeline.md)

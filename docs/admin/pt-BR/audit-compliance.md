# Auditoria e Compliance - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre os controles de auditoria e conformidade implementados no TrustLayer, mapeados para frameworks de compliance como SOC 2, ISO 27001, LGPD e GDPR.

## Sistema de Auditoria

### Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    TrustLayer Application                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Frontend  │  │  API/Edge   │  │     Database        │ │
│  │   Events    │  │  Functions  │  │    Triggers         │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼─────────────────────┼────────────┘
          │                │                     │
          └────────────────┴──────────┬──────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │   Audit Log Service    │
                         │  - Enrich with context │
                         │  - Validate payload    │
                         │  - Persist to DB       │
                         └───────────┬────────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
          ┌────────────┐    ┌───────────────┐    ┌────────────┐
          │ change_logs│    │ SIEM Forward  │    │  Analytics │
          │  (Supabase)│    │  (External)   │    │  (Export)  │
          └────────────┘    └───────────────┘    └────────────┘
```

### Eventos Auditados

| Categoria | Eventos | Severidade |
|-----------|---------|------------|
| Autenticação | login, logout, mfa_enable, mfa_disable, password_change | Alta |
| Assessment | create, update, submit, delete | Média |
| Configuração | framework_enable, domain_change, settings_update | Alta |
| Admin | user_create, user_role_change, org_settings | Crítica |
| Dados | export, import, bulk_update | Alta |
| Sistema | backup, restore, maintenance | Crítica |

### Estrutura do Log

```json
{
  "id": "uuid",
  "timestamp": "2026-01-21T10:30:00.000Z",
  "event_type": "auth.login",
  "user_id": "user-uuid",
  "organization_id": "org-uuid",
  "resource_type": "session",
  "resource_id": "session-uuid",
  "action": "create",
  "outcome": "success",
  "details": {
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "geo": {
      "country": "BR",
      "city": "São Paulo",
      "lat": -23.55,
      "lon": -46.63
    },
    "device": {
      "type": "desktop",
      "os": "Windows 11",
      "browser": "Chrome 120"
    },
    "mfa_used": true,
    "session_duration": null
  },
  "risk_score": 15,
  "request_id": "req-uuid"
}
```

## Mapeamento de Controles

### SOC 2 Type II

| Critério | Controle | Implementação | Status |
|----------|----------|---------------|--------|
| CC6.1 | Logical Access | RBAC + MFA | ✅ |
| CC6.2 | System Boundaries | RLS + Network Isolation | ✅ |
| CC6.3 | Access Removal | User deprovisioning | ✅ |
| CC6.6 | Encryption | TLS 1.2+ + At-rest | ✅ |
| CC6.7 | Data Transmission | HTTPS only | ✅ |
| CC7.1 | Detection | Audit logs + Monitoring | ✅ |
| CC7.2 | Monitoring | SIEM integration | ✅ |
| CC7.3 | Evaluation | Security assessments | ✅ |
| CC8.1 | Change Management | Version control + CI/CD | ✅ |

### ISO 27001

| Controle | Descrição | Implementação |
|----------|-----------|---------------|
| A.5.1 | Políticas de SI | Documentação |
| A.6.1 | Organização de SI | Roles e responsabilidades |
| A.8.2 | Classificação | Labels de dados |
| A.9.1 | Controle de acesso | RBAC |
| A.9.4 | Controle de acesso a sistemas | MFA |
| A.10.1 | Criptografia | TLS + AES-256 |
| A.12.4 | Logging | Audit trail |
| A.12.6 | Vulnerabilidades | Scanning |
| A.14.2 | Segurança no dev | SAST/DAST |
| A.18.1 | Compliance legal | LGPD/GDPR |

### LGPD

| Artigo | Requisito | Implementação |
|--------|-----------|---------------|
| Art. 7 | Base legal | Consentimento explícito |
| Art. 9 | Consentimento | Termos de uso |
| Art. 11 | Dados sensíveis | Criptografia |
| Art. 15 | Término | Data retention policy |
| Art. 18 | Direitos do titular | Export/delete APIs |
| Art. 37 | DPO | Contato configurado |
| Art. 46 | Segurança | Controles técnicos |
| Art. 50 | Boas práticas | Security baseline |

## Relatórios de Compliance

### Geração de Relatórios

```sql
-- Relatório de acessos por período
SELECT
  date_trunc('day', timestamp) as date,
  event_type,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE outcome = 'failure') as failures
FROM change_logs
WHERE timestamp >= NOW() - INTERVAL '30 days'
  AND event_type LIKE 'auth.%'
GROUP BY date_trunc('day', timestamp), event_type
ORDER BY date DESC, event_type;

-- Relatório de atividades privilegiadas
SELECT
  timestamp,
  u.email as user_email,
  event_type,
  resource_type,
  details->>'reason' as reason
FROM change_logs cl
JOIN profiles u ON cl.user_id = u.id
WHERE event_type IN (
  'admin.user_role_change',
  'admin.org_settings_update',
  'admin.system_config_change'
)
  AND timestamp >= NOW() - INTERVAL '90 days'
ORDER BY timestamp DESC;

-- Relatório de exceções de segurança
SELECT
  timestamp,
  event_type,
  user_id,
  details->>'ip_address' as ip,
  details->>'geo'->>'country' as country,
  risk_score,
  outcome
FROM change_logs
WHERE risk_score > 70
  AND timestamp >= NOW() - INTERVAL '30 days'
ORDER BY risk_score DESC, timestamp DESC;
```

### Dashboard de Compliance

```typescript
// Métricas para dashboard
interface ComplianceMetrics {
  // Autenticação
  totalLogins: number;
  failedLogins: number;
  mfaAdoption: number; // percentual

  // Acesso
  activeUsers: number;
  privilegedUsers: number;
  unusedAccounts: number;

  // Dados
  dataExports: number;
  dataDeletes: number;
  consentRecords: number;

  // Incidentes
  securityIncidents: number;
  anomaliesDetected: number;

  // Cobertura
  auditCoverage: number; // percentual de eventos auditados
  retentionCompliance: number; // percentual dentro do prazo
}
```

## Evidências de Auditoria

### Coleta Automática

```typescript
// Função para gerar evidências
async function generateAuditEvidence(
  startDate: Date,
  endDate: Date,
  controls: string[]
): Promise<AuditEvidence> {
  const evidence: AuditEvidence = {
    period: { start: startDate, end: endDate },
    generatedAt: new Date(),
    controls: {}
  };

  for (const control of controls) {
    switch (control) {
      case 'CC6.1': // Logical Access
        evidence.controls['CC6.1'] = {
          userAccessReview: await getUserAccessReport(startDate, endDate),
          mfaStatus: await getMfaAdoptionReport(),
          roleChanges: await getRoleChangeLog(startDate, endDate)
        };
        break;

      case 'CC7.1': // Detection
        evidence.controls['CC7.1'] = {
          auditLogs: await getAuditLogSummary(startDate, endDate),
          anomalies: await getAnomalyReport(startDate, endDate),
          alerts: await getAlertHistory(startDate, endDate)
        };
        break;

      // ... outros controles
    }
  }

  return evidence;
}
```

### Armazenamento de Evidências

```sql
-- Tabela de evidências
CREATE TABLE compliance_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_period_start DATE NOT NULL,
  audit_period_end DATE NOT NULL,
  framework VARCHAR(50) NOT NULL, -- 'SOC2', 'ISO27001', 'LGPD'
  control_id VARCHAR(20) NOT NULL,
  evidence_type VARCHAR(50) NOT NULL,
  evidence_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id),
  notes TEXT
);

-- Índices
CREATE INDEX idx_evidence_period ON compliance_evidence(audit_period_start, audit_period_end);
CREATE INDEX idx_evidence_framework ON compliance_evidence(framework, control_id);
```

## Integrações de Compliance

### SIEM Integration

```typescript
// Formato CEF para SIEM
function formatToCEF(event: AuditEvent): string {
  return [
    'CEF:0',
    'TrustLayer',
    'SecurityGovPlatform',
    '1.0',
    event.event_type,
    event.event_type.replace('.', ' '),
    event.risk_score > 70 ? '10' : event.risk_score > 40 ? '5' : '1',
    `suser=${event.user_id}`,
    `src=${event.details?.ip_address}`,
    `outcome=${event.outcome}`,
    `msg=${JSON.stringify(event.details)}`
  ].join('|');
}
```

### GRC Tool Integration

```yaml
# Exportação para ferramentas GRC
grc_export:
  enabled: true
  format: "json"
  schedule: "0 0 * * *"  # Diário
  endpoint: "https://grc.company.com/api/import"
  auth:
    type: "api_key"
    header: "X-API-Key"
    key_env: "GRC_API_KEY"
  mappings:
    - source: "change_logs"
      target: "audit_events"
    - source: "compliance_evidence"
      target: "evidence_repository"
```

## Checklist de Auditoria

### Preparação para Auditoria

```markdown
## Checklist Pre-Auditoria

### Documentação
- [ ] Políticas de segurança atualizadas
- [ ] Procedimentos operacionais documentados
- [ ] Inventário de ativos atualizado
- [ ] Matriz de responsabilidades (RACI)
- [ ] Plano de resposta a incidentes

### Controles Técnicos
- [ ] Logs de auditoria dos últimos 12 meses
- [ ] Relatórios de vulnerabilidades
- [ ] Evidências de patches aplicados
- [ ] Configurações de firewall/WAF
- [ ] Certificados SSL válidos

### Acesso e Identidade
- [ ] Lista de usuários ativos
- [ ] Revisão de acessos privilegiados
- [ ] Relatório de adoção de MFA
- [ ] Log de alterações de permissões
- [ ] Processo de offboarding documentado

### Dados
- [ ] Inventário de dados pessoais
- [ ] Registros de consentimento
- [ ] Política de retenção aplicada
- [ ] Backups testados
- [ ] Criptografia verificada
```

### Scripts de Verificação

```bash
#!/bin/bash
# audit-check.sh

echo "=== TrustLayer Audit Compliance Check ==="

# 1. Verificar logs de auditoria
echo -n "Audit logs (last 365 days): "
psql -c "SELECT COUNT(*) FROM change_logs WHERE timestamp > NOW() - INTERVAL '365 days'" -t

# 2. Verificar MFA
echo -n "Users with MFA enabled: "
psql -c "SELECT COUNT(*) FROM profiles WHERE mfa_enabled = true" -t

# 3. Verificar usuários inativos
echo -n "Inactive users (90+ days): "
psql -c "SELECT COUNT(*) FROM profiles WHERE last_sign_in_at < NOW() - INTERVAL '90 days'" -t

# 4. Verificar backups
echo -n "Last backup: "
ls -la /backups/latest/

# 5. Verificar certificados
echo -n "SSL certificate expiry: "
echo | openssl s_client -servername trustlayer.exemplo.com -connect trustlayer.exemplo.com:443 2>/dev/null | \
  openssl x509 -noout -enddate

echo "=== Check Complete ==="
```

## Alertas de Compliance

### Configuração de Alertas

```yaml
# compliance-alerts.yaml
groups:
  - name: compliance
    rules:
      - alert: AuditLogGap
        expr: time() - max(audit_log_last_timestamp) > 3600
        for: 5m
        labels:
          severity: critical
          compliance: "SOC2-CC7.1"
        annotations:
          summary: "Gap in audit logging detected"

      - alert: MfaAdoptionLow
        expr: mfa_enabled_users / total_active_users < 0.9
        for: 24h
        labels:
          severity: warning
          compliance: "SOC2-CC6.1"
        annotations:
          summary: "MFA adoption below 90%"

      - alert: PrivilegedAccessUnreviewed
        expr: days_since_last_access_review > 90
        for: 1h
        labels:
          severity: warning
          compliance: "ISO27001-A.9.2"
        annotations:
          summary: "Privileged access review overdue"

      - alert: DataRetentionViolation
        expr: oldest_audit_log_days > 365
        for: 1h
        labels:
          severity: critical
          compliance: "LGPD-Art15"
        annotations:
          summary: "Data retention policy violated"
```

## Próximos Passos

1. [Data Retention](./data-retention.md)
2. [Backup e Restore](./backup-restore.md)
3. [Logging e Monitoramento](./logging-monitoring.md)

## Referências

- [SOC 2 Compliance](https://www.aicpa.org/soc)
- [ISO 27001:2022](https://www.iso.org/isoiec-27001-information-security.html)
- [LGPD](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [GDPR](https://gdpr.eu/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

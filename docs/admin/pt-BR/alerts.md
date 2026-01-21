# Alertas e Notificações - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a configuração de alertas e notificações para monitoramento proativo do TrustLayer.

## Categorias de Alertas

| Categoria | Severidade | Tempo de Resposta |
|-----------|------------|-------------------|
| Infraestrutura | Critical | 5 minutos |
| Segurança | Critical | Imediato |
| Performance | Warning | 15 minutos |
| Business | Info | 1 hora |
| Compliance | Warning | 24 horas |

## Prometheus Alertmanager

### Configuração

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.exemplo.com:587'
  smtp_from: 'alertmanager@trustlayer.exemplo.com'
  smtp_auth_username: 'alertmanager@trustlayer.exemplo.com'
  smtp_auth_password: '${SMTP_PASSWORD}'
  slack_api_url: '${SLACK_WEBHOOK_URL}'

route:
  group_by: ['alertname', 'severity', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default-receiver'
  routes:
    # Alertas críticos vão para pager
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true

    # Alertas de segurança vão para time de security
    - match:
        category: security
      receiver: 'security-team'

    # Alertas de compliance
    - match:
        category: compliance
      receiver: 'compliance-team'

receivers:
  - name: 'default-receiver'
    slack_configs:
      - channel: '#trustlayer-alerts'
        send_resolved: true
        title: '{{ .Status | toUpper }}: {{ .CommonLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        severity: critical
        description: '{{ .CommonLabels.alertname }}'
        details:
          severity: '{{ .CommonLabels.severity }}'
          service: '{{ .CommonLabels.service }}'

  - name: 'security-team'
    email_configs:
      - to: 'security@trustlayer.exemplo.com'
        send_resolved: true
    slack_configs:
      - channel: '#security-incidents'
        send_resolved: true

  - name: 'compliance-team'
    email_configs:
      - to: 'compliance@trustlayer.exemplo.com'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'service']
```

### Regras de Alerta

```yaml
# prometheus/rules/trustlayer-alerts.yml
groups:
  - name: infrastructure
    rules:
      - alert: ServiceDown
        expr: up{job=~"trustlayer.*"} == 0
        for: 1m
        labels:
          severity: critical
          category: infrastructure
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.instance }} has been down for more than 1 minute"

      - alert: HighCPUUsage
        expr: |
          100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
        for: 5m
        labels:
          severity: warning
          category: infrastructure
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value | printf \"%.1f\" }}%"

      - alert: HighMemoryUsage
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
        for: 5m
        labels:
          severity: warning
          category: infrastructure
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value | printf \"%.1f\" }}%"

      - alert: DiskSpaceLow
        expr: |
          (1 - (node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes)) * 100 > 85
        for: 10m
        labels:
          severity: warning
          category: infrastructure
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Disk {{ $labels.mountpoint }} is {{ $value | printf \"%.1f\" }}% full"

  - name: application
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
          / sum(rate(http_requests_total[5m])) by (service) > 0.05
        for: 5m
        labels:
          severity: critical
          category: application
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)) > 1
        for: 5m
        labels:
          severity: warning
          category: application
        annotations:
          summary: "High latency on {{ $labels.service }}"
          description: "P99 latency is {{ $value | humanizeDuration }}"

      - alert: HighRequestRate
        expr: |
          sum(rate(http_requests_total[5m])) by (service) > 1000
        for: 5m
        labels:
          severity: info
          category: application
        annotations:
          summary: "High request rate on {{ $labels.service }}"
          description: "Request rate is {{ $value | humanize }}/s"

  - name: database
    rules:
      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 180
        for: 5m
        labels:
          severity: warning
          category: database
        annotations:
          summary: "High database connections"
          description: "{{ $value }} active connections (max 200)"

      - alert: DatabaseReplicationLag
        expr: pg_replication_lag_seconds > 30
        for: 5m
        labels:
          severity: warning
          category: database
        annotations:
          summary: "Database replication lag"
          description: "Replication lag is {{ $value }}s"

      - alert: DatabaseDeadlocks
        expr: rate(pg_stat_database_deadlocks[5m]) > 0
        for: 5m
        labels:
          severity: warning
          category: database
        annotations:
          summary: "Database deadlocks detected"
          description: "Deadlock rate: {{ $value }}/s"

  - name: security
    rules:
      - alert: HighFailedLoginRate
        expr: |
          sum(rate(auth_login_failures_total[5m])) > 10
        for: 5m
        labels:
          severity: critical
          category: security
        annotations:
          summary: "High failed login rate"
          description: "{{ $value | humanize }} failed logins/s"

      - alert: SuspiciousActivity
        expr: |
          sum(increase(security_anomaly_detected_total[1h])) > 5
        for: 5m
        labels:
          severity: critical
          category: security
        annotations:
          summary: "Suspicious activity detected"
          description: "{{ $value }} anomalies in the last hour"

      - alert: SSLCertificateExpiring
        expr: |
          probe_ssl_earliest_cert_expiry - time() < 86400 * 30
        for: 1h
        labels:
          severity: warning
          category: security
        annotations:
          summary: "SSL certificate expiring soon"
          description: "Certificate for {{ $labels.instance }} expires in {{ $value | humanizeDuration }}"

  - name: compliance
    rules:
      - alert: AuditLogGap
        expr: |
          time() - max(audit_log_last_entry_timestamp) > 3600
        for: 5m
        labels:
          severity: critical
          category: compliance
        annotations:
          summary: "Gap in audit logging"
          description: "No audit logs for {{ $value | humanizeDuration }}"

      - alert: DataRetentionViolation
        expr: |
          audit_log_oldest_entry_days > 365
        for: 1h
        labels:
          severity: warning
          category: compliance
        annotations:
          summary: "Data retention policy violation"
          description: "Oldest log is {{ $value }} days old"

      - alert: MFAAdoptionLow
        expr: |
          mfa_enabled_users / total_active_users < 0.9
        for: 24h
        labels:
          severity: warning
          category: compliance
        annotations:
          summary: "MFA adoption below target"
          description: "Only {{ $value | humanizePercentage }} of users have MFA enabled"

  - name: business
    rules:
      - alert: LowAssessmentActivity
        expr: |
          sum(increase(assessment_completed_total[24h])) < 1
        for: 24h
        labels:
          severity: info
          category: business
        annotations:
          summary: "No assessments completed"
          description: "No assessments completed in the last 24 hours"

      - alert: UserInactivity
        expr: |
          count(time() - user_last_activity_timestamp > 86400 * 30) > 10
        for: 24h
        labels:
          severity: info
          category: business
        annotations:
          summary: "High number of inactive users"
          description: "{{ $value }} users inactive for more than 30 days"
```

## Canais de Notificação

### Slack

```yaml
# Configuração de Slack
slack_configs:
  - api_url: '${SLACK_WEBHOOK_URL}'
    channel: '#trustlayer-alerts'
    username: 'AlertManager'
    icon_emoji: ':warning:'
    send_resolved: true
    title: |
      {{ if eq .Status "firing" }}🔥{{ else }}✅{{ end }}
      [{{ .Status | toUpper }}] {{ .CommonLabels.alertname }}
    text: |
      *Severity:* {{ .CommonLabels.severity }}
      *Service:* {{ .CommonLabels.service }}
      {{ range .Alerts }}
      *Description:* {{ .Annotations.description }}
      *Started:* {{ .StartsAt.Format "2006-01-02 15:04:05" }}
      {{ if .EndsAt }}*Ended:* {{ .EndsAt.Format "2006-01-02 15:04:05" }}{{ end }}
      {{ end }}
    actions:
      - type: button
        text: 'View in Grafana'
        url: 'https://grafana.trustlayer.exemplo.com/d/overview'
      - type: button
        text: 'Runbook'
        url: '{{ .CommonAnnotations.runbook_url }}'
```

### PagerDuty

```yaml
pagerduty_configs:
  - service_key: '${PAGERDUTY_SERVICE_KEY}'
    severity: '{{ .CommonLabels.severity }}'
    description: '{{ .CommonLabels.alertname }}: {{ .CommonAnnotations.summary }}'
    client: 'TrustLayer Alertmanager'
    client_url: 'https://alertmanager.trustlayer.exemplo.com'
    details:
      severity: '{{ .CommonLabels.severity }}'
      service: '{{ .CommonLabels.service }}'
      description: '{{ .CommonAnnotations.description }}'
      runbook: '{{ .CommonAnnotations.runbook_url }}'
```

### Email

```yaml
email_configs:
  - to: 'alerts@trustlayer.exemplo.com'
    send_resolved: true
    headers:
      Subject: '[{{ .Status | toUpper }}] {{ .CommonLabels.alertname }}'
    html: |
      <h2>{{ if eq .Status "firing" }}🔥 FIRING{{ else }}✅ RESOLVED{{ end }}</h2>
      <p><strong>Alert:</strong> {{ .CommonLabels.alertname }}</p>
      <p><strong>Severity:</strong> {{ .CommonLabels.severity }}</p>
      <p><strong>Service:</strong> {{ .CommonLabels.service }}</p>
      <hr>
      {{ range .Alerts }}
      <p><strong>Description:</strong> {{ .Annotations.description }}</p>
      <p><strong>Started:</strong> {{ .StartsAt.Format "2006-01-02 15:04:05" }}</p>
      {{ end }}
```

### Microsoft Teams

```yaml
webhook_configs:
  - url: '${TEAMS_WEBHOOK_URL}'
    send_resolved: true
    http_config:
      bearer_token: '${TEAMS_BEARER_TOKEN}'
    # Formato adaptativo card
```

## Runbooks

### Estrutura de Runbook

```markdown
# Runbook: {{ .AlertName }}

## Descrição
{{ .Description }}

## Impacto
- [ ] Usuários afetados
- [ ] Funcionalidades afetadas
- [ ] SLA impactado

## Diagnóstico
1. Verificar logs: `kubectl logs -l app=trustlayer -n production`
2. Verificar métricas: [Link Grafana](https://grafana.trustlayer.exemplo.com)
3. Verificar status: `curl -s https://api.trustlayer.exemplo.com/health`

## Resolução
1. Passo 1
2. Passo 2
3. Passo 3

## Escalação
- Nível 1: SRE On-Call
- Nível 2: Engineering Lead
- Nível 3: CTO

## Contatos
- SRE: +55 11 99999-9999
- Engineering: engineering@trustlayer.exemplo.com
```

## Dashboards de Alertas

### Painel de Status

```json
{
  "dashboard": {
    "title": "TrustLayer - Alert Status",
    "panels": [
      {
        "title": "Active Alerts",
        "type": "alertlist",
        "options": {
          "alertInstanceLabelFilter": "",
          "alertName": "",
          "dashboardAlerts": false,
          "groupBy": ["alertname", "severity"],
          "groupMode": "default",
          "maxItems": 20,
          "sortOrder": 1,
          "stateFilter": {
            "error": true,
            "firing": true,
            "noData": true,
            "normal": false,
            "pending": true
          }
        }
      },
      {
        "title": "Alert History",
        "type": "timeseries",
        "targets": [
          {
            "expr": "ALERTS{alertstate=\"firing\"}"
          }
        ]
      }
    ]
  }
}
```

## Testes de Alerta

### Script de Teste

```bash
#!/bin/bash
# test-alerts.sh

# Simular alerta crítico
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {
      "alertname": "TestAlert",
      "severity": "critical",
      "service": "trustlayer-api"
    },
    "annotations": {
      "summary": "Test alert",
      "description": "This is a test alert"
    },
    "startsAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "generatorURL": "http://localhost:9090"
  }]'

echo "Alert sent. Check your notification channels."
```

## Próximos Passos

1. [Logging e Monitoramento](./logging-monitoring.md)
2. [Troubleshooting](./troubleshooting.md)
3. [Disaster Recovery](./disaster-recovery.md)

## Referências

- [Prometheus Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/)
- [PagerDuty Integration](https://www.pagerduty.com/docs/guides/prometheus-integration-guide/)

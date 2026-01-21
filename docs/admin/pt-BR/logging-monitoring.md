# Logging & Monitoring - TrustLayer Admin Guide

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a configuração e uso dos sistemas de logging e monitoramento do TrustLayer.

## Arquitetura de Observabilidade

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OBSERVABILITY STACK                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │    Logs      │  │   Metrics    │  │   Traces     │              │
│  │   (Loki)     │  │ (Prometheus) │  │   (Tempo)    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                       │
│         └─────────────────┼─────────────────┘                       │
│                           │                                         │
│                    ┌──────▼──────┐                                  │
│                    │   Grafana   │                                  │
│                    │ (Dashboard) │                                  │
│                    └─────────────┘                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Logs

### Tipos de Logs

| Tipo | Descrição | Retenção |
|------|-----------|----------|
| Application Logs | Logs da aplicação | 30 dias |
| Access Logs | Requisições HTTP | 90 dias |
| Audit Logs | Ações de usuários | 7 anos |
| Error Logs | Erros e exceções | 90 dias |
| Security Logs | Eventos de segurança | 1 ano |

### Acessar Logs

1. Vá em **Settings > Logs**
2. Selecione o tipo de log
3. Use filtros para refinar

### Filtros de Log

```
┌─────────────────────────────────────────────────┐
│ LOG VIEWER                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ Time Range: [Last 1 hour ▼]                    │
│                                                 │
│ Log Level:                                      │
│ ☑ ERROR  ☑ WARN  ☑ INFO  ☐ DEBUG              │
│                                                 │
│ Search: [_________________________] 🔍         │
│                                                 │
│ Service: [All ▼]                               │
│                                                 │
│ [Apply Filters]                                 │
│                                                 │
│ ─────────────────────────────────────────────  │
│ 2026-01-21 14:32:15 ERROR api-service          │
│ Failed to process request: timeout             │
│                                                 │
│ 2026-01-21 14:32:10 INFO api-service           │
│ Request completed: GET /api/assessments        │
│                                                 │
│ 2026-01-21 14:31:58 WARN auth-service          │
│ Rate limit approaching for IP 192.168.1.100    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Log Search Syntax

```bash
# Busca simples
error

# Busca por campo
level:error

# Busca por serviço
service:api-service AND level:error

# Busca por período
timestamp:[2026-01-21T00:00:00 TO 2026-01-21T23:59:59]

# Busca com regex
message:/failed.*timeout/

# Excluir resultados
NOT level:debug

# Combinações
(level:error OR level:warn) AND service:auth-service
```

### Exportar Logs

1. Aplique os filtros desejados
2. Clique **"Export"**
3. Selecione formato: JSON, CSV, ou raw
4. Download ou envio por email

## Métricas

### Dashboards Disponíveis

| Dashboard | Descrição | Acesso |
|-----------|-----------|--------|
| Overview | Visão geral do sistema | /grafana/d/overview |
| API Performance | Latência e throughput | /grafana/d/api |
| Database | Métricas PostgreSQL | /grafana/d/database |
| Authentication | Login e sessões | /grafana/d/auth |
| Error Tracking | Erros por serviço | /grafana/d/errors |

### Métricas Principais

#### Application Metrics

```
# Requisições por segundo
rate(http_requests_total[5m])

# Latência p95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Taxa de erros
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Usuários ativos
count(increase(user_activity_total[5m]) > 0)
```

#### Infrastructure Metrics

```
# CPU Usage
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory Usage
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100

# Disk Usage
(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100
```

### Custom Dashboards

Crie dashboards personalizados:

1. Acesse Grafana: **Settings > Monitoring > Grafana**
2. Clique **"New Dashboard"**
3. Adicione painéis com métricas desejadas
4. Salve o dashboard

## Alertas

### Configurar Alertas

Acesse **Settings > Monitoring > Alerts**:

```
┌─────────────────────────────────────────────────┐
│ ALERT RULES                                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ Name: High Error Rate                     │  │
│ │ Condition: error_rate > 5%                │  │
│ │ Duration: 5 minutes                       │  │
│ │ Severity: Critical                        │  │
│ │ Notify: #ops-alerts, oncall@company.com  │  │
│ │ Status: ✅ Active                         │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ Name: High Latency                        │  │
│ │ Condition: p95_latency > 2s               │  │
│ │ Duration: 10 minutes                      │  │
│ │ Severity: Warning                         │  │
│ │ Notify: #ops-alerts                       │  │
│ │ Status: ✅ Active                         │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ [+ Create Alert Rule]                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Canais de Notificação

Configure em **Alerts > Notification Channels**:

| Canal | Configuração |
|-------|--------------|
| Email | SMTP ou provider configurado |
| Slack | Webhook URL |
| PagerDuty | Integration key |
| Webhook | URL customizada |
| Microsoft Teams | Connector URL |

### Alertas Recomendados

| Alerta | Condição | Severidade |
|--------|----------|------------|
| High Error Rate | error_rate > 5% for 5min | Critical |
| High Latency | p95 > 2s for 10min | Warning |
| Database Connection Pool | available < 10% for 5min | Critical |
| Disk Space Low | usage > 85% | Warning |
| Memory High | usage > 90% for 10min | Critical |
| Certificate Expiring | expires in < 30 days | Warning |
| Failed Logins Spike | > 10 in 5min from same IP | Critical |

## Distributed Tracing

### Configuração

O TrustLayer usa OpenTelemetry para tracing distribuído:

```yaml
# Configuração automática via variáveis de ambiente
OTEL_EXPORTER_OTLP_ENDPOINT=https://tempo.trustlayer.com:4317
OTEL_SERVICE_NAME=trustlayer-api
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
```

### Visualizar Traces

1. Acesse Grafana: **Explore > Tempo**
2. Busque por:
   - Trace ID
   - Service name
   - Operation name
   - Duration
   - Error status

### Exemplo de Trace

```
Trace ID: abc123def456

┌─ api-gateway (12ms) ─────────────────────────────┐
│                                                   │
│  ┌─ auth-service (5ms) ──────────────────────┐  │
│  │  Validate JWT token                        │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ api-service (45ms) ──────────────────────┐  │
│  │                                            │  │
│  │  ┌─ database (30ms) ─────────────────┐   │  │
│  │  │  SELECT * FROM assessments        │   │  │
│  │  └───────────────────────────────────┘   │  │
│  │                                            │  │
│  │  ┌─ cache (2ms) ─────────────────────┐   │  │
│  │  │  GET assessment:123               │   │  │
│  │  └───────────────────────────────────┘   │  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
Total: 62ms
```

## Health Checks

### Endpoints de Health

| Endpoint | Descrição |
|----------|-----------|
| `/health` | Health check básico |
| `/health/live` | Liveness probe (K8s) |
| `/health/ready` | Readiness probe (K8s) |
| `/health/detailed` | Status detalhado (autenticado) |

### Health Check Detalhado

```json
GET /health/detailed

{
  "status": "healthy",
  "timestamp": "2026-01-21T14:32:15Z",
  "version": "2.5.0",
  "components": {
    "database": {
      "status": "healthy",
      "latency_ms": 5
    },
    "cache": {
      "status": "healthy",
      "latency_ms": 1
    },
    "storage": {
      "status": "healthy",
      "latency_ms": 12
    },
    "email": {
      "status": "healthy",
      "provider": "resend"
    }
  }
}
```

## Integrações SIEM

### Splunk

```yaml
# splunk-forwarder.yaml
outputs:
  - type: splunk_hec
    endpoint: https://splunk.company.com:8088
    token: ${SPLUNK_HEC_TOKEN}
    index: trustlayer
    sourcetype: trustlayer:logs
```

### Elastic Stack

```yaml
# filebeat.yaml
output.elasticsearch:
  hosts: ["https://elasticsearch.company.com:9200"]
  index: "trustlayer-logs-%{+yyyy.MM.dd}"
  username: ${ELASTIC_USER}
  password: ${ELASTIC_PASSWORD}
```

### Datadog

```yaml
# Configuração via variáveis de ambiente
DD_API_KEY=${DATADOG_API_KEY}
DD_SITE=datadoghq.com
DD_SERVICE=trustlayer
DD_ENV=production
DD_LOGS_ENABLED=true
DD_APM_ENABLED=true
```

## Troubleshooting

### Logs não Aparecem

1. Verificar configuração de log level
2. Verificar conectividade com serviço de logs
3. Verificar permissões de escrita
4. Verificar retenção (logs antigos são purgados)

### Métricas Faltando

1. Verificar se scraping está configurado
2. Verificar endpoints de métricas
3. Verificar labels e filtros
4. Verificar intervalo de scraping

### Alertas não Disparam

1. Verificar condição do alerta
2. Verificar canal de notificação
3. Verificar silenciamentos ativos
4. Verificar período de avaliação

## Performance Tuning

### Log Sampling

Para alto volume de logs:

```yaml
# Configurar sampling para logs de debug
sampling:
  rules:
    - level: debug
      rate: 0.01  # 1% dos logs debug
    - level: info
      rate: 0.1   # 10% dos logs info
    - level: warn
      rate: 1.0   # 100% dos logs warn/error
    - level: error
      rate: 1.0
```

### Retenção Otimizada

```yaml
retention:
  application_logs: 30d
  access_logs: 90d
  audit_logs: 7y
  metrics: 90d
  traces: 7d
```

## Referências

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Security Configuration](./security.md)

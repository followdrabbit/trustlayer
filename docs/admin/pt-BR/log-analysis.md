# Análise de Logs - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre técnicas de análise de logs para troubleshooting e monitoramento do TrustLayer.

## Estrutura de Logs

### Formato JSON (Padrão)

```json
{
  "timestamp": "2026-01-21T10:30:00.000Z",
  "level": "info",
  "service": "trustlayer-api",
  "request_id": "req-uuid-123",
  "user_id": "user-uuid-456",
  "message": "Assessment submitted",
  "context": {
    "assessment_id": "assess-uuid-789",
    "domain": "AI Security",
    "score": 72.5
  },
  "duration_ms": 245
}
```

### Níveis de Log

| Nível | Uso | Exemplos |
|-------|-----|----------|
| `debug` | Desenvolvimento | Valores de variáveis, fluxo de execução |
| `info` | Operacional | Ações de usuário, métricas |
| `warn` | Atenção | Retries, degradação |
| `error` | Falhas | Exceções, erros de validação |
| `fatal` | Crítico | Crash, perda de dados |

## Comandos Básicos

### Docker

```bash
# Logs em tempo real
docker logs -f trustlayer-api

# Últimas 100 linhas
docker logs --tail 100 trustlayer-api

# Logs com timestamp
docker logs -t trustlayer-api

# Filtrar por período
docker logs --since 2026-01-21T10:00:00 --until 2026-01-21T11:00:00 trustlayer-api

# Combinar com grep
docker logs trustlayer-api 2>&1 | grep -i error
```

### Kubernetes

```bash
# Logs de um pod
kubectl logs <pod-name> -n trustlayer

# Logs em tempo real
kubectl logs -f <pod-name> -n trustlayer

# Logs de todos os pods de um deployment
kubectl logs -l app=trustlayer-api -n trustlayer

# Logs do container anterior (após restart)
kubectl logs <pod-name> --previous

# Logs com timestamps
kubectl logs <pod-name> --timestamps
```

### PostgreSQL

```sql
-- Logs de queries lentas
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Últimas conexões
SELECT usename, application_name, client_addr, state, query_start, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start DESC;
```

## Análise com jq

### Filtros Básicos

```bash
# Filtrar por nível
cat logs.json | jq 'select(.level == "error")'

# Filtrar por serviço
cat logs.json | jq 'select(.service == "trustlayer-api")'

# Filtrar por período
cat logs.json | jq 'select(.timestamp > "2026-01-21T10:00:00")'

# Combinar filtros
cat logs.json | jq 'select(.level == "error" and .service == "trustlayer-api")'
```

### Agregações

```bash
# Contar por nível
cat logs.json | jq -s 'group_by(.level) | map({level: .[0].level, count: length})'

# Contar por serviço e nível
cat logs.json | jq -s 'group_by(.service, .level) | map({service: .[0].service, level: .[0].level, count: length})'

# Top usuários com erros
cat logs.json | jq -s '[.[] | select(.level == "error")] | group_by(.user_id) | map({user: .[0].user_id, errors: length}) | sort_by(-.errors) | .[0:10]'

# Latência média por endpoint
cat logs.json | jq -s 'group_by(.context.endpoint) | map({endpoint: .[0].context.endpoint, avg_ms: ([.[].duration_ms] | add / length)})'
```

### Extração de Dados

```bash
# Extrair apenas mensagens de erro
cat logs.json | jq -r 'select(.level == "error") | .message'

# Extrair request IDs únicos
cat logs.json | jq -r '.request_id' | sort -u

# Criar CSV de erros
cat logs.json | jq -r 'select(.level == "error") | [.timestamp, .service, .message] | @csv'
```

## Análise com Loki (LogQL)

### Queries Básicas

```logql
# Todos os logs de um serviço
{service="trustlayer-api"}

# Filtrar por nível
{service="trustlayer-api"} |= "error"

# Regex
{service="trustlayer-api"} |~ "user_id.*uuid-123"

# JSON parsing
{service="trustlayer-api"} | json | level="error"
```

### Agregações

```logql
# Taxa de erros por minuto
sum(rate({service="trustlayer-api"} |= "error" [1m])) by (service)

# Top 10 mensagens de erro
topk(10, sum by (message) (count_over_time({service="trustlayer-api"} | json | level="error" [1h])))

# Latência P99
quantile_over_time(0.99, {service="trustlayer-api"} | json | unwrap duration_ms [5m]) by (endpoint)
```

### Alertas

```logql
# Alerta se mais de 10 erros/minuto
sum(rate({service="trustlayer-api"} |= "error" [1m])) > 10

# Alerta se latência P99 > 1s
quantile_over_time(0.99, {service="trustlayer-api"} | json | unwrap duration_ms [5m]) > 1000
```

## Análise com Elasticsearch

### Queries

```json
// Buscar erros
GET trustlayer-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "level": "error" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  },
  "sort": [{ "@timestamp": "desc" }],
  "size": 100
}

// Agregação por serviço
GET trustlayer-*/_search
{
  "size": 0,
  "query": { "range": { "@timestamp": { "gte": "now-24h" } } },
  "aggs": {
    "by_service": {
      "terms": { "field": "service.keyword" },
      "aggs": {
        "by_level": {
          "terms": { "field": "level.keyword" }
        }
      }
    }
  }
}

// Percentis de latência
GET trustlayer-*/_search
{
  "size": 0,
  "aggs": {
    "latency_percentiles": {
      "percentiles": {
        "field": "duration_ms",
        "percents": [50, 90, 95, 99]
      }
    }
  }
}
```

## Patterns de Análise

### Investigação de Incidente

```bash
#!/bin/bash
# incident-analysis.sh

INCIDENT_TIME="2026-01-21T10:30:00"
WINDOW="30m"

echo "=== Análise de Incidente ==="
echo "Horário: $INCIDENT_TIME"
echo "Janela: $WINDOW"

# 1. Identificar serviços afetados
echo -e "\n=== Serviços com Erros ==="
kubectl logs -l app=trustlayer --since="$WINDOW" --all-containers=true | \
  jq -s 'group_by(.service) | map({service: .[0].service, errors: [.[] | select(.level == "error")] | length})' 2>/dev/null

# 2. Top erros
echo -e "\n=== Top Erros ==="
kubectl logs -l app=trustlayer --since="$WINDOW" --all-containers=true | \
  jq -s '[.[] | select(.level == "error")] | group_by(.message) | map({message: .[0].message, count: length}) | sort_by(-.count) | .[0:5]' 2>/dev/null

# 3. Usuários afetados
echo -e "\n=== Usuários Afetados ==="
kubectl logs -l app=trustlayer --since="$WINDOW" --all-containers=true | \
  jq -sr '[.[] | select(.level == "error") | .user_id] | unique | length' 2>/dev/null

# 4. Timeline
echo -e "\n=== Timeline de Erros ==="
kubectl logs -l app=trustlayer --since="$WINDOW" --all-containers=true | \
  jq -s '[.[] | select(.level == "error")] | group_by(.timestamp[0:16]) | map({time: .[0].timestamp[0:16], count: length})' 2>/dev/null
```

### Análise de Performance

```bash
#!/bin/bash
# performance-analysis.sh

echo "=== Análise de Performance ==="

# Latência por endpoint
echo -e "\n=== Latência por Endpoint ==="
kubectl logs -l app=trustlayer-api --since=1h | \
  jq -s 'group_by(.context.endpoint) | map({
    endpoint: .[0].context.endpoint,
    count: length,
    avg_ms: ([.[].duration_ms] | add / length | floor),
    p99_ms: ([.[].duration_ms] | sort | .[length * 99 / 100 | floor])
  }) | sort_by(-.avg_ms)'

# Requests lentos (>1s)
echo -e "\n=== Requests Lentos ==="
kubectl logs -l app=trustlayer-api --since=1h | \
  jq 'select(.duration_ms > 1000) | {timestamp, endpoint: .context.endpoint, duration_ms, user_id}'
```

### Análise de Segurança

```bash
#!/bin/bash
# security-analysis.sh

echo "=== Análise de Segurança ==="

# Falhas de autenticação
echo -e "\n=== Falhas de Login ==="
kubectl logs -l app=trustlayer-auth --since=24h | \
  jq -s '[.[] | select(.message | contains("login failed"))] | group_by(.context.ip) | map({ip: .[0].context.ip, attempts: length}) | sort_by(-.attempts) | .[0:10]'

# Acessos suspeitos
echo -e "\n=== IPs com Múltiplas Contas ==="
kubectl logs -l app=trustlayer-api --since=24h | \
  jq -s 'group_by(.context.ip) | map({ip: .[0].context.ip, users: ([.[].user_id] | unique | length)}) | map(select(.users > 3))'

# Alterações de permissão
echo -e "\n=== Alterações de Role ==="
kubectl logs -l app=trustlayer-api --since=7d | \
  jq 'select(.message | contains("role changed")) | {timestamp, user_id, message}'
```

## Dashboards de Logs

### Grafana + Loki

```json
{
  "dashboard": {
    "title": "TrustLayer Logs",
    "panels": [
      {
        "title": "Log Volume",
        "type": "timeseries",
        "targets": [{
          "expr": "sum(rate({app=\"trustlayer\"} [5m])) by (level)"
        }]
      },
      {
        "title": "Error Logs",
        "type": "logs",
        "targets": [{
          "expr": "{app=\"trustlayer\"} |= \"error\""
        }]
      },
      {
        "title": "Top Errors",
        "type": "table",
        "targets": [{
          "expr": "topk(10, sum by (message) (count_over_time({app=\"trustlayer\"} | json | level=\"error\" [1h])))"
        }]
      }
    ]
  }
}
```

## Próximos Passos

1. [Performance Tuning](./performance-tuning.md)
2. [Troubleshooting](./troubleshooting.md)
3. [Alertas](./alerts.md)

## Referências

- [jq Manual](https://stedolan.github.io/jq/manual/)
- [LogQL Documentation](https://grafana.com/docs/loki/latest/logql/)
- [Elasticsearch Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)

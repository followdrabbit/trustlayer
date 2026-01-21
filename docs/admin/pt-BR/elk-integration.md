# Integração com ELK Stack - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a integração do TrustLayer com Elasticsearch, Logstash e Kibana (ELK Stack) para centralização e análise de logs.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TrustLayer Application                          │
│  ┌─────────────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │      Frontend       │    │   Edge Functions │    │   Database    │  │
│  │    (Filebeat)       │    │   (Filebeat)     │    │  (Filebeat)   │  │
│  └──────────┬──────────┘    └────────┬─────────┘    └───────┬───────┘  │
└─────────────┼──────────────────────────┼────────────────────┼───────────┘
              │                          │                    │
              └──────────────────┬───────┴────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │       Logstash         │
                    │   - Parse logs         │
                    │   - Enrich data        │
                    │   - Transform          │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │     Elasticsearch      │
                    │   - Index logs         │
                    │   - Full-text search   │
                    │   - Analytics          │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │        Kibana          │
                    │   - Visualization      │
                    │   - Dashboards         │
                    │   - Alerting           │
                    └────────────────────────┘
```

## Instalação

### Docker Compose

```yaml
# docker-compose.elk.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.1
    container_name: trustlayer-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=${ELASTIC_PASSWORD}
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    networks:
      - elk
    healthcheck:
      test: ["CMD-SHELL", "curl -s -u elastic:${ELASTIC_PASSWORD} http://localhost:9200/_cluster/health | grep -vq '\"status\":\"red\"'"]
      interval: 30s
      timeout: 10s
      retries: 5

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.1
    container_name: trustlayer-logstash
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline:ro
      - ./logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml:ro
    ports:
      - "5044:5044"   # Beats input
      - "5000:5000"   # TCP input
      - "9600:9600"   # Monitoring API
    environment:
      - ELASTIC_PASSWORD=${ELASTIC_PASSWORD}
    networks:
      - elk
    depends_on:
      elasticsearch:
        condition: service_healthy

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.1
    container_name: trustlayer-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=kibana_system
      - ELASTICSEARCH_PASSWORD=${KIBANA_PASSWORD}
      - SERVER_NAME=kibana.trustlayer.exemplo.com
    ports:
      - "5601:5601"
    networks:
      - elk
    depends_on:
      elasticsearch:
        condition: service_healthy

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.1
    container_name: trustlayer-filebeat
    user: root
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/log/trustlayer:/var/log/trustlayer:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - ELASTIC_PASSWORD=${ELASTIC_PASSWORD}
    networks:
      - elk
    depends_on:
      - logstash

volumes:
  elasticsearch-data:

networks:
  elk:
    driver: bridge
```

## Configuração do Filebeat

```yaml
# filebeat/filebeat.yml
filebeat.inputs:
  # Logs da aplicação
  - type: log
    enabled: true
    paths:
      - /var/log/trustlayer/*.log
    json.keys_under_root: true
    json.add_error_key: true
    fields:
      service: trustlayer
      environment: production
    fields_under_root: true

  # Logs de container Docker
  - type: container
    enabled: true
    paths:
      - /var/lib/docker/containers/*/*.log
    processors:
      - add_docker_metadata:
          host: "unix:///var/run/docker.sock"
      - decode_json_fields:
          fields: ["message"]
          target: ""
          overwrite_keys: true

  # Logs de auditoria
  - type: log
    enabled: true
    paths:
      - /var/log/trustlayer/audit/*.log
    json.keys_under_root: true
    fields:
      log_type: audit
    fields_under_root: true

# Processors globais
processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_cloud_metadata: ~
  - add_kubernetes_metadata: ~

# Output para Logstash
output.logstash:
  hosts: ["logstash:5044"]
  ssl.enabled: false

# Monitoramento
monitoring:
  enabled: true
  elasticsearch:
    hosts: ["http://elasticsearch:9200"]
    username: beats_system
    password: ${BEATS_PASSWORD}

# Logging do Filebeat
logging:
  level: info
  to_files: true
  files:
    path: /var/log/filebeat
    name: filebeat
    keepfiles: 7
    permissions: 0644
```

## Configuração do Logstash

### Pipeline Principal

```ruby
# logstash/pipeline/trustlayer.conf

input {
  beats {
    port => 5044
    ssl => false
  }

  tcp {
    port => 5000
    codec => json_lines
  }
}

filter {
  # Parse JSON se necessário
  if [message] =~ /^\{/ {
    json {
      source => "message"
      target => "parsed"
    }

    if "_jsonparsefailure" not in [tags] {
      mutate {
        remove_field => ["message"]
        rename => { "[parsed]" => "data" }
      }
    }
  }

  # Enriquecimento com GeoIP
  if [data][ip_address] {
    geoip {
      source => "[data][ip_address]"
      target => "geo"
      add_field => { "[geo][location]" => "%{[geo][latitude]},%{[geo][longitude]}" }
    }
  }

  # Parse de user agent
  if [data][user_agent] {
    useragent {
      source => "[data][user_agent]"
      target => "user_agent_parsed"
    }
  }

  # Classificação de severidade
  if [data][level] {
    mutate {
      add_field => {
        "severity" => "%{[data][level]}"
      }
    }

    if [severity] == "error" or [severity] == "fatal" {
      mutate { add_tag => ["alert"] }
    }
  }

  # Normalização de timestamps
  date {
    match => ["[data][timestamp]", "ISO8601", "yyyy-MM-dd'T'HH:mm:ss.SSSZ"]
    target => "@timestamp"
  }

  # Adicionar metadados
  mutate {
    add_field => {
      "[@metadata][index_prefix]" => "trustlayer"
      "[@metadata][index_type]" => "%{[log_type]}"
    }
  }

  # Índice específico para audit logs
  if [log_type] == "audit" {
    mutate {
      replace => { "[@metadata][index_prefix]" => "trustlayer-audit" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    user => "elastic"
    password => "${ELASTIC_PASSWORD}"
    index => "%{[@metadata][index_prefix]}-%{+YYYY.MM.dd}"
    template_name => "trustlayer"
    template => "/usr/share/logstash/templates/trustlayer.json"
    template_overwrite => true
  }

  # Debug output (desabilitar em produção)
  # stdout { codec => rubydebug }
}
```

### Template de Índice

```json
{
  "index_patterns": ["trustlayer-*"],
  "template": {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1,
      "index.lifecycle.name": "trustlayer-policy",
      "index.lifecycle.rollover_alias": "trustlayer"
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "service": { "type": "keyword" },
        "environment": { "type": "keyword" },
        "log_type": { "type": "keyword" },
        "severity": { "type": "keyword" },
        "data": {
          "properties": {
            "event_type": { "type": "keyword" },
            "user_id": { "type": "keyword" },
            "organization_id": { "type": "keyword" },
            "ip_address": { "type": "ip" },
            "user_agent": { "type": "text" },
            "request_id": { "type": "keyword" },
            "duration_ms": { "type": "float" },
            "status_code": { "type": "integer" },
            "message": { "type": "text" }
          }
        },
        "geo": {
          "properties": {
            "city_name": { "type": "keyword" },
            "country_name": { "type": "keyword" },
            "country_iso_code": { "type": "keyword" },
            "location": { "type": "geo_point" }
          }
        },
        "user_agent_parsed": {
          "properties": {
            "name": { "type": "keyword" },
            "os": { "type": "keyword" },
            "device": { "type": "keyword" }
          }
        }
      }
    }
  }
}
```

## Index Lifecycle Management

```json
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_size": "50gb"
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "forcemerge": {
            "max_num_segments": 1
          },
          "shrink": {
            "number_of_shards": 1
          },
          "set_priority": {
            "priority": 50
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "set_priority": {
            "priority": 0
          }
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

## Dashboards Kibana

### Importar via API

```bash
# Exportar dashboard existente
curl -X GET "localhost:5601/api/kibana/dashboards/export?dashboard=<dashboard-id>" \
  -H "kbn-xsrf: true" \
  -u elastic:${ELASTIC_PASSWORD} > dashboard.ndjson

# Importar dashboard
curl -X POST "localhost:5601/api/kibana/dashboards/import" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -u elastic:${ELASTIC_PASSWORD} \
  --data-binary @dashboard.ndjson
```

### Dashboard de Overview

```json
{
  "attributes": {
    "title": "TrustLayer Overview",
    "panelsJSON": [
      {
        "type": "lens",
        "title": "Requests Over Time",
        "gridData": { "x": 0, "y": 0, "w": 24, "h": 8 }
      },
      {
        "type": "lens",
        "title": "Error Rate",
        "gridData": { "x": 24, "y": 0, "w": 12, "h": 8 }
      },
      {
        "type": "lens",
        "title": "Top Users",
        "gridData": { "x": 36, "y": 0, "w": 12, "h": 8 }
      },
      {
        "type": "map",
        "title": "Geographic Distribution",
        "gridData": { "x": 0, "y": 8, "w": 24, "h": 12 }
      },
      {
        "type": "lens",
        "title": "Events by Type",
        "gridData": { "x": 24, "y": 8, "w": 24, "h": 12 }
      }
    ]
  }
}
```

## Alerting

### Watcher (Elastic)

```json
{
  "trigger": {
    "schedule": {
      "interval": "5m"
    }
  },
  "input": {
    "search": {
      "request": {
        "indices": ["trustlayer-*"],
        "body": {
          "query": {
            "bool": {
              "must": [
                { "term": { "severity": "error" } },
                { "range": { "@timestamp": { "gte": "now-5m" } } }
              ]
            }
          }
        }
      }
    }
  },
  "condition": {
    "compare": {
      "ctx.payload.hits.total.value": {
        "gt": 10
      }
    }
  },
  "actions": {
    "notify_slack": {
      "slack": {
        "message": {
          "to": ["#trustlayer-alerts"],
          "text": "High error rate detected: {{ctx.payload.hits.total.value}} errors in last 5 minutes"
        }
      }
    },
    "send_email": {
      "email": {
        "to": ["alerts@trustlayer.exemplo.com"],
        "subject": "TrustLayer Alert: High Error Rate",
        "body": {
          "text": "{{ctx.payload.hits.total.value}} errors detected in the last 5 minutes."
        }
      }
    }
  }
}
```

## Segurança

### Roles e Usuários

```bash
# Criar role para desenvolvedores
curl -X POST "localhost:9200/_security/role/trustlayer_developer" \
  -H "Content-Type: application/json" \
  -u elastic:${ELASTIC_PASSWORD} \
  -d '{
    "indices": [
      {
        "names": ["trustlayer-*"],
        "privileges": ["read", "view_index_metadata"]
      }
    ],
    "applications": [
      {
        "application": "kibana-.kibana",
        "privileges": ["read"],
        "resources": ["*"]
      }
    ]
  }'

# Criar role para auditores
curl -X POST "localhost:9200/_security/role/trustlayer_auditor" \
  -H "Content-Type: application/json" \
  -u elastic:${ELASTIC_PASSWORD} \
  -d '{
    "indices": [
      {
        "names": ["trustlayer-audit-*"],
        "privileges": ["read"]
      }
    ]
  }'
```

## Próximos Passos

1. [OpenTelemetry Setup](./opentelemetry.md)
2. [Grafana Integration](./grafana-integration.md)
3. [Alertas](./alerts.md)

## Referências

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Logstash Documentation](https://www.elastic.co/guide/en/logstash/current/index.html)
- [Kibana Documentation](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Filebeat Documentation](https://www.elastic.co/guide/en/beats/filebeat/current/index.html)

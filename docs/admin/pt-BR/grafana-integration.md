# Integração com Grafana - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a integração do TrustLayer com Grafana para visualização de métricas, logs e traces.

## Instalação

### Docker Compose

```yaml
# docker-compose.grafana.yml
version: '3.8'

services:
  grafana:
    image: grafana/grafana:10.2.2
    container_name: trustlayer-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=https://grafana.trustlayer.exemplo.com
      - GF_SMTP_ENABLED=true
      - GF_SMTP_HOST=${SMTP_HOST}:${SMTP_PORT}
      - GF_SMTP_USER=${SMTP_USER}
      - GF_SMTP_PASSWORD=${SMTP_PASS}
      - GF_SMTP_FROM_ADDRESS=grafana@trustlayer.exemplo.com
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    ports:
      - "3001:3000"
    networks:
      - monitoring

volumes:
  grafana-data:

networks:
  monitoring:
    external: true
```

### Kubernetes

```yaml
# grafana-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:10.2.2
          ports:
            - containerPort: 3000
          env:
            - name: GF_SECURITY_ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: grafana-secrets
                  key: admin-password
          volumeMounts:
            - name: grafana-storage
              mountPath: /var/lib/grafana
            - name: grafana-provisioning
              mountPath: /etc/grafana/provisioning
          resources:
            limits:
              memory: "1Gi"
              cpu: "500m"
      volumes:
        - name: grafana-storage
          persistentVolumeClaim:
            claimName: grafana-pvc
        - name: grafana-provisioning
          configMap:
            name: grafana-provisioning
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
spec:
  ports:
    - port: 3000
      targetPort: 3000
  selector:
    app: grafana
```

## Datasources

### Provisioning

```yaml
# grafana/provisioning/datasources/datasources.yml
apiVersion: 1

datasources:
  # Prometheus para métricas
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
    jsonData:
      httpMethod: POST
      manageAlerts: true
      prometheusType: Prometheus
      exemplarTraceIdDestinations:
        - name: traceID
          datasourceUid: tempo

  # Loki para logs
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: false
    jsonData:
      maxLines: 1000
      derivedFields:
        - name: TraceID
          matcherRegex: 'traceId=(\w+)'
          url: '$${__value.raw}'
          datasourceUid: tempo

  # Tempo para traces
  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    editable: false
    jsonData:
      httpMethod: GET
      tracesToLogs:
        datasourceUid: loki
        tags: ['service.name']
        mappedTags:
          - key: service.name
            value: service_name
        mapTagNamesEnabled: true
        spanStartTimeShift: '-1h'
        spanEndTimeShift: '1h'
        filterByTraceID: true
      tracesToMetrics:
        datasourceUid: prometheus
        tags:
          - key: service.name
            value: service
        queries:
          - name: 'Request Rate'
            query: 'sum(rate(http_requests_total{$$__tags}[5m]))'
          - name: 'Error Rate'
            query: 'sum(rate(http_errors_total{$$__tags}[5m]))'
      serviceMap:
        datasourceUid: prometheus
      nodeGraph:
        enabled: true
      lokiSearch:
        datasourceUid: loki

  # PostgreSQL para queries diretas
  - name: TrustLayer-DB
    type: postgres
    url: ${DB_HOST}:${DB_PORT}
    database: trustlayer
    user: ${DB_USER}
    secureJsonData:
      password: ${DB_PASSWORD}
    jsonData:
      sslmode: require
      maxOpenConns: 5
      maxIdleConns: 2
      connMaxLifetime: 14400
```

## Dashboards

### Dashboard Provisioning

```yaml
# grafana/provisioning/dashboards/dashboards.yml
apiVersion: 1

providers:
  - name: 'TrustLayer Dashboards'
    orgId: 1
    folder: 'TrustLayer'
    folderUid: 'trustlayer'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
```

### Overview Dashboard

```json
{
  "dashboard": {
    "id": null,
    "uid": "trustlayer-overview",
    "title": "TrustLayer - Overview",
    "tags": ["trustlayer"],
    "timezone": "browser",
    "refresh": "30s",
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "Active Users",
        "type": "stat",
        "gridPos": { "x": 0, "y": 0, "w": 4, "h": 4 },
        "targets": [
          {
            "datasource": "Prometheus",
            "expr": "count(rate(http_requests_total{service=\"trustlayer-frontend\"}[5m]) > 0)",
            "legendFormat": "Users"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": { "mode": "thresholds" },
            "thresholds": {
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 50 },
                { "color": "red", "value": 100 }
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Request Rate",
        "type": "timeseries",
        "gridPos": { "x": 4, "y": 0, "w": 10, "h": 8 },
        "targets": [
          {
            "datasource": "Prometheus",
            "expr": "sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "custom": {
              "drawStyle": "line",
              "lineWidth": 2,
              "fillOpacity": 10
            }
          }
        }
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "stat",
        "gridPos": { "x": 14, "y": 0, "w": 5, "h": 4 },
        "targets": [
          {
            "datasource": "Prometheus",
            "expr": "sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 1 },
                { "color": "red", "value": 5 }
              ]
            }
          }
        }
      },
      {
        "id": 4,
        "title": "Response Time (P99)",
        "type": "gauge",
        "gridPos": { "x": 19, "y": 0, "w": 5, "h": 4 },
        "targets": [
          {
            "datasource": "Prometheus",
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_ms_bucket[5m])) by (le))"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "ms",
            "thresholds": {
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 500 },
                { "color": "red", "value": 1000 }
              ]
            },
            "max": 2000
          }
        }
      },
      {
        "id": 5,
        "title": "Service Map",
        "type": "nodeGraph",
        "gridPos": { "x": 0, "y": 8, "w": 12, "h": 10 },
        "targets": [
          {
            "datasource": "Tempo",
            "queryType": "serviceMap"
          }
        ]
      },
      {
        "id": 6,
        "title": "Recent Errors",
        "type": "logs",
        "gridPos": { "x": 12, "y": 8, "w": 12, "h": 10 },
        "targets": [
          {
            "datasource": "Loki",
            "expr": "{service_name=~\"trustlayer.*\"} |= \"error\" | json"
          }
        ]
      },
      {
        "id": 7,
        "title": "Database Connections",
        "type": "timeseries",
        "gridPos": { "x": 0, "y": 18, "w": 8, "h": 6 },
        "targets": [
          {
            "datasource": "Prometheus",
            "expr": "pg_stat_activity_count{datname=\"trustlayer\"}",
            "legendFormat": "{{state}}"
          }
        ]
      },
      {
        "id": 8,
        "title": "Assessments Completed",
        "type": "stat",
        "gridPos": { "x": 8, "y": 18, "w": 4, "h": 6 },
        "targets": [
          {
            "datasource": "Prometheus",
            "expr": "sum(increase(assessment_completed_total[24h]))"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "displayName": "Last 24h"
          }
        }
      }
    ]
  }
}
```

### Business Metrics Dashboard

```json
{
  "dashboard": {
    "uid": "trustlayer-business",
    "title": "TrustLayer - Business Metrics",
    "panels": [
      {
        "title": "Assessments by Domain",
        "type": "piechart",
        "targets": [
          {
            "datasource": "TrustLayer-DB",
            "rawSql": "SELECT security_domain, COUNT(*) as count FROM answers GROUP BY security_domain",
            "format": "table"
          }
        ]
      },
      {
        "title": "Maturity Score Trend",
        "type": "timeseries",
        "targets": [
          {
            "datasource": "TrustLayer-DB",
            "rawSql": "SELECT snapshot_date as time, AVG(overall_score) as score FROM maturity_snapshots WHERE snapshot_date > NOW() - INTERVAL '90 days' GROUP BY snapshot_date ORDER BY snapshot_date",
            "format": "time_series"
          }
        ]
      },
      {
        "title": "Active Users by Role",
        "type": "bargauge",
        "targets": [
          {
            "datasource": "TrustLayer-DB",
            "rawSql": "SELECT role, COUNT(*) as count FROM profiles WHERE last_sign_in_at > NOW() - INTERVAL '30 days' GROUP BY role",
            "format": "table"
          }
        ]
      },
      {
        "title": "Top Gaps",
        "type": "table",
        "targets": [
          {
            "datasource": "TrustLayer-DB",
            "rawSql": "SELECT q.question_text, COUNT(*) as gap_count FROM answers a JOIN default_questions q ON a.question_id = q.id WHERE a.answer = 'Não' GROUP BY q.question_text ORDER BY gap_count DESC LIMIT 10",
            "format": "table"
          }
        ]
      }
    ]
  }
}
```

## Alerting

### Alert Rules

```yaml
# grafana/provisioning/alerting/rules.yml
apiVersion: 1

groups:
  - orgId: 1
    name: TrustLayer Alerts
    folder: TrustLayer
    interval: 1m
    rules:
      - uid: high-error-rate
        title: High Error Rate
        condition: C
        data:
          - refId: A
            datasourceUid: prometheus
            model:
              expr: sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100
          - refId: B
            datasourceUid: __expr__
            model:
              type: reduce
              expression: A
              reducer: last
          - refId: C
            datasourceUid: __expr__
            model:
              type: threshold
              expression: B
              conditions:
                - evaluator:
                    params: [5]
                    type: gt
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5%"

      - uid: high-latency
        title: High Latency
        condition: C
        data:
          - refId: A
            datasourceUid: prometheus
            model:
              expr: histogram_quantile(0.99, sum(rate(http_request_duration_ms_bucket[5m])) by (le))
          - refId: B
            datasourceUid: __expr__
            model:
              type: reduce
              expression: A
              reducer: last
          - refId: C
            datasourceUid: __expr__
            model:
              type: threshold
              expression: B
              conditions:
                - evaluator:
                    params: [1000]
                    type: gt
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P99 latency is above 1000ms"

      - uid: db-connections-high
        title: Database Connections High
        condition: C
        data:
          - refId: A
            datasourceUid: prometheus
            model:
              expr: pg_stat_activity_count{datname="trustlayer"}
          - refId: B
            datasourceUid: __expr__
            model:
              type: reduce
              expression: A
              reducer: last
          - refId: C
            datasourceUid: __expr__
            model:
              type: threshold
              expression: B
              conditions:
                - evaluator:
                    params: [180]
                    type: gt
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
```

### Contact Points

```yaml
# grafana/provisioning/alerting/contactpoints.yml
apiVersion: 1

contactPoints:
  - orgId: 1
    name: TrustLayer Team
    receivers:
      - uid: email-trustlayer
        type: email
        settings:
          addresses: "alerts@trustlayer.exemplo.com"
          singleEmail: true

      - uid: slack-trustlayer
        type: slack
        settings:
          url: "${SLACK_WEBHOOK_URL}"
          recipient: "#trustlayer-alerts"
          username: "Grafana"
          icon_emoji: ":warning:"
          text: |
            {{ range .Alerts }}
            *{{ .Labels.alertname }}*
            {{ .Annotations.description }}
            {{ end }}
```

## SSO Integration

### OAuth (Okta)

```ini
# grafana.ini
[auth.generic_oauth]
enabled = true
name = Okta
allow_sign_up = true
client_id = ${OKTA_CLIENT_ID}
client_secret = ${OKTA_CLIENT_SECRET}
scopes = openid profile email
auth_url = https://your-org.okta.com/oauth2/v1/authorize
token_url = https://your-org.okta.com/oauth2/v1/token
api_url = https://your-org.okta.com/oauth2/v1/userinfo
role_attribute_path = contains(groups[*], 'grafana-admins') && 'Admin' || contains(groups[*], 'grafana-editors') && 'Editor' || 'Viewer'
```

## Próximos Passos

1. [OpenTelemetry Setup](./opentelemetry.md)
2. [Alertas](./alerts.md)
3. [ELK Integration](./elk-integration.md)

## Referências

- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [Grafana Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/)

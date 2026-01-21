# OpenTelemetry Setup - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a configuração do OpenTelemetry para observabilidade completa (traces, metrics, logs) do TrustLayer.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TrustLayer Application                          │
│  ┌─────────────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │      Frontend       │    │   Edge Functions │    │   Database    │  │
│  │  (Browser SDK)      │    │   (Deno SDK)     │    │  (pg_stat)    │  │
│  └──────────┬──────────┘    └────────┬─────────┘    └───────┬───────┘  │
└─────────────┼──────────────────────────┼────────────────────┼───────────┘
              │                          │                    │
              └──────────────────┬───────┴────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   OpenTelemetry        │
                    │   Collector            │
                    │   - Receive            │
                    │   - Process            │
                    │   - Export             │
                    └───────────┬────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
     ┌────────────┐     ┌────────────┐     ┌────────────┐
     │   Tempo    │     │ Prometheus │     │   Loki     │
     │  (Traces)  │     │ (Metrics)  │     │  (Logs)    │
     └────────────┘     └────────────┘     └────────────┘
            │                   │                   │
            └───────────────────┼───────────────────┘
                                │
                                ▼
                        ┌────────────┐
                        │  Grafana   │
                        │ (Dashboard)│
                        └────────────┘
```

## Instalação do Collector

### Docker Compose

```yaml
# docker-compose.otel.yml
version: '3.8'

services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.91.0
    container_name: trustlayer-otel-collector
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml:ro
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8888:8888"   # Prometheus metrics (collector)
      - "8889:8889"   # Prometheus exporter
      - "13133:13133" # Health check
    environment:
      - TEMPO_ENDPOINT=tempo:4317
      - PROMETHEUS_ENDPOINT=prometheus:9090
      - LOKI_ENDPOINT=loki:3100
    depends_on:
      - tempo
      - prometheus
      - loki

  tempo:
    image: grafana/tempo:2.3.1
    container_name: trustlayer-tempo
    command: ["-config.file=/etc/tempo.yaml"]
    volumes:
      - ./tempo.yaml:/etc/tempo.yaml:ro
      - tempo-data:/var/tempo
    ports:
      - "3200:3200"   # Tempo API
      - "4317"        # OTLP gRPC

  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: trustlayer-prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
      - '--web.enable-remote-write-receiver'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  loki:
    image: grafana/loki:2.9.2
    container_name: trustlayer-loki
    command: ["-config.file=/etc/loki/local-config.yaml"]
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml:ro
      - loki-data:/loki
    ports:
      - "3100:3100"

  grafana:
    image: grafana/grafana:10.2.2
    container_name: trustlayer-grafana
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - grafana-data:/var/lib/grafana
    ports:
      - "3001:3000"
    depends_on:
      - tempo
      - prometheus
      - loki

volumes:
  tempo-data:
  prometheus-data:
  loki-data:
  grafana-data:
```

### Configuração do Collector

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
        cors:
          allowed_origins:
            - "https://trustlayer.exemplo.com"
            - "http://localhost:5173"

  prometheus:
    config:
      scrape_configs:
        - job_name: 'trustlayer-frontend'
          static_configs:
            - targets: ['frontend:8080']
          metrics_path: '/metrics'

processors:
  batch:
    timeout: 10s
    send_batch_size: 1024

  memory_limiter:
    check_interval: 1s
    limit_mib: 1000
    spike_limit_mib: 200

  attributes:
    actions:
      - key: environment
        value: production
        action: upsert
      - key: service.namespace
        value: trustlayer
        action: upsert

  resource:
    attributes:
      - key: deployment.environment
        value: production
        action: upsert

  filter:
    error_mode: ignore
    traces:
      span:
        - 'attributes["http.target"] == "/healthz"'
        - 'attributes["http.target"] == "/metrics"'

exporters:
  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true

  prometheusremotewrite:
    endpoint: "http://prometheus:9090/api/v1/write"

  loki:
    endpoint: "http://loki:3100/loki/api/v1/push"
    labels:
      attributes:
        service.name: "service_name"
        severity: "severity"
      resource:
        deployment.environment: "environment"

  debug:
    verbosity: detailed

extensions:
  health_check:
    endpoint: 0.0.0.0:13133
  pprof:
    endpoint: 0.0.0.0:1888
  zpages:
    endpoint: 0.0.0.0:55679

service:
  extensions: [health_check, pprof, zpages]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, attributes, filter]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp, prometheus]
      processors: [memory_limiter, batch, attributes]
      exporters: [prometheusremotewrite]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch, attributes]
      exporters: [loki]
```

## Instrumentação do Frontend

### Instalação

```bash
npm install @opentelemetry/api \
  @opentelemetry/sdk-trace-web \
  @opentelemetry/sdk-metrics \
  @opentelemetry/auto-instrumentations-web \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/exporter-metrics-otlp-http \
  @opentelemetry/context-zone \
  @opentelemetry/instrumentation-fetch \
  @opentelemetry/instrumentation-xml-http-request
```

### Configuração

```typescript
// src/lib/telemetry/otel.ts
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';

const OTEL_ENDPOINT = import.meta.env.VITE_OTEL_ENDPOINT || 'http://localhost:4318';

// Resource
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'trustlayer-frontend',
  [SemanticResourceAttributes.SERVICE_VERSION]: import.meta.env.VITE_APP_VERSION || '1.0.0',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: import.meta.env.MODE,
});

// Trace Provider
const tracerProvider = new WebTracerProvider({
  resource,
});

const traceExporter = new OTLPTraceExporter({
  url: `${OTEL_ENDPOINT}/v1/traces`,
  headers: {},
});

tracerProvider.addSpanProcessor(new BatchSpanProcessor(traceExporter, {
  maxQueueSize: 100,
  maxExportBatchSize: 10,
  scheduledDelayMillis: 500,
}));

tracerProvider.register({
  contextManager: new ZoneContextManager(),
});

// Meter Provider
const metricExporter = new OTLPMetricExporter({
  url: `${OTEL_ENDPOINT}/v1/metrics`,
});

const meterProvider = new MeterProvider({
  resource,
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 60000, // 1 minuto
    }),
  ],
});

// Instrumentations
registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation({
      propagateTraceHeaderCorsUrls: [
        /api\.trustlayer\.exemplo\.com/,
        /localhost/,
      ],
      clearTimingResources: true,
    }),
    new XMLHttpRequestInstrumentation({
      propagateTraceHeaderCorsUrls: [
        /api\.trustlayer\.exemplo\.com/,
        /localhost/,
      ],
    }),
    new DocumentLoadInstrumentation(),
    new UserInteractionInstrumentation({
      eventNames: ['click', 'submit'],
    }),
  ],
  tracerProvider,
  meterProvider,
});

// Custom metrics
const meter = meterProvider.getMeter('trustlayer-frontend');

export const metrics = {
  pageViews: meter.createCounter('page_views', {
    description: 'Number of page views',
  }),
  assessmentCompleted: meter.createCounter('assessment_completed', {
    description: 'Number of completed assessments',
  }),
  apiLatency: meter.createHistogram('api_latency', {
    description: 'API call latency in milliseconds',
    unit: 'ms',
  }),
  errorCount: meter.createCounter('errors', {
    description: 'Number of errors',
  }),
};

// Tracer export
export const tracer = tracerProvider.getTracer('trustlayer-frontend');

// Usage in components
export function trackPageView(pageName: string) {
  metrics.pageViews.add(1, { page: pageName });

  const span = tracer.startSpan('page_view');
  span.setAttribute('page.name', pageName);
  span.end();
}

export function trackApiCall(endpoint: string, duration: number, success: boolean) {
  metrics.apiLatency.record(duration, {
    endpoint,
    success: String(success),
  });
}
```

### Uso nos Componentes

```typescript
// src/pages/Assessment.tsx
import { tracer, metrics, trackPageView } from '@/lib/telemetry/otel';
import { useEffect } from 'react';

export function Assessment() {
  useEffect(() => {
    trackPageView('assessment');
  }, []);

  const handleSubmit = async () => {
    const span = tracer.startSpan('assessment.submit');

    try {
      span.setAttribute('assessment.id', assessmentId);
      span.setAttribute('assessment.domain', domain);

      const startTime = performance.now();
      await submitAssessment();
      const duration = performance.now() - startTime;

      span.setAttribute('assessment.duration_ms', duration);
      metrics.assessmentCompleted.add(1, { domain });

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      metrics.errorCount.add(1, { type: 'assessment_submit' });
      throw error;
    } finally {
      span.end();
    }
  };

  return (/* ... */);
}
```

## Instrumentação do Backend (Edge Functions)

```typescript
// supabase/functions/_shared/telemetry.ts
import { trace, metrics, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('trustlayer-edge-functions');
const meter = metrics.getMeter('trustlayer-edge-functions');

// Counters
const requestCounter = meter.createCounter('http_requests_total');
const errorCounter = meter.createCounter('http_errors_total');

// Histograms
const requestDuration = meter.createHistogram('http_request_duration_ms');

export function withTelemetry<T>(
  handler: (req: Request) => Promise<Response>,
  functionName: string
) {
  return async (req: Request): Promise<Response> => {
    const span = tracer.startSpan(`${functionName}.handle`, {
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
        'http.user_agent': req.headers.get('user-agent') || '',
      },
    });

    const startTime = performance.now();

    try {
      const response = await handler(req);

      const duration = performance.now() - startTime;

      span.setAttribute('http.status_code', response.status);
      requestDuration.record(duration, {
        function: functionName,
        status: String(response.status),
      });
      requestCounter.add(1, {
        function: functionName,
        method: req.method,
        status: String(response.status),
      });

      span.setStatus({ code: SpanStatusCode.OK });

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;

      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);

      errorCounter.add(1, {
        function: functionName,
        error_type: error.name,
      });
      requestDuration.record(duration, {
        function: functionName,
        status: '500',
      });

      throw error;
    } finally {
      span.end();
    }
  };
}
```

## Configuração do Grafana

### Datasources

```yaml
# grafana/provisioning/datasources/datasources.yml
apiVersion: 1

datasources:
  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    jsonData:
      httpMethod: GET
      tracesToLogs:
        datasourceUid: loki
        tags: ['service.name']
        mappedTags: [{ key: 'service.name', value: 'service_name' }]
        mapTagNamesEnabled: true
        spanStartTimeShift: '-1h'
        spanEndTimeShift: '1h'
        filterByTraceID: true
        filterBySpanID: false
      tracesToMetrics:
        datasourceUid: prometheus
        tags: [{ key: 'service.name', value: 'service' }]
        queries:
          - name: 'Request rate'
            query: 'sum(rate(http_requests_total{$$__tags}[5m]))'
      serviceMap:
        datasourceUid: prometheus
      nodeGraph:
        enabled: true

  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    jsonData:
      exemplarTraceIdDestinations:
        - name: traceID
          datasourceUid: tempo

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    jsonData:
      derivedFields:
        - name: TraceID
          matcherRegex: 'traceId=(\w+)'
          url: '$${__value.raw}'
          datasourceUid: tempo
```

### Dashboard

```json
{
  "dashboard": {
    "title": "TrustLayer Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "timeseries",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Latency P99",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_ms_bucket[5m])) by (le, service))",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100"
          }
        ]
      },
      {
        "title": "Service Map",
        "type": "nodeGraph",
        "targets": [
          {
            "datasource": "Tempo",
            "queryType": "serviceMap"
          }
        ]
      }
    ]
  }
}
```

## Alertas

```yaml
# prometheus/rules/trustlayer.yml
groups:
  - name: trustlayer
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_errors_total[5m])) by (service)
          / sum(rate(http_requests_total[5m])) by (service) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.99, sum(rate(http_request_duration_ms_bucket[5m])) by (le, service)) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency on {{ $labels.service }}"
          description: "P99 latency is {{ $value }}ms"
```

## Variáveis de Ambiente

```env
# Frontend
VITE_OTEL_ENDPOINT=https://otel.trustlayer.exemplo.com
VITE_OTEL_ENABLED=true

# Backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_SERVICE_NAME=trustlayer-edge-functions
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
```

## Próximos Passos

1. [Integração com Grafana](./grafana-integration.md)
2. [Integração com ELK](./elk-integration.md)
3. [Alertas](./alerts.md)

## Referências

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Grafana Tempo](https://grafana.com/docs/tempo/latest/)
- [Grafana Loki](https://grafana.com/docs/loki/latest/)

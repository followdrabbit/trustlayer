# Observabilidade

Sistema completo de observabilidade com métricas, logs, rastreamento distribuído e health checks.

## Índice

- [Visão Geral](#visão-geral)
- [Componentes](#componentes)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Telemetria (OpenTelemetry)](#telemetria-opentelemetry)
- [Métricas Customizadas](#métricas-customizadas)
- [Logging Estruturado](#logging-estruturado)
- [Health Checks](#health-checks)
- [Prometheus](#prometheus)
- [Integração com ELK Stack](#integração-com-elk-stack)
- [Dashboards](#dashboards)
- [Boas Práticas](#boas-práticas)

## Visão Geral

O sistema de observabilidade do TrustLayer fornece:

- **Telemetria**: Rastreamento distribuído com OpenTelemetry
- **Métricas**: Métricas de negócio e SLO tracking
- **Logging**: Logs estruturados com contexto
- **Health Checks**: Probes de saúde para Kubernetes
- **Prometheus**: Exportação de métricas para Prometheus

## Componentes

```
src/lib/observability/
├── index.ts              # Exports centralizados
├── telemetry.ts          # OpenTelemetry setup
├── metrics.ts            # Métricas customizadas
├── logging.ts            # Sistema de logs
├── health-checks.ts      # Health probes
└── prometheus.ts         # Prometheus exporter
```

## Instalação

As dependências OpenTelemetry já estão no `package.json`:

```json
{
  "@opentelemetry/api": "^1.x",
  "@opentelemetry/sdk-trace-web": "^1.x",
  "@opentelemetry/auto-instrumentations-web": "^0.x",
  "@opentelemetry/exporter-trace-otlp-http": "^0.x",
  "@opentelemetry/exporter-metrics-otlp-http": "^0.x"
}
```

## Configuração

### Inicializar Tudo

```tsx
import { initializeObservability } from '@/lib/observability';

// No App.tsx ou main.tsx
initializeObservability({
  telemetry: {
    enabled: true,
    serviceName: 'trustlayer',
    serviceVersion: '1.0.0',
    environment: 'production',
    collectorUrl: 'http://localhost:4318', // OTLP collector
    tracingSampleRate: 1.0, // 100% sampling
  },
  logger: {
    minLevel: LogLevel.INFO,
    enableConsole: true,
    enableRemote: true,
    remoteEndpoint: 'https://logs.example.com/api/logs',
  },
});
```

### Variáveis de Ambiente

```env
# .env
VITE_OTEL_COLLECTOR_URL=http://localhost:4318
VITE_OTEL_SERVICE_NAME=trustlayer
VITE_OTEL_ENVIRONMENT=production
VITE_LOG_LEVEL=info
VITE_LOG_REMOTE_ENDPOINT=https://logs.example.com/api/logs
```

## Telemetria (OpenTelemetry)

### Rastreamento Automático

O OpenTelemetry instrumenta automaticamente:
- Fetch requests
- XMLHttpRequest
- Document load
- User interactions (clicks, submits)

### Rastreamento Manual

#### Async Functions

```tsx
import { traceAsync } from '@/lib/observability';

async function fetchUserData(userId: string) {
  return traceAsync(
    'fetchUserData',
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    },
    { userId }
  );
}
```

#### Sync Functions

```tsx
import { traceSync } from '@/lib/observability';

function calculateScore(data: any) {
  return traceSync(
    'calculateScore',
    () => {
      // Complex calculation
      return score;
    },
    { dataSize: data.length }
  );
}
```

#### Custom Spans

```tsx
import { startSpan } from '@/lib/observability';

function processData(data: any) {
  const span = startSpan('processData', {
    dataSize: data.length,
    type: data.type,
  });

  try {
    // Process data
    const result = transform(data);
    span.setStatus({ code: 1 }); // OK
    return result;
  } catch (error) {
    span.setStatus({ code: 2, message: error.message }); // ERROR
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

## Métricas Customizadas

### Métricas de Negócio

#### Assessment Completion

```tsx
import { recordAssessmentCompletion } from '@/lib/observability';

function completeAssessment(assessment: Assessment) {
  const startTime = Date.now();

  // Complete assessment logic

  const durationSeconds = (Date.now() - startTime) / 1000;
  recordAssessmentCompletion(durationSeconds, {
    domain: assessment.domain,
    framework: assessment.framework,
    questionsAnswered: assessment.questions.length,
  });
}
```

#### Active Users

```tsx
import { trackActiveUser } from '@/lib/observability';

// On login
trackActiveUser('login', { role: user.role });

// On logout
trackActiveUser('logout', { role: user.role });
```

#### Dashboard Load

```tsx
import { recordDashboardLoad } from '@/lib/observability';

function DashboardPage() {
  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      recordDashboardLoad(duration, {
        dashboardType: 'executive',
        domain: currentDomain,
      });
    };
  }, []);
}
```

#### AI Assistant

```tsx
import { recordAIAssistantLatency } from '@/lib/observability';

async function callAI(prompt: string) {
  const startTime = Date.now();

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });

    const latency = Date.now() - startTime;
    recordAIAssistantLatency(latency, {
      provider: 'openai',
      model: 'gpt-4',
      success: true,
    });

    return response.json();
  } catch (error) {
    const latency = Date.now() - startTime;
    recordAIAssistantLatency(latency, {
      provider: 'openai',
      model: 'gpt-4',
      success: false,
    });
    throw error;
  }
}
```

### SLO Metrics

```tsx
import { recordLoginAttempt } from '@/lib/observability';

async function login(email: string, password: string) {
  try {
    const result = await authenticate(email, password);
    recordLoginAttempt(true, { method: 'password' });
    return result;
  } catch (error) {
    recordLoginAttempt(false, { method: 'password' });
    throw error;
  }
}
```

### React Hooks

#### Track Page View

```tsx
import { usePageViewTracking } from '@/lib/observability';

function MyPage() {
  const trackPageView = usePageViewTracking('MyPage');

  useEffect(() => {
    return trackPageView; // Called on unmount
  }, []);
}
```

#### Track Component Render

```tsx
import { useRenderTracking } from '@/lib/observability';

function MyComponent() {
  const trackRender = useRenderTracking('MyComponent');

  useEffect(() => {
    return trackRender;
  }, []);
}
```

## Logging Estruturado

### Configuração

```tsx
import { initializeLogger, LogLevel } from '@/lib/observability';

initializeLogger({
  minLevel: LogLevel.INFO,
  enableConsole: true,
  enableRemote: true,
  remoteEndpoint: 'https://logs.example.com/api/logs',
  serviceName: 'trustlayer',
  environment: 'production',
  version: '1.0.0',
});
```

### Uso Básico

```tsx
import { getLogger } from '@/lib/observability';

const logger = getLogger();

// Debug
logger.debug('Debug message', { userId: '123' });

// Info
logger.info('User logged in', { userId: '123', method: 'password' });

// Warning
logger.warn('API response slow', { duration: 1500, endpoint: '/api/users' });

// Error
logger.error('Failed to fetch data', error, { userId: '123' });

// Fatal
logger.fatal('Application crash', error, { component: 'App' });
```

### Contexto Global

```tsx
import { getLogger } from '@/lib/observability';

const logger = getLogger();

// Set global context (included in all logs)
logger.setGlobalContext({
  userId: user.id,
  organizationId: org.id,
  sessionId: session.id,
});

// All logs will now include this context
logger.info('Action performed'); // includes userId, organizationId, sessionId

// Clear global context
logger.clearGlobalContext();
```

### React Hook

```tsx
import { useLogger } from '@/lib/observability';

function MyComponent() {
  const logger = useLogger('MyComponent');

  const handleClick = () => {
    logger.info('Button clicked', { buttonId: 'submit' });
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### Specialized Loggers

#### HTTP Request Logger

```tsx
import { logHttpRequest } from '@/lib/observability';

async function apiCall(url: string) {
  const startTime = Date.now();
  const response = await fetch(url);
  const duration = Date.now() - startTime;

  logHttpRequest('GET', url, response.status, duration, {
    userId: user.id,
  });
}
```

#### Performance Logger

```tsx
import { logPerformance } from '@/lib/observability';

function heavyOperation() {
  const startTime = Date.now();

  // Do work

  const duration = Date.now() - startTime;
  logPerformance('heavyOperation', duration, { userId: user.id });
}
```

#### Audit Logger

```tsx
import { logAuditEvent } from '@/lib/observability';

function deleteUser(userId: string) {
  try {
    // Delete logic
    logAuditEvent('delete', 'user', true, {
      userId: currentUser.id,
      targetUserId: userId,
    });
  } catch (error) {
    logAuditEvent('delete', 'user', false, {
      userId: currentUser.id,
      targetUserId: userId,
    }, { error: error.message });
  }
}
```

#### Error Boundary Logger

```tsx
import { logErrorBoundary } from '@/lib/observability';

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logErrorBoundary(error, errorInfo);
  }
}
```

## Health Checks

### Uso Básico

```tsx
import { getHealthCheckManager } from '@/lib/observability';

const manager = getHealthCheckManager();

// Check all systems
const health = await manager.checkHealth();
console.log(health);
// {
//   status: 'healthy',
//   checks: [...],
//   timestamp: '2026-01-20T...',
//   uptime: 123456,
//   version: '1.0.0'
// }

// Readiness probe (can handle requests?)
const { ready } = await manager.readiness();

// Liveness probe (is app alive?)
const { alive } = await manager.liveness();
```

### Health Checks Padrão

O sistema inclui checks para:
- **Database**: Conectividade e performance do Supabase
- **Storage**: Disponibilidade do storage
- **API**: Latência da API
- **Memory**: Uso de memória JS heap
- **LocalStorage**: Funcionalidade do localStorage

### Custom Health Checks

```tsx
import { getHealthCheckManager, HealthStatus } from '@/lib/observability';

const manager = getHealthCheckManager();

manager.registerCheck('redis', async () => {
  try {
    const response = await fetch('/api/redis/ping');
    const data = await response.json();

    return {
      name: 'redis',
      status: data.pong ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
      message: data.pong ? 'Redis is healthy' : 'Redis not responding',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'redis',
      status: HealthStatus.UNHEALTHY,
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }
});
```

### React Hook

```tsx
import { useHealthStatus } from '@/lib/observability';

function HealthDashboard() {
  const { health, loading } = useHealthStatus(30000); // Check every 30s

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>System Health: {health.status}</h2>
      {health.checks.map(check => (
        <div key={check.name}>
          {check.name}: {check.status}
        </div>
      ))}
    </div>
  );
}
```

### Health Endpoints

```tsx
import { healthEndpoint, readinessEndpoint, livenessEndpoint } from '@/lib/observability';

// Setup endpoints for Kubernetes probes
app.get('/health', async () => healthEndpoint());
app.get('/health/readiness', async () => readinessEndpoint());
app.get('/health/liveness', async () => livenessEndpoint());
```

## Prometheus

### Métricas Automáticas

O sistema registra automaticamente:
- HTTP requests
- Active users/sessions
- Assessments completed
- Dashboard views
- Errors
- Database queries
- Cache hits/misses
- AI assistant requests
- Voice commands

### Métricas Manuais

#### Counters

```tsx
import { getPrometheusRegistry } from '@/lib/observability';

const registry = getPrometheusRegistry();

// Register counter
registry.registerCounter('my_events_total', 'Total custom events', { type: '' });

// Increment
registry.incrementCounter('my_events_total', 1, { type: 'click' });
```

#### Gauges

```tsx
const registry = getPrometheusRegistry();

// Register gauge
registry.registerGauge('queue_size', 'Current queue size');

// Set value
registry.setGauge('queue_size', 42);

// Increment/decrement
registry.incrementGauge('queue_size', 1);
registry.decrementGauge('queue_size', 1);
```

#### Histograms

```tsx
const registry = getPrometheusRegistry();

// Register histogram
registry.registerHistogram('request_duration_seconds', 'Request duration in seconds');

// Observe value
registry.observeHistogram('request_duration_seconds', 0.234);
```

### Helper Functions

```tsx
import {
  recordPrometheusHttpRequest,
  recordPrometheusAssessment,
  recordDashboardView,
  recordError,
  recordDatabaseQuery,
} from '@/lib/observability';

// HTTP request
recordPrometheusHttpRequest('GET', '/api/users', 200, 0.123);

// Assessment
recordPrometheusAssessment('GDPR', 45.5);

// Dashboard view
recordDashboardView('executive', 1.2);

// Error
recordError('validation', 'warning');

// Database query
recordDatabaseQuery('SELECT', 0.05);
```

### Export Endpoint

```tsx
import { prometheusMetricsEndpoint } from '@/lib/observability';

// Setup Prometheus scrape endpoint
app.get('/metrics', async () => prometheusMetricsEndpoint());
```

Retorna:

```
# HELP trustlayer_http_requests_total Total HTTP requests
# TYPE trustlayer_http_requests_total counter
trustlayer_http_requests_total{method="GET",path="/api/users",status="200"} 42

# HELP trustlayer_http_request_duration_seconds HTTP request duration in seconds
# TYPE trustlayer_http_request_duration_seconds histogram
trustlayer_http_request_duration_seconds_bucket{le="0.005"} 10
trustlayer_http_request_duration_seconds_bucket{le="0.01"} 25
...
```

### React Hook

```tsx
import { usePrometheusTracking } from '@/lib/observability';

function MyComponent() {
  usePrometheusTracking('MyComponent');

  return <div>...</div>;
}
```

## Integração com ELK Stack

### Logstash Pipeline

```ruby
# logstash.conf
input {
  http {
    port => 8080
    codec => json
  }
}

filter {
  # Parse log entries
  json {
    source => "message"
  }

  # Extract timestamp
  date {
    match => ["timestamp", "ISO8601"]
    target => "@timestamp"
  }

  # Add tags
  mutate {
    add_tag => ["trustlayer", "%{environment}"]
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "trustlayer-logs-%{+YYYY.MM.dd}"
  }
}
```

### Elasticsearch Index Template

```json
{
  "index_patterns": ["trustlayer-logs-*"],
  "mappings": {
    "properties": {
      "timestamp": { "type": "date" },
      "level": { "type": "keyword" },
      "message": { "type": "text" },
      "context": {
        "properties": {
          "userId": { "type": "keyword" },
          "organizationId": { "type": "keyword" },
          "sessionId": { "type": "keyword" },
          "service": { "type": "keyword" },
          "environment": { "type": "keyword" }
        }
      },
      "error": {
        "properties": {
          "name": { "type": "keyword" },
          "message": { "type": "text" },
          "stack": { "type": "text" }
        }
      }
    }
  }
}
```

### Kibana Dashboard

Criar dashboard com:
- Log volume over time
- Error rate
- Top errors
- User activity
- Performance metrics

## Dashboards

### Grafana - Métricas

```yaml
# grafana-dashboard.json
{
  "dashboard": {
    "title": "TrustLayer Metrics",
    "panels": [
      {
        "title": "HTTP Request Rate",
        "targets": [
          {
            "expr": "rate(trustlayer_http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Assessment Completion Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(trustlayer_assessment_completion_time_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "trustlayer_active_users"
          }
        ]
      }
    ]
  }
}
```

### Jaeger - Traces

Configure Jaeger para visualizar traces distribuídos:

```yaml
# docker-compose.yml
version: '3'
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # Jaeger UI
      - "4318:4318"    # OTLP HTTP receiver
```

Acesse: http://localhost:16686

## Boas Práticas

### 1. Níveis de Log Apropriados

```tsx
// ✅ Bom
logger.debug('Cache lookup', { key });      // Debugging
logger.info('User logged in', { userId });  // Important events
logger.warn('Slow response', { duration }); // Warnings
logger.error('API failed', error);          // Errors
logger.fatal('DB connection lost', error);  // Critical

// ❌ Ruim
logger.info('Loop iteration 42');           // Too verbose
logger.error('User clicked button');        // Wrong level
```

### 2. Contexto Rico

```tsx
// ✅ Bom
logger.info('Order created', {
  userId: user.id,
  orderId: order.id,
  amount: order.total,
  items: order.items.length,
});

// ❌ Ruim
logger.info('Order created');
```

### 3. Métricas vs Logs

```tsx
// Métricas: Dados agregados, numéricos
recordAssessmentCompletion(duration, { domain });

// Logs: Eventos individuais com contexto
logger.info('Assessment completed', {
  assessmentId,
  userId,
  duration,
  domain,
});
```

### 4. Sampling em Produção

```tsx
// Para alto volume, use sampling
initializeObservability({
  telemetry: {
    tracingSampleRate: 0.1, // 10% sampling
  },
});
```

### 5. Sensitive Data

```tsx
// ❌ NUNCA faça isso
logger.info('User login', { password: pwd });

// ✅ Faça isso
logger.info('User login', { userId: user.id });
```

### 6. Performance

```tsx
// Use lazy evaluation para logs caros
logger.debug(() => {
  const expensiveData = computeExpensiveData();
  return `Data: ${JSON.stringify(expensiveData)}`;
});
```

### 7. Error Handling

```tsx
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, {
    operation: 'riskyOperation',
    userId: user.id,
  });

  recordError('riskyOperation', 'error');

  throw error; // Re-throw after logging
}
```

### 8. Labels Consistentes

```tsx
// Use labels consistentes para grouping
recordDashboardView('executive', duration);
recordDashboardView('grc', duration);
recordDashboardView('specialist', duration);

// Não use valores únicos como labels
// ❌ recordDashboardView(userId, duration); // Cardinalidade alta
```

## Troubleshooting

### Logs não aparecem

1. Verifique o `minLevel` do logger
2. Confirme que `enableConsole` está true
3. Verifique o console do navegador

### Métricas não exportam

1. Verifique se `/metrics` endpoint está acessível
2. Confirme formato Prometheus: `curl http://localhost:3000/metrics`
3. Verifique configuração do Prometheus scraper

### Traces não aparecem no Jaeger

1. Verifique `collectorUrl` está correto
2. Confirme que OTLP collector está rodando
3. Verifique `tracingSampleRate` não está 0

### Health checks sempre unhealthy

1. Verifique conectividade com Supabase
2. Confirme credenciais no `.env`
3. Use `manager.checkHealth()` para debug

## Referências

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [ELK Stack](https://www.elastic.co/elastic-stack)
- [Jaeger Tracing](https://www.jaegertracing.io/)

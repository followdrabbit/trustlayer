# Performance Tuning - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre otimizações de performance para o TrustLayer em diferentes camadas.

## Métricas de Performance

### SLOs Recomendados

| Métrica | Target | Critical |
|---------|--------|----------|
| P50 Latency | < 100ms | < 200ms |
| P99 Latency | < 500ms | < 1s |
| Error Rate | < 0.1% | < 1% |
| Availability | 99.9% | 99.5% |
| TTFB | < 200ms | < 500ms |
| LCP | < 2.5s | < 4s |

## Frontend

### Bundle Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'vendor-charts': ['recharts'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

### Lazy Loading

```typescript
// Routes com lazy loading
const DashboardExecutive = lazy(() => import('./pages/DashboardExecutive'));
const DashboardGRC = lazy(() => import('./pages/DashboardGRC'));
const Settings = lazy(() => import('./pages/Settings'));

// Componentes pesados
const AIAssistant = lazy(() => import('./components/AIAssistant'));
const ReportViewer = lazy(() => import('./components/ReportViewer'));
```

### Image Optimization

```typescript
// Componente de imagem otimizada
function OptimizedImage({ src, alt, ...props }) {
  return (
    <picture>
      <source srcSet={`${src}.webp`} type="image/webp" />
      <source srcSet={`${src}.avif`} type="image/avif" />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </picture>
  );
}
```

### Service Worker

```typescript
// sw.ts
const CACHE_NAME = 'trustlayer-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/main.js',
  '/assets/main.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## Backend / Edge Functions

### Connection Pooling

```typescript
// Supabase client com pool
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { 'x-connection-pool': 'true' },
    },
  }
);
```

### Caching

```typescript
// Cache em memória para dados frequentes
const cache = new Map<string, { data: any; expiry: number }>();

async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }

  const data = await fetcher();
  cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
  return data;
}

// Uso
const frameworks = await getCachedData(
  'frameworks:all',
  () => supabase.from('default_frameworks').select('*'),
  300 // 5 minutos
);
```

### Batch Processing

```typescript
// Processar em lotes para evitar sobrecarga
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}
```

## Database

### Índices Otimizados

```sql
-- Índices compostos para queries frequentes
CREATE INDEX CONCURRENTLY idx_answers_user_domain_question
  ON answers (user_id, security_domain, question_id);

-- Índice parcial para registros ativos
CREATE INDEX CONCURRENTLY idx_active_questions
  ON default_questions (domain_id)
  WHERE is_active = true;

-- Índice para ordenação
CREATE INDEX CONCURRENTLY idx_snapshots_user_date_desc
  ON maturity_snapshots (user_id, snapshot_date DESC);

-- Índice GIN para JSONB
CREATE INDEX CONCURRENTLY idx_change_logs_details
  ON change_logs USING GIN (details);

-- Verificar uso de índices
SELECT indexrelname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Query Optimization

```sql
-- EXPLAIN ANALYZE para identificar problemas
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM answers
WHERE user_id = 'uuid' AND security_domain = 'AI Security';

-- Otimizar JOIN
-- Ruim
SELECT a.*, q.question_text
FROM answers a, default_questions q
WHERE a.question_id = q.id;

-- Bom
SELECT a.*, q.question_text
FROM answers a
INNER JOIN default_questions q ON a.question_id = q.id;

-- Usar LIMIT com ORDER BY indexado
SELECT * FROM change_logs
WHERE user_id = 'uuid'
ORDER BY timestamp DESC
LIMIT 100;
```

### Particionamento

```sql
-- Particionar tabela de logs por data
CREATE TABLE change_logs_partitioned (
  id UUID,
  timestamp TIMESTAMPTZ,
  event_type TEXT,
  user_id UUID,
  details JSONB
) PARTITION BY RANGE (timestamp);

-- Criar partições mensais
CREATE TABLE change_logs_2026_01 PARTITION OF change_logs_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE change_logs_2026_02 PARTITION OF change_logs_partitioned
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

### Configuration Tuning

```ini
# postgresql.conf otimizado

# Memória (para 32GB RAM)
shared_buffers = 8GB
effective_cache_size = 24GB
work_mem = 256MB
maintenance_work_mem = 2GB
wal_buffers = 64MB

# Checkpoints
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min
max_wal_size = 4GB

# Parallel queries
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
parallel_tuple_cost = 0.01
parallel_setup_cost = 100

# Planner
random_page_cost = 1.1  # SSD
effective_io_concurrency = 200
default_statistics_target = 100

# Autovacuum
autovacuum_vacuum_scale_factor = 0.05
autovacuum_analyze_scale_factor = 0.025
autovacuum_vacuum_cost_delay = 2ms
```

## Nginx

### Caching

```nginx
# Cache de assets estáticos
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary "Accept-Encoding";
}

# Microcaching para API
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 1m;
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    proxy_cache_background_update on;
    proxy_cache_lock on;

    add_header X-Cache-Status $upstream_cache_status;
}
```

### Compression

```nginx
# Brotli (melhor que gzip)
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml;

# Gzip fallback
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### HTTP/2 & HTTP/3

```nginx
server {
    listen 443 ssl http2;
    listen 443 quic reuseport;  # HTTP/3

    http2_push_preload on;

    add_header Alt-Svc 'h3=":443"; ma=86400';
}
```

## CDN

### CloudFront Configuration

```hcl
resource "aws_cloudfront_distribution" "trustlayer" {
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-frontend"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-frontend"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true

    # Lambda@Edge para otimização
    lambda_function_association {
      event_type   = "origin-response"
      lambda_arn   = aws_lambda_function.headers.qualified_arn
      include_body = false
    }
  }
}
```

## Monitoring

### Prometheus Queries

```promql
# Latência P99
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))

# Throughput
sum(rate(http_requests_total[5m])) by (service)

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# Database connection usage
pg_stat_activity_count{datname="trustlayer"} / pg_settings_max_connections

# Cache hit ratio
sum(rate(cache_hits_total[5m])) / sum(rate(cache_requests_total[5m]))
```

### Load Testing

```yaml
# k6 load test
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Sustain
    { duration: '2m', target: 200 },  // Spike
    { duration: '5m', target: 200 },  // Sustain spike
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  let response = http.get('https://trustlayer.exemplo.com/api/assessments');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

## Próximos Passos

1. [Troubleshooting](./troubleshooting.md)
2. [Análise de Logs](./log-analysis.md)
3. [Disaster Recovery](./disaster-recovery.md)

## Referências

- [PostgreSQL Performance](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Nginx Tuning](https://www.nginx.com/blog/tuning-nginx/)
- [Web Vitals](https://web.dev/vitals/)

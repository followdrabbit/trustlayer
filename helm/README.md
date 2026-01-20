# TrustLayer Helm Chart

Official Helm chart for deploying TrustLayer Security Governance Platform on Kubernetes.

## Quick Start

```bash
# Add Helm repository
helm repo add trustlayer https://charts.trustlayer.io
helm repo update

# Install with default values
helm install my-trustlayer trustlayer/trustlayer \
  --namespace trustlayer \
  --create-namespace

# Install with custom values
helm install my-trustlayer trustlayer/trustlayer \
  --namespace trustlayer \
  --create-namespace \
  --values my-values.yaml
```

## Prerequisites

- Kubernetes 1.27+
- Helm 3.13+
- PV provisioner support in the underlying infrastructure
- Ingress controller (nginx-ingress recommended)
- cert-manager (for automatic TLS certificates)

## Chart Dependencies

This chart depends on:
- `bitnami/postgresql` - PostgreSQL database with HA support

Dependencies are automatically installed unless disabled.

## Configuration

### Global Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.deploymentMode` | Deployment mode: `in-cluster`, `split`, or `on-prem` | `in-cluster` |
| `global.domain` | Domain for ingress | `trustlayer.example.com` |
| `global.imagePullSecrets` | Docker registry secret names | `[]` |
| `global.storageClass` | Storage class for PVCs | `standard` |

### Frontend Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.enabled` | Deploy frontend | `true` |
| `frontend.replicaCount` | Number of replicas | `2` |
| `frontend.image.repository` | Image repository | `trustlayer/web` |
| `frontend.image.tag` | Image tag | `1.2.0` |
| `frontend.image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `frontend.autoscaling.enabled` | Enable HPA | `true` |
| `frontend.autoscaling.minReplicas` | Min replicas for HPA | `2` |
| `frontend.autoscaling.maxReplicas` | Max replicas for HPA | `10` |
| `frontend.ingress.enabled` | Enable ingress | `true` |
| `frontend.ingress.className` | Ingress class | `nginx` |
| `frontend.ingress.tls.enabled` | Enable TLS | `true` |

### PostgreSQL Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `postgresql.enabled` | Deploy PostgreSQL | `true` |
| `postgresql.external.enabled` | Use external PostgreSQL | `false` |
| `postgresql.external.host` | External PG host | `""` |
| `postgresql.architecture` | Architecture: `standalone` or `replication` | `replication` |
| `postgresql.replication.readReplicas` | Number of read replicas | `2` |
| `postgresql.primary.persistence.size` | PVC size for primary | `20Gi` |
| `postgresql.backup.enabled` | Enable automated backups | `true` |
| `postgresql.backup.schedule` | Backup cron schedule | `0 2 * * *` |

### Supabase Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `supabase.enabled` | Deploy Supabase | `true` |
| `supabase.external.enabled` | Use external Supabase | `false` |
| `supabase.external.url` | External Supabase URL | `""` |
| `supabase.selfHosted.enabled` | Deploy self-hosted Supabase | `true` |
| `supabase.selfHosted.kong.replicaCount` | Kong replicas | `2` |
| `supabase.selfHosted.auth.replicaCount` | GoTrue replicas | `2` |
| `supabase.selfHosted.rest.replicaCount` | PostgREST replicas | `2` |

### Observability Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `observability.prometheus.enabled` | Deploy Prometheus | `true` |
| `observability.prometheus.retention` | Metrics retention | `30d` |
| `observability.prometheus.storageSize` | Storage size | `50Gi` |
| `observability.grafana.enabled` | Deploy Grafana | `true` |
| `observability.loki.enabled` | Deploy Loki | `true` |
| `observability.otelCollector.enabled` | Deploy OTEL Collector | `true` |

### Security Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `security.networkPolicies.enabled` | Enable NetworkPolicies | `true` |
| `security.podSecurityStandards.enforce` | PSS enforcement level | `restricted` |

### Backup & DR Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backup.database.enabled` | Enable DB backups | `true` |
| `backup.database.schedule` | Backup schedule | `0 2 * * *` |
| `backup.database.retention` | Retention in days | `30` |
| `backup.database.s3.enabled` | Upload to S3 | `true` |
| `backup.database.s3.bucket` | S3 bucket name | `trustlayer-backups` |

### Data Retention Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `dataRetention.enabled` | Enable automated cleanup | `true` |
| `dataRetention.schedule` | Cleanup schedule | `0 3 * * 0` |
| `dataRetention.changeLogs` | Retention for change logs (days) | `365` |
| `dataRetention.snapshots` | Retention for snapshots (days) | `730` |
| `dataRetention.siemMetrics` | Retention for SIEM metrics (days) | `90` |

## Examples

### Minimal Development Setup

```yaml
# values-dev.yaml
global:
  domain: "trustlayer.local"

frontend:
  replicaCount: 1
  autoscaling:
    enabled: false
  resources:
    requests:
      cpu: 50m
      memory: 64Mi

postgresql:
  architecture: standalone
  primary:
    persistence:
      size: 5Gi
    resources:
      requests:
        cpu: 100m
        memory: 256Mi

observability:
  prometheus:
    enabled: false
  grafana:
    enabled: false

backup:
  database:
    enabled: false

dataRetention:
  enabled: false
```

```bash
helm install trustlayer-dev ./trustlayer \
  --values values-dev.yaml \
  --namespace trustlayer-dev \
  --create-namespace
```

### Production HA Setup

```yaml
# values-prod.yaml
global:
  domain: "trustlayer.company.com"
  storageClass: "gp3"

frontend:
  replicaCount: 3
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 20
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi

postgresql:
  architecture: replication
  replication:
    readReplicas: 2
  primary:
    persistence:
      size: 100Gi
    resources:
      requests:
        cpu: 2000m
        memory: 4Gi
      limits:
        cpu: 8000m
        memory: 16Gi

pgbouncer:
  enabled: true
  replicaCount: 3
  maxClientConn: 5000

observability:
  prometheus:
    enabled: true
    retention: 90d
    storageSize: 200Gi
  grafana:
    enabled: true

security:
  networkPolicies:
    enabled: true
  podSecurityStandards:
    enforce: "restricted"

affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
            - key: app.kubernetes.io/name
              operator: In
              values:
                - trustlayer
        topologyKey: "kubernetes.io/hostname"
```

### External Database (RDS/Cloud SQL)

```yaml
# values-external-db.yaml
postgresql:
  enabled: false
  external:
    enabled: true
    host: "trustlayer-db.abc123.us-east-1.rds.amazonaws.com"
    port: 5432
    database: "trustlayer"
    username: "postgres"
    existingSecret: "rds-credentials"

# Create secret first:
# kubectl create secret generic rds-credentials \
#   --from-literal=username=postgres \
#   --from-literal=password=YOUR_PASSWORD
```

### Split Deployment (Frontend Only)

```yaml
# values-split.yaml
global:
  deploymentMode: "split"

frontend:
  enabled: true

supabase:
  enabled: false
  external:
    enabled: true
    url: "https://yourproject.supabase.co"
    anonKey: "your-anon-key"

postgresql:
  enabled: false
```

## Upgrading

```bash
# Upgrade to new version
helm upgrade my-trustlayer trustlayer/trustlayer \
  --namespace trustlayer \
  --values my-values.yaml

# Force recreate pods (if needed)
helm upgrade my-trustlayer trustlayer/trustlayer \
  --namespace trustlayer \
  --values my-values.yaml \
  --force

# Rollback to previous version
helm rollback my-trustlayer 1 --namespace trustlayer
```

## Uninstalling

```bash
# Uninstall release
helm uninstall my-trustlayer --namespace trustlayer

# Delete PVCs (WARNING: Data will be lost)
kubectl delete pvc --all -n trustlayer

# Delete namespace
kubectl delete namespace trustlayer
```

## Troubleshooting

### Check Release Status

```bash
helm status my-trustlayer --namespace trustlayer
helm get values my-trustlayer --namespace trustlayer
helm get manifest my-trustlayer --namespace trustlayer
```

### Debug Template Rendering

```bash
helm template my-trustlayer ./trustlayer \
  --values my-values.yaml \
  --debug
```

### Check Pod Logs

```bash
kubectl logs -n trustlayer deployment/my-trustlayer-frontend
kubectl logs -n trustlayer statefulset/my-trustlayer-postgresql
```

### Verify Secrets

```bash
kubectl get secrets -n trustlayer
kubectl describe secret my-trustlayer-postgresql -n trustlayer
```

## Contributing

See the [Contributing Guide](../docs/CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](../LICENSE)

## Support

- Documentation: https://docs.trustlayer.io
- Issues: https://github.com/trustlayer/trustlayer/issues
- Email: support@trustlayer.io

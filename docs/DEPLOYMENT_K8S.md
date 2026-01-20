# Kubernetes Deployment Guide

Este guia detalha como fazer deploy do TrustLayer em ambientes Kubernetes (EKS, AKS, GKE, ou on-premises).

---

## 📋 Pré-requisitos

### Ferramentas Necessárias

- **kubectl** 1.27+ configurado com acesso ao cluster
- **Helm** 3.13+ instalado
- **Docker** (para build local de imagens)
- Acesso a um **Container Registry** (GHCR, ECR, ACR, GCR, ou Harbor)

### Recursos de Cluster Mínimos

| Componente | CPU | Memory | Storage |
|------------|-----|--------|---------|
| Frontend (2 replicas) | 200m | 256Mi | - |
| PostgreSQL (primary) | 500m | 1Gi | 20Gi PVC |
| PgBouncer (2 replicas) | 200m | 128Mi | - |
| Supabase (Kong, Auth, REST, etc.) | 1000m | 2Gi | - |
| **Total Recomendado** | **4 cores** | **8Gi** | **50Gi** |

Para produção, recomenda-se **3 worker nodes** com **8Gi RAM cada** para alta disponibilidade.

---

## 🏗️ Deployment Modes

O TrustLayer suporta 3 modos de deployment via Helm:

### 1. **In-Cluster** (Padrão)
Todos os componentes rodam no mesmo cluster Kubernetes.

```yaml
# values-in-cluster.yaml
global:
  deploymentMode: "in-cluster"

frontend:
  enabled: true

supabase:
  enabled: true
  selfHosted:
    enabled: true

postgresql:
  enabled: true
```

### 2. **Split** (Frontend/Backend Separados)
Frontend no cluster, backend externo (Supabase Cloud ou outro cluster).

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

### 3. **On-Prem** (Totalmente Isolado)
Todos os componentes on-premises com external PostgreSQL (RDS/BDS).

```yaml
# values-on-prem.yaml
global:
  deploymentMode: "on-prem"

frontend:
  enabled: true

supabase:
  enabled: true
  selfHosted:
    enabled: true

postgresql:
  enabled: false
  external:
    enabled: true
    host: "postgres.internal.company.com"
    port: 5432
    database: "trustlayer"
    username: "postgres"
    existingSecret: "postgresql-credentials"
```

---

## 🚀 Quick Start

### 1. Criar Namespace

```bash
kubectl create namespace trustlayer-production
kubectl config set-context --current --namespace=trustlayer-production
```

### 2. Criar Secrets

#### PostgreSQL Credentials
```bash
kubectl create secret generic postgresql-secret \
  --from-literal=username=postgres \
  --from-literal=password='CHANGE_ME_STRONG_PASSWORD' \
  --namespace=trustlayer-production
```

#### Supabase Secrets
```bash
kubectl create secret generic trustlayer-supabase \
  --from-literal=anon-key='YOUR_SUPABASE_ANON_KEY' \
  --from-literal=service-role-key='YOUR_SUPABASE_SERVICE_ROLE_KEY' \
  --from-literal=jwt-secret='YOUR_JWT_SECRET' \
  --namespace=trustlayer-production
```

#### S3 Credentials (para backups)
```bash
kubectl create secret generic trustlayer-s3-credentials \
  --from-literal=access-key-id='YOUR_AWS_ACCESS_KEY' \
  --from-literal=secret-access-key='YOUR_AWS_SECRET_KEY' \
  --namespace=trustlayer-production
```

### 3. Configurar Values

Crie `values-production.yaml`:

```yaml
global:
  deploymentMode: "in-cluster"
  domain: "trustlayer.example.com"
  storageClass: "gp3"  # ou "standard", "managed-premium"

frontend:
  replicaCount: 3
  image:
    repository: ghcr.io/yourorg/trustlayer-web
    tag: "1.2.0"

  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10

  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi

  ingress:
    enabled: true
    className: "nginx"
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
      nginx.ingress.kubernetes.io/rate-limit: "100"
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
    tls:
      enabled: true
      secretName: trustlayer-tls

postgresql:
  enabled: true
  auth:
    existingSecret: "postgresql-secret"

  architecture: replication
  replication:
    readReplicas: 2

  primary:
    persistence:
      size: 50Gi
      storageClass: "gp3"
    resources:
      requests:
        cpu: 1000m
        memory: 2Gi
      limits:
        cpu: 4000m
        memory: 8Gi

  backup:
    enabled: true
    schedule: "0 2 * * *"
    retention: 30

pgbouncer:
  enabled: true
  replicaCount: 3
  poolMode: transaction
  maxClientConn: 2000
  defaultPoolSize: 50

observability:
  prometheus:
    enabled: true
    retention: 30d
    storageSize: 100Gi

  grafana:
    enabled: true
    persistence:
      enabled: true
      size: 20Gi

backup:
  database:
    enabled: true
    schedule: "0 2 * * *"
    retention: 30
    size: 200Gi
    s3:
      enabled: true
      bucket: "trustlayer-backups"
      region: "us-east-1"

dataRetention:
  enabled: true
  schedule: "0 3 * * 0"
  changeLogs: 365
  snapshots: 730
  siemMetrics: 90

security:
  networkPolicies:
    enabled: true
  podSecurityStandards:
    enforce: "restricted"

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app.kubernetes.io/name
                operator: In
                values:
                  - trustlayer
          topologyKey: kubernetes.io/hostname
```

### 4. Deploy com Helm

```bash
# Adicionar o repositório (se aplicável)
helm repo add trustlayer https://charts.trustlayer.io
helm repo update

# Instalar o chart
helm install trustlayer trustlayer/trustlayer \
  --namespace trustlayer-production \
  --values values-production.yaml \
  --wait --timeout 15m

# Verificar status
kubectl get pods -n trustlayer-production
kubectl get svc -n trustlayer-production
kubectl get ingress -n trustlayer-production
```

---

## 🔒 Security Hardening

### 1. NetworkPolicies

As NetworkPolicies garantem isolamento de rede entre pods:

```bash
# Verificar NetworkPolicies aplicadas
kubectl get networkpolicies -n trustlayer-production

# Testar conectividade (deve falhar de pods externos)
kubectl run test-pod --image=busybox -it --rm -- \
  wget -O- http://trustlayer-frontend:80
```

### 2. PodSecurityStandards

Enforce restricted profile:

```bash
kubectl label namespace trustlayer-production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted
```

### 3. RBAC

O chart cria ServiceAccount e Role automaticamente:

```bash
# Verificar ServiceAccount
kubectl get serviceaccount trustlayer -n trustlayer-production

# Verificar permissões
kubectl describe role trustlayer -n trustlayer-production
```

### 4. Secrets Encryption at Rest

Habilite encryption no cluster:

```bash
# EKS
aws eks update-cluster-config \
  --name your-cluster \
  --encryption-config '[{"resources":["secrets"],"provider":{"keyArn":"arn:aws:kms:region:account:key/id"}}]'

# AKS
az aks update \
  --name your-cluster \
  --resource-group your-rg \
  --enable-encryption-at-host
```

---

## 📊 Monitoring & Observability

### 1. Verificar Prometheus

```bash
# Port-forward para Prometheus UI
kubectl port-forward -n trustlayer-production \
  svc/trustlayer-prometheus 9090:9090

# Acesse http://localhost:9090
```

### 2. Verificar Grafana

```bash
# Obter senha do admin
kubectl get secret -n trustlayer-production \
  trustlayer-grafana -o jsonpath='{.data.admin-password}' | base64 -d

# Port-forward para Grafana UI
kubectl port-forward -n trustlayer-production \
  svc/trustlayer-grafana 3000:3000

# Acesse http://localhost:3000
# Login: admin / <senha do comando acima>
```

### 3. Logs Centralizados (Loki)

```bash
# Query logs via LogCLI
kubectl port-forward -n trustlayer-production svc/trustlayer-loki 3100:3100

# Em outro terminal
logcli query '{app="trustlayer-frontend"}' --addr=http://localhost:3100
```

---

## 🔄 Backup & Restore

### Backup Automático

O CronJob de backup roda diariamente:

```bash
# Verificar CronJob
kubectl get cronjob -n trustlayer-production

# Verificar execuções
kubectl get jobs -n trustlayer-production

# Forçar backup manual
kubectl create job -n trustlayer-production \
  --from=cronjob/trustlayer-db-backup manual-backup-$(date +%s)
```

### Restore Manual

```bash
# 1. Download do backup do S3
aws s3 cp s3://trustlayer-backups/trustlayer/20260119_020000.sql.gz ./backup.sql.gz

# 2. Upload para um pod temporário
kubectl run restore-pod -n trustlayer-production \
  --image=postgres:15-alpine -- sleep 3600

kubectl cp backup.sql.gz trustlayer-production/restore-pod:/tmp/

# 3. Restaurar
kubectl exec -it restore-pod -n trustlayer-production -- sh
gunzip /tmp/backup.sql.gz
psql -h trustlayer-postgresql -U postgres -d trustlayer < /tmp/backup.sql

# 4. Limpar
kubectl delete pod restore-pod -n trustlayer-production
```

---

## 🔧 Troubleshooting

### Pods não iniciam

```bash
# Verificar events
kubectl describe pod <pod-name> -n trustlayer-production

# Verificar logs
kubectl logs <pod-name> -n trustlayer-production

# Verificar recursos
kubectl top nodes
kubectl top pods -n trustlayer-production
```

### Banco de dados não conecta

```bash
# Testar conectividade do pod
kubectl run pg-test -n trustlayer-production --image=postgres:15-alpine -it --rm -- \
  psql -h trustlayer-postgresql -U postgres -d trustlayer

# Verificar password secret
kubectl get secret postgresql-secret -n trustlayer-production -o yaml
```

### Ingress não funciona

```bash
# Verificar Ingress controller
kubectl get pods -n ingress-nginx

# Verificar Ingress resource
kubectl describe ingress trustlayer-frontend -n trustlayer-production

# Verificar cert-manager (TLS)
kubectl get certificate -n trustlayer-production
kubectl describe certificate trustlayer-tls -n trustlayer-production
```

### Performance Issues

```bash
# Verificar HPA
kubectl get hpa -n trustlayer-production
kubectl describe hpa trustlayer-frontend -n trustlayer-production

# Escalar manualmente se necessário
kubectl scale deployment trustlayer-frontend -n trustlayer-production --replicas=5

# Verificar PgBouncer
kubectl logs -n trustlayer-production deployment/trustlayer-pgbouncer
```

---

## 📈 Scaling

### Horizontal Scaling (HPA)

O HPA escala automaticamente baseado em CPU/Memory:

```bash
# Verificar status
kubectl get hpa -n trustlayer-production

# Ajustar limites
kubectl edit hpa trustlayer-frontend -n trustlayer-production
```

### Vertical Scaling (VPA)

Instale VPA se não estiver disponível:

```bash
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler
./hack/vpa-up.sh
```

Aplique VPA para PostgreSQL:

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: trustlayer-postgresql-vpa
  namespace: trustlayer-production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: trustlayer-postgresql
  updatePolicy:
    updateMode: "Auto"
```

---

## 🌐 Multi-Region Deployment

Para deployment multi-region:

1. **Active-Passive**: Primary em uma região, DR em outra
2. **Active-Active**: Load balancing global com GeoDNS

### Configuração Active-Passive

```bash
# Region 1 (Primary)
helm install trustlayer-us-east ./helm/trustlayer \
  --namespace trustlayer \
  --values values-us-east.yaml

# Region 2 (DR - read replicas)
helm install trustlayer-eu-west ./helm/trustlayer \
  --namespace trustlayer \
  --values values-eu-west.yaml \
  --set postgresql.architecture=replication \
  --set postgresql.primary.enabled=false \
  --set postgresql.readReplicas.enabled=true
```

---

## 📚 Referências

- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [PostgreSQL on Kubernetes](https://www.postgresql.org/docs/current/high-availability.html)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)
- [TrustLayer Architecture](./ARCHITECTURE.md)
- [Backup & DR Runbook](./runbooks/BACKUP_DR.md)
- [Observability Baseline](./OBSERVABILITY.md)

---

## ✅ Checklist de Production Readiness

Antes de ir para produção, verifique:

- [ ] **Secrets**: Todas as senhas foram alteradas dos valores padrão
- [ ] **TLS**: Certificados válidos configurados (Let's Encrypt ou corporativo)
- [ ] **Backups**: Testados restore de pelo menos 1 backup
- [ ] **Monitoring**: Dashboards Grafana configurados e alertas funcionando
- [ ] **HA**: Pelo menos 3 replicas do frontend e 2 do PostgreSQL
- [ ] **NetworkPolicies**: Testadas e validadas
- [ ] **Resource Limits**: CPU/Memory limits definidos para todos os pods
- [ ] **RBAC**: Apenas ServiceAccounts necessárias com least privilege
- [ ] **Logs**: Agregados em sistema centralizado (Loki, ELK, Splunk)
- [ ] **DR**: Runbook de disaster recovery testado
- [ ] **Load Testing**: Testes de carga executados e limites conhecidos
- [ ] **Security Scan**: Imagens escaneadas sem vulnerabilidades CRITICAL/HIGH
- [ ] **Documentation**: Runbooks de operação e manutenção criados

---

**Pronto!** Seu cluster TrustLayer está operacional em produção. 🚀

Para suporte, consulte [CONTRIBUTING.md](./CONTRIBUTING.md) ou abra uma issue.

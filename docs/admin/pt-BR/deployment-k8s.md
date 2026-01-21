# Deploy com Kubernetes - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia detalha o deploy do TrustLayer em clusters Kubernetes, ideal para ambientes de produção que requerem alta disponibilidade, escalabilidade e resiliência.

## Pré-requisitos

### Ferramentas

| Ferramenta | Versão Mínima | Verificação |
|------------|---------------|-------------|
| kubectl | 1.28+ | `kubectl version` |
| Helm | 3.12+ | `helm version` |
| Kubernetes | 1.28+ | `kubectl get nodes` |

### Recursos do Cluster

| Ambiente | Nodes | CPU/Node | RAM/Node |
|----------|-------|----------|----------|
| Staging | 3 | 4 cores | 8GB |
| Produção | 5+ | 8 cores | 16GB |

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Kubernetes Cluster                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Ingress Controller (nginx)                    │  │
│  │                      trustlayer.exemplo.com                      │  │
│  └─────────────────────────────┬────────────────────────────────────┘  │
│                                │                                        │
│    ┌───────────────────────────┼───────────────────────────────┐       │
│    │                           │                               │       │
│    ▼                           ▼                               ▼       │
│  ┌────────────────┐  ┌────────────────────┐  ┌────────────────────┐   │
│  │    Frontend    │  │    Supabase API    │  │  Edge Functions    │   │
│  │   Deployment   │  │    Deployment      │  │   Deployment       │   │
│  │   (3 replicas) │  │    (3 replicas)    │  │   (3 replicas)     │   │
│  └────────────────┘  └────────────────────┘  └────────────────────┘   │
│                                │                                        │
│                                ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      PostgreSQL StatefulSet                      │  │
│  │                 (Primary + Read Replicas + PgBouncer)            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Persistent Volumes                         │  │
│  │                    (Database, Storage, Backups)                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Instalação com Helm

### 1. Adicionar Repositórios

```bash
# Adicionar repo do TrustLayer
helm repo add trustlayer https://charts.trustlayer.io
helm repo update

# Adicionar dependências
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
```

### 2. Criar Namespace

```bash
kubectl create namespace trustlayer
kubectl config set-context --current --namespace=trustlayer
```

### 3. Criar Secrets

```bash
# Gerar secrets
kubectl create secret generic trustlayer-secrets \
  --from-literal=postgres-password=$(openssl rand -base64 32) \
  --from-literal=jwt-secret=$(openssl rand -base64 32) \
  --from-literal=anon-key=<seu-anon-key> \
  --from-literal=service-role-key=<seu-service-role-key>

# Secret para SMTP (opcional)
kubectl create secret generic smtp-secrets \
  --from-literal=smtp-password=<sua-senha-smtp>
```

### 4. Configurar Values

Crie `values.yaml`:

```yaml
# values.yaml
global:
  domain: trustlayer.exemplo.com
  storageClass: standard

# Frontend
frontend:
  replicaCount: 3
  image:
    repository: trustlayer/frontend
    tag: "1.2.0"
  resources:
    limits:
      cpu: "500m"
      memory: "512Mi"
    requests:
      cpu: "100m"
      memory: "128Mi"
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70

# Supabase
supabase:
  api:
    replicaCount: 3
    resources:
      limits:
        cpu: "1000m"
        memory: "1Gi"

  auth:
    replicaCount: 2
    config:
      disableSignup: true
      jwtExpiry: 3600

  functions:
    replicaCount: 3
    resources:
      limits:
        cpu: "500m"
        memory: "512Mi"

# PostgreSQL
postgresql:
  enabled: true
  architecture: replication
  primary:
    persistence:
      size: 100Gi
      storageClass: fast-ssd
    resources:
      limits:
        cpu: "2000m"
        memory: "4Gi"
  readReplicas:
    replicaCount: 2
    persistence:
      size: 100Gi

  # PgBouncer
  pgbouncer:
    enabled: true
    poolMode: transaction
    maxClientConn: 1000

# Ingress
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
  hosts:
    - host: trustlayer.exemplo.com
      paths:
        - path: /
          pathType: Prefix
    - host: api.trustlayer.exemplo.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: trustlayer-tls
      hosts:
        - trustlayer.exemplo.com
        - api.trustlayer.exemplo.com

# Monitoring
monitoring:
  enabled: true
  serviceMonitor:
    enabled: true
  prometheusRule:
    enabled: true

# Backup
backup:
  enabled: true
  schedule: "0 2 * * *"
  retention: 30
  s3:
    bucket: trustlayer-backups
    region: us-east-1
```

### 5. Instalar Chart

```bash
# Instalar TrustLayer
helm install trustlayer trustlayer/trustlayer \
  -f values.yaml \
  --namespace trustlayer \
  --wait

# Verificar instalação
kubectl get pods -n trustlayer
kubectl get svc -n trustlayer
kubectl get ingress -n trustlayer
```

## Manifests Kubernetes (Alternativa ao Helm)

### Namespace e RBAC

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: trustlayer
  labels:
    app.kubernetes.io/name: trustlayer
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: trustlayer
  namespace: trustlayer
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: trustlayer-role
  namespace: trustlayer
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: trustlayer-rolebinding
  namespace: trustlayer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: trustlayer-role
subjects:
  - kind: ServiceAccount
    name: trustlayer
    namespace: trustlayer
```

### Frontend Deployment

```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trustlayer-frontend
  namespace: trustlayer
  labels:
    app: trustlayer
    component: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: trustlayer
      component: frontend
  template:
    metadata:
      labels:
        app: trustlayer
        component: frontend
    spec:
      serviceAccountName: trustlayer
      containers:
        - name: frontend
          image: trustlayer/frontend:1.2.0
          ports:
            - containerPort: 8080
              name: http
          env:
            - name: VITE_SUPABASE_URL
              value: "https://api.trustlayer.exemplo.com"
            - name: VITE_SUPABASE_PUBLISHABLE_KEY
              valueFrom:
                secretKeyRef:
                  name: trustlayer-secrets
                  key: anon-key
          resources:
            limits:
              cpu: "500m"
              memory: "512Mi"
            requests:
              cpu: "100m"
              memory: "128Mi"
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: trustlayer
                    component: frontend
                topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: trustlayer-frontend
  namespace: trustlayer
spec:
  selector:
    app: trustlayer
    component: frontend
  ports:
    - port: 80
      targetPort: 8080
      name: http
  type: ClusterIP
```

### Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: trustlayer-frontend-hpa
  namespace: trustlayer
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: trustlayer-frontend
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
```

### Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: trustlayer-ingress
  namespace: trustlayer
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - trustlayer.exemplo.com
        - api.trustlayer.exemplo.com
      secretName: trustlayer-tls
  rules:
    - host: trustlayer.exemplo.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: trustlayer-frontend
                port:
                  number: 80
    - host: api.trustlayer.exemplo.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: trustlayer-api
                port:
                  number: 8000
```

### Network Policy

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: trustlayer-network-policy
  namespace: trustlayer
spec:
  podSelector:
    matchLabels:
      app: trustlayer
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
    - from:
        - podSelector:
            matchLabels:
              app: trustlayer
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: trustlayer
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

## Operações

### Escalar Manualmente

```bash
# Escalar frontend
kubectl scale deployment trustlayer-frontend --replicas=5

# Escalar API
kubectl scale deployment trustlayer-api --replicas=5
```

### Rolling Update

```bash
# Atualizar imagem
kubectl set image deployment/trustlayer-frontend \
  frontend=trustlayer/frontend:1.3.0

# Verificar rollout
kubectl rollout status deployment/trustlayer-frontend

# Rollback se necessário
kubectl rollout undo deployment/trustlayer-frontend
```

### Verificar Logs

```bash
# Logs de um pod
kubectl logs -f <pod-name>

# Logs de todos os pods de um deployment
kubectl logs -f deployment/trustlayer-frontend

# Logs anteriores (após restart)
kubectl logs <pod-name> --previous
```

## Monitoramento

### Prometheus ServiceMonitor

```yaml
# servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: trustlayer
  namespace: trustlayer
spec:
  selector:
    matchLabels:
      app: trustlayer
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
```

### Alertas

```yaml
# prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: trustlayer-alerts
  namespace: trustlayer
spec:
  groups:
    - name: trustlayer
      rules:
        - alert: TrustLayerHighErrorRate
          expr: |
            sum(rate(http_requests_total{app="trustlayer",status=~"5.."}[5m]))
            / sum(rate(http_requests_total{app="trustlayer"}[5m])) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "High error rate on TrustLayer"
            description: "Error rate is above 5% for 5 minutes"

        - alert: TrustLayerPodNotReady
          expr: |
            kube_pod_status_ready{namespace="trustlayer",condition="true"} == 0
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "TrustLayer pod not ready"
```

## Troubleshooting

### Pod não inicia

```bash
# Descrever pod
kubectl describe pod <pod-name>

# Ver eventos
kubectl get events --sort-by=.metadata.creationTimestamp

# Verificar recursos
kubectl top nodes
kubectl top pods
```

### Problemas de conectividade

```bash
# Testar DNS
kubectl run -it --rm debug --image=busybox -- nslookup trustlayer-frontend

# Testar conectividade
kubectl run -it --rm debug --image=curlimages/curl -- curl -v http://trustlayer-frontend
```

## Próximos Passos

1. [Configurar Ingress Controller](./load-balancer.md)
2. [Configurar cert-manager](./ssl-certificates.md)
3. [Configurar Backup](./backup-restore.md)
4. [Configurar Monitoramento](./logging-monitoring.md)

## Referências

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [cert-manager](https://cert-manager.io/docs/)

# Disaster Recovery - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia documenta os procedimentos de recuperação de desastres para o TrustLayer.

## Objetivos de Recuperação

| Métrica | Target | Crítico |
|---------|--------|---------|
| RTO (Recovery Time Objective) | < 1 hora | < 4 horas |
| RPO (Recovery Point Objective) | < 15 minutos | < 1 hora |
| MTTR (Mean Time To Recovery) | < 30 minutos | < 2 horas |

## Cenários de Desastre

### Classificação

| Nível | Descrição | Exemplo | Resposta |
|-------|-----------|---------|----------|
| 1 | Componente único | Pod crashed | Auto-recovery |
| 2 | Serviço | Database down | Manual intervention |
| 3 | Infraestrutura | AZ failure | Failover automático |
| 4 | Regional | Região indisponível | DR site activation |
| 5 | Catastrófico | Perda total de dados | Restore from backup |

## Arquitetura de DR

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Região Primária (us-east-1)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────┐  │
│  │   AZ-1      │  │   AZ-2      │  │          AZ-3                   │  │
│  │  Frontend   │  │  Frontend   │  │   Frontend                      │  │
│  │  API        │  │  API        │  │   API                           │  │
│  │  DB Primary │  │  DB Replica │  │   DB Replica                    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────────────────┘  │
└─────────┼────────────────┼───────────────────────────────────────────────┘
          │                │                    │
          └────────────────┼────────────────────┘
                           │
                    ┌──────┴──────┐
                    │ Replication │
                    │  (async)    │
                    └──────┬──────┘
                           │
┌─────────────────────────────────────────────────────────────────────────┐
│                         Região DR (us-west-2)                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        DR Site (Standby)                          │  │
│  │   Frontend (scaled down)                                          │  │
│  │   API (scaled down)                                               │  │
│  │   DB Replica (read-only)                                          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Procedimentos de Recuperação

### Nível 1: Recuperação de Componente

```bash
#!/bin/bash
# Kubernetes auto-recovery já deve tratar isso
# Manual intervention se necessário:

# Verificar pod
kubectl describe pod <pod-name> -n trustlayer

# Forçar reschedule
kubectl delete pod <pod-name> -n trustlayer

# Verificar logs
kubectl logs <pod-name> -n trustlayer --previous
```

### Nível 2: Recuperação de Serviço

#### Database Recovery

```bash
#!/bin/bash
# db-recovery.sh

echo "=== Database Recovery ==="

# 1. Verificar status
psql -h localhost -U postgres -c "SELECT pg_is_in_recovery();"

# 2. Se primary down, promover replica
# ATENÇÃO: Ação irreversível
# psql -h replica-host -U postgres -c "SELECT pg_promote();"

# 3. Atualizar connection strings
# kubectl set env deployment/trustlayer-api DATABASE_URL=postgresql://...

# 4. Verificar conectividade
psql -h localhost -U postgres -d trustlayer -c "SELECT 1;"

# 5. Verificar dados
psql -h localhost -U postgres -d trustlayer -c "SELECT COUNT(*) FROM profiles;"
```

#### API Recovery

```bash
#!/bin/bash
# api-recovery.sh

# 1. Verificar status
kubectl get pods -l app=trustlayer-api -n trustlayer

# 2. Reiniciar deployment
kubectl rollout restart deployment/trustlayer-api -n trustlayer

# 3. Escalar se necessário
kubectl scale deployment/trustlayer-api --replicas=5 -n trustlayer

# 4. Verificar health
kubectl exec -it deployment/trustlayer-api -n trustlayer -- curl -s localhost:8080/healthz
```

### Nível 3: Failover de AZ

```bash
#!/bin/bash
# az-failover.sh

AZ_FAILED="us-east-1a"

echo "=== AZ Failover: $AZ_FAILED ==="

# 1. Drenar nodes da AZ afetada
kubectl get nodes -l topology.kubernetes.io/zone=$AZ_FAILED -o name | \
  xargs -I {} kubectl drain {} --ignore-daemonsets --delete-emptydir-data

# 2. Verificar redistribuição de pods
kubectl get pods -n trustlayer -o wide

# 3. Promover replica de DB em outra AZ (se necessário)
# aws rds failover-db-cluster --db-cluster-identifier trustlayer

# 4. Atualizar DNS/Load Balancer (se necessário)
# aws elbv2 modify-target-group-attributes ...

# 5. Verificar serviços
curl -s https://trustlayer.exemplo.com/healthz
```

### Nível 4: Ativação do Site de DR

```bash
#!/bin/bash
# dr-site-activation.sh

echo "=== DR Site Activation ==="
echo "WARNING: This will activate the DR site and redirect traffic"
read -p "Are you sure? (yes/no): " confirm
[ "$confirm" != "yes" ] && exit 1

# 1. Promover database replica para primary
echo "Step 1: Promoting DR database..."
aws rds promote-read-replica --db-instance-identifier trustlayer-dr-replica

# 2. Aguardar promoção
echo "Waiting for database promotion..."
aws rds wait db-instance-available --db-instance-identifier trustlayer-dr-replica

# 3. Escalar DR site
echo "Step 2: Scaling DR site..."
kubectl --context=dr-cluster scale deployment/trustlayer-frontend --replicas=3 -n trustlayer
kubectl --context=dr-cluster scale deployment/trustlayer-api --replicas=5 -n trustlayer

# 4. Atualizar DNS
echo "Step 3: Updating DNS..."
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://dns-failover.json

# 5. Invalidar cache do CDN
echo "Step 4: Invalidating CDN cache..."
aws cloudfront create-invalidation \
  --distribution-id $CF_DISTRIBUTION_ID \
  --paths "/*"

# 6. Verificar
echo "Step 5: Verifying DR site..."
sleep 60  # Aguardar propagação DNS
curl -s https://trustlayer.exemplo.com/healthz

echo "DR site activated successfully"
```

### Nível 5: Restore from Backup

```bash
#!/bin/bash
# full-restore.sh

echo "=== Full Restore from Backup ==="
echo "WARNING: This will restore from backup. All data after backup will be lost."
read -p "Backup date (YYYYMMDD): " BACKUP_DATE
read -p "Confirm restore? (yes/no): " confirm
[ "$confirm" != "yes" ] && exit 1

BACKUP_PATH="s3://trustlayer-backups/$BACKUP_DATE"

# 1. Verificar backup
echo "Step 1: Verifying backup..."
aws s3 ls $BACKUP_PATH/ || { echo "Backup not found"; exit 1; }

# 2. Download backup
echo "Step 2: Downloading backup..."
aws s3 cp $BACKUP_PATH/database.sql.gz /tmp/
aws s3 sync $BACKUP_PATH/storage/ /tmp/storage/

# 3. Parar serviços
echo "Step 3: Stopping services..."
kubectl scale deployment --all --replicas=0 -n trustlayer

# 4. Restaurar banco
echo "Step 4: Restoring database..."
gunzip -c /tmp/database.sql.gz | psql -h localhost -U postgres trustlayer

# 5. Restaurar storage
echo "Step 5: Restoring storage..."
aws s3 sync /tmp/storage/ s3://trustlayer-storage/

# 6. Reiniciar serviços
echo "Step 6: Starting services..."
kubectl scale deployment/trustlayer-api --replicas=3 -n trustlayer
kubectl scale deployment/trustlayer-frontend --replicas=3 -n trustlayer

# 7. Verificar
echo "Step 7: Verifying restore..."
curl -s https://trustlayer.exemplo.com/healthz

echo "Restore completed"
```

## Runbook de Incidentes

### Estrutura do Runbook

```markdown
# Runbook: [Nome do Cenário]

## Classificação
- Severidade: P1/P2/P3/P4
- Impacto: Alto/Médio/Baixo
- Tempo estimado de resolução: X minutos

## Sintomas
- [ ] Sintoma 1
- [ ] Sintoma 2

## Diagnóstico
1. Verificar X
2. Verificar Y

## Resolução
1. Passo 1
2. Passo 2

## Verificação
- [ ] Serviço respondendo
- [ ] Métricas normais
- [ ] Usuários conseguem acessar

## Escalação
- Nível 1: SRE On-Call
- Nível 2: Engineering Lead
- Nível 3: CTO

## Post-Mortem
- [ ] Criar post-mortem doc
- [ ] Agendar review
- [ ] Implementar ações preventivas
```

### Runbook: Database Down

```markdown
# Runbook: Database Down

## Classificação
- Severidade: P1
- Impacto: Alto (sistema indisponível)
- Tempo estimado: 15-30 minutos

## Sintomas
- [ ] API retorna erro 500
- [ ] Logs mostram "connection refused"
- [ ] Health check do DB falha

## Diagnóstico
```bash
# Verificar status do container/pod
kubectl get pods -l app=trustlayer-db -n trustlayer

# Verificar logs
kubectl logs -l app=trustlayer-db -n trustlayer --tail=100

# Tentar conectar
psql -h localhost -U postgres -c "SELECT 1"
```

## Resolução

### Opção A: Restart
```bash
kubectl rollout restart deployment/trustlayer-db -n trustlayer
kubectl rollout status deployment/trustlayer-db -n trustlayer
```

### Opção B: Failover para replica
```bash
# Promover replica
psql -h replica-host -U postgres -c "SELECT pg_promote();"

# Atualizar connection string
kubectl set env deployment/trustlayer-api DATABASE_URL=postgresql://replica-host...
```

### Opção C: Restore from backup
```bash
./scripts/restore-database.sh
```

## Verificação
- [ ] `psql -c "SELECT 1"` retorna sucesso
- [ ] API health check OK
- [ ] Usuários conseguem fazer login

## Escalação
- 5 min: SRE On-Call
- 15 min: Database Admin
- 30 min: Engineering Lead
```

## Comunicação de Incidentes

### Template de Status

```markdown
## Incident: [Título]
**Status:** Investigating / Identified / Monitoring / Resolved
**Impact:** [Descrição do impacto]
**Start Time:** YYYY-MM-DD HH:MM UTC

### Timeline
- **HH:MM** - Incidente identificado
- **HH:MM** - Investigação iniciada
- **HH:MM** - Causa raiz identificada
- **HH:MM** - Fix aplicado
- **HH:MM** - Serviço restaurado

### Current Status
[Descrição do status atual]

### Next Update
Próxima atualização em XX minutos ou quando houver novidades.
```

### Canais de Comunicação

| Audiência | Canal | Frequência |
|-----------|-------|------------|
| Equipe técnica | Slack #incidents | Tempo real |
| Stakeholders | Email | A cada 30 min |
| Usuários | Status page | A cada 15 min |
| Executivos | Bridge call | Conforme necessário |

## Testes de DR

### Plano de Testes

| Teste | Frequência | Duração | Impacto |
|-------|------------|---------|---------|
| Backup restore | Mensal | 2h | Nenhum |
| Pod failure | Semanal | 5min | Nenhum |
| AZ failover | Trimestral | 1h | Mínimo |
| DR activation | Anual | 4h | Planejado |

### Script de Chaos Engineering

```bash
#!/bin/bash
# chaos-test.sh

echo "=== Chaos Engineering Test ==="

# 1. Matar pod aleatório
random_pod=$(kubectl get pods -n trustlayer -o name | shuf -n 1)
echo "Killing $random_pod..."
kubectl delete $random_pod -n trustlayer

# 2. Aguardar recuperação
sleep 30

# 3. Verificar
kubectl get pods -n trustlayer
curl -s https://trustlayer.exemplo.com/healthz

echo "Chaos test completed"
```

## Próximos Passos

1. [Backup e Restore](./backup-restore.md)
2. [Rotinas de Manutenção](./maintenance-routines.md)
3. [Troubleshooting](./troubleshooting.md)

## Referências

- [AWS Disaster Recovery](https://aws.amazon.com/disaster-recovery/)
- [Kubernetes High Availability](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/high-availability/)
- [PostgreSQL Replication](https://www.postgresql.org/docs/current/high-availability.html)

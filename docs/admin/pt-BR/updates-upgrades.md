# Atualizações e Upgrades - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre procedimentos de atualização e upgrade do TrustLayer.

## Política de Versionamento

### Semantic Versioning

```
MAJOR.MINOR.PATCH

Exemplo: 1.2.3
- MAJOR (1): Breaking changes
- MINOR (2): Novas features (backward compatible)
- PATCH (3): Bug fixes
```

### Suporte de Versões

| Versão | Status | Suporte até |
|--------|--------|-------------|
| 1.2.x | Current | - |
| 1.1.x | Maintained | 2026-06 |
| 1.0.x | Security only | 2026-03 |
| 0.x | EOL | - |

## Pré-Atualização

### Checklist

```markdown
## Checklist de Atualização

### Preparação
- [ ] Ler release notes
- [ ] Verificar breaking changes
- [ ] Verificar requisitos de sistema
- [ ] Planejar janela de manutenção
- [ ] Notificar usuários

### Backup
- [ ] Backup do banco de dados
- [ ] Backup de configurações
- [ ] Backup de arquivos de storage
- [ ] Testar restore do backup

### Ambiente de Staging
- [ ] Atualizar staging primeiro
- [ ] Executar testes funcionais
- [ ] Verificar migrations
- [ ] Validar integrações

### Produção
- [ ] Confirmar rollback plan
- [ ] Preparar comunicação de incidente
- [ ] Ter equipe de plantão
```

### Backup Antes da Atualização

```bash
#!/bin/bash
# pre-update-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/pre-update-$DATE"

mkdir -p $BACKUP_DIR

# Backup do banco
echo "Backing up database..."
pg_dump -h localhost -U postgres trustlayer | gzip > $BACKUP_DIR/database.sql.gz

# Backup de configurações
echo "Backing up configs..."
cp -r /etc/trustlayer $BACKUP_DIR/config
cp .env $BACKUP_DIR/

# Backup de storage
echo "Backing up storage..."
aws s3 sync s3://trustlayer-storage $BACKUP_DIR/storage/

# Salvar versão atual
echo "Current version: $(cat VERSION)" > $BACKUP_DIR/version.txt

echo "Backup completed: $BACKUP_DIR"
```

## Procedimentos de Atualização

### Docker Compose

```bash
#!/bin/bash
# update-docker.sh

# 1. Pull das novas imagens
docker compose pull

# 2. Verificar o que mudou
docker compose config

# 3. Parar serviços (se necessário para migrations)
docker compose down

# 4. Executar migrations
docker compose run --rm api npm run migrate

# 5. Iniciar com novas versões
docker compose up -d

# 6. Verificar saúde
docker compose ps
curl -s http://localhost:8080/healthz
```

### Kubernetes

```bash
#!/bin/bash
# update-k8s.sh

NAMESPACE="trustlayer"
NEW_VERSION="1.2.3"

# 1. Atualizar imagens no values
sed -i "s/tag:.*/tag: $NEW_VERSION/" helm/values.yaml

# 2. Dry run
helm upgrade trustlayer ./helm \
  --namespace $NAMESPACE \
  --dry-run --debug

# 3. Aplicar atualização
helm upgrade trustlayer ./helm \
  --namespace $NAMESPACE \
  --wait \
  --timeout 10m

# 4. Verificar rollout
kubectl rollout status deployment/trustlayer-frontend -n $NAMESPACE
kubectl rollout status deployment/trustlayer-api -n $NAMESPACE

# 5. Verificar pods
kubectl get pods -n $NAMESPACE

# 6. Verificar health
kubectl exec -it deployment/trustlayer-frontend -n $NAMESPACE -- curl -s localhost:8080/healthz
```

### Rolling Update (Zero Downtime)

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Criar 1 pod extra durante update
      maxUnavailable: 0  # Sempre manter todos os pods disponíveis
  template:
    spec:
      containers:
        - name: frontend
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
```

### Blue-Green Deployment

```bash
#!/bin/bash
# blue-green-deploy.sh

CURRENT_ENV=$(kubectl get svc trustlayer -o jsonpath='{.spec.selector.version}')
NEW_VERSION="1.2.3"

if [ "$CURRENT_ENV" == "blue" ]; then
  NEW_ENV="green"
else
  NEW_ENV="blue"
fi

echo "Deploying to $NEW_ENV environment..."

# 1. Deploy nova versão para ambiente inativo
kubectl apply -f deployment-$NEW_ENV.yaml
kubectl set image deployment/trustlayer-$NEW_ENV frontend=trustlayer/frontend:$NEW_VERSION

# 2. Aguardar pods prontos
kubectl rollout status deployment/trustlayer-$NEW_ENV

# 3. Executar smoke tests no novo ambiente
./smoke-tests.sh $NEW_ENV

# 4. Switch do tráfego
kubectl patch svc trustlayer -p "{\"spec\":{\"selector\":{\"version\":\"$NEW_ENV\"}}}"

# 5. Verificar
curl -s https://trustlayer.exemplo.com/healthz

echo "Traffic switched to $NEW_ENV"
```

## Database Migrations

### Executar Migrations

```bash
# Via Supabase CLI
npx supabase db push

# Via script direto
psql -h localhost -U postgres -d trustlayer -f migrations/001_add_column.sql

# Verificar status
npx supabase migration list
```

### Migration Segura

```sql
-- Exemplo de migration segura (non-blocking)

-- 1. Adicionar coluna como nullable primeiro
ALTER TABLE answers ADD COLUMN new_field TEXT;

-- 2. Backfill dados (em lotes)
DO $$
DECLARE
  batch_size INT := 1000;
  affected INT;
BEGIN
  LOOP
    UPDATE answers
    SET new_field = 'default_value'
    WHERE id IN (
      SELECT id FROM answers
      WHERE new_field IS NULL
      LIMIT batch_size
    );
    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
    PERFORM pg_sleep(0.1);  -- Pausar entre lotes
  END LOOP;
END $$;

-- 3. Adicionar constraint (após verificar dados)
ALTER TABLE answers ALTER COLUMN new_field SET NOT NULL;

-- 4. Adicionar índice concorrentemente (não bloqueia)
CREATE INDEX CONCURRENTLY idx_answers_new_field ON answers(new_field);
```

## Rollback

### Procedimento de Rollback

```bash
#!/bin/bash
# rollback.sh

PREVIOUS_VERSION="1.2.2"

echo "Rolling back to version $PREVIOUS_VERSION..."

# Docker Compose
docker compose down
docker compose pull  # Ou use tags específicas
docker compose up -d

# Kubernetes
kubectl rollout undo deployment/trustlayer-frontend -n trustlayer
kubectl rollout undo deployment/trustlayer-api -n trustlayer

# Helm
helm rollback trustlayer 1 -n trustlayer  # Rollback para revisão anterior

# Verificar
kubectl get pods -n trustlayer
curl -s https://trustlayer.exemplo.com/healthz
```

### Rollback de Migration

```sql
-- Sempre ter scripts de rollback
-- rollback_001.sql

-- Reverter índice
DROP INDEX CONCURRENTLY IF EXISTS idx_answers_new_field;

-- Reverter coluna
ALTER TABLE answers DROP COLUMN IF EXISTS new_field;
```

## Comunicação

### Template de Notificação

```markdown
## Manutenção Programada - TrustLayer

**Data:** 2026-01-25
**Horário:** 02:00 - 04:00 BRT
**Impacto:** Indisponibilidade total

### O que será feito
- Atualização para versão 1.2.3
- Melhorias de performance
- Correções de segurança

### Preparação recomendada
- Salvar trabalho em andamento
- Não iniciar novos assessments após 01:30

### Contato
- Em caso de problemas após a manutenção: support@trustlayer.exemplo.com
- Status: https://status.trustlayer.exemplo.com
```

## Monitoramento Pós-Atualização

```bash
#!/bin/bash
# post-update-check.sh

echo "=== Post-Update Health Check ==="

# Verificar versão
echo "Version:"
curl -s https://trustlayer.exemplo.com/api/version

# Verificar health
echo -e "\nHealth:"
curl -s https://trustlayer.exemplo.com/healthz

# Verificar métricas
echo -e "\nError rate (should be low):"
curl -s "http://prometheus:9090/api/v1/query?query=sum(rate(http_errors_total[5m]))"

# Verificar logs de erro
echo -e "\nRecent errors:"
kubectl logs -l app=trustlayer -n trustlayer --since=10m | grep -i error | tail -10
```

## Próximos Passos

1. [Migração de Versões](./version-migration.md)
2. [Disaster Recovery](./disaster-recovery.md)
3. [Troubleshooting](./troubleshooting.md)

## Referências

- [Kubernetes Rolling Updates](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)
- [Blue-Green Deployments](https://martinfowler.com/bliki/BlueGreenDeployment.html)
- [Database Migrations Best Practices](https://www.postgresql.org/docs/current/ddl-alter.html)

# Rotinas de Manutenção - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia documenta as rotinas de manutenção recomendadas para o TrustLayer.

## Calendário de Manutenção

| Frequência | Tarefa | Responsável |
|------------|--------|-------------|
| Diária | Health checks | Automático |
| Diária | Backup incremental | Automático |
| Semanal | Backup completo | Automático |
| Semanal | Vacuum analyze | Automático |
| Semanal | Revisão de logs | SRE |
| Mensal | Revisão de acessos | Security |
| Mensal | Teste de restore | SRE |
| Mensal | Atualização de dependências | Dev |
| Trimestral | Pentest interno | Security |
| Trimestral | DR drill | SRE |
| Anual | Auditoria de compliance | Compliance |

## Rotinas Diárias

### Health Check Automático

```bash
#!/bin/bash
# /opt/trustlayer/scripts/daily-health-check.sh

LOG_FILE="/var/log/trustlayer/health-check.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# 1. Verificar serviços
check_services() {
  services=("trustlayer-frontend" "trustlayer-api" "trustlayer-db")
  for svc in "${services[@]}"; do
    if docker ps | grep -q $svc; then
      log "✅ $svc: running"
    else
      log "❌ $svc: NOT running"
      alert "Service $svc is not running"
    fi
  done
}

# 2. Verificar endpoints
check_endpoints() {
  endpoints=(
    "https://trustlayer.exemplo.com/healthz"
    "https://api.trustlayer.exemplo.com/rest/v1/"
  )
  for endpoint in "${endpoints[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" $endpoint)
    if [ "$status" == "200" ]; then
      log "✅ $endpoint: $status"
    else
      log "❌ $endpoint: $status"
      alert "Endpoint $endpoint returned $status"
    fi
  done
}

# 3. Verificar espaço em disco
check_disk() {
  usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
  if [ $usage -gt 80 ]; then
    log "⚠️ Disk usage: $usage%"
    alert "Disk usage is $usage%"
  else
    log "✅ Disk usage: $usage%"
  fi
}

# 4. Verificar certificados
check_certs() {
  domains=("trustlayer.exemplo.com" "api.trustlayer.exemplo.com")
  for domain in "${domains[@]}"; do
    expiry=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    days_left=$(( ($(date -d "$expiry" +%s) - $(date +%s)) / 86400 ))
    if [ $days_left -lt 30 ]; then
      log "⚠️ $domain cert expires in $days_left days"
      alert "Certificate for $domain expires in $days_left days"
    else
      log "✅ $domain cert valid for $days_left days"
    fi
  done
}

# 5. Verificar conexões de banco
check_db_connections() {
  conn_count=$(psql -h localhost -U postgres -d trustlayer -t -c "SELECT count(*) FROM pg_stat_activity")
  max_conn=$(psql -h localhost -U postgres -d trustlayer -t -c "SHOW max_connections")
  usage=$((conn_count * 100 / max_conn))
  if [ $usage -gt 80 ]; then
    log "⚠️ DB connections: $conn_count/$max_conn ($usage%)"
  else
    log "✅ DB connections: $conn_count/$max_conn ($usage%)"
  fi
}

alert() {
  # Implementar notificação (Slack, email, PagerDuty)
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 TrustLayer Alert: $1\"}" \
    $SLACK_WEBHOOK_URL
}

# Executar
log "=== Starting daily health check ==="
check_services
check_endpoints
check_disk
check_certs
check_db_connections
log "=== Health check completed ==="
```

### Cron

```cron
# /etc/cron.d/trustlayer-maintenance

# Health check a cada 5 minutos
*/5 * * * * root /opt/trustlayer/scripts/daily-health-check.sh

# Backup incremental à meia-noite
0 0 * * * root /opt/trustlayer/scripts/backup-incremental.sh

# Limpeza de logs antigos às 3h
0 3 * * * root /opt/trustlayer/scripts/cleanup-logs.sh
```

## Rotinas Semanais

### Backup Completo

```bash
#!/bin/bash
# weekly-backup.sh

BACKUP_DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/weekly/$BACKUP_DATE"

mkdir -p $BACKUP_DIR

# Database dump
pg_dump -h localhost -U postgres trustlayer | gzip > $BACKUP_DIR/database.sql.gz

# Storage sync
aws s3 sync s3://trustlayer-storage $BACKUP_DIR/storage/

# Configurações
cp -r /etc/trustlayer $BACKUP_DIR/config/

# Upload para storage remoto
aws s3 sync $BACKUP_DIR s3://trustlayer-backups/weekly/$BACKUP_DATE/ \
  --storage-class STANDARD_IA

# Limpar backups locais antigos (manter 4 semanas)
find /backups/weekly -maxdepth 1 -type d -mtime +28 -exec rm -rf {} \;
```

### Vacuum e Analyze

```bash
#!/bin/bash
# weekly-vacuum.sh

echo "Starting weekly vacuum..."

psql -h localhost -U postgres -d trustlayer << EOF
-- Vacuum analyze em todas as tabelas
VACUUM ANALYZE;

-- Vacuum full em tabelas com muito bloat (com cuidado)
-- VACUUM FULL change_logs;

-- Reindex se necessário
-- REINDEX DATABASE trustlayer;

-- Estatísticas
SELECT relname, n_live_tup, n_dead_tup, last_vacuum, last_analyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;
EOF

echo "Vacuum completed"
```

### Revisão de Logs

```bash
#!/bin/bash
# weekly-log-review.sh

echo "=== Weekly Log Review ==="
echo "Period: $(date -d '7 days ago' +%Y-%m-%d) to $(date +%Y-%m-%d)"

# Top erros
echo -e "\n=== Top Errors ==="
docker logs trustlayer-api --since 7d 2>&1 | grep -i error | sort | uniq -c | sort -rn | head -20

# Requests lentos
echo -e "\n=== Slow Requests (>1s) ==="
docker logs trustlayer-api --since 7d 2>&1 | jq -r 'select(.duration_ms > 1000) | "\(.timestamp) \(.context.endpoint) \(.duration_ms)ms"' | head -20

# Falhas de login
echo -e "\n=== Failed Logins ==="
docker logs trustlayer-auth --since 7d 2>&1 | grep -i "login failed" | wc -l

# Alertas disparados
echo -e "\n=== Alerts Fired ==="
curl -s "http://alertmanager:9093/api/v2/alerts?silenced=false&inhibited=false" | jq -r '.[].labels.alertname' | sort | uniq -c
```

## Rotinas Mensais

### Revisão de Acessos

```sql
-- monthly-access-review.sql

-- Usuários inativos (30+ dias)
SELECT id, email, role, last_sign_in_at
FROM profiles
WHERE last_sign_in_at < NOW() - INTERVAL '30 days'
ORDER BY last_sign_in_at;

-- Usuários privilegiados
SELECT id, email, role, created_at, last_sign_in_at
FROM profiles
WHERE role IN ('admin', 'manager')
ORDER BY role, email;

-- Alterações de role no último mês
SELECT timestamp, user_id, details->>'old_role' as old_role, details->>'new_role' as new_role
FROM change_logs
WHERE event_type = 'user.role_changed'
AND timestamp > NOW() - INTERVAL '30 days';

-- Sessões ativas por usuário
SELECT p.email, COUNT(*) as active_sessions
FROM auth.sessions s
JOIN profiles p ON s.user_id = p.id
WHERE s.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.email
ORDER BY active_sessions DESC
LIMIT 20;
```

### Teste de Restore

```bash
#!/bin/bash
# monthly-restore-test.sh

echo "=== Monthly Restore Test ==="

# Criar ambiente de teste
docker compose -f docker-compose.restore-test.yml up -d

# Aguardar inicialização
sleep 30

# Restaurar último backup
LATEST_BACKUP=$(ls -t /backups/weekly/ | head -1)
gunzip -c /backups/weekly/$LATEST_BACKUP/database.sql.gz | \
  psql -h localhost -p 5433 -U postgres trustlayer_restore

# Verificar integridade
psql -h localhost -p 5433 -U postgres trustlayer_restore << EOF
SELECT COUNT(*) as profiles FROM profiles;
SELECT COUNT(*) as answers FROM answers;
SELECT COUNT(*) as change_logs FROM change_logs;
EOF

# Limpar
docker compose -f docker-compose.restore-test.yml down -v

echo "Restore test completed"
```

### Atualização de Dependências

```bash
#!/bin/bash
# monthly-deps-update.sh

cd /opt/trustlayer

# Verificar dependências desatualizadas
npm outdated

# Verificar vulnerabilidades
npm audit

# Atualizar patch versions
npm update

# Gerar relatório
npm audit --json > /reports/npm-audit-$(date +%Y%m).json

# Verificar imagens Docker
docker images --format "{{.Repository}}:{{.Tag}}" | while read image; do
  echo "Checking $image..."
  docker pull $image | grep -i "newer" && echo "Update available for $image"
done
```

## Rotinas Trimestrais

### DR Drill

```bash
#!/bin/bash
# quarterly-dr-drill.sh

echo "=== Quarterly DR Drill ==="
echo "Date: $(date)"

# 1. Simular failover para região secundária
echo "Step 1: Activating DR site..."
# aws rds promote-read-replica --db-instance-identifier trustlayer-replica

# 2. Verificar conectividade
echo "Step 2: Testing connectivity..."
curl -s https://dr.trustlayer.exemplo.com/healthz

# 3. Verificar dados
echo "Step 3: Verifying data..."
# Compare record counts between primary and DR

# 4. Testar funcionalidades críticas
echo "Step 4: Testing critical functions..."
# Run smoke tests against DR site

# 5. Documentar resultados
echo "Step 5: Documenting results..."

# 6. Failback
echo "Step 6: Failback to primary..."
```

### Pentest Interno

```markdown
## Checklist Pentest Interno

### Autenticação
- [ ] Teste de força bruta
- [ ] Teste de session hijacking
- [ ] Teste de password reset
- [ ] Teste de MFA bypass

### Autorização
- [ ] Teste de privilege escalation
- [ ] Teste de IDOR
- [ ] Teste de acesso entre tenants

### Injeção
- [ ] SQL injection
- [ ] XSS
- [ ] Command injection
- [ ] LDAP injection

### API
- [ ] Rate limiting
- [ ] Input validation
- [ ] Error handling
- [ ] CORS configuration

### Infraestrutura
- [ ] Port scanning
- [ ] SSL/TLS configuration
- [ ] Header security
- [ ] WAF bypass
```

## Scripts Utilitários

### Limpeza de Recursos

```bash
#!/bin/bash
# cleanup-resources.sh

echo "Cleaning up resources..."

# Docker
docker system prune -f
docker volume prune -f

# Logs antigos
find /var/log/trustlayer -type f -mtime +30 -delete

# Backups locais antigos
find /backups -type f -mtime +90 -delete

# Arquivos temporários
rm -rf /tmp/trustlayer-*

echo "Cleanup completed"
```

### Relatório de Status

```bash
#!/bin/bash
# generate-status-report.sh

cat << EOF
# TrustLayer Status Report
Generated: $(date)

## Services
$(docker compose ps)

## Resources
- CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%
- Memory: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')
- Disk: $(df -h / | awk 'NR==2{print $5}')

## Database
- Connections: $(psql -t -c "SELECT count(*) FROM pg_stat_activity")
- Size: $(psql -t -c "SELECT pg_size_pretty(pg_database_size('trustlayer'))")

## Recent Activity
- Users logged in today: $(psql -t -c "SELECT count(DISTINCT user_id) FROM change_logs WHERE event_type = 'auth.login' AND timestamp > CURRENT_DATE")
- Assessments completed today: $(psql -t -c "SELECT count(*) FROM change_logs WHERE event_type = 'assessment.submit' AND timestamp > CURRENT_DATE")

## Alerts (last 24h)
$(curl -s "http://alertmanager:9093/api/v2/alerts" | jq -r '.[].labels.alertname' | sort | uniq -c)

EOF
```

## Próximos Passos

1. [Disaster Recovery](./disaster-recovery.md)
2. [Backup e Restore](./backup-restore.md)
3. [Troubleshooting](./troubleshooting.md)

## Referências

- [PostgreSQL Maintenance](https://www.postgresql.org/docs/current/maintenance.html)
- [Docker System Prune](https://docs.docker.com/engine/reference/commandline/system_prune/)
- [Cron Syntax](https://crontab.guru/)

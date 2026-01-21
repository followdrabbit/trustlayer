# Políticas de Retenção de Dados - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia define as políticas de retenção de dados do TrustLayer, incluindo períodos de retenção, procedimentos de limpeza e conformidade com regulamentações.

## Políticas de Retenção

### Tabela de Retenção por Tipo de Dado

| Tipo de Dado | Período de Retenção | Justificativa | Ação após Período |
|--------------|---------------------|---------------|-------------------|
| Logs de Auditoria | 365 dias | Compliance/Forense | Arquivar ou deletar |
| Snapshots de Maturidade | 730 dias (2 anos) | Análise de tendências | Deletar |
| Métricas SIEM | 90 dias | Monitoramento | Deletar |
| Sessões de Usuário | 30 dias | Segurança | Deletar |
| Tokens de Recuperação | 24 horas | Segurança | Deletar |
| Arquivos Temporários | 7 dias | Processamento | Deletar |
| Backups | 90 dias | DR | Rotacionar |
| Respostas de Assessment | Indefinido* | Dados de negócio | Arquivar |
| Perfis de Usuário | Enquanto ativo | Operacional | Anonimizar |

*Respostas podem ser arquivadas após inatividade prolongada.

## Variáveis de Ambiente

```env
# Períodos de retenção (dias)
RETENTION_CHANGE_LOGS_DAYS=365
RETENTION_SNAPSHOTS_DAYS=730
RETENTION_SIEM_METRICS_DAYS=90
RETENTION_SESSIONS_DAYS=30
RETENTION_TEMP_FILES_DAYS=7

# Modo de execução
RETENTION_APPLY=false  # true para executar deleções
RETENTION_DRY_RUN=true  # apenas simular
```

## Script de Limpeza

### cleanup-retention.sh

```bash
#!/bin/bash
# /opt/trustlayer/scripts/cleanup-retention.sh

set -euo pipefail

# Configuração
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-trustlayer}"
DB_USER="${DB_USER:-trustlayer_service}"

# Períodos de retenção
CHANGE_LOGS_DAYS="${RETENTION_CHANGE_LOGS_DAYS:-365}"
SNAPSHOTS_DAYS="${RETENTION_SNAPSHOTS_DAYS:-730}"
SIEM_METRICS_DAYS="${RETENTION_SIEM_METRICS_DAYS:-90}"

# Modo
DRY_RUN="${RETENTION_DRY_RUN:-true}"
APPLY="${RETENTION_APPLY:-false}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

run_sql() {
  local sql="$1"
  local description="$2"

  if [ "$DRY_RUN" = "true" ]; then
    log "[DRY-RUN] $description"
    log "SQL: $sql"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "EXPLAIN $sql"
  elif [ "$APPLY" = "true" ]; then
    log "[APPLY] $description"
    result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql" 2>&1)
    log "Result: $result"
  else
    log "[SKIP] $description - Set RETENTION_APPLY=true to execute"
  fi
}

# Contagem antes da limpeza
count_before() {
  log "=== Contagem de registros antes da limpeza ==="

  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
    SELECT 'change_logs' as table_name,
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE timestamp < NOW() - INTERVAL '${CHANGE_LOGS_DAYS} days') as to_delete
    FROM change_logs
    UNION ALL
    SELECT 'maturity_snapshots',
           COUNT(*),
           COUNT(*) FILTER (WHERE snapshot_date < NOW() - INTERVAL '${SNAPSHOTS_DAYS} days')
    FROM maturity_snapshots
    UNION ALL
    SELECT 'siem_metrics',
           COUNT(*),
           COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '${SIEM_METRICS_DAYS} days')
    FROM siem_metrics;
EOF
}

# Limpeza de logs de auditoria
cleanup_change_logs() {
  run_sql "
    DELETE FROM change_logs
    WHERE timestamp < NOW() - INTERVAL '${CHANGE_LOGS_DAYS} days'
  " "Deletando logs de auditoria com mais de ${CHANGE_LOGS_DAYS} dias"
}

# Limpeza de snapshots
cleanup_snapshots() {
  run_sql "
    DELETE FROM maturity_snapshots
    WHERE snapshot_date < NOW() - INTERVAL '${SNAPSHOTS_DAYS} days'
  " "Deletando snapshots com mais de ${SNAPSHOTS_DAYS} dias"
}

# Limpeza de métricas SIEM
cleanup_siem_metrics() {
  run_sql "
    DELETE FROM siem_metrics
    WHERE created_at < NOW() - INTERVAL '${SIEM_METRICS_DAYS} days'
  " "Deletando métricas SIEM com mais de ${SIEM_METRICS_DAYS} dias"
}

# Limpeza de sessões expiradas
cleanup_sessions() {
  run_sql "
    DELETE FROM auth.sessions
    WHERE created_at < NOW() - INTERVAL '30 days'
  " "Deletando sessões expiradas"
}

# Vacuum após deleção
vacuum_tables() {
  if [ "$APPLY" = "true" ]; then
    log "Executando VACUUM ANALYZE..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
      VACUUM ANALYZE change_logs;
      VACUUM ANALYZE maturity_snapshots;
      VACUUM ANALYZE siem_metrics;
    "
  fi
}

# Main
main() {
  log "=== Iniciando script de retenção de dados ==="
  log "Modo: DRY_RUN=$DRY_RUN, APPLY=$APPLY"

  count_before

  cleanup_change_logs
  cleanup_snapshots
  cleanup_siem_metrics
  cleanup_sessions

  vacuum_tables

  log "=== Script de retenção concluído ==="
}

main "$@"
```

### Permissões e Agendamento

```bash
# Dar permissão de execução
chmod +x /opt/trustlayer/scripts/cleanup-retention.sh

# Agendar execução diária (2h da manhã)
echo "0 2 * * * root RETENTION_APPLY=true /opt/trustlayer/scripts/cleanup-retention.sh >> /var/log/trustlayer/retention.log 2>&1" | sudo tee /etc/cron.d/trustlayer-retention
```

## Arquivamento

### Política de Arquivamento

Dados que precisam ser mantidos por mais tempo para compliance mas não precisam de acesso frequente podem ser arquivados.

```sql
-- Criar tabela de arquivo
CREATE TABLE change_logs_archive (
  LIKE change_logs INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Mover dados antigos para arquivo
INSERT INTO change_logs_archive
SELECT * FROM change_logs
WHERE timestamp < NOW() - INTERVAL '365 days';

-- Deletar da tabela principal
DELETE FROM change_logs
WHERE timestamp < NOW() - INTERVAL '365 days';
```

### Exportação para Storage Frio

```bash
#!/bin/bash
# archive-to-s3.sh

ARCHIVE_DATE=$(date -d "1 year ago" +%Y-%m-%d)
BUCKET="trustlayer-archive"

# Exportar logs antigos
psql -h localhost -U trustlayer_service -d trustlayer -c "
  COPY (
    SELECT * FROM change_logs
    WHERE timestamp < '${ARCHIVE_DATE}'
  ) TO STDOUT WITH CSV HEADER
" | gzip | aws s3 cp - "s3://${BUCKET}/change_logs/${ARCHIVE_DATE}.csv.gz" \
  --storage-class GLACIER

# Deletar após arquivar com sucesso
if [ $? -eq 0 ]; then
  psql -h localhost -U trustlayer_service -d trustlayer -c "
    DELETE FROM change_logs WHERE timestamp < '${ARCHIVE_DATE}'
  "
fi
```

## Anonimização

### Usuários Inativos

```sql
-- Anonimizar usuários inativos por mais de 2 anos
UPDATE profiles
SET
  email = 'anonymized_' || id || '@deleted.local',
  name = 'Usuário Removido',
  phone = NULL,
  department = NULL,
  avatar_url = NULL,
  updated_at = NOW()
WHERE id IN (
  SELECT p.id
  FROM profiles p
  LEFT JOIN auth.sessions s ON s.user_id = p.id
  WHERE p.last_sign_in_at < NOW() - INTERVAL '2 years'
    OR (p.last_sign_in_at IS NULL AND p.created_at < NOW() - INTERVAL '2 years')
);

-- Desativar contas
UPDATE auth.users
SET
  email = 'anonymized_' || id || '@deleted.local',
  encrypted_password = '',
  banned_until = 'infinity'
WHERE id IN (
  SELECT id FROM profiles
  WHERE email LIKE 'anonymized_%@deleted.local'
);
```

### LGPD/GDPR - Direito ao Esquecimento

```sql
-- Função para anonimizar dados de um usuário específico
CREATE OR REPLACE FUNCTION anonymize_user(user_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Anonimizar perfil
  UPDATE profiles
  SET
    email = 'deleted_' || user_uuid || '@anonymized.local',
    name = 'Usuário Removido',
    phone = NULL,
    department = NULL,
    avatar_url = NULL,
    voice_profile = NULL
  WHERE id = user_uuid;

  -- Anonimizar respostas (manter para estatísticas)
  UPDATE answers
  SET
    evidence = 'Dados removidos por solicitação do usuário',
    notes = NULL
  WHERE user_id = user_uuid;

  -- Manter logs de auditoria mas anonimizar PII
  UPDATE change_logs
  SET
    details = jsonb_set(
      details,
      '{user_info}',
      '{"anonymized": true}'::jsonb
    )
  WHERE user_id = user_uuid;

  -- Desativar conta
  UPDATE auth.users
  SET
    email = 'deleted_' || user_uuid || '@anonymized.local',
    encrypted_password = '',
    email_confirmed_at = NULL,
    banned_until = 'infinity'
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Uso:
-- SELECT anonymize_user('user-uuid-here');
```

## Compliance

### LGPD

| Requisito | Implementação |
|-----------|---------------|
| Consentimento | Aceite de termos no cadastro |
| Portabilidade | Export de dados via Settings |
| Esquecimento | Função `anonymize_user()` |
| Acesso | Logs de auditoria |
| Minimização | Coleta apenas dados necessários |

### SOC 2

| Controle | Implementação |
|----------|---------------|
| CC6.1 | Logs de auditoria 365 dias |
| CC6.2 | Backups criptografados |
| CC6.3 | Acesso baseado em roles |
| CC7.1 | Monitoramento contínuo |
| CC7.2 | Alertas de anomalias |

## Monitoramento

### Métricas de Retenção

```sql
-- View de estatísticas de retenção
CREATE VIEW retention_stats AS
SELECT
  'change_logs' as table_name,
  COUNT(*) as total_records,
  MIN(timestamp) as oldest_record,
  MAX(timestamp) as newest_record,
  pg_size_pretty(pg_total_relation_size('change_logs')) as table_size
FROM change_logs
UNION ALL
SELECT
  'maturity_snapshots',
  COUNT(*),
  MIN(snapshot_date),
  MAX(snapshot_date),
  pg_size_pretty(pg_total_relation_size('maturity_snapshots'))
FROM maturity_snapshots
UNION ALL
SELECT
  'siem_metrics',
  COUNT(*),
  MIN(created_at),
  MAX(created_at),
  pg_size_pretty(pg_total_relation_size('siem_metrics'))
FROM siem_metrics;
```

### Alertas

```yaml
# alerts.yaml
groups:
  - name: retention_alerts
    rules:
      - alert: RetentionJobFailed
        expr: retention_job_last_success_timestamp < (time() - 86400 * 2)
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Retention job not running"

      - alert: TableSizeGrowth
        expr: pg_table_size_bytes{table="change_logs"} > 10737418240  # 10GB
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "change_logs table exceeds 10GB"
```

## Troubleshooting

### Verificar dados pendentes de limpeza

```sql
-- Dados a serem limpos
SELECT
  'change_logs' as table,
  COUNT(*) as records_to_delete,
  pg_size_pretty(SUM(pg_column_size(change_logs.*))) as estimated_size
FROM change_logs
WHERE timestamp < NOW() - INTERVAL '365 days'
UNION ALL
SELECT
  'maturity_snapshots',
  COUNT(*),
  pg_size_pretty(SUM(pg_column_size(maturity_snapshots.*)))
FROM maturity_snapshots
WHERE snapshot_date < NOW() - INTERVAL '730 days';
```

### Executar limpeza manual

```bash
# Dry run primeiro
RETENTION_DRY_RUN=true RETENTION_APPLY=false ./cleanup-retention.sh

# Executar de verdade
RETENTION_DRY_RUN=false RETENTION_APPLY=true ./cleanup-retention.sh
```

## Próximos Passos

1. [Backup e Restore](./backup-restore.md)
2. [Auditoria e Compliance](./audit-compliance.md)
3. [Disaster Recovery](./disaster-recovery.md)

## Referências

- [LGPD - Lei Geral de Proteção de Dados](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [GDPR Guidelines](https://gdpr.eu/)
- [PostgreSQL VACUUM](https://www.postgresql.org/docs/current/routine-vacuuming.html)

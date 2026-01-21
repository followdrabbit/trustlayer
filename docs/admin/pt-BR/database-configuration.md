# Configuração de Banco de Dados - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a configuração, otimização e manutenção do PostgreSQL para o TrustLayer.

## Requisitos

### Versão Suportada

- **PostgreSQL**: 15.x ou superior
- **Extensões obrigatórias**: `uuid-ossp`, `pgcrypto`, `pgjwt`

### Hardware Recomendado

| Ambiente | CPU | RAM | Disco |
|----------|-----|-----|-------|
| Dev/Teste | 2 cores | 4GB | 50GB SSD |
| Staging | 4 cores | 8GB | 100GB SSD |
| Produção | 8+ cores | 32GB+ | 500GB+ NVMe |

## Instalação

### PostgreSQL Standalone

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15

# CentOS/RHEL
sudo dnf install postgresql15-server postgresql15-contrib
sudo postgresql-setup --initdb

# Iniciar serviço
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### Docker

```bash
docker run -d \
  --name trustlayer-db \
  -e POSTGRES_PASSWORD=sua-senha-forte \
  -e POSTGRES_DB=trustlayer \
  -v pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15
```

### Supabase Local

```bash
npx supabase start

# Credenciais padrão:
# Host: localhost
# Port: 54322
# User: postgres
# Password: postgres
# Database: postgres
```

## Configuração Inicial

### 1. Criar Banco e Usuário

```sql
-- Conectar como superuser
sudo -u postgres psql

-- Criar usuário da aplicação
CREATE USER trustlayer_app WITH PASSWORD 'senha-app-forte';

-- Criar usuário de serviço (para migrations)
CREATE USER trustlayer_service WITH PASSWORD 'senha-service-forte';

-- Criar banco de dados
CREATE DATABASE trustlayer OWNER trustlayer_service;

-- Conectar ao banco
\c trustlayer

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- Configurar schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS realtime;

-- Conceder permissões
GRANT USAGE ON SCHEMA public, auth, storage TO trustlayer_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trustlayer_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trustlayer_app;

-- Default privileges para novas tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO trustlayer_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO trustlayer_app;
```

### 2. Executar Migrations

```bash
# Via Supabase CLI
npx supabase db push

# Ou diretamente
psql -h localhost -U trustlayer_service -d trustlayer \
  -f supabase/migrations/001_initial_schema.sql
```

## Configuração do postgresql.conf

### Conexões

```ini
# Conexões
max_connections = 200
superuser_reserved_connections = 3

# Connection pooling (usar com PgBouncer)
# max_connections = 50  # Reduzir se usando pooler
```

### Memória

```ini
# Memória compartilhada (25% da RAM)
shared_buffers = 8GB

# Memória de trabalho (RAM / max_connections / 4)
work_mem = 64MB

# Memória para manutenção
maintenance_work_mem = 2GB

# Cache do sistema
effective_cache_size = 24GB  # 75% da RAM
```

### Write-Ahead Log (WAL)

```ini
# WAL
wal_level = replica
max_wal_size = 4GB
min_wal_size = 1GB
wal_compression = on

# Checkpoints
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min

# Archive (para backup)
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
```

### Query Planner

```ini
# Planner
random_page_cost = 1.1  # SSD
effective_io_concurrency = 200  # SSD
default_statistics_target = 100

# Parallel queries
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4
```

### Logging

```ini
# Logging
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB

# O que logar
log_min_duration_statement = 1000  # Queries > 1s
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0

# Formato
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

### Autovacuum

```ini
# Autovacuum
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.05
autovacuum_vacuum_cost_delay = 2ms
```

## Configuração do pg_hba.conf

```ini
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             postgres                                peer
local   all             all                                     md5

# IPv4 local connections
host    all             all             127.0.0.1/32            scram-sha-256

# IPv4 from application servers
host    trustlayer      trustlayer_app  10.0.0.0/8              scram-sha-256
host    trustlayer      trustlayer_app  172.16.0.0/12           scram-sha-256

# Replication
host    replication     replicator      10.0.0.0/8              scram-sha-256

# Deny all others
host    all             all             0.0.0.0/0               reject
```

## Connection Pooling com PgBouncer

### Instalação

```bash
sudo apt install pgbouncer
```

### Configuração

```ini
# /etc/pgbouncer/pgbouncer.ini

[databases]
trustlayer = host=localhost port=5432 dbname=trustlayer

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt

# Pool settings
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3

# Timeouts
server_idle_timeout = 600
client_idle_timeout = 0
server_connect_timeout = 15
server_login_retry = 15
query_timeout = 120
query_wait_timeout = 60

# Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
stats_period = 60

# Admin
admin_users = postgres
stats_users = monitoring
```

### userlist.txt

```
"trustlayer_app" "SCRAM-SHA-256$4096:salt$stored-key:server-key"
```

Gerar hash:

```bash
psql -h localhost -U postgres -c "SELECT concat('\"', usename, '\" \"', passwd, '\"') FROM pg_shadow WHERE usename = 'trustlayer_app';"
```

## Row Level Security (RLS)

### Habilitar RLS

```sql
-- Habilitar em tabelas sensíveis
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_questions ENABLE ROW LEVEL SECURITY;

-- Forçar RLS para owner também
ALTER TABLE answers FORCE ROW LEVEL SECURITY;
```

### Políticas de Acesso

```sql
-- Usuários só veem seus próprios dados
CREATE POLICY "Users can view own answers"
  ON answers FOR SELECT
  USING (auth.uid() = user_id);

-- Admins podem ver tudo
CREATE POLICY "Admins can view all answers"
  ON answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert policy
CREATE POLICY "Users can insert own answers"
  ON answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update policy com restrição de role
CREATE POLICY "Non-viewers can update own answers"
  ON answers FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'analyst', 'user')
    )
  );
```

## Índices Recomendados

```sql
-- Índices para performance
CREATE INDEX CONCURRENTLY idx_answers_user_domain
  ON answers (user_id, security_domain);

CREATE INDEX CONCURRENTLY idx_answers_question
  ON answers (question_id);

CREATE INDEX CONCURRENTLY idx_snapshots_user_date
  ON maturity_snapshots (user_id, snapshot_date DESC);

CREATE INDEX CONCURRENTLY idx_change_logs_user_timestamp
  ON change_logs (user_id, timestamp DESC);

CREATE INDEX CONCURRENTLY idx_change_logs_entity
  ON change_logs (entity_type, entity_id);

-- Índice parcial para registros ativos
CREATE INDEX CONCURRENTLY idx_active_questions
  ON default_questions (domain_id)
  WHERE is_active = true;

-- Índice GIN para busca full-text
CREATE INDEX CONCURRENTLY idx_questions_search
  ON default_questions
  USING GIN (to_tsvector('portuguese', question_text));
```

## Monitoramento

### Queries de Diagnóstico

```sql
-- Conexões ativas
SELECT count(*), state, usename, application_name
FROM pg_stat_activity
GROUP BY state, usename, application_name
ORDER BY count DESC;

-- Queries lentas ativas
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '1 minute'
  AND state != 'idle';

-- Tamanho das tabelas
SELECT relname AS table,
       pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
       pg_size_pretty(pg_relation_size(relid)) AS table_size,
       pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;

-- Uso de índices
SELECT relname, indexrelname,
       idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;

-- Cache hit ratio
SELECT sum(heap_blks_read) as heap_read,
       sum(heap_blks_hit) as heap_hit,
       sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;

-- Lock waiting
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity
  ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity
  ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

### Métricas para Prometheus

```sql
-- Exportar via pg_exporter
SELECT
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') AS active_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') AS idle_connections,
  (SELECT sum(xact_commit) FROM pg_stat_database) AS transactions_committed,
  (SELECT sum(xact_rollback) FROM pg_stat_database) AS transactions_rolled_back,
  (SELECT sum(blks_read) FROM pg_stat_database) AS blocks_read,
  (SELECT sum(blks_hit) FROM pg_stat_database) AS blocks_hit;
```

## Manutenção

### Rotinas Diárias

```bash
#!/bin/bash
# daily-maintenance.sh

# Analyze para atualizar estatísticas
psql -U postgres -d trustlayer -c "ANALYZE;"

# Reindex em horário de baixo uso
psql -U postgres -d trustlayer -c "REINDEX DATABASE trustlayer;"
```

### Rotinas Semanais

```bash
#!/bin/bash
# weekly-maintenance.sh

# Vacuum completo
psql -U postgres -d trustlayer -c "VACUUM ANALYZE;"

# Verificar bloat
psql -U postgres -d trustlayer -c "
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
       pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 20;"
```

## Troubleshooting

### Conexões esgotadas

```sql
-- Verificar conexões
SELECT count(*), usename, application_name, client_addr
FROM pg_stat_activity
GROUP BY usename, application_name, client_addr
ORDER BY count DESC;

-- Terminar conexões idle antigas
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < now() - interval '1 hour';
```

### Queries lentas

```sql
-- Habilitar pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top queries por tempo
SELECT query, calls, total_exec_time, mean_exec_time, rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

### Locks

```sql
-- Identificar locks
SELECT locktype, relation::regclass, mode, granted, pid
FROM pg_locks
WHERE NOT granted;

-- Matar query bloqueadora
SELECT pg_terminate_backend(<pid>);
```

## Próximos Passos

1. [Backup e Restore](./backup-restore.md)
2. [Performance Tuning](./performance-tuning.md)
3. [Replicação](./disaster-recovery.md)

## Referências

- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [PgBouncer Documentation](https://www.pgbouncer.org/)
- [Supabase Database](https://supabase.com/docs/guides/database)

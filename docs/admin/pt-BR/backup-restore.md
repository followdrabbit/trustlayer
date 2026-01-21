---
profile: admin
language: pt-BR
version: 1.2.0
last_updated: 2026-01-20
---

# Backup e Restore

## Visao Geral

Este guia descreve os procedimentos de backup e restore para o TrustLayer, incluindo banco de dados PostgreSQL, arquivos de storage e configuracoes.

## Publico-Alvo

- Administradores de banco de dados
- DevOps engineers
- Equipe de operacoes

---

## 1. Estrategia de Backup

### 1.1 Componentes a Fazer Backup

| Componente | Tipo | Frequencia | Retencao |
|------------|------|------------|----------|
| PostgreSQL | Full dump | Diario | 30 dias |
| PostgreSQL | WAL (PITR) | Continuo | 7 dias |
| Storage (arquivos) | Incremental | Diario | 30 dias |
| Configuracoes | Snapshot | Semanal | 90 dias |

### 1.2 Janela de Backup

- **Backup completo**: 02:00 - 04:00 (horario de menor uso)
- **Backup incremental**: A cada 6 horas
- **WAL archiving**: Continuo

---

## 2. Backup do PostgreSQL

### 2.1 Backup Manual com pg_dump

```bash
# Backup completo
pg_dump -h localhost -U postgres -d trustlayer \
  --format=custom \
  --compress=9 \
  -f backup_$(date +%Y%m%d_%H%M%S).dump

# Backup apenas schema
pg_dump -h localhost -U postgres -d trustlayer \
  --schema-only \
  -f schema_$(date +%Y%m%d).sql

# Backup apenas dados
pg_dump -h localhost -U postgres -d trustlayer \
  --data-only \
  -f data_$(date +%Y%m%d).dump
```

### 2.2 Backup Automatizado (Script)

```bash
#!/bin/bash
# /opt/trustlayer/scripts/backup.sh

set -e

# Configuracoes
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-trustlayer}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/trustlayer}"
S3_BUCKET="${S3_BUCKET:-trustlayer-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Data/hora
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="trustlayer_${TIMESTAMP}.dump"

# Criar diretorio se nao existir
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup..."

# Executar pg_dump
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --format=custom \
  --compress=9 \
  -f "$BACKUP_DIR/$BACKUP_FILE"

echo "[$(date)] Backup local criado: $BACKUP_FILE"

# Upload para S3 (opcional)
if [ -n "$S3_BUCKET" ]; then
  aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/db/$BACKUP_FILE"
  echo "[$(date)] Upload para S3 concluido"
fi

# Limpar backups antigos
find "$BACKUP_DIR" -name "trustlayer_*.dump" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Backups antigos removidos (> $RETENTION_DAYS dias)"

echo "[$(date)] Backup concluido com sucesso!"
```

### 2.3 Configurando Cron

```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diario as 02:00)
0 2 * * * /opt/trustlayer/scripts/backup.sh >> /var/log/trustlayer/backup.log 2>&1
```

### 2.4 WAL Archiving (Point-in-Time Recovery)

**postgresql.conf:**
```ini
# WAL Archiving
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f'
archive_timeout = 60
```

**Upload WAL para S3:**
```ini
archive_command = '/opt/trustlayer/scripts/archive_wal.sh %p %f'
```

```bash
#!/bin/bash
# /opt/trustlayer/scripts/archive_wal.sh

WAL_PATH=$1
WAL_FILE=$2
S3_BUCKET="${S3_BUCKET:-trustlayer-backups}"

aws s3 cp "$WAL_PATH" "s3://$S3_BUCKET/wal/$WAL_FILE"
```

---

## 3. Backup do Supabase Storage

### 3.1 Listando Buckets

```bash
# Via Supabase CLI
supabase storage ls

# Buckets tipicos:
# - avatars (fotos de perfil)
# - evidence (evidencias de controles)
# - reports (relatorios gerados)
```

### 3.2 Backup Manual

```bash
#!/bin/bash
# /opt/trustlayer/scripts/backup_storage.sh

SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
BACKUP_DIR="/var/backups/trustlayer/storage"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR/$TIMESTAMP"

# Listar e baixar arquivos de cada bucket
for bucket in avatars evidence reports; do
  echo "Backing up bucket: $bucket"

  # Listar arquivos
  curl -s -H "Authorization: Bearer $SUPABASE_KEY" \
    "$SUPABASE_URL/storage/v1/bucket/$bucket/objects" \
    | jq -r '.[].name' > "$BACKUP_DIR/$TIMESTAMP/${bucket}_files.txt"

  # Baixar cada arquivo
  while read -r file; do
    curl -s -H "Authorization: Bearer $SUPABASE_KEY" \
      "$SUPABASE_URL/storage/v1/object/$bucket/$file" \
      -o "$BACKUP_DIR/$TIMESTAMP/$bucket/$file"
  done < "$BACKUP_DIR/$TIMESTAMP/${bucket}_files.txt"
done

# Comprimir
tar -czf "$BACKUP_DIR/storage_${TIMESTAMP}.tar.gz" -C "$BACKUP_DIR" "$TIMESTAMP"
rm -rf "$BACKUP_DIR/$TIMESTAMP"

echo "Storage backup completed: storage_${TIMESTAMP}.tar.gz"
```

---

## 4. Restore do PostgreSQL

### 4.1 Restore Completo

```bash
# Parar aplicacao
docker-compose stop frontend

# Dropar e recriar database (CUIDADO!)
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS trustlayer;"
psql -h localhost -U postgres -c "CREATE DATABASE trustlayer;"

# Restaurar backup
pg_restore -h localhost -U postgres -d trustlayer \
  --verbose \
  --clean \
  --if-exists \
  backup_20260120_020000.dump

# Verificar integridade
psql -h localhost -U postgres -d trustlayer -c "SELECT COUNT(*) FROM answers;"

# Reiniciar aplicacao
docker-compose start frontend
```

### 4.2 Restore Parcial (Tabela Especifica)

```bash
# Listar conteudo do backup
pg_restore --list backup.dump

# Restaurar apenas tabela 'answers'
pg_restore -h localhost -U postgres -d trustlayer \
  --table=answers \
  --data-only \
  backup.dump
```

### 4.3 Point-in-Time Recovery (PITR)

```bash
# 1. Parar PostgreSQL
sudo systemctl stop postgresql

# 2. Restaurar base backup
rm -rf /var/lib/postgresql/data/*
pg_restore --target=/var/lib/postgresql/data/ base_backup.tar

# 3. Criar recovery.conf (PostgreSQL 12+: use postgresql.conf)
cat > /var/lib/postgresql/data/postgresql.auto.conf << EOF
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
recovery_target_time = '2026-01-20 10:30:00'
EOF

# 4. Criar signal file
touch /var/lib/postgresql/data/recovery.signal

# 5. Iniciar PostgreSQL
sudo systemctl start postgresql

# 6. Verificar recovery
psql -U postgres -c "SELECT pg_is_in_recovery();"
```

---

## 5. Restore do Storage

### 5.1 Restore Completo

```bash
#!/bin/bash

BACKUP_FILE="storage_20260120_020000.tar.gz"
BACKUP_DIR="/var/backups/trustlayer/storage"
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# Extrair backup
tar -xzf "$BACKUP_DIR/$BACKUP_FILE" -C /tmp/

# Upload para cada bucket
TIMESTAMP=$(basename "$BACKUP_FILE" .tar.gz | sed 's/storage_//')

for bucket in avatars evidence reports; do
  echo "Restoring bucket: $bucket"

  for file in /tmp/$TIMESTAMP/$bucket/*; do
    filename=$(basename "$file")

    curl -X POST \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "Content-Type: application/octet-stream" \
      --data-binary @"$file" \
      "$SUPABASE_URL/storage/v1/object/$bucket/$filename"
  done
done

# Limpar arquivos temporarios
rm -rf /tmp/$TIMESTAMP

echo "Storage restore completed!"
```

---

## 6. Verificacao de Backup

### 6.1 Teste de Integridade

```bash
#!/bin/bash
# /opt/trustlayer/scripts/verify_backup.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: $0 <backup_file>"
  exit 1
fi

echo "Verificando backup: $BACKUP_FILE"

# Verificar se arquivo existe e nao esta corrompido
pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "[OK] Backup valido"
else
  echo "[ERRO] Backup corrompido ou invalido"
  exit 1
fi

# Contar objetos no backup
TABLES=$(pg_restore --list "$BACKUP_FILE" | grep -c "TABLE DATA")
INDEXES=$(pg_restore --list "$BACKUP_FILE" | grep -c "INDEX")

echo "Conteudo do backup:"
echo "  - Tabelas: $TABLES"
echo "  - Indices: $INDEXES"

# Verificar tamanho
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "  - Tamanho: $SIZE"
```

### 6.2 Restore de Teste (Ambiente Separado)

```bash
#!/bin/bash
# Restaurar em database de teste

TEST_DB="trustlayer_test_restore"

# Criar database de teste
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;"
psql -h localhost -U postgres -c "CREATE DATABASE $TEST_DB;"

# Restaurar
pg_restore -h localhost -U postgres -d "$TEST_DB" backup.dump

# Verificar contagens
psql -h localhost -U postgres -d "$TEST_DB" << EOF
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'answers', COUNT(*) FROM answers
UNION ALL
SELECT 'change_logs', COUNT(*) FROM change_logs;
EOF

# Limpar
psql -h localhost -U postgres -c "DROP DATABASE $TEST_DB;"
```

---

## 7. Backup em Kubernetes

### 7.1 CronJob de Backup

```yaml
# k8s/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: trustlayer-db-backup
spec:
  schedule: "0 2 * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - |
              TIMESTAMP=$(date +%Y%m%d_%H%M%S)
              FILENAME="trustlayer_${TIMESTAMP}.dump"

              pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
                --format=custom --compress=9 \
                -f /backup/$FILENAME

              # Upload to S3
              aws s3 cp /backup/$FILENAME s3://$S3_BUCKET/db/$FILENAME

              # Cleanup old local backups
              find /backup -name "trustlayer_*.dump" -mtime +7 -delete
            env:
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: trustlayer-db
                  key: host
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: trustlayer-db
                  key: username
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: trustlayer-db
                  key: password
            - name: DB_NAME
              value: trustlayer
            - name: S3_BUCKET
              value: trustlayer-backups
            - name: AWS_ACCESS_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: aws-credentials
                  key: access-key
            - name: AWS_SECRET_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: aws-credentials
                  key: secret-key
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

---

## 8. Disaster Recovery

### 8.1 RPO e RTO

| Metrica | Alvo | Descricao |
|---------|------|-----------|
| **RPO** | 1 hora | Maximo de dados perdidos |
| **RTO** | 4 horas | Tempo para restaurar servico |

### 8.2 Procedimento de DR

1. **Detectar falha**
   - Alertas automaticos
   - Verificacao manual

2. **Avaliar impacto**
   - Determinar escopo da falha
   - Identificar ultimo backup valido

3. **Restaurar infraestrutura**
   - Provisionar recursos (se necessario)
   - Restaurar configuracoes

4. **Restaurar dados**
   - Restaurar PostgreSQL
   - Restaurar Storage
   - Verificar integridade

5. **Validar restauracao**
   - Testar funcionalidades criticas
   - Verificar dados

6. **Retomar operacoes**
   - Redirecionar trafego
   - Notificar usuarios

---

## 9. Monitoramento de Backups

### 9.1 Alertas

Configure alertas para:
- Falha de backup
- Backup atrasado (> 24h)
- Espaco de armazenamento baixo
- Falha no upload para S3

### 9.2 Metricas

| Metrica | Descricao |
|---------|-----------|
| `backup_last_success_timestamp` | Timestamp do ultimo backup bem-sucedido |
| `backup_duration_seconds` | Duracao do backup |
| `backup_size_bytes` | Tamanho do backup |
| `backup_s3_upload_success` | Upload para S3 bem-sucedido |

---

## 10. Checklist de Backup

### Diario
- [ ] Verificar se backup diario foi executado
- [ ] Verificar upload para storage remoto
- [ ] Verificar espaco disponivel

### Semanal
- [ ] Testar restore em ambiente isolado
- [ ] Verificar integridade dos backups
- [ ] Revisar logs de backup

### Mensal
- [ ] Simular cenario de DR
- [ ] Revisar politica de retencao
- [ ] Atualizar documentacao se necessario

---

## Referencias

- [Instalacao On-Premises](installation-on-prem.md)
- [Troubleshooting](troubleshooting.md)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)

---

*Ultima atualizacao: 20 de Janeiro de 2026*

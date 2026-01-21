# Migração de Versões - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre migrações entre versões major do TrustLayer.

## Guias de Migração

### v0.x → v1.0

#### Breaking Changes

1. **Arquitetura Modular** (ADR-0024)
   - Estrutura de pastas reorganizada
   - Novos módulos: `ModuleLoader`, `EventBus`, `ServiceRegistry`

2. **Autenticação**
   - SSO/SAML agora obrigatório em produção
   - MFA disponível (TOTP, WebAuthn)

3. **Database**
   - Novas tabelas: `dashboard_layouts`, `report_schedules`
   - RLS policies atualizadas

#### Procedimento

```bash
#!/bin/bash
# migrate-0x-to-1x.sh

echo "=== Migração v0.x → v1.0 ==="

# 1. Backup
./backup-full.sh

# 2. Parar serviços
docker compose down

# 3. Executar migrations de banco
psql -f migrations/0_to_1/001_new_schema.sql
psql -f migrations/0_to_1/002_migrate_data.sql
psql -f migrations/0_to_1/003_update_rls.sql

# 4. Atualizar configurações
cp .env .env.backup
./scripts/migrate-env-0-to-1.sh

# 5. Pull novas imagens
docker compose pull

# 6. Iniciar
docker compose up -d

# 7. Verificar
./post-migration-check.sh
```

### v1.0 → v1.1

#### Changes

1. **Reports Module** (ADR-0026)
   - Novo sistema de relatórios
   - Agendamento de relatórios

2. **UX Enhancements** (ADR-0027)
   - Sistema de temas
   - Animações

#### Procedimento

```bash
# Atualização simples - sem breaking changes
docker compose pull
docker compose up -d
```

### v1.1 → v1.2

#### Changes

1. **Audit & Forensics** (ADR-0028)
   - Device fingerprinting
   - Anomaly detection

2. **Custom Dashboards**
   - Widget catalog
   - Layout builder

#### Procedimento

```sql
-- Migrations necessárias
-- 1. Tabela de device fingerprints
CREATE TABLE device_fingerprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  fingerprint JSONB NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  trust_score INTEGER DEFAULT 50
);

-- 2. Tabela de anomalias
CREATE TABLE security_anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  anomaly_type TEXT NOT NULL,
  details JSONB NOT NULL,
  risk_score INTEGER NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

-- 3. Dashboard layouts
CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dashboard_type TEXT NOT NULL,
  layout JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Data Migration Scripts

### Migrar Dados de Respostas

```sql
-- Migrar formato antigo de respostas
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM answers_old LOOP
    INSERT INTO answers (
      id, user_id, question_id, answer, evidence, notes, created_at, updated_at
    ) VALUES (
      r.id,
      r.user_id,
      r.question_id,
      CASE r.response
        WHEN 'yes' THEN 'Sim'
        WHEN 'partial' THEN 'Parcial'
        WHEN 'no' THEN 'Não'
        ELSE 'NA'
      END,
      r.evidence_text,
      r.comments,
      r.created_at,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;
```

### Migrar Perfis de Usuário

```sql
-- Adicionar novos campos a perfis existentes
UPDATE profiles
SET
  role = COALESCE(role, 'user'),
  mfa_enabled = COALESCE(mfa_enabled, false),
  theme_preference = COALESCE(theme_preference, 'system'),
  language = COALESCE(language, 'pt-BR')
WHERE role IS NULL OR mfa_enabled IS NULL;
```

### Migrar Configurações

```bash
#!/bin/bash
# migrate-env.sh

# Mapear variáveis antigas para novas
sed -i 's/SUPABASE_URL/VITE_SUPABASE_URL/g' .env
sed -i 's/SUPABASE_KEY/VITE_SUPABASE_ANON_KEY/g' .env

# Adicionar novas variáveis obrigatórias
cat >> .env << EOF

# Novas variáveis v1.2
VITE_OTEL_ENABLED=true
VITE_OTEL_ENDPOINT=http://localhost:4318
RETENTION_CHANGE_LOGS_DAYS=365
EOF
```

## Validação de Migração

### Checklist de Validação

```markdown
## Validação Pós-Migração

### Database
- [ ] Todas as tabelas existem
- [ ] Índices criados corretamente
- [ ] RLS policies ativas
- [ ] Dados migrados corretamente

### Aplicação
- [ ] Login funcionando
- [ ] Assessments carregam
- [ ] Dashboards renderizam
- [ ] Relatórios exportam

### Integrações
- [ ] SSO funciona
- [ ] SIEM recebe eventos
- [ ] Email envia

### Performance
- [ ] Latência aceitável
- [ ] Sem erros no log
- [ ] Uso de recursos normal
```

### Script de Validação

```bash
#!/bin/bash
# validate-migration.sh

echo "=== Validação de Migração ==="

# 1. Verificar tabelas
echo -e "\n=== Verificando tabelas ==="
psql -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public'" | grep -E "answers|profiles|change_logs"

# 2. Verificar RLS
echo -e "\n=== Verificando RLS ==="
psql -c "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'"

# 3. Verificar contagem de dados
echo -e "\n=== Contagem de registros ==="
psql -c "SELECT 'profiles' as table, COUNT(*) FROM profiles UNION ALL SELECT 'answers', COUNT(*) FROM answers"

# 4. Testar API
echo -e "\n=== Testando API ==="
curl -s https://trustlayer.exemplo.com/healthz | jq

# 5. Verificar logs de erro
echo -e "\n=== Erros recentes ==="
docker logs trustlayer-api 2>&1 | grep -i error | tail -5

echo -e "\n=== Validação completa ==="
```

## Rollback de Migração

### Plano de Rollback

```bash
#!/bin/bash
# rollback-migration.sh

VERSION_FROM="1.2"
VERSION_TO="1.1"

echo "Rolling back from $VERSION_FROM to $VERSION_TO..."

# 1. Parar serviços
docker compose down

# 2. Restaurar banco
gunzip -c /backups/pre-migration/database.sql.gz | psql -h localhost -U postgres trustlayer

# 3. Restaurar configurações
cp /backups/pre-migration/.env .env

# 4. Iniciar versão anterior
docker compose -f docker-compose.v1.1.yml up -d

# 5. Verificar
./validate-migration.sh
```

## Troubleshooting de Migração

### Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| Migration falha | Constraint violada | Limpar dados inconsistentes |
| Performance degradada | Índices faltando | Criar índices necessários |
| RLS bloqueia acesso | Policy incorreta | Verificar conditions |
| Dados faltando | Script de migração incompleto | Rodar script de correção |

### Correção de Dados

```sql
-- Encontrar registros órfãos
SELECT a.* FROM answers a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE p.id IS NULL;

-- Corrigir timestamps inválidos
UPDATE change_logs
SET timestamp = created_at
WHERE timestamp IS NULL;

-- Regenerar índices
REINDEX TABLE answers;
```

## Próximos Passos

1. [Atualizações e Upgrades](./updates-upgrades.md)
2. [Disaster Recovery](./disaster-recovery.md)
3. [Troubleshooting](./troubleshooting.md)

## Referências

- [Supabase Migrations](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

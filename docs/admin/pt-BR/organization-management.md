# Gerenciamento de Organizações - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre o gerenciamento de organizações (tenants) no TrustLayer.

## Conceitos

### Multi-Tenancy

O TrustLayer suporta isolamento multi-tenant onde:
- Cada organização tem seus próprios dados isolados
- Usuários pertencem a uma organização
- Administradores podem gerenciar múltiplas organizações

### Hierarquia

```
Organization (Tenant)
├── Users
│   ├── Admin
│   ├── Manager
│   ├── Analyst
│   ├── Auditor
│   └── Viewer
├── Assessments
├── Frameworks (custom)
├── Settings
└── Integrations
```

## Criar Organização

### Via Admin Console

1. Acesse `/admin/organizations`
2. Clique em **"Nova Organização"**
3. Preencha os dados:
   - Nome da organização
   - Domínio (ex: acme.com)
   - Plano/Tier
   - Admin inicial

### Via API

```bash
curl -X POST "https://api.trustlayer.exemplo.com/rest/v1/organizations" \
  -H "Authorization: Bearer $SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "domain": "acme.com",
    "plan": "enterprise",
    "admin_email": "admin@acme.com",
    "settings": {
      "mfa_required": true,
      "sso_enabled": false
    }
  }'
```

### Via SQL

```sql
-- Criar organização
INSERT INTO organizations (id, name, domain, plan, created_at)
VALUES (
  uuid_generate_v4(),
  'Acme Corp',
  'acme.com',
  'enterprise',
  NOW()
);

-- Criar admin da organização
INSERT INTO profiles (id, email, organization_id, role, created_at)
VALUES (
  uuid_generate_v4(),
  'admin@acme.com',
  (SELECT id FROM organizations WHERE domain = 'acme.com'),
  'admin',
  NOW()
);
```

## Configurações de Organização

### Segurança

```json
{
  "security": {
    "mfa_required": true,
    "mfa_methods": ["totp", "webauthn"],
    "password_policy": {
      "min_length": 12,
      "require_uppercase": true,
      "require_numbers": true,
      "require_symbols": true,
      "max_age_days": 90
    },
    "session": {
      "idle_timeout_minutes": 30,
      "max_duration_hours": 8,
      "concurrent_sessions": 3
    },
    "ip_whitelist": ["10.0.0.0/8", "192.168.1.0/24"]
  }
}
```

### Funcionalidades

```json
{
  "features": {
    "ai_assistant": true,
    "voice_commands": true,
    "siem_integration": true,
    "custom_frameworks": true,
    "scheduled_reports": true,
    "api_access": true
  }
}
```

### Limites

```json
{
  "limits": {
    "max_users": 100,
    "max_assessments": 1000,
    "max_storage_gb": 50,
    "api_rate_limit": 1000,
    "retention_days": 365
  }
}
```

## Gerenciar Usuários da Organização

### Listar Usuários

```sql
SELECT
  p.id,
  p.email,
  p.name,
  p.role,
  p.mfa_enabled,
  p.last_sign_in_at,
  p.created_at
FROM profiles p
WHERE p.organization_id = 'org-uuid'
ORDER BY p.created_at DESC;
```

### Adicionar Usuário

```bash
# Via CLI
npm run provision:user -- \
  --email user@acme.com \
  --organization acme.com \
  --role analyst
```

### Alterar Role

```sql
-- Apenas super-admins podem fazer isso
UPDATE profiles
SET role = 'manager', updated_at = NOW()
WHERE id = 'user-uuid'
AND organization_id = 'org-uuid';

-- Log da alteração
INSERT INTO change_logs (event_type, user_id, details, timestamp)
VALUES (
  'user.role_changed',
  'admin-user-uuid',
  '{"target_user": "user-uuid", "old_role": "analyst", "new_role": "manager"}',
  NOW()
);
```

### Remover Usuário

```sql
-- Soft delete (recomendado)
UPDATE profiles
SET
  deactivated_at = NOW(),
  deactivated_by = 'admin-uuid'
WHERE id = 'user-uuid';

-- Revogar sessões
DELETE FROM auth.sessions
WHERE user_id = 'user-uuid';
```

## SSO por Organização

### Configurar SAML

```sql
INSERT INTO organization_sso_configs (
  organization_id,
  provider,
  enabled,
  config
) VALUES (
  'org-uuid',
  'saml',
  true,
  '{
    "entity_id": "https://idp.acme.com",
    "sso_url": "https://idp.acme.com/sso/saml",
    "certificate": "-----BEGIN CERTIFICATE-----...",
    "attribute_mapping": {
      "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      "name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
    }
  }'
);
```

### Configurar OIDC

```sql
INSERT INTO organization_sso_configs (
  organization_id,
  provider,
  enabled,
  config
) VALUES (
  'org-uuid',
  'oidc',
  true,
  '{
    "issuer": "https://login.acme.com",
    "client_id": "trustlayer-client",
    "client_secret": "secret:oidc-client-secret",
    "scopes": ["openid", "profile", "email"],
    "auto_provision": true,
    "default_role": "analyst"
  }'
);
```

## Auditoria por Organização

### Logs de Atividade

```sql
-- Atividades da organização
SELECT
  cl.timestamp,
  p.email as user_email,
  cl.event_type,
  cl.details
FROM change_logs cl
JOIN profiles p ON cl.user_id = p.id
WHERE p.organization_id = 'org-uuid'
ORDER BY cl.timestamp DESC
LIMIT 100;
```

### Relatório de Uso

```sql
-- Estatísticas da organização
SELECT
  (SELECT COUNT(*) FROM profiles WHERE organization_id = 'org-uuid') as total_users,
  (SELECT COUNT(*) FROM profiles WHERE organization_id = 'org-uuid' AND last_sign_in_at > NOW() - INTERVAL '30 days') as active_users,
  (SELECT COUNT(*) FROM answers a JOIN profiles p ON a.user_id = p.id WHERE p.organization_id = 'org-uuid') as total_answers,
  (SELECT COUNT(*) FROM maturity_snapshots ms JOIN profiles p ON ms.user_id = p.id WHERE p.organization_id = 'org-uuid') as total_snapshots;
```

## Migração de Organização

### Exportar Dados

```bash
#!/bin/bash
# export-org-data.sh

ORG_ID=$1
EXPORT_DIR="/exports/$ORG_ID"

mkdir -p $EXPORT_DIR

# Exportar perfis
psql -c "COPY (SELECT * FROM profiles WHERE organization_id = '$ORG_ID') TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/profiles.csv

# Exportar respostas
psql -c "COPY (SELECT a.* FROM answers a JOIN profiles p ON a.user_id = p.id WHERE p.organization_id = '$ORG_ID') TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/answers.csv

# Exportar configurações
psql -c "SELECT config FROM organizations WHERE id = '$ORG_ID'" -t > $EXPORT_DIR/config.json

# Compactar
tar -czf $EXPORT_DIR.tar.gz $EXPORT_DIR
```

### Importar Dados

```bash
#!/bin/bash
# import-org-data.sh

IMPORT_FILE=$1
NEW_ORG_ID=$2

# Extrair
tar -xzf $IMPORT_FILE -C /tmp/

# Importar perfis (com novo org_id)
psql -c "COPY profiles_import FROM '/tmp/profiles.csv' CSV HEADER"
psql -c "UPDATE profiles_import SET organization_id = '$NEW_ORG_ID'"
psql -c "INSERT INTO profiles SELECT * FROM profiles_import ON CONFLICT DO NOTHING"

# Importar respostas
# ... similar process
```

## Desativação de Organização

### Procedimento

```sql
-- 1. Desativar usuários
UPDATE profiles
SET deactivated_at = NOW()
WHERE organization_id = 'org-uuid';

-- 2. Revogar sessões
DELETE FROM auth.sessions
WHERE user_id IN (
  SELECT id FROM profiles WHERE organization_id = 'org-uuid'
);

-- 3. Marcar organização como inativa
UPDATE organizations
SET
  status = 'inactive',
  deactivated_at = NOW()
WHERE id = 'org-uuid';

-- 4. Agendar exclusão de dados (conforme política de retenção)
INSERT INTO scheduled_tasks (task_type, target_id, scheduled_for)
VALUES ('org_data_deletion', 'org-uuid', NOW() + INTERVAL '90 days');
```

## Próximos Passos

1. [Gerenciamento de Usuários](./user-management.md)
2. [SSO Integration](./sso-integration.md)
3. [Auditoria e Compliance](./audit-compliance.md)

## Referências

- [Multi-Tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

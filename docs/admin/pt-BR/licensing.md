# Licenciamento - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre o sistema de licenciamento do TrustLayer.

## Tipos de Licença

### Community (Open Source)

| Recurso | Incluído |
|---------|----------|
| Assessments | ✅ Ilimitado |
| Usuários | ✅ Até 5 |
| Domínios | ✅ AI Security apenas |
| Dashboards | ✅ Básicos |
| Reports | ✅ HTML apenas |
| Suporte | ❌ Comunidade |

### Professional

| Recurso | Incluído |
|---------|----------|
| Assessments | ✅ Ilimitado |
| Usuários | ✅ Até 25 |
| Domínios | ✅ Todos |
| Dashboards | ✅ Todos |
| Reports | ✅ PDF, HTML, Excel |
| AI Assistant | ✅ |
| Suporte | ✅ Email (48h) |

### Enterprise

| Recurso | Incluído |
|---------|----------|
| Assessments | ✅ Ilimitado |
| Usuários | ✅ Ilimitado |
| Domínios | ✅ Todos + Custom |
| Dashboards | ✅ Todos + Custom |
| Reports | ✅ Todos + Scheduling |
| AI Assistant | ✅ + Custom Models |
| SSO/SAML | ✅ |
| Audit Logs | ✅ 365 dias |
| SLA | ✅ 99.9% |
| Suporte | ✅ 24/7 + CSM |

## Gerenciamento de Licenças

### Verificar Licença Atual

```bash
# Via CLI
npm run license:status

# Via API
curl -X GET "https://api.trustlayer.exemplo.com/rest/v1/license" \
  -H "Authorization: Bearer $TOKEN"
```

### Estrutura da Licença

```json
{
  "license_id": "lic-uuid-123",
  "organization_id": "org-uuid-456",
  "type": "enterprise",
  "status": "active",
  "features": {
    "max_users": -1,
    "domains": ["ai-security", "cloud-security", "devsecops", "custom"],
    "sso_enabled": true,
    "audit_retention_days": 365,
    "custom_frameworks": true,
    "scheduled_reports": true,
    "api_access": true
  },
  "issued_at": "2026-01-01T00:00:00Z",
  "expires_at": "2027-01-01T00:00:00Z",
  "signature": "base64-signature..."
}
```

### Aplicar Nova Licença

```bash
# Via CLI
npm run license:apply -- --file license.key

# Via API
curl -X POST "https://api.trustlayer.exemplo.com/rest/v1/license" \
  -H "Authorization: Bearer $SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Via SQL

```sql
-- Inserir licença
INSERT INTO licenses (
  id, organization_id, license_key, license_type, features, expires_at, created_at
) VALUES (
  uuid_generate_v4(),
  'org-uuid',
  'encrypted-license-key',
  'enterprise',
  '{"max_users": -1, "sso_enabled": true}',
  '2027-01-01',
  NOW()
);

-- Verificar licença
SELECT
  l.license_type,
  l.features,
  l.expires_at,
  l.expires_at < NOW() as is_expired
FROM licenses l
WHERE l.organization_id = 'org-uuid'
ORDER BY l.created_at DESC
LIMIT 1;
```

## Verificação de Licença

### No Código

```typescript
// src/lib/license/check.ts
import { supabase } from '@/integrations/supabase/client';

interface LicenseInfo {
  type: 'community' | 'professional' | 'enterprise';
  features: Record<string, any>;
  isExpired: boolean;
  expiresAt: Date;
}

export async function checkLicense(orgId: string): Promise<LicenseInfo> {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return {
      type: 'community',
      features: COMMUNITY_FEATURES,
      isExpired: false,
      expiresAt: new Date('2099-12-31'),
    };
  }

  return {
    type: data.license_type,
    features: data.features,
    isExpired: new Date(data.expires_at) < new Date(),
    expiresAt: new Date(data.expires_at),
  };
}

export function hasFeature(license: LicenseInfo, feature: string): boolean {
  if (license.isExpired) return false;
  return license.features[feature] === true || license.features[feature] === -1;
}
```

### Hook de Licença

```typescript
// src/hooks/useLicense.ts
import { useQuery } from '@tanstack/react-query';
import { checkLicense } from '@/lib/license/check';
import { useOrganization } from './useOrganization';

export function useLicense() {
  const { organizationId } = useOrganization();

  const { data: license, isLoading } = useQuery({
    queryKey: ['license', organizationId],
    queryFn: () => checkLicense(organizationId),
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  return {
    license,
    isLoading,
    isEnterprise: license?.type === 'enterprise',
    isProfessional: license?.type === 'professional' || license?.type === 'enterprise',
    hasFeature: (feature: string) => hasFeature(license, feature),
  };
}
```

### Componente de Feature Gate

```typescript
// src/components/FeatureGate.tsx
import { useLicense } from '@/hooks/useLicense';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature, isLoading } = useLicense();

  if (isLoading) return null;

  if (!hasFeature(feature)) {
    return fallback || <UpgradePrompt feature={feature} />;
  }

  return <>{children}</>;
}

// Uso
<FeatureGate feature="scheduled_reports">
  <ScheduledReportsPanel />
</FeatureGate>
```

## Alertas de Licença

### Expiração Próxima

```sql
-- Licenças expirando em 30 dias
SELECT
  o.name as organization,
  l.license_type,
  l.expires_at,
  l.expires_at - NOW() as days_remaining
FROM licenses l
JOIN organizations o ON l.organization_id = o.id
WHERE l.expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days';
```

### Limite de Usuários

```sql
-- Organizações próximas do limite
SELECT
  o.name,
  l.features->>'max_users' as max_users,
  COUNT(p.id) as current_users,
  COUNT(p.id)::float / (l.features->>'max_users')::int * 100 as usage_percent
FROM organizations o
JOIN licenses l ON l.organization_id = o.id
JOIN profiles p ON p.organization_id = o.id
WHERE (l.features->>'max_users')::int > 0
GROUP BY o.name, l.features->>'max_users'
HAVING COUNT(p.id)::float / (l.features->>'max_users')::int > 0.8;
```

## Renovação de Licença

### Processo

1. **Notificação**: 30 dias antes da expiração
2. **Lembrete**: 7 dias antes da expiração
3. **Grace Period**: 14 dias após expiração (funcionalidade limitada)
4. **Downgrade**: Após grace period, downgrade para Community

### Script de Verificação

```bash
#!/bin/bash
# check-license-expiry.sh

# Verificar licenças expirando
psql -t -c "
SELECT json_agg(json_build_object(
  'org_name', o.name,
  'org_email', o.admin_email,
  'license_type', l.license_type,
  'expires_at', l.expires_at,
  'days_remaining', EXTRACT(DAY FROM l.expires_at - NOW())
))
FROM licenses l
JOIN organizations o ON l.organization_id = o.id
WHERE l.expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'
" | jq -r '.[] | @json' | while read license; do
  # Enviar notificação
  org_email=$(echo $license | jq -r '.org_email')
  days=$(echo $license | jq -r '.days_remaining')

  if [ $days -le 7 ]; then
    ./send-urgent-renewal-notice.sh "$org_email" "$license"
  else
    ./send-renewal-reminder.sh "$org_email" "$license"
  fi
done
```

## Auditoria de Licença

```sql
-- Histórico de licenças
SELECT
  l.id,
  l.license_type,
  l.created_at as applied_at,
  l.expires_at,
  cl.timestamp as change_time,
  cl.details
FROM licenses l
LEFT JOIN change_logs cl ON cl.details->>'license_id' = l.id::text
WHERE l.organization_id = 'org-uuid'
ORDER BY l.created_at DESC;

-- Uso de features por organização
SELECT
  o.name,
  l.license_type,
  (SELECT COUNT(*) FROM profiles WHERE organization_id = o.id) as users,
  (SELECT COUNT(*) FROM answers a JOIN profiles p ON a.user_id = p.id WHERE p.organization_id = o.id) as assessments,
  (SELECT COUNT(*) FROM report_schedules WHERE organization_id = o.id) as scheduled_reports
FROM organizations o
JOIN licenses l ON l.organization_id = o.id;
```

## Contato Comercial

Para upgrade ou renovação de licença:
- **Email**: sales@trustlayer.exemplo.com
- **Portal**: https://trustlayer.exemplo.com/pricing
- **Partner Portal**: https://partners.trustlayer.exemplo.com

## Próximos Passos

1. [Configuração de Módulos](./module-configuration.md)
2. [Gerenciamento de Organizações](./organization-management.md)
3. [Suporte](../../user/pt-BR/support.md)

## Referências

- [Pricing Page](https://trustlayer.exemplo.com/pricing)
- [Feature Comparison](https://trustlayer.exemplo.com/features)
- [Enterprise Agreement](https://trustlayer.exemplo.com/legal/enterprise)

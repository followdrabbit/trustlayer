# Configuração de Módulos - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a configuração e gerenciamento dos módulos do TrustLayer.

## Arquitetura Modular (ADR-0024)

O TrustLayer utiliza uma arquitetura modular que permite:
- Habilitar/desabilitar módulos por organização
- Configurar permissões por módulo
- Adicionar módulos customizados

### Módulos Disponíveis

| Módulo | Descrição | Default |
|--------|-----------|---------|
| `governance` | Assessments, Dashboards, Reports | ✅ Habilitado |
| `risk-management` | Gestão de Riscos | ⚙️ Opcional |
| `compliance` | Gestão de Compliance | ⚙️ Opcional |
| `asset-management` | Inventário de Ativos | ⚙️ Opcional |
| `incident-response` | Resposta a Incidentes | ⚙️ Opcional |
| `vendor-management` | Gestão de Fornecedores | ⚙️ Opcional |

## Estrutura de Módulo

```
src/modules/governance/
├── manifest.ts          # Configuração do módulo
├── pages/               # Páginas do módulo
│   ├── Assessment.tsx
│   ├── DashboardExecutive.tsx
│   └── ...
├── components/          # Componentes específicos
├── hooks/               # Hooks do módulo
├── services/            # Serviços/API
└── types/               # Tipos TypeScript
```

### Manifest do Módulo

```typescript
// src/modules/governance/manifest.ts
import { ModuleManifest } from '@/core/modules/types';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Settings,
} from 'lucide-react';

export const governanceManifest: ModuleManifest = {
  id: 'governance',
  name: 'Security Governance',
  version: '1.0.0',
  description: 'Security assessment and governance module',

  // Rotas do módulo
  routes: [
    {
      path: '/assessment',
      component: () => import('./pages/Assessment'),
      title: 'Assessment',
    },
    {
      path: '/dashboard/executive',
      component: () => import('./pages/DashboardExecutive'),
      title: 'Executive Dashboard',
    },
    {
      path: '/dashboard/grc',
      component: () => import('./pages/DashboardGRC'),
      title: 'GRC Dashboard',
    },
    {
      path: '/dashboard/specialist',
      component: () => import('./pages/DashboardSpecialist'),
      title: 'Specialist Dashboard',
    },
    {
      path: '/reports',
      component: () => import('./pages/Reports'),
      title: 'Reports',
    },
  ],

  // Navegação
  navigation: [
    {
      icon: ClipboardList,
      label: 'Assessment',
      path: '/assessment',
      permissions: ['assessment:read'],
    },
    {
      icon: LayoutDashboard,
      label: 'Dashboards',
      path: '/dashboard',
      children: [
        { label: 'Executive', path: '/dashboard/executive' },
        { label: 'GRC', path: '/dashboard/grc' },
        { label: 'Specialist', path: '/dashboard/specialist' },
      ],
      permissions: ['dashboard:read'],
    },
    {
      icon: FileText,
      label: 'Reports',
      path: '/reports',
      permissions: ['reports:read'],
    },
  ],

  // Permissões
  permissions: [
    'assessment:read',
    'assessment:write',
    'assessment:delete',
    'dashboard:read',
    'reports:read',
    'reports:generate',
    'reports:schedule',
  ],

  // Dependências
  dependencies: [],

  // Configurações
  settings: {
    defaultDomain: 'AI Security',
    enabledFrameworks: ['NIST-AI-RMF', 'ISO-27001'],
    snapshotFrequency: 'daily',
  },
};
```

## Habilitar/Desabilitar Módulos

### Via Admin Console

1. Acesse `/admin/modules`
2. Selecione a organização
3. Toggle para habilitar/desabilitar módulos
4. Configure permissões

### Via API

```bash
# Listar módulos disponíveis
curl -X GET "https://api.trustlayer.exemplo.com/rest/v1/modules" \
  -H "Authorization: Bearer $TOKEN"

# Habilitar módulo para organização
curl -X POST "https://api.trustlayer.exemplo.com/rest/v1/organizations/$ORG_ID/modules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module_id": "risk-management",
    "enabled": true,
    "config": {
      "risk_matrix": "5x5",
      "auto_calculate": true
    }
  }'

# Desabilitar módulo
curl -X DELETE "https://api.trustlayer.exemplo.com/rest/v1/organizations/$ORG_ID/modules/risk-management" \
  -H "Authorization: Bearer $TOKEN"
```

### Via SQL

```sql
-- Habilitar módulo para organização
INSERT INTO organization_modules (organization_id, module_id, enabled, config)
VALUES (
  'org-uuid',
  'risk-management',
  true,
  '{"risk_matrix": "5x5", "auto_calculate": true}'
)
ON CONFLICT (organization_id, module_id)
DO UPDATE SET enabled = true, config = EXCLUDED.config;

-- Desabilitar módulo
UPDATE organization_modules
SET enabled = false
WHERE organization_id = 'org-uuid' AND module_id = 'risk-management';

-- Listar módulos de uma organização
SELECT m.id, m.name, om.enabled, om.config
FROM modules m
LEFT JOIN organization_modules om ON m.id = om.module_id AND om.organization_id = 'org-uuid';
```

## Permissões por Módulo

### Matriz de Permissões

| Role | governance | risk-management | compliance | admin |
|------|------------|-----------------|------------|-------|
| Admin | Full | Full | Full | Full |
| Manager | Full | Full | Read | None |
| Analyst | Read/Write | Read | Read | None |
| Auditor | Read | Read | Read | None |
| Viewer | Read | Read | Read | None |

### Configurar Permissões

```sql
-- Permissões por role e módulo
INSERT INTO role_module_permissions (role, module_id, permissions)
VALUES
  ('admin', 'governance', '["read", "write", "delete", "admin"]'),
  ('manager', 'governance', '["read", "write"]'),
  ('analyst', 'governance', '["read", "write"]'),
  ('auditor', 'governance', '["read"]'),
  ('viewer', 'governance', '["read"]');

-- Permissões customizadas por usuário
INSERT INTO user_module_permissions (user_id, module_id, permissions)
VALUES ('user-uuid', 'risk-management', '["read", "write"]');
```

## Configurações de Módulo

### Governance Module

```json
{
  "governance": {
    "domains": {
      "enabled": ["AI Security", "Cloud Security", "DevSecOps"],
      "default": "AI Security"
    },
    "frameworks": {
      "enabled": ["NIST-AI-RMF", "ISO-27001", "CSA-CCM"],
      "custom_allowed": true
    },
    "assessment": {
      "auto_save": true,
      "save_interval_seconds": 30,
      "require_evidence": false
    },
    "dashboards": {
      "refresh_interval_seconds": 300,
      "custom_layouts": true
    },
    "reports": {
      "formats": ["pdf", "html", "excel"],
      "scheduling": true,
      "email_delivery": true
    },
    "snapshots": {
      "frequency": "daily",
      "retention_days": 730
    }
  }
}
```

### Risk Management Module

```json
{
  "risk-management": {
    "risk_matrix": {
      "type": "5x5",
      "impact_levels": ["Negligible", "Minor", "Moderate", "Major", "Severe"],
      "likelihood_levels": ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"]
    },
    "risk_calculation": {
      "method": "qualitative",
      "auto_calculate": true
    },
    "risk_appetite": {
      "threshold": "medium",
      "require_approval_above": "high"
    },
    "integrations": {
      "link_to_assessments": true,
      "link_to_controls": true
    }
  }
}
```

## Criar Módulo Customizado

### 1. Criar Estrutura

```bash
mkdir -p src/modules/custom-module/{pages,components,hooks,services}
```

### 2. Criar Manifest

```typescript
// src/modules/custom-module/manifest.ts
import { ModuleManifest } from '@/core/modules/types';

export const customModuleManifest: ModuleManifest = {
  id: 'custom-module',
  name: 'Custom Module',
  version: '1.0.0',
  description: 'Custom module description',

  routes: [
    {
      path: '/custom',
      component: () => import('./pages/CustomPage'),
      title: 'Custom Page',
    },
  ],

  navigation: [
    {
      icon: CustomIcon,
      label: 'Custom',
      path: '/custom',
      permissions: ['custom:read'],
    },
  ],

  permissions: ['custom:read', 'custom:write'],
  dependencies: ['governance'],
  settings: {},
};
```

### 3. Registrar Módulo

```typescript
// src/core/modules/registry.ts
import { customModuleManifest } from '@/modules/custom-module/manifest';

export const moduleRegistry = [
  governanceManifest,
  riskManagementManifest,
  customModuleManifest, // Adicionar aqui
];
```

### 4. Criar Página

```typescript
// src/modules/custom-module/pages/CustomPage.tsx
import React from 'react';
import { useModulePermissions } from '@/hooks/useModulePermissions';

export default function CustomPage() {
  const { hasPermission } = useModulePermissions('custom-module');

  if (!hasPermission('custom:read')) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      <h1>Custom Module Page</h1>
      {/* Conteúdo */}
    </div>
  );
}
```

## Migração de Dados entre Módulos

```sql
-- Migrar dados quando habilitar novo módulo
CREATE OR REPLACE FUNCTION migrate_to_risk_module(org_id UUID)
RETURNS void AS $$
BEGIN
  -- Criar riscos a partir de gaps identificados
  INSERT INTO risks (organization_id, title, description, source_assessment_id, created_at)
  SELECT
    org_id,
    'Gap: ' || q.question_text,
    'Identified from assessment gap',
    a.id,
    NOW()
  FROM answers a
  JOIN default_questions q ON a.question_id = q.id
  JOIN profiles p ON a.user_id = p.id
  WHERE p.organization_id = org_id
    AND a.answer = 'Não';
END;
$$ LANGUAGE plpgsql;
```

## Próximos Passos

1. [Gerenciamento de Organizações](./organization-management.md)
2. [Gerenciamento de Usuários](./user-management.md)
3. [Licenciamento](./licensing.md)

## Referências

- [ADR-0024: Modular Architecture](../../adr/ADR-0024-modular-architecture.md)
- [Module Loader Documentation](../../developer/pt-BR/module-loader.md)

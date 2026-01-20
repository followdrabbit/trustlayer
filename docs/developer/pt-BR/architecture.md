# Arquitetura do Sistema - TrustLayer

---
**Perfil**: Developer
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-20

---

## Visão Geral

TrustLayer é uma plataforma SaaS enterprise para Security Governance, Risk & Compliance (GRC) construída com arquitetura modular para suportar expansão futura.

## Princípios Arquiteturais

1. **Modularidade**: Sistema dividido em módulos independentes
2. **Escalabilidade**: Horizontal e vertical scaling
3. **Segurança**: Security by design (RBAC, RLS, MFA)
4. **Observabilidade**: Logs, métricas e tracing
5. **Manutenibilidade**: Código limpo e bem documentado

## Arquitetura de Alto Nível

### Camadas do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Web App   │  │  Admin     │  │  Mobile    │            │
│  │  (React)   │  │  Panel     │  │  (Future)  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST
┌────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY                            │
│  ┌─────────────────────────────────────────────────┐        │
│  │ • Authentication (JWT)                          │        │
│  │ • Rate Limiting                                 │        │
│  │ • CORS                                          │        │
│  │ • Request Validation                            │        │
│  └─────────────────────────────────────────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Governance  │  │     Risk     │  │    Policy    │      │
│  │   Module     │  │  Management  │  │  Management  │      │
│  │              │  │   (Future)   │  │   (Future)   │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                   │
│  ┌──────▼──────────────────────────────────────────┐       │
│  │          Shared Business Logic                  │       │
│  │  • Scoring Engine                               │       │
│  │  • Analytics Service                            │       │
│  │  • Report Generator                             │       │
│  │  • Notification Service                         │       │
│  └─────────────────────────────────────────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                       DATA LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   Storage    │  │    Cache     │      │
│  │  (Supabase)  │  │  (S3/Local)  │  │   (Redis)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Arquitetura Modular

### Module System

TrustLayer usa arquitetura modular baseada em domínios (Domain-Driven Design).

```
src/
├── core/                   # Sistema core (não modificar frequentemente)
│   ├── auth/               # Autenticação e autorização
│   ├── layout/             # Layout base (sidebar, header)
│   ├── routing/            # React Router setup
│   └── api/                # API client base
│
├── shared/                 # Componentes compartilhados
│   ├── components/         # UI components
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utility functions
│   └── types/              # Shared TypeScript types
│
└── modules/                # Módulos de negócio
    ├── governance/         # Security Governance (atual)
    │   ├── manifest.ts     # Module definition
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   ├── services/
    │   └── types/
    │
    ├── risk-management/    # Risk Management (futuro)
    └── policy-management/  # Policy Management (futuro)
```

### Module Manifest

Cada módulo declara suas capacidades via manifest:

```typescript
// modules/governance/manifest.ts
import type { ModuleManifest } from '@/core/types';

export const GovernanceModule: ModuleManifest = {
  id: 'governance',
  name: 'Security Governance',
  version: '1.0.0',
  description: 'GRC and compliance management',

  // Permissões necessárias
  permissions: [
    'assessments.read',
    'assessments.write',
    'dashboards.view',
    'reports.generate',
  ],

  // Rotas do módulo
  routes: [
    {
      path: '/assessments',
      component: lazy(() => import('./pages/AssessmentsPage')),
      meta: { requiresAuth: true, role: ['admin', 'manager', 'analyst'] },
    },
    {
      path: '/dashboards',
      component: lazy(() => import('./pages/DashboardsPage')),
      meta: { requiresAuth: true },
    },
  ],

  // Navegação (sidebar)
  navigation: [
    {
      label: 'Assessments',
      path: '/assessments',
      icon: 'FileCheck',
      order: 1,
    },
    {
      label: 'Dashboards',
      path: '/dashboards',
      icon: 'BarChart3',
      order: 2,
    },
  ],

  // Widgets para dashboards
  widgets: [
    {
      id: 'governance-score',
      name: 'Governance Score',
      component: lazy(() => import('./widgets/GovernanceScoreWidget')),
      defaultSize: { w: 2, h: 2 },
    },
    {
      id: 'gap-analysis',
      name: 'Gap Analysis',
      component: lazy(() => import('./widgets/GapAnalysisWidget')),
      defaultSize: { w: 3, h: 2 },
    },
  ],

  // Lifecycle hooks
  onActivate: async () => {
    console.log('Governance module activated');
    // Initialize services, load data, etc.
  },

  onDeactivate: async () => {
    console.log('Governance module deactivated');
    // Cleanup, save state, etc.
  },
};
```

### Module Loader

Módulos são carregados dinamicamente pelo Module Loader:

```typescript
// core/module-loader.ts
export class ModuleLoader {
  private modules = new Map<string, ModuleManifest>();
  private eventBus = new EventBus();

  async loadModule(moduleId: string) {
    try {
      // Dynamic import do manifest
      const { default: manifest } = await import(
        `@/modules/${moduleId}/manifest`
      );

      // Verificar permissões
      if (!this.hasRequiredPermissions(manifest.permissions)) {
        throw new Error(`Missing permissions for module ${moduleId}`);
      }

      // Ativar módulo
      await manifest.onActivate?.();

      // Registrar módulo
      this.modules.set(moduleId, manifest);

      // Emitir evento
      this.eventBus.emit('module:loaded', { moduleId });

      console.log(`Module ${moduleId} loaded successfully`);
    } catch (error) {
      console.error(`Failed to load module ${moduleId}:`, error);
      throw error;
    }
  }

  async unloadModule(moduleId: string) {
    const manifest = this.modules.get(moduleId);
    if (!manifest) return;

    // Desativar módulo
    await manifest.onDeactivate?.();

    // Remover registro
    this.modules.delete(moduleId);

    // Emitir evento
    this.eventBus.emit('module:unloaded', { moduleId });
  }

  getModule(moduleId: string): ModuleManifest | undefined {
    return this.modules.get(moduleId);
  }

  getAllModules(): ModuleManifest[] {
    return Array.from(this.modules.values());
  }

  isModuleEnabled(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }
}
```

## Comunicação Entre Módulos

### Event Bus

Módulos se comunicam via Event Bus para eventos assíncronos:

```typescript
// shared/event-bus.ts
export class EventBus {
  private listeners = new Map<string, Set<Function>>();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(callback => {
      callback(data);
    });
  }
}

// Usage em módulo
// modules/governance/services/assessment-service.ts
eventBus.emit('governance:assessment-completed', {
  assessmentId: '123',
  score: 85,
});

// Outro módulo ouve
// modules/risk-management/services/risk-service.ts
eventBus.on('governance:assessment-completed', async ({ assessmentId, score }) => {
  // Criar riscos baseado em gaps encontrados
  await riskService.createRisksFromAssessment(assessmentId);
});
```

### Service Registry

Para comunicação síncrona:

```typescript
// core/service-registry.ts
export class ServiceRegistry {
  private services = new Map<string, any>();

  register<T>(name: string, service: T) {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service as T;
  }
}

// Registrar service de um módulo
// modules/governance/index.ts
serviceRegistry.register('governance', {
  getAssessmentById: (id: string) => assessmentService.getById(id),
  calculateScore: (answers: Answer[]) => scoringEngine.calculate(answers),
});

// Usar de outro módulo
// modules/risk-management/services/integration.ts
const governanceService = serviceRegistry.get<GovernanceService>('governance');
const assessment = await governanceService.getAssessmentById(id);
```

## Data Flow Architecture

### Frontend Data Flow

```
┌──────────────┐
│  Component   │
└──────┬───────┘
       │ useQuery/useMutation (React Query)
       ▼
┌──────────────┐
│   Service    │ (abstração de API)
└──────┬───────┘
       │ fetch/axios
       ▼
┌──────────────┐
│  API Client  │ (Supabase/Custom)
└──────┬───────┘
       │ HTTP/REST
       ▼
┌──────────────┐
│   Backend    │
└──────┬───────┘
       │ SQL
       ▼
┌──────────────┐
│  PostgreSQL  │
└──────────────┘
```

### State Management

Usando Zustand para estado global:

```typescript
// shared/stores/auth-store.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    set({
      user: data.user,
      session: data.session,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) throw new Error('Not authenticated');

    // Update logic
    set({ user: { ...user, ...updates } });
  },
}));
```

React Query para server state:

```typescript
// modules/governance/hooks/useAssessments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAssessments(organizationId: string) {
  const queryClient = useQueryClient();

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments', organizationId],
    queryFn: () => assessmentService.getByOrganization(organizationId),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAssessmentDTO) =>
      assessmentService.create(data),
    onSuccess: () => {
      // Invalidate e refetch
      queryClient.invalidateQueries(['assessments', organizationId]);
    },
  });

  return {
    assessments,
    isLoading,
    createAssessment: createMutation.mutate,
  };
}
```

## Database Architecture

### Schema Namespacing

Cada módulo tem seu próprio schema:

```sql
-- Governance module
CREATE SCHEMA governance;

CREATE TABLE governance.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  -- ...
);

CREATE TABLE governance.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES governance.assessments(id),
  -- ...
);

-- Risk Management module (futuro)
CREATE SCHEMA risk_management;

CREATE TABLE risk_management.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  -- ...
);
```

### Row Level Security (RLS)

Segurança em nível de linha para multi-tenancy:

```sql
-- Habilitar RLS
ALTER TABLE governance.assessments ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário só vê assessments da sua organização
CREATE POLICY assessments_select_policy ON governance.assessments
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE user_id = auth.uid()
  )
);

-- Policy: Usuário só cria se tiver permissão
CREATE POLICY assessments_insert_policy ON governance.assessments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND organization_id = governance.assessments.organization_id
    AND role IN ('admin', 'manager')
  )
);
```

## Security Architecture

### Authentication Flow

```
┌──────────┐
│  Client  │
└─────┬────┘
      │ 1. POST /auth/login
      │    { email, password }
      ▼
┌──────────────┐
│   Backend    │
└─────┬────────┘
      │ 2. Verify credentials
      ▼
┌──────────────┐
│  PostgreSQL  │
└─────┬────────┘
      │ 3. Return user
      ▼
┌──────────────┐
│   Backend    │
│ 4. Generate  │
│    JWT token │
└─────┬────────┘
      │ 5. Return { user, token }
      ▼
┌──────────┐
│  Client  │
│ Store    │
│ token in │
│ localStorage
└──────────┘
```

### RBAC (Role-Based Access Control)

```typescript
// shared/types/rbac.ts
export type UserRole =
  | 'admin'
  | 'manager'
  | 'analyst'
  | 'auditor'
  | 'viewer'
  | 'user';

export type Permission =
  | 'assessments.read'
  | 'assessments.write'
  | 'assessments.delete'
  | 'dashboards.view'
  | 'reports.generate'
  | 'users.manage'
  | 'audit_logs.read';

export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: ['*'], // All permissions

  manager: [
    'assessments.read',
    'assessments.write',
    'dashboards.view',
    'reports.generate',
  ],

  analyst: [
    'assessments.read',
    'assessments.write',
    'dashboards.view',
  ],

  auditor: [
    'audit_logs.read',
    'assessments.read',
    'dashboards.view',
    'reports.generate',
  ],

  viewer: [
    'assessments.read',
    'dashboards.view',
  ],

  user: [
    'assessments.read',
  ],
};
```

## Performance & Scalability

### Caching Strategy

```typescript
// Diferentes níveis de cache
const cacheConfig = {
  // Browser cache (React Query)
  reactQuery: {
    staleTime: 5 * 60 * 1000, // 5 min
    cacheTime: 10 * 60 * 1000, // 10 min
  },

  // API cache (futuro: Redis)
  apiCache: {
    assessments: 300, // 5 min TTL
    dashboards: 600, // 10 min TTL
  },

  // Database cache (PostgreSQL)
  pgCache: {
    sharedBuffers: '256MB',
    effectiveCacheSize: '1GB',
  },
};
```

### Query Optimization

```typescript
// ❌ N+1 query problem
const assessments = await db.assessments.findMany();
for (const assessment of assessments) {
  assessment.answers = await db.answers.findMany({
    where: { assessmentId: assessment.id },
  });
}

// ✅ Solution: Eager loading
const assessments = await db.assessments.findMany({
  include: {
    answers: true,
    organization: true,
  },
});
```

## Observability

### Logging Strategy

```typescript
// shared/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Usage
logger.info('Assessment created', {
  assessmentId: assessment.id,
  userId: user.id,
  organizationId: org.id,
});

logger.error('Failed to calculate score', {
  error: error.message,
  stack: error.stack,
  assessmentId: assessment.id,
});
```

### Metrics & Tracing (OpenTelemetry)

Ver [ADR-0015: OpenTelemetry Integration](../../adr/0015-opentelemetry.md)

## Deployment Architecture

Ver [Deployment K8s](../../admin/pt-BR/deployment-k8s.md) para detalhes.

## Referências

- [ADR-0024: Modular Architecture](../../adr/0024-modular-architecture.md)
- [ADR-0001: React + TypeScript Stack](../../adr/0001-react-typescript.md)
- [ADR-0004: Supabase Backend](../../adr/0004-supabase-backend.md)
- [API Reference](./api-reference.md)
- [Database Schema](./database-schema.md)

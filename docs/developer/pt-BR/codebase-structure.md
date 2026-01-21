# Codebase Structure - TrustLayer Developer Guide

---
**Perfil**: Developer
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

O TrustLayer segue uma arquitetura modular conforme definido no [ADR-0024](../adr/0024-modular-architecture.md).

## Estrutura de Diretórios

```
trustlayer/
│
├── .github/                    # GitHub configuration
│   ├── workflows/              # CI/CD pipelines
│   ├── CODEOWNERS              # Code ownership
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docs/                       # Documentação
│   ├── adr/                    # Architecture Decision Records
│   ├── admin/                  # Admin documentation
│   ├── developer/              # Developer documentation
│   ├── qa/                     # QA documentation
│   ├── user/                   # User documentation
│   └── auditor/                # Auditor documentation
│
├── public/                     # Static assets
│   ├── favicon.ico
│   ├── robots.txt
│   └── locales/                # i18n translation files
│
├── src/                        # Source code
│   ├── components/             # React components
│   ├── core/                   # Core infrastructure
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Libraries and utilities
│   ├── modules/                # Feature modules
│   ├── pages/                  # Page components
│   ├── stores/                 # State management
│   ├── styles/                 # Global styles
│   ├── types/                  # TypeScript types
│   ├── App.tsx                 # App root
│   ├── main.tsx                # Entry point
│   └── vite-env.d.ts           # Vite types
│
├── supabase/                   # Supabase configuration
│   ├── functions/              # Edge Functions
│   ├── migrations/             # Database migrations
│   ├── seed.sql                # Seed data
│   └── config.toml             # Supabase config
│
├── tests/                      # Tests
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   ├── e2e/                    # E2E tests
│   ├── mocks/                  # Test mocks
│   └── setup.ts                # Test setup
│
├── .env.example                # Environment template
├── .eslintrc.cjs               # ESLint config
├── .prettierrc                 # Prettier config
├── index.html                  # HTML template
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind config
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
└── vitest.config.ts            # Vitest config
```

## Core (`src/core/`)

O core contém a infraestrutura fundamental do sistema:

```
src/core/
├── events/
│   ├── EventBus.ts           # Sistema de eventos pub/sub
│   ├── types.ts              # Tipos de eventos
│   └── index.ts
│
├── modules/
│   ├── ModuleLoader.ts       # Carregador de módulos
│   ├── ModuleRegistry.ts     # Registro de módulos
│   ├── types.ts              # Tipos de módulos
│   └── index.ts
│
├── routing/
│   ├── AppRouter.tsx         # Router principal
│   ├── RouteGuard.tsx        # Proteção de rotas
│   └── index.ts
│
├── services/
│   ├── ServiceRegistry.ts    # Registro de serviços
│   ├── BaseService.ts        # Classe base
│   └── index.ts
│
└── index.ts                  # Exports do core
```

### EventBus

```typescript
// Exemplo de uso
import { eventBus } from '@/core/events';

// Publicar evento
eventBus.emit('assessment:submitted', {
  assessmentId: '123',
  score: 85
});

// Escutar evento
eventBus.on('assessment:submitted', (data) => {
  console.log(`Assessment ${data.assessmentId} submitted with score ${data.score}`);
});
```

### ModuleLoader

```typescript
// Exemplo de uso
import { ModuleLoader } from '@/core/modules';

// Registrar módulo
ModuleLoader.register({
  id: 'governance',
  name: 'Governance Module',
  routes: [...],
  services: [...],
});

// Obter rotas de todos os módulos
const routes = ModuleLoader.getRoutes();
```

## Components (`src/components/`)

Componentes React organizados por tipo:

```
src/components/
├── common/                   # Componentes genéricos
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Modal/
│   ├── Card/
│   ├── Badge/
│   ├── Table/
│   ├── Loading/
│   └── index.ts
│
├── layout/                   # Componentes de layout
│   ├── MainLayout/
│   ├── Sidebar/
│   ├── Header/
│   ├── Footer/
│   └── index.ts
│
├── features/                 # Componentes de features
│   ├── assessment/
│   │   ├── AssessmentCard.tsx
│   │   ├── AssessmentForm.tsx
│   │   ├── QuestionItem.tsx
│   │   └── index.ts
│   ├── dashboard/
│   │   ├── ScoreCard.tsx
│   │   ├── TrendChart.tsx
│   │   ├── GapsList.tsx
│   │   └── index.ts
│   └── report/
│       ├── ReportPreview.tsx
│       ├── ExportOptions.tsx
│       └── index.ts
│
└── ui/                       # shadcn/ui components
    ├── button.tsx
    ├── input.tsx
    ├── dialog.tsx
    └── ...
```

### Convenção de Componentes

```typescript
// src/components/features/assessment/AssessmentCard.tsx

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Assessment } from '@/types';

interface AssessmentCardProps {
  assessment: Assessment;
  onClick?: () => void;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  onClick,
}) => {
  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-md">
      <CardHeader>
        <h3>{assessment.name}</h3>
        <Badge variant={assessment.status}>{assessment.status}</Badge>
      </CardHeader>
      <CardContent>
        <p>Score: {assessment.score ?? 'N/A'}</p>
      </CardContent>
    </Card>
  );
};
```

## Modules (`src/modules/`)

Cada módulo é uma feature independente:

```
src/modules/
├── governance/
│   ├── components/           # Componentes do módulo
│   │   └── GapAnalysis.tsx
│   ├── hooks/                # Hooks do módulo
│   │   └── useAssessments.ts
│   ├── pages/                # Páginas do módulo
│   │   ├── Assessment.tsx
│   │   ├── Dashboard.tsx
│   │   └── index.ts
│   ├── services/             # Serviços do módulo
│   │   └── AssessmentService.ts
│   ├── stores/               # Estado do módulo
│   │   └── assessmentStore.ts
│   ├── types/                # Tipos do módulo
│   │   └── index.ts
│   ├── index.ts              # Module definition
│   └── routes.ts             # Rotas do módulo
│
├── reports/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── index.ts
│
└── settings/
    ├── components/
    ├── pages/
    └── index.ts
```

### Definição de Módulo

```typescript
// src/modules/governance/index.ts

import type { ModuleDefinition } from '@/core/modules';
import { routes } from './routes';
import { AssessmentService } from './services/AssessmentService';

export const GovernanceModule: ModuleDefinition = {
  id: 'governance',
  name: 'Governance',
  version: '1.0.0',

  routes,

  services: [
    { id: 'assessmentService', instance: new AssessmentService() },
  ],

  permissions: [
    'assessment:read',
    'assessment:write',
    'assessment:delete',
  ],

  onInit: async () => {
    console.log('Governance module initialized');
  },

  onDestroy: async () => {
    console.log('Governance module destroyed');
  },
};
```

## Hooks (`src/hooks/`)

Custom hooks reutilizáveis:

```
src/hooks/
├── useAuth.ts              # Autenticação
├── useSupabase.ts          # Cliente Supabase
├── useToast.ts             # Notificações toast
├── useDebounce.ts          # Debounce de valores
├── useLocalStorage.ts      # Persistência local
├── useMediaQuery.ts        # Media queries
├── usePagination.ts        # Paginação
└── index.ts
```

### Exemplo de Hook

```typescript
// src/hooks/useAuth.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    return supabase.auth.signOut();
  };

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!session,
  };
}
```

## Stores (`src/stores/`)

State management com Zustand:

```
src/stores/
├── authStore.ts            # Estado de autenticação
├── themeStore.ts           # Estado de tema
├── assessmentStore.ts      # Estado de assessments
├── notificationStore.ts    # Estado de notificações
└── index.ts
```

### Exemplo de Store

```typescript
// src/stores/assessmentStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Assessment } from '@/types';

interface AssessmentState {
  assessments: Assessment[];
  currentAssessment: Assessment | null;
  loading: boolean;
  error: string | null;

  // Actions
  setAssessments: (assessments: Assessment[]) => void;
  setCurrentAssessment: (assessment: Assessment | null) => void;
  addAssessment: (assessment: Assessment) => void;
  updateAssessment: (id: string, updates: Partial<Assessment>) => void;
  deleteAssessment: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAssessmentStore = create<AssessmentState>()(
  devtools(
    persist(
      (set) => ({
        assessments: [],
        currentAssessment: null,
        loading: false,
        error: null,

        setAssessments: (assessments) => set({ assessments }),

        setCurrentAssessment: (assessment) =>
          set({ currentAssessment: assessment }),

        addAssessment: (assessment) =>
          set((state) => ({
            assessments: [...state.assessments, assessment],
          })),

        updateAssessment: (id, updates) =>
          set((state) => ({
            assessments: state.assessments.map((a) =>
              a.id === id ? { ...a, ...updates } : a
            ),
          })),

        deleteAssessment: (id) =>
          set((state) => ({
            assessments: state.assessments.filter((a) => a.id !== id),
          })),

        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
      }),
      {
        name: 'assessment-store',
      }
    )
  )
);
```

## Supabase (`supabase/`)

### Edge Functions

```
supabase/functions/
├── ai-assistant/           # AI Assistant function
│   ├── index.ts
│   └── handlers/
├── audit-log/              # Audit logging function
│   └── index.ts
├── report-generator/       # Report generation function
│   └── index.ts
├── email-sender/           # Email sending function
│   └── index.ts
└── _shared/                # Shared utilities
    ├── cors.ts
    ├── auth.ts
    └── types.ts
```

### Migrations

```
supabase/migrations/
├── 20250101000000_initial_schema.sql
├── 20250115000000_add_audit_logs.sql
├── 20250120000000_add_mfa_tables.sql
├── 20250125000000_add_report_schedules.sql
└── 20250201000000_add_rls_policies.sql
```

## Types (`src/types/`)

```
src/types/
├── database.types.ts       # Auto-generated from Supabase
├── api.types.ts            # API types
├── assessment.types.ts     # Assessment types
├── user.types.ts           # User types
├── report.types.ts         # Report types
└── index.ts                # Re-exports
```

## Referências

- [ADR-0024: Modular Architecture](../adr/0024-modular-architecture.md)
- [Development Setup](./development-setup.md)
- [Contributing Guide](./contributing.md)

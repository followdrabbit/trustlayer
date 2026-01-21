# Documentação para Desenvolvedores - TrustLayer

---
**Perfil**: Developer
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Esta seção da documentação é destinada a **desenvolvedores e equipes de sustentação** responsáveis por desenvolver, manter e evoluir a plataforma TrustLayer.

## Público-Alvo

- Desenvolvedores frontend (React/TypeScript)
- Desenvolvedores backend (Node.js/TypeScript)
- Engenheiros de sustentação
- Arquitetos de software
- Contribuidores open-source

## Pré-requisitos

Para desenvolver no TrustLayer, você deve ter:

- Node.js 18+ e npm/yarn
- TypeScript 5+
- Git e conhecimento de Git Flow
- Experiência com React 18 e React Hooks
- Conhecimento de PostgreSQL e SQL
- Familiaridade com Supabase ou backends similares
- Docker para desenvolvimento local

## Índice

### 1. Getting Started
- [Setup de Desenvolvimento](./development-setup.md)
- [Arquitetura do Sistema](./architecture.md)
- [Estrutura do Codebase](./codebase-structure.md)
- [Contributing Guidelines](./contributing.md)

### 2. Frontend
- [React + Vite Setup](./frontend-stack.md)
- [Componentes e UI](./components-guide.md)
- [State Management](./state-management.md)
- [Roteamento e Navegação](./routing.md)
- [Temas e Estilização](./theming.md)
- [Animações (Framer Motion)](./animations.md)

### 3. Backend
- [API Architecture](./api-architecture.md)
- [API Reference](./api-reference.md)
- [Database Schema](./database-schema.md)
- [Authentication & Authorization](./auth-system.md)
- [Services Layer](./services.md)

### 4. Modular Architecture
- [Module System](./module-system.md)
- [Creating New Modules](./creating-modules.md)
- [Inter-Module Communication](./inter-module-communication.md)
- [Module Registry](./module-registry.md)

### 5. Testing
- [Testing Strategy](./testing-strategy.md)
- [Unit Tests (Vitest)](./unit-tests.md)
- [Integration Tests](./integration-tests.md)
- [E2E Tests (Playwright)](./e2e-tests.md)

### 6. Code Quality
- [ESLint Configuration](./eslint-guide.md)
- [Prettier & Formatting](./prettier-guide.md)
- [TypeScript Best Practices](./typescript-best-practices.md)
- [Code Review Guidelines](./code-review.md)

### 7. CI/CD
- [GitHub Actions Workflows](./github-actions.md)
- [Danger.js PR Checks](./danger-js.md)
- [Dependabot](./dependabot.md)
- [Deployment Pipeline](./deployment-pipeline.md)

### 8. Advanced Topics
- [Performance Optimization](./performance.md)
- [Security Best Practices](./security.md)
- [Accessibility (a11y)](./accessibility.md)
- [Internationalization (i18n)](./internationalization.md)

## Quick Start

### 1. Clone e Setup

```bash
# Clone do repositório
git clone https://github.com/your-org/trustlayer.git
cd trustlayer

# Instalar dependências
npm install

# Copiar environment variables
cp .env.example .env.local

# Editar variáveis locais
nano .env.local
```

### 2. Configurar Supabase Local

```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar Supabase local
supabase start

# Aplicar migrations
supabase db reset
```

### 3. Rodar em Desenvolvimento

```bash
# Terminal 1: Backend (se houver backend separado)
npm run dev:backend

# Terminal 2: Frontend
npm run dev

# Acessar
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
# Supabase Studio: http://localhost:54323
```

### 4. Rodar Testes

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## Stack Tecnológico

### Frontend
- **Framework**: React 18.3+ com TypeScript 5+
- **Build**: Vite 6+
- **Routing**: React Router 7+
- **State**: Zustand + React Query
- **UI**: Radix UI + Tailwind CSS 4+
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 18+ com TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ (Supabase)
- **ORM**: Prisma ou Supabase Client
- **Auth**: Supabase Auth + JWT
- **Validation**: Zod
- **Email**: Nodemailer

### DevOps
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (optional)
- **CI/CD**: GitHub Actions
- **Monitoring**: OpenTelemetry
- **Logs**: Winston + ELK Stack

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                    TRUSTLAYER                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐      ┌──────────────┐                │
│  │  Frontend   │◄────►│   Backend    │                │
│  │  (React)    │      │  (Node.js)   │                │
│  └──────┬──────┘      └──────┬───────┘                │
│         │                     │                         │
│         │                     │                         │
│         ▼                     ▼                         │
│  ┌─────────────────────────────────┐                   │
│  │      Supabase Backend           │                   │
│  ├─────────────────────────────────┤                   │
│  │ • PostgreSQL (Database)         │                   │
│  │ • Auth (SSO, MFA, JWT)          │                   │
│  │ • Storage (Files, Avatars)      │                   │
│  │ • Edge Functions                │                   │
│  │ • Realtime (WebSockets)         │                   │
│  └─────────────────────────────────┘                   │
│                                                         │
└─────────────────────────────────────────────────────────┘

External Integrations:
├── SAML IdP (SSO)
├── Email (SMTP)
├── Observability (Grafana, ELK)
└── AI Services (OpenAI API)
```

## Estrutura do Repositório

```
trustlayer/
├── src/
│   ├── core/                  # Core system (auth, layout, routing)
│   │   ├── auth/
│   │   ├── layout/
│   │   ├── routing/
│   │   └── api/
│   ├── shared/                # Shared components, hooks, utils
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   └── modules/               # Business modules
│       ├── governance/        # Security Governance module
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── services/
│       │   └── types/
│       ├── risk-management/   # Future
│       └── policy-management/ # Future
├── supabase/
│   ├── migrations/            # Database migrations
│   ├── functions/             # Edge Functions
│   └── config.toml
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                      # Documentation
├── scripts/                   # Automation scripts
└── .github/
    └── workflows/             # CI/CD pipelines
```

## Convenções de Código

### Naming Conventions

```typescript
// Components: PascalCase
export function AssessmentCard() { }

// Hooks: camelCase com prefix 'use'
export function useAssessments() { }

// Services: camelCase
export const assessmentService = { }

// Types/Interfaces: PascalCase
export interface Assessment { }

// Constants: UPPER_SNAKE_CASE
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Files:
// - Components: PascalCase.tsx (AssessmentCard.tsx)
// - Hooks: camelCase.ts (useAssessments.ts)
// - Utils: kebab-case.ts (format-date.ts)
// - Types: PascalCase.ts (Assessment.ts)
```

### File Organization

```typescript
// src/modules/governance/components/AssessmentCard.tsx

import type { Assessment } from '../types'; // Types first
import { useAssessment } from '../hooks';   // Hooks
import { Card } from '@/shared/components'; // Shared components
import { formatDate } from '@/shared/utils'; // Utils

export function AssessmentCard({ assessment }: Props) {
  // Component logic
}
```

### TypeScript

```typescript
// ✅ Bom: Tipos explícitos em funções públicas
export function calculateScore(answers: Answer[]): number {
  return answers.reduce((sum, a) => sum + a.value, 0);
}

// ✅ Bom: Interfaces para props
interface AssessmentCardProps {
  assessment: Assessment;
  onUpdate?: (id: string) => void;
}

// ❌ Evitar: 'any' type
function processData(data: any) { } // Evitar!

// ✅ Bom: Usar unknown e type guards
function processData(data: unknown) {
  if (isAssessment(data)) {
    // Safe to use as Assessment
  }
}
```

## Git Workflow

### Branch Naming

```bash
# Features
feature/add-dark-theme
feature/reports-page

# Fixes
fix/assessment-calculation
fix/login-redirect

# Refactors
refactor/modular-architecture

# Docs
docs/api-reference
```

### Commit Messages

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <description>

# Examples
feat(governance): add draggable AI assistant
fix(auth): resolve SAML callback error
refactor(core): migrate to modular architecture
docs(admin): add on-prem installation guide
test(governance): add unit tests for scoring
chore(deps): update dependencies
```

### Pull Request Process

1. Criar branch a partir de `main`
2. Desenvolver feature/fix
3. Escrever testes
4. Atualizar documentação
5. Fazer commit seguindo Conventional Commits
6. Push e criar PR
7. Aguardar Danger.js checks
8. Code review
9. Merge após aprovação

## Recursos Úteis

### Links Internos
- [ADRs (Architecture Decision Records)](../../adr/)
- [Roadmap Enterprise](../../ROADMAP_ENTERPRISE.md)
- [CHANGELOG](../../CHANGELOG.md)
- [Contributing](./contributing.md)

### Links Externos
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)

## Suporte

Para questões de desenvolvimento:
- **GitHub Discussions**: https://github.com/your-org/trustlayer/discussions
- **Slack**: #trustlayer-dev
- **Email**: dev@trustlayer.com

## Contribuindo

Leia nosso [Contributing Guide](./contributing.md) para saber como contribuir com o projeto.

## Glossário

- **Module**: Unidade modular do sistema (governance, risk-management, etc.)
- **Widget**: Componente de dashboard customizável
- **RLS**: Row Level Security (Supabase)
- **Edge Function**: Serverless function (Supabase)
- **ADR**: Architecture Decision Record
- **SPA**: Single Page Application
- **SSR**: Server Side Rendering
- **CSR**: Client Side Rendering

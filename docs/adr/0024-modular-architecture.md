# ADR 0024: Modular Architecture

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Architecture Team

---

## Context

TrustLayer começou como uma aplicação monolítica focada em Security Governance. Para suportar crescimento futuro e adicionar novos módulos (ex: Risk Management, Policy Management, Vendor Management), precisamos adotar uma arquitetura modular que permita:

1. Desenvolvimento independente de módulos
2. Deploy seletivo (cliente pode escolher quais módulos habilitar)
3. Manutenibilidade e testabilidade melhoradas
4. Onboarding facilitado para novos desenvolvedores
5. Reuso de componentes entre módulos

## Decision

Adotaremos uma **arquitetura modular baseada em domínios** com os seguintes princípios:

### 1. Estrutura de Módulos

```
src/
├── core/                    # Core do sistema (autenticação, layout, routing)
│   ├── auth/
│   ├── layout/
│   ├── routing/
│   └── api/
├── shared/                  # Componentes compartilhados
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
└── modules/                 # Módulos de negócio
    ├── governance/          # Módulo atual (Security Governance)
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   ├── services/
    │   └── types/
    ├── risk-management/     # Futuro
    ├── policy-management/   # Futuro
    └── vendor-management/   # Futuro
```

### 2. Module Registry

Cada módulo exporta um manifest:

```typescript
// modules/governance/manifest.ts
export const GovernanceModule: ModuleManifest = {
  id: 'governance',
  name: 'Security Governance',
  version: '1.0.0',
  description: 'GRC and compliance management',

  // Permissões requeridas
  permissions: ['assessments.read', 'assessments.write', 'dashboards.view'],

  // Rotas do módulo
  routes: [
    { path: '/assessments', component: AssessmentsPage },
    { path: '/dashboards', component: DashboardsPage },
  ],

  // Menu items
  navigation: [
    { label: 'Assessments', path: '/assessments', icon: 'FileCheck' },
    { label: 'Dashboards', path: '/dashboards', icon: 'BarChart3' },
  ],

  // Widgets disponíveis para dashboards
  widgets: [...],

  // Lifecycle hooks
  onActivate: async () => { /* setup */ },
  onDeactivate: async () => { /* cleanup */ },
};
```

### 3. Module Loading

Módulos são carregados dinamicamente baseado em licença/configuração:

```typescript
// core/module-loader.ts
export class ModuleLoader {
  private modules = new Map<string, Module>();

  async loadModule(moduleId: string) {
    const module = await import(`@/modules/${moduleId}/manifest`);
    await module.default.onActivate();
    this.modules.set(moduleId, module.default);
  }

  isModuleEnabled(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }
}
```

### 4. Inter-Module Communication

Módulos se comunicam via:

- **Event Bus** para eventos assíncronos
- **Service Registry** para chamadas síncronas
- **Shared State** para dados compartilhados (Redux/Zustand)

```typescript
// Event bus example
eventBus.emit('governance:assessment-completed', { assessmentId });

// Service registry example
const riskService = serviceRegistry.get<RiskService>('risk-management');
await riskService.createRiskFromFinding(finding);
```

### 5. Database Schema

Cada módulo tem seu próprio schema namespace:

```sql
-- Governance module
CREATE SCHEMA governance;
CREATE TABLE governance.assessments (...);
CREATE TABLE governance.answers (...);

-- Risk Management module
CREATE SCHEMA risk_management;
CREATE TABLE risk_management.risks (...);
CREATE TABLE risk_management.mitigations (...);
```

RLS policies são aplicadas por schema.

### 6. API Structure

APIs seguem padrão modular:

```
/api/v1/governance/assessments
/api/v1/governance/dashboards
/api/v1/risk-management/risks
/api/v1/policy-management/policies
```

### 7. Deployment

Módulos podem ser:
- **Built-in**: Sempre incluídos no bundle
- **Optional**: Lazy-loaded quando habilitados
- **External**: Plugins de terceiros (futuro)

## Consequences

### Positivo

✅ **Escalabilidade**: Novos módulos podem ser adicionados sem afetar existentes
✅ **Manutenibilidade**: Código organizado por domínio
✅ **Testabilidade**: Módulos podem ser testados isoladamente
✅ **Performance**: Lazy loading reduz bundle inicial
✅ **Licenciamento**: Clientes pagam apenas pelos módulos que usam

### Negativo

❌ **Complexidade inicial**: Overhead de setup
❌ **Learning curve**: Desenvolvedores precisam entender a arquitetura
❌ **Debugging**: Mais difícil debuggar inter-module issues

### Riscos Mitigados

- **Monólito**: Refatoração para modular antes do sistema crescer demais
- **Acoplamento**: Interfaces bem definidas previnem tight coupling
- **Performance**: Code splitting via lazy loading

## Implementation Plan

### Phase 1: Core Infrastructure (Sprint 1-2)
- [ ] Module loader system
- [ ] Event bus
- [ ] Service registry
- [ ] Module manifest schema

### Phase 2: Governance Module Refactoring (Sprint 3-4)
- [ ] Extrair código atual para módulo `governance`
- [ ] Implementar manifest
- [ ] Migrar rotas e navegação
- [ ] Testes de integração

### Phase 3: New Module Template (Sprint 5)
- [ ] CLI para gerar novos módulos
- [ ] Template com best practices
- [ ] Documentação de desenvolvimento

### Phase 4: Future Modules (Roadmap)
- [ ] Risk Management module
- [ ] Policy Management module
- [ ] Vendor Management module

## Related ADRs

- ADR-0001: React + TypeScript stack
- ADR-0004: Supabase backend
- ADR-0022: RBAC model (módulos podem ter permissões específicas)

## References

- [Micro Frontends](https://micro-frontends.org/)
- [Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

# Sistema Modular - Guia do Desenvolvedor

---
**Perfil**: Developer
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-20

---

## Visão Geral

TrustLayer usa uma **arquitetura modular** baseada em domínios que permite:

✅ Desenvolvimento independente de módulos
✅ Deploy seletivo (cliente escolhe quais módulos habilitar)
✅ Comunicação entre módulos via Event Bus
✅ Serviços compartilhados via Service Registry
✅ Lazy loading para otimização de performance

## Componentes do Sistema Modular

### 1. Module Loader

Responsável por carregar, ativar e desativar módulos dinamicamente.

```typescript
import { moduleLoader } from '@/core/modules';

// Carregar um módulo
await moduleLoader.loadModule('governance');

// Verificar se módulo está ativo
const isActive = moduleLoader.isModuleActive('governance');

// Desativar módulo
await moduleLoader.deactivateModule('governance');
```

### 2. Event Bus

Sistema de eventos para comunicação assíncrona entre módulos.

```typescript
import { eventBus, EventTypes } from '@/core/modules';

// Emitir evento
await eventBus.emit(
  EventTypes.ASSESSMENT_COMPLETED,
  { assessmentId: '123', score: 85 },
  { module: 'governance' }
);

// Escutar evento
const unsubscribe = eventBus.on(EventTypes.ASSESSMENT_COMPLETED, async (event) => {
  console.log('Assessment completed:', event.data);
  // Fazer algo com o evento
});

// Remover listener
unsubscribe();
```

### 3. Service Registry

Registro central de serviços compartilhados entre módulos.

```typescript
import { serviceRegistry } from '@/core/modules';

// Obter serviço de outro módulo
const assessmentService = serviceRegistry.get('assessments', 'governance');
const assessment = await assessmentService.getById('123');

// Verificar se serviço existe
if (serviceRegistry.has('scoring', 'governance')) {
  const scoringService = serviceRegistry.get('scoring', 'governance');
  const score = await scoringService.calculate(answers);
}
```

## Criando um Novo Módulo

### Passo 1: Estrutura de Diretórios

```
src/modules/seu-modulo/
├── manifest.ts              # Definição do módulo
├── pages/                   # Páginas do módulo
│   ├── ModulePage.tsx
│   └── DetailPage.tsx
├── components/              # Componentes específicos
│   ├── ModuleComponent.tsx
│   └── FeatureComponent.tsx
├── widgets/                 # Widgets para dashboards
│   └── MetricWidget.tsx
├── hooks/                   # Custom hooks
│   └── useModuleData.ts
├── services/                # Lógica de negócio
│   └── module-service.ts
└── types/                   # TypeScript types
    └── index.ts
```

### Passo 2: Criar Manifest

```typescript
// src/modules/seu-modulo/manifest.ts
import { lazy } from 'react';
import type { ModuleManifest } from '@/core/modules';

const SeuModulo: ModuleManifest = {
  // Metadata
  id: 'seu-modulo',
  name: 'Nome do Módulo',
  version: '1.0.0',
  description: 'Descrição do módulo',

  // Permissões requeridas
  permissions: [
    'seu-modulo.read',
    'seu-modulo.write',
  ],

  // Rotas
  routes: [
    {
      path: '/seu-modulo',
      component: lazy(() => import('./pages/ModulePage')),
      meta: {
        requiresAuth: true,
        roles: ['admin', 'manager'],
        title: 'Seu Módulo',
      },
    },
  ],

  // Navegação
  navigation: [
    {
      label: 'Seu Módulo',
      path: '/seu-modulo',
      icon: 'Package',
      order: 10,
    },
  ],

  // Widgets
  widgets: [
    {
      id: 'seu-widget',
      name: 'Seu Widget',
      component: lazy(() => import('./widgets/MetricWidget')),
      defaultSize: { w: 2, h: 2 },
    },
  ],

  // Lifecycle hooks
  onActivate: async () => {
    console.log('Módulo ativado');
  },

  onDeactivate: async () => {
    console.log('Módulo desativado');
  },

  // Serviços
  services: {
    meuServico: {
      async getData() {
        // Implementação
        return [];
      },
    },
  },

  // Event handlers
  eventHandlers: {
    'seu-modulo:evento': async (event) => {
      console.log('Evento recebido:', event);
    },
  },
};

export default SeuModulo;
```

### Passo 3: Carregar Módulo

```typescript
// No App.tsx ou onde módulos são inicializados
import { moduleLoader } from '@/core/modules';

async function initializeModules() {
  // Carregar módulos habilitados
  const enabledModules = ['governance', 'seu-modulo'];

  for (const moduleId of enabledModules) {
    try {
      await moduleLoader.loadModule(moduleId);
      console.log(`✅ Módulo ${moduleId} carregado`);
    } catch (error) {
      console.error(`❌ Erro ao carregar módulo ${moduleId}:`, error);
    }
  }
}

initializeModules();
```

## Comunicação Entre Módulos

### Exemplo: Módulo A emite evento, Módulo B escuta

**Módulo A (Governance):**

```typescript
// Em algum serviço do módulo A
import { eventBus } from '@/core/modules';

async function submitAssessment(assessmentId: string) {
  // Lógica de submit
  const score = await calculateScore(assessmentId);

  // Emitir evento
  await eventBus.emit(
    'governance:assessment-completed',
    {
      assessmentId,
      score,
      timestamp: new Date(),
    },
    { module: 'governance' }
  );
}
```

**Módulo B (Risk Management):**

```typescript
// No manifest do módulo B
const RiskManagementModule: ModuleManifest = {
  // ...
  eventHandlers: {
    'governance:assessment-completed': async (event) => {
      const { assessmentId, score } = event.data;

      // Criar riscos baseado no assessment
      if (score < 70) {
        await riskService.createRiskFromAssessment(assessmentId);
      }
    },
  },
};
```

## Usando Serviços de Outros Módulos

```typescript
// Em qualquer componente ou serviço
import { serviceRegistry } from '@/core/modules';

async function integrarComGovernance() {
  // Obter serviço de assessments do módulo governance
  const assessmentService = serviceRegistry.get('assessments', 'governance');

  // Usar serviço
  const assessment = await assessmentService.getById('123');

  // Obter serviço de scoring
  const scoringService = serviceRegistry.get('scoring', 'governance');
  const score = await scoringService.calculate(answers);

  return { assessment, score };
}
```

## Lifecycle Hooks

### onActivate

Chamado quando módulo é ativado.

```typescript
onActivate: async () => {
  // Inicializar estado
  await initializeStore();

  // Carregar dados cache
  await loadCachedData();

  // Registrar listeners
  window.addEventListener('beforeunload', saveState);
},
```

### onDeactivate

Chamado quando módulo é desativado.

```typescript
onDeactivate: async () => {
  // Salvar estado
  await saveState();

  // Limpar cache
  clearCache();

  // Remover listeners
  window.removeEventListener('beforeunload', saveState);
},
```

### onConfigure

Chamado quando configuração do módulo muda.

```typescript
onConfigure: async (config) => {
  // Aplicar configurações
  if (config.settings?.enableAutoSave) {
    startAutoSave(config.settings.autoSaveInterval);
  }
},
```

## Event Types Padrão

```typescript
// Eventos do sistema
'module:loaded'
'module:activated'
'module:deactivated'
'module:error'

// Eventos de usuário
'user:logged-in'
'user:logged-out'
'user:updated'

// Eventos de sistema
'system:theme-changed'
'system:organization-changed'

// Eventos personalizados do módulo
'governance:assessment-created'
'governance:assessment-updated'
'governance:assessment-completed'
'governance:gap-detected'
```

## Best Practices

### ✅ Faça

1. **Use lazy loading** para componentes de páginas
2. **Defina permissões** granulares para cada módulo
3. **Emita eventos** para ações importantes
4. **Documente serviços** expostos pelo módulo
5. **Valide dependências** antes de usar serviços
6. **Cleanup no onDeactivate** para evitar memory leaks
7. **Use TypeScript** para types de serviços e eventos

### ❌ Evite

1. **Acessar diretamente** estado de outros módulos
2. **Tight coupling** entre módulos
3. **Importação circular** entre módulos
4. **Serviços síncronos** que bloqueiam UI
5. **Eventos sem namespace** (use `modulo:evento`)
6. **Memory leaks** com event listeners
7. **Exceções não tratadas** em event handlers

## Debugging

### Ver módulos carregados

```typescript
import { moduleLoader } from '@/core/modules';

// Ver todos os módulos
const modules = moduleLoader.getAllModules();
console.table(modules.map(m => ({
  id: m.manifest.id,
  status: m.status,
  version: m.manifest.version,
})));

// Ver módulos ativos
const active = moduleLoader.getActiveModules();
```

### Ver eventos recentes

```typescript
import { eventBus } from '@/core/modules';

// Ver histórico de eventos
const history = eventBus.getHistory({ limit: 50 });
console.log('Recent events:', history);

// Ver eventos de um módulo específico
const governanceEvents = eventBus.getHistory({
  module: 'governance',
  limit: 20,
});
```

### Ver serviços registrados

```typescript
import { serviceRegistry } from '@/core/modules';

// Ver todos os serviços
const services = serviceRegistry.getAllServices();
console.table(services);

// Ver serviços de um módulo
const governanceServices = serviceRegistry.getModuleServices('governance');
```

## Testes

### Testando um Módulo

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { moduleLoader } from '@/core/modules';

describe('Governance Module', () => {
  beforeEach(async () => {
    // Carregar módulo antes de cada teste
    await moduleLoader.loadModule('governance');
  });

  afterEach(async () => {
    // Descarregar módulo após cada teste
    await moduleLoader.unloadModule('governance');
  });

  it('should load successfully', () => {
    const module = moduleLoader.getModule('governance');
    expect(module?.status).toBe('active');
  });

  it('should register services', () => {
    const hasService = serviceRegistry.has('assessments', 'governance');
    expect(hasService).toBe(true);
  });

  it('should emit events', async () => {
    let eventReceived = false;

    const unsubscribe = eventBus.on('governance:assessment-completed', () => {
      eventReceived = true;
    });

    await eventBus.emit('governance:assessment-completed', {}, { module: 'governance' });

    expect(eventReceived).toBe(true);
    unsubscribe();
  });
});
```

## Próximos Passos

- [Creating Modules](./creating-modules.md)
- [Inter-Module Communication](./inter-module-communication.md)
- [Module Registry](./module-registry.md)
- [ADR-0024: Modular Architecture](../../adr/0024-modular-architecture.md)

## Referências

- [Architecture Guide](./architecture.md)
- [Module System Types](/src/core/modules/types.ts)
- [Governance Module Example](/src/modules/governance/manifest.ts)

---

**Dúvidas?** Consulte [Developer Docs](./README.md) ou [GitHub Discussions](https://github.com/your-org/trustlayer/discussions)

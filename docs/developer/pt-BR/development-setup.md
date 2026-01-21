# Development Setup - TrustLayer Developer Guide

---
**Perfil**: Developer
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a configuração do ambiente de desenvolvimento para o TrustLayer.

## Requisitos

### Software Necessário

| Software | Versão Mínima | Recomendada |
|----------|---------------|-------------|
| Node.js | 18.x | 20.x LTS |
| npm | 9.x | 10.x |
| Git | 2.30 | Latest |
| Docker | 20.x | Latest |
| VS Code | - | Latest |

### Verificar Instalação

```bash
node --version    # v20.x.x
npm --version     # 10.x.x
git --version     # 2.x.x
docker --version  # 24.x.x
```

## Setup do Projeto

### 1. Clonar Repositório

```bash
git clone https://github.com/your-org/trustlayer.git
cd trustlayer
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar com suas configurações
code .env.local
```

**Variáveis essenciais:**

```env
# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key

# API
VITE_API_URL=http://localhost:54321/functions/v1

# AI (opcional para dev)
VITE_OPENAI_API_KEY=sk-...

# Feature Flags
VITE_FEATURE_AI_ASSISTANT=true
VITE_FEATURE_AUDIO=true
```

### 4. Iniciar Supabase Local

```bash
# Iniciar todos os serviços Supabase
npx supabase start

# Verificar status
npx supabase status

# Saída esperada:
#   API URL: http://localhost:54321
#   DB URL: postgresql://postgres:postgres@localhost:54322/postgres
#   Studio URL: http://localhost:54323
#   Inbucket URL: http://localhost:54324
```

### 5. Executar Migrations

```bash
# Reset completo (migrations + seed)
npx supabase db reset

# Ou apenas migrations
npx supabase db push
```

### 6. Iniciar Aplicação

```bash
npm run dev
```

Acesse: **http://localhost:5173**

## Estrutura do Projeto

```
trustlayer/
├── src/
│   ├── components/       # Componentes React reutilizáveis
│   │   ├── common/       # Componentes genéricos (Button, Input)
│   │   ├── layout/       # Componentes de layout (Sidebar, Header)
│   │   └── features/     # Componentes específicos de features
│   ├── core/             # Core do sistema
│   │   ├── events/       # Event Bus
│   │   ├── modules/      # Module Loader
│   │   ├── routing/      # Router
│   │   └── services/     # Service Registry
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Bibliotecas e utilitários
│   │   ├── supabase.ts   # Cliente Supabase
│   │   ├── api.ts        # Cliente API
│   │   └── utils/        # Funções utilitárias
│   ├── modules/          # Módulos da aplicação
│   │   ├── governance/   # Módulo de Governance
│   │   ├── reports/      # Módulo de Reports
│   │   └── settings/     # Módulo de Settings
│   ├── pages/            # Páginas da aplicação
│   ├── stores/           # State management (Zustand)
│   ├── styles/           # Estilos globais
│   └── types/            # TypeScript types
├── supabase/
│   ├── functions/        # Edge Functions
│   ├── migrations/       # Database migrations
│   └── seed.sql          # Seed data
├── tests/
│   ├── unit/             # Testes unitários
│   ├── integration/      # Testes de integração
│   └── e2e/              # Testes E2E
├── docs/                 # Documentação
└── public/               # Assets estáticos
```

## Comandos Úteis

### Desenvolvimento

```bash
# Iniciar dev server
npm run dev

# Build para produção
npm run build

# Preview build de produção
npm run preview

# Type check
npm run typecheck

# Lint
npm run lint

# Lint com fix
npm run lint:fix

# Format com Prettier
npm run format
```

### Testes

```bash
# Rodar todos os testes
npm test

# Testes em watch mode
npm run test:watch

# Testes com coverage
npm run test:coverage

# Testes E2E
npm run test:e2e

# Testes E2E com UI
npm run test:e2e:ui
```

### Supabase

```bash
# Iniciar Supabase local
npx supabase start

# Parar Supabase local
npx supabase stop

# Status dos serviços
npx supabase status

# Gerar tipos TypeScript
npm run db:types

# Nova migration
npx supabase migration new nome_da_migration

# Aplicar migrations
npx supabase db push

# Reset completo (cuidado!)
npx supabase db reset

# Verificar diff com remoto
npx supabase db diff
```

### Edge Functions

```bash
# Servir functions localmente
npx supabase functions serve

# Deploy de uma function
npx supabase functions deploy nome_da_function

# Deploy de todas as functions
npx supabase functions deploy
```

## Configuração do Editor

### VS Code

**Extensões Recomendadas:**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "vitest.explorer",
    "ms-playwright.playwright"
  ]
}
```

**Settings (`.vscode/settings.json`):**

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Banco de Dados

### Acessar Studio

Supabase Studio local: **http://localhost:54323**

### Conexão Direta

```bash
# Via psql
psql postgresql://postgres:postgres@localhost:54322/postgres

# Via pgAdmin ou DBeaver
Host: localhost
Port: 54322
User: postgres
Password: postgres
Database: postgres
```

### Gerar Tipos

Sempre que alterar o schema, regenere os tipos:

```bash
npm run db:types
```

Isso gera `src/types/database.types.ts` com tipos TypeScript do schema.

## Debugging

### React DevTools

Instale a extensão React DevTools no browser.

### Network Tab

Use a aba Network do DevTools para debugar requisições API.

### Supabase Logs

```bash
# Logs das Edge Functions
npx supabase functions logs

# Logs do banco
docker logs supabase_db_trustlayer
```

### VS Code Debugger

**launch.json:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## Troubleshooting

### Porta em uso

```bash
# Verificar o que está usando a porta
lsof -i :5173
lsof -i :54321

# Matar processo
kill -9 <PID>
```

### Supabase não inicia

```bash
# Verificar Docker
docker ps

# Reiniciar Supabase
npx supabase stop
npx supabase start

# Reset completo
npx supabase stop --no-backup
npx supabase start
```

### Tipos desatualizados

```bash
# Regenerar tipos
npm run db:types

# Reiniciar TypeScript server no VS Code
Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server"
```

### Cache do Vite

```bash
# Limpar cache
rm -rf node_modules/.vite
npm run dev
```

## Próximos Passos

1. [Codebase Structure](./codebase-structure.md)
2. [Contributing Guide](./contributing.md)
3. [Testing Guide](./testing.md)
4. [API Reference](./api-reference.md)

# CI/CD Pipeline

Sistema completo de CI/CD com linting, formatação, validação de PR e automação.

## Índice

- [Visão Geral](#visão-geral)
- [ESLint](#eslint)
- [Prettier](#prettier)
- [Danger.js](#dangerjs)
- [Dependabot](#dependabot)
- [Pre-commit Hooks](#pre-commit-hooks)
- [GitHub Actions](#github-actions)
- [Boas Práticas](#boas-práticas)

## Visão Geral

O pipeline de CI/CD do TrustLayer inclui:

- **ESLint Strict**: Regras rigorosas de linting para TypeScript/React
- **Prettier**: Formatação automática de código
- **Danger.js**: Validação automatizada de Pull Requests
- **Dependabot**: Atualizações automatizadas de dependências
- **Pre-commit Hooks**: Validação antes de commits
- **GitHub Actions**: Workflows automatizados de CI

## ESLint

### Configuração

Arquivo: [eslint.config.js](../../../eslint.config.js)

### Regras Habilitadas

**TypeScript Strict:**
- Variáveis não utilizadas (error)
- Uso de `any` (warning)
- Promises não tratadas (error)
- Type assertions desnecessárias (warning)
- Nullish coalescing (warning)
- Optional chaining (warning)
- Consistent type imports (warning)

**Best Practices:**
- console.log permitido apenas com eslint-disable
- debugger proibido (error)
- alert desaconselhado (warning)
- preferência por const (error)
- var proibido (error)
- equality estrita (error)
- curly braces obrigatórias (error)

**Code Quality:**
- Complexidade máxima: 15 (warning)
- Profundidade máxima: 4 (warning)
- Linhas por arquivo: 500 (warning)
- Linhas por função: 100 (warning)
- Parâmetros por função: 5 (warning)

### Uso

```bash
# Lint all files
npm run lint

# Lint and auto-fix
npm run lint:fix

# Type check
npm run type-check
```

## Prettier

### Configuração

Arquivo: [.prettierrc.json](../../../.prettierrc.json)

Principais configurações:
- Print width: 100
- Tab width: 2
- Single quotes: true
- Semicolons: true
- Trailing commas: ES5
- Arrow parens: always

### Uso

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

## Danger.js

### Validações Automáticas

1. **Tamanho do PR**: Warning se > 500 arquivos
2. **Descrição do PR**: Error se < 10 caracteres
3. **WIP/Draft**: Message para PRs em progresso
4. **Conventional Commits**: Valida formato de commits
5. **CHANGELOG**: Lembra de atualizar
6. **Tests**: Alerta se faltam testes
7. **Migrations**: Checklist para migrations
8. **Security Files**: Error para arquivos sensíveis
9. **i18n**: Lembra traduções PT-BR, EN-US, ES-ES

## Dependabot

### Configuração

Arquivo: [.github/dependabot.yml](../../../.github/dependabot.yml)

- npm: Toda segunda às 9h
- Docker: Semanal
- GitHub Actions: Semanal
- Limite: 10 PRs abertos
- Labels: `dependencies`, `automated`

## Pre-commit Hooks

### O que Executa

1. **lint-staged**: Processa apenas arquivos staged
2. **ESLint**: Auto-fix em .ts/.tsx
3. **Prettier**: Formata todos arquivos

### Instalação

```bash
npm install --save-dev husky lint-staged
npm run prepare
```

## GitHub Actions

### Workflows

Arquivo: [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)

**Jobs:**
1. Lint
2. Type Check
3. Test
4. Build
5. Danger (apenas PRs)

## Boas Práticas

### Commits

```bash
# Bom
git commit -m "feat(auth): add MFA support"
git commit -m "fix(dashboard): resolve chart issue"

# Ruim
git commit -m "changes"
git commit -m "fix stuff"
```

### Code Review Checklist

- [ ] Código segue padrões
- [ ] Tests cobrem mudanças
- [ ] Documentação atualizada
- [ ] Sem secrets hardcoded
- [ ] Performance verificada
- [ ] Security validada
- [ ] i18n completo

## Troubleshooting

### ESLint Errors

```bash
rm -rf node_modules .eslintcache
npm install
```

### Pre-commit Hook não Executa

```bash
rm -rf .husky
npm run prepare
```

### Type Check Falha

```bash
npx tsc --noEmit
rm -rf node_modules/@types
npm install
```

## Referências

- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Danger.js Guides](https://danger.systems/js/)
- [Conventional Commits](https://www.conventionalcommits.org/)

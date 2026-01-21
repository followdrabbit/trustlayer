# Test Plan - TrustLayer

---
**Perfil**: QA
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## 1. Introdução

### 1.1 Propósito

Este documento define a estratégia de testes para a plataforma TrustLayer, incluindo objetivos, escopo, abordagem, recursos e cronograma de atividades de teste.

### 1.2 Escopo

**Em Escopo:**
- Frontend (React/TypeScript)
- Backend (Supabase Edge Functions)
- Database (PostgreSQL com RLS)
- Integrações (SAML, Email providers, AI)
- APIs REST

**Fora de Escopo:**
- Infraestrutura de terceiros (Supabase, Vercel)
- Provedores de email externos
- IdPs externos (Okta, Azure AD)

### 1.3 Objetivos de Qualidade

| Métrica | Target | Crítico |
|---------|--------|---------|
| Code Coverage | >80% | >70% |
| Bug Escape Rate | <5% | <10% |
| Mean Time to Detect | <4h | <8h |
| Test Pass Rate | >95% | >90% |
| P1/P2 Bugs in Prod | 0 | <2 |

## 2. Estratégia de Testes

### 2.1 Níveis de Teste

```
┌─────────────────────────────────────────────────────┐
│                  PIRÂMIDE DE TESTES                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│                    ┌─────────┐                      │
│                    │   E2E   │ 10% (Playwright)     │
│                    │  Tests  │                      │
│                ┌───┴─────────┴───┐                  │
│                │   Integration   │ 30% (Vitest)     │
│                │      Tests      │                  │
│            ┌───┴─────────────────┴───┐              │
│            │       Unit Tests        │ 60% (Vitest) │
│            │                         │              │
│            └─────────────────────────┘              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Unit Tests (60%)
- **Ferramenta**: Vitest
- **Escopo**: Funções, hooks, utilities, componentes isolados
- **Responsável**: Desenvolvedores
- **Execução**: CI/CD em cada commit

#### Integration Tests (30%)
- **Ferramenta**: Vitest + MSW + Supabase Local
- **Escopo**: Módulos integrados, serviços, fluxos de dados
- **Responsável**: Desenvolvedores + QA
- **Execução**: CI/CD em cada PR

#### E2E Tests (10%)
- **Ferramenta**: Playwright
- **Escopo**: Fluxos de usuário críticos
- **Responsável**: QA
- **Execução**: CI/CD em PRs para main, nightly

### 2.2 Tipos de Teste

| Tipo | Descrição | Ferramenta | Frequência |
|------|-----------|------------|------------|
| Funcional | Validar requisitos funcionais | Playwright/Manual | Contínuo |
| Regressão | Garantir que features existentes funcionam | Playwright | PR/Release |
| Smoke | Validação rápida de funcionalidade básica | Playwright | Deploy |
| Performance | Medir tempo de resposta e recursos | Lighthouse/k6 | Semanal |
| Segurança | Identificar vulnerabilidades | OWASP ZAP/Manual | Mensal |
| Acessibilidade | Validar conformidade WCAG | Axe/Manual | Release |
| Exploratório | Descobrir bugs não cobertos | Manual | Sprint |
| Usabilidade | Validar UX/UI | Manual | Release |

### 2.3 Abordagem por Feature

| Feature | Unit | Integration | E2E | Manual | Performance | Security |
|---------|------|-------------|-----|--------|-------------|----------|
| Authentication | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| MFA | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| RBAC | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| Assessments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboards | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Reports | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| AI Assistant | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Audit Logs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 3. Ambiente de Testes

### 3.1 Ambientes

| Ambiente | URL | Propósito | Dados |
|----------|-----|-----------|-------|
| Local | localhost:5173 | Desenvolvimento | Mock/Seed |
| Dev | dev.trustlayer.com | Integração | Seed |
| Staging | staging.trustlayer.com | QA/UAT | Sanitized Prod |
| Prod | app.trustlayer.com | Produção | Real |

### 3.2 Configuração de Ambiente de Teste

```bash
# 1. Setup do ambiente local
git clone https://github.com/your-org/trustlayer.git
cd trustlayer
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.test
# Editar .env.test com credenciais de teste

# 3. Iniciar Supabase local
npx supabase start

# 4. Rodar migrations e seed
npx supabase db reset

# 5. Iniciar aplicação
npm run dev

# 6. Rodar testes
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

### 3.3 Dados de Teste

**Organizações:**
- `org-001`: TechCorp (dados completos)
- `org-002`: StartupXYZ (vazia)
- `org-003`: EnterpriseCo (multi-domain)

**Usuários:**

| Role | Email | Password | Org |
|------|-------|----------|-----|
| Admin | admin@test.trustlayer.com | Test@123 | TechCorp |
| Manager | manager@test.trustlayer.com | Test@123 | TechCorp |
| Analyst | analyst@test.trustlayer.com | Test@123 | TechCorp |
| Auditor | auditor@test.trustlayer.com | Test@123 | TechCorp |
| Viewer | viewer@test.trustlayer.com | Test@123 | TechCorp |

## 4. Critérios de Teste

### 4.1 Critérios de Entrada

- [ ] Build compilou com sucesso
- [ ] Testes unitários passando (>95%)
- [ ] Ambiente de teste disponível
- [ ] Dados de teste carregados
- [ ] Requisitos documentados
- [ ] Test cases escritos

### 4.2 Critérios de Saída

- [ ] Todos os test cases executados
- [ ] 0 bugs críticos abertos
- [ ] <3 bugs de alta severidade
- [ ] Code coverage >80%
- [ ] Smoke tests passando
- [ ] Sign-off do QA Lead

### 4.3 Critérios de Suspensão

- Ambiente de teste indisponível por >4h
- >5 bugs críticos encontrados
- Build quebrado
- Blocker não resolvido

### 4.4 Critérios de Retomada

- Ambiente restaurado
- Bugs críticos corrigidos
- Build estável
- Blocker resolvido

## 5. Test Cases

### 5.1 Estrutura de Test Case

```markdown
## TC-XXX: [Título do Test Case]

**Módulo**: [Nome do módulo]
**Prioridade**: P1/P2/P3
**Tipo**: Funcional/Regressão/Smoke
**Pré-condições**: [Setup necessário]

### Passos

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Ação 1 | Dados de entrada | Resultado |
| 2 | Ação 2 | Dados de entrada | Resultado |

### Pós-condições
- [Estado final esperado]

### Notas
- [Observações adicionais]
```

### 5.2 Test Cases Críticos (Smoke)

#### TC-001: Login com credenciais válidas
**Módulo**: Authentication
**Prioridade**: P1
**Tipo**: Smoke

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Acessar /login | - | Página de login exibida |
| 2 | Inserir email | admin@test.trustlayer.com | Campo preenchido |
| 3 | Inserir senha | Test@123 | Campo preenchido (masked) |
| 4 | Clicar "Login" | - | Redirect para /dashboard |

#### TC-002: Criar Assessment
**Módulo**: Assessments
**Prioridade**: P1
**Tipo**: Smoke

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Login como Manager | manager@test.trustlayer.com | Dashboard exibido |
| 2 | Navegar para Assessments | - | Lista de assessments |
| 3 | Clicar "New Assessment" | - | Modal de criação abre |
| 4 | Selecionar framework | NIST-CSF | Framework selecionado |
| 5 | Clicar "Start" | - | Redirect para questions |
| 6 | Verificar assessment | - | Status "Draft" na lista |

#### TC-003: Visualizar Dashboard
**Módulo**: Dashboards
**Prioridade**: P1
**Tipo**: Smoke

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Login como Manager | - | Dashboard exibido |
| 2 | Verificar Score card | - | Score numérico exibido |
| 3 | Verificar Trend chart | - | Gráfico renderizado |
| 4 | Verificar Gaps table | - | Lista de gaps exibida |

#### TC-004: Exportar Relatório
**Módulo**: Reports
**Prioridade**: P1
**Tipo**: Smoke

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Navegar para Reports | - | Página de reports |
| 2 | Clicar "Export" | - | Modal de export abre |
| 3 | Selecionar formato | Excel | Formato selecionado |
| 4 | Clicar "Download" | - | Arquivo .xlsx baixado |

### 5.3 Test Cases por Módulo

Ver arquivos específicos:
- [scenarios-assessments.md](./scenarios-assessments.md)
- [scenarios-dashboards.md](./scenarios-dashboards.md)
- [scenarios-reports.md](./scenarios-reports.md)
- [scenarios-admin.md](./scenarios-admin.md)

## 6. Automação de Testes

### 6.1 Estrutura de Testes Automatizados

```
tests/
├── unit/                    # Vitest unit tests
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
├── integration/             # Vitest integration tests
│   ├── api/
│   ├── database/
│   └── services/
├── e2e/                     # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── assessments.spec.ts
│   ├── dashboards.spec.ts
│   ├── reports.spec.ts
│   └── fixtures/
└── mocks/                   # MSW handlers
    ├── handlers/
    └── data/
```

### 6.2 Comandos de Teste

```bash
# Unit Tests
npm run test                 # Rodar todos
npm run test:watch           # Watch mode
npm run test:coverage        # Com coverage
npm run test:ui              # UI mode

# E2E Tests
npm run test:e2e             # Rodar todos
npm run test:e2e:ui          # UI mode
npm run test:e2e:headed      # Com browser visível
npm run test:e2e:debug       # Debug mode

# Specific Tests
npx vitest tests/unit/auth
npx playwright test auth.spec.ts
```

### 6.3 CI/CD Pipeline

```yaml
# GitHub Actions
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci

    - name: Unit Tests
      run: npm run test:coverage

    - name: Integration Tests
      run: npm run test:integration

    - name: E2E Tests
      run: npm run test:e2e

    - name: Upload Coverage
      uses: codecov/codecov-action@v4
```

## 7. Gestão de Defeitos

### 7.1 Workflow de Bug

```
┌─────────┐     ┌──────────┐     ┌───────────┐     ┌────────┐
│   New   │────▶│ Triaged  │────▶│ In Progress│────▶│ Fixed  │
└─────────┘     └──────────┘     └───────────┘     └────────┘
                     │                                  │
                     │                                  ▼
                     │                            ┌──────────┐
                     └───────────────────────────▶│ Verified │
                                                  └──────────┘
                                                        │
                                                        ▼
                                                  ┌──────────┐
                                                  │  Closed  │
                                                  └──────────┘
```

### 7.2 Severidade

| Nível | Descrição | SLA | Exemplo |
|-------|-----------|-----|---------|
| P1 - Critical | Sistema down, data loss | 2h | Não consegue fazer login |
| P2 - High | Feature principal quebrada | 1 dia | Não cria assessment |
| P3 - Medium | Feature parcialmente quebrada | 3 dias | Export Excel falha |
| P4 - Low | Issue menor, workaround existe | 1 semana | Typo na UI |

### 7.3 Template de Bug Report

```markdown
## [MÓDULO] Título descritivo do bug

**Severity**: P1/P2/P3/P4
**Environment**: Staging/Prod
**Browser**: Chrome 120
**OS**: Windows 11

### Steps to Reproduce
1. Login como admin@test.trustlayer.com
2. Navegar para Assessments
3. Clicar "New Assessment"
4. Observar erro

### Expected Result
Modal de criação deve abrir

### Actual Result
Erro "Undefined is not a function" no console

### Screenshots
[Anexar screenshots]

### Console Logs
```
TypeError: Cannot read property 'id' of undefined
```

### Additional Info
- Ocorre apenas no Chrome
- Firefox funciona normalmente
```

## 8. Métricas e Reporting

### 8.1 Métricas de Qualidade

| Métrica | Fórmula | Target |
|---------|---------|--------|
| Test Coverage | (Lines tested / Total lines) × 100 | >80% |
| Test Pass Rate | (Tests passed / Total tests) × 100 | >95% |
| Defect Density | Bugs / KLOC | <5 |
| Bug Escape Rate | (Prod bugs / Total bugs) × 100 | <5% |
| MTTR | Avg time to fix bugs | <1 day |

### 8.2 Dashboard de QA

**Atualização**: Diária

- Test execution status
- Bug trend chart
- Coverage trend
- Quality gates status

### 8.3 Reports

| Report | Frequência | Audiência |
|--------|------------|-----------|
| Daily Test Report | Diário | Dev Team |
| Sprint Test Summary | Sprint | Stakeholders |
| Release Test Report | Release | Management |
| Monthly Quality Report | Mensal | Executive |

## 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Ambiente instável | Médio | Alto | Ambiente dedicado de QA |
| Falta de dados de teste | Baixo | Médio | Script de seed automatizado |
| Testes flaky | Médio | Médio | Retry policy, stable selectors |
| Falta de cobertura | Médio | Alto | Coverage gates no CI |
| Bugs em produção | Baixo | Alto | Smoke tests pós-deploy |

## 10. Cronograma

### 10.1 Ciclo de Teste por Sprint

| Dia | Atividade |
|-----|-----------|
| D1-D2 | Test planning, environment setup |
| D3-D7 | Feature testing |
| D8-D9 | Regression testing |
| D10 | Bug verification, sign-off |

### 10.2 Milestones

| Milestone | Data | Critério |
|-----------|------|----------|
| Test Plan Approved | Sprint Start | Document reviewed |
| Test Cases Ready | D2 | All test cases written |
| Feature Testing Complete | D7 | All features tested |
| Regression Complete | D9 | All regression tests pass |
| Release Sign-off | D10 | All exit criteria met |

## 11. Aprovações

| Role | Nome | Data | Assinatura |
|------|------|------|------------|
| QA Lead | _________________ | _________ | _________ |
| Dev Lead | _________________ | _________ | _________ |
| Product Owner | _________________ | _________ | _________ |
| Stakeholder | _________________ | _________ | _________ |

## Referências

- [Feature Checklist](./feature-checklist.md)
- [Test Scenarios](./scenarios-assessments.md)
- [Automated Testing Guide](./automated-testing.md)
- [Bug Report Template](./bug-report-template.md)
- [Developer Docs](../../developer/pt-BR/README.md)

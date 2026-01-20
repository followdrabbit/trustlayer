# Documentação para QA/Testers - TrustLayer

---
**Perfil**: QA
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-20

---

## Visão Geral

Esta seção da documentação é destinada a **analistas de QA e testers** responsáveis por garantir a qualidade, testar features e validar requisitos da plataforma TrustLayer.

## Público-Alvo

- QA Engineers
- Testers manuais
- Testers automatizados
- Product Owners (validação de features)

## Pré-requisitos

Para testar TrustLayer, você deve ter:

- Conhecimento de metodologias de teste (funcional, regressão, exploratório)
- Familiaridade com ferramentas de teste (Playwright, Postman)
- Acesso ao ambiente de teste
- Conhecimento básico de SQL (para validação de dados)
- Conhecimento de Git (para reportar bugs)

## Índice

### 1. Estratégia de Testes
- [Test Plan](./test-plan.md)
- [Estratégia de Testes](./testing-strategy.md)
- [Níveis de Teste](./test-levels.md)
- [Tipos de Teste](./test-types.md)

### 2. Feature Checklists
- [Feature Checklist Master](./feature-checklist.md)
- [Assessments Module](./checklist-assessments.md)
- [Dashboards Module](./checklist-dashboards.md)
- [Reports Module](./checklist-reports.md)
- [Authentication & Security](./checklist-auth.md)

### 3. Test Scenarios
- [Test Scenarios - Assessments](./scenarios-assessments.md)
- [Test Scenarios - Dashboards](./scenarios-dashboards.md)
- [Test Scenarios - Reports](./scenarios-reports.md)
- [Test Scenarios - Admin](./scenarios-admin.md)

### 4. Test Execution
- [Manual Testing Guide](./manual-testing.md)
- [Automated Testing Guide](./automated-testing.md)
- [Regression Test Suite](./regression-suite.md)
- [Smoke Test Suite](./smoke-suite.md)

### 5. Bug Reporting
- [Bug Report Template](./bug-report-template.md)
- [Severity Guidelines](./severity-guidelines.md)
- [Bug Workflow](./bug-workflow.md)

### 6. Test Data
- [Test Data Management](./test-data-management.md)
- [Creating Test Organizations](./test-organizations.md)
- [Sample Data Generation](./sample-data.md)

### 7. Tools & Environment
- [Test Environment Access](./test-environment.md)
- [Playwright E2E Tests](./playwright-guide.md)
- [Postman API Testing](./postman-guide.md)
- [Database Access for Testing](./database-testing.md)

## Quick Start para QA

### 1. Setup do Ambiente de Testes

```bash
# Clone do repositório
git clone https://github.com/your-org/trustlayer.git
cd trustlayer

# Instalar dependências
npm install

# Configurar ambiente de teste
cp .env.test.example .env.test

# Iniciar ambiente local
npm run dev

# Rodar testes E2E
npm run test:e2e
```

### 2. Acessar Ambiente de Teste

**URL**: https://test.trustlayer.com

**Credenciais de Teste**:

| Role      | Email                     | Password   |
|-----------|---------------------------|------------|
| Admin     | admin@test.trustlayer.com | Test@123   |
| Manager   | manager@test.trustlayer.com | Test@123 |
| Analyst   | analyst@test.trustlayer.com | Test@123 |
| Auditor   | auditor@test.trustlayer.com | Test@123 |
| Viewer    | viewer@test.trustlayer.com  | Test@123 |

**Organizações de Teste**:
- **TechCorp** (ID: `org-001`) - Organização completa com dados
- **StartupXYZ** (ID: `org-002`) - Organização vazia para testes
- **EnterpriseCo** (ID: `org-003`) - Multi-domain setup

### 3. Rodar Smoke Tests

```bash
# Smoke tests completos
npm run test:smoke

# Ou manualmente
# 1. Login → Dashboard
# 2. Create Assessment
# 3. Answer Questions
# 4. View Score
# 5. Export Report
```

## Estrutura de Testes

### Pirâmide de Testes

```
        ┌─────────┐
        │   E2E   │  (10%)
        │  Tests  │
        ├─────────┤
        │Integration│ (30%)
        │  Tests    │
        ├──────────┤
        │   Unit    │ (60%)
        │   Tests   │
        └───────────┘
```

- **Unit Tests**: 60% dos testes (Vitest)
- **Integration Tests**: 30% (Vitest + Supabase local)
- **E2E Tests**: 10% (Playwright)

### Tipos de Teste por Feature

| Feature        | Unit | Integration | E2E | Manual |
|----------------|------|-------------|-----|--------|
| Assessments    | ✅   | ✅          | ✅  | ✅     |
| Dashboards     | ✅   | ✅          | ✅  | ✅     |
| Reports        | ✅   | ✅          | ✅  | ✅     |
| Authentication | ✅   | ✅          | ✅  | ✅     |
| RBAC           | ✅   | ✅          | ✅  | ✅     |
| SSO/SAML       | ❌   | ✅          | ✅  | ✅     |
| MFA            | ✅   | ✅          | ✅  | ✅     |

## Feature Coverage Checklist

### ✅ Phase 1: Core Features (90% Enterprise Ready)

#### Authentication & Security
- [x] Login com email/senha
- [x] SSO/SAML integration
- [x] MFA (TOTP)
- [x] MFA (WebAuthn)
- [x] Session management
- [x] Password reset
- [x] RBAC (5 roles)

#### Assessments
- [x] Create assessment
- [x] Answer questions
- [x] Save progress
- [x] Submit assessment
- [x] View score
- [x] Gap analysis
- [x] Multi-domain support

#### Dashboards
- [x] Executive Dashboard
- [x] GRC Dashboard
- [x] Specialist Dashboard
- [x] Score trends
- [x] Domain comparison

#### Reports
- [x] Export HTML
- [x] Export Excel
- [x] Email reports

### 🚧 Phase 2: Enhanced Features (Em Progresso)

#### Advanced Reporting
- [ ] Scheduled reports
- [ ] Custom templates
- [ ] PDF generation
- [ ] Multi-format export
- [ ] Report history

#### UX/UI Enhancements
- [ ] 5+ themes
- [ ] Custom fonts/colors
- [ ] Animations/transitions
- [ ] Draggable AI assistant
- [ ] User avatars
- [ ] Organization logos

#### Auditor Role
- [ ] Audit log access
- [ ] Forensic investigation
- [ ] Timeline view
- [ ] User activity tracking

#### Custom Dashboards
- [ ] Dashboard builder
- [ ] Widget library
- [ ] Drag-and-drop layout
- [ ] Admin controls

## Test Execution Guidelines

### Manual Testing Workflow

```
1. Feature Branch Deploy
   ↓
2. Smoke Tests
   ↓
3. Feature Testing (checklist)
   ↓
4. Regression Testing
   ↓
5. Bug Report (if any)
   ↓
6. Retest after fix
   ↓
7. Sign-off
```

### Regression Testing

**Quando executar:**
- Antes de cada release
- Após bug fixes críticos
- Após refactorings grandes

**Escopo:**
- Todos os cenários da suite de regressão
- Verificação de features existentes
- Cross-browser testing (Chrome, Firefox, Edge)

### Exploratory Testing

**Quando executar:**
- Novas features
- Features complexas
- Pós-refactoring

**Abordagem:**
- Session-based (2h sessions)
- Charter definido
- Notas e screenshots
- Report ao final

## Bug Reporting

### Template de Bug Report

```markdown
## Bug Title
[Component] Brief description

## Environment
- URL: https://test.trustlayer.com
- Browser: Chrome 120.0
- OS: Windows 11
- User Role: Manager

## Steps to Reproduce
1. Login as manager@test.trustlayer.com
2. Navigate to Assessments
3. Click "New Assessment"
4. Select framework "NIST-CSF"
5. Click "Start Assessment"

## Expected Result
Assessment should be created and redirect to questions page.

## Actual Result
Error message "Failed to create assessment" appears.
Assessment is not created.

## Screenshots
![Error Screenshot](link)

## Console Errors
```
TypeError: Cannot read property 'id' of undefined
  at createAssessment (assessment-service.ts:42)
```

## Severity
🔴 High - Blocks assessment creation

## Additional Info
- Happens only with NIST-CSF framework
- Other frameworks work fine
- No errors in network tab
- Database shows no new assessment record
```

### Severity Levels

| Severity | Description | Example | Response Time |
|----------|-------------|---------|---------------|
| 🔴 Critical | System down, data loss | Cannot login, database corruption | 2h |
| 🟠 High | Core feature broken | Cannot create assessment | 1 day |
| 🟡 Medium | Feature partially broken | Report export fails for some formats | 3 days |
| 🟢 Low | Minor issue, workaround exists | UI glitch, typo | 1 week |

## Test Metrics

### Coverage Goals
- **Code Coverage**: >80%
- **Feature Coverage**: 100% (all features have test cases)
- **Regression Coverage**: 100% (all critical paths)

### Quality Gates
- ✅ All smoke tests pass
- ✅ No critical/high severity bugs
- ✅ <5 medium severity bugs
- ✅ Code coverage >80%
- ✅ E2E tests pass

## Test Tools

### Playwright (E2E Tests)

```bash
# Rodar todos os testes E2E
npm run test:e2e

# Rodar com UI
npm run test:e2e:ui

# Rodar um arquivo específico
npx playwright test tests/e2e/assessments.spec.ts

# Debug mode
npx playwright test --debug

# Gerar report
npx playwright show-report
```

### Vitest (Unit/Integration Tests)

```bash
# Rodar unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# UI mode
npm run test:ui
```

### Postman (API Testing)

Collection de API: [TrustLayer API Collection](./postman-collection.json)

**Endpoints principais:**
- `POST /auth/login` - Autenticação
- `GET /assessments` - Listar assessments
- `POST /assessments` - Criar assessment
- `POST /assessments/:id/submit` - Submeter assessment
- `GET /dashboards/executive` - Dashboard executivo

## CI/CD Integration

Testes rodam automaticamente no GitHub Actions:

```yaml
# .github/workflows/ci-cd.yml
test:
  - Unit tests (Vitest)
  - Integration tests (Vitest + Supabase)
  - E2E tests (Playwright)
  - Linting (ESLint)
  - Type check (TypeScript)
```

**Status dos testes**: Ver badge no README.md

## Próximos Passos

1. Ler [Test Plan](./test-plan.md) completo
2. Familiarizar-se com [Feature Checklist](./feature-checklist.md)
3. Executar [Smoke Tests](./smoke-suite.md)
4. Revisar [Bug Report Template](./bug-report-template.md)
5. Acessar ambiente de teste e explorar

## Suporte

Para questões de QA:
- **Slack**: #trustlayer-qa
- **Email**: qa@trustlayer.com
- **Jira**: [TrustLayer QA Board](https://jira.example.com/trustlayer-qa)

## Referências

- [Testing Strategy](./testing-strategy.md)
- [Developer Docs](../../developer/pt-BR/README.md)
- [User Docs](../../user/pt-BR/README.md)
- [Playwright Docs](https://playwright.dev/)
- [Vitest Docs](https://vitest.dev/)

## Glossário

- **E2E**: End-to-End testing
- **Regression**: Teste de regressão (features existentes)
- **Smoke Test**: Testes básicos de funcionalidade
- **Flaky Test**: Teste que falha intermitentemente
- **Coverage**: Cobertura de código
- **Assertion**: Verificação de resultado esperado
- **Mock**: Objeto simulado para testes
- **Fixture**: Dados de teste pré-configurados

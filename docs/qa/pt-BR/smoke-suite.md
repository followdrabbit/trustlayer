# Smoke Test Suite - TrustLayer QA

---
**Perfil**: QA
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Smoke tests são testes rápidos executados para verificar se as funcionalidades básicas estão operacionais. Devem ser executados após cada deploy.

## Quando Executar

- ✅ Após cada deploy em qualquer ambiente
- ✅ Antes de iniciar testes detalhados
- ✅ Após manutenção de infraestrutura
- ✅ Como verificação de sanidade

## Tempo Estimado

**Manual**: ~15 minutos
**Automatizado**: ~5 minutos

## Smoke Test Checklist

### 1. Health Check (2 min)

| # | Teste | Esperado | Status |
|---|-------|----------|--------|
| 1.1 | Acessar URL da aplicação | Página carrega | ⬜ |
| 1.2 | GET /health | Status 200 | ⬜ |
| 1.3 | GET /health/ready | Status 200 | ⬜ |
| 1.4 | Verificar certificado SSL | Válido | ⬜ |

```bash
# Comandos para health check
curl -I https://app.trustlayer.com
curl https://app.trustlayer.com/health
curl https://app.trustlayer.com/health/ready
```

### 2. Autenticação (3 min)

| # | Teste | Esperado | Status |
|---|-------|----------|--------|
| 2.1 | Acessar /login | Página de login exibida | ⬜ |
| 2.2 | Login com credenciais válidas | Redirect para dashboard | ⬜ |
| 2.3 | Login com credenciais inválidas | Mensagem de erro | ⬜ |
| 2.4 | Logout | Redirect para login | ⬜ |

**Credenciais de Teste:**
```
Email: admin@test.trustlayer.com
Senha: Test@123
```

### 3. Dashboard (2 min)

| # | Teste | Esperado | Status |
|---|-------|----------|--------|
| 3.1 | Dashboard carrega | Página exibida | ⬜ |
| 3.2 | Score card visível | Número exibido | ⬜ |
| 3.3 | Gráfico de tendência | Chart renderiza | ⬜ |
| 3.4 | Lista de gaps | Dados carregam | ⬜ |

### 4. Assessments (3 min)

| # | Teste | Esperado | Status |
|---|-------|----------|--------|
| 4.1 | Navegar para Assessments | Lista carrega | ⬜ |
| 4.2 | Abrir assessment existente | Detalhes exibidos | ⬜ |
| 4.3 | Criar novo assessment (draft) | Modal abre, criação funciona | ⬜ |
| 4.4 | Responder uma pergunta | Resposta salva | ⬜ |
| 4.5 | Deletar assessment draft | Removido da lista | ⬜ |

### 5. Reports (2 min)

| # | Teste | Esperado | Status |
|---|-------|----------|--------|
| 5.1 | Navegar para Reports | Página carrega | ⬜ |
| 5.2 | Gerar relatório | Relatório gerado | ⬜ |
| 5.3 | Download Excel | Arquivo baixado | ⬜ |

### 6. Navegação (2 min)

| # | Teste | Esperado | Status |
|---|-------|----------|--------|
| 6.1 | Menu lateral funciona | Navegação OK | ⬜ |
| 6.2 | Breadcrumbs funcionam | Links corretos | ⬜ |
| 6.3 | User menu (dropdown) | Opções visíveis | ⬜ |
| 6.4 | Help/Support link | Abre documentação | ⬜ |

### 7. Performance (1 min)

| # | Teste | Esperado | Status |
|---|-------|----------|--------|
| 7.1 | Tempo de carregamento inicial | < 3s | ⬜ |
| 7.2 | Navegação entre páginas | < 1s | ⬜ |
| 7.3 | Sem erros no console | 0 erros | ⬜ |

---

## Smoke Test Automatizado

### Executar

```bash
# Via npm
npm run test:smoke

# Via Playwright diretamente
npx playwright test tests/e2e/smoke.spec.ts

# Com report
npx playwright test tests/e2e/smoke.spec.ts --reporter=html
```

### Código do Smoke Test

```typescript
// tests/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. Health check', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
  });

  test('2. Login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('3. Can login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@test.trustlayer.com');
    await page.fill('[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('4. Dashboard loads', async ({ page }) => {
    // Assumes authenticated from previous test
    await page.goto('/dashboard');
    await expect(page.getByTestId('score-card')).toBeVisible();
    await expect(page.getByTestId('trend-chart')).toBeVisible();
  });

  test('5. Assessments page loads', async ({ page }) => {
    await page.goto('/assessments');
    await expect(page.getByTestId('assessment-list')).toBeVisible();
  });

  test('6. Can create assessment', async ({ page }) => {
    await page.goto('/assessments');
    await page.click('button:has-text("New Assessment")');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.click('button:has-text("Cancel")');
  });

  test('7. Reports page loads', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByText('Reports')).toBeVisible();
  });

  test('8. Can logout', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    await expect(page).toHaveURL('/login');
  });

  test('9. No console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });
});
```

---

## Resultado do Smoke Test

### Template de Resultado

```markdown
# Smoke Test Report

**Ambiente**: [Staging/Production]
**Data**: YYYY-MM-DD HH:MM
**Executado por**: [Nome]
**Build/Version**: [versão]
**Deploy**: [commit hash]

## Resultado

| Categoria | Passed | Failed | Blocked |
|-----------|--------|--------|---------|
| Health Check | X/4 | X/4 | X/4 |
| Autenticação | X/4 | X/4 | X/4 |
| Dashboard | X/4 | X/4 | X/4 |
| Assessments | X/5 | X/5 | X/5 |
| Reports | X/3 | X/3 | X/3 |
| Navegação | X/4 | X/4 | X/4 |
| Performance | X/3 | X/3 | X/3 |
| **TOTAL** | **XX/27** | **XX/27** | **XX/27** |

## Status Final

- [ ] ✅ PASS - Deploy aprovado
- [ ] ❌ FAIL - Rollback necessário
- [ ] ⚠️ PARTIAL - Investigação necessária

## Falhas (se houver)

| # | Teste | Erro | Severidade |
|---|-------|------|------------|
| X.X | [nome] | [descrição] | P1/P2/P3 |

## Notas

[Observações adicionais]

## Sign-off

- [ ] QA: _____________ Data: _______
- [ ] Dev: _____________ Data: _______
```

---

## Critérios de Aprovação

### Deploy Aprovado (✅ PASS)

- 100% dos testes de Health Check passam
- 100% dos testes de Autenticação passam
- ≥90% dos demais testes passam
- 0 falhas P1
- 0 falhas P2

### Rollback Necessário (❌ FAIL)

- Qualquer teste de Health Check falha
- Qualquer teste de Autenticação falha
- Qualquer falha P1
- >2 falhas P2

### Investigação Necessária (⚠️ PARTIAL)

- Health e Auth OK
- 1-2 falhas P2
- Múltiplas falhas P3/P4

---

## Ambientes

| Ambiente | URL | Credenciais |
|----------|-----|-------------|
| Dev | dev.trustlayer.com | test accounts |
| Staging | staging.trustlayer.com | test accounts |
| Production | app.trustlayer.com | smoke test account |

**Conta de Smoke Test (Prod):**
```
Email: smoke-test@trustlayer.com
Senha: [Secure vault]
Org: Smoke Test Org
```

---

## CI/CD Integration

O smoke test é executado automaticamente no pipeline:

```yaml
# .github/workflows/deploy.yml
smoke-test:
  needs: deploy
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npx playwright install --with-deps
    - name: Run Smoke Tests
      run: npm run test:smoke
      env:
        BASE_URL: ${{ env.DEPLOY_URL }}
    - name: Upload Results
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: smoke-test-results
        path: playwright-report/
```

---

## Referências

- [Test Plan](./test-plan.md)
- [Regression Suite](./regression-suite.md)
- [Automated Testing](./automated-testing.md)

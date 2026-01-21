# Automated Testing Guide - TrustLayer

---
**Perfil**: QA
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre a configuração e uso das ferramentas de teste automatizado do TrustLayer.

## Stack de Testes

| Ferramenta | Propósito | Versão |
|------------|-----------|--------|
| Vitest | Unit & Integration Tests | ^1.0.0 |
| Playwright | E2E Tests | ^1.40.0 |
| React Testing Library | Component Tests | ^14.0.0 |
| MSW | API Mocking | ^2.0.0 |
| Faker | Test Data Generation | ^8.0.0 |

## 1. Unit Tests (Vitest)

### 1.1 Configuração

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 1.2 Setup File

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### 1.3 Exemplo de Unit Test

```typescript
// tests/unit/utils/score-calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculateScore, calculateGaps } from '@/lib/score-calculator';

describe('Score Calculator', () => {
  describe('calculateScore', () => {
    it('should return 100 for all "Yes" answers', () => {
      const answers = [
        { questionId: '1', value: 'yes' },
        { questionId: '2', value: 'yes' },
        { questionId: '3', value: 'yes' },
      ];

      const score = calculateScore(answers);
      expect(score).toBe(100);
    });

    it('should return 0 for all "No" answers', () => {
      const answers = [
        { questionId: '1', value: 'no' },
        { questionId: '2', value: 'no' },
      ];

      const score = calculateScore(answers);
      expect(score).toBe(0);
    });

    it('should return 50 for all "Partial" answers', () => {
      const answers = [
        { questionId: '1', value: 'partial' },
        { questionId: '2', value: 'partial' },
      ];

      const score = calculateScore(answers);
      expect(score).toBe(50);
    });

    it('should exclude "N/A" answers from calculation', () => {
      const answers = [
        { questionId: '1', value: 'yes' },
        { questionId: '2', value: 'na' },
        { questionId: '3', value: 'no' },
      ];

      // Only yes (100) and no (0), average = 50
      const score = calculateScore(answers);
      expect(score).toBe(50);
    });

    it('should handle empty answers array', () => {
      const score = calculateScore([]);
      expect(score).toBe(0);
    });
  });

  describe('calculateGaps', () => {
    it('should identify gaps from "No" and "Partial" answers', () => {
      const answers = [
        { questionId: '1', value: 'yes', question: { text: 'Q1', severity: 'low' } },
        { questionId: '2', value: 'no', question: { text: 'Q2', severity: 'critical' } },
        { questionId: '3', value: 'partial', question: { text: 'Q3', severity: 'high' } },
      ];

      const gaps = calculateGaps(answers);

      expect(gaps).toHaveLength(2);
      expect(gaps[0].questionId).toBe('2');
      expect(gaps[1].questionId).toBe('3');
    });

    it('should sort gaps by severity', () => {
      const answers = [
        { questionId: '1', value: 'no', question: { severity: 'low' } },
        { questionId: '2', value: 'no', question: { severity: 'critical' } },
        { questionId: '3', value: 'no', question: { severity: 'medium' } },
      ];

      const gaps = calculateGaps(answers);

      expect(gaps[0].question.severity).toBe('critical');
      expect(gaps[1].question.severity).toBe('medium');
      expect(gaps[2].question.severity).toBe('low');
    });
  });
});
```

### 1.4 Exemplo de Component Test

```typescript
// tests/unit/components/ScoreCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreCard } from '@/components/dashboard/ScoreCard';

describe('ScoreCard', () => {
  it('should render score correctly', () => {
    render(<ScoreCard score={85} label="Overall Score" />);

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Overall Score')).toBeInTheDocument();
  });

  it('should apply correct color for high score', () => {
    render(<ScoreCard score={90} label="Score" />);

    const scoreElement = screen.getByText('90%');
    expect(scoreElement).toHaveClass('text-green-600');
  });

  it('should apply correct color for low score', () => {
    render(<ScoreCard score={30} label="Score" />);

    const scoreElement = screen.getByText('30%');
    expect(scoreElement).toHaveClass('text-red-600');
  });

  it('should show trend indicator when provided', () => {
    render(<ScoreCard score={75} label="Score" trend={5} />);

    expect(screen.getByText('+5%')).toBeInTheDocument();
    expect(screen.getByTestId('trend-up-icon')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<ScoreCard score={0} label="Score" isLoading />);

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });
});
```

### 1.5 Exemplo de Hook Test

```typescript
// tests/unit/hooks/useAssessment.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAssessment } from '@/hooks/useAssessment';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockAssessment, error: null })),
        })),
      })),
    })),
  },
}));

const mockAssessment = {
  id: 'test-id',
  name: 'Test Assessment',
  status: 'draft',
  score: null,
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch assessment data', async () => {
    const { result } = renderHook(() => useAssessment('test-id'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockAssessment);
  });

  it('should handle error state', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: new Error('Not found') })),
        })),
      })),
    } as any);

    const { result } = renderHook(() => useAssessment('invalid-id'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

### 1.6 Comandos

```bash
# Rodar todos os unit tests
npm run test

# Watch mode (desenvolvimento)
npm run test:watch

# Com coverage
npm run test:coverage

# Rodar arquivo específico
npx vitest tests/unit/utils/score-calculator.test.ts

# Rodar por pattern
npx vitest --grep "ScoreCard"

# UI mode
npm run test:ui
```

## 2. Integration Tests

### 2.1 Setup com MSW

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth handlers
  http.post('/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      user: { id: 'user-1', email: 'test@example.com' },
    });
  }),

  // Assessments handlers
  http.get('/rest/v1/assessments', () => {
    return HttpResponse.json([
      { id: '1', name: 'Assessment 1', status: 'draft' },
      { id: '2', name: 'Assessment 2', status: 'completed' },
    ]);
  }),

  http.post('/rest/v1/assessments', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 'new-id',
      ...body,
      status: 'draft',
      created_at: new Date().toISOString(),
    });
  }),

  // Dashboard handlers
  http.get('/rest/v1/rpc/get_dashboard_metrics', () => {
    return HttpResponse.json({
      overall_score: 75,
      trend: 5,
      total_assessments: 10,
      completed_assessments: 8,
    });
  }),
];
```

```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// tests/setup.ts (adicionar)
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 2.2 Exemplo de Integration Test

```typescript
// tests/integration/assessment-flow.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssessmentsPage } from '@/pages/Assessments';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Assessment Flow Integration', () => {
  it('should display list of assessments', async () => {
    renderWithProviders(<AssessmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Assessment 1')).toBeInTheDocument();
      expect(screen.getByText('Assessment 2')).toBeInTheDocument();
    });
  });

  it('should create new assessment', async () => {
    const user = userEvent.setup();

    // Mock para criação
    server.use(
      http.post('/rest/v1/assessments', () => {
        return HttpResponse.json({
          id: 'new-assessment-id',
          name: 'New Assessment',
          status: 'draft',
        });
      })
    );

    renderWithProviders(<AssessmentsPage />);

    // Clicar em New Assessment
    const newButton = await screen.findByRole('button', { name: /new assessment/i });
    await user.click(newButton);

    // Preencher modal
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'New Assessment');

    // Selecionar framework
    const frameworkSelect = screen.getByLabelText(/framework/i);
    await user.click(frameworkSelect);
    await user.click(screen.getByText('NIST CSF'));

    // Submeter
    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    // Verificar que foi criado
    await waitFor(() => {
      expect(screen.getByText('New Assessment')).toBeInTheDocument();
    });
  });

  it('should filter assessments by status', async () => {
    const user = userEvent.setup();

    renderWithProviders(<AssessmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Assessment 1')).toBeInTheDocument();
    });

    // Filtrar por completed
    const statusFilter = screen.getByLabelText(/status/i);
    await user.click(statusFilter);
    await user.click(screen.getByText('Completed'));

    // Verificar filtro
    await waitFor(() => {
      expect(screen.queryByText('Assessment 1')).not.toBeInTheDocument();
      expect(screen.getByText('Assessment 2')).toBeInTheDocument();
    });
  });
});
```

### 2.3 Database Integration Tests

```typescript
// tests/integration/database.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

describe('Database Integration', () => {
  let testOrgId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Setup: criar org e user de teste
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org' })
      .select()
      .single();

    testOrgId = org.id;

    const { data: user } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'Test@123456',
    });

    testUserId = user.user?.id!;
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('organizations').delete().eq('id', testOrgId);
  });

  it('should enforce RLS - user cannot see other org data', async () => {
    // Criar assessment na org de teste
    await supabase.from('assessments').insert({
      name: 'Test Assessment',
      organization_id: testOrgId,
      created_by: testUserId,
    });

    // Tentar acessar como outro usuário (sem org)
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('organization_id', 'other-org-id');

    expect(data).toHaveLength(0);
  });

  it('should create audit log on assessment creation', async () => {
    const { data: assessment } = await supabase
      .from('assessments')
      .insert({
        name: 'Audit Test Assessment',
        organization_id: testOrgId,
        created_by: testUserId,
      })
      .select()
      .single();

    // Verificar audit log
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', 'assessment')
      .eq('entity_id', assessment.id);

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('CREATE');
  });
});
```

## 3. E2E Tests (Playwright)

### 3.1 Configuração

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3.2 Page Objects

```typescript
// tests/e2e/pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByRole('alert');
    this.rememberMeCheckbox = page.getByLabel('Remember me');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectLoggedIn() {
    await expect(this.page).toHaveURL('/dashboard');
  }
}
```

```typescript
// tests/e2e/pages/AssessmentsPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class AssessmentsPage {
  readonly page: Page;
  readonly newAssessmentButton: Locator;
  readonly assessmentList: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newAssessmentButton = page.getByRole('button', { name: 'New Assessment' });
    this.assessmentList = page.getByTestId('assessment-list');
    this.searchInput = page.getByPlaceholder('Search assessments');
    this.statusFilter = page.getByLabel('Status');
  }

  async goto() {
    await this.page.goto('/assessments');
  }

  async createAssessment(name: string, framework: string) {
    await this.newAssessmentButton.click();
    await this.page.getByLabel('Name').fill(name);
    await this.page.getByLabel('Framework').click();
    await this.page.getByText(framework).click();
    await this.page.getByRole('button', { name: 'Create' }).click();
  }

  async searchAssessments(query: string) {
    await this.searchInput.fill(query);
  }

  async filterByStatus(status: string) {
    await this.statusFilter.click();
    await this.page.getByText(status).click();
  }

  async expectAssessmentVisible(name: string) {
    await expect(this.assessmentList.getByText(name)).toBeVisible();
  }
}
```

### 3.3 Fixtures

```typescript
// tests/e2e/fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { DashboardPage } from './pages/DashboardPage';

type TestFixtures = {
  loginPage: LoginPage;
  assessmentsPage: AssessmentsPage;
  dashboardPage: DashboardPage;
  authenticatedPage: void;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  assessmentsPage: async ({ page }, use) => {
    await use(new AssessmentsPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  authenticatedPage: async ({ page }, use) => {
    // Login antes do teste
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@test.trustlayer.com', 'Test@123');
    await loginPage.expectLoggedIn();
    await use();
  },
});

export { expect } from '@playwright/test';
```

### 3.4 Exemplo de E2E Test

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from './fixtures';

test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('admin@test.trustlayer.com', 'Test@123');
    await loginPage.expectLoggedIn();
  });

  test('should show error for invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrong-password');
    await loginPage.expectError('Invalid credentials');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should logout correctly', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('admin@test.trustlayer.com', 'Test@123');
    await loginPage.expectLoggedIn();

    // Logout
    await page.getByRole('button', { name: 'User menu' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    await expect(page).toHaveURL('/login');
  });
});
```

```typescript
// tests/e2e/assessments.spec.ts
import { test, expect } from './fixtures';

test.describe('Assessments', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Cada teste começa autenticado
  });

  test('should display list of assessments', async ({ assessmentsPage }) => {
    await assessmentsPage.goto();
    await expect(assessmentsPage.assessmentList).toBeVisible();
  });

  test('should create new assessment', async ({ assessmentsPage, page }) => {
    await assessmentsPage.goto();
    await assessmentsPage.createAssessment('E2E Test Assessment', 'NIST CSF');

    // Verificar que foi criado
    await assessmentsPage.expectAssessmentVisible('E2E Test Assessment');
  });

  test('should search assessments', async ({ assessmentsPage }) => {
    await assessmentsPage.goto();
    await assessmentsPage.searchAssessments('specific name');

    // Verificar que filtrou
    await expect(assessmentsPage.assessmentList).toContainText('specific name');
  });

  test('should complete assessment flow', async ({ assessmentsPage, page }) => {
    await assessmentsPage.goto();

    // Criar assessment
    await assessmentsPage.createAssessment('Complete Flow Test', 'NIST CSF');

    // Responder questions
    await page.getByRole('radio', { name: 'Yes' }).first().click();
    await page.getByRole('button', { name: 'Next' }).click();

    // ... responder todas as questions

    // Submeter
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Verificar score
    await expect(page.getByTestId('assessment-score')).toBeVisible();
  });
});
```

### 3.5 Visual Regression Tests

```typescript
// tests/e2e/visual.spec.ts
import { test, expect } from './fixtures';

test.describe('Visual Regression', () => {
  test('dashboard should match snapshot', async ({ page, authenticatedPage }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixels: 100,
    });
  });

  test('assessments page should match snapshot', async ({ page, authenticatedPage }) => {
    await page.goto('/assessments');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('assessments.png', {
      maxDiffPixels: 100,
    });
  });

  test('login page should match snapshot', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveScreenshot('login.png', {
      maxDiffPixels: 50,
    });
  });
});
```

### 3.6 Comandos Playwright

```bash
# Rodar todos os E2E tests
npm run test:e2e

# Com UI mode
npm run test:e2e:ui

# Headed mode (ver browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Arquivo específico
npx playwright test auth.spec.ts

# Projeto específico (Chrome only)
npx playwright test --project=chromium

# Atualizar snapshots
npx playwright test --update-snapshots

# Gerar report
npx playwright show-report
```

## 4. CI/CD Pipeline

### 4.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start Supabase
        run: npx supabase start

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          SUPABASE_URL: http://localhost:54321
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  quality-gate:
    needs: [unit-tests, e2e-tests]
    runs-on: ubuntu-latest
    steps:
      - name: Quality Gate Check
        run: |
          echo "All tests passed!"
```

## 5. Best Practices

### 5.1 Test Organization

```
tests/
├── unit/                    # Vitest unit tests
│   ├── components/          # Component tests
│   │   └── Button.test.tsx
│   ├── hooks/               # Hook tests
│   │   └── useAuth.test.ts
│   ├── services/            # Service tests
│   │   └── api.test.ts
│   └── utils/               # Utility tests
│       └── format.test.ts
├── integration/             # Integration tests
│   ├── api/
│   └── database/
├── e2e/                     # Playwright E2E
│   ├── pages/               # Page objects
│   ├── fixtures.ts          # Test fixtures
│   └── *.spec.ts            # Test specs
├── mocks/                   # MSW handlers
│   ├── handlers.ts
│   └── server.ts
└── setup.ts                 # Global setup
```

### 5.2 Naming Conventions

- **Unit tests**: `*.test.ts` ou `*.test.tsx`
- **E2E tests**: `*.spec.ts`
- **Test IDs**: `data-testid="component-name"`
- **Page objects**: `*Page.ts`

### 5.3 Test Data Management

```typescript
// tests/factories/assessment.ts
import { faker } from '@faker-js/faker';

export const createMockAssessment = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(3),
  status: 'draft',
  score: null,
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockQuestion = (overrides = {}) => ({
  id: faker.string.uuid(),
  text: faker.lorem.sentence(),
  category: faker.helpers.arrayElement(['Governance', 'Risk', 'Compliance']),
  severity: faker.helpers.arrayElement(['critical', 'high', 'medium', 'low']),
  ...overrides,
});
```

### 5.4 Stable Selectors

```tsx
// Preferir:
<button data-testid="submit-assessment">Submit</button>

// Em vez de:
<button className="btn-primary">Submit</button>

// No teste:
await page.getByTestId('submit-assessment').click();
// ou
await page.getByRole('button', { name: 'Submit' }).click();
```

### 5.5 Flaky Test Prevention

```typescript
// Aguardar condições explícitas
await expect(page.getByText('Success')).toBeVisible({ timeout: 10000 });

// Usar waitFor para estados assíncronos
await waitFor(() => {
  expect(result.current.data).toBeDefined();
});

// Retry em testes instáveis
test.describe.configure({ retries: 2 });
```

## Referências

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
- [Test Plan](./test-plan.md)

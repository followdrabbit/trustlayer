---
profile: developer
language: pt-BR
version: 1.2.0
last_updated: 2026-01-20
---

# Guia de Testes

## Visao Geral

Este documento descreve a estrategia de testes do TrustLayer, incluindo testes unitarios, de integracao e end-to-end, bem como ferramentas e melhores praticas.

## Publico-Alvo

- Desenvolvedores escrevendo testes
- QA engineers
- Tech leads definindo cobertura

---

## 1. Piramide de Testes

```
         /\
        /E2E\          <- Poucos, lentos, alto valor
       /------\
      / Integra \      <- Moderados, medios
     /------------\
    /   Unitarios  \   <- Muitos, rapidos, base
   /________________\
```

| Tipo | Quantidade | Velocidade | Escopo |
|------|------------|------------|--------|
| Unitarios | 70% | Rapidos | Funcao/Componente |
| Integracao | 20% | Medios | Modulo/Fluxo |
| E2E | 10% | Lentos | Aplicacao completa |

---

## 2. Ferramentas

### 2.1 Stack de Testes

| Ferramenta | Proposito |
|------------|-----------|
| Vitest | Test runner (unitarios + integracao) |
| React Testing Library | Testes de componentes |
| Playwright | Testes E2E |
| MSW | Mock de APIs |

### 2.2 Configuracao

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**src/test/setup.ts:**
```typescript
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

---

## 3. Testes Unitarios

### 3.1 Testando Funcoes Puras

```typescript
// lib/scoring.ts
export function calculateScore(answers: Answer[]): number {
  const validAnswers = answers.filter(a => a.response !== 'na');
  if (validAnswers.length === 0) return 0;

  const sum = validAnswers.reduce((acc, a) => {
    if (a.response === 'yes') return acc + 1;
    if (a.response === 'partial') return acc + 0.5;
    return acc;
  }, 0);

  return (sum / validAnswers.length) * 100;
}

// lib/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { calculateScore } from './scoring';

describe('calculateScore', () => {
  it('returns 0 for empty array', () => {
    expect(calculateScore([])).toBe(0);
  });

  it('returns 100 for all yes', () => {
    const answers = [
      { response: 'yes' },
      { response: 'yes' },
      { response: 'yes' },
    ];
    expect(calculateScore(answers)).toBe(100);
  });

  it('returns 50 for all partial', () => {
    const answers = [
      { response: 'partial' },
      { response: 'partial' },
    ];
    expect(calculateScore(answers)).toBe(50);
  });

  it('excludes NA from calculation', () => {
    const answers = [
      { response: 'yes' },
      { response: 'na' },
      { response: 'na' },
    ];
    expect(calculateScore(answers)).toBe(100);
  });

  it('returns 0 when all answers are NA', () => {
    const answers = [{ response: 'na' }, { response: 'na' }];
    expect(calculateScore(answers)).toBe(0);
  });
});
```

### 3.2 Testando Componentes

```typescript
// components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });
});
```

### 3.3 Testando Hooks

```typescript
// hooks/useCounter.ts
export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);

  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initial), [initial]);

  return { count, increment, decrement, reset };
}

// hooks/useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });
});
```

---

## 4. Testes de Integracao

### 4.1 Testando com Contexto

```typescript
// test/utils.tsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          {ui}
        </I18nextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### 4.2 Mockando APIs com MSW

```typescript
// test/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/answers', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', question_id: 'q1', response: 'yes' },
        { id: '2', question_id: 'q2', response: 'partial' },
      ])
    );
  }),

  rest.post('/api/answers', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ success: true }));
  }),
];

// test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// test/setup.ts
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 4.3 Testando Fluxos Completos

```typescript
// components/AssessmentForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { AssessmentForm } from './AssessmentForm';

describe('AssessmentForm', () => {
  it('loads questions and allows answering', async () => {
    renderWithProviders(<AssessmentForm />);

    // Aguarda carregamento
    await waitFor(() => {
      expect(screen.getByText(/pergunta 1/i)).toBeInTheDocument();
    });

    // Seleciona resposta
    const yesButton = screen.getByRole('button', { name: /sim/i });
    await userEvent.click(yesButton);

    // Verifica selecao
    expect(yesButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows progress as questions are answered', async () => {
    renderWithProviders(<AssessmentForm />);

    await waitFor(() => {
      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });

    const yesButton = screen.getByRole('button', { name: /sim/i });
    await userEvent.click(yesButton);

    await waitFor(() => {
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
  });
});
```

---

## 5. Testes End-to-End

### 5.1 Configuracao Playwright

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 5.2 Escrevendo Testes E2E

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('user can login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/credenciais invalidas/i)).toBeVisible();
  });
});
```

### 5.3 Page Objects Pattern

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// e2e/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');

  await expect(page).toHaveURL('/dashboard');
});
```

---

## 6. Cobertura de Testes

### 6.1 Metas de Cobertura

| Area | Minimo | Ideal |
|------|--------|-------|
| Statements | 70% | 85% |
| Branches | 65% | 80% |
| Functions | 70% | 85% |
| Lines | 70% | 85% |

### 6.2 Executando com Cobertura

```bash
npm run test:coverage
```

### 6.3 Visualizando Relatorio

```bash
open coverage/index.html
```

---

## 7. Melhores Praticas

### 7.1 Nomenclatura de Testes

```typescript
// Use descricoes claras
describe('calculateScore', () => {
  it('returns 0 for empty array', () => {});
  it('returns 100 when all answers are yes', () => {});
  it('excludes NA answers from calculation', () => {});
});

// Evite descricoes vagas
describe('scoring', () => {
  it('works', () => {}); // Ruim
  it('should work correctly', () => {}); // Ruim
});
```

### 7.2 AAA Pattern

```typescript
it('increments counter when button is clicked', () => {
  // Arrange
  const { getByRole, getByText } = render(<Counter />);
  const button = getByRole('button', { name: /increment/i });

  // Act
  fireEvent.click(button);

  // Assert
  expect(getByText('1')).toBeInTheDocument();
});
```

### 7.3 Testes Independentes

```typescript
// Ruim - testes dependentes
let counter = 0;
it('increments', () => {
  counter++;
  expect(counter).toBe(1);
});
it('continues from previous', () => {
  counter++;
  expect(counter).toBe(2); // Falha se executar sozinho
});

// Bom - testes independentes
describe('counter', () => {
  let counter: number;

  beforeEach(() => {
    counter = 0;
  });

  it('increments', () => {
    counter++;
    expect(counter).toBe(1);
  });

  it('increments again', () => {
    counter++;
    expect(counter).toBe(1);
  });
});
```

### 7.4 Evite Test Implementation Details

```typescript
// Ruim - testa implementacao
it('sets state correctly', () => {
  const { result } = renderHook(() => useCounter());
  expect(result.current.state.count).toBe(0); // Expoe estrutura interna
});

// Bom - testa comportamento
it('starts at zero', () => {
  const { result } = renderHook(() => useCounter());
  expect(result.current.count).toBe(0);
});
```

---

## 8. Comandos Uteis

```bash
# Rodar todos os testes
npm run test

# Rodar em modo watch
npm run test:watch

# Rodar com cobertura
npm run test:coverage

# Rodar arquivo especifico
npm run test -- Button.test.tsx

# Rodar testes E2E
npm run test:e2e

# Rodar E2E com UI
npm run test:e2e:ui

# Debug E2E
npm run test:e2e -- --debug
```

---

## Referencias

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)
- [MSW Docs](https://mswjs.io/)

---

*Ultima atualizacao: 20 de Janeiro de 2026*

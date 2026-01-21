---
profile: developer
language: pt-BR
version: 1.2.0
last_updated: 2026-01-20
---

# Guia de Contribuicao

## Visao Geral

Este guia descreve como contribuir para o projeto TrustLayer, incluindo padroes de codigo, workflow de Git, revisao de PRs e melhores praticas.

## Publico-Alvo

- Desenvolvedores contribuindo com codigo
- Revisores de Pull Requests
- Mantenedores do projeto

---

## 1. Configurando o Ambiente

### 1.1 Pre-requisitos

- Node.js 18+ (recomendado: usar nvm)
- npm 9+
- Git
- VSCode (recomendado) com extensoes:
  - ESLint
  - Prettier
  - TypeScript and JavaScript
  - Tailwind CSS IntelliSense

### 1.2 Clonando o Repositorio

```bash
git clone https://github.com/seu-org/trustlayer.git
cd trustlayer
```

### 1.3 Instalando Dependencias

```bash
npm install
```

### 1.4 Configurando Variaveis de Ambiente

```bash
cp .env.example .env
# Edite .env com suas configuracoes
```

### 1.5 Iniciando o Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173`

---

## 2. Estrutura do Projeto

```
src/
├── core/           # Infraestrutura central
│   ├── modules/    # Sistema de modulos
│   └── routing/    # Roteamento
├── modules/        # Modulos de negocios
├── components/     # Componentes React
├── pages/          # Paginas/Rotas
├── hooks/          # Custom hooks
├── lib/            # Logica de negocios
├── i18n/           # Internacionalizacao
└── integrations/   # Integracoes externas
```

**Convencao de nomes:**
- Componentes: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils/Libs: `camelCase.ts`
- Types: `types.ts` ou `*.types.ts`

---

## 3. Padroes de Codigo

### 3.1 TypeScript

```typescript
// Use tipos explicitos para props
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

// Use generics quando apropriado
function useData<T>(fetcher: () => Promise<T>): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} {
  // ...
}

// Evite `any` - use `unknown` se necessario
function parseJson(data: unknown): Record<string, unknown> {
  // ...
}
```

### 3.2 React

```typescript
// Componentes funcionais com tipos
export function UserCard({ user, onEdit }: UserCardProps) {
  // Hooks no topo
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  // Handlers
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    onEdit?.(user.id);
  }, [user.id, onEdit]);

  // Early returns para loading/error
  if (!user) return null;

  // JSX limpo
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleEdit}>
          {t('common.edit')}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 3.3 Tailwind CSS

```typescript
// Use cn() para classes condicionais
import { cn } from '@/lib/utils';

<div className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-primary text-white',
  disabled && 'opacity-50 cursor-not-allowed'
)} />

// Agrupe classes relacionadas
<button className={cn(
  // Layout
  'flex items-center justify-center',
  // Spacing
  'px-4 py-2',
  // Appearance
  'bg-primary text-white rounded-md',
  // States
  'hover:bg-primary/90 focus:ring-2',
  // Responsive
  'md:px-6 lg:px-8'
)} />
```

### 3.4 Imports

```typescript
// Ordem de imports:
// 1. React/Next
import { useState, useEffect } from 'react';

// 2. Bibliotecas externas
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// 3. Componentes internos
import { Button } from '@/components/ui/button';
import { UserCard } from '@/components/UserCard';

// 4. Hooks
import { useAuth } from '@/hooks/useAuth';

// 5. Utils/Libs
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

// 6. Types
import type { User } from '@/types';

// 7. Estilos (se houver)
import './styles.css';
```

---

## 4. Git Workflow

### 4.1 Branches

| Branch | Proposito |
|--------|-----------|
| `main` | Producao - sempre estavel |
| `develop` | Desenvolvimento - integracao |
| `feature/*` | Novas funcionalidades |
| `fix/*` | Correcoes de bugs |
| `docs/*` | Documentacao |
| `refactor/*` | Refatoracoes |

### 4.2 Criando uma Branch

```bash
# Atualize develop
git checkout develop
git pull origin develop

# Crie a branch de feature
git checkout -b feature/nome-da-feature

# Ou para fix
git checkout -b fix/descricao-do-bug
```

### 4.3 Commits

**Formato:**
```
<tipo>(<escopo>): <descricao curta>

<corpo opcional>

<rodape opcional>
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correcao de bug
- `docs`: Documentacao
- `style`: Formatacao (nao afeta logica)
- `refactor`: Refatoracao
- `test`: Testes
- `chore`: Tarefas de manutencao

**Exemplos:**
```bash
git commit -m "feat(reports): add PDF export functionality"
git commit -m "fix(auth): resolve MFA verification timeout"
git commit -m "docs(readme): update installation instructions"
```

### 4.4 Pull Requests

**Antes de abrir o PR:**
```bash
# Atualize com develop
git fetch origin
git rebase origin/develop

# Resolva conflitos se houver
# ...

# Execute testes
npm run test
npm run lint
npm run type-check

# Push
git push origin feature/sua-feature
```

**Template de PR:**
```markdown
## Descricao
Breve descricao das mudancas.

## Tipo de Mudanca
- [ ] Nova funcionalidade
- [ ] Correcao de bug
- [ ] Refatoracao
- [ ] Documentacao

## Checklist
- [ ] Testes passando
- [ ] Lint sem erros
- [ ] Documentacao atualizada
- [ ] Screenshots (se UI)

## Screenshots (se aplicavel)
[Cole screenshots aqui]

## Como Testar
1. Passo 1
2. Passo 2
3. Resultado esperado
```

---

## 5. Testes

### 5.1 Estrutura de Testes

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts
└── lib/
    ├── scoring.ts
    └── scoring.test.ts
```

### 5.2 Escrevendo Testes

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button label="Click" onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button label="Click" onClick={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 5.3 Executando Testes

```bash
# Todos os testes
npm run test

# Com watch
npm run test:watch

# Com coverage
npm run test:coverage

# Arquivo especifico
npm run test -- Button.test.tsx
```

---

## 6. Linting e Formatacao

### 6.1 ESLint

```bash
# Verificar
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

### 6.2 Prettier

```bash
# Verificar formatacao
npm run format:check

# Formatar
npm run format
```

### 6.3 Type Check

```bash
npm run type-check
```

---

## 7. Revisao de Codigo

### 7.1 O que Revisar

- [ ] Logica de negocios esta correta?
- [ ] Codigo segue os padroes do projeto?
- [ ] Ha testes adequados?
- [ ] Documentacao foi atualizada?
- [ ] Performance e considerada?
- [ ] Seguranca e considerada?
- [ ] Internacionalizacao esta correta?
- [ ] Acessibilidade e considerada?

### 7.2 Como Dar Feedback

**Seja especifico:**
```
// Ruim
"Esse codigo esta confuso"

// Bom
"Considere extrair a logica das linhas 45-60 para uma funcao separada
`calculateMaturityScore()` para melhorar a legibilidade"
```

**Use prefixos:**
- `[must]` - Obrigatorio para aprovacao
- `[should]` - Fortemente recomendado
- `[could]` - Sugestao/opcional
- `[question]` - Duvida/discussao

---

## 8. Documentacao

### 8.1 O que Documentar

| Tipo | Quando |
|------|--------|
| README | Mudanca significativa no setup |
| llm.txt | Mudanca na estrutura do projeto |
| CHANGELOG | Toda feature/fix |
| ADR | Decisao arquitetural importante |
| Codigo | Logica complexa ou nao obvia |

### 8.2 Formato de Documentacao

**Componentes:**
```typescript
/**
 * Card para exibir informacoes de usuario
 *
 * @example
 * ```tsx
 * <UserCard user={user} onEdit={handleEdit} />
 * ```
 */
export function UserCard({ user, onEdit }: UserCardProps) {
  // ...
}
```

**Funcoes:**
```typescript
/**
 * Calcula o score de maturidade baseado nas respostas
 *
 * @param answers - Array de respostas do assessment
 * @param options - Opcoes de calculo
 * @returns Score entre 0 e 100
 *
 * @example
 * ```ts
 * const score = calculateScore(answers, { excludeNA: true });
 * ```
 */
export function calculateScore(
  answers: Answer[],
  options?: ScoreOptions
): number {
  // ...
}
```

---

## 9. Melhores Praticas

### 9.1 Performance

```typescript
// Use React.memo para componentes pesados
export const HeavyComponent = React.memo(function HeavyComponent(props) {
  // ...
});

// Use useMemo para calculos caros
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Use useCallback para handlers passados como props
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### 9.2 Seguranca

```typescript
// Sanitize inputs de usuario
import DOMPurify from 'dompurify';
const safeHtml = DOMPurify.sanitize(userInput);

// Nunca interpole dados em queries SQL
// Use parametros preparados do Supabase
const { data } = await supabase
  .from('users')
  .select()
  .eq('id', userId); // Parametrizado

// Valide dados de entrada
import { z } from 'zod';
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
const validated = schema.parse(input);
```

### 9.3 Acessibilidade

```typescript
// Use elementos semanticos
<button> em vez de <div onClick>
<nav> em vez de <div className="nav">

// Adicione labels
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Inclua alt em imagens
<img src={src} alt="Descricao da imagem" />

// Use aria-labels quando necessario
<button aria-label="Fechar modal">
  <XIcon />
</button>
```

---

## 10. Troubleshooting

### 10.1 Build Falha

```bash
# Limpe cache
rm -rf node_modules .next
npm install

# Verifique versao do Node
node -v # deve ser 18+
```

### 10.2 Testes Falham

```bash
# Execute com verbose
npm run test -- --verbose

# Atualize snapshots se necessario
npm run test -- -u
```

### 10.3 Lint Errors

```bash
# Veja todos os erros
npm run lint

# Corrija o que for possivel
npm run lint:fix

# Para erros persistentes, consulte a documentacao do ESLint
```

---

## Referencias

- [Arquitetura](architecture.md)
- [Sistema de Modulos](module-system.md)
- [API Reference](api-reference.md)
- [Database Schema](database-schema.md)

---

*Ultima atualizacao: 20 de Janeiro de 2026*

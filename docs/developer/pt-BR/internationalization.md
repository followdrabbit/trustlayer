# Internacionalização (i18n)

Sistema completo de internacionalização para suportar múltiplos idiomas.

## Índice

- [Idiomas Suportados](#idiomas-suportados)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Uso Básico](#uso-básico)
- [Language Switcher](#language-switcher)
- [Adicionar Novas Traduções](#adicionar-novas-traduções)
- [Pluralização](#pluralização)
- [Interpolação](#interpolação)
- [Boas Práticas](#boas-práticas)

## Idiomas Suportados

- 🇧🇷 **Português (Brasil)** - `pt-BR` (padrão)
- 🇺🇸 **English (United States)** - `en-US`
- 🇪🇸 **Español (España)** - `es-ES`

## Estrutura de Arquivos

```
src/
├── i18n/
│   ├── index.ts              # Configuração i18next
│   └── locales/
│       ├── pt-BR.json        # Traduções PT-BR (base)
│       ├── en-US.json        # Traduções EN-US
│       ├── es-ES.json        # Traduções ES-ES
│       └── extensions/       # Extensões de módulos
│           ├── audit.en-US.json
│           ├── audit.es-ES.json
│           ├── dashboards.en-US.json
│           ├── dashboards.es-ES.json
│           ├── reports.en-US.json
│           └── reports.es-ES.json
└── components/
    └── LanguageSwitcher.tsx  # Componente de troca de idioma
```

## Uso Básico

### Hook useTranslation

O hook principal para acessar traduções:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('common.description')}</p>
    </div>
  );
}
```

### Trans Component

Para traduções com HTML ou componentes:

```tsx
import { Trans } from 'react-i18next';

function MyComponent() {
  return (
    <Trans i18nKey="welcomeMessage">
      Welcome to <strong>TrustLayer</strong>!
    </Trans>
  );
}
```

## Language Switcher

### Componente Completo

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function Header() {
  return (
    <header>
      <LanguageSwitcher variant="default" showFlag={true} />
    </header>
  );
}
```

### Variantes

**Default** - Dropdown completo com flags e nomes:
```tsx
<LanguageSwitcher variant="default" />
```

**Compact** - Versão compacta com código do idioma:
```tsx
<LanguageSwitcher variant="compact" />
```

**Icon Only** - Apenas ícone de globo:
```tsx
<LanguageSwitcher variant="icon-only" />
```

### Versão Simples (Select)

```tsx
import { LanguageSwitcherSimple } from '@/components/LanguageSwitcher';

<LanguageSwitcherSimple />
```

### Hook useCurrentLanguage

```tsx
import { useCurrentLanguage } from '@/components/LanguageSwitcher';

function MyComponent() {
  const { language, isRTL, changeLanguage } = useCurrentLanguage();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <p>Current: {language.nativeName}</p>
      <button onClick={() => changeLanguage('en-US')}>
        Switch to English
      </button>
    </div>
  );
}
```

## Adicionar Novas Traduções

### 1. Adicionar ao arquivo base (pt-BR.json)

```json
{
  "myModule": {
    "title": "Meu Módulo",
    "description": "Descrição do meu módulo",
    "actions": {
      "create": "Criar",
      "edit": "Editar",
      "delete": "Excluir"
    }
  }
}
```

### 2. Adicionar traduções EN-US e ES-ES

**en-US.json:**
```json
{
  "myModule": {
    "title": "My Module",
    "description": "My module description",
    "actions": {
      "create": "Create",
      "edit": "Edit",
      "delete": "Delete"
    }
  }
}
```

**es-ES.json:**
```json
{
  "myModule": {
    "title": "Mi Módulo",
    "description": "Descripción de mi módulo",
    "actions": {
      "create": "Crear",
      "edit": "Editar",
      "delete": "Eliminar"
    }
  }
}
```

### 3. Usar no componente

```tsx
function MyModule() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('myModule.title')}</h1>
      <p>{t('myModule.description')}</p>
      <button>{t('myModule.actions.create')}</button>
    </div>
  );
}
```

## Pluralização

O i18next suporta pluralização automática:

```json
{
  "items": {
    "count_one": "{{count}} item",
    "count_other": "{{count}} items"
  }
}
```

Uso:
```tsx
const { t } = useTranslation();

// Automaticamente seleciona singular ou plural
t('items.count', { count: 1 });  // "1 item"
t('items.count', { count: 5 });  // "5 items"
```

Para português:
```json
{
  "items": {
    "count_one": "{{count}} item",
    "count_other": "{{count}} itens"
  }
}
```

## Interpolação

### Variáveis Simples

```json
{
  "welcome": "Bem-vindo, {{name}}!"
}
```

```tsx
t('welcome', { name: 'João' }); // "Bem-vindo, João!"
```

### Formatação de Datas

```json
{
  "lastUpdate": "Última atualização: {{date, datetime}}"
}
```

```tsx
t('lastUpdate', { date: new Date() });
// "Última atualização: 20/01/2026 14:30"
```

### Formatação de Números

```json
{
  "price": "Preço: {{value, currency(BRL)}}"
}
```

```tsx
t('price', { value: 1234.56 });
// "Preço: R$ 1.234,56"
```

### Múltiplas Variáveis

```json
{
  "report": "{{count}} {{type}} encontrados em {{date}}"
}
```

```tsx
t('report', {
  count: 42,
  type: 'usuários',
  date: '20/01/2026'
});
// "42 usuários encontrados em 20/01/2026"
```

## Traduções por Namespace

Organize traduções grandes em namespaces:

```tsx
// Usar namespace específico
const { t } = useTranslation('audit');

t('title');        // Busca em audit.title
t('events.create'); // Busca em audit.events.create
```

Para múltiplos namespaces:
```tsx
const { t } = useTranslation(['common', 'audit']);

t('common:save');  // Tradução comum
t('audit:title');  // Tradução do módulo audit
```

## Fallback e Missing Keys

### Fallback para outro idioma

Configuração automática: se a tradução não existir no idioma atual, usa o fallback (pt-BR).

### Durante desenvolvimento

Chaves faltantes aparecem no console:
```
i18next::translator: missingKey pt-BR myModule myKey
```

### Placeholder temporário

```tsx
// Se a chave não existir, mostra a chave
t('missing.key'); // Mostra: "missing.key"

// Ou forneça um fallback
t('missing.key', 'Fallback text');
```

## Boas Práticas

### 1. Organize por Módulos

```
common/         # Traduções comuns
auth/          # Autenticação
audit/         # Auditoria
dashboards/    # Dashboards
reports/       # Relatórios
```

### 2. Use Chaves Descritivas

```tsx
// ❌ Ruim
t('msg1')
t('btn2')

// ✅ Bom
t('auth.loginButton')
t('common.saveChanges')
```

### 3. Evite Concatenação

```tsx
// ❌ Ruim - quebra em diferentes idiomas
{t('welcome')} {username}!

// ✅ Bom - use interpolação
t('welcomeUser', { username })
```

### 4. Pluralização Correta

```tsx
// ❌ Ruim
{count} {count === 1 ? 'item' : 'items'}

// ✅ Bom - deixe i18next lidar com plural
t('items.count', { count })
```

### 5. Contexto de Gênero (quando necessário)

```json
{
  "completed_male": "Completado",
  "completed_female": "Completada"
}
```

```tsx
t('completed', { context: user.gender });
```

### 6. Traduções de Formulários

Mantenha labels, placeholders e erros juntos:

```json
{
  "form": {
    "email": {
      "label": "Email",
      "placeholder": "seu@email.com",
      "errors": {
        "required": "Email é obrigatório",
        "invalid": "Email inválido"
      }
    }
  }
}
```

### 7. Teste com Todos os Idiomas

```bash
# Rode os testes de i18n
npm run test:i18n

# Verifique chaves faltantes
npm run i18n:check
```

### 8. Mantenha Consistência

Use o mesmo termo para o mesmo conceito:
- "delete" vs "remove" vs "erase"
- "cancel" vs "dismiss" vs "close"

Escolha um e seja consistente.

## Extensões de Módulos

Para novos módulos grandes (Audit, Dashboards, Reports), crie arquivos separados em `locales/extensions/`:

```
extensions/
├── mymodule.en-US.json
├── mymodule.es-ES.json
└── mymodule.pt-BR.json  (opcional se já no base)
```

## API de Tradução

### Funções Principais

```tsx
const { t, i18n } = useTranslation();

// Traduzir chave
t('key');

// Com variáveis
t('key', { var: 'value' });

// Com contagem
t('key', { count: 5 });

// Com contexto
t('key', { context: 'male' });

// Idioma atual
i18n.language;  // 'pt-BR'

// Mudar idioma
i18n.changeLanguage('en-US');

// Verificar se existe
i18n.exists('some.key');

// Lista de idiomas
i18n.languages;  // ['pt-BR', 'en-US', 'es-ES']
```

## Formatação Regional

### Datas

```tsx
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

const locales = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': es,
};

const { i18n } = useTranslation();
const locale = locales[i18n.language];

format(new Date(), 'PPP', { locale });
// pt-BR: "20 de janeiro de 2026"
// en-US: "January 20th, 2026"
// es-ES: "20 de enero de 2026"
```

### Números e Moedas

```tsx
const { i18n } = useTranslation();

// Número formatado
new Intl.NumberFormat(i18n.language).format(1234.56);
// pt-BR: "1.234,56"
// en-US: "1,234.56"
// es-ES: "1.234,56"

// Moeda
new Intl.NumberFormat(i18n.language, {
  style: 'currency',
  currency: 'BRL'
}).format(1234.56);
// pt-BR: "R$ 1.234,56"
// en-US: "BRL 1,234.56"
// es-ES: "1.234,56 BRL"
```

## Troubleshooting

### Tradução não aparece

1. Verifique se a chave está correta
2. Confirme que o arquivo JSON está válido
3. Reinicie o servidor de desenvolvimento
4. Limpe o cache do navegador

### Idioma não muda

1. Verifique localStorage: `localStorage.getItem('preferredLanguage')`
2. Force mudança: `i18n.changeLanguage('en-US', () => window.location.reload())`

### Chaves aparecem em vez de texto

Significa que a tradução não existe. Adicione ao arquivo JSON correspondente.

## Referências

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [date-fns Locales](https://date-fns.org/docs/Locale)
- [Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

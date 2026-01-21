# TrustLayer - Guia de Desenvolvimento Local

Este guia descreve como configurar rapidamente o ambiente de desenvolvimento local do TrustLayer.

---

## Quick Start (< 5 minutos)

```bash
# 1. Clone o repositório
git clone https://github.com/trustlayer/trustlayer.git
cd trustlayer

# 2. Execute o setup automatizado
./scripts/setup.sh

# 3. Inicie o servidor de desenvolvimento
npm run dev

# 4. Acesse http://localhost:5173
```

**Credenciais padrão:**
- Email: `admin@trustlayer.local`
- Senha: `Admin@123456`

---

## Requisitos

| Requisito | Versão Mínima | Verificar |
| --------- | ------------- | --------- |
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |
| Node.js | 18.0+ | `node --version` |
| npm | 9.0+ | `npm --version` |

---

## Opções de Setup

### Opção 1: Setup Automatizado (Recomendado)

```bash
# Setup completo interativo
./scripts/setup.sh

# Setup rápido (sem confirmações)
./scripts/setup.sh --quick

# Setup com reset completo
./scripts/setup.sh --reset

# Setup com Supabase local
./scripts/setup.sh --with-supabase
```

### Opção 2: Via npm scripts

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.local.example .env.local

# Iniciar Docker
npm run docker:up

# Iniciar desenvolvimento
npm run dev
```

### Opção 3: Via Makefile

```bash
# Ver todos os comandos
make help

# Setup completo
make setup

# Desenvolvimento
make dev
```

---

## Arquitetura do Ambiente Local

```
┌─────────────────────────────────────────────────────────┐
│                    Seu Navegador                         │
│                  http://localhost:5173                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Vite Dev Server                       │
│                    (npm run dev)                         │
│                    localhost:5173                        │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌───────────┐ ┌─────────────────┐
│   PostgreSQL    │ │  Mailhog  │ │     Redis       │
│  localhost:5432 │ │ :8025/:1025│ │  localhost:6379 │
│                 │ │           │ │   (opcional)    │
└─────────────────┘ └───────────┘ └─────────────────┘
```

---

## Serviços Disponíveis

| Serviço | URL | Descrição |
| ------- | --- | --------- |
| Frontend | http://localhost:5173 | Aplicação React |
| PostgreSQL | localhost:5432 | Banco de dados |
| Mailhog UI | http://localhost:8025 | Visualizar emails |
| Mailhog SMTP | localhost:1025 | Envio de emails |
| Adminer | http://localhost:8081 | UI do banco (opcional) |
| Redis | localhost:6379 | Cache (opcional) |

Para habilitar serviços opcionais:

```bash
# Com Redis
docker compose -f docker-compose.local.yml --profile with-cache up -d

# Com Adminer (UI do banco)
docker compose -f docker-compose.local.yml --profile with-tools up -d

# Com todos
docker compose -f docker-compose.local.yml --profile with-cache --profile with-tools up -d

# Ou via Make
make up-all
```

---

## Comandos Úteis

### npm scripts

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build de produção
npm run preview          # Preview do build

# Docker
npm run docker:up        # Inicia containers
npm run docker:down      # Para containers
npm run docker:logs      # Visualiza logs
npm run docker:reset     # Reset completo

# Banco de dados
npm run db:shell         # Acesso ao PostgreSQL
npm run seed:catalog     # Popula catálogo

# Usuários
npm run provision:admin  # Cria admin
npm run provision:user   # Cria usuário

# Qualidade
npm run lint             # Linter
npm run test             # Testes
npm run type-check       # TypeScript
npm run check            # Todos os checks
```

### Makefile

```bash
make help       # Lista todos os comandos
make setup      # Setup completo
make dev        # Inicia desenvolvimento
make up         # Inicia Docker
make down       # Para Docker
make logs       # Visualiza logs
make db-shell   # Acesso ao banco
make test       # Executa testes
make lint       # Executa linter
make reset      # Reset completo
```

---

## Variáveis de Ambiente

O arquivo `.env.local.example` contém todas as variáveis necessárias para desenvolvimento.

### Principais Variáveis

```bash
# Banco de dados
POSTGRES_USER=trustlayer
POSTGRES_PASSWORD=trustlayer_local
POSTGRES_DB=trustlayer
DATABASE_URL=postgresql://trustlayer:trustlayer_local@localhost:5432/trustlayer

# Supabase (para auth e realtime)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=...

# Email de teste (Mailhog)
SMTP_HOST=localhost
SMTP_PORT=1025

# Admin padrão
ADMIN_EMAIL=admin@trustlayer.local
ADMIN_PASSWORD=Admin@123456
```

### Diferenças Dev vs Produção

| Configuração | Desenvolvimento | Produção |
| ------------ | --------------- | -------- |
| NODE_ENV | development | production |
| LOG_LEVEL | debug | info |
| RATE_LIMIT | false | true |
| MFA | false | true |
| Session timeout | disabled | 30 min |
| CORS | localhost | domain |

---

## Troubleshooting

### Docker não inicia

```bash
# Verificar se Docker está rodando
docker info

# Verificar portas em uso
lsof -i :5432  # PostgreSQL
lsof -i :5173  # Vite

# Limpar e reiniciar
npm run docker:reset
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
docker compose -f docker-compose.local.yml ps

# Verificar logs
docker compose -f docker-compose.local.yml logs postgres

# Testar conexão
npm run db:shell
```

### Dependências npm com erro

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Portas em uso

```bash
# Matar processo na porta
# Linux/Mac:
kill $(lsof -t -i:5432)

# Windows:
netstat -ano | findstr :5432
taskkill /PID <PID> /F
```

### Erro "permission denied" no setup.sh

```bash
# Dar permissão de execução
chmod +x scripts/setup.sh
```

---

## Desenvolvimento com Supabase Local

Se você precisar das Edge Functions ou de recursos completos do Supabase:

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Iniciar Supabase local
npx supabase start

# Ver credenciais geradas
npx supabase status

# Atualizar .env.local com as credenciais
```

---

## Próximos Passos

1. **Explore a aplicação**: http://localhost:5173
2. **Veja a documentação**: [/docs](../docs/)
3. **Entenda a arquitetura**: [ADRs](./adr/)
4. **Contribua**: [Contributing Guide](./developer/pt-BR/contributing.md)

---

## Referências

- [Setup Empresarial](./SETUP.md) - Configuração para ambientes de produção
- [ADR-0029: Local Development Experience](./adr/0029-local-development-experience.md)
- [Roadmap](./roadmap.md) - Planejamento do projeto

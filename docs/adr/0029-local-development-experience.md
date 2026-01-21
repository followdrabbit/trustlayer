# ADR-0029: Local Development Experience

## Status

Accepted

## Date

2026-01-21

## Context

Desenvolvedores precisam de uma forma fácil e rápida de configurar o ambiente de desenvolvimento local do TrustLayer. Os desafios incluem:

1. **Múltiplas dependências**: PostgreSQL, Redis, serviços de email, Supabase
2. **Configuração complexa**: Muitas variáveis de ambiente para configurar
3. **Falta de documentação**: Processo não documentado de forma clara
4. **Ausência de domínio**: Desenvolvimento local não tem domínio configurado
5. **Inconsistência**: Diferentes desenvolvedores configuram de formas diferentes
6. **Curva de aprendizado**: Novos desenvolvedores levam tempo para entender o setup

## Decision

Implementar uma experiência de desenvolvimento local completa e automatizada:

### 1. Docker Compose Local (`docker-compose.local.yml`)

Arquivo separado otimizado para desenvolvimento local com:

- PostgreSQL com dados de seed automático
- Mailhog para testes de email
- Redis opcional (via profile `with-cache`)
- Adminer opcional para visualização do banco (via profile `with-tools`)
- Configurações relaxadas para desenvolvimento

### 2. Script de Setup Automatizado (`scripts/setup.sh`)

Script bash interativo que:

- Verifica requisitos (Docker, Node.js, npm)
- Configura variáveis de ambiente automaticamente
- Instala dependências
- Inicia serviços Docker
- Executa seed do banco de dados
- Provisiona usuário administrador
- Fornece instruções claras de uso

### 3. Template de Variáveis de Ambiente (`.env.local.example`)

Arquivo template com:

- Valores padrão funcionais para desenvolvimento
- Comentários explicativos para cada variável
- Configurações de segurança relaxadas para dev
- Credenciais de admin pré-configuradas

### 4. Makefile

Interface unificada de comandos com:

- `make setup` - Setup completo
- `make dev` - Inicia desenvolvimento
- `make up/down` - Controle de containers
- `make test/lint` - Qualidade de código
- `make db-*` - Operações de banco de dados
- `make help` - Documentação inline

### 5. Seed de Dados Local (`postgres/seed-local.sql`)

Dados iniciais para desenvolvimento incluindo:

- Domínios de segurança (AI, Cloud, DevSecOps)
- Frameworks padrão
- Configurações base

## Arquitetura

```
Desenvolvimento Local
┌─────────────────────────────────────────────────────────────┐
│                        Developer Machine                     │
│                                                             │
│  ┌─────────────┐    ┌─────────────────────────────────────┐ │
│  │   Browser   │    │         Docker Environment          │ │
│  │             │    │                                     │ │
│  │ localhost:  │    │  ┌─────────┐  ┌─────────────────┐  │ │
│  │   5173      │◄───┼──│ Vite    │  │   PostgreSQL    │  │ │
│  │             │    │  │ Dev     │  │   :5432         │  │ │
│  └─────────────┘    │  │ Server  │  └─────────────────┘  │ │
│                     │  └─────────┘                        │ │
│  ┌─────────────┐    │                                     │ │
│  │  Mailhog    │    │  ┌─────────────────┐               │ │
│  │  :8025      │◄───┼──│   Mailhog       │               │ │
│  │  (Web UI)   │    │  │   :1025 (SMTP)  │               │ │
│  └─────────────┘    │  └─────────────────┘               │ │
│                     │                                     │ │
│  ┌─────────────┐    │  ┌─────────────────┐               │ │
│  │  Adminer    │    │  │   Redis         │  (opcional)   │ │
│  │  :8081      │◄───┼──│   :6379         │               │ │
│  │  (opcional) │    │  └─────────────────┘               │ │
│  └─────────────┘    │                                     │ │
│                     └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo de Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    ./scripts/setup.sh                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Verificar Requisitos                                     │
│     • Docker instalado?                                      │
│     • Node.js 18+?                                          │
│     • npm disponível?                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Configurar Ambiente                                      │
│     • Copiar .env.local.example → .env.local                │
│     • Ajustar configurações se necessário                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Instalar Dependências                                    │
│     • npm install                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Iniciar Docker                                           │
│     • docker compose -f docker-compose.local.yml up -d      │
│     • Aguardar health checks                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Seed & Provisioning                                      │
│     • Seed do catálogo (domínios, frameworks)               │
│     • Provisionar admin                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Pronto!                                                  │
│     • npm run dev                                            │
│     • http://localhost:5173                                  │
└─────────────────────────────────────────────────────────────┘
```

## Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `make setup` | Setup completo automatizado |
| `make dev` | Inicia ambiente + servidor dev |
| `make up` | Apenas containers Docker |
| `make down` | Para containers |
| `make logs` | Visualiza logs |
| `make db-shell` | Acesso ao PostgreSQL |
| `make db-reset` | Reset do banco |
| `make seed` | Executa seed |
| `make admin` | Provisiona admin |
| `make test` | Executa testes |
| `make lint` | Verifica código |
| `make reset` | Reset completo |

## Modos de Desenvolvimento

### 1. Modo Simples (Recomendado)

```bash
# Setup único
./scripts/setup.sh

# Desenvolvimento diário
make dev
```

### 2. Modo com Supabase Local

```bash
# Se precisar de Edge Functions
./scripts/setup.sh --with-supabase

# ou
npx supabase start
npm run dev
```

### 3. Modo com Ferramentas Extras

```bash
# Inclui Redis e Adminer
make up-all
npm run dev
```

## Variáveis de Ambiente para Desenvolvimento

As principais diferenças do `.env.local` em relação à produção:

| Variável | Desenvolvimento | Produção |
|----------|-----------------|----------|
| `NODE_ENV` | development | production |
| `LOG_LEVEL` | debug | info |
| `RATE_LIMIT_ENABLED` | false | true |
| `MFA_ENABLED` | false | true |
| `OTEL_ENABLED` | false | true |
| `VITE_IDLE_TIMEOUT_MINUTES` | 0 (desabilitado) | 30 |
| `SMTP_HOST` | localhost (Mailhog) | smtp.real.com |

## Considerações de Segurança

- Credenciais padrão são **apenas para desenvolvimento local**
- `.env.local` está no `.gitignore` para evitar commit acidental
- Scripts validam se estão em ambiente de desenvolvimento antes de ações destrutivas
- Dados de seed não contêm informações sensíveis

## Consequences

### Positivas

- ✅ Novo desenvolvedor pode começar em < 5 minutos
- ✅ Ambiente consistente entre todos os desenvolvedores
- ✅ Não requer domínio ou certificados SSL
- ✅ Processo documentado e automatizado
- ✅ Fácil reset e recriação do ambiente
- ✅ Makefile fornece interface unificada
- ✅ Suporta diferentes modos de desenvolvimento

### Negativas

- ⚠️ Requer Docker instalado
- ⚠️ Consumo de recursos do Docker
- ⚠️ Algumas features podem não funcionar offline (AI, etc)

## Alternativas Consideradas

### 1. Apenas npm run dev com Supabase Cloud

**Rejeitado**: Requer conta Supabase e conexão constante à internet.

### 2. Vagrant/VM

**Rejeitado**: Overhead maior que Docker, mais lento para iniciar.

### 3. DevContainer (VS Code)

**Considerado para futuro**: Pode ser adicionado como alternativa, mas Docker Compose é mais universal.

## Related ADRs

- [ADR-0002: Self-Hosted Supabase](0002-self-hosted-supabase.md)
- [ADR-0003: Containerized K8s Deployment](0003-containerized-k8s-deployment.md)
- [ADR-0004: Flexible Data and Deployment Topologies](0004-flexible-data-and-deployment-topologies.md)

## References

- [Docker Compose for Development](https://docs.docker.com/compose/compose-file/)
- [Twelve-Factor App: Dev/Prod Parity](https://12factor.net/dev-prod-parity)
- [Make for Modern Development](https://makefiletutorial.com/)

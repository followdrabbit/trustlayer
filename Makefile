# =============================================================================
# TrustLayer - Makefile para Desenvolvimento Local
# =============================================================================
# Comandos comuns para facilitar o desenvolvimento
#
# Uso:
#   make help     - Mostra todos os comandos disponíveis
#   make setup    - Setup completo do ambiente
#   make dev      - Inicia o ambiente de desenvolvimento
# =============================================================================

.PHONY: help setup dev build test lint format clean up down logs reset \
        db-shell db-reset seed admin user docker-build docker-push \
        supabase-start supabase-stop supabase-reset

# Cores
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

# Variáveis
DOCKER_COMPOSE_LOCAL := docker compose -f docker-compose.local.yml
DOCKER_COMPOSE_PROD := docker compose -f docker-compose.yml

# =============================================================================
# Ajuda
# =============================================================================

help: ## Mostra esta ajuda
	@echo ""
	@echo "$(CYAN)TrustLayer - Comandos Disponíveis$(NC)"
	@echo ""
	@echo "$(GREEN)Setup & Desenvolvimento:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# Setup
# =============================================================================

setup: ## Setup completo do ambiente de desenvolvimento
	@chmod +x scripts/setup.sh
	@./scripts/setup.sh

setup-quick: ## Setup rápido (sem confirmações)
	@chmod +x scripts/setup.sh
	@./scripts/setup.sh --quick

install: ## Instala dependências Node.js
	@echo "$(CYAN)Instalando dependências...$(NC)"
	@npm install
	@echo "$(GREEN)Dependências instaladas!$(NC)"

# =============================================================================
# Desenvolvimento
# =============================================================================

dev: up ## Inicia ambiente de desenvolvimento completo
	@echo "$(CYAN)Iniciando servidor de desenvolvimento...$(NC)"
	@npm run dev

start: ## Alias para 'dev'
	@$(MAKE) dev

run: ## Inicia apenas o servidor Vite (sem Docker)
	@npm run dev

build: ## Gera build de produção
	@echo "$(CYAN)Gerando build de produção...$(NC)"
	@npm run build
	@echo "$(GREEN)Build concluído!$(NC)"

preview: ## Visualiza o build de produção
	@npm run preview

# =============================================================================
# Docker - Desenvolvimento Local
# =============================================================================

up: ## Inicia containers Docker (desenvolvimento)
	@echo "$(CYAN)Iniciando containers...$(NC)"
	@$(DOCKER_COMPOSE_LOCAL) up -d
	@echo "$(GREEN)Containers iniciados!$(NC)"
	@echo ""
	@echo "Serviços disponíveis:"
	@echo "  • PostgreSQL: localhost:5432"
	@echo "  • Mailhog:    http://localhost:8025"
	@echo ""

up-all: ## Inicia todos os containers (incluindo Redis e Adminer)
	@echo "$(CYAN)Iniciando todos os containers...$(NC)"
	@$(DOCKER_COMPOSE_LOCAL) --profile with-cache --profile with-tools up -d
	@echo "$(GREEN)Todos os containers iniciados!$(NC)"

down: ## Para os containers Docker
	@echo "$(CYAN)Parando containers...$(NC)"
	@$(DOCKER_COMPOSE_LOCAL) down
	@echo "$(GREEN)Containers parados!$(NC)"

stop: down ## Alias para 'down'

restart: down up ## Reinicia os containers

logs: ## Mostra logs dos containers
	@$(DOCKER_COMPOSE_LOCAL) logs -f

logs-db: ## Mostra logs do PostgreSQL
	@$(DOCKER_COMPOSE_LOCAL) logs -f postgres

status: ## Mostra status dos containers
	@$(DOCKER_COMPOSE_LOCAL) ps

ps: status ## Alias para 'status'

# =============================================================================
# Docker - Produção
# =============================================================================

up-prod: ## Inicia containers de produção
	@echo "$(CYAN)Iniciando ambiente de produção...$(NC)"
	@$(DOCKER_COMPOSE_PROD) up -d
	@echo "$(GREEN)Ambiente de produção iniciado!$(NC)"

down-prod: ## Para containers de produção
	@$(DOCKER_COMPOSE_PROD) down

logs-prod: ## Logs do ambiente de produção
	@$(DOCKER_COMPOSE_PROD) logs -f

# =============================================================================
# Banco de Dados
# =============================================================================

db-shell: ## Abre shell do PostgreSQL
	@echo "$(CYAN)Conectando ao PostgreSQL...$(NC)"
	@$(DOCKER_COMPOSE_LOCAL) exec postgres psql -U trustlayer -d trustlayer

db-reset: ## Reset completo do banco de dados
	@echo "$(YELLOW)Resetando banco de dados...$(NC)"
	@$(DOCKER_COMPOSE_LOCAL) down -v
	@$(DOCKER_COMPOSE_LOCAL) up -d postgres
	@echo "$(GREEN)Banco resetado!$(NC)"

db-dump: ## Exporta backup do banco
	@echo "$(CYAN)Exportando backup...$(NC)"
	@mkdir -p backups
	@$(DOCKER_COMPOSE_LOCAL) exec -T postgres pg_dump -U trustlayer trustlayer > backups/backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "$(GREEN)Backup exportado para backups/$(NC)"

db-restore: ## Restaura backup (uso: make db-restore FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then echo "Uso: make db-restore FILE=backup.sql"; exit 1; fi
	@echo "$(CYAN)Restaurando backup $(FILE)...$(NC)"
	@$(DOCKER_COMPOSE_LOCAL) exec -T postgres psql -U trustlayer trustlayer < $(FILE)
	@echo "$(GREEN)Backup restaurado!$(NC)"

# =============================================================================
# Seed e Provisioning
# =============================================================================

seed: ## Executa seed do catálogo
	@echo "$(CYAN)Executando seed...$(NC)"
	@npm run seed:catalog
	@echo "$(GREEN)Seed concluído!$(NC)"

admin: ## Provisiona usuário administrador
	@echo "$(CYAN)Provisionando admin...$(NC)"
	@npm run provision:admin
	@echo "$(GREEN)Admin provisionado!$(NC)"

user: ## Provisiona usuário (uso: make user EMAIL=user@example.com)
	@if [ -z "$(EMAIL)" ]; then echo "Uso: make user EMAIL=user@example.com"; exit 1; fi
	@echo "$(CYAN)Provisionando usuário $(EMAIL)...$(NC)"
	@USER_EMAIL=$(EMAIL) npm run provision:user
	@echo "$(GREEN)Usuário provisionado!$(NC)"

# =============================================================================
# Supabase
# =============================================================================

supabase-start: ## Inicia Supabase local
	@echo "$(CYAN)Iniciando Supabase...$(NC)"
	@npx supabase start
	@echo "$(GREEN)Supabase iniciado!$(NC)"

supabase-stop: ## Para Supabase local
	@echo "$(CYAN)Parando Supabase...$(NC)"
	@npx supabase stop
	@echo "$(GREEN)Supabase parado!$(NC)"

supabase-reset: ## Reset do Supabase local
	@echo "$(YELLOW)Resetando Supabase...$(NC)"
	@npx supabase db reset
	@echo "$(GREEN)Supabase resetado!$(NC)"

supabase-status: ## Status do Supabase local
	@npx supabase status

# =============================================================================
# Qualidade de Código
# =============================================================================

test: ## Executa testes
	@echo "$(CYAN)Executando testes...$(NC)"
	@npm run test
	@echo "$(GREEN)Testes concluídos!$(NC)"

test-watch: ## Executa testes em modo watch
	@npm run test:watch

lint: ## Executa linter
	@echo "$(CYAN)Executando linter...$(NC)"
	@npm run lint
	@echo "$(GREEN)Lint concluído!$(NC)"

lint-fix: ## Corrige problemas de lint automaticamente
	@npm run lint:fix

format: ## Formata código com Prettier
	@echo "$(CYAN)Formatando código...$(NC)"
	@npm run format
	@echo "$(GREEN)Formatação concluída!$(NC)"

format-check: ## Verifica formatação
	@npm run format:check

type-check: ## Verifica tipos TypeScript
	@echo "$(CYAN)Verificando tipos...$(NC)"
	@npm run type-check
	@echo "$(GREEN)Verificação concluída!$(NC)"

check: lint type-check test ## Executa todas as verificações

# =============================================================================
# Docker Build
# =============================================================================

docker-build: ## Constrói imagens Docker
	@echo "$(CYAN)Construindo imagens Docker...$(NC)"
	@docker build -t trustlayer-frontend -f Dockerfile.frontend .
	@docker build -t trustlayer-backend -f Dockerfile.backend .
	@echo "$(GREEN)Imagens construídas!$(NC)"

docker-push: ## Envia imagens para registry
	@echo "$(CYAN)Enviando imagens para registry...$(NC)"
	@docker push trustlayer-frontend
	@docker push trustlayer-backend
	@echo "$(GREEN)Imagens enviadas!$(NC)"

# =============================================================================
# Limpeza
# =============================================================================

clean: ## Remove artefatos de build
	@echo "$(CYAN)Limpando artefatos...$(NC)"
	@rm -rf dist node_modules/.cache .vite
	@echo "$(GREEN)Limpeza concluída!$(NC)"

clean-all: clean ## Limpeza completa (inclui node_modules)
	@echo "$(YELLOW)Removendo node_modules...$(NC)"
	@rm -rf node_modules
	@echo "$(GREEN)Limpeza completa!$(NC)"

reset: ## Reset completo do ambiente
	@echo "$(YELLOW)Resetando ambiente completo...$(NC)"
	@$(DOCKER_COMPOSE_LOCAL) down -v --remove-orphans
	@rm -rf dist node_modules/.cache .vite
	@echo "$(GREEN)Reset concluído!$(NC)"

reset-hard: reset clean-all ## Reset completo incluindo node_modules
	@echo "$(GREEN)Reset total concluído!$(NC)"

# =============================================================================
# Utilitários
# =============================================================================

env: ## Mostra variáveis de ambiente
	@cat .env.local 2>/dev/null || cat .env 2>/dev/null || echo "Nenhum arquivo .env encontrado"

env-example: ## Copia .env.local.example para .env.local
	@cp .env.local.example .env.local
	@echo "$(GREEN).env.local criado!$(NC)"

open: ## Abre o app no navegador
	@open http://localhost:5173 2>/dev/null || xdg-open http://localhost:5173 2>/dev/null || start http://localhost:5173

open-mail: ## Abre Mailhog no navegador
	@open http://localhost:8025 2>/dev/null || xdg-open http://localhost:8025 2>/dev/null || start http://localhost:8025

# =============================================================================
# Default
# =============================================================================

.DEFAULT_GOAL := help

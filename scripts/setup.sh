#!/usr/bin/env bash
# =============================================================================
# TrustLayer - Script de Setup para Desenvolvimento Local
# =============================================================================
# Este script automatiza a configuração do ambiente de desenvolvimento local.
#
# Uso:
#   ./scripts/setup.sh              # Setup completo
#   ./scripts/setup.sh --quick      # Setup rápido (pula confirmações)
#   ./scripts/setup.sh --reset      # Reset completo (remove volumes)
#   ./scripts/setup.sh --help       # Mostra ajuda
#
# Requisitos:
#   - Docker e Docker Compose
#   - Node.js 18+
#   - npm ou yarn
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Diretório raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Flags
QUICK_MODE=false
RESET_MODE=false
SKIP_DEPS=false
WITH_SUPABASE=false

# =============================================================================
# Funções Utilitárias
# =============================================================================

print_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                   ║"
    echo "║   ████████╗██████╗ ██╗   ██╗███████╗████████╗██╗      █████╗     ║"
    echo "║   ╚══██╔══╝██╔══██╗██║   ██║██╔════╝╚══██╔══╝██║     ██╔══██╗    ║"
    echo "║      ██║   ██████╔╝██║   ██║███████╗   ██║   ██║     ███████║    ║"
    echo "║      ██║   ██╔══██╗██║   ██║╚════██║   ██║   ██║     ██╔══██║    ║"
    echo "║      ██║   ██║  ██║╚██████╔╝███████║   ██║   ███████╗██║  ██║    ║"
    echo "║      ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝    ║"
    echo "║                                                                   ║"
    echo "║              Security Governance Platform                         ║"
    echo "║              Local Development Setup                              ║"
    echo "║                                                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}▶ $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

show_help() {
    echo "TrustLayer - Script de Setup para Desenvolvimento Local"
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  --quick, -q       Modo rápido (pula confirmações)"
    echo "  --reset, -r       Reset completo (remove volumes Docker)"
    echo "  --skip-deps       Pula instalação de dependências npm"
    echo "  --with-supabase   Usa Supabase CLI ao invés de Docker puro"
    echo "  --help, -h        Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0                    # Setup completo interativo"
    echo "  $0 --quick            # Setup rápido sem confirmações"
    echo "  $0 --reset --quick    # Reset e setup rápido"
    echo ""
}

# =============================================================================
# Verificações de Requisitos
# =============================================================================

check_requirements() {
    log_step "Verificando requisitos"

    local missing_deps=()

    # Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    else
        log_success "Docker encontrado: $(docker --version | head -1)"
    fi

    # Docker Compose
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    else
        log_success "Docker Compose encontrado"
    fi

    # Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    else
        local node_version=$(node --version | sed 's/v//')
        local node_major=$(echo $node_version | cut -d. -f1)
        if [ "$node_major" -lt 20 ]; then
            log_warning "Node.js versão $node_version encontrada, recomendado 20+"
        else
            log_success "Node.js encontrado: v$node_version"
        fi
    fi

    # npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    else
        log_success "npm encontrado: $(npm --version)"
    fi

    # Git
    if ! command -v git &> /dev/null; then
        log_warning "Git não encontrado (opcional)"
    else
        log_success "Git encontrado: $(git --version)"
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Dependências faltando: ${missing_deps[*]}"
        echo ""
        echo "Por favor, instale as dependências faltando:"
        echo "  - Docker: https://docs.docker.com/get-docker/"
        echo "  - Node.js: https://nodejs.org/"
        exit 1
    fi

    log_success "Todos os requisitos atendidos!"
}

# =============================================================================
# Setup do Ambiente
# =============================================================================

setup_env_file() {
    log_step "Configurando variáveis de ambiente"

    cd "$PROJECT_ROOT"

    if [ -f ".env.local" ]; then
        if [ "$QUICK_MODE" = true ]; then
            log_info "Usando .env.local existente"
            return
        fi

        echo -e "${YELLOW}Arquivo .env.local já existe.${NC}"
        read -p "Deseja sobrescrever? (s/N): " confirm
        if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
            log_info "Mantendo .env.local existente"
            return
        fi
    fi

    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        log_success "Arquivo .env.local criado a partir do template"
    else
        log_error "Template .env.local.example não encontrado!"
        exit 1
    fi

    # Criar também .env se não existir (alguns scripts usam .env)
    if [ ! -f ".env" ]; then
        cp .env.local .env
        log_info "Arquivo .env criado como cópia de .env.local"
    fi
}

install_dependencies() {
    if [ "$SKIP_DEPS" = true ]; then
        log_info "Pulando instalação de dependências (--skip-deps)"
        return
    fi

    log_step "Instalando dependências Node.js"

    cd "$PROJECT_ROOT"

    if [ -f "package-lock.json" ] && [ -d "node_modules" ]; then
        if [ "$QUICK_MODE" = true ]; then
            log_info "node_modules existe, pulando instalação"
            return
        fi

        echo -e "${YELLOW}node_modules já existe.${NC}"
        read -p "Deseja reinstalar? (s/N): " confirm
        if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
            log_info "Mantendo node_modules existente"
            return
        fi
    fi

    log_info "Executando npm install..."
    npm install
    log_success "Dependências instaladas com sucesso!"
}

# =============================================================================
# Docker Setup
# =============================================================================

reset_docker() {
    log_step "Resetando ambiente Docker"

    cd "$PROJECT_ROOT"

    log_warning "Isso irá remover todos os containers e volumes do TrustLayer!"

    if [ "$QUICK_MODE" = false ]; then
        read -p "Tem certeza? (s/N): " confirm
        if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
            log_info "Reset cancelado"
            return
        fi
    fi

    log_info "Parando containers..."
    docker compose -f docker-compose.local.yml down -v --remove-orphans 2>/dev/null || true
    docker compose down -v --remove-orphans 2>/dev/null || true

    log_info "Removendo volumes..."
    docker volume rm trustlayer-postgres-data trustlayer-redis-data 2>/dev/null || true

    log_success "Reset concluído!"
}

start_docker() {
    log_step "Iniciando serviços Docker"

    cd "$PROJECT_ROOT"

    # Verificar se Docker está rodando
    if ! docker info &> /dev/null; then
        log_error "Docker não está rodando. Por favor, inicie o Docker Desktop."
        exit 1
    fi

    log_info "Construindo e iniciando containers..."
    docker compose -f docker-compose.local.yml up -d

    log_info "Aguardando serviços ficarem saudáveis..."

    # Aguardar PostgreSQL
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f docker-compose.local.yml exec -T postgres pg_isready -U trustlayer -d trustlayer &> /dev/null; then
            log_success "PostgreSQL está pronto!"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    echo ""

    if [ $attempt -eq $max_attempts ]; then
        log_error "PostgreSQL não iniciou a tempo"
        docker compose -f docker-compose.local.yml logs postgres
        exit 1
    fi

    log_success "Todos os serviços Docker iniciados!"
}

# =============================================================================
# Seed e Admin
# =============================================================================

seed_database() {
    log_step "Populando banco de dados"

    cd "$PROJECT_ROOT"

    # Verificar se o script de seed existe
    if [ -f "scripts/seed-catalog.mjs" ]; then
        log_info "Executando seed do catálogo..."

        # Definir variáveis de ambiente para o seed
        export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-http://127.0.0.1:54321}"

        npm run seed:catalog 2>/dev/null || {
            log_warning "Seed do catálogo falhou (pode ser normal se Supabase não estiver rodando)"
        }
    fi

    log_success "Seed concluído!"
}

provision_admin() {
    log_step "Provisionando usuário administrador"

    cd "$PROJECT_ROOT"

    # Ler credenciais do .env.local
    source .env.local 2>/dev/null || true

    local admin_email="${ADMIN_EMAIL:-admin@trustlayer.local}"
    local admin_password="${ADMIN_PASSWORD:-Admin@123456}"

    log_info "Email: $admin_email"
    log_info "Senha: $admin_password"

    if [ -f "scripts/provision-admin.mjs" ]; then
        export ADMIN_EMAIL="$admin_email"
        export ADMIN_PASSWORD="$admin_password"

        npm run provision:admin 2>/dev/null || {
            log_warning "Provisionamento do admin falhou (pode ser normal se Supabase não estiver rodando)"
            log_info "Você pode executar manualmente: npm run provision:admin"
        }
    fi

    log_success "Administrador provisionado!"
}

# =============================================================================
# Supabase Local
# =============================================================================

start_supabase() {
    log_step "Iniciando Supabase Local"

    cd "$PROJECT_ROOT"

    if ! command -v npx &> /dev/null; then
        log_error "npx não encontrado"
        exit 1
    fi

    log_info "Iniciando Supabase CLI..."
    npx supabase start

    log_info "Obtendo credenciais do Supabase..."
    npx supabase status

    log_success "Supabase iniciado!"
    log_info "Atualize seu .env.local com as credenciais acima se necessário"
}

# =============================================================================
# Finalização
# =============================================================================

print_summary() {
    log_step "Setup concluído!"

    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                    Setup concluído com sucesso!                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo -e "${CYAN}Serviços disponíveis:${NC}"
    echo "  • Frontend:     http://localhost:5173 (npm run dev)"
    echo "  • PostgreSQL:   localhost:5432"
    echo "  • Mailhog:      http://localhost:8025 (emails de teste)"
    echo ""

    echo -e "${CYAN}Credenciais do Admin:${NC}"
    source "$PROJECT_ROOT/.env.local" 2>/dev/null || true
    echo "  • Email:    ${ADMIN_EMAIL:-admin@trustlayer.local}"
    echo "  • Senha:    ${ADMIN_PASSWORD:-Admin@123456}"
    echo ""

    echo -e "${CYAN}Próximos passos:${NC}"
    echo "  1. Inicie o servidor de desenvolvimento:"
    echo "     ${YELLOW}npm run dev${NC}"
    echo ""
    echo "  2. Acesse http://localhost:5173"
    echo ""
    echo "  3. Faça login com as credenciais do admin"
    echo ""

    echo -e "${CYAN}Comandos úteis:${NC}"
    echo "  • ${YELLOW}make up${NC}        - Inicia os containers"
    echo "  • ${YELLOW}make down${NC}      - Para os containers"
    echo "  • ${YELLOW}make logs${NC}      - Visualiza logs"
    echo "  • ${YELLOW}make reset${NC}     - Reset completo"
    echo "  • ${YELLOW}make help${NC}      - Mostra todos os comandos"
    echo ""

    echo -e "${GREEN}Bom desenvolvimento! 🚀${NC}"
}

# =============================================================================
# Main
# =============================================================================

main() {
    # Parse argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --quick|-q)
                QUICK_MODE=true
                shift
                ;;
            --reset|-r)
                RESET_MODE=true
                shift
                ;;
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --with-supabase)
                WITH_SUPABASE=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Opção desconhecida: $1"
                show_help
                exit 1
                ;;
        esac
    done

    print_banner
    check_requirements
    setup_env_file
    install_dependencies

    if [ "$RESET_MODE" = true ]; then
        reset_docker
    fi

    start_docker

    if [ "$WITH_SUPABASE" = true ]; then
        start_supabase
    fi

    seed_database
    provision_admin
    print_summary
}

# Executar
main "$@"

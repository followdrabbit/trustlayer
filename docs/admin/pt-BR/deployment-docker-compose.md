# Deploy com Docker Compose - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia detalha o processo de deploy do TrustLayer usando Docker Compose, ideal para ambientes de desenvolvimento, staging e produção de pequeno/médio porte.

## Pré-requisitos

### Software Necessário

| Software | Versão Mínima | Verificação |
|----------|---------------|-------------|
| Docker | 24.x | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |
| Git | 2.30+ | `git --version` |

### Recursos de Hardware

| Ambiente | CPU | RAM | Disco |
|----------|-----|-----|-------|
| Desenvolvimento | 2 cores | 4GB | 20GB |
| Staging | 4 cores | 8GB | 50GB |
| Produção | 8+ cores | 16GB+ | 100GB+ SSD |

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Traefik   │  │   Frontend  │  │   Supabase Studio   │ │
│  │   (Proxy)   │  │   (Nginx)   │  │    (Dashboard)      │ │
│  │   :80/:443  │  │    :8080    │  │      :54323         │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │                                  │
│  ┌───────────────────────┴───────────────────────────────┐ │
│  │              Supabase API Gateway (:54321)            │ │
│  └───────────────────────┬───────────────────────────────┘ │
│                          │                                  │
│    ┌─────────────────────┼─────────────────────┐           │
│    │                     │                     │           │
│  ┌─┴───────────┐  ┌──────┴──────┐  ┌──────────┴─────────┐ │
│  │  PostgreSQL │  │    Auth     │  │   Edge Functions   │ │
│  │   (:5432)   │  │  (GoTrue)   │  │      (Deno)        │ │
│  └─────────────┘  └─────────────┘  └────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Instalação

### 1. Clonar Repositório

```bash
git clone https://github.com/your-org/trustlayer.git
cd trustlayer
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar configurações
nano .env
```

**Variáveis essenciais:**

```env
# === Supabase ===
POSTGRES_PASSWORD=sua-senha-forte-aqui
JWT_SECRET=sua-chave-jwt-256-bits-minimo
ANON_KEY=sua-anon-key-jwt
SERVICE_ROLE_KEY=sua-service-role-key-jwt

# === URLs ===
SITE_URL=https://trustlayer.seudominio.com
API_EXTERNAL_URL=https://api.trustlayer.seudominio.com

# === SMTP (opcional) ===
SMTP_HOST=smtp.seudominio.com
SMTP_PORT=587
SMTP_USER=noreply@seudominio.com
SMTP_PASS=sua-senha-smtp
SMTP_SENDER_NAME=TrustLayer

# === Storage ===
STORAGE_BACKEND=file
FILE_STORAGE_PATH=/var/lib/supabase/storage
```

### 3. Gerar Chaves JWT

```bash
# Gerar JWT_SECRET (256 bits)
openssl rand -base64 32

# Gerar ANON_KEY e SERVICE_ROLE_KEY
# Use https://supabase.com/docs/guides/self-hosting#api-keys
# Ou o script incluso:
./scripts/generate-jwt-keys.sh
```

### 4. Iniciar Serviços

```bash
# Iniciar todos os serviços
docker compose up -d

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f
```

## Estrutura do docker-compose.yml

```yaml
version: "3.8"

services:
  # === Database ===
  db:
    image: supabase/postgres:15.1.0.147
    container_name: trustlayer-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # === Auth (GoTrue) ===
  auth:
    image: supabase/gotrue:v2.132.3
    container_name: trustlayer-auth
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
      GOTRUE_SITE_URL: ${SITE_URL}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_DISABLE_SIGNUP: true
      GOTRUE_EXTERNAL_EMAIL_ENABLED: true
      GOTRUE_MAILER_AUTOCONFIRM: false
      GOTRUE_SMTP_HOST: ${SMTP_HOST}
      GOTRUE_SMTP_PORT: ${SMTP_PORT}
      GOTRUE_SMTP_USER: ${SMTP_USER}
      GOTRUE_SMTP_PASS: ${SMTP_PASS}
      GOTRUE_SMTP_ADMIN_EMAIL: ${SMTP_USER}
      GOTRUE_SMTP_SENDER_NAME: ${SMTP_SENDER_NAME}

  # === API Gateway (Kong) ===
  kong:
    image: kong:3.4.2
    container_name: trustlayer-kong
    restart: unless-stopped
    depends_on:
      - auth
    ports:
      - "54321:8000"
      - "54322:8443"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl
    volumes:
      - ./supabase/kong.yml:/kong/kong.yml:ro

  # === Edge Functions ===
  functions:
    image: supabase/edge-runtime:v1.29.1
    container_name: trustlayer-functions
    restart: unless-stopped
    depends_on:
      - kong
    environment:
      JWT_SECRET: ${JWT_SECRET}
      SUPABASE_URL: http://kong:8000
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY}
    volumes:
      - ./supabase/functions:/home/deno/functions:ro
    command: start --main-service /home/deno/functions/main

  # === Frontend ===
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_SUPABASE_URL: ${API_EXTERNAL_URL}
        VITE_SUPABASE_PUBLISHABLE_KEY: ${ANON_KEY}
    container_name: trustlayer-frontend
    restart: unless-stopped
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

  # === Supabase Studio (opcional) ===
  studio:
    image: supabase/studio:20240101-ce42139
    container_name: trustlayer-studio
    restart: unless-stopped
    depends_on:
      - kong
    ports:
      - "54323:3000"
    environment:
      STUDIO_PG_META_URL: http://meta:8080
      SUPABASE_URL: http://kong:8000
      SUPABASE_PUBLIC_URL: ${API_EXTERNAL_URL}
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}

volumes:
  db-data:

networks:
  default:
    name: trustlayer-network
```

## Comandos Úteis

### Gerenciamento de Containers

```bash
# Iniciar serviços
docker compose up -d

# Parar serviços
docker compose down

# Reiniciar um serviço específico
docker compose restart frontend

# Ver logs de um serviço
docker compose logs -f auth

# Executar comando em um container
docker compose exec db psql -U postgres
```

### Banco de Dados

```bash
# Backup do banco
docker compose exec db pg_dump -U postgres postgres > backup.sql

# Restore do banco
cat backup.sql | docker compose exec -T db psql -U postgres postgres

# Executar migrations
docker compose exec db psql -U postgres -f /docker-entrypoint-initdb.d/001_init.sql
```

### Manutenção

```bash
# Atualizar imagens
docker compose pull

# Rebuild do frontend
docker compose build --no-cache frontend

# Limpar volumes órfãos
docker volume prune

# Ver uso de recursos
docker stats
```

## Configuração de Produção

### 1. Habilitar HTTPS com Traefik

Adicione ao `docker-compose.prod.yml`:

```yaml
services:
  traefik:
    image: traefik:v2.10
    container_name: trustlayer-traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@seudominio.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt

  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`trustlayer.seudominio.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"

  kong:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.trustlayer.seudominio.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"

volumes:
  letsencrypt:
```

### 2. Configurar Limites de Recursos

```yaml
services:
  db:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G

  frontend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

### 3. Habilitar Logging Centralizado

```yaml
services:
  frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service"
    labels:
      service: "trustlayer-frontend"
```

## Health Checks

### Verificar Saúde dos Serviços

```bash
# Frontend
curl -f http://localhost:8080/healthz

# API
curl -f http://localhost:54321/rest/v1/ -H "apikey: ${ANON_KEY}"

# Auth
curl -f http://localhost:54321/auth/v1/health

# Database
docker compose exec db pg_isready -U postgres
```

### Script de Health Check

```bash
#!/bin/bash
# healthcheck.sh

services=("frontend:8080/healthz" "kong:8000/health")

for service in "${services[@]}"; do
  IFS=':' read -r name endpoint <<< "$service"
  if curl -sf "http://localhost:$endpoint" > /dev/null; then
    echo "✅ $name: healthy"
  else
    echo "❌ $name: unhealthy"
  fi
done
```

## Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker compose logs --tail=100 <service>

# Verificar configuração
docker compose config

# Inspecionar container
docker inspect trustlayer-<service>
```

### Problemas de conexão com banco

```bash
# Verificar se o banco está acessível
docker compose exec db pg_isready -U postgres

# Testar conexão
docker compose exec db psql -U postgres -c "SELECT 1"

# Verificar variáveis de ambiente
docker compose exec auth env | grep DB
```

### Erros de permissão

```bash
# Verificar ownership dos volumes
ls -la /var/lib/docker/volumes/

# Corrigir permissões
sudo chown -R 1000:1000 ./supabase/functions
```

## Próximos Passos

1. [Configurar SSL/TLS](./ssl-certificates.md)
2. [Configurar Backup Automático](./backup-restore.md)
3. [Configurar Monitoramento](./logging-monitoring.md)
4. [Deploy com Kubernetes](./deployment-k8s.md) (para alta disponibilidade)

## Referências

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)
- [Traefik Documentation](https://doc.traefik.io/traefik/)

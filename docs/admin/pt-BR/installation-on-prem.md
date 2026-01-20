# Instalação On-Premises - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-20

---

## Visão Geral

Este guia descreve como instalar TrustLayer em ambiente on-premises, com separação de frontend e backend em containers independentes.

## Público-Alvo

Administradores de sistema realizando instalação on-premises em infraestrutura própria.

## Pré-requisitos

### Hardware Mínimo
- **CPU**: 4 cores (8 recomendado)
- **RAM**: 8GB (16GB recomendado)
- **Disco**: 100GB SSD (para dados + logs)
- **Rede**: 1Gbps

### Software
- Docker Engine 24.0+
- Docker Compose 2.20+
- PostgreSQL 15+ (pode ser containerizado)
- Acesso sudo/root
- Certificados SSL/TLS válidos

### Requisitos de Rede
- Porta 80 (HTTP) - opcional, para redirecionamento
- Porta 443 (HTTPS) - obrigatória
- Porta 5432 (PostgreSQL) - se banco externo
- Acesso a repositórios de imagens Docker

## Arquitetura de Deploy

```
┌─────────────────────────────────────────┐
│         Load Balancer (NGINX)           │
│         :443 (HTTPS)                    │
└──────────────┬──────────────────────────┘
               │
     ┌─────────┴──────────┐
     │                    │
┌────▼─────┐      ┌───────▼────┐
│ Frontend │      │  Backend   │
│ (React)  │      │  (Node.js) │
│ :3000    │      │  :3001     │
└──────────┘      └─────┬──────┘
                        │
                  ┌─────▼──────┐
                  │ PostgreSQL │
                  │ :5432      │
                  └────────────┘
```

## Estrutura de Arquivos

```
/opt/trustlayer/
├── docker-compose.yml
├── .env
├── nginx/
│   ├── nginx.conf
│   └── ssl/
│       ├── cert.pem
│       └── key.pem
├── frontend/
│   └── Dockerfile
├── backend/
│   └── Dockerfile
├── postgres/
│   ├── init.sql
│   └── data/
└── logs/
    ├── nginx/
    ├── frontend/
    └── backend/
```

## Passo 1: Preparação do Ambiente

### 1.1. Instalar Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verificar instalação
docker --version
docker-compose --version

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
```

### 1.2. Criar Estrutura de Diretórios

```bash
sudo mkdir -p /opt/trustlayer/{nginx/ssl,postgres/data,logs/{nginx,frontend,backend}}
cd /opt/trustlayer
```

### 1.3. Obter Certificados SSL

```bash
# Opção 1: Let's Encrypt (recomendado)
sudo apt install certbot
sudo certbot certonly --standalone -d trustlayer.seudominio.com

# Copiar certificados
sudo cp /etc/letsencrypt/live/trustlayer.seudominio.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/trustlayer.seudominio.com/privkey.pem nginx/ssl/key.pem

# Opção 2: Certificado self-signed (desenvolvimento)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

## Passo 2: Configuração

### 2.1. Arquivo `.env`

Crie o arquivo `.env` com as variáveis de ambiente:

```bash
# ==============================================
# TRUSTLAYER ENVIRONMENT CONFIGURATION
# ==============================================

# Application
NODE_ENV=production
APP_NAME=TrustLayer
APP_URL=https://trustlayer.seudominio.com

# Database
DATABASE_URL=postgresql://trustlayer:SENHA_SEGURA@postgres:5432/trustlayer
POSTGRES_USER=trustlayer
POSTGRES_PASSWORD=SENHA_SEGURA
POSTGRES_DB=trustlayer

# Supabase (ou backend próprio)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# JWT
JWT_SECRET=gere-uma-senha-muito-segura-aqui-min-32-chars
JWT_EXPIRATION=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
SMTP_FROM=noreply@trustlayer.com

# Storage
STORAGE_PROVIDER=local  # ou 's3', 'azure', 'gcs'
STORAGE_PATH=/app/uploads
# Se S3:
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_S3_BUCKET=

# SSO (SAML)
SAML_ENABLED=false
SAML_ENTRY_POINT=https://idp.exemplo.com/sso
SAML_ISSUER=trustlayer
SAML_CALLBACK_URL=https://trustlayer.seudominio.com/api/auth/saml/callback

# MFA
MFA_ENABLED=true
MFA_ISSUER=TrustLayer

# Observability
OTEL_ENABLED=false
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318

# Features Flags
FEATURE_AI_ASSISTANT=true
FEATURE_AUDIO_ENABLED=true
FEATURE_AUDITOR_ROLE=true
FEATURE_REPORTS_ADVANCED=true

# Security
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15m
CORS_ORIGIN=https://trustlayer.seudominio.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

**⚠️ IMPORTANTE**:
- Substitua `SENHA_SEGURA` por senhas realmente seguras
- Gere `JWT_SECRET` com: `openssl rand -base64 32`
- Nunca comite este arquivo em Git

### 2.2. Docker Compose

Crie `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: trustlayer-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - ./postgres/data:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - trustlayer-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: trustlayer-backend
    restart: unless-stopped
    env_file: .env
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - PORT=3001
    volumes:
      - ./backend/uploads:/app/uploads
      - ./logs/backend:/app/logs
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - trustlayer-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
      args:
        - VITE_API_URL=https://trustlayer.seudominio.com/api
        - VITE_SUPABASE_URL=${SUPABASE_URL}
        - VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    container_name: trustlayer-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - trustlayer-network

  # NGINX Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: trustlayer-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - trustlayer-network

networks:
  trustlayer-network:
    driver: bridge

volumes:
  postgres-data:
```

### 2.3. NGINX Configuration

Crie `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:80;
    }

    upstream backend {
        server backend:3001;
    }

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name trustlayer.seudominio.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name trustlayer.seudominio.com;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Logging
        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log;

        # Frontend (SPA)
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # File uploads
        client_max_body_size 50M;
    }
}
```

## Passo 3: Build e Deploy

### 3.1. Build das Imagens

```bash
# Build de todas as imagens
docker-compose build

# Ou build individual
docker-compose build backend
docker-compose build frontend
```

### 3.2. Iniciar Containers

```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
```

### 3.3. Executar Migrations

```bash
# Rodar migrations do banco
docker-compose exec backend npm run migrate

# Seed de dados iniciais (opcional)
docker-compose exec backend npm run seed
```

### 3.4. Criar Usuário Admin

```bash
docker-compose exec backend npm run create-admin

# Ou manualmente via SQL
docker-compose exec postgres psql -U trustlayer -d trustlayer -c "
INSERT INTO profiles (user_id, email, role, display_name)
VALUES (
  gen_random_uuid(),
  'admin@trustlayer.com',
  'admin',
  'Administrator'
);
"
```

## Passo 4: Verificação

### 4.1. Health Checks

```bash
# Verificar backend
curl http://localhost:3001/health

# Verificar frontend (via NGINX)
curl https://trustlayer.seudominio.com

# Verificar PostgreSQL
docker-compose exec postgres pg_isready -U trustlayer
```

### 4.2. Logs

```bash
# Ver todos os logs
docker-compose logs

# Logs em tempo real
docker-compose logs -f --tail=100

# Logs de um serviço específico
docker-compose logs backend
```

## Troubleshooting

### Erro de Conexão com Banco

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Ver logs do PostgreSQL
docker-compose logs postgres

# Testar conexão manualmente
docker-compose exec backend psql $DATABASE_URL -c "SELECT version();"
```

### Frontend não carrega

```bash
# Verificar logs do NGINX
docker-compose logs nginx

# Verificar se frontend está rodando
docker-compose ps frontend

# Rebuild do frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### SSL/HTTPS não funciona

```bash
# Verificar certificados
ls -la nginx/ssl/

# Testar configuração do NGINX
docker-compose exec nginx nginx -t

# Reload do NGINX
docker-compose exec nginx nginx -s reload
```

## Manutenção

### Backup

```bash
# Backup do banco de dados
docker-compose exec postgres pg_dump -U trustlayer trustlayer > backup_$(date +%Y%m%d).sql

# Backup de uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/
```

### Atualização

```bash
# Pull de novas imagens
git pull origin main

# Rebuild
docker-compose build

# Restart com downtime mínimo
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend
```

### Monitoramento

```bash
# Ver uso de recursos
docker stats

# Ver logs de erro
docker-compose logs | grep -i error

# Ver espaço em disco
df -h
du -sh postgres/data/
```

## Próximos Passos

- [Configuração de SSO](./sso-integration.md)
- [Configuração de WAF](./waf-configuration.md)
- [Setup de Observabilidade](./opentelemetry.md)
- [Backup e Restore](./backup-restore.md)

## Referências

- [Docker Documentation](https://docs.docker.com/)
- [NGINX Configuration](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

# Quick Start - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia permite que você tenha o TrustLayer rodando em menos de 5 minutos para desenvolvimento local ou em menos de 15 minutos para produção.

---

## Desenvolvimento Local

### Requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- npm 9+

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/trustlayer/trustlayer.git
cd trustlayer

# 2. Execute o setup automatizado
./scripts/setup.sh

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

### Acesso

- **URL**: http://localhost:5173
- **Email**: `admin@trustlayer.local`
- **Senha**: `Admin@123456`

### Serviços Disponíveis

| Serviço | URL | Descrição |
| ------- | --- | --------- |
| Frontend | http://localhost:5173 | Aplicação React |
| PostgreSQL | localhost:5432 | Banco de dados |
| Mailhog | http://localhost:8025 | Visualizar emails de teste |

### Comandos Úteis

```bash
# Controle de containers
make up              # Inicia containers
make down            # Para containers
make logs            # Visualiza logs
make reset           # Reset completo

# Banco de dados
make db-shell        # Acesso ao PostgreSQL

# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run test         # Executa testes
```

---

## Produção com Docker Compose

### Requisitos

- Servidor Linux (Ubuntu 22.04+ recomendado)
- Docker 20.10+
- Docker Compose 2.0+
- Domínio configurado (DNS apontando para o servidor)
- Certificado SSL (Let's Encrypt ou próprio)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/trustlayer/trustlayer.git
cd trustlayer

# 2. Copie e configure o arquivo de ambiente
cp .env.example .env
```

### Configuração do .env

Edite o arquivo `.env` com suas configurações:

```bash
# Aplicação
NODE_ENV=production
APP_URL=https://trustlayer.suaempresa.com

# Banco de dados (use senhas fortes!)
POSTGRES_USER=trustlayer
POSTGRES_PASSWORD=SuaSenhaForte123!
POSTGRES_DB=trustlayer

# JWT (gere com: openssl rand -base64 32)
JWT_SECRET=sua-chave-jwt-super-secreta-aqui

# Supabase
VITE_SUPABASE_URL=https://seu-supabase.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico

# Email
SMTP_HOST=smtp.seuservidor.com
SMTP_PORT=587
SMTP_USER=seu-usuario
SMTP_PASS=sua-senha
SMTP_FROM=noreply@suaempresa.com
```

### Deploy

```bash
# 3. Inicie os containers
docker compose up -d

# 4. Verifique se está rodando
docker compose ps

# 5. Provisione o admin
ADMIN_EMAIL=admin@suaempresa.com \
ADMIN_PASSWORD=SuaSenhaSegura123! \
npm run provision:admin

# 6. Execute o seed do catálogo
npm run seed:catalog
```

### Verificação

```bash
# Verificar logs
docker compose logs -f

# Testar health check
curl https://trustlayer.suaempresa.com/healthz
```

---

## Produção com Kubernetes

### Requisitos

- Cluster Kubernetes 1.25+
- Helm 3.10+
- kubectl configurado
- Ingress Controller (NGINX recomendado)
- Cert-manager (para SSL automático)

### Passos

```bash
# 1. Adicione o repositório Helm
helm repo add trustlayer https://charts.trustlayer.io
helm repo update

# 2. Crie o namespace
kubectl create namespace trustlayer

# 3. Crie o secret com as credenciais
kubectl create secret generic trustlayer-secrets \
  --namespace trustlayer \
  --from-literal=postgres-password=SuaSenhaForte123! \
  --from-literal=jwt-secret=sua-chave-jwt-super-secreta \
  --from-literal=supabase-service-key=sua-chave-de-servico

# 4. Crie o arquivo values.yaml
cat > values.yaml << 'EOF'
global:
  domain: trustlayer.suaempresa.com

frontend:
  replicas: 2
  resources:
    limits:
      memory: 512Mi
      cpu: 500m

postgresql:
  enabled: true
  auth:
    existingSecret: trustlayer-secrets
    secretKeys:
      adminPasswordKey: postgres-password

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  tls:
    - secretName: trustlayer-tls
      hosts:
        - trustlayer.suaempresa.com
EOF

# 5. Instale o chart
helm install trustlayer trustlayer/trustlayer \
  --namespace trustlayer \
  --values values.yaml

# 6. Verifique o status
kubectl get pods -n trustlayer
kubectl get ingress -n trustlayer
```

---

## Verificação Pós-Instalação

### Checklist

Após a instalação, verifique:

- [ ] Aplicação acessível via navegador
- [ ] Login funcionando com credenciais do admin
- [ ] Domínios de segurança visíveis (AI, Cloud, DevSecOps)
- [ ] Frameworks carregados corretamente
- [ ] Emails sendo enviados (teste via Mailhog ou email real)

### Testes Básicos

```bash
# Health check
curl -s https://seu-dominio/healthz | jq

# Verificar conexão com banco
docker compose exec postgres psql -U trustlayer -c "SELECT 1"

# Verificar logs de erro
docker compose logs --tail=100 | grep -i error
```

---

## Troubleshooting Rápido

### Container não inicia

```bash
# Verificar logs
docker compose logs <service-name>

# Verificar recursos
docker stats
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
docker compose ps postgres

# Testar conexão
docker compose exec postgres pg_isready
```

### Erro 502/503

```bash
# Verificar se todos os serviços estão healthy
docker compose ps

# Reiniciar serviços
docker compose restart
```

### Emails não enviados

```bash
# Verificar configuração SMTP
docker compose exec backend env | grep SMTP

# Testar conexão SMTP
docker compose exec backend curl -v telnet://smtp-host:587
```

---

## Próximos Passos

1. [Configurar SSO](./sso-integration.md) - Integração com IdP corporativo
2. [Configurar Backup](./backup-restore.md) - Estratégia de backup
3. [Configurar Monitoramento](./logging-monitoring.md) - Observabilidade
4. [Hardening de Segurança](./security.md) - Configurações de segurança

---

## Referências

- [Guia Completo de Instalação](./installation-on-prem.md)
- [Deploy com Docker Compose](./deployment-docker-compose.md)
- [Deploy com Kubernetes](./deployment-k8s.md)
- [Variáveis de Ambiente](./environment-variables.md)

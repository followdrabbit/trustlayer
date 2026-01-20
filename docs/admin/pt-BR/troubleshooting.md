# Guia de Troubleshooting - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-20

---

## Visão Geral

Este guia fornece soluções para problemas comuns encontrados em ambientes TrustLayer.

## Metodologia de Diagnóstico

### Passo 1: Identificar o Componente

```
Problema → Logs → Componente Afetado → Solução
```

**Componentes principais:**
- Frontend (React/Vite)
- Backend (Node.js/API)
- Database (PostgreSQL)
- Proxy (NGINX)
- Authentication (SSO/MFA)

### Passo 2: Coletar Informações

```bash
# Status dos containers
docker-compose ps

# Logs gerais
docker-compose logs --tail=100

# Health checks
curl http://localhost:3001/health
curl http://localhost:3000
```

### Passo 3: Análise de Logs

```bash
# Filtrar por nível de erro
docker-compose logs | grep -i error
docker-compose logs | grep -i warn

# Logs de um período específico
docker-compose logs --since 30m backend

# Logs em tempo real
docker-compose logs -f backend
```

## Problemas Comuns

### 1. Frontend não Carrega (Tela Branca)

**Sintomas:**
- Navegador mostra página em branco
- Console do navegador mostra erros

**Diagnóstico:**

```bash
# Verificar se container está rodando
docker-compose ps frontend

# Ver logs do frontend
docker-compose logs frontend

# Verificar NGINX
docker-compose logs nginx | grep error
```

**Soluções:**

```bash
# Solução 1: Rebuild do frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Solução 2: Verificar variáveis de ambiente
docker-compose exec frontend env | grep VITE

# Solução 3: Limpar cache do navegador
# Ctrl + Shift + Delete (Chrome/Edge)
# ou acessar em modo anônimo
```

**Causa Raiz:**
- Build assets incorretos
- Variáveis de ambiente incorretas (`VITE_API_URL`)
- Problema de CORS

### 2. Erro 502 Bad Gateway

**Sintomas:**
- NGINX retorna erro 502
- API não responde

**Diagnóstico:**

```bash
# Verificar se backend está rodando
docker-compose ps backend

# Verificar health do backend
curl http://localhost:3001/health

# Ver logs do backend
docker-compose logs backend --tail=50
```

**Soluções:**

```bash
# Solução 1: Restart do backend
docker-compose restart backend

# Solução 2: Verificar conectividade backend <-> database
docker-compose exec backend psql $DATABASE_URL -c "SELECT 1"

# Solução 3: Verificar configuração do NGINX
docker-compose exec nginx nginx -t
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep upstream
```

**Causa Raiz:**
- Backend não iniciou corretamente
- Erro de conexão com database
- NGINX upstream incorreto

### 3. Erro de Autenticação / Login Falha

**Sintomas:**
- Login retorna erro 401
- Usuário não consegue fazer login
- Token expirado constantemente

**Diagnóstico:**

```bash
# Verificar logs de autenticação
docker-compose logs backend | grep -i auth

# Verificar JWT_SECRET
docker-compose exec backend env | grep JWT_SECRET

# Testar endpoint de login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Soluções:**

```bash
# Solução 1: Verificar JWT_SECRET no .env
cat .env | grep JWT_SECRET
# Deve ter pelo menos 32 caracteres

# Solução 2: Verificar expiração do token
# Editar .env: JWT_EXPIRATION=7d

# Solução 3: Limpar sessões antigas
docker-compose exec postgres psql -U trustlayer -d trustlayer -c "
DELETE FROM user_sessions WHERE last_activity < NOW() - INTERVAL '7 days';
"

# Solução 4: Reset de senha (se usuário esqueceu)
docker-compose exec backend npm run reset-password -- user@example.com
```

**Causa Raiz:**
- JWT_SECRET não configurado ou mudou
- Sessões antigas/corrompidas
- Senha incorreta ou usuário não existe

### 4. SSO/SAML não Funciona

**Sintomas:**
- Redirect para IdP falha
- Erro após voltar do IdP
- "Invalid SAML Response"

**Diagnóstico:**

```bash
# Verificar configuração SAML
docker-compose exec backend env | grep SAML

# Ver logs de SAML
docker-compose logs backend | grep -i saml

# Verificar metadata
curl http://localhost:3001/auth/saml/metadata
```

**Soluções:**

```bash
# Solução 1: Verificar variáveis SAML no .env
SAML_ENABLED=true
SAML_ENTRY_POINT=https://idp.exemplo.com/sso
SAML_ISSUER=trustlayer
SAML_CALLBACK_URL=https://trustlayer.seudominio.com/api/auth/saml/callback

# Solução 2: Verificar certificados SAML
ls -la certs/saml/
# Deve ter cert.pem e key.pem

# Solução 3: Validar XML do IdP
# Copiar XML response do log e validar em:
# https://www.samltool.com/validate_response.php

# Solução 4: Verificar clock skew
docker-compose exec backend date
# Sincronizar com NTP se necessário
sudo ntpdate pool.ntp.org
```

**Causa Raiz:**
- Callback URL incorreto no IdP
- Certificados expirados
- Clock skew entre servidor e IdP

### 5. MFA/TOTP não Aceita Código

**Sintomas:**
- Código TOTP sempre inválido
- "Invalid verification code"

**Diagnóstico:**

```bash
# Verificar hora do servidor
docker-compose exec backend date

# Verificar configuração MFA
docker-compose exec backend env | grep MFA

# Ver logs de tentativas de MFA
docker-compose logs backend | grep -i totp
```

**Soluções:**

```bash
# Solução 1: Sincronizar relógio
sudo ntpdate pool.ntp.org

# Solução 2: Verificar window de tempo
# Editar configuração de TOTP para aceitar ±1 step (30s)

# Solução 3: Reset de MFA para usuário
docker-compose exec postgres psql -U trustlayer -d trustlayer -c "
UPDATE profiles SET mfa_secret = NULL WHERE email = 'user@example.com';
"
# Usuário terá que configurar MFA novamente
```

**Causa Raiz:**
- Dessincronia de relógio entre servidor e device do usuário
- MFA secret corrompido

### 6. Database Connection Error

**Sintomas:**
- "ECONNREFUSED" nos logs
- "Connection timeout"
- Backend não inicia

**Diagnóstico:**

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Verificar health do PostgreSQL
docker-compose exec postgres pg_isready -U trustlayer

# Verificar logs do PostgreSQL
docker-compose logs postgres
```

**Soluções:**

```bash
# Solução 1: Restart do PostgreSQL
docker-compose restart postgres

# Solução 2: Verificar DATABASE_URL
cat .env | grep DATABASE_URL
# Deve ser: postgresql://user:pass@postgres:5432/dbname

# Solução 3: Verificar rede Docker
docker network ls
docker network inspect trustlayer_trustlayer-network

# Solução 4: Verificar permissões
docker-compose exec postgres psql -U trustlayer -c "\du"

# Solução 5: Reconstruir volume (CUIDADO: perde dados)
docker-compose down
docker volume rm trustlayer_postgres-data
docker-compose up -d postgres
docker-compose exec backend npm run migrate
```

**Causa Raiz:**
- PostgreSQL não iniciou corretamente
- Credenciais incorretas
- Problema de rede Docker

### 7. Upload de Arquivos Falha

**Sintomas:**
- "File upload failed"
- "413 Request Entity Too Large"
- Upload congela

**Diagnóstico:**

```bash
# Verificar logs de upload
docker-compose logs backend | grep -i upload

# Verificar tamanho do arquivo
ls -lh backend/uploads/

# Verificar configuração NGINX
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep client_max_body_size
```

**Soluções:**

```bash
# Solução 1: Aumentar limite do NGINX
# Editar nginx/nginx.conf
client_max_body_size 100M;

# Reload NGINX
docker-compose exec nginx nginx -s reload

# Solução 2: Verificar permissões do diretório
docker-compose exec backend ls -la /app/uploads
docker-compose exec backend chmod 755 /app/uploads

# Solução 3: Verificar espaço em disco
docker-compose exec backend df -h
```

**Causa Raiz:**
- Limite de tamanho muito baixo
- Permissões incorretas no diretório
- Espaço em disco cheio

### 8. Performance Lenta

**Sintomas:**
- Dashboard demora muito para carregar
- Queries lentas
- Timeout em requests

**Diagnóstico:**

```bash
# Verificar uso de recursos
docker stats

# Verificar slow queries no PostgreSQL
docker-compose exec postgres psql -U trustlayer -d trustlayer -c "
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
"

# Verificar cache
docker-compose logs backend | grep -i cache
```

**Soluções:**

```bash
# Solução 1: Adicionar índices no banco
docker-compose exec postgres psql -U trustlayer -d trustlayer -c "
CREATE INDEX CONCURRENTLY idx_assessments_organization_id ON assessments(organization_id);
CREATE INDEX CONCURRENTLY idx_answers_assessment_id ON answers(assessment_id);
"

# Solução 2: Aumentar recursos Docker
# Editar docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

# Solução 3: Habilitar cache Redis (futuro)

# Solução 4: VACUUM do PostgreSQL
docker-compose exec postgres psql -U trustlayer -d trustlayer -c "VACUUM ANALYZE;"
```

**Causa Raiz:**
- Falta de índices no banco
- Recursos insuficientes
- Queries N+1

### 9. Logs Muito Grandes / Espaço em Disco

**Sintomas:**
- Disco cheio
- `/var/lib/docker` muito grande
- Logs gigantes

**Diagnóstico:**

```bash
# Verificar espaço em disco
df -h

# Verificar tamanho de logs
du -sh logs/
du -sh /var/lib/docker/

# Verificar tamanho de volumes
docker system df -v
```

**Soluções:**

```bash
# Solução 1: Configurar log rotation no Docker Compose
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

# Solução 2: Limpar logs antigos
truncate -s 0 logs/backend/*.log
truncate -s 0 logs/nginx/*.log

# Solução 3: Limpar Docker cache
docker system prune -a --volumes

# Solução 4: Configurar logrotate
sudo nano /etc/logrotate.d/trustlayer
# Adicionar:
/opt/trustlayer/logs/*/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

**Causa Raiz:**
- Logs sem rotação
- Log level muito verboso (debug em produção)

### 10. CORS Error no Frontend

**Sintomas:**
- "CORS policy: No 'Access-Control-Allow-Origin' header"
- Requests do frontend para API bloqueados

**Diagnóstico:**

```bash
# Verificar configuração CORS
docker-compose exec backend env | grep CORS

# Testar com curl
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:3001/api/assessments -v
```

**Soluções:**

```bash
# Solução 1: Configurar CORS_ORIGIN no .env
CORS_ORIGIN=https://trustlayer.seudominio.com

# Solução 2: Verificar código de CORS no backend
# backend/src/middleware/cors.ts deve ter:
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

# Solução 3: Se usar NGINX, adicionar headers
add_header 'Access-Control-Allow-Origin' '$http_origin' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
```

**Causa Raiz:**
- CORS_ORIGIN não configurado
- Frontend e backend em domínios diferentes sem CORS habilitado

## Ferramentas de Diagnóstico

### Script de Health Check Completo

Crie `scripts/health-check.sh`:

```bash
#!/bin/bash

echo "=== TrustLayer Health Check ==="

# 1. Containers
echo -e "\n[1] Verificando containers..."
docker-compose ps

# 2. Backend
echo -e "\n[2] Verificando backend..."
curl -f http://localhost:3001/health && echo "✅ Backend OK" || echo "❌ Backend FAIL"

# 3. PostgreSQL
echo -e "\n[3] Verificando PostgreSQL..."
docker-compose exec postgres pg_isready -U trustlayer && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL FAIL"

# 4. NGINX
echo -e "\n[4] Verificando NGINX..."
docker-compose exec nginx nginx -t && echo "✅ NGINX Config OK" || echo "❌ NGINX Config FAIL"

# 5. Disco
echo -e "\n[5] Verificando espaço em disco..."
df -h | grep -E '(Filesystem|/dev/)'

# 6. Memória
echo -e "\n[6] Verificando memória..."
free -h

# 7. Últimos erros
echo -e "\n[7] Últimos erros nos logs..."
docker-compose logs --tail=20 | grep -i error

echo -e "\n=== Health Check Completo ==="
```

Executar:

```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

### Debug Mode

Para ativar logs verbosos:

```bash
# Editar .env
LOG_LEVEL=debug

# Restart
docker-compose restart backend

# Ver logs detalhados
docker-compose logs -f backend
```

## Escalação de Suporte

### Nível 1: Auto-diagnóstico
- Consultar este guia
- Verificar logs
- Tentar soluções básicas (restart)

### Nível 2: Suporte Técnico
- Email: support@trustlayer.com
- Incluir:
  - Descrição do problema
  - Logs relevantes
  - Output de `docker-compose ps`
  - Output de `docker-compose logs`

### Nível 3: Engenharia
- Issues críticos
- Bugs confirmados
- GitHub Issues: https://github.com/your-org/trustlayer/issues

## Checklist de Troubleshooting

Antes de contatar suporte, executar:

- [ ] Verificar logs: `docker-compose logs`
- [ ] Verificar status: `docker-compose ps`
- [ ] Verificar espaço em disco: `df -h`
- [ ] Verificar recursos: `docker stats`
- [ ] Tentar restart: `docker-compose restart`
- [ ] Verificar variáveis: `cat .env`
- [ ] Testar health: `curl http://localhost:3001/health`
- [ ] Verificar rede: `docker network ls`

## Referências

- [Common Issues](./common-issues.md)
- [Log Analysis Guide](./log-analysis.md)
- [Performance Tuning](./performance-tuning.md)
- [Docker Troubleshooting](https://docs.docker.com/config/daemon/)

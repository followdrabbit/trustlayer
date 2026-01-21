# Problemas Comuns - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia documenta os problemas mais comuns encontrados no TrustLayer e suas soluções.

## Autenticação

### Usuário não consegue fazer login

**Sintomas:**
- Erro "Invalid credentials"
- Tela de login não responde
- Redirecionamento infinito

**Diagnóstico:**
```bash
# Verificar status do Auth
curl -s https://api.trustlayer.exemplo.com/auth/v1/health

# Verificar logs
docker logs trustlayer-auth --tail 100

# Verificar usuário no banco
psql -c "SELECT id, email, banned_until, email_confirmed_at FROM auth.users WHERE email = 'user@example.com'"
```

**Soluções:**

| Causa | Solução |
|-------|---------|
| Senha incorreta | Reset de senha via admin |
| Conta banida | `UPDATE auth.users SET banned_until = NULL WHERE email = 'user@example.com'` |
| Email não confirmado | `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'user@example.com'` |
| MFA travado | Desabilitar MFA temporariamente |

### MFA não funciona

**Sintomas:**
- Código TOTP sempre inválido
- QR code não escaneia

**Diagnóstico:**
```bash
# Verificar sincronização de tempo
timedatectl status

# Verificar fator MFA do usuário
psql -c "SELECT mfa_factors FROM auth.users WHERE id = 'user-uuid'"
```

**Soluções:**
```sql
-- Reset MFA do usuário
DELETE FROM auth.mfa_factors WHERE user_id = 'user-uuid';
UPDATE profiles SET mfa_enabled = false WHERE id = 'user-uuid';
```

### SSO falha

**Sintomas:**
- Erro SAML response
- Redirect loop
- "Invalid assertion"

**Diagnóstico:**
```bash
# Verificar configuração SSO
curl -s https://api.trustlayer.exemplo.com/auth/v1/settings

# Testar certificado SAML
openssl x509 -in saml.crt -text -noout
```

**Soluções:**

| Causa | Solução |
|-------|---------|
| Certificado expirado | Atualizar certificado |
| URL de callback incorreta | Corrigir ACS URL no IdP |
| Clock skew | Sincronizar NTP |
| Atributos incorretos | Verificar mapeamento de claims |

## Database

### Conexões esgotadas

**Sintomas:**
- Erro "too many connections"
- Timeouts intermitentes

**Diagnóstico:**
```sql
-- Verificar conexões
SELECT count(*), state, usename, application_name
FROM pg_stat_activity
GROUP BY state, usename, application_name
ORDER BY count DESC;

-- Verificar conexões idle
SELECT pid, now() - state_change as idle_time, query
FROM pg_stat_activity
WHERE state = 'idle'
ORDER BY idle_time DESC
LIMIT 20;
```

**Soluções:**
```sql
-- Terminar conexões idle antigas
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < now() - interval '1 hour';
```

```ini
# Aumentar limite (postgresql.conf)
max_connections = 300
```

### Queries lentas

**Sintomas:**
- Dashboard demora para carregar
- Timeout em relatórios

**Diagnóstico:**
```sql
-- Queries mais lentas
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Verificar locks
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.query AS blocked_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

**Soluções:**
```sql
-- Criar índice faltante
CREATE INDEX CONCURRENTLY idx_answers_user_domain ON answers(user_id, security_domain);

-- Vacuum e analyze
VACUUM ANALYZE answers;

-- Matar query travada
SELECT pg_terminate_backend(<pid>);
```

### Replicação atrasada

**Sintomas:**
- Dados desatualizados em réplicas
- Lag de replicação alto

**Diagnóstico:**
```sql
-- Verificar lag
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn,
       (extract(epoch from now()) - extract(epoch from replay_lag))::int as lag_seconds
FROM pg_stat_replication;
```

**Soluções:**
- Verificar rede entre primary e replica
- Aumentar `wal_keep_size`
- Verificar I/O na réplica

## API / Edge Functions

### Erro 502 Bad Gateway

**Sintomas:**
- API retorna 502
- Intermitente ou constante

**Diagnóstico:**
```bash
# Verificar saúde do backend
curl -v https://api.trustlayer.exemplo.com/rest/v1/

# Logs do API gateway
docker logs trustlayer-kong --tail 100

# Logs das Edge Functions
docker logs trustlayer-functions --tail 100
```

**Soluções:**

| Causa | Solução |
|-------|---------|
| Edge Function crashed | Reiniciar container |
| Timeout | Aumentar timeout no Kong |
| Memória | Aumentar limits do container |
| Cold start | Implementar warm-up |

### Rate Limiting

**Sintomas:**
- Erro 429 Too Many Requests
- Usuários bloqueados

**Diagnóstico:**
```bash
# Verificar rate limits atuais
curl -I https://api.trustlayer.exemplo.com/rest/v1/

# Verificar headers
# X-RateLimit-Remaining: N
# X-RateLimit-Reset: timestamp
```

**Soluções:**
```yaml
# Ajustar rate limits (kong.yml)
plugins:
  - name: rate-limiting
    config:
      minute: 1000
      policy: redis
```

### CORS Errors

**Sintomas:**
- Erro "Access-Control-Allow-Origin"
- Requests bloqueados no browser

**Diagnóstico:**
```bash
# Testar preflight
curl -X OPTIONS https://api.trustlayer.exemplo.com/rest/v1/ \
  -H "Origin: https://trustlayer.exemplo.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Soluções:**
```yaml
# Configurar CORS (kong.yml)
plugins:
  - name: cors
    config:
      origins:
        - https://trustlayer.exemplo.com
      methods:
        - GET
        - POST
        - PUT
        - DELETE
      headers:
        - Authorization
        - Content-Type
        - apikey
```

## Frontend

### Tela branca

**Sintomas:**
- Aplicação não carrega
- Console mostra erros JavaScript

**Diagnóstico:**
```bash
# Verificar se assets estão acessíveis
curl -I https://trustlayer.exemplo.com/assets/index.js

# Verificar variáveis de ambiente
docker exec trustlayer-frontend env | grep VITE
```

**Soluções:**

| Causa | Solução |
|-------|---------|
| Build corrompido | Rebuild: `npm run build` |
| Variáveis faltando | Verificar `.env` no build |
| Cache do browser | Limpar cache ou hard refresh |
| CDN cache | Purgar cache do CDN |

### Performance lenta

**Sintomas:**
- LCP > 2.5s
- TTI alto

**Diagnóstico:**
```bash
# Lighthouse audit
npx lighthouse https://trustlayer.exemplo.com --output html

# Bundle analyzer
npm run build -- --analyze
```

**Soluções:**
- Code splitting
- Lazy loading de rotas
- Otimizar imagens
- Habilitar gzip/brotli
- Usar CDN

## Storage

### Upload falha

**Sintomas:**
- Erro ao fazer upload de evidências
- Timeout em arquivos grandes

**Diagnóstico:**
```bash
# Verificar bucket
curl -s https://api.trustlayer.exemplo.com/storage/v1/bucket/evidence

# Verificar permissões
psql -c "SELECT * FROM storage.policies WHERE bucket_id = 'evidence'"
```

**Soluções:**

| Causa | Solução |
|-------|---------|
| Tamanho excedido | Ajustar `client_max_body_size` |
| Tipo não permitido | Adicionar MIME type ao bucket |
| Permissão negada | Verificar RLS policies |
| Storage cheio | Limpar arquivos antigos |

## Email

### Emails não chegam

**Sintomas:**
- Confirmação de email não chega
- Reset de senha não funciona

**Diagnóstico:**
```bash
# Testar SMTP
telnet smtp.exemplo.com 587

# Verificar configuração
docker exec trustlayer-auth env | grep SMTP

# Verificar logs
docker logs trustlayer-auth 2>&1 | grep -i email
```

**Soluções:**

| Causa | Solução |
|-------|---------|
| SMTP bloqueado | Verificar firewall |
| Credenciais | Testar credenciais manualmente |
| SPF/DKIM | Configurar registros DNS |
| Blacklist | Verificar se IP está em lista negra |

## Checklist de Troubleshooting

```markdown
## Checklist Geral

### Infraestrutura
- [ ] Todos os containers estão rodando?
- [ ] Há espaço em disco suficiente?
- [ ] CPU/Memória estão normais?
- [ ] Rede está funcionando?

### Aplicação
- [ ] Logs mostram erros?
- [ ] Health checks estão passando?
- [ ] Certificados SSL válidos?
- [ ] Variáveis de ambiente corretas?

### Database
- [ ] PostgreSQL está acessível?
- [ ] Conexões estão normais?
- [ ] Replicação está síncrona?
- [ ] Índices estão otimizados?

### Segurança
- [ ] WAF está permitindo tráfego?
- [ ] Rate limits não estão bloqueando?
- [ ] CORS está configurado?
- [ ] Certificados não expiraram?
```

## Comandos Úteis

```bash
# Status geral
docker compose ps
kubectl get pods -n trustlayer

# Logs
docker compose logs -f --tail 100
kubectl logs -f deployment/trustlayer-frontend

# Restart
docker compose restart <service>
kubectl rollout restart deployment/trustlayer-api

# Shell no container
docker exec -it trustlayer-api sh
kubectl exec -it <pod> -- /bin/sh

# Verificar saúde
curl -s https://trustlayer.exemplo.com/healthz | jq
curl -s https://api.trustlayer.exemplo.com/rest/v1/ | head
```

## Próximos Passos

1. [Guia de Troubleshooting](./troubleshooting.md)
2. [Performance Tuning](./performance-tuning.md)
3. [Análise de Logs](./log-analysis.md)

## Referências

- [PostgreSQL Troubleshooting](https://wiki.postgresql.org/wiki/Troubleshooting)
- [Docker Troubleshooting](https://docs.docker.com/config/daemon/)
- [Kubernetes Troubleshooting](https://kubernetes.io/docs/tasks/debug/)

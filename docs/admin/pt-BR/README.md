# Documentação para Administradores - TrustLayer

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.2.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Esta seção da documentação é destinada a **administradores de sistema** responsáveis pela instalação, configuração, manutenção e troubleshooting da plataforma TrustLayer.

## Público-Alvo

- Administradores de infraestrutura
- DevOps engineers
- SRE (Site Reliability Engineers)
- Administradores de segurança
- Responsáveis por implantação on-premises ou cloud

## Pré-requisitos

Para trabalhar com TrustLayer como administrador, você deve ter:

- Conhecimento de Docker e Kubernetes
- Experiência com bancos de dados PostgreSQL
- Familiaridade com conceitos de SSO (SAML, OAuth/OIDC)
- Conhecimento básico de redes e segurança
- Acesso aos servidores/clusters de produção

---

## Quick Start - Desenvolvimento Local

Para começar rapidamente com um ambiente de desenvolvimento local:

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

**Serviços disponíveis:**
| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:5173 | Aplicação React |
| PostgreSQL | localhost:5432 | Banco de dados |
| Mailhog | http://localhost:8025 | Visualizar emails |

Para mais detalhes, veja o [Guia de Desenvolvimento Local](../../LOCAL_DEVELOPMENT.md).

---

## Quick Start - Produção com Docker Compose

```bash
# 1. Clone o repositório
git clone https://github.com/trustlayer/trustlayer.git
cd trustlayer

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações de produção

# 3. Inicie os containers
docker compose up -d

# 4. Provisione o admin
ADMIN_EMAIL=admin@suaempresa.com \
ADMIN_PASSWORD=SuaSenhaSegura123! \
npm run provision:admin

# 5. Execute o seed do catálogo
npm run seed:catalog
```

Acesse a aplicação em: `https://seu-dominio.com`

Para configuração completa, veja [Deploy com Docker Compose](./deployment-docker-compose.md).

---

## Índice

### 1. Instalação e Deploy
- [Instalação On-Premises](./installation-on-prem.md) - Instalação em infraestrutura própria
- [Deploy com Docker Compose](./deployment-docker-compose.md) - Deploy simplificado
- [Deploy com Kubernetes](./deployment-k8s.md) - Deploy em cluster K8s
- [Configuração de Load Balancer](./load-balancer.md) - NGINX, HAProxy, ALB

### 2. Configuração
- [Variáveis de Ambiente](./environment-variables.md) - Referência completa
- [Configuração de Banco de Dados](./database-configuration.md) - PostgreSQL, RLS, índices
- [Integração SSO (SAML/OAuth)](./sso-integration.md) - SAML 2.0, OIDC
- [Configuração de Email (SMTP)](./email-configuration.md) - SMTP, templates
- [Storage e Upload de Arquivos](./storage-configuration.md) - Local, S3, GCS

### 3. Segurança
- [Baseline de Segurança](./security.md) - OWASP Top 10, hardening
- [Configuração de WAF](./waf-configuration.md) - AWS WAF, Cloudflare, ModSecurity
- [Certificados SSL/TLS](./ssl-certificates.md) - Let's Encrypt, cert-manager
- [Backup e Restore](./backup-restore.md) - Estratégias e scripts
- [Políticas de Retenção de Dados](./data-retention.md) - LGPD, GDPR
- [Auditoria e Compliance](./audit-compliance.md) - SOC 2, ISO 27001

### 4. Observabilidade
- [OpenTelemetry Setup](./opentelemetry.md) - Traces, métricas, logs
- [Integração com Grafana](./grafana-integration.md) - Dashboards, alertas
- [Integração com ELK Stack](./elk-integration.md) - Elasticsearch, Kibana
- [Logs e Monitoramento](./logging-monitoring.md) - Estratégias de logging
- [Alertas e Notificações](./alerts.md) - Prometheus, PagerDuty, Slack

### 5. Troubleshooting
- [Guia de Troubleshooting](./troubleshooting.md) - Metodologia
- [Problemas Comuns](./common-issues.md) - Soluções rápidas
- [Performance Tuning](./performance-tuning.md) - Otimização
- [Análise de Logs](./log-analysis.md) - Técnicas e ferramentas

### 6. Manutenção
- [Atualizações e Upgrades](./updates-upgrades.md) - Rolling updates
- [Migração de Versões](./version-migration.md) - Guias de migração
- [Rotinas de Manutenção](./maintenance-routines.md) - Tarefas periódicas
- [Disaster Recovery](./disaster-recovery.md) - RTO, RPO, runbooks

### 7. Gerenciamento
- [Gerenciamento de Usuários](./user-management.md) - Roles, permissões
- [Gerenciamento de Organizações](./organization-management.md) - Multi-tenancy
- [Configuração de Módulos](./module-configuration.md) - Arquitetura modular
- [Licenciamento](./licensing.md) - Tipos de licença, features

---

## Comandos Úteis

### npm scripts

```bash
# Setup e desenvolvimento
npm run setup              # Setup automatizado
npm run dev                # Servidor de desenvolvimento

# Docker
npm run docker:up          # Inicia containers
npm run docker:down        # Para containers
npm run docker:logs        # Visualiza logs
npm run docker:reset       # Reset completo

# Banco de dados
npm run db:shell           # Acesso ao PostgreSQL
npm run seed:catalog       # Popula catálogo

# Usuários
npm run provision:admin    # Cria admin
npm run provision:user     # Cria usuário

# Manutenção
npm run retention:cleanup  # Limpeza de dados antigos
```

### Makefile

```bash
make help         # Lista todos os comandos
make setup        # Setup completo
make dev          # Inicia desenvolvimento
make up / down    # Controla containers
make db-shell     # Acesso ao banco
make db-dump      # Backup do banco
make test         # Executa testes
make reset        # Reset completo
```

---

## Arquitetura de Referência

```
                            ┌─────────────────┐
                            │   Load Balancer │
                            │   (NGINX/ALB)   │
                            └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
              │ Frontend  │   │ Frontend  │   │ Frontend  │
              │  (React)  │   │  (React)  │   │  (React)  │
              └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
                            ┌────────▼────────┐
                            │    Supabase     │
                            │  (Auth, API)    │
                            └────────┬────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
        ┌─────▼─────┐         ┌─────▼─────┐         ┌─────▼─────┐
        │ PostgreSQL│         │   Redis   │         │  Storage  │
        │  Primary  │         │  (Cache)  │         │   (S3)    │
        └─────┬─────┘         └───────────┘         └───────────┘
              │
        ┌─────▼─────┐
        │ PostgreSQL│
        │  Replica  │
        └───────────┘
```

---

## Checklist de Produção

Antes de ir para produção, verifique:

### Segurança
- [ ] Credenciais alteradas (não usar padrões)
- [ ] JWT_SECRET configurado (mínimo 32 caracteres)
- [ ] HTTPS habilitado com certificados válidos
- [ ] WAF configurado e testado
- [ ] Rate limiting habilitado
- [ ] CORS configurado corretamente
- [ ] MFA habilitado para admins

### Banco de Dados
- [ ] Backup automático configurado
- [ ] Replicação configurada (se aplicável)
- [ ] Connection pooling configurado
- [ ] Índices otimizados
- [ ] RLS habilitado em todas as tabelas

### Observabilidade
- [ ] Logging centralizado
- [ ] Métricas coletadas
- [ ] Alertas configurados
- [ ] Dashboards criados
- [ ] Runbooks documentados

### Disaster Recovery
- [ ] RTO/RPO definidos
- [ ] Backup testado e restaurável
- [ ] Plano de DR documentado
- [ ] Failover testado

---

## Suporte

Para questões administrativas:

- **Documentação**: Você está aqui!
- **Issues**: https://github.com/trustlayer/trustlayer/issues
- **Discussions**: https://github.com/trustlayer/trustlayer/discussions
- **Security**: security@trustlayer.com (para vulnerabilidades)

## Referências

- [Architecture Decision Records (ADR)](../../adr/) - Decisões arquiteturais
- [Roadmap](../../roadmap.md) - Planejamento do projeto
- [API Documentation](../../developer/pt-BR/api-reference.md) - Referência da API
- [Developer Docs](../../developer/pt-BR/README.md) - Documentação para desenvolvedores
- [Changelog](../../CHANGELOG.md) - Histórico de mudanças

---

## Glossário

| Termo | Descrição |
|-------|-----------|
| **RLS** | Row Level Security - Segurança em Nível de Linha |
| **SSO** | Single Sign-On |
| **SAML** | Security Assertion Markup Language |
| **OIDC** | OpenID Connect |
| **WAF** | Web Application Firewall |
| **MFA** | Multi-Factor Authentication |
| **TOTP** | Time-based One-Time Password |
| **WebAuthn** | Web Authentication API |
| **RTO** | Recovery Time Objective |
| **RPO** | Recovery Point Objective |
| **MTTR** | Mean Time To Recovery |
| **SLO** | Service Level Objective |
| **SLA** | Service Level Agreement |

# User Management - TrustLayer Admin Guide

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre todas as operações de gerenciamento de usuários no TrustLayer, incluindo criação, edição, permissões e desativação de contas.

## Acessando User Management

1. Faça login como Admin
2. No menu lateral, clique em **Settings > Users**
3. A lista de usuários será exibida

## Criar Novo Usuário

### Via Interface

1. Clique em **"Add User"**
2. Preencha os campos:

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| Email | Sim | Email único do usuário |
| Nome | Sim | Nome completo |
| Role | Sim | Papel do usuário |
| Department | Não | Departamento |
| Phone | Não | Telefone |

3. Clique **"Send Invite"**
4. Usuário receberá email com link de ativação

### Via API

```bash
curl -X POST "https://api.trustlayer.com/v1/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@company.com",
    "name": "New User",
    "role": "analyst",
    "department": "IT"
  }'
```

### Bulk Import

Para importar múltiplos usuários:

1. Clique em **"Import Users"**
2. Baixe o template CSV
3. Preencha com os dados dos usuários
4. Upload do arquivo CSV
5. Revise e confirme

**Formato CSV:**
```csv
email,name,role,department
user1@company.com,User One,analyst,IT
user2@company.com,User Two,manager,Security
user3@company.com,User Three,viewer,Compliance
```

## Roles e Permissões

### Roles Disponíveis

| Role | Descrição | Permissões Principais |
|------|-----------|----------------------|
| Admin | Administrador completo | Todas as permissões |
| Manager | Gerente de equipe | CRUD assessments, dashboards, reports |
| Analyst | Analista operacional | Responder assessments, visualizar dashboards |
| Auditor | Auditor (read-only) | Visualizar audit logs, exportar relatórios |
| Viewer | Visualizador | Apenas leitura de dashboards e reports |

### Matriz de Permissões

| Funcionalidade | Admin | Manager | Analyst | Auditor | Viewer |
|----------------|-------|---------|---------|---------|--------|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Org Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Assessment | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Assessment | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Assessment | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete Assessment | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Dashboards | ✅ | ✅ | ✅ | ✅ | ✅ |
| Generate Reports | ✅ | ✅ | ✅ | ✅ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ | ✅ | ❌ |
| Export Data | ✅ | ✅ | ❌ | ✅ | ❌ |

### Alterar Role

1. Encontre o usuário na lista
2. Clique no menu de ações (⋮)
3. Selecione **"Change Role"**
4. Escolha a nova role
5. Confirme a mudança

**Nota**: Mudanças de role são auditadas e entram em vigor imediatamente.

## Gerenciar Usuários

### Editar Usuário

1. Clique no nome do usuário
2. Edite os campos desejados
3. Clique **"Save"**

**Campos editáveis:**
- Nome
- Department
- Phone
- Role
- Avatar

**Campos não editáveis:**
- Email (identificador único)
- Organization

### Desativar Usuário

Para desativar temporariamente:

1. Menu de ações (⋮) > **"Deactivate"**
2. Confirme a ação
3. Usuário não poderá fazer login

**Efeitos:**
- Sessões ativas são encerradas
- Não pode fazer login
- Dados são preservados
- Pode ser reativado

### Reativar Usuário

1. Filtre por **"Inactive"** users
2. Menu de ações (⋮) > **"Reactivate"**
3. Usuário pode fazer login novamente

### Deletar Usuário

Para remover permanentemente:

1. Menu de ações (⋮) > **"Delete"**
2. Digite o email para confirmar
3. Clique **"Delete Permanently"**

**Importante:**
- Ação irreversível
- Dados associados são anonimizados (não deletados)
- Audit logs são preservados
- Assessments são reatribuídos ou órfãos

## MFA Management

### Verificar Status MFA

Na lista de usuários, a coluna **MFA** mostra:
- 🟢 Enabled
- 🔴 Disabled
- ⏳ Pending setup

### Forçar Reset de MFA

Se usuário perdeu acesso ao authenticator:

1. Menu de ações (⋮) > **"Reset MFA"**
2. Confirme a ação
3. Usuário precisará configurar MFA novamente no próximo login

### Política de MFA

Configure em **Settings > Security > MFA Policy**:

- **Disabled**: MFA opcional
- **Optional**: Usuário escolhe
- **Required**: Obrigatório para todos
- **Required for Admins**: Obrigatório só para admins

## Sessões

### Ver Sessões Ativas

1. Clique no usuário
2. Aba **"Sessions"**
3. Veja todas as sessões ativas

**Informações por sessão:**
- Device / Browser
- IP Address
- Location
- Last activity
- Login time

### Encerrar Sessão

1. Na lista de sessões, encontre a sessão
2. Clique **"Revoke"**
3. Sessão é encerrada imediatamente

### Encerrar Todas as Sessões

1. Menu de ações (⋮) > **"Revoke All Sessions"**
2. Confirme
3. Todas as sessões do usuário são encerradas

## Password Management

### Reset de Senha

Se usuário esqueceu a senha:

**Opção 1 - Usuário inicia:**
1. Na tela de login, clicar "Forgot Password"
2. Email é enviado com link de reset

**Opção 2 - Admin inicia:**
1. Menu de ações (⋮) > **"Reset Password"**
2. Email é enviado ao usuário

### Forçar Troca de Senha

Para forçar usuário a trocar senha no próximo login:

1. Menu de ações (⋮) > **"Require Password Change"**
2. No próximo login, usuário será obrigado a definir nova senha

## Convites

### Status de Convites

| Status | Descrição |
|--------|-----------|
| Pending | Convite enviado, aguardando aceite |
| Expired | Convite expirou (válido por 7 dias) |
| Accepted | Usuário aceitou e criou conta |

### Reenviar Convite

1. Filtre por **"Pending Invites"**
2. Menu de ações (⋮) > **"Resend Invite"**
3. Novo email é enviado

### Cancelar Convite

1. Menu de ações (⋮) > **"Cancel Invite"**
2. Convite é invalidado

## Filtros e Busca

### Buscar Usuários

```
Search: [name, email, or department]
```

### Filtros Disponíveis

```
Status: [All | Active | Inactive | Pending]
Role: [All | Admin | Manager | Analyst | Auditor | Viewer]
MFA: [All | Enabled | Disabled]
Department: [All | IT | Security | Compliance | ...]
```

### Ordenação

- Name (A-Z, Z-A)
- Email (A-Z, Z-A)
- Role
- Last Login
- Created Date

## Exportar Lista de Usuários

1. Aplique filtros desejados
2. Clique **"Export"**
3. Selecione formato: CSV ou Excel
4. Download automático

## Audit Trail

Todas as ações em usuários são auditadas:

- User created
- User updated
- Role changed
- User deactivated
- User reactivated
- User deleted
- MFA reset
- Password reset
- Session revoked

Ver em: **Audit Logs > Filter: User Management**

## Troubleshooting

### Usuário não recebe email de convite

1. Verificar se email está correto
2. Verificar spam/junk folder
3. Verificar configuração de email do sistema
4. Reenviar convite

### Usuário não consegue fazer login

1. Verificar se conta está ativa
2. Verificar se senha está correta
3. Verificar se MFA está configurado corretamente
4. Verificar se há sessões bloqueadas (rate limiting)

### Role não aplicada corretamente

1. Verificar se mudança foi salva
2. Usuário deve fazer logout e login novamente
3. Limpar cache do browser

## Referências

- [SSO Integration](./sso-integration.md)
- [Audit Logs](../auditor/pt-BR/audit-logs.md)
- [Security Best Practices](./security.md)

# SSO/SAML Integration - TrustLayer Admin Guide

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

TrustLayer suporta Single Sign-On (SSO) via SAML 2.0, permitindo integração com os principais Identity Providers (IdPs).

## Identity Providers Suportados

| IdP | Status | Documentação |
|-----|--------|--------------|
| Okta | ✅ Suportado | [Okta Setup](#okta) |
| Azure AD | ✅ Suportado | [Azure AD Setup](#azure-ad) |
| Google Workspace | ✅ Suportado | [Google Setup](#google-workspace) |
| OneLogin | ✅ Suportado | [OneLogin Setup](#onelogin) |
| PingIdentity | ✅ Suportado | [Ping Setup](#pingidentity) |
| ADFS | ✅ Suportado | [ADFS Setup](#adfs) |
| Generic SAML | ✅ Suportado | [Generic Setup](#generic-saml) |

## Configuração Geral

### Pré-requisitos

- Acesso admin ao TrustLayer
- Acesso admin ao Identity Provider
- Domínio de email verificado

### Informações do TrustLayer (Service Provider)

```
Entity ID (SP):
https://app.trustlayer.com/auth/saml/metadata

ACS URL (Assertion Consumer Service):
https://app.trustlayer.com/auth/saml/callback

SLO URL (Single Logout):
https://app.trustlayer.com/auth/saml/logout

Metadata URL:
https://app.trustlayer.com/auth/saml/metadata.xml
```

### Atributos Requeridos

| Atributo | Obrigatório | Descrição |
|----------|-------------|-----------|
| email | Sim | Email do usuário (NameID ou atributo) |
| firstName | Não | Primeiro nome |
| lastName | Não | Sobrenome |
| role | Não | Role no TrustLayer |
| department | Não | Departamento |

## Okta

### Passo 1: Criar Aplicação no Okta

1. Acesse **Okta Admin Console**
2. Vá em **Applications > Create App Integration**
3. Selecione **SAML 2.0**
4. Configure:

```
App Name: TrustLayer
App Logo: [Upload logo]

SAML Settings:
- Single sign-on URL: https://app.trustlayer.com/auth/saml/callback
- Audience URI (SP Entity ID): https://app.trustlayer.com/auth/saml/metadata
- Name ID format: EmailAddress
- Application username: Email
```

### Passo 2: Configurar Atributos

```
Attribute Statements:
- email → user.email
- firstName → user.firstName
- lastName → user.lastName
- department → user.department

Group Attribute Statements:
- groups → Matches regex: .*
```

### Passo 3: Obter Metadata

1. Na aba **Sign On**, clique em **View SAML setup instructions**
2. Copie:
   - Identity Provider Single Sign-On URL
   - Identity Provider Issuer
   - X.509 Certificate

### Passo 4: Configurar no TrustLayer

1. Vá em **Settings > Authentication > SSO**
2. Clique **"Configure SSO"**
3. Selecione **Okta**
4. Cole as informações:

```
IdP Entity ID: https://your-domain.okta.com/...
IdP SSO URL: https://your-domain.okta.com/app/.../sso/saml
Certificate: [Cole o certificado X.509]
```

5. Clique **"Save & Test"**

## Azure AD

### Passo 1: Registrar Aplicação

1. Acesse **Azure Portal > Azure Active Directory**
2. Vá em **Enterprise Applications > New Application**
3. Clique **Create your own application**
4. Nome: **TrustLayer**
5. Selecione **Integrate any other application (Non-gallery)**

### Passo 2: Configurar SAML

1. Vá em **Single sign-on > SAML**
2. Configure **Basic SAML Configuration**:

```
Identifier (Entity ID):
https://app.trustlayer.com/auth/saml/metadata

Reply URL (ACS URL):
https://app.trustlayer.com/auth/saml/callback

Sign on URL:
https://app.trustlayer.com/login

Logout URL:
https://app.trustlayer.com/auth/saml/logout
```

### Passo 3: Configurar Claims

Em **Attributes & Claims**:

```
Required Claims:
- emailaddress → user.mail
- givenname → user.givenname
- surname → user.surname

Additional Claims:
- department → user.department
- groups → user.groups
```

### Passo 4: Baixar Metadata

1. Na seção **SAML Certificates**, baixe:
   - **Federation Metadata XML** (recomendado)
   - Ou copie **Certificate (Base64)**

2. Copie:
   - **Login URL**
   - **Azure AD Identifier**

### Passo 5: Configurar no TrustLayer

1. Vá em **Settings > Authentication > SSO**
2. Selecione **Azure AD**
3. Upload do **Metadata XML** ou configure manualmente:

```
IdP Entity ID: https://sts.windows.net/{tenant-id}/
IdP SSO URL: https://login.microsoftonline.com/{tenant-id}/saml2
Certificate: [Cole o certificado]
```

## Google Workspace

### Passo 1: Criar App SAML

1. Acesse **Google Admin Console**
2. Vá em **Apps > Web and mobile apps**
3. Clique **Add App > Add custom SAML app**
4. Nome: **TrustLayer**

### Passo 2: Obter Metadata do Google

Copie:
- SSO URL
- Entity ID
- Certificate

### Passo 3: Configurar Service Provider

```
ACS URL: https://app.trustlayer.com/auth/saml/callback
Entity ID: https://app.trustlayer.com/auth/saml/metadata
Start URL: https://app.trustlayer.com/login
Name ID format: EMAIL
Name ID: Basic Information > Primary email
```

### Passo 4: Mapear Atributos

```
Google Directory Attributes → App Attributes:
Primary email → email
First name → firstName
Last name → lastName
Department → department
```

### Passo 5: Ativar para Usuários

1. Em **User access**, selecione as OUs que terão acesso
2. Clique **Save**

### Passo 6: Configurar no TrustLayer

1. Vá em **Settings > Authentication > SSO**
2. Selecione **Google Workspace**
3. Configure com os dados copiados

## Generic SAML

Para IdPs não listados:

### Passo 1: Obter Informações do IdP

Você precisará:
- IdP Entity ID
- IdP SSO URL (HTTP-Redirect ou HTTP-POST)
- IdP Certificate (X.509, formato PEM)
- IdP SLO URL (opcional)

### Passo 2: Configurar no TrustLayer

1. Vá em **Settings > Authentication > SSO**
2. Selecione **Custom SAML**
3. Preencha:

```
┌─────────────────────────────────────────────────┐
│ CUSTOM SAML CONFIGURATION                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ IdP Entity ID:                                  │
│ [_________________________________________]    │
│                                                 │
│ IdP SSO URL:                                    │
│ [_________________________________________]    │
│                                                 │
│ IdP SLO URL (optional):                         │
│ [_________________________________________]    │
│                                                 │
│ Certificate:                                    │
│ [________________________________________]     │
│ [________________________________________]     │
│ [Upload .pem or paste certificate]             │
│                                                 │
│ Binding:                                        │
│ ○ HTTP-Redirect (recommended)                  │
│ ○ HTTP-POST                                    │
│                                                 │
│ Sign Requests: ☑                               │
│ Want Assertions Signed: ☑                      │
│ Want Assertions Encrypted: ☐                   │
│                                                 │
│ [Test Connection] [Save]                        │
└─────────────────────────────────────────────────┘
```

## Attribute Mapping

### Configurar Mapeamento

```
┌─────────────────────────────────────────────────┐
│ ATTRIBUTE MAPPING                               │
├─────────────────────────────────────────────────┤
│                                                 │
│ Email (required):                               │
│ [email________________________] ▼              │
│   Common: email, emailAddress,                  │
│           urn:oid:0.9.2342...                  │
│                                                 │
│ First Name:                                     │
│ [firstName____________________] ▼              │
│                                                 │
│ Last Name:                                      │
│ [lastName_____________________] ▼              │
│                                                 │
│ Role:                                           │
│ [role_________________________] ▼              │
│                                                 │
│ [+ Add Custom Mapping]                          │
└─────────────────────────────────────────────────┘
```

### Role Mapping

Mapeie grupos do IdP para roles do TrustLayer:

```
IdP Group               → TrustLayer Role
─────────────────────────────────────────
TrustLayer-Admins       → Admin
TrustLayer-Managers     → Manager
TrustLayer-Analysts     → Analyst
TrustLayer-Auditors     → Auditor
TrustLayer-Viewers      → Viewer
```

## Configurações Avançadas

### Just-in-Time Provisioning

Criar usuários automaticamente no primeiro login:

```
JIT Provisioning: ☑ Enabled

Default Role: [Viewer ▼]
Default Organization: [Main Org ▼]

Auto-update attributes on login: ☑
```

### Domínios Permitidos

Restringir SSO a domínios específicos:

```
Allowed Domains:
- company.com
- subsidiary.com
```

### Forçar SSO

Desabilitar login com email/senha:

```
Authentication Methods:
☑ SSO (SAML)
☐ Email/Password (desabilitado quando SSO forçado)
```

**Nota**: Mantenha pelo menos um admin com email/senha como backup.

## Testar SSO

### Test Connection

1. Clique **"Test Connection"**
2. Nova aba abrirá com fluxo SSO
3. Faça login no IdP
4. Verifique se retorna ao TrustLayer com sucesso

### Debug Mode

Habilite para troubleshooting:

```
Debug Mode: ☑ Enabled (disable in production)
```

Logs detalhados em **Settings > Logs > SSO Debug**

### Checklist de Teste

- [ ] Login SSO funciona
- [ ] Atributos mapeados corretamente
- [ ] Role atribuída corretamente
- [ ] Logout funciona
- [ ] JIT provisioning funciona (se habilitado)

## Troubleshooting

### Erro: Invalid Signature

**Causa**: Certificado incorreto ou expirado

**Solução**:
1. Verifique se o certificado está correto
2. Verifique se o certificado não expirou
3. Re-download do certificado do IdP

### Erro: User Not Found

**Causa**: JIT provisioning desabilitado e usuário não existe

**Solução**:
1. Habilite JIT provisioning, ou
2. Crie o usuário manualmente antes

### Erro: Invalid Audience

**Causa**: Entity ID não confere

**Solução**:
1. Verifique se o Entity ID no IdP é exatamente:
   `https://app.trustlayer.com/auth/saml/metadata`

### Erro: Clock Skew

**Causa**: Diferença de horário entre IdP e SP

**Solução**:
1. Sincronize NTP em ambos os servidores
2. Aumente tolerância de clock skew (padrão: 5 min)

### Login Loop

**Causa**: Sessão não sendo criada

**Solução**:
1. Verifique cookies de terceiros
2. Verifique HTTPS em todos os endpoints
3. Verifique ACS URL

## Rotação de Certificado

Quando o certificado do IdP expira:

1. Obtenha novo certificado do IdP
2. Em TrustLayer, vá em **SSO Settings**
3. Em **Certificates**, clique **"Add Certificate"**
4. Cole o novo certificado
5. Teste a conexão
6. Após confirmar que funciona, remova o certificado antigo

## Referências

- [SAML 2.0 Specification](https://docs.oasis-open.org/security/saml/v2.0/)
- [Okta SAML Documentation](https://developer.okta.com/docs/concepts/saml/)
- [Azure AD SAML Documentation](https://docs.microsoft.com/en-us/azure/active-directory/manage-apps/configure-saml-single-sign-on)
- [User Management](./user-management.md)

# Security Configuration - TrustLayer Admin Guide

---
**Perfil**: Admin
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este guia cobre todas as configurações de segurança disponíveis para administradores do TrustLayer.

## Security Dashboard

Acesse em **Settings > Security** para ver:

```
┌─────────────────────────────────────────────────────────────┐
│ SECURITY DASHBOARD                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Security Score: 85/100                                      │
│ ████████████████████░░░░                                   │
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│ │ MFA Enabled │ │ SSO Config  │ │ Audit Logs  │           │
│ │    78%      │ │     ✅      │ │   Enabled   │           │
│ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│ Recommendations:                                            │
│ ⚠ Enable MFA for remaining 22% of users                    │
│ ⚠ Enable IP allowlist for admin access                     │
│ ✅ Audit logging is enabled                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Security

### Password Policy

Configure em **Security > Password Policy**:

```
┌─────────────────────────────────────────────────┐
│ PASSWORD POLICY                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ Minimum Length: [12] characters                 │
│                                                 │
│ Complexity Requirements:                        │
│ ☑ Uppercase letter (A-Z)                       │
│ ☑ Lowercase letter (a-z)                       │
│ ☑ Number (0-9)                                 │
│ ☑ Special character (!@#$%^&*)                 │
│                                                 │
│ Password Expiration:                            │
│ ○ Never                                         │
│ ○ 30 days                                       │
│ ● 90 days                                       │
│ ○ 180 days                                      │
│                                                 │
│ Password History: [5] passwords remembered      │
│                                                 │
│ [Save Policy]                                   │
└─────────────────────────────────────────────────┘
```

### MFA Configuration

Configure em **Security > Multi-Factor Authentication**:

```
┌─────────────────────────────────────────────────┐
│ MFA SETTINGS                                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ MFA Policy:                                     │
│ ○ Disabled                                      │
│ ○ Optional (user choice)                        │
│ ● Required for all users                        │
│ ○ Required for admins only                      │
│                                                 │
│ Allowed Methods:                                │
│ ☑ TOTP (Authenticator App)                     │
│ ☑ WebAuthn (Security Keys)                     │
│ ☐ SMS (not recommended)                        │
│ ☐ Email OTP                                    │
│                                                 │
│ Grace Period: [7] days for new users           │
│                                                 │
│ Recovery Codes: ☑ Allow generation             │
│                                                 │
│ [Save Settings]                                 │
└─────────────────────────────────────────────────┘
```

### Session Security

Configure em **Security > Sessions**:

```
┌─────────────────────────────────────────────────┐
│ SESSION SETTINGS                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ Session Timeout:                                │
│ Idle timeout: [30] minutes                      │
│ Maximum session: [8] hours                      │
│                                                 │
│ Concurrent Sessions:                            │
│ ○ Unlimited                                     │
│ ● Limited to [3] sessions per user             │
│                                                 │
│ On New Login:                                   │
│ ○ Allow multiple sessions                       │
│ ○ Warn about other sessions                     │
│ ● Terminate oldest session                      │
│                                                 │
│ Secure Cookies:                                 │
│ ☑ HttpOnly                                     │
│ ☑ Secure (HTTPS only)                          │
│ ☑ SameSite Strict                              │
│                                                 │
│ [Save Settings]                                 │
└─────────────────────────────────────────────────┘
```

## Access Control

### IP Allowlist

Restringir acesso por IP:

```
┌─────────────────────────────────────────────────┐
│ IP ALLOWLIST                                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ Status: ☑ Enabled                              │
│                                                 │
│ Scope:                                          │
│ ○ All users                                     │
│ ● Admins only                                   │
│ ○ Specific roles: [________]                   │
│                                                 │
│ Allowed IPs/Ranges:                             │
│ ┌───────────────────────────────────────┐      │
│ │ 192.168.1.0/24    │ Office Network    │ [x] │
│ │ 10.0.0.0/8        │ VPN              │ [x] │
│ │ 203.0.113.50      │ CEO Home         │ [x] │
│ └───────────────────────────────────────┘      │
│                                                 │
│ [+ Add IP/Range]                                │
│                                                 │
│ [Save Settings]                                 │
└─────────────────────────────────────────────────┘
```

### Rate Limiting

Configure em **Security > Rate Limiting**:

```
┌─────────────────────────────────────────────────┐
│ RATE LIMITING                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Login Attempts:                                 │
│ Max attempts: [5] per [15] minutes             │
│ Lockout duration: [30] minutes                  │
│                                                 │
│ API Rate Limit:                                 │
│ Max requests: [100] per [1] minute             │
│                                                 │
│ Password Reset:                                 │
│ Max requests: [3] per [60] minutes             │
│                                                 │
│ On Limit Exceeded:                              │
│ ☑ Log event                                    │
│ ☑ Send alert to admin                          │
│ ☑ Temporary block IP                           │
│                                                 │
│ [Save Settings]                                 │
└─────────────────────────────────────────────────┘
```

## Data Security

### Encryption

```
┌─────────────────────────────────────────────────┐
│ ENCRYPTION SETTINGS                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ Data at Rest:                                   │
│ Database: AES-256 ✅                            │
│ File Storage: AES-256 ✅                        │
│ Backups: AES-256 ✅                             │
│                                                 │
│ Data in Transit:                                │
│ TLS Version: 1.3 (minimum 1.2)                 │
│ Certificate: Valid until 2027-01-15            │
│ HSTS: Enabled (max-age=31536000)               │
│                                                 │
│ Key Management:                                 │
│ Provider: AWS KMS                               │
│ Key Rotation: Every 90 days                     │
│ Last Rotation: 2026-01-01                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Data Retention

Configure em **Security > Data Retention**:

```
┌─────────────────────────────────────────────────┐
│ DATA RETENTION POLICY                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Audit Logs: [7] years (compliance requirement) │
│ Assessment Data: [Forever / Custom]            │
│ Session Logs: [90] days                        │
│ Deleted User Data: [30] days before purge      │
│                                                 │
│ Automated Cleanup:                              │
│ ☑ Enable automatic data purging               │
│ Schedule: Daily at 02:00 UTC                   │
│                                                 │
│ [Save Policy]                                   │
└─────────────────────────────────────────────────┘
```

## Audit & Compliance

### Audit Logging

Configure em **Security > Audit**:

```
┌─────────────────────────────────────────────────┐
│ AUDIT LOGGING                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Status: ☑ Enabled (required)                   │
│                                                 │
│ Events Logged:                                  │
│ ☑ Authentication events                        │
│ ☑ Data access                                  │
│ ☑ Data modifications                           │
│ ☑ Admin actions                                │
│ ☑ API calls                                    │
│ ☑ Failed operations                            │
│                                                 │
│ Include in Logs:                                │
│ ☑ IP address                                   │
│ ☑ Geolocation                                  │
│ ☑ User agent                                   │
│ ☑ Before/after state                           │
│                                                 │
│ Export to SIEM:                                 │
│ ○ Disabled                                      │
│ ● Enabled: [Splunk endpoint]                   │
│                                                 │
│ [Save Settings]                                 │
└─────────────────────────────────────────────────┘
```

### Security Alerts

Configure em **Security > Alerts**:

```
┌─────────────────────────────────────────────────┐
│ SECURITY ALERTS                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ Alert Channels:                                 │
│ ☑ Email: security@company.com                  │
│ ☑ Slack: #security-alerts                      │
│ ☐ Webhook: [________________]                  │
│                                                 │
│ Alert Rules:                                    │
│ ┌───────────────────────────────────────┐      │
│ │ Multiple failed logins (5 in 10min)  │ ✅ │
│ │ Login from new country               │ ✅ │
│ │ Admin role assigned                  │ ✅ │
│ │ Bulk data export                     │ ✅ │
│ │ After-hours admin access             │ ✅ │
│ │ API key created                      │ ✅ │
│ └───────────────────────────────────────┘      │
│                                                 │
│ [+ Add Custom Rule]                             │
│                                                 │
│ [Save Alerts]                                   │
└─────────────────────────────────────────────────┘
```

## API Security

### API Keys

Gerencie em **Security > API Keys**:

```
┌─────────────────────────────────────────────────┐
│ API KEYS                                        │
├─────────────────────────────────────────────────┤
│                                                 │
│ Active Keys:                                    │
│ ┌───────────────────────────────────────────┐  │
│ │ Name        │ Created    │ Last Used │ Scope│
│ │ Production  │ 2026-01-01 │ Today     │ Full │
│ │ CI/CD       │ 2025-12-15 │ Today     │ Read │
│ │ Monitoring  │ 2025-11-20 │ Yesterday │ Read │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ [+ Create New Key]                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Create API Key

```
┌─────────────────────────────────────────────────┐
│ CREATE API KEY                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Name: [________________________]               │
│                                                 │
│ Scope:                                          │
│ ○ Full access                                   │
│ ● Read only                                     │
│ ○ Custom: [Select permissions]                 │
│                                                 │
│ Expiration:                                     │
│ ○ Never                                         │
│ ○ 30 days                                       │
│ ● 90 days                                       │
│ ○ 1 year                                        │
│                                                 │
│ IP Restriction (optional):                      │
│ [________________________]                     │
│                                                 │
│ [Create Key]                                    │
└─────────────────────────────────────────────────┘
```

## Security Checklist

### Pré-Produção

- [ ] MFA obrigatório para admins
- [ ] Password policy configurada
- [ ] Session timeout configurado
- [ ] Rate limiting habilitado
- [ ] Audit logging habilitado
- [ ] Alertas de segurança configurados

### Ongoing

- [ ] Revisar usuários inativos (mensal)
- [ ] Revisar API keys (mensal)
- [ ] Revisar audit logs (semanal)
- [ ] Testar backup/restore (trimestral)
- [ ] Revisar permissões (trimestral)
- [ ] Atualizar certificados (antes de expirar)

## Compliance

### Frameworks Suportados

| Framework | Status | Documentação |
|-----------|--------|--------------|
| SOC 2 Type II | ✅ Compliant | [SOC 2 Report] |
| ISO 27001 | ✅ Certified | [Certificate] |
| GDPR | ✅ Compliant | [DPA] |
| LGPD | ✅ Compliant | [LGPD Doc] |
| HIPAA | ✅ Available | [BAA Template] |

### Data Processing Agreement

Baixe DPA em **Settings > Legal > DPA**

### Sub-processors

Lista de sub-processors em **Settings > Legal > Sub-processors**

## Incident Response

### Em Caso de Incidente

1. **Containment**
   - Desativar usuário comprometido
   - Revogar sessões ativas
   - Bloquear IPs suspeitos

2. **Investigation**
   - Revisar audit logs
   - Identificar escopo do incidente
   - Preservar evidências

3. **Notification**
   - Notificar equipe de segurança
   - Notificar usuários afetados (se necessário)
   - Notificar autoridades (se necessário - LGPD: 72h)

4. **Recovery**
   - Resetar credenciais
   - Revisar permissões
   - Implementar correções

### Contatos de Emergência

```
Security Team: security@trustlayer.com
Emergency: +55 11 XXXX-XXXX
PGP Key: [Link to public key]
```

## Referências

- [User Management](./user-management.md)
- [SSO Integration](./sso-integration.md)
- [Audit Logs](../auditor/pt-BR/audit-logs.md)
- [Backup & Restore](./backup-restore.md)

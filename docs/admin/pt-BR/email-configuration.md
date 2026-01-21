---
profile: admin
language: pt-BR
version: 1.2.0
last_updated: 2026-01-20
---

# Configuracao de Email

## Visao Geral

Este guia descreve como configurar o envio de emails no TrustLayer, incluindo SMTP tradicional e provedores de email como servico (Resend, SendGrid, Mailgun).

## Publico-Alvo

- Administradores de sistema
- DevOps engineers
- Equipe de operacoes

---

## 1. Provedores Suportados

O TrustLayer suporta multiplos provedores de email com fallback automatico:

| Provider | Tipo | Recomendado Para |
|----------|------|------------------|
| **Resend** | API | Startups, volumes baixos |
| **SendGrid** | API | Enterprise, alto volume |
| **Mailgun** | API | Desenvolvedores, APIs |
| **SMTP** | Protocolo | On-premises, servidores proprios |

### 1.1 Ordem de Fallback

Se um provider falhar, o sistema tenta o proximo na ordem:
1. Provider configurado como principal
2. Resend (se configurado)
3. SendGrid (se configurado)
4. Mailgun (se configurado)
5. SMTP (se configurado)

---

## 2. Configuracao SMTP

### 2.1 Variaveis de Ambiente

```env
# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@trustlayer.io
SMTP_PASS=sua-senha-segura
SMTP_FROM=TrustLayer <noreply@trustlayer.io>
SMTP_SECURE=true  # true para TLS
```

### 2.2 Provedores SMTP Comuns

#### Gmail (nao recomendado para producao)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-app-password  # Use App Password, nao senha normal
SMTP_SECURE=true
```

#### Microsoft 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=noreply@suaempresa.com
SMTP_PASS=sua-senha
SMTP_SECURE=true
```

#### Amazon SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SMTP_SECURE=true
```

### 2.3 Testando Conexao SMTP

```bash
# Usando telnet
telnet smtp.example.com 587

# Usando openssl (com TLS)
openssl s_client -starttls smtp -connect smtp.example.com:587
```

---

## 3. Configuracao Resend

### 3.1 Criando Conta e API Key

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta
3. Va em **API Keys** > **Create API Key**
4. Copie a chave gerada

### 3.2 Configurando Dominio

1. Em **Domains** > **Add Domain**
2. Adicione seu dominio (ex: trustlayer.io)
3. Configure os registros DNS:
   - SPF
   - DKIM
   - DMARC (opcional)
4. Verifique o dominio

### 3.3 Variaveis de Ambiente

```env
RESEND_API_KEY=re_123456789...
EMAIL_FROM=TrustLayer <noreply@trustlayer.io>
```

### 3.4 Testando

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_123...' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@trustlayer.io",
    "to": ["test@example.com"],
    "subject": "Teste TrustLayer",
    "html": "<p>Email de teste</p>"
  }'
```

---

## 4. Configuracao SendGrid

### 4.1 Criando Conta e API Key

1. Acesse [sendgrid.com](https://sendgrid.com)
2. Crie uma conta
3. Va em **Settings** > **API Keys** > **Create API Key**
4. Selecione **Full Access** ou **Restricted Access** com permissoes de email
5. Copie a chave gerada

### 4.2 Configurando Sender Authentication

1. Va em **Settings** > **Sender Authentication**
2. Escolha **Domain Authentication** (recomendado)
3. Adicione seu dominio
4. Configure os registros DNS fornecidos
5. Verifique o dominio

### 4.3 Variaveis de Ambiente

```env
SENDGRID_API_KEY=SG.xxxxxxxxxx...
EMAIL_FROM=TrustLayer <noreply@trustlayer.io>
```

### 4.4 Testando

```bash
curl -X POST 'https://api.sendgrid.com/v3/mail/send' \
  -H 'Authorization: Bearer SG.xxx...' \
  -H 'Content-Type: application/json' \
  -d '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "noreply@trustlayer.io"},
    "subject": "Teste TrustLayer",
    "content": [{"type": "text/html", "value": "<p>Email de teste</p>"}]
  }'
```

---

## 5. Configuracao Mailgun

### 5.1 Criando Conta e API Key

1. Acesse [mailgun.com](https://www.mailgun.com)
2. Crie uma conta
3. Va em **API Security** > **API Keys**
4. Copie a **Private API Key**

### 5.2 Configurando Dominio

1. Va em **Sending** > **Domains** > **Add New Domain**
2. Adicione seu dominio
3. Configure os registros DNS fornecidos
4. Verifique o dominio

### 5.3 Variaveis de Ambiente

```env
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.trustlayer.io
EMAIL_FROM=TrustLayer <noreply@trustlayer.io>
```

### 5.4 Testando

```bash
curl -s --user 'api:key-xxx...' \
  https://api.mailgun.net/v3/mg.trustlayer.io/messages \
  -F from='noreply@trustlayer.io' \
  -F to='test@example.com' \
  -F subject='Teste TrustLayer' \
  -F html='<p>Email de teste</p>'
```

---

## 6. Configuracao DNS

### 6.1 Registros Necessarios

Para garantir entregabilidade, configure:

#### SPF
```dns
trustlayer.io.  IN TXT  "v=spf1 include:_spf.resend.com include:sendgrid.net ~all"
```

#### DKIM
Cada provider fornece seu proprio registro DKIM. Exemplo Resend:
```dns
resend._domainkey.trustlayer.io.  IN TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCS..."
```

#### DMARC
```dns
_dmarc.trustlayer.io.  IN TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@trustlayer.io"
```

### 6.2 Verificando Configuracao

```bash
# Verificar SPF
dig TXT trustlayer.io

# Verificar DKIM
dig TXT resend._domainkey.trustlayer.io

# Verificar DMARC
dig TXT _dmarc.trustlayer.io

# Ferramenta online
# https://mxtoolbox.com/SuperTool.aspx
```

---

## 7. Templates de Email

### 7.1 Templates Disponiveis

| Template ID | Descricao | Variaveis |
|-------------|-----------|-----------|
| `report-ready` | Notificacao de relatorio pronto | `reportName`, `generatedAt`, `downloadUrl` |
| `scheduled-report` | Relatorio agendado enviado | `reportName`, `scheduleName`, `period` |
| `anomaly-alert` | Alerta de anomalia detectada | `anomalyType`, `severity`, `details` |
| `welcome` | Boas-vindas ao usuario | `userName`, `loginUrl` |
| `password-reset` | Reset de senha | `resetUrl`, `expiresIn` |

### 7.2 Customizando Templates

Os templates estao em `/supabase/functions/email-service/templates/`.

Exemplo de template:
```html
<!-- templates/report-ready.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: #3B82F6; color: white; padding: 20px; }
    .content { padding: 20px; }
    .button {
      background: #3B82F6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>TrustLayer</h1>
  </div>
  <div class="content">
    <h2>Seu relatorio esta pronto!</h2>
    <p>O relatorio <strong>{{reportName}}</strong> foi gerado em {{generatedAt}}.</p>
    <p>
      <a href="{{downloadUrl}}" class="button">Baixar Relatorio</a>
    </p>
    <p>O link expira em 24 horas.</p>
  </div>
</body>
</html>
```

---

## 8. Monitoramento

### 8.1 Logs de Email

Os logs de envio sao armazenados em `email_logs` (se habilitado):

```sql
SELECT * FROM email_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### 8.2 Metricas a Monitorar

| Metrica | Descricao | Alerta Se |
|---------|-----------|-----------|
| Taxa de entrega | % emails entregues | < 95% |
| Taxa de bounce | % emails rejeitados | > 5% |
| Taxa de spam | % marcados como spam | > 1% |
| Tempo de envio | Latencia media | > 5s |

### 8.3 Dashboards dos Providers

Cada provider oferece dashboards:
- **Resend**: resend.com/dashboard
- **SendGrid**: app.sendgrid.com/statistics
- **Mailgun**: app.mailgun.com/analytics

---

## 9. Troubleshooting

### 9.1 Emails Nao Sao Enviados

**Verificar:**
1. Variaveis de ambiente configuradas corretamente
2. API key valida e com permissoes
3. Dominio verificado no provider
4. Logs de erro nas Edge Functions

```bash
# Ver logs da Edge Function
supabase functions logs email-service
```

### 9.2 Emails Caindo em Spam

**Verificar:**
1. SPF, DKIM e DMARC configurados
2. Dominio nao esta em blacklist
3. Conteudo do email nao tem triggers de spam
4. IP do provider nao esta em blacklist

**Testar:**
```bash
# Verificar blacklist
# https://mxtoolbox.com/blacklists.aspx

# Testar entregabilidade
# https://www.mail-tester.com/
```

### 9.3 Rate Limiting

Cada provider tem limites:

| Provider | Limite Free | Limite Pago |
|----------|-------------|-------------|
| Resend | 100/dia | Ilimitado |
| SendGrid | 100/dia | Por plano |
| Mailgun | 5000/mes | Por plano |

Se atingir o limite, configure fallback para outro provider.

### 9.4 Timeout de Conexao

```env
# Aumentar timeout (ms)
EMAIL_TIMEOUT_MS=30000
```

---

## 10. Seguranca

### 10.1 Protegendo API Keys

- Nunca commitar API keys no codigo
- Use variaveis de ambiente ou secret manager
- Rotacione keys periodicamente
- Use keys com permissoes minimas

### 10.2 Validando Destinatarios

O sistema valida emails antes de enviar:
- Formato valido
- Nao esta em blacklist interna
- Taxa de bounce nao e alta

### 10.3 Rate Limiting Interno

Configure limites para evitar abusos:
```env
EMAIL_RATE_LIMIT_PER_MINUTE=30
EMAIL_RATE_LIMIT_PER_HOUR=500
```

---

## 11. Configuracao Completa (Exemplo)

```env
# ===========================================
# Email Configuration - TrustLayer
# ===========================================

# Provider principal (resend, sendgrid, mailgun, smtp)
EMAIL_PROVIDER=resend

# From address (usado por todos os providers)
EMAIL_FROM=TrustLayer <noreply@trustlayer.io>
EMAIL_REPLY_TO=suporte@trustlayer.io

# Resend
RESEND_API_KEY=re_xxxxxxxxxx

# SendGrid (fallback)
SENDGRID_API_KEY=SG.xxxxxxxxxx

# Mailgun (fallback)
# MAILGUN_API_KEY=key-xxxxxxxxxx
# MAILGUN_DOMAIN=mg.trustlayer.io

# SMTP (fallback)
# SMTP_HOST=smtp.office365.com
# SMTP_PORT=587
# SMTP_USER=noreply@trustlayer.io
# SMTP_PASS=xxxxxxxxxx
# SMTP_SECURE=true

# Rate Limiting
EMAIL_RATE_LIMIT_PER_MINUTE=30
EMAIL_RATE_LIMIT_PER_HOUR=500

# Timeout
EMAIL_TIMEOUT_MS=30000

# Tracking (se suportado pelo provider)
EMAIL_TRACK_OPENS=true
EMAIL_TRACK_CLICKS=true
```

---

## Referencias

- [Variaveis de Ambiente](environment-variables.md)
- [Troubleshooting](troubleshooting.md)
- [Resend Docs](https://resend.com/docs)
- [SendGrid Docs](https://docs.sendgrid.com/)
- [Mailgun Docs](https://documentation.mailgun.com/)

---

*Ultima atualizacao: 20 de Janeiro de 2026*

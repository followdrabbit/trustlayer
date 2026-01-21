# Configurações - TrustLayer

---
**Perfil**: User
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Esta página explica como configurar e personalizar sua experiência no TrustLayer.

## Acessando Configurações

1. Clique no seu avatar no canto superior direito
2. Selecione **"Settings"** no menu dropdown
3. Ou acesse diretamente: `/settings`

## Meu Perfil {#perfil}

### Informações Pessoais

Atualize suas informações básicas:

| Campo | Descrição | Editável |
|-------|-----------|----------|
| Nome | Seu nome completo | ✅ Sim |
| Email | Email de login | ❌ Não (contate admin) |
| Departamento | Seu departamento | ✅ Sim |
| Telefone | Número de contato | ✅ Sim |
| Cargo | Sua posição | ✅ Sim |

### Avatar

Personalize sua foto de perfil:

1. Clique no avatar atual
2. Selecione **"Upload Photo"**
3. Escolha uma imagem (máx. 5MB)
4. Ajuste o recorte se necessário
5. Clique **"Save"**

**Formatos suportados:** JPG, PNG, GIF
**Tamanho recomendado:** 256x256 pixels

Para remover o avatar:
- Clique no avatar > **"Remove Photo"**
- Será exibido o avatar padrão (suas iniciais)

### Idioma

Altere o idioma da interface:

1. Vá em **Settings > Preferences**
2. Selecione **Language**:
   - Português (Brasil)
   - English (US)
   - Español (ES)
3. A página recarregará no novo idioma

## Preferências de Tema {#tema}

### Tema da Interface

Escolha entre diferentes temas visuais:

1. Vá em **Settings > Appearance**
2. Selecione um tema:

| Tema | Descrição |
|------|-----------|
| Light | Fundo claro, ideal para ambientes bem iluminados |
| Dark | Fundo escuro, reduz fadiga visual |
| System | Segue as configurações do seu sistema operacional |
| High Contrast | Alto contraste para acessibilidade |

### Cores de Destaque

Personalize as cores da interface:

1. Em **Appearance**, clique em **"Customize Colors"**
2. Escolha a cor primária
3. Veja o preview em tempo real
4. Clique **"Apply"**

### Densidade da Interface

Ajuste o espaçamento dos elementos:

- **Comfortable** (Padrão) - Mais espaço entre elementos
- **Compact** - Interface mais densa, mais informação visível

## Notificações {#notificacoes}

### Notificações por Email

Configure quais emails você deseja receber:

| Notificação | Descrição | Padrão |
|-------------|-----------|--------|
| Assessment Assigned | Quando um assessment é atribuído a você | ✅ On |
| Assessment Due | Lembrete de prazo próximo | ✅ On |
| Assessment Completed | Quando alguém completa um assessment | ☐ Off |
| Report Ready | Quando um relatório agendado está pronto | ✅ On |
| Weekly Summary | Resumo semanal de atividades | ☐ Off |
| Security Alerts | Alertas de segurança da conta | ✅ On (obrigatório) |

### Notificações In-App

Configure notificações dentro da aplicação:

| Notificação | Descrição | Padrão |
|-------------|-----------|--------|
| Desktop Notifications | Notificações do browser | ☐ Off |
| Sound | Som para notificações | ☐ Off |
| Badge Count | Contador no ícone | ✅ On |

### Frequência de Emails

Configure a frequência de resumos:

- **Instant** - Receber imediatamente
- **Daily Digest** - Um email por dia com todas as notificações
- **Weekly Digest** - Um email por semana

## Segurança {#seguranca}

### Alterar Senha

1. Vá em **Settings > Security**
2. Clique em **"Change Password"**
3. Digite a senha atual
4. Digite a nova senha (mín. 12 caracteres)
5. Confirme a nova senha
6. Clique **"Update Password"**

**Requisitos de senha:**
- Mínimo 12 caracteres
- Pelo menos uma letra maiúscula
- Pelo menos uma letra minúscula
- Pelo menos um número
- Pelo menos um caractere especial (!@#$%^&*)

### Multi-Factor Authentication (MFA)

Adicione uma camada extra de segurança à sua conta.

#### Habilitar MFA (TOTP)

1. Vá em **Settings > Security > MFA**
2. Clique em **"Enable MFA"**
3. Escaneie o QR code com seu app autenticador:
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
   - 1Password
4. Digite o código de 6 dígitos para confirmar
5. Salve os códigos de recuperação em local seguro

#### Códigos de Recuperação

Após habilitar MFA, você receberá códigos de recuperação:

- **Guarde esses códigos em local seguro**
- Cada código pode ser usado apenas uma vez
- Use se perder acesso ao autenticador
- Você pode gerar novos códigos (invalida os anteriores)

#### Desabilitar MFA

1. Vá em **Settings > Security > MFA**
2. Clique em **"Disable MFA"**
3. Digite um código TOTP válido para confirmar
4. MFA será desabilitado

**Nota:** Sua organização pode exigir MFA. Nesse caso, você não poderá desabilitar.

### Chaves de Segurança (WebAuthn)

Use uma chave física como segundo fator:

1. Vá em **Settings > Security > Security Keys**
2. Clique em **"Add Security Key"**
3. Insira a chave USB (ex: YubiKey)
4. Toque na chave quando solicitado
5. Dê um nome à chave (ex: "YubiKey Work")

**Chaves suportadas:**
- YubiKey 5 Series
- Google Titan
- Feitian
- Outras chaves FIDO2/WebAuthn

### Sessões Ativas

Veja e gerencie suas sessões ativas:

1. Vá em **Settings > Security > Sessions**
2. Veja lista de sessões:
   - Dispositivo e navegador
   - Localização (cidade/país)
   - Último acesso
3. Para encerrar uma sessão, clique **"Revoke"**
4. Para encerrar todas exceto a atual, clique **"Revoke All Other Sessions"**

### Histórico de Login

Veja seu histórico de acessos:

1. Vá em **Settings > Security > Login History**
2. Visualize:
   - Data e hora
   - Localização
   - Dispositivo
   - Status (sucesso/falha)

Se notar atividade suspeita, contate imediatamente o administrador.

## Acessibilidade

### Tamanho de Fonte

Ajuste o tamanho do texto:

1. Vá em **Settings > Accessibility**
2. Ajuste **Font Size**:
   - Small (14px)
   - Medium (16px) - Padrão
   - Large (18px)
   - Extra Large (20px)

### Reduzir Animações

Se preferir menos movimento na interface:

1. Vá em **Settings > Accessibility**
2. Ative **"Reduce Motion"**
3. Animações serão minimizadas

### Leitor de Tela

O TrustLayer é compatível com leitores de tela:
- NVDA (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

Todas as imagens têm texto alternativo e a navegação por teclado é suportada.

## Integrações

### Calendário

Sincronize prazos de assessments com seu calendário:

1. Vá em **Settings > Integrations > Calendar**
2. Clique em **"Connect"**
3. Escolha o provedor:
   - Google Calendar
   - Microsoft Outlook
   - Apple Calendar (via ICS)
4. Autorize o acesso
5. Prazos aparecerão automaticamente no calendário

### Exportar Dados

Exporte seus dados pessoais:

1. Vá em **Settings > Data > Export**
2. Selecione o que exportar:
   - Perfil
   - Histórico de atividades
   - Assessments (se permitido pelo admin)
3. Clique **"Request Export"**
4. Você receberá um email com o link para download

## Deletar Conta

Se desejar deletar sua conta:

1. Vá em **Settings > Account > Delete Account**
2. Leia as consequências (dados serão anonimizados)
3. Digite sua senha para confirmar
4. Clique **"Delete My Account"**

**Nota:** Esta ação é irreversível. Contate o administrador se precisar de assistência.

## Troubleshooting

### Configurações não salvam

1. Verifique sua conexão de internet
2. Limpe o cache do navegador
3. Tente em modo incógnito
4. Contate o suporte se persistir

### MFA não funciona

1. Verifique se o horário do celular está correto
2. Sincronize o app autenticador
3. Use um código de recuperação se necessário
4. Contate o admin para reset

### Tema não aplica

1. Limpe o cache do navegador
2. Recarregue a página (Ctrl/Cmd + Shift + R)
3. Verifique se não há extensões conflitantes

## Referências

- [Getting Started](./getting-started.md)
- [FAQ](./faq.md)
- [Support](./support.md)

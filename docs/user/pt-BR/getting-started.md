---
profile: user
language: pt-BR
version: 1.2.0
last_updated: 2026-01-20
---

# Primeiros Passos com TrustLayer

## Visao Geral

Este guia vai ajuda-lo a comecar a usar o TrustLayer em poucos minutos. Voce aprendera a fazer login, navegar pela interface e realizar sua primeira avaliacao de seguranca.

## Publico-Alvo

- Usuarios novos no TrustLayer
- Profissionais de seguranca iniciando avaliacoes
- Gestores configurando suas equipes

## Pre-requisitos

- Conta de usuario criada pelo administrador
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Conexao com a internet

---

## 1. Primeiro Acesso

### 1.1 Recebendo suas Credenciais

Voce recebera um email do administrador com:
- URL de acesso ao TrustLayer
- Seu email de usuario
- Senha temporaria (ou link para criar senha)

### 1.2 Fazendo Login

1. Acesse a URL do TrustLayer
2. Digite seu email e senha
3. Clique em **Entrar**

Se sua organizacao usa SSO (Single Sign-On):
1. Clique em **Entrar com SSO**
2. Selecione seu provedor (Azure AD, Okta, Google, etc.)
3. Complete a autenticacao no provedor

### 1.3 Configurando MFA (Autenticacao Multi-Fator)

Se habilitado pelo administrador:

1. Apos o primeiro login, sera solicitada configuracao de MFA
2. Baixe um app autenticador (Google Authenticator, Authy, etc.)
3. Escaneie o QR code apresentado
4. Digite o codigo de 6 digitos para confirmar

---

## 2. Conhecendo a Interface

### 2.1 Barra Lateral (Sidebar)

A barra lateral a esquerda contem os principais menus:

| Menu | Descricao |
|------|-----------|
| **Dashboard** | Visao geral da postura de seguranca |
| **Assessments** | Questionarios de avaliacao |
| **Reports** | Geracao e agendamento de relatorios |
| **Settings** | Configuracoes pessoais |

### 2.2 Cabecalho (Header)

No cabecalho voce encontra:

- **Seletor de Idioma**: Mude entre PT-BR, EN-US e ES-ES
- **Tema**: Alterne entre modo claro e escuro
- **Perfil**: Acesse configuracoes de conta

### 2.3 AI Assistant

O assistente de IA aparece como um botao flutuante no canto inferior direito:

- Clique para abrir o chat
- Arraste para reposicionar
- Faca perguntas sobre seguranca e o sistema
- Use comandos de voz (se habilitado)

---

## 3. Realizando sua Primeira Avaliacao

### 3.1 Escolhendo o Dominio de Seguranca

1. Acesse **Assessments**
2. Selecione o dominio que deseja avaliar:
   - **AI Security**: Seguranca em sistemas de IA
   - **Cloud Security**: Seguranca em nuvem
   - **DevSecOps**: Seguranca no desenvolvimento

### 3.2 Selecionando Frameworks

Apos escolher o dominio, selecione os frameworks para avaliacao:

| Dominio | Frameworks Disponiveis |
|---------|------------------------|
| AI Security | NIST AI RMF, ISO 42001, EU AI Act |
| Cloud Security | CSA CCM v4, CIS Controls, SOC 2 |
| DevSecOps | NIST SSDF, OWASP SAMM, SLSA |

Voce pode selecionar multiplos frameworks para uma avaliacao abrangente.

### 3.3 Respondendo o Questionario

Para cada pergunta:

1. Leia a pergunta com atencao
2. Selecione a resposta apropriada:
   - **Sim**: Controle implementado
   - **Parcial**: Controle parcialmente implementado
   - **Nao**: Controle nao implementado
   - **N/A**: Nao aplicavel ao seu contexto

3. (Opcional) Adicione evidencias:
   - Clique em **Adicionar Evidencia**
   - Selecione o tipo (documento, link, texto)
   - Anexe ou descreva a evidencia

4. (Opcional) Adicione observacoes no campo de comentarios

### 3.4 Salvando o Progresso

- Suas respostas sao salvas automaticamente
- Voce pode sair e continuar depois
- O progresso e exibido na barra superior

---

## 4. Visualizando Resultados

### 4.1 Dashboard Principal

Apos responder algumas perguntas, acesse o **Dashboard** para ver:

- **Score de Maturidade**: Pontuacao geral (0-100%)
- **Nivel de Maturidade**: Inicial, Basico, Intermediario, Avancado ou Otimizado
- **Cobertura por Framework**: Percentual respondido de cada framework
- **Gaps Criticos**: Areas que precisam de atencao imediata

### 4.2 Tipos de Dashboard

Selecione a visao mais adequada ao seu papel:

| Dashboard | Ideal Para | Foco |
|-----------|------------|------|
| **Executive** | C-Level, Diretores | KPIs, tendencias, roadmap |
| **GRC** | Compliance, Risk | Frameworks, evidencias, auditoria |
| **Specialist** | Tecnicos | Gaps detalhados, remediacoes |

### 4.3 Graficos e Visualizacoes

Os dashboards incluem:

- **Grafico de Radar**: Maturidade por dominio
- **Grafico de Barras**: Score por categoria
- **Timeline**: Evolucao historica
- **Heatmap**: Cobertura por framework

---

## 5. Dicas para Iniciantes

### 5.1 Comece Pequeno

- Avalie um dominio por vez
- Foque em 1-2 frameworks inicialmente
- Expanda conforme ganhar familiaridade

### 5.2 Seja Honesto

- Respostas honestas geram insights uteis
- Marque "Nao" se o controle nao existe
- "Parcial" e valido para implementacoes incompletas

### 5.3 Documente Evidencias

- Evidencias fortalecem a avaliacao
- Facilitam auditorias futuras
- Demonstram conformidade a terceiros

### 5.4 Use o AI Assistant

- Pergunte sobre controles que nao entende
- Peca sugestoes de remediacoes
- Solicite explicacoes sobre frameworks

---

## 6. Atalhos de Teclado

| Atalho | Acao |
|--------|------|
| `Ctrl + K` | Busca rapida |
| `Ctrl + Shift + A` | Abrir AI Assistant |
| `Ctrl + S` | Salvar (formularios) |
| `Esc` | Fechar modal/painel |

---

## 7. Proximos Passos

Apos completar este guia, recomendamos:

1. [Guia de Assessments](assessments.md) - Detalhes sobre avaliacoes
2. [Guia de Dashboards](dashboards.md) - Explorando visualizacoes
3. [Guia de Reports](reports.md) - Gerando relatorios
4. [FAQ](faq.md) - Perguntas frequentes

---

## Suporte

Precisa de ajuda?

- **AI Assistant**: Clique no botao flutuante
- **Email**: Contate seu administrador
- **Documentacao**: Explore os guias disponiveis

---

*Ultima atualizacao: 20 de Janeiro de 2026*

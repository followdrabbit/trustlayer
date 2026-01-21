# Guia do Usuário - TrustLayer

---
**Perfil**: User
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Bem-vindo ao TrustLayer! 👋

TrustLayer é sua plataforma completa para gerenciamento de **Governança, Risco e Compliance (GRC)** em Segurança da Informação e IA.

## O que você pode fazer no TrustLayer?

✅ **Criar e responder assessments** de segurança
✅ **Visualizar dashboards** com scores e métricas
✅ **Gerar relatórios** executivos e técnicos
✅ **Analisar gaps** de conformidade
✅ **Acompanhar progresso** de múltiplos frameworks
✅ **Colaborar** com sua equipe

## Índice

### 1. Primeiros Passos
- [Como Fazer Login](./getting-started.md#login)
- [Navegação Básica](./getting-started.md#navegacao)
- [Configurar Seu Perfil](./settings.md#perfil)
- [Entendendo Seu Role](./getting-started.md#roles)

### 2. Assessments
- [O que são Assessments?](./assessments.md#conceito)
- [Criar um Assessment](./assessments.md#criar)
- [Responder Perguntas](./assessments.md#responder)
- [Adicionar Evidências](./assessments.md#evidencias)
- [Submeter Assessment](./assessments.md#submeter)
- [Visualizar Resultados](./assessments.md#resultados)

### 3. Dashboards
- [Dashboard Executivo](./dashboards.md#executivo)
- [Dashboard GRC](./dashboards.md#grc)
- [Dashboard de Especialista](./dashboards.md#especialista)
- [Filtros e Customização](./dashboards.md#filtros)

### 4. Relatórios
- [Gerar Relatório On-Demand](./reports.md#on-demand)
- [Agendar Relatórios](./reports.md#agendados)
- [Exportar em Diferentes Formatos](./reports.md#formatos)
- [Enviar Relatórios por Email](./reports.md#email)

### 5. Configurações
- [Meu Perfil](./settings.md#perfil)
- [Preferências de Tema](./settings.md#tema)
- [Notificações](./settings.md#notificacoes)
- [Segurança (MFA)](./settings.md#seguranca)

### 6. FAQ & Suporte
- [Perguntas Frequentes](./faq.md)
- [Glossário de Termos](./glossary.md)
- [Como Obter Ajuda](./support.md)

## Quick Start: Seu Primeiro Assessment

### Passo 1: Login

1. Acesse https://trustlayer.com
2. Digite seu email e senha
3. (Se MFA habilitado) Digite o código do autenticador
4. Você será redirecionado para o Dashboard

### Passo 2: Criar Assessment

1. No menu lateral, clique em **"Assessments"**
2. Clique no botão **"+ New Assessment"**
3. Selecione o **Framework** (ex: NIST-CSF, ISO-27001)
4. Selecione o **Domain** (ex: AI Governance, Cloud Security)
5. Clique em **"Start Assessment"**

### Passo 3: Responder Perguntas

1. Você verá a lista de perguntas do framework
2. Para cada pergunta:
   - Leia a descrição
   - Selecione: **Yes**, **No**, **Partial** ou **N/A**
   - Adicione evidências (opcional mas recomendado)
   - Clique em **"Next"**
3. Seu progresso é salvo automaticamente

### Passo 4: Visualizar Score

1. Após responder todas as perguntas
2. Clique em **"Submit Assessment"**
3. Seu score será calculado automaticamente
4. Visualize:
   - **Overall Score** (0-100)
   - **Score por Categoria**
   - **Gaps Críticos**

### Passo 5: Gerar Relatório

1. Clique em **"Export Report"**
2. Selecione o formato: **PDF**, **Excel** ou **HTML**
3. O relatório será baixado automaticamente
4. Ou envie por email para stakeholders

## Conceitos Principais

### O que é um Assessment?

Um **Assessment** é uma avaliação da sua organização contra um framework de segurança/compliance (ex: NIST-CSF, ISO-27001, SOC2).

**Exemplo prático:**
- Você quer saber se sua empresa está em compliance com NIST-CSF
- Cria um Assessment baseado em NIST-CSF
- Responde perguntas sobre controles de segurança
- TrustLayer calcula um score e mostra gaps

### O que é um Framework?

Um **Framework** é um conjunto de práticas recomendadas de segurança (ex: NIST-CSF, ISO-27001, SOC2, CIS Controls).

**TrustLayer suporta:**
- NIST Cybersecurity Framework (CSF)
- ISO 27001
- SOC 2
- CIS Controls
- OWASP Top 10
- PCI-DSS
- E muitos outros...

### O que é um Domain?

Um **Domain** é uma área específica de governança (ex: AI Governance, Cloud Security, DevSecOps).

**Exemplos:**
- **AI Governance**: Governança de IA e modelos de ML
- **Cloud Security**: Segurança em ambientes cloud (AWS, Azure, GCP)
- **DevSecOps**: Segurança no ciclo de desenvolvimento

### O que é um Gap?

Um **Gap** é uma deficiência identificada - algo que sua organização ainda não implementou ou não está em conformidade.

**Exemplo:**
- Pergunta: "Você tem política de MFA implementada?"
- Resposta: "No"
- **Gap identificado**: "Falta política de MFA"
- **Severidade**: Critical
- **Recomendação**: "Implementar MFA para todos os usuários"

## Entendendo Seu Role

TrustLayer tem diferentes níveis de acesso:

| Role | O que você pode fazer |
|------|----------------------|
| **Admin** | Tudo - gerenciar usuários, organizações, configurações globais |
| **Manager** | Criar/editar assessments, visualizar dashboards, gerar relatórios |
| **Analyst** | Responder assessments, visualizar dashboards |
| **Auditor** | Visualizar audit logs, timeline, investigação forense (read-only) |
| **Viewer** | Apenas visualizar dashboards e relatórios (read-only) |
| **User** | Visualizar assessments atribuídos |

**Como saber meu role?**
1. Clique em seu avatar no canto superior direito
2. Seu role aparece abaixo do nome

## Interface Principal

### Sidebar (Menu Lateral)

```
┌─────────────────┐
│ 🏠 Dashboard    │
│ 📋 Assessments  │
│ 📊 Dashboards   │
│ 📄 Reports      │
│ ⚙️  Settings    │
└─────────────────┘
```

### Header (Cabeçalho)

```
┌──────────────────────────────────────────┐
│ TrustLayer Logo  |  Org Selector  | 👤   │
└──────────────────────────────────────────┘
```

- **Logo**: Clique para voltar ao Dashboard
- **Organization Selector**: Mude entre organizações (se multi-org)
- **Avatar**: Acesse Settings, Profile, Logout

## Dicas e Melhores Práticas

### ✅ Respondendo Assessments

1. **Seja honesto**: Respostas honestas geram insights reais
2. **Adicione evidências**: Screenshots, documentos, links
3. **Use "Partial"**: Se controle está parcialmente implementado
4. **Use "N/A"**: Se controle não é aplicável ao seu contexto
5. **Salve progresso**: Sistema salva automaticamente, mas você pode salvar manualmente

### ✅ Analisando Gaps

1. **Priorize por severidade**: Comece com **Critical** e **High**
2. **Agrupe por categoria**: Facilita criar plano de ação
3. **Use filtros**: Filtre por domain, framework, severidade
4. **Export para Excel**: Compartilhe com equipe para remediation

### ✅ Gerando Relatórios

1. **Escolha o formato certo**:
   - **PDF**: Para apresentações executivas
   - **Excel**: Para análise detalhada e planejamento
   - **HTML**: Para compartilhar online
2. **Agende relatórios**: Configure envio automático mensal/trimestral
3. **Customize recipients**: Envie para stakeholders relevantes

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl + K` | Busca global |
| `Ctrl + B` | Toggle sidebar |
| `Ctrl + ,` | Abrir Settings |
| `Esc` | Fechar modal |
| `?` | Mostrar todos os atalhos |

## Recursos Visuais

### Indicadores de Status

- 🟢 **Compliant**: Em conformidade
- 🟡 **Partially Compliant**: Parcialmente conforme
- 🔴 **Non-Compliant**: Não conforme
- ⚪ **Not Assessed**: Ainda não avaliado

### Scores e Cores

| Score | Cor | Significado |
|-------|-----|-------------|
| 90-100 | 🟢 Verde | Excelente |
| 70-89 | 🔵 Azul | Bom |
| 50-69 | 🟡 Amarelo | Aceitável |
| 30-49 | 🟠 Laranja | Precisa melhoria |
| 0-29 | 🔴 Vermelho | Crítico |

## Suporte e Ajuda

### 🤖 AI Assistant

TrustLayer tem um **AI Assistant** que pode ajudar!

**Como usar:**
1. Clique no ícone 💬 no canto inferior direito
2. Digite sua pergunta (ex: "Como criar um assessment?")
3. AI responderá com instruções passo-a-passo

**O que AI pode fazer:**
- Responder perguntas sobre features
- Guiar você por workflows
- Explicar termos técnicos
- Sugerir melhores práticas

### 📧 Contato Humano

- **Email**: support@trustlayer.com
- **Chat**: Segunda a Sexta, 9h-18h BRT
- **Documentação**: https://docs.trustlayer.com
- **Status**: https://status.trustlayer.com

## Próximos Passos

1. ✅ Faça login e explore o Dashboard
2. ✅ Configure seu perfil e preferências
3. ✅ Crie seu primeiro Assessment
4. ✅ Visualize seus resultados
5. ✅ Gere seu primeiro relatório

**Pronto para começar?** 🚀

[➡️ Comece com Getting Started](./getting-started.md)

## Atualizações e Novidades

### 🆕 Phase 2 (Q1-Q3 2026)

Novidades que estão chegando:

- **Temas Customizáveis**: Escolha entre 5+ temas visuais
- **Avatares de Usuário**: Personalize seu perfil com foto
- **Dashboards Customizáveis**: Crie seus próprios dashboards
- **Relatórios Avançados**: Templates customizáveis e agendamento
- **Animações**: Transições suaves e interface mais fluida
- **AI Assistant Draggable**: Posicione o assistant onde preferir

Fique ligado! 👀

## Glossário Rápido

- **Assessment**: Avaliação contra um framework
- **Framework**: Conjunto de práticas de segurança (NIST, ISO, etc.)
- **Domain**: Área específica (AI, Cloud, DevSecOps)
- **Gap**: Deficiência identificada
- **Score**: Pontuação de conformidade (0-100)
- **Evidence**: Documentação que comprova controle
- **RLS**: Row Level Security (você só vê dados da sua org)
- **MFA**: Multi-Factor Authentication (autenticação em 2 fatores)

---

**Precisa de ajuda?** Clique no ícone 💬 ou [acesse nosso FAQ](./faq.md)

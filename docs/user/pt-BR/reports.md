---
profile: user
language: pt-BR
version: 1.2.0
last_updated: 2026-01-20
---

# Guia de Reports (Relatorios)

## Visao Geral

O sistema de relatorios do TrustLayer permite gerar, agendar e distribuir relatorios de compliance e seguranca. Voce pode criar relatorios sob demanda ou configura-los para envio automatico por email.

## Publico-Alvo

- Gestores que precisam compartilhar status
- Profissionais de GRC preparando auditorias
- Analistas documentando avaliacoes

---

## 1. Acessando a Pagina de Reports

1. Clique em **Reports** na barra lateral
2. Voce vera quatro abas principais:
   - **Generate**: Gerar relatorios sob demanda
   - **Schedules**: Gerenciar agendamentos
   - **History**: Historico de relatorios gerados
   - **Templates**: Biblioteca de templates

---

## 2. Gerando Relatorios Sob Demanda

### 2.1 Quick Reports (Relatorios Rapidos)

Na aba **Generate**, voce encontra relatorios pre-configurados:

| Relatorio | Descricao | Ideal Para |
|-----------|-----------|------------|
| **Executive Summary** | Visao geral de alto nivel | Reunioes executivas |
| **Compliance Status** | Status por framework | Auditorias |
| **Gap Analysis** | Analise detalhada de gaps | Planejamento |

**Para gerar um Quick Report:**
1. Clique no botao do relatorio desejado
2. O relatorio sera gerado automaticamente
3. O download iniciara em alguns segundos

### 2.2 Custom Report (Relatorio Personalizado)

Para criar um relatorio com filtros especificos:

1. Na aba **Generate**, veja a secao **Custom Report**
2. Selecione o **Template**:
   - Executive Summary
   - Compliance Status
   - Gap Analysis
   - Custom

3. Escolha o **Formato**:
   - PDF (documento formatado)
   - Excel (planilha com dados)
   - CSV (dados brutos)

4. Defina o **Periodo**:
   - Last 7 days
   - Last 30 days
   - Last 90 days
   - Custom (datas personalizadas)

5. Clique em **Generate Report**

---

## 3. Formatos de Relatorio

### 3.1 PDF

**Caracteristicas:**
- Documento formatado e profissional
- Inclui graficos e visualizacoes
- Ideal para compartilhar externamente
- Pronto para impressao

**Conteudo tipico:**
- Capa com titulo e data
- Sumario executivo
- Graficos de maturidade
- Tabelas de controles
- Lista de gaps priorizados
- Recomendacoes

### 3.2 Excel

**Caracteristicas:**
- Dados em formato de planilha
- Multiplas abas organizadas
- Permite analises adicionais
- Editavel

**Abas tipicas:**
- Summary (resumo geral)
- Controls (todos os controles)
- Gaps (lista de gaps)
- Evidence (evidencias anexadas)
- Metadata (informacoes do relatorio)

### 3.3 CSV

**Caracteristicas:**
- Dados brutos em formato texto
- Importavel em qualquer ferramenta
- Ideal para integracao com sistemas
- Menor tamanho de arquivo

---

## 4. Templates de Relatorio

### 4.1 Executive Summary

**Finalidade:** Visao estrategica para lideranca

**Secoes incluidas:**
- Overview com KPIs principais
- Score de maturidade e tendencia
- Top 5 gaps criticos
- Roadmap recomendado
- Comparativo com periodo anterior

**Tamanho tipico:** 3-5 paginas

### 4.2 Compliance Status

**Finalidade:** Status detalhado de compliance por framework

**Secoes incluidas:**
- Grid de frameworks avaliados
- Heatmap de controles
- Status de evidencias
- Lista de controles por status
- Recomendacoes para compliance

**Tamanho tipico:** 10-20 paginas

### 4.3 Gap Analysis

**Finalidade:** Analise detalhada de gaps para remediacao

**Secoes incluidas:**
- Lista completa de gaps
- Priorizacao por criticidade
- Nivel atual vs. desejado
- Plano de remediacao sugerido
- Recursos necessarios

**Tamanho tipico:** 15-30 paginas

### 4.4 Audit Report

**Finalidade:** Documentacao para auditorias externas

**Secoes incluidas:**
- Escopo da auditoria
- Metodologia utilizada
- Controles avaliados com evidencias
- Achados e observacoes
- Plano de acao corretiva

**Tamanho tipico:** 20-50 paginas

---

## 5. Agendamento de Relatorios

### 5.1 Criando um Agendamento

1. Acesse a aba **Schedules**
2. Clique em **New Schedule**
3. Configure:

   **Nome:** Identifique o agendamento

   **Template:** Selecione o modelo de relatorio

   **Frequencia:**
   - Diario (Daily)
   - Semanal (Weekly)
   - Mensal (Monthly)
   - Trimestral (Quarterly)

   **Horario:** Quando o relatorio deve ser gerado

   **Formato:** PDF, Excel ou ambos

   **Destinatarios:** Emails para envio automatico

4. Clique em **Save Schedule**

### 5.2 Exemplo de Configuracao

```
Nome: Weekly Executive Report
Template: Executive Summary
Frequencia: Weekly (Segunda-feira)
Horario: 09:00 AM
Formato: PDF
Destinatarios: ciso@empresa.com, vp-security@empresa.com
```

### 5.3 Gerenciando Agendamentos

Na lista de agendamentos voce pode:

| Acao | Descricao |
|------|-----------|
| **Edit** | Modificar configuracoes |
| **Pause** | Pausar temporariamente |
| **Enable** | Reativar agendamento pausado |
| **Delete** | Remover agendamento |

### 5.4 Proxima Execucao

Cada agendamento mostra:
- Data/hora da proxima execucao
- Quantidade de destinatarios
- Status (ativo/pausado)
- Ultima execucao bem-sucedida

---

## 6. Historico de Relatorios

### 6.1 Visualizando Historico

Na aba **History** voce ve todos os relatorios gerados:

| Coluna | Descricao |
|--------|-----------|
| **Report** | Nome/tipo do relatorio |
| **Generated** | Data/hora de geracao |
| **Format** | PDF, Excel ou CSV |
| **Status** | Completed, Failed, Pending |
| **Actions** | Download, Delete |

### 6.2 Filtros de Historico

Filtre o historico por:
- **Template**: Tipo de relatorio
- **Periodo**: Intervalo de datas
- **Status**: Apenas completados, falhas, etc.

### 6.3 Baixando Relatorios Anteriores

1. Encontre o relatorio no historico
2. Clique no icone de **Download**
3. O arquivo sera baixado

**Nota:** Relatorios sao mantidos por 90 dias por padrao.

---

## 7. Personalizando Templates

### 7.1 Visualizando Templates

Na aba **Templates** voce ve:
- Templates do sistema (System)
- Templates customizados (Custom)

### 7.2 Criando Template Customizado

1. Clique em **Create Template**
2. Selecione um template base
3. Configure as secoes:
   - Adicione/remova secoes
   - Reordene conforme necessario
   - Configure filtros padrao
4. De um nome ao template
5. Salve o template

### 7.3 Secoes Disponiveis

| Secao | Descricao |
|-------|-----------|
| **KPI Cards** | Metricas principais |
| **Score Trend** | Grafico de evolucao |
| **Domain Comparison** | Comparativo entre dominios |
| **Framework Coverage** | Cobertura por framework |
| **Gap Table** | Tabela de gaps |
| **Evidence Status** | Status de evidencias |
| **Control Heatmap** | Mapa de calor |
| **Roadmap** | Plano de acao |

---

## 8. Distribuicao por Email

### 8.1 Configuracao de Email

Quando um relatorio agendado e gerado:
1. O relatorio e anexado ao email
2. Um resumo e incluido no corpo
3. Links para o dashboard sao adicionados

### 8.2 Exemplo de Email

```
Assunto: [TrustLayer] Weekly Executive Report - 20/01/2026

Prezado(a),

Segue o relatorio semanal de seguranca:

Score de Maturidade: 72% (+ 3% vs. semana anterior)
Gaps Criticos: 5
Cobertura: 85%

Principais Destaques:
- MFA habilitado para todos os usuarios
- 2 novos gaps identificados em Cloud Security
- Preparacao para auditoria ISO em andamento

O relatorio completo esta anexado.

Acesse o dashboard: https://trustlayer.app/dashboard

--
TrustLayer
```

### 8.3 Troubleshooting de Emails

Se emails nao estao chegando:
- Verifique a pasta de spam
- Confirme o endereco de email correto
- Verifique se o agendamento esta ativo
- Contate o administrador

---

## 9. Melhores Praticas

### 9.1 Para Auditorias

1. Use o template **Audit Report**
2. Inclua periodo completo da avaliacao
3. Verifique se todas as evidencias estao anexadas
4. Gere em PDF para registro formal

### 9.2 Para Reunioes de Board

1. Use o template **Executive Summary**
2. Foque nos ultimos 90 dias
3. Destaque tendencias e comparativos
4. Mantenha em 5 paginas ou menos

### 9.3 Para Acompanhamento Interno

1. Agende relatorios semanais
2. Use o template **Gap Analysis**
3. Distribua para equipe de seguranca
4. Rastreie progresso de remediacoes

---

## 10. Integracao com Outros Sistemas

### 10.1 Exportando para Ferramentas

Os relatorios em Excel/CSV podem ser importados em:
- Power BI
- Tableau
- Jira (para criar issues de gaps)
- ServiceNow
- Confluence

### 10.2 API de Relatorios

Para automacao avancada, consulte a documentacao da API:
- `POST /api/reports/generate` - Gerar relatorio
- `GET /api/reports/{id}` - Baixar relatorio
- `GET /api/reports/history` - Listar historico

---

## 11. Troubleshooting

### 11.1 Relatorio Falhou

Possiveis causas:
- Nenhum dado no periodo selecionado
- Problema temporario do servidor
- Filtros muito restritivos

Solucao:
- Ajuste o periodo
- Remova filtros
- Tente novamente em alguns minutos

### 11.2 PDF em Branco

Possiveis causas:
- Assessment sem respostas
- Filtros excluem todos os dados

Solucao:
- Responda algumas perguntas primeiro
- Remova filtros e tente novamente

### 11.3 Download Lento

Possiveis causas:
- Relatorio muito grande
- Conexao lenta

Solucao:
- Aguarde a geracao completa
- Tente em horario de menor trafego

---

## Referencias

- [Primeiros Passos](getting-started.md)
- [Guia de Assessments](assessments.md)
- [Guia de Dashboards](dashboards.md)
- [FAQ](faq.md)

---

*Ultima atualizacao: 20 de Janeiro de 2026*

---
profile: user
language: pt-BR
version: 1.2.0
last_updated: 2026-01-20
---

# Guia de Dashboards

## Visao Geral

Os Dashboards do TrustLayer fornecem visualizacoes em tempo real da sua postura de seguranca. Com diferentes visoes para diferentes perfis, voce pode acompanhar metricas, identificar gaps e monitorar a evolucao da maturidade ao longo do tempo.

## Publico-Alvo

- Todos os usuarios do TrustLayer
- Executivos buscando visao estrategica
- Profissionais de GRC monitorando compliance
- Especialistas analisando detalhes tecnicos

---

## 1. Tipos de Dashboard

### 1.1 Dashboard Executive

**Ideal para**: C-Level, Diretores, Board

**Conteudo**:
- Score de maturidade geral
- Tendencia de evolucao (ultimos 90 dias)
- Top 5 gaps criticos
- Roadmap estrategico
- Comparativo com benchmarks

**Caracteristicas**:
- Visualizacoes de alto nivel
- Foco em KPIs
- Linguagem de negocios
- Recomendacoes estrategicas

### 1.2 Dashboard GRC

**Ideal para**: Profissionais de Governance, Risk & Compliance

**Conteudo**:
- Cobertura por framework
- Status de controles por categoria
- Prontidao para auditoria
- Mapeamento de evidencias
- Calendario de compliance

**Caracteristicas**:
- Detalhamento por framework
- Rastreabilidade de controles
- Visao de compliance
- Suporte a auditorias

### 1.3 Dashboard Specialist

**Ideal para**: Analistas de Seguranca, Tecnicos

**Conteudo**:
- Gaps detalhados por categoria
- Analise tecnica de controles
- Rastreamento de evidencias
- Planos de remediacao
- Metricas granulares

**Caracteristicas**:
- Nivel maximo de detalhe
- Informacoes tecnicas
- Acoes praticas
- Integracao com ferramentas

---

## 2. Metricas Principais

### 2.1 Score de Maturidade

O score de maturidade e calculado como:

```
Score = (Soma das respostas ponderadas / Total possivel) x 100

Onde:
- Sim = 1.0
- Parcial = 0.5
- Nao = 0.0
- N/A = excluido do calculo
```

### 2.2 Niveis de Maturidade

| Nivel | Score | Descricao |
|-------|-------|-----------|
| **1 - Inicial** | 0-34% | Controles inexistentes ou ad-hoc |
| **2 - Basico** | 35-49% | Controles minimos implementados |
| **3 - Intermediario** | 50-64% | Controles definidos e documentados |
| **4 - Avancado** | 65-79% | Controles medidos e otimizados |
| **5 - Otimizado** | 80-100% | Melhoria continua implementada |

### 2.3 Cobertura de Framework

Percentual de perguntas respondidas por framework:

```
Cobertura = (Perguntas respondidas / Total de perguntas) x 100
```

### 2.4 Prontidao de Evidencia

Percentual de controles com evidencias anexadas:

```
Prontidao = (Controles com evidencia / Controles respondidos "Sim") x 100
```

---

## 3. Visualizacoes

### 3.1 Grafico de Radar

Mostra a maturidade em cada dominio/categoria simultaneamente:

```
        Governanca
            100
             |
    80 ------+------ 80
   /         |         \
Ops ------ Centro ------ Tech
   \         |         /
    60 ------+------ 60
             |
          Pessoas
```

**Como interpretar**:
- Area maior = maior maturidade
- Formato irregular indica areas de foco
- Compare com periodos anteriores

### 3.2 Grafico de Barras

Compara scores entre categorias, frameworks ou periodos:

```
Governanca  |========== 85%
Operacoes   |======= 70%
Tecnologia  |===== 55%
Pessoas     |==== 45%
```

**Como interpretar**:
- Barras maiores = melhor performance
- Identifique categorias abaixo da meta
- Compare com media do setor

### 3.3 Timeline (Evolucao)

Mostra a evolucao do score ao longo do tempo:

```
Score
100|
 80|        ___
 60|    ___/
 40|___/
   +---+---+---+---+---
     Jan Feb Mar Apr Mai
```

**Como interpretar**:
- Tendencia ascendente = melhoria
- Plateu = estagnacao
- Queda = regressao (investigar)

### 3.4 Heatmap de Controles

Visualiza status de controles em uma matriz:

```
Framework | Cat1 | Cat2 | Cat3 | Cat4
NIST      |  [V] |  [P] |  [X] |  [V]
ISO       |  [V] |  [V] |  [P] |  [X]
CIS       |  [P] |  [X] |  [V] |  [V]

Legenda: [V]=Sim  [P]=Parcial  [X]=Nao
```

**Como interpretar**:
- Verde (V) = conforme
- Amarelo (P) = atencao
- Vermelho (X) = gap

---

## 4. Widgets e Componentes

### 4.1 KPI Cards

Cards de metricas rapidas no topo do dashboard:

| Metrica | Descricao |
|---------|-----------|
| **Score Geral** | Maturidade consolidada |
| **Gaps Criticos** | Controles "Nao" em areas criticas |
| **Cobertura** | % do assessment respondido |
| **Tendencia** | Variacao vs. periodo anterior |

### 4.2 Tabela de Gaps

Lista os gaps mais importantes para acao:

| Prioridade | Categoria | Controle | Impacto |
|------------|-----------|----------|---------|
| Critica | IAM | MFA nao habilitado | Alto |
| Alta | Dados | Criptografia ausente | Alto |
| Media | Rede | Firewall desatualizado | Medio |

### 4.3 Roadmap de Remediacao

Sugere acoes ordenadas por prioridade:

```
Q1 2026
  [x] Implementar MFA
  [ ] Revisar politicas IAM

Q2 2026
  [ ] Habilitar criptografia
  [ ] Treinar equipe

Q3 2026
  [ ] Atualizar firewalls
  [ ] Auditoria externa
```

---

## 5. Filtros e Personalizacao

### 5.1 Filtros Disponiveis

| Filtro | Descricao |
|--------|-----------|
| **Dominio** | AI Security, Cloud, DevSecOps |
| **Framework** | NIST, ISO, CSA, etc. |
| **Categoria** | Governanca, Operacoes, etc. |
| **Periodo** | Datas de inicio e fim |
| **Status** | Sim, Parcial, Nao, N/A |

### 5.2 Aplicando Filtros

1. Clique em **Filtros** no topo do dashboard
2. Selecione os criterios desejados
3. Clique em **Aplicar**
4. Os graficos atualizam automaticamente

### 5.3 Salvando Filtros

Para salvar uma combinacao de filtros:
1. Configure os filtros desejados
2. Clique em **Salvar Filtro**
3. De um nome ao filtro
4. Acesse depois em **Meus Filtros**

---

## 6. Exportacao

### 6.1 Exportar Dashboard

Para exportar a visao atual:
1. Clique em **Exportar** no canto superior direito
2. Selecione o formato:
   - **PDF**: Documento formatado
   - **PNG**: Imagem do dashboard
3. O arquivo sera baixado

### 6.2 Compartilhar Dashboard

Para compartilhar com colegas:
1. Clique em **Compartilhar**
2. Copie o link gerado
3. O link respeita permissoes de acesso

---

## 7. Atualizacao de Dados

### 7.1 Frequencia de Atualizacao

- **Tempo real**: Respostas novas refletem imediatamente
- **Metricas calculadas**: Atualizadas a cada 5 minutos
- **Snapshots**: Capturas periodicas para historico

### 7.2 Forcando Atualizacao

Para atualizar manualmente:
1. Clique no icone de **Refresh** no canto superior direito
2. Ou pressione `F5` para recarregar a pagina

---

## 8. Dashboards por Papel

### 8.1 CISO / VP de Seguranca

**Dashboard recomendado**: Executive

**Metricas de foco**:
- Score de maturidade consolidado
- Tendencia de evolucao
- Gaps criticos
- Comparativo com pares

**Frequencia de consulta**: Semanal

### 8.2 Gerente de Compliance

**Dashboard recomendado**: GRC

**Metricas de foco**:
- Cobertura por framework
- Prontidao de evidencias
- Calendario de auditorias
- Status de controles

**Frequencia de consulta**: Diaria

### 8.3 Analista de Seguranca

**Dashboard recomendado**: Specialist

**Metricas de foco**:
- Gaps detalhados
- Planos de remediacao
- Metricas tecnicas
- Status de implementacao

**Frequencia de consulta**: Diaria

---

## 9. Dicas de Uso

### 9.1 Para Reunioes Executivas

1. Use o Dashboard Executive
2. Aplique filtro de periodo (ultimo trimestre)
3. Exporte para PDF
4. Foque nos 3-5 insights principais

### 9.2 Para Preparacao de Auditoria

1. Use o Dashboard GRC
2. Filtre pelo framework da auditoria
3. Verifique prontidao de evidencias
4. Liste gaps a serem tratados

### 9.3 Para Planejamento de Remediacao

1. Use o Dashboard Specialist
2. Filtre por gaps (status = Nao)
3. Ordene por criticidade
4. Crie plano de acao priorizado

---

## 10. Troubleshooting

### 10.1 Dashboard em Branco

- Verifique se ha respostas no assessment
- Confirme que os filtros nao excluem tudo
- Atualize a pagina

### 10.2 Dados Desatualizados

- Clique em Refresh
- Verifique conexao com internet
- Aguarde alguns minutos para sincronizacao

### 10.3 Grafico Nao Carrega

- Tente outro navegador
- Desabilite extensoes de bloqueio
- Limpe cache do navegador

---

## Referencias

- [Primeiros Passos](getting-started.md)
- [Guia de Assessments](assessments.md)
- [Guia de Reports](reports.md)
- [FAQ](faq.md)

---

*Ultima atualizacao: 20 de Janeiro de 2026*

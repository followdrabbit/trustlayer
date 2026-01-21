# Test Scenarios - Assessments Module

---
**Perfil**: QA
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este documento contém todos os cenários de teste para o módulo de Assessments da plataforma TrustLayer.

## 1. Criar Assessment

### TC-ASS-001: Criar assessment com framework padrão

**Pré-condições:**
- Usuário logado como Manager ou Admin
- Pelo menos um framework disponível

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Navegar para /assessments | - | Lista de assessments exibida |
| 2 | Clicar "New Assessment" | - | Modal de criação abre |
| 3 | Selecionar domain | AI Governance | Domain selecionado |
| 4 | Selecionar framework | NIST AI RMF | Framework selecionado |
| 5 | Inserir nome | "Assessment Q1 2026" | Nome preenchido |
| 6 | Clicar "Create" | - | Modal fecha, redirect para questions |
| 7 | Verificar lista | - | Novo assessment aparece com status "Draft" |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-002: Criar assessment com domain personalizado

**Pré-condições:**
- Usuário logado como Admin
- Multi-domain habilitado

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Navegar para /assessments | - | Lista exibida |
| 2 | Clicar "New Assessment" | - | Modal abre |
| 3 | Selecionar domain | Cloud Security | Lista de frameworks filtra |
| 4 | Verificar frameworks | - | Apenas frameworks de Cloud Security visíveis |
| 5 | Selecionar framework | CIS Controls v8 | Framework selecionado |
| 6 | Clicar "Create" | - | Assessment criado no domain correto |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-003: Validação de campos obrigatórios

**Pré-condições:**
- Usuário logado

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Abrir modal de criação | - | Modal exibido |
| 2 | Deixar domain vazio | - | Campo marcado como obrigatório |
| 3 | Clicar "Create" | - | Erro "Domain is required" |
| 4 | Selecionar domain | AI Governance | Domain selecionado |
| 5 | Deixar framework vazio | - | Campo marcado como obrigatório |
| 6 | Clicar "Create" | - | Erro "Framework is required" |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-004: Permissões de criação por role

**Pré-condições:**
- Múltiplos usuários com diferentes roles

| # | Role | Ação | Resultado Esperado |
|---|------|------|-------------------|
| 1 | Admin | Criar assessment | Sucesso |
| 2 | Manager | Criar assessment | Sucesso |
| 3 | Analyst | Criar assessment | Botão desabilitado ou hidden |
| 4 | Auditor | Criar assessment | Botão desabilitado ou hidden |
| 5 | Viewer | Criar assessment | Botão desabilitado ou hidden |

**Resultado**: ✅ Passed / ❌ Failed

---

## 2. Responder Questions

### TC-ASS-010: Responder question com todas as opções

**Pré-condições:**
- Assessment criado em status "Draft"
- Usuário com permissão de edição

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Abrir assessment draft | - | Página de questions exibida |
| 2 | Selecionar "Yes" | Question 1 | Radio button selecionado |
| 3 | Verificar auto-save | - | Indicador "Saved" aparece |
| 4 | Navegar para Q2 | - | Question 2 exibida |
| 5 | Selecionar "No" | Question 2 | Radio button selecionado |
| 6 | Navegar para Q3 | - | Question 3 exibida |
| 7 | Selecionar "Partial" | Question 3 | Radio button selecionado |
| 8 | Navegar para Q4 | - | Question 4 exibida |
| 9 | Selecionar "N/A" | Question 4 | Radio button selecionado |
| 10 | Voltar para Q1 | - | Resposta "Yes" mantida |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-011: Auto-save de respostas

**Pré-condições:**
- Assessment em edição

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Selecionar resposta | "Yes" | Resposta selecionada |
| 2 | Aguardar 2 segundos | - | Indicador "Saving..." aparece |
| 3 | Verificar indicador | - | Indicador "Saved" aparece |
| 4 | Recarregar página (F5) | - | Página recarrega |
| 5 | Verificar resposta | - | Resposta "Yes" mantida |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-012: Adicionar evidence text

**Pré-condições:**
- Assessment em edição

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Selecionar resposta | "Partial" | Resposta selecionada |
| 2 | Expandir campo Evidence | - | Campo de texto aparece |
| 3 | Inserir texto | "Implemented in Q4 2025 for 80% of systems" | Texto inserido |
| 4 | Aguardar auto-save | - | "Saved" aparece |
| 5 | Recarregar página | - | Evidence text mantido |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-013: Upload de evidence file

**Pré-condições:**
- Assessment em edição
- Arquivo de teste preparado (<5MB)

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Selecionar resposta | "Yes" | Resposta selecionada |
| 2 | Clicar "Upload Evidence" | - | File picker abre |
| 3 | Selecionar arquivo | evidence.pdf (2MB) | Arquivo selecionado |
| 4 | Verificar upload | - | Progress bar, depois "Uploaded" |
| 5 | Verificar arquivo | - | Nome do arquivo exibido com ícone |
| 6 | Clicar no arquivo | - | Download ou preview |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-014: Rejeitar evidence file muito grande

**Pré-condições:**
- Arquivo de teste >5MB preparado

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Clicar "Upload Evidence" | - | File picker abre |
| 2 | Selecionar arquivo grande | large_file.pdf (10MB) | Arquivo selecionado |
| 3 | Verificar erro | - | Erro "File size exceeds 5MB limit" |
| 4 | Verificar upload | - | Arquivo NÃO foi enviado |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-015: Navegação entre questions

**Pré-condições:**
- Assessment com múltiplas questions

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Verificar progresso | - | "Question 1 of N" exibido |
| 2 | Clicar "Next" | - | Question 2 exibida |
| 3 | Clicar "Previous" | - | Question 1 exibida |
| 4 | Usar sidebar navigation | Question 5 | Question 5 exibida |
| 5 | Verificar indicadores | - | Questions respondidas marcadas |
| 6 | Usar keyboard (Tab + Enter) | - | Navegação funciona |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-016: Indicador de progresso

**Pré-condições:**
- Assessment com 10 questions, nenhuma respondida

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Verificar progresso inicial | - | 0% ou "0 of 10" |
| 2 | Responder question 1 | "Yes" | Progresso: 10% |
| 3 | Responder questions 2-5 | Mix | Progresso: 50% |
| 4 | Responder questions 6-10 | Mix | Progresso: 100% |
| 5 | Verificar visual | - | Barra de progresso cheia |

**Resultado**: ✅ Passed / ❌ Failed

---

## 3. Submeter Assessment

### TC-ASS-020: Submit assessment completo

**Pré-condições:**
- Assessment com 100% das questions respondidas

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Verificar progresso | - | 100% completo |
| 2 | Verificar botão Submit | - | Botão habilitado |
| 3 | Clicar "Submit" | - | Modal de confirmação |
| 4 | Confirmar submit | - | Assessment submetido |
| 5 | Verificar status | - | Status "Completed" |
| 6 | Verificar score | - | Score calculado e exibido |
| 7 | Tentar editar | - | Campos desabilitados |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-021: Submit assessment incompleto bloqueado

**Pré-condições:**
- Assessment com <100% das questions respondidas

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Verificar progresso | - | <100% (ex: 80%) |
| 2 | Verificar botão Submit | - | Botão desabilitado |
| 3 | Hover no botão | - | Tooltip "Complete all questions to submit" |
| 4 | Clicar no botão | - | Nada acontece ou mensagem de erro |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-022: Cálculo de score

**Pré-condições:**
- Assessment com respostas conhecidas para validar cálculo

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Criar assessment | 10 questions | Assessment criado |
| 2 | Responder 5 "Yes" | Score = 100 each | Parcial: 50% |
| 3 | Responder 3 "Partial" | Score = 50 each | Parcial: 65% |
| 4 | Responder 2 "No" | Score = 0 each | Final: 65% |
| 5 | Submit assessment | - | Score: 65% calculado |
| 6 | Verificar breakdown | - | Score por categoria |

**Notas**:
- Yes = 100 pontos
- Partial = 50 pontos
- No = 0 pontos
- N/A = Não conta no total

**Resultado**: ✅ Passed / ❌ Failed

---

## 4. Gap Analysis

### TC-ASS-030: Visualizar gaps

**Pré-condições:**
- Assessment completo com gaps (respostas "No" ou "Partial")

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Abrir assessment completo | - | Assessment exibido |
| 2 | Navegar para "Gap Analysis" | - | Página de gaps |
| 3 | Verificar lista de gaps | - | Gaps listados |
| 4 | Verificar informações | - | Question, severity, recommendation |
| 5 | Verificar severidade | - | Critical/High/Medium/Low badges |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-031: Filtrar gaps por severidade

**Pré-condições:**
- Assessment com gaps de diferentes severidades

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Abrir Gap Analysis | - | Todos os gaps listados |
| 2 | Filtrar por "Critical" | - | Apenas gaps críticos |
| 3 | Filtrar por "High" | - | Apenas gaps altos |
| 4 | Filtrar por "Medium" | - | Apenas gaps médios |
| 5 | Limpar filtro | - | Todos os gaps novamente |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-032: Filtrar gaps por categoria

**Pré-condições:**
- Assessment com múltiplas categorias

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Abrir Gap Analysis | - | Todos os gaps |
| 2 | Selecionar categoria | "Governance" | Gaps de Governance apenas |
| 3 | Selecionar categoria | "Risk Management" | Gaps de Risk Management |
| 4 | Combinar filtros | Critical + Governance | Gaps críticos de Governance |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-033: Exportar gaps para Excel

**Pré-condições:**
- Assessment com gaps

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Abrir Gap Analysis | - | Gaps listados |
| 2 | Clicar "Export" | - | Opções de formato |
| 3 | Selecionar "Excel" | - | Download inicia |
| 4 | Abrir arquivo .xlsx | - | Dados corretos, formatados |
| 5 | Verificar colunas | - | Question, Status, Severity, Category, Recommendation |

**Resultado**: ✅ Passed / ❌ Failed

---

## 5. Ações de Assessment

### TC-ASS-040: Duplicar assessment

**Pré-condições:**
- Assessment existente (qualquer status)

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Abrir menu de ações | Assessment existente | Menu dropdown |
| 2 | Clicar "Duplicate" | - | Modal de confirmação ou rename |
| 3 | Confirmar duplicação | "Assessment Copy" | Novo assessment criado |
| 4 | Verificar novo assessment | - | Status "Draft", mesmas questions |
| 5 | Verificar respostas | - | Respostas NÃO copiadas |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-041: Deletar assessment draft

**Pré-condições:**
- Assessment em status "Draft"
- Usuário com permissão de delete

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Abrir menu de ações | Assessment draft | Menu dropdown |
| 2 | Clicar "Delete" | - | Modal de confirmação |
| 3 | Confirmar delete | - | Assessment removido |
| 4 | Verificar lista | - | Assessment não aparece mais |
| 5 | Verificar DB | - | Registro deletado ou soft-deleted |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-042: Deletar assessment completed bloqueado

**Pré-condições:**
- Assessment em status "Completed"

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Abrir menu de ações | Assessment completed | Menu dropdown |
| 2 | Verificar opção Delete | - | Opção desabilitada ou hidden |
| 3 | (Se visível) Clicar Delete | - | Erro "Cannot delete completed assessments" |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-043: Arquivar assessment

**Pré-condições:**
- Assessment existente

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Clicar "Archive" | - | Modal de confirmação |
| 2 | Confirmar archive | - | Assessment arquivado |
| 3 | Verificar lista principal | - | Assessment não aparece |
| 4 | Navegar para "Archived" | - | Assessment aparece em archived |
| 5 | Clicar "Restore" | - | Assessment volta para lista principal |

**Resultado**: ✅ Passed / ❌ Failed

---

## 6. Multi-Domain Support

### TC-ASS-050: Assessment em múltiplos domains

**Pré-condições:**
- Multi-domain habilitado
- Assessments em diferentes domains

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Criar assessment AI Governance | NIST AI RMF | Assessment criado |
| 2 | Criar assessment Cloud Security | CIS Controls | Assessment criado |
| 3 | Criar assessment Data Privacy | LGPD | Assessment criado |
| 4 | Verificar lista | - | Todos assessments listados |
| 5 | Filtrar por domain | AI Governance | Apenas AI assessments |
| 6 | Verificar dashboard | - | Scores separados por domain |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-051: Score consolidado vs por domain

**Pré-condições:**
- Assessments em múltiplos domains com scores diferentes

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Completar AI Assessment | Score: 80% | Score registrado |
| 2 | Completar Cloud Assessment | Score: 60% | Score registrado |
| 3 | Verificar dashboard | - | Score consolidado calculado |
| 4 | Verificar breakdown | - | AI: 80%, Cloud: 60% |
| 5 | Verificar weighted average | - | Score médio correto |

**Resultado**: ✅ Passed / ❌ Failed

---

## 7. Permissões e Segurança

### TC-ASS-060: Isolamento multi-tenant (RLS)

**Pré-condições:**
- Dois usuários de organizações diferentes

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Login como User A (Org 1) | - | Dashboard Org 1 |
| 2 | Criar assessment | "Org 1 Assessment" | Assessment criado |
| 3 | Logout | - | Sessão encerrada |
| 4 | Login como User B (Org 2) | - | Dashboard Org 2 |
| 5 | Verificar lista | - | "Org 1 Assessment" NÃO visível |
| 6 | Tentar acessar via URL | /assessments/[org1-id] | 404 ou Access Denied |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-061: Permissões de edição por role

**Pré-condições:**
- Assessment em status "Draft"

| # | Role | Ação | Resultado Esperado |
|---|------|------|-------------------|
| 1 | Admin | Editar respostas | Sucesso |
| 2 | Manager | Editar respostas | Sucesso |
| 3 | Analyst | Editar respostas | Sucesso (se assigned) |
| 4 | Auditor | Editar respostas | Read-only |
| 5 | Viewer | Editar respostas | Read-only |

**Resultado**: ✅ Passed / ❌ Failed

---

## 8. Edge Cases

### TC-ASS-070: Assessment com muitas questions (100+)

**Pré-condições:**
- Framework com 100+ questions

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Criar assessment | Large framework (100 questions) | Assessment criado |
| 2 | Verificar performance | - | Página carrega em <3s |
| 3 | Navegar entre questions | - | Navegação suave |
| 4 | Verificar sidebar | - | Virtualização ou pagination |
| 5 | Responder todas | - | Sem travamento |
| 6 | Submit | - | Score calculado corretamente |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-071: Sessão expira durante edição

**Pré-condições:**
- Assessment em edição, sessão configurada para expirar

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Abrir assessment para edição | - | Questions exibidas |
| 2 | Responder algumas questions | - | Auto-save funciona |
| 3 | Aguardar sessão expirar (30 min) | - | - |
| 4 | Tentar responder question | - | Redirect para login |
| 5 | Fazer login novamente | - | Dashboard exibido |
| 6 | Abrir assessment | - | Respostas anteriores mantidas |

**Resultado**: ✅ Passed / ❌ Failed

---

### TC-ASS-072: Conexão perdida durante edição

**Pré-condições:**
- Assessment em edição

| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Abrir assessment | - | Questions exibidas |
| 2 | Responder question | "Yes" | Tentativa de auto-save |
| 3 | Desconectar rede | - | Rede offline |
| 4 | Verificar indicador | - | "Offline" ou "Saving failed" |
| 5 | Reconectar rede | - | Rede online |
| 6 | Verificar retry | - | Auto-save retry, "Saved" |

**Resultado**: ✅ Passed / ❌ Failed

---

## Checklist de Execução

| ID | Cenário | Status | Notas |
|----|---------|--------|-------|
| TC-ASS-001 | Criar assessment padrão | ⬜ | |
| TC-ASS-002 | Criar assessment domain | ⬜ | |
| TC-ASS-003 | Validação obrigatórios | ⬜ | |
| TC-ASS-004 | Permissões criação | ⬜ | |
| TC-ASS-010 | Responder opções | ⬜ | |
| TC-ASS-011 | Auto-save | ⬜ | |
| TC-ASS-012 | Evidence text | ⬜ | |
| TC-ASS-013 | Evidence file | ⬜ | |
| TC-ASS-014 | File muito grande | ⬜ | |
| TC-ASS-015 | Navegação | ⬜ | |
| TC-ASS-016 | Progresso | ⬜ | |
| TC-ASS-020 | Submit completo | ⬜ | |
| TC-ASS-021 | Submit incompleto | ⬜ | |
| TC-ASS-022 | Cálculo score | ⬜ | |
| TC-ASS-030 | Visualizar gaps | ⬜ | |
| TC-ASS-031 | Filtrar severidade | ⬜ | |
| TC-ASS-032 | Filtrar categoria | ⬜ | |
| TC-ASS-033 | Exportar gaps | ⬜ | |
| TC-ASS-040 | Duplicar | ⬜ | |
| TC-ASS-041 | Deletar draft | ⬜ | |
| TC-ASS-042 | Deletar completed | ⬜ | |
| TC-ASS-043 | Arquivar | ⬜ | |
| TC-ASS-050 | Multi-domain | ⬜ | |
| TC-ASS-051 | Score consolidado | ⬜ | |
| TC-ASS-060 | RLS isolamento | ⬜ | |
| TC-ASS-061 | Permissões role | ⬜ | |
| TC-ASS-070 | 100+ questions | ⬜ | |
| TC-ASS-071 | Sessão expira | ⬜ | |
| TC-ASS-072 | Conexão perdida | ⬜ | |

**Tester**: _________________
**Data**: _________________
**Build**: _________________

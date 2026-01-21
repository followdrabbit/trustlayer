# Bug Report Template - TrustLayer QA

---
**Perfil**: QA
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Template Padrão

```markdown
## [MÓDULO] Título descritivo do bug

### Informações do Bug

| Campo | Valor |
|-------|-------|
| **ID** | BUG-XXXX |
| **Reporter** | [seu nome] |
| **Data** | YYYY-MM-DD |
| **Severidade** | P1/P2/P3/P4 |
| **Status** | New |
| **Assignee** | - |

### Ambiente

| Campo | Valor |
|-------|-------|
| **URL** | https://staging.trustlayer.com |
| **Browser** | Chrome 120.0.6099.130 |
| **OS** | Windows 11 |
| **User Role** | Manager |
| **Organization** | Test Org (org-001) |

### Descrição

[Descreva o bug de forma clara e concisa]

### Passos para Reproduzir

1. Login como `manager@test.trustlayer.com`
2. Navegar para `Assessments`
3. Clicar em `New Assessment`
4. Selecionar framework `NIST-CSF`
5. Clicar em `Start Assessment`
6. Observar o erro

### Resultado Esperado

[Descreva o que deveria acontecer]

### Resultado Atual

[Descreva o que realmente aconteceu]

### Screenshots/Vídeos

[Anexe evidências visuais]

### Console Errors

```
[Cole erros do console do browser, se houver]
```

### Network Logs

```
[Cole requests/responses relevantes, se aplicável]
```

### Informações Adicionais

- [ ] Bug ocorre consistentemente
- [ ] Bug ocorre apenas em condições específicas
- [ ] Workaround disponível: [descreva]

### Notas do Desenvolvedor

[Preenchido pelo dev]

### Histórico

| Data | Ação | Por |
|------|------|-----|
| YYYY-MM-DD | Criado | [reporter] |
```

---

## Exemplos de Bug Reports

### Exemplo 1: Bug Crítico (P1)

```markdown
## [AUTH] Login falha com erro 500 após SSO

### Informações do Bug

| Campo | Valor |
|-------|-------|
| **ID** | BUG-1234 |
| **Reporter** | maria.qa |
| **Data** | 2026-01-21 |
| **Severidade** | P1 - Critical |
| **Status** | New |
| **Assignee** | - |

### Ambiente

| Campo | Valor |
|-------|-------|
| **URL** | https://app.trustlayer.com |
| **Browser** | Chrome 120.0 |
| **OS** | Windows 11 |
| **User Role** | Any |
| **Organization** | TechCorp |

### Descrição

Após autenticação bem-sucedida via Okta SSO, o sistema retorna erro 500 e usuário não consegue acessar a aplicação.

### Passos para Reproduzir

1. Acessar https://app.trustlayer.com/login
2. Clicar em "Login with SSO"
3. Autenticar com sucesso no Okta
4. Ser redirecionado de volta ao TrustLayer
5. Observar erro 500

### Resultado Esperado

Usuário deve ser autenticado e redirecionado para o Dashboard.

### Resultado Atual

Página de erro 500 é exibida. Usuário não consegue acessar a aplicação.

### Screenshots/Vídeos

![Error 500](./screenshots/bug-1234-error.png)

### Console Errors

```
Error: Failed to fetch user profile
    at AuthService.handleSSOCallback (auth-service.ts:156)
    at async handleCallback (sso-callback.tsx:42)
```

### Network Logs

```
POST /auth/v1/callback
Status: 500 Internal Server Error
Response: {"error": "Failed to create session", "code": "SESSION_ERROR"}
```

### Informações Adicionais

- [x] Bug ocorre consistentemente
- [ ] Bug ocorre apenas em condições específicas
- [ ] Workaround disponível: Login com email/senha funciona

### Impacto

- 100% dos usuários SSO afetados
- ~500 usuários não conseguem acessar
- Produção afetada
```

### Exemplo 2: Bug de Alta Severidade (P2)

```markdown
## [ASSESSMENTS] Score não é calculado após submit

### Informações do Bug

| Campo | Valor |
|-------|-------|
| **ID** | BUG-1235 |
| **Reporter** | joao.qa |
| **Data** | 2026-01-21 |
| **Severidade** | P2 - High |
| **Status** | New |
| **Assignee** | - |

### Ambiente

| Campo | Valor |
|-------|-------|
| **URL** | https://staging.trustlayer.com |
| **Browser** | Firefox 121.0 |
| **OS** | macOS Ventura |
| **User Role** | Analyst |
| **Organization** | Test Org |

### Descrição

Após submeter um assessment com todas as perguntas respondidas, o score não é calculado e aparece como "N/A".

### Passos para Reproduzir

1. Login como analyst@test.trustlayer.com
2. Criar novo assessment (NIST-CSF)
3. Responder todas as 100 perguntas
4. Verificar que progresso está em 100%
5. Clicar em "Submit Assessment"
6. Confirmar no modal
7. Observar que score aparece como "N/A"

### Resultado Esperado

Score deveria ser calculado e exibido (ex: 75%).

### Resultado Atual

Score aparece como "N/A" mesmo após submit bem-sucedido.

### Screenshots/Vídeos

![Score N/A](./screenshots/bug-1235-score-na.png)

### Console Errors

```
Warning: Score calculation returned null for assessment abc123
```

### Network Logs

```
POST /api/assessments/abc123/submit
Status: 200 OK
Response: {"status": "completed", "score": null}
```

### Informações Adicionais

- [ ] Bug ocorre consistentemente
- [x] Bug ocorre apenas em condições específicas
- [x] Workaround disponível: Editar e re-submeter funciona

**Condições específicas:**
- Ocorre apenas com framework NIST-CSF
- Outros frameworks (CIS, ISO) funcionam normalmente
```

### Exemplo 3: Bug Médio (P3)

```markdown
## [REPORTS] Export Excel inclui coluna duplicada

### Informações do Bug

| Campo | Valor |
|-------|-------|
| **ID** | BUG-1236 |
| **Reporter** | ana.qa |
| **Data** | 2026-01-21 |
| **Severidade** | P3 - Medium |
| **Status** | New |
| **Assignee** | - |

### Ambiente

| Campo | Valor |
|-------|-------|
| **URL** | https://staging.trustlayer.com |
| **Browser** | Chrome 120.0 |
| **OS** | Windows 11 |
| **User Role** | Manager |

### Descrição

Ao exportar relatório em formato Excel, a coluna "Category" aparece duplicada.

### Passos para Reproduzir

1. Navegar para Reports
2. Selecionar assessment concluído
3. Clicar em "Export" > "Excel"
4. Abrir arquivo .xlsx baixado
5. Observar coluna duplicada

### Resultado Esperado

Cada coluna deve aparecer apenas uma vez.

### Resultado Atual

Coluna "Category" aparece duas vezes (colunas E e F).

### Screenshots/Vídeos

![Coluna Duplicada](./screenshots/bug-1236-duplicate-column.png)

### Informações Adicionais

- [x] Bug ocorre consistentemente
- [ ] Workaround disponível: Deletar coluna manualmente no Excel
```

---

## Níveis de Severidade

### P1 - Critical 🔴

**Definição**: Sistema down, data loss, ou funcionalidade core completamente quebrada sem workaround.

**Exemplos**:
- Não é possível fazer login
- Dados sendo corrompidos
- Aplicação não carrega
- Perda de dados de produção

**SLA**: Resposta em 2 horas, fix em 24 horas

### P2 - High 🟠

**Definição**: Funcionalidade importante quebrada, impactando significativamente o trabalho.

**Exemplos**:
- Não é possível criar assessments
- Export de relatórios falha
- Dashboard não carrega métricas
- MFA não funciona

**SLA**: Resposta em 8 horas, fix em 3 dias

### P3 - Medium 🟡

**Definição**: Funcionalidade parcialmente quebrada ou com impacto moderado.

**Exemplos**:
- Filtro específico não funciona
- Formatação incorreta em exports
- Performance degradada
- UI glitch em cenário específico

**SLA**: Resposta em 24 horas, fix em 1 semana

### P4 - Low 🟢

**Definição**: Issue menor, cosmético ou com workaround fácil.

**Exemplos**:
- Typo na interface
- Alinhamento de elementos
- Tooltip incorreto
- Melhoria de UX menor

**SLA**: Resposta em 48 horas, fix no próximo sprint

---

## Checklist de Bug Report

Antes de submeter, verifique:

- [ ] Título é descritivo e inclui módulo
- [ ] Severidade está corretamente atribuída
- [ ] Ambiente está documentado (URL, browser, OS)
- [ ] Passos são reproduzíveis
- [ ] Resultado esperado vs atual está claro
- [ ] Screenshots/vídeos anexados (se aplicável)
- [ ] Console errors incluídos (se houver)
- [ ] Verificado se bug já foi reportado
- [ ] Testado em ambiente limpo (cache limpo, incognito)

---

## Ferramentas Úteis

### Captura de Screenshots

- **Windows**: Win + Shift + S
- **macOS**: Cmd + Shift + 4
- **Chrome DevTools**: Cmd/Ctrl + Shift + P > "Screenshot"

### Gravação de Vídeo

- **Loom**: https://loom.com
- **OBS Studio**: https://obsproject.com
- **Chrome DevTools**: Performance > Record

### Console do Browser

- **Abrir**: F12 ou Cmd/Ctrl + Shift + I
- **Console**: Tab "Console"
- **Network**: Tab "Network"

### Informações do Browser

- **Chrome**: chrome://version
- **Firefox**: about:support
- **Edge**: edge://version

---

## Onde Reportar

| Tipo | Onde |
|------|------|
| Bug de Produto | GitHub Issues / Jira |
| Bug de Segurança | security@trustlayer.com |
| Bug de Infraestrutura | #infra-alerts (Slack) |

---

## Referências

- [Severity Guidelines](./severity-guidelines.md)
- [Bug Workflow](./bug-workflow.md)
- [Test Plan](./test-plan.md)

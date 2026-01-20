# Feature Checklist Master - TrustLayer

---
**Perfil**: QA
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-20

---

## Como Usar este Checklist

Este checklist é usado para validar features antes de releases. Para cada feature:

1. ✅ **Passed**: Feature funciona como esperado
2. ❌ **Failed**: Bug encontrado (criar issue)
3. ⏭️ **Skipped**: Não aplicável neste contexto
4. 🚧 **Blocked**: Dependência não resolvida

## Phase 1: Core Features (90% Enterprise Ready)

### 1.1 Authentication & Authorization

#### Login/Logout
- [ ] Login com email/senha válidos
- [ ] Login com credenciais inválidas mostra erro
- [ ] Logout encerra sessão corretamente
- [ ] Redirect para /login quando não autenticado
- [ ] Redirect para dashboard após login
- [ ] "Remember me" mantém sessão
- [ ] Session expira após inatividade (30 min)

#### Password Management
- [ ] "Forgot password" envia email
- [ ] Link de reset válido por 24h
- [ ] Reset password atualiza senha
- [ ] Link expirado mostra erro
- [ ] Nova senha deve ter mínimo 8 caracteres
- [ ] Nova senha requer maiúscula + número + especial

#### SSO/SAML
- [ ] "Login with SSO" redireciona para IdP
- [ ] Após autenticação no IdP, cria sessão
- [ ] SAML metadata endpoint acessível
- [ ] Erro de SAML mostra mensagem clara
- [ ] Logout via SSO desautentica corretamente

#### MFA (Multi-Factor Authentication)
**TOTP (Authenticator App)**
- [ ] "Enable MFA" gera QR code
- [ ] Scan QR code com Google Authenticator funciona
- [ ] Código TOTP válido permite login
- [ ] Código TOTP inválido bloqueia login
- [ ] Código usado não pode ser reutilizado
- [ ] "Disable MFA" requer código TOTP

**WebAuthn (Security Keys)**
- [ ] "Add Security Key" inicia registro
- [ ] Registro com Yubikey funciona
- [ ] Login com security key funciona
- [ ] Login sem security key mostra erro
- [ ] Múltiplas keys podem ser registradas
- [ ] Remover key funciona

#### RBAC (Role-Based Access Control)
**Admin Role**
- [ ] Acessa todas as features
- [ ] Pode gerenciar usuários
- [ ] Pode criar/editar organizações
- [ ] Pode acessar logs de auditoria

**Manager Role**
- [ ] Pode criar assessments
- [ ] Pode editar assessments
- [ ] Pode visualizar dashboards
- [ ] Pode gerar relatórios
- [ ] NÃO pode gerenciar usuários

**Analyst Role**
- [ ] Pode responder assessments
- [ ] Pode visualizar dashboards
- [ ] NÃO pode deletar assessments
- [ ] NÃO pode gerenciar usuários

**Auditor Role** (Phase 2)
- [ ] Acessa audit logs (read-only)
- [ ] Visualiza timeline de mudanças
- [ ] NÃO pode editar dados
- [ ] Pode exportar logs

**Viewer Role**
- [ ] Visualiza dashboards (read-only)
- [ ] Visualiza relatórios
- [ ] NÃO pode editar nada

### 1.2 Assessments Module

#### Create Assessment
- [ ] Click "New Assessment" abre modal
- [ ] Selecionar framework carrega categorias
- [ ] Selecionar domain filtra frameworks
- [ ] "Start Assessment" cria assessment e redireciona
- [ ] Assessment aparece na lista
- [ ] Status inicial é "Draft"

#### Answer Questions
- [ ] Navegação entre perguntas funciona
- [ ] Resposta é salva automaticamente (auto-save)
- [ ] Indicador de progresso atualiza
- [ ] "Yes/No/Partial/N/A" podem ser selecionados
- [ ] Campo "Evidence" aceita texto
- [ ] Upload de evidence file funciona
- [ ] Evidence file <5MB aceito
- [ ] Evidence file >5MB rejeitado

#### Submit Assessment
- [ ] "Submit" só habilitado se 100% respondido
- [ ] Confirmação modal antes de submit
- [ ] Após submit, status muda para "Completed"
- [ ] Assessment completed não pode ser editado
- [ ] Score é calculado corretamente

#### Gap Analysis
- [ ] "View Gaps" mostra lista de gaps
- [ ] Gaps filtrados por severidade
- [ ] Gaps filtrados por categoria
- [ ] Gaps filtrados por domain
- [ ] Export gaps para Excel funciona

#### Multi-Domain Support
- [ ] Criar assessment em domain "AI Governance"
- [ ] Criar assessment em domain "Cloud Security"
- [ ] Scores separados por domain
- [ ] Dashboard mostra todos os domains

#### Assessment Actions
- [ ] Duplicate assessment funciona
- [ ] Delete assessment remove da lista
- [ ] Archive assessment move para archived
- [ ] Export assessment gera file

### 1.3 Dashboards Module

#### Executive Dashboard
- [ ] Overall Score card mostra score correto
- [ ] Score trend chart mostra últimos 90 dias
- [ ] Domain breakdown chart mostra todos domains
- [ ] Critical gaps table mostra top 10 gaps
- [ ] Charts são responsivos
- [ ] Tooltips mostram detalhes no hover

#### GRC Dashboard
- [ ] Framework coverage table mostra frameworks
- [ ] Compliance rate calculada corretamente
- [ ] Control heatmap mostra cores por status
- [ ] Filter por framework funciona
- [ ] Filter por date range funciona

#### Specialist Dashboard
- [ ] Domain-specific metrics corretos
- [ ] Technical details disponíveis
- [ ] Deep-dive links funcionam
- [ ] Export dashboard to PDF funciona

#### Dashboard Filters
- [ ] Filter por organization
- [ ] Filter por domain
- [ ] Filter por framework
- [ ] Filter por date range
- [ ] Clear filters restaura state

#### Refresh & Real-time
- [ ] "Refresh" button atualiza dados
- [ ] Auto-refresh a cada 5 minutos
- [ ] Loading state durante refresh
- [ ] Erro de refresh mostra mensagem

### 1.4 Reports Module

#### On-Demand Export
- [ ] "Export Report" abre modal
- [ ] Selecionar formato HTML funciona
- [ ] Selecionar formato Excel funciona
- [ ] Export inclui data selecionada
- [ ] Export baixa file automaticamente
- [ ] Nome do file segue padrão: `report-YYYYMMDD.ext`

#### Email Reports
- [ ] "Email Report" abre modal
- [ ] Adicionar recipients funciona
- [ ] Email enviado contém report em anexo
- [ ] Email contém summary no body
- [ ] Multiple recipients recebem email

#### Report Content
- [ ] Report inclui cover page
- [ ] Report inclui executive summary
- [ ] Report inclui score breakdown
- [ ] Report inclui gap analysis
- [ ] Report inclui charts/graphs
- [ ] Report inclui organization logo (se configurado)

### 1.5 Admin Panel

#### User Management
- [ ] "Add User" cria novo usuário
- [ ] "Edit User" atualiza dados
- [ ] "Delete User" remove (com confirmação)
- [ ] "Change Role" atualiza permissões
- [ ] "Deactivate User" desabilita acesso
- [ ] "Reactivate User" restaura acesso
- [ ] User list paginada (50/page)
- [ ] Search users por email/nome funciona

#### Organization Management
- [ ] "Create Organization" funciona
- [ ] "Edit Organization" atualiza dados
- [ ] Upload organization logo funciona
- [ ] Logo aparece em dashboards/reports
- [ ] Organization settings persistidos
- [ ] Multi-tenancy isolado (RLS funciona)

#### System Settings
- [ ] Enable/Disable AI Assistant global
- [ ] Enable/Disable Audio features global
- [ ] Configure email templates
- [ ] Configure SAML settings
- [ ] Test email configuration funciona
- [ ] Test SAML configuration funciona

## Phase 2: Enhanced Features (Em Progresso)

### 2.1 Advanced Reporting System

#### Report Templates
- [ ] "Create Template" abre builder
- [ ] Drag-and-drop sections funciona
- [ ] Add charts to template funciona
- [ ] Save template persiste configuração
- [ ] Template library mostra templates salvos
- [ ] Duplicate template funciona

#### Scheduled Reports
- [ ] "Schedule Report" abre modal
- [ ] Cron expression builder funciona
- [ ] Select recurrence (daily/weekly/monthly)
- [ ] Add recipients para schedule
- [ ] Preview next run time
- [ ] Save schedule cria entry

#### Report History
- [ ] History table mostra reports gerados
- [ ] Download report anterior funciona
- [ ] Filter por date range
- [ ] Filter por template
- [ ] Delete old reports funciona

### 2.2 UX/UI Enhancements

#### Theme System
- [ ] Theme selector mostra 5+ temas
- [ ] Selecionar tema aplica imediatamente
- [ ] Tema persiste após reload
- [ ] Dark theme funciona
- [ ] High contrast theme acessível
- [ ] Custom theme builder funciona

#### Custom Fonts/Colors
- [ ] Color picker seleciona cores
- [ ] Font selector mostra fontes disponíveis
- [ ] Preview de customização funciona
- [ ] Save customization aplica globalmente
- [ ] Reset to default restaura

#### Animations
- [ ] Page transitions suaves
- [ ] Card hover effects funcionam
- [ ] Loading animations smooth
- [ ] Stagger effects em listas
- [ ] Animations respeitam `prefers-reduced-motion`

#### Draggable AI Assistant
- [ ] AI assistant icon visível
- [ ] Drag assistant para nova posição
- [ ] Posição persiste após reload
- [ ] "Reset Position" funciona
- [ ] Enable/Disable no settings funciona

#### User Avatars
- [ ] Upload avatar funciona
- [ ] Avatar <5MB aceito
- [ ] Avatar resize para 256x256
- [ ] Avatar aparece em header/sidebar
- [ ] Delete avatar funciona
- [ ] Fallback para iniciais funciona

#### Organization Logos
- [ ] Admin pode upload logo
- [ ] Logo aparece em login page
- [ ] Logo aparece em dashboards
- [ ] Logo aparece em reports
- [ ] Dark mode logo variant funciona

### 2.3 Custom Dashboards

#### Dashboard Builder
- [ ] "Create Dashboard" abre builder
- [ ] Widget library mostra widgets disponíveis
- [ ] Drag widget para canvas funciona
- [ ] Resize widget funciona
- [ ] Reorder widgets funciona
- [ ] Save dashboard persiste layout

#### Widget Configuration
- [ ] Configure widget settings funciona
- [ ] Preview widget data funciona
- [ ] Remove widget funciona
- [ ] Duplicate widget funciona

#### Dashboard Management
- [ ] Admin pode disable default dashboards
- [ ] Create custom dashboard funciona
- [ ] Assign dashboard to roles funciona
- [ ] Set default dashboard funciona

### 2.4 Auditor Role & Forensics

#### Audit Logs Access
- [ ] Auditor vê audit logs
- [ ] Logs mostram before/after state
- [ ] Logs incluem IP address
- [ ] Logs incluem geolocation
- [ ] Logs incluem device info

#### Timeline View
- [ ] Timeline mostra eventos cronológicos
- [ ] Filter por user funciona
- [ ] Filter por action type funciona
- [ ] Filter por date range funciona
- [ ] Export timeline funciona

#### User Activity Tracking
- [ ] Activity heatmap mostra padrões
- [ ] Sessions list mostra todas sessões
- [ ] Active sessions highlighted
- [ ] "Terminate Session" funciona (admin)

#### Forensic Investigation
- [ ] Relationship graph mostra conexões
- [ ] Search por correlation ID funciona
- [ ] Drill-down para detalhes funciona
- [ ] Export investigation report funciona

## Cross-Cutting Concerns

### Performance
- [ ] Page load <2s (3G network)
- [ ] Dashboard render <1s
- [ ] Assessment list paginated (50/page)
- [ ] Images lazy-loaded
- [ ] Code splitting por route

### Security
- [ ] XSS sanitization funciona
- [ ] SQL injection prevenido (prepared statements)
- [ ] CSRF tokens validados
- [ ] Rate limiting ativo (100 req/15min)
- [ ] Secrets não expostos no client

### Accessibility (a11y)
- [ ] Keyboard navigation funciona
- [ ] Screen reader compatible
- [ ] ARIA labels corretos
- [ ] Color contrast WCAG AA compliant
- [ ] Focus indicators visíveis

### Internationalization (i18n)
- [ ] Idioma PT-BR funciona
- [ ] Idioma EN-US funciona
- [ ] Idioma ES-ES funciona
- [ ] Date/time formato correto por locale
- [ ] Number format correto por locale

### Responsiveness
- [ ] Mobile (375px) layout funciona
- [ ] Tablet (768px) layout funciona
- [ ] Desktop (1920px) layout funciona
- [ ] Touch gestures funcionam
- [ ] Hamburger menu no mobile

### Browser Compatibility
- [ ] Chrome latest funciona
- [ ] Firefox latest funciona
- [ ] Edge latest funciona
- [ ] Safari latest funciona
- [ ] IE11 mostra mensagem de browser incompatível

## Release Checklist

Antes de cada release, verificar:

- [ ] Todos os smoke tests passam
- [ ] Todos os regression tests passam
- [ ] Code coverage >80%
- [ ] Lighthouse score >90
- [ ] 0 critical bugs
- [ ] <5 high bugs
- [ ] <10 medium bugs
- [ ] CHANGELOG atualizado
- [ ] Migration guide escrito (se breaking changes)
- [ ] Documentation atualizada
- [ ] Release notes escritas

## Notas de Teste

**Ambiente**: _____________________
**Tester**: _____________________
**Data**: _____________________
**Build**: _____________________

**Bugs Encontrados**:
1. ___________________________
2. ___________________________
3. ___________________________

**Observações**:
___________________________________
___________________________________
___________________________________

**Sign-off**: ___________________

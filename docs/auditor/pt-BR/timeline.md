# Timeline View - TrustLayer

---
**Perfil**: Auditor
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

O Timeline View é uma visualização cronológica interativa de eventos que permite aos auditores analisar sequências de ações, identificar padrões e investigar incidentes de forma intuitiva.

## Acessando o Timeline

1. No menu lateral, clique em **"Timeline View"**
2. Ou a partir de qualquer log, clique em **"View Timeline"**
3. Ou de User Activity, clique em **"Timeline"**

## Interface do Timeline

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TIMELINE VIEW                                          [Filter] [Export]  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Date Range: [2026-01-21] ─────────────────────────────── [2026-01-21]    │
│                                                                            │
│ Filters: [All Events ▼] [All Users ▼] [All Severities ▼]                 │
│                                                                            │
│ ═══════════════════════════════════════════════════════════════════════  │
│                                                                            │
│ 2026-01-21                                                                 │
│ ────────────────────────────────────────────────────────────────────────  │
│                                                                            │
│ 14:32 ─●─ assessment.update                                    ⚠ Warning │
│        │  analyst@acme.com                                               │
│        │  NIST-CSF Assessment Q1 → status: completed, score: 85          │
│        │  São Paulo, Brazil • Chrome/Windows                              │
│        │                                                                  │
│ 14:28 ─●─ auth.login                                           ℹ Info    │
│        │  analyst@acme.com                                               │
│        │  Login successful                                                │
│        │  São Paulo, Brazil • Chrome/Windows                              │
│        │                                                                  │
│ 13:45 ─●─ report.generate                                      ℹ Info    │
│        │  manager@acme.com                                               │
│        │  Executive Report Q1 2026                                        │
│        │  São Paulo, Brazil • Firefox/macOS                               │
│        │                                                                  │
│ 11:20 ─○─ user.role_change                                    🔴 Critical│
│        │  admin@acme.com                                                 │
│        │  user: analyst@acme.com → role: manager                         │
│        │  São Paulo, Brazil • Chrome/Windows                              │
│        │                                                                  │
│ 09:15 ─○─ auth.login_failed                                   ⚠ Warning │
│           unknown@test.com                                               │
│           Login failed: Invalid credentials                               │
│           Moscow, Russia • Unknown device                                 │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Funcionalidades

### Navegação Temporal

**Zoom:**
- Use scroll do mouse para zoom in/out
- Botões [+] [-] para ajustar escala
- Escalas disponíveis: Hora, Dia, Semana, Mês

**Pan:**
- Arraste o timeline horizontalmente
- Setas ← → para navegar
- Botões [Hoje] [Início] [Fim]

**Seleção de Período:**
- Clique e arraste para selecionar intervalo
- Double-click para focar em um dia específico
- Date pickers para range preciso

### Filtros do Timeline

```
┌─────────────────────────────────────┐
│ FILTERS                             │
├─────────────────────────────────────┤
│                                     │
│ Event Types:                        │
│ ☑ All                               │
│ ☐ Authentication only               │
│ ☐ Data changes only                 │
│ ☐ Security events only              │
│                                     │
│ Users:                              │
│ ☑ All users                         │
│ ☐ analyst@acme.com                  │
│ ☐ manager@acme.com                  │
│ ☐ admin@acme.com                    │
│                                     │
│ Severity:                           │
│ ☑ All                               │
│ ☐ Critical only                     │
│ ☐ Warning and above                 │
│                                     │
│ Resources:                          │
│ [Search resource...]                │
│                                     │
│ [Apply Filters] [Clear]             │
└─────────────────────────────────────┘
```

### Visualização de Detalhes

Clique em um evento no timeline para expandir:

```
┌─────────────────────────────────────────────────────────────┐
│ EVENT DETAILS                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🕐 14:32:15.234 UTC (2026-01-21)                           │
│                                                             │
│ Event: assessment.update                                    │
│ User: analyst@acme.com                                      │
│ Resource: NIST-CSF Assessment Q1 2026                      │
│                                                             │
│ ┌─── Changes ───────────────────────────────────────┐      │
│ │ Before              │ After                       │      │
│ ├─────────────────────┼─────────────────────────────┤      │
│ │ status: "draft"     │ status: "completed"         │      │
│ │ score: null         │ score: 85                   │      │
│ │ updated_at: "..."   │ updated_at: "..."           │      │
│ └─────────────────────┴─────────────────────────────┘      │
│                                                             │
│ 📍 Location: São Paulo, SP, Brazil                         │
│ 💻 Device: Windows 11 / Chrome 120.0                       │
│ 🌐 IP: 192.168.1.100                                       │
│ 🔗 Session: sess_abc123                                    │
│                                                             │
│ [View Full Log] [View User Activity] [Related Events]       │
└─────────────────────────────────────────────────────────────┘
```

## Casos de Uso

### 1. Investigar Sequência de Login Suspeito

**Cenário**: Alerta de login de localização incomum.

**Passos:**
1. Abra Timeline View
2. Filtre por usuário: `manager@acme.com`
3. Filtre por eventos: `Authentication`
4. Expanda para ver últimos 7 dias
5. Identifique:
   - Login normal (São Paulo) às 18:00
   - Logout às 18:05
   - Login anômalo (Moscou) às 03:45

```
Timeline:

18:00 ─●─ auth.login                          São Paulo, Brazil
18:05 ─●─ auth.logout                         São Paulo, Brazil
                    ↓ 9h gap
03:45 ─●─ auth.login                          🚨 Moscow, Russia
04:15 ─●─ assessment.view                     Moscow, Russia
04:20 ─●─ auth.logout                         Moscow, Russia
```

**Conclusão**: Impossível viajar em 9h → Possível credential compromise.

### 2. Rastrear Modificações em Assessment

**Cenário**: Score de assessment parece incorreto.

**Passos:**
1. Filtre por resource: `assessment_abc123`
2. Veja timeline de todas as modificações
3. Identifique quem, quando e o quê mudou

```
Timeline do Assessment ASS-001:

Jan 15 09:00 ─●─ assessment.create            manager@acme.com
Jan 15 14:30 ─●─ assessment.answer_update     analyst@acme.com
Jan 16 10:00 ─●─ assessment.answer_update     analyst@acme.com
Jan 17 16:45 ─●─ assessment.answer_update     analyst@acme.com
Jan 18 11:00 ─●─ assessment.submit            analyst@acme.com
                 score: 85 → 72 (recalculated)
```

### 3. Auditoria de Acessos em Período

**Cenário**: Auditoria trimestral de acessos.

**Passos:**
1. Selecione date range: Q1 2026 (Jan-Mar)
2. Exporte timeline completo
3. Analise padrões:
   - Quem acessou o quê
   - Horários de acesso
   - Localizações

### 4. Investigar After-Hours Activity

**Cenário**: Detectar atividade fora do horário comercial.

**Passos:**
1. Configure filtro: 23:00 - 06:00
2. Analise eventos neste período
3. Identifique se são legítimos ou suspeitos

```
After-Hours Activity (2026-01-21):

02:15 ─●─ auth.login                          analyst@acme.com
         São Paulo, Brazil
         ⚠ Unusual: Normal work hours 08:00-18:00

02:30 ─●─ assessment.update                   analyst@acme.com
         Modified 15 questions

03:00 ─●─ report.export                       analyst@acme.com
         Exported all assessments to Excel

03:15 ─●─ auth.logout                         analyst@acme.com
```

## Correlation Analysis

O Timeline permite correlacionar eventos relacionados:

### Correlation ID

Eventos com o mesmo `correlation_id` são parte da mesma transação:

```
Timeline (grouped by correlation):

corr_abc123 ────────────────────────────────────
  │
  ├─ 14:32:15.001 ─●─ assessment.update
  ├─ 14:32:15.015 ─●─ notification.sent
  └─ 14:32:15.234 ─●─ audit_log.created
```

### Session Tracking

Agrupe eventos por sessão:

```
Session: sess_xyz789 (analyst@acme.com)
Duration: 4h 15min

09:15 ─●─ auth.login
09:20 ─●─ dashboard.view
10:30 ─●─ assessment.create
11:45 ─●─ assessment.answer_update
...
13:30 ─●─ auth.logout
```

### User Journey

Visualize a jornada completa de um usuário:

```
User Journey: analyst@acme.com (2026-01-21)

Login ──→ Dashboard ──→ Assessment ──→ Questions ──→ Submit ──→ Logout
 │           │              │              │           │          │
09:15      09:20          09:30        09:45-13:00   13:15      13:30
```

## Exportação de Timeline

### Formatos

| Formato | Uso |
|---------|-----|
| PNG/SVG | Imagem do timeline para relatórios |
| PDF | Documento formatado com detalhes |
| CSV | Dados para análise externa |
| JSON | Integração com outras ferramentas |

### Opções de Exportação

```
┌─────────────────────────────────────┐
│ EXPORT TIMELINE                     │
├─────────────────────────────────────┤
│                                     │
│ Format: [PDF ▼]                     │
│                                     │
│ Include:                            │
│ ☑ Event details                     │
│ ☑ Before/after states               │
│ ☑ Metadata (IP, location)          │
│ ☑ Visual timeline image            │
│ ☐ Related events                    │
│                                     │
│ [Export]                            │
└─────────────────────────────────────┘
```

## Comparação de Períodos

Compare atividade entre dois períodos:

```
┌────────────────────────────────────────────────────────────┐
│ PERIOD COMPARISON                                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Period 1: Jan 1-15, 2026   │ Period 2: Jan 16-31, 2026    │
│ ─────────────────────────────────────────────────────────  │
│                            │                               │
│ Total Events: 5,234        │ Total Events: 6,891 (+31%)   │
│ Active Users: 45           │ Active Users: 52 (+15%)      │
│ Failed Logins: 12          │ Failed Logins: 45 (+275%)    │
│ Data Changes: 1,234        │ Data Changes: 1,567 (+27%)   │
│                            │                               │
│ 🚨 Anomaly: Failed logins increased significantly         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Anomaly Detection

O sistema destaca automaticamente anomalias no timeline:

### Indicadores de Anomalia

| Indicador | Significado |
|-----------|-------------|
| 🔴 | Evento crítico (security-related) |
| ⚠️ | Evento suspeito (unusual pattern) |
| 🌍 | Localização incomum |
| 🕐 | Horário incomum |
| 📈 | Volume anormal |

### Tipos de Anomalias Detectadas

1. **Geographic Impossibility**: Login de locais distantes em pouco tempo
2. **After-Hours Activity**: Atividade fora do horário normal
3. **Velocity Anomaly**: Muitas ações em pouco tempo
4. **New Device**: Login de dispositivo nunca visto
5. **Failed Attempts Spike**: Aumento de tentativas falhas
6. **Privilege Escalation**: Mudança de permissões

## Keyboard Shortcuts

| Tecla | Ação |
|-------|------|
| `←` `→` | Navegar no tempo |
| `+` `-` | Zoom in/out |
| `T` | Ir para hoje |
| `F` | Abrir filtros |
| `E` | Expandir evento selecionado |
| `X` | Exportar timeline |
| `Esc` | Fechar detalhes |

## Dicas de Investigação

### 1. Comece Amplo, Refine Gradualmente

```
1. Veja timeline de 30 dias (overview)
2. Identifique picos ou anomalias
3. Zoom in nas áreas suspeitas
4. Filtre por usuário ou recurso
5. Analise eventos individuais
```

### 2. Use Correlation IDs

Quando investigar um evento, sempre verifique eventos relacionados pelo `correlation_id`.

### 3. Compare Comportamento Normal

Antes de concluir que algo é anômalo, compare com o comportamento habitual do usuário.

### 4. Documente Tudo

Use a feature de **Notes** para anotar suas observações durante a investigação.

## Referências

- [Audit Logs](./audit-logs.md)
- [User Activity](./user-activity.md)
- [Investigation Workflow](./investigation-workflow.md)
- [Correlation Analysis](./correlation.md)

# Investigation Workflow - TrustLayer

---
**Perfil**: Auditor
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-21

---

## Visão Geral

Este documento descreve o workflow padrão para conduzir investigações forenses na plataforma TrustLayer, desde a identificação de alertas até a geração de relatórios finais.

## Workflow de Investigação

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INVESTIGATION WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│    │    1     │    │    2     │    │    3     │    │    4     │           │
│    │ Trigger  │───▶│ Triage   │───▶│ Collect  │───▶│ Analyze  │           │
│    │          │    │          │    │          │    │          │           │
│    └──────────┘    └──────────┘    └──────────┘    └──────────┘           │
│         │                                               │                   │
│         │              ┌──────────┐    ┌──────────┐    │                   │
│         │              │    7     │    │    6     │    │                   │
│         └─────────────▶│ Close    │◀───│ Remediate│◀───┘                   │
│                        │          │    │          │                        │
│                        └──────────┘    └──────────┘                        │
│                             │                                              │
│                             ▼                                              │
│                        ┌──────────┐                                        │
│                        │    5     │                                        │
│                        │ Document │                                        │
│                        │          │                                        │
│                        └──────────┘                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Fase 1: Trigger (Gatilho)

### Fontes de Alerta

| Fonte | Exemplo | Prioridade |
|-------|---------|------------|
| Alerta Automático | Multiple failed logins | P1 |
| Anomaly Detection | Unusual login location | P1 |
| User Report | Suspicious activity reported | P2 |
| Routine Audit | Quarterly review | P3 |
| External Request | Legal/compliance request | P1 |

### Criar Investigação

1. Acesse **Investigation > New Investigation**
2. Preencha os dados iniciais:

```
┌─────────────────────────────────────┐
│ NEW INVESTIGATION                   │
├─────────────────────────────────────┤
│                                     │
│ Title: [________________________]   │
│                                     │
│ Trigger Type:                       │
│ ○ Automated Alert                   │
│ ○ User Report                       │
│ ○ Routine Audit                     │
│ ○ External Request                  │
│                                     │
│ Priority:                           │
│ ○ P1 - Critical                     │
│ ○ P2 - High                         │
│ ○ P3 - Medium                       │
│ ○ P4 - Low                          │
│                                     │
│ Initial Observations:               │
│ [__________________________________]│
│ [__________________________________]│
│                                     │
│ [Create Investigation]              │
└─────────────────────────────────────┘
```

## Fase 2: Triage (Triagem)

### Avaliação Inicial

Responda às seguintes perguntas:

| Pergunta | Impacto |
|----------|---------|
| Há risco imediato à segurança? | Se sim → Escalar para Security |
| Há vazamento de dados em andamento? | Se sim → Escalar + Containment |
| Quantos usuários afetados? | Define escopo |
| Qual a criticidade dos dados? | Define prioridade |
| É necessário preservar evidências? | Inicia coleta imediata |

### Matriz de Priorização

```
                    IMPACTO
                Low    Med    High
              ┌──────┬──────┬──────┐
         High │  P2  │  P1  │  P1  │
URGÊNCIA Med  │  P3  │  P2  │  P1  │
         Low  │  P4  │  P3  │  P2  │
              └──────┴──────┴──────┘
```

### Escalar se Necessário

```
P1 Critical:
  ├─ Notify: Security Team, CISO, Legal
  ├─ SLA: Response < 1h
  └─ Action: Containment imediato

P2 High:
  ├─ Notify: Security Team, Manager
  ├─ SLA: Response < 4h
  └─ Action: Investigação prioritária

P3 Medium:
  ├─ Notify: Security Team
  ├─ SLA: Response < 24h
  └─ Action: Investigação normal

P4 Low:
  ├─ Notify: Queue
  ├─ SLA: Response < 1 week
  └─ Action: Quando disponível
```

## Fase 3: Collect (Coleta)

### Preservar Evidências

Antes de qualquer análise, preserve as evidências:

1. **Export Logs Relevantes**
   ```bash
   # Export completo sem filtros
   curl -X POST "https://api.trustlayer.com/v1/audit-logs/export" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "format": "json",
       "filters": {
         "from": "2026-01-01",
         "to": "2026-01-31"
       },
       "include_metadata": true
     }'
   ```

2. **Capturar Screenshots**
   - Timeline atual
   - User activity
   - Qualquer anomalia visível

3. **Registrar Estado Atual**
   - Sessões ativas
   - Configurações do sistema
   - Permissões do usuário suspeito

### Coletar Informações

**Sobre o Incidente:**
- [ ] Quando ocorreu? (timestamp exato)
- [ ] O que aconteceu? (event type)
- [ ] Quem estava envolvido? (user)
- [ ] Onde ocorreu? (IP, location)
- [ ] Qual recurso afetado? (resource)

**Sobre o Contexto:**
- [ ] Comportamento normal do usuário
- [ ] Histórico de atividade recente
- [ ] Mudanças de configuração recentes
- [ ] Outros eventos correlacionados

### Ferramentas de Coleta

```
┌─────────────────────────────────────┐
│ EVIDENCE COLLECTION                 │
├─────────────────────────────────────┤
│                                     │
│ ☑ Audit Logs (exported)            │
│ ☑ User Activity (exported)          │
│ ☑ Session Data (captured)           │
│ ☐ Timeline Screenshots              │
│ ☐ System Configuration              │
│ ☐ Network Logs (if available)       │
│                                     │
│ Export Location:                    │
│ /investigations/INV-001/evidence/   │
│                                     │
│ [Add Evidence] [Export All]         │
└─────────────────────────────────────┘
```

## Fase 4: Analyze (Análise)

### Timeline Analysis

1. Construa o timeline de eventos
2. Identifique sequência de ações
3. Marque anomalias
4. Procure padrões

```
TIMELINE ANALYSIS - INV-001

Normal Activity
───────────────
09:00 │ ● auth.login (São Paulo)
09:15 │ ● dashboard.view
09:30 │ ● assessment.update
      │
17:45 │ ● auth.logout
      │
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
ANOMALY WINDOW
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
      │
03:45 │ ⚠ auth.login (Moscow) ← SUSPICIOUS
04:00 │ ⚠ assessment.view (bulk)
04:15 │ ⚠ report.export (all data)
04:20 │ ⚠ auth.logout
      │
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

Analysis Notes:
- 9h gap between logout (SP) and login (Moscow)
- Physically impossible travel time
- Different device fingerprint
- Bulk data access unusual for this user
- Likely credential compromise
```

### Correlation Analysis

Conecte eventos relacionados:

```
CORRELATION MAP

                    ┌─────────────┐
                    │ Failed Login│
                    │ (5x in 10m) │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Successful  │
                    │ Login       │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ View     │ │ Export   │ │ Config   │
        │ Data     │ │ Reports  │ │ Change   │
        └──────────┘ └──────────┘ └──────────┘
```

### Hypothesis Testing

Formule e teste hipóteses:

| Hipótese | Evidência a Favor | Evidência Contra | Conclusão |
|----------|-------------------|------------------|-----------|
| Credential Theft | Different location, device | - | Provável |
| Legitimate Travel | - | Impossible travel time | Descartado |
| Shared Credentials | - | MFA enabled | Descartado |
| Session Hijacking | - | New session created | Descartado |

### Indicators of Compromise (IOCs)

Identifique e documente IOCs:

```
IOCs IDENTIFIED

IP Addresses:
- 185.220.101.45 (Moscow, Russia) - Malicious
- Associated with known threat actor

User Agents:
- "Mozilla/5.0 (Android 12; SM-G998B)"
- Different from usual Windows/Chrome

Behavioral:
- After-hours access (03:45 local time)
- Bulk data export (unusual for user)
- No MFA challenge (possible bypass)
```

## Fase 5: Document (Documentação)

### Investigation Report

```markdown
# Investigation Report: INV-001

## Executive Summary
On January 21, 2026, an unauthorized access was detected on the
account of manager@acme.com. Investigation concluded credential
compromise from unknown threat actor in Moscow, Russia.

## Timeline of Events
| Time (UTC) | Event | Details |
|------------|-------|---------|
| 17:45 | Last legitimate logout | São Paulo, Brazil |
| 03:45 | Suspicious login | Moscow, Russia |
| 04:00 | Bulk assessment view | 45 assessments |
| 04:15 | Data export | All reports |
| 04:20 | Logout | - |

## Analysis
### Evidence
- Geographic impossibility (São Paulo → Moscow in 9h)
- Different device fingerprint
- Unusual access pattern

### Root Cause
Likely phishing attack led to credential theft. User reported
suspicious email on Jan 20.

### Impact
- 45 assessments accessed
- All reports exported
- No data modification detected
- No lateral movement detected

## Recommendations
1. Force password reset for affected user
2. Revoke all active sessions
3. Enable MFA (if not already)
4. Block IOC IP addresses
5. Security awareness training

## Appendices
- A: Full audit log export
- B: Timeline screenshots
- C: IOC list
```

### Chain of Custody

Documente quem acessou as evidências:

```
CHAIN OF CUSTODY - INV-001

Date       | Action              | By              | Notes
-----------|---------------------|-----------------|------------------
2026-01-21 | Evidence collected  | auditor@acme    | Initial export
2026-01-21 | Analysis started    | auditor@acme    | Timeline review
2026-01-22 | Evidence shared     | auditor@acme    | Sent to security
2026-01-23 | Report finalized    | auditor@acme    | Final document
```

## Fase 6: Remediate (Remediação)

### Immediate Actions

```
IMMEDIATE REMEDIATION CHECKLIST

☑ Force password reset
☑ Revoke all sessions
☑ Enable/verify MFA
☑ Block malicious IPs
☐ Review access permissions
☐ Check for lateral movement
☐ Notify affected parties
```

### Long-term Actions

```
LONG-TERM REMEDIATION

1. Security Controls
   - [ ] Implement conditional access
   - [ ] Enable login anomaly detection
   - [ ] Review MFA enforcement policy

2. User Training
   - [ ] Phishing awareness training
   - [ ] Password hygiene training
   - [ ] Incident reporting process

3. Technical Improvements
   - [ ] IP allowlisting
   - [ ] Device trust policies
   - [ ] Enhanced logging
```

### Track Remediation

```
REMEDIATION TRACKER

Action                    | Owner    | Due Date   | Status
--------------------------|----------|------------|--------
Password reset            | Security | 2026-01-21 | ✅ Done
Session revocation        | Security | 2026-01-21 | ✅ Done
MFA verification          | Security | 2026-01-22 | ✅ Done
IP blocking               | IT       | 2026-01-22 | ✅ Done
User training             | HR       | 2026-02-01 | 🔄 In Progress
Policy update             | Security | 2026-02-15 | ⏳ Pending
```

## Fase 7: Close (Encerramento)

### Review Final

Antes de encerrar, verifique:

- [ ] Todas as evidências documentadas
- [ ] Root cause identificado
- [ ] Impacto avaliado
- [ ] Remediações implementadas
- [ ] Relatório finalizado
- [ ] Stakeholders notificados
- [ ] Lessons learned documentadas

### Lessons Learned

```
LESSONS LEARNED - INV-001

What Went Well:
- Quick detection (< 2h)
- Evidence preserved correctly
- Clear escalation path

What Could Improve:
- MFA should have been mandatory
- Anomaly detection could be faster
- User training was outdated

Action Items:
- Mandatory MFA for all users (due: Feb 2026)
- Tune anomaly detection (due: Feb 2026)
- Quarterly security training (ongoing)
```

### Close Investigation

```
┌─────────────────────────────────────┐
│ CLOSE INVESTIGATION                 │
├─────────────────────────────────────┤
│                                     │
│ Investigation: INV-001              │
│ Status: Resolved                    │
│                                     │
│ Resolution:                         │
│ ○ True Positive - Incident          │
│ ○ True Positive - Near Miss         │
│ ○ False Positive                    │
│ ○ No Conclusion                     │
│                                     │
│ Root Cause:                         │
│ [Credential phishing___________]   │
│                                     │
│ Impact Level:                       │
│ ○ Critical                          │
│ ○ High                              │
│ ○ Medium                            │
│ ○ Low                               │
│                                     │
│ Closure Notes:                      │
│ [__________________________________]│
│                                     │
│ [Close Investigation]               │
└─────────────────────────────────────┘
```

## Templates

### Investigation Checklist

```markdown
# Investigation Checklist: [INV-XXX]

## Phase 1: Trigger
- [ ] Alert source identified
- [ ] Initial priority assigned
- [ ] Investigation created

## Phase 2: Triage
- [ ] Risk assessment completed
- [ ] Scope defined
- [ ] Escalation decision made

## Phase 3: Collect
- [ ] Evidence preserved
- [ ] Logs exported
- [ ] Screenshots captured
- [ ] Context gathered

## Phase 4: Analyze
- [ ] Timeline constructed
- [ ] Correlations identified
- [ ] Hypotheses tested
- [ ] IOCs documented
- [ ] Root cause identified

## Phase 5: Document
- [ ] Report drafted
- [ ] Chain of custody maintained
- [ ] Stakeholders informed

## Phase 6: Remediate
- [ ] Immediate actions taken
- [ ] Long-term actions planned
- [ ] Remediation tracked

## Phase 7: Close
- [ ] Review completed
- [ ] Lessons learned documented
- [ ] Investigation closed
```

### Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│           INVESTIGATION QUICK REFERENCE             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ SLAs by Priority:                                   │
│ P1: Response < 1h   │ P2: Response < 4h            │
│ P3: Response < 24h  │ P4: Response < 1 week        │
│                                                     │
│ Escalation Contacts:                                │
│ Security Team: security@company.com                │
│ CISO: ciso@company.com                             │
│ Legal: legal@company.com                           │
│                                                     │
│ Key Actions:                                        │
│ 1. Preserve evidence FIRST                         │
│ 2. Contain if active threat                        │
│ 3. Analyze timeline                                │
│ 4. Document everything                             │
│                                                     │
│ Common IOCs:                                        │
│ - Unusual login location                           │
│ - After-hours activity                             │
│ - Bulk data access                                 │
│ - Failed login spike                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Referências

- [Audit Logs](./audit-logs.md)
- [Timeline View](./timeline.md)
- [Correlation Analysis](./correlation.md)
- [NIST Incident Response Guide](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf)

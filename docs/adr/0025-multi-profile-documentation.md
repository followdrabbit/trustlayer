# ADR 0025: Multi-Profile Documentation Strategy

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Documentation Team

---

## Context

TrustLayer precisa de documentação abrangente para diferentes perfis de usuário:

1. **Administradores**: Configuração, troubleshooting, implantação
2. **Sustentação/Desenvolvedores**: Arquitetura, código, manutenção
3. **QA/Testers**: Checklist de features, casos de teste
4. **Usuários Finais**: Guias de uso, recursos, limitações
5. **Auditores**: Logs, compliance, rastreabilidade

Além disso, a documentação deve suportar múltiplos idiomas (PT-BR, EN-US, ES-ES).

## Decision

Adotaremos uma **estrutura de documentação multi-perfil** com os seguintes componentes:

### 1. Estrutura de Diretórios

```
docs/
├── admin/                   # Administradores
│   ├── pt-BR/
│   │   ├── installation.md
│   │   ├── configuration.md
│   │   ├── troubleshooting.md
│   │   ├── integrations.md
│   │   └── backup-restore.md
│   ├── en-US/
│   └── es-ES/
├── developer/               # Sustentação/Desenvolvedores
│   ├── pt-BR/
│   │   ├── architecture.md
│   │   ├── codebase-guide.md
│   │   ├── api-reference.md
│   │   ├── database-schema.md
│   │   └── contributing.md
│   ├── en-US/
│   └── es-ES/
├── qa/                      # QA/Testers
│   ├── pt-BR/
│   │   ├── test-plan.md
│   │   ├── feature-checklist.md
│   │   ├── test-scenarios.md
│   │   └── bug-report-template.md
│   ├── en-US/
│   └── es-ES/
├── user/                    # Usuários Finais
│   ├── pt-BR/
│   │   ├── getting-started.md
│   │   ├── assessments.md
│   │   ├── dashboards.md
│   │   ├── reports.md
│   │   └── settings.md
│   ├── en-US/
│   └── es-ES/
├── auditor/                 # Auditores
│   ├── pt-BR/
│   │   ├── audit-logs.md
│   │   ├── compliance-reports.md
│   │   ├── data-retention.md
│   │   └── forensic-investigation.md
│   ├── en-US/
│   └── es-ES/
└── adr/                     # Architecture Decision Records (EN-US only)
```

### 2. Documentation Standards

Cada documento deve seguir o template:

```markdown
---
profile: [admin|developer|qa|user|auditor]
language: [pt-BR|en-US|es-ES]
version: 1.2.0
last_updated: 2026-01-19
---

# [Título]

## Visão Geral
<!-- Resumo executivo -->

## Público-Alvo
<!-- Quem deve ler este documento -->

## Pré-requisitos
<!-- Conhecimento/ferramentas necessárias -->

## [Conteúdo]
<!-- Seções específicas do documento -->

## Referências
<!-- Links para outros documentos -->

## Glossário
<!-- Termos técnicos explicados -->
```

### 3. Translation Workflow

**Idioma Principal**: PT-BR (source of truth)

**Processo de Tradução**:
1. Escrever em PT-BR primeiro
2. Traduzir para EN-US (alta prioridade)
3. Traduzir para ES-ES (média prioridade)
4. Usar ferramentas de tradução assistida (i18n tooling)
5. Validação por native speakers (se disponível)

**Sincronização**:
- Cada documento tem campo `last_updated`
- Script CI verifica se traduções estão desatualizadas
- Alert quando PT-BR é atualizado mas EN/ES não

### 4. Documentation Portal

Criar portal web para navegação:

```typescript
// docs/portal/index.tsx
const DocPortal = () => {
  const [profile, setProfile] = useState<Profile>('user');
  const [language, setLanguage] = useState<Language>('pt-BR');

  return (
    <div>
      <ProfileSelector value={profile} onChange={setProfile} />
      <LanguageSelector value={language} onChange={setLanguage} />
      <DocumentList profile={profile} language={language} />
      <SearchBar />
    </div>
  );
};
```

Portal features:
- Busca full-text
- Navegação por perfil
- Seletor de idioma
- Dark mode
- PDF export
- Changelog por documento

### 5. Maintenance

**Responsabilidades**:
- **Developers**: Atualizar developer docs quando código mudar
- **Product**: Atualizar user docs quando features mudarem
- **DevOps**: Atualizar admin docs quando infra mudar
- **QA**: Atualizar QA docs quando test cases mudarem

**Review Process**:
- Docs incluídos em PR reviews
- "Documentation" label em PRs
- CI check se docs foram atualizados quando código mudou

## Consequences

### Positivo

✅ **Clareza**: Cada perfil tem docs específicos
✅ **Multilingual**: Suporte a 3 idiomas
✅ **Searchability**: Portal com busca facilita descoberta
✅ **Versionamento**: Docs versionados com releases
✅ **Manutenibilidade**: Estrutura clara facilita updates

### Negativo

❌ **Overhead**: Manter 3 idiomas x 5 perfis = muito conteúdo
❌ **Sincronização**: Risco de traduções ficarem desatualizadas
❌ **Duplicação**: Algum conteúdo pode ser comum entre perfis

### Mitigação

- **Shared content**: Usar includes/partials para conteúdo comum
- **Translation memory**: Reuso de traduções
- **Automation**: Scripts para detectar docs desatualizados

## Implementation Plan

### Phase 1: Structure Setup (Sprint 1)
- [x] Criar estrutura de diretórios
- [ ] Definir templates por perfil
- [ ] Setup portal básico

### Phase 2: Core Documentation (Sprint 2-3)
- [ ] **Admin**: Installation, Configuration, Troubleshooting (PT-BR)
- [ ] **User**: Getting Started, Features (PT-BR)
- [ ] **Developer**: Architecture, API Reference (PT-BR)

### Phase 3: Translation (Sprint 4)
- [ ] Traduzir docs críticos para EN-US
- [ ] Traduzir docs críticos para ES-ES
- [ ] Setup translation workflow

### Phase 4: Advanced Features (Sprint 5)
- [ ] Portal com search
- [ ] PDF generation
- [ ] Versioning per release

### Phase 5: Continuous Improvement (Ongoing)
- [ ] User feedback collection
- [ ] Analytics sobre quais docs são mais acessados
- [ ] Quarterly review e updates

## Content Roadmap

### Admin Docs (Alta Prioridade)
- [x] DEPLOYMENT_K8S.md
- [x] SSO_INTEGRATION.md
- [x] OPENTELEMETRY.md
- [x] WAF_CONFIGURATION.md
- [ ] ON_PREM_INSTALLATION.md (novo)
- [ ] DOCKER_COMPOSE_GUIDE.md (novo)
- [ ] TROUBLESHOOTING_GUIDE.md (consolidar)
- [ ] INTEGRATION_GUIDE.md (Grafana, ELK, etc.)

### Developer Docs (Alta Prioridade)
- [x] ARCHITECTURE.md
- [x] API.md
- [ ] CODEBASE_GUIDE.md (novo)
- [ ] MODULAR_DEVELOPMENT.md (novo)
- [ ] DATABASE_SCHEMA.md (novo)
- [ ] CONTRIBUTING.md (atualizar)

### QA Docs (Média Prioridade)
- [ ] TEST_PLAN.md (novo)
- [ ] FEATURE_CHECKLIST.md (novo)
- [ ] E2E_TEST_GUIDE.md (novo)
- [ ] MANUAL_TEST_SCENARIOS.md (novo)

### User Docs (Alta Prioridade)
- [ ] GETTING_STARTED.md (novo)
- [ ] ASSESSMENTS_GUIDE.md (novo)
- [ ] DASHBOARDS_GUIDE.md (novo)
- [ ] REPORTS_GUIDE.md (novo)
- [ ] SETTINGS_GUIDE.md (novo)
- [ ] FAQ.md (novo)

### Auditor Docs (Média Prioridade)
- [ ] AUDIT_LOGS_GUIDE.md (novo)
- [ ] COMPLIANCE_REPORTS.md (novo)
- [ ] FORENSIC_INVESTIGATION.md (novo)
- [ ] DATA_LINEAGE.md (novo)

## Related ADRs

- ADR-0009: Documentation governance
- ADR-0021: SSO strategy (admin docs)
- ADR-0024: Modular architecture (developer docs)

## References

- [Divio Documentation System](https://documentation.divio.com/)
- [Write the Docs](https://www.writethedocs.org/)
- [Docusaurus](https://docusaurus.io/) (potential portal tech)

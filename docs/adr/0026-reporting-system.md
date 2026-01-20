# ADR 0026: Advanced Reporting System

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Product Team

---

## Context

A funcionalidade atual de exportação de relatórios é limitada:
- Apenas export on-demand (sem agendamento)
- Formatos limitados (HTML, Excel)
- Sem personalização
- Sem histórico de relatórios gerados
- Sem distribuição automática

Empresas enterprise precisam de:
1. Relatórios agendados (diário, semanal, mensal)
2. Envio automático por e-mail
3. Templates customizáveis
4. Múltiplos formatos (PDF, Excel, CSV, JSON)
5. Histórico e versionamento
6. Relatórios multi-domínio (cross-domain)

## Decision

Criar um **sistema de relatórios avançado** com página dedicada e backend de agendamento.

### 1. Arquitetura

```
┌─────────────────┐
│  Reports Page   │ (UI para criar/agendar)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Report Service  │ (lógica de negócio)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Report Engine   │ (geração de PDFs/Excel)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Scheduler       │ (CronJobs/Edge Functions)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Email Service   │ (envio via SMTP/SendGrid)
└─────────────────┘
```

### 2. Database Schema

```sql
-- Tabela de templates de relatórios
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'executive_summary',
    'compliance_status',
    'gap_analysis',
    'trend_analysis',
    'risk_assessment',
    'audit_log',
    'custom'
  )),

  -- Configuração do template
  config JSONB NOT NULL, -- { sections, charts, filters, etc. }

  -- Permissões
  created_by UUID REFERENCES auth.users(id),
  visibility TEXT NOT NULL CHECK (visibility IN ('private', 'shared', 'global')),
  allowed_roles TEXT[], -- ['admin', 'manager', 'auditor']

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de relatórios agendados
CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,

  -- Agendamento
  cron_expression TEXT NOT NULL, -- '0 9 * * 1' (segunda-feira 9h)
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  enabled BOOLEAN NOT NULL DEFAULT true,

  -- Filtros dinâmicos
  filters JSONB, -- { domain_ids, framework_ids, date_range, etc. }

  -- Formato de saída
  output_formats TEXT[] NOT NULL, -- ['pdf', 'excel', 'csv']

  -- Distribuição
  recipients TEXT[] NOT NULL, -- ['user@example.com']
  cc TEXT[],
  subject_template TEXT,
  body_template TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de relatórios gerados
CREATE TABLE report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
  template_id UUID REFERENCES report_templates(id),

  -- Execution info
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Output files
  output_files JSONB, -- [{ format: 'pdf', url: 's3://...', size: 1024 }]

  -- Metadata
  generated_by UUID REFERENCES auth.users(id),
  filters_used JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run_at) WHERE enabled = true;
CREATE INDEX idx_report_runs_schedule ON report_runs(schedule_id);
CREATE INDEX idx_report_runs_status ON report_runs(status);
```

### 3. Report Templates

Templates pré-definidos:

#### Executive Summary
```typescript
const executiveSummaryTemplate: ReportTemplate = {
  type: 'executive_summary',
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      components: [
        { type: 'kpi-cards', metrics: ['total_score', 'critical_gaps', 'compliance_rate'] },
        { type: 'score-trend', period: '90d' },
      ],
    },
    {
      id: 'domains',
      title: 'Domain Breakdown',
      components: [
        { type: 'domain-comparison', domains: ['ai', 'cloud', 'devsecops'] },
        { type: 'framework-coverage', topN: 5 },
      ],
    },
    {
      id: 'gaps',
      title: 'Critical Gaps',
      components: [
        { type: 'gap-table', severity: 'critical', limit: 10 },
      ],
    },
  ],
};
```

#### Compliance Status
```typescript
const complianceStatusTemplate: ReportTemplate = {
  type: 'compliance_status',
  sections: [
    {
      id: 'frameworks',
      title: 'Framework Compliance',
      components: [
        { type: 'framework-grid', frameworks: ['NIST-CSF', 'ISO-27001', 'SOC2'] },
        { type: 'control-heatmap' },
      ],
    },
    {
      id: 'evidence',
      title: 'Evidence Status',
      components: [
        { type: 'evidence-table', missingOnly: false },
      ],
    },
  ],
};
```

### 4. Report Engine

Geração de relatórios usando bibliotecas:

**PDF**: Puppeteer (headless Chrome)
```typescript
import puppeteer from 'puppeteer';

async function generatePDF(reportData: ReportData): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const html = renderReportHTML(reportData);
  await page.setContent(html);

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
  });

  await browser.close();
  return pdf;
}
```

**Excel**: ExcelJS
```typescript
import ExcelJS from 'exceljs';

async function generateExcel(reportData: ReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['Metric', 'Value']);
  summarySheet.addRow(['Total Score', reportData.totalScore]);

  // Sheet 2: Gaps
  const gapsSheet = workbook.addWorksheet('Gaps');
  gapsSheet.columns = [
    { header: 'Category', key: 'category', width: 30 },
    { header: 'Question', key: 'question', width: 50 },
    { header: 'Status', key: 'status', width: 15 },
  ];
  reportData.gaps.forEach(gap => gapsSheet.addRow(gap));

  return await workbook.xlsx.writeBuffer();
}
```

### 5. Scheduling

Edge Function para executar relatórios agendados:

```typescript
// supabase/functions/report-scheduler/index.ts
serve(async (req) => {
  // Buscar schedules que precisam rodar
  const { data: schedules } = await supabase
    .from('report_schedules')
    .select('*')
    .lte('next_run_at', new Date().toISOString())
    .eq('enabled', true);

  for (const schedule of schedules) {
    // Criar report run
    const { data: run } = await supabase
      .from('report_runs')
      .insert({ schedule_id: schedule.id, status: 'pending' })
      .select()
      .single();

    // Enfileirar para processamento
    await queueReportGeneration(run.id);

    // Atualizar next_run_at
    const nextRun = cronParser.parseExpression(schedule.cron_expression, {
      currentDate: new Date(),
      tz: schedule.timezone,
    }).next().toDate();

    await supabase
      .from('report_schedules')
      .update({ last_run_at: new Date(), next_run_at: nextRun })
      .eq('id', schedule.id);
  }

  return new Response('OK');
});
```

### 6. Email Distribution

```typescript
// services/email-service.ts
import nodemailer from 'nodemailer';

export async function sendReportEmail(
  recipients: string[],
  subject: string,
  body: string,
  attachments: Array<{ filename: string; content: Buffer }>
) {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: recipients.join(', '),
    subject,
    html: body,
    attachments,
  });
}
```

### 7. UI - Reports Page

```typescript
// pages/Reports.tsx
export function ReportsPage() {
  return (
    <div>
      <Tabs>
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="schedules">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <ReportGenerator />
        </TabsContent>

        <TabsContent value="schedules">
          <ScheduledReportsList />
        </TabsContent>

        <TabsContent value="history">
          <ReportHistoryTable />
        </TabsContent>

        <TabsContent value="templates">
          <ReportTemplatesLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Consequences

### Positivo

✅ **Automation**: Relatórios enviados automaticamente
✅ **Flexibility**: Templates customizáveis
✅ **Auditability**: Histórico completo de relatórios gerados
✅ **Multi-format**: PDF, Excel, CSV support
✅ **Scheduling**: Cron-based para qualquer periodicidade

### Negativo

❌ **Complexity**: Sistema mais complexo para manter
❌ **Resources**: Geração de PDFs consome CPU/memória
❌ **Storage**: Relatórios históricos consomem storage
❌ **Email deliverability**: Pode cair em spam

### Mitigação

- **Resource limits**: Queue com rate limiting
- **Storage retention**: Auto-delete após 90 dias
- **Email best practices**: SPF, DKIM, DMARC

## Implementation Plan

### Phase 1: Core Infrastructure (Sprint 1-2)
- [ ] Database schema (tables + RLS)
- [ ] Report engine (PDF + Excel generation)
- [ ] Basic templates (executive, compliance)

### Phase 2: Scheduling (Sprint 3)
- [ ] Scheduler Edge Function
- [ ] Cron parser
- [ ] Email service integration

### Phase 3: UI (Sprint 4)
- [ ] Reports page
- [ ] Template builder
- [ ] Schedule creator
- [ ] History viewer

### Phase 4: Advanced Features (Sprint 5-6)
- [ ] Custom templates (drag-and-drop builder)
- [ ] Multi-language reports
- [ ] Chart customization
- [ ] White-label (custom logo, colors)

## Related ADRs

- ADR-0023: Data access abstraction (analytics)
- ADR-0024: Modular architecture (reports as module)

## References

- [Puppeteer](https://pptr.dev/)
- [ExcelJS](https://github.com/exceljs/exceljs)
- [node-cron](https://github.com/node-cron/node-cron)

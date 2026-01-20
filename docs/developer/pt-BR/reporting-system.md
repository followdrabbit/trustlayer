# Advanced Reporting System - Guia do Desenvolvedor

---
**Perfil**: Developer
**Idioma**: PT-BR
**Versão**: 1.0.0
**Última Atualização**: 2026-01-20

---

## Visão Geral

O Advanced Reporting System permite:

✅ Geração de relatórios on-demand em múltiplos formatos (PDF, Excel, CSV, HTML)
✅ Templates customizáveis e reutilizáveis
✅ Agendamento de relatórios com cron expressions
✅ Distribuição automática por email
✅ Histórico completo de execuções
✅ Filtros dinâmicos por domain, framework, date range

## Arquitetura

```
┌─────────────────┐
│  Reports Page   │ (UI)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Report Service  │ (Frontend logic)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Report Engine   │ (Generation logic)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Edge Functions  │ (Serverless)
│ - Scheduler     │
│ - Generator     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │ (PostgreSQL)
│ - Templates     │
│ - Schedules     │
│ - Runs          │
└─────────────────┘
```

## Database Schema

### Tables

#### `report_templates`
```sql
CREATE TABLE report_templates (
  id UUID PRIMARY KEY,
  organization_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN (
    'executive_summary',
    'compliance_status',
    'gap_analysis',
    'trend_analysis',
    'risk_assessment',
    'audit_log',
    'custom'
  )),
  config JSONB NOT NULL,
  visibility TEXT CHECK (visibility IN ('private', 'shared', 'global')),
  allowed_roles TEXT[],
  is_system_template BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `report_schedules`
```sql
CREATE TABLE report_schedules (
  id UUID PRIMARY KEY,
  organization_id UUID,
  template_id UUID REFERENCES report_templates(id),
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  enabled BOOLEAN DEFAULT true,
  filters JSONB,
  output_formats TEXT[],
  recipients TEXT[],
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `report_runs`
```sql
CREATE TABLE report_runs (
  id UUID PRIMARY KEY,
  organization_id UUID,
  schedule_id UUID,
  template_id UUID,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  output_files JSONB,
  filters_used JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Report Templates

### System Templates

TrustLayer inclui 3 templates built-in:

1. **Executive Summary**
   - KPI cards (score, gaps, compliance rate)
   - Score trend chart
   - Domain comparison
   - Critical gaps table

2. **Compliance Status**
   - Framework compliance grid
   - Control heatmap
   - Evidence status table

3. **Gap Analysis**
   - Gap severity chart
   - Gap category breakdown
   - Detailed gap table
   - Remediation timeline

### Custom Templates

Criar template customizado:

```typescript
import { reportService } from '@/lib/reporting';

const template = await reportService.createTemplate({
  name: 'My Custom Report',
  type: 'custom',
  config: {
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        components: [
          {
            type: 'kpi-cards',
            config: {
              metrics: ['total_score', 'critical_gaps'],
            },
          },
        ],
      },
    ],
    styling: {
      primaryColor: '#3B82F6',
      fontFamily: 'Inter',
      pageSize: 'A4',
      orientation: 'portrait',
    },
  },
  visibility: 'shared',
  allowedRoles: ['admin', 'manager'],
});
```

## Report Generation

### On-Demand Generation

```typescript
import { reportEngine } from '@/lib/reporting';

// Generate PDF
const output = await reportEngine.generate({
  templateId: 'template-uuid',
  format: 'pdf',
  filters: {
    domainIds: ['ai-governance'],
    dateRange: 'last_30_days',
  },
  customization: {
    title: 'Q1 2026 Governance Report',
    subtitle: 'AI Governance Domain',
  },
});

console.log(`Report generated: ${output.url}`);
```

### Multiple Formats

```typescript
// Generate in multiple formats
const formats = ['pdf', 'excel', 'csv'];

const outputs = await Promise.all(
  formats.map(format =>
    reportEngine.generate({
      templateId: 'template-uuid',
      format,
      filters: { dateRange: 'last_30_days' },
    })
  )
);
```

## Report Scheduling

### Cron Expressions

```typescript
import { CRON_PRESETS } from '@/lib/reporting';

// Use preset
const dailySchedule = CRON_PRESETS.daily_9am;
// { expression: '0 9 * * *', description: 'Daily at 9:00 AM' }

// Or custom cron
const customCron = '0 17 * * 5'; // Every Friday at 5 PM
```

### Create Schedule

```typescript
import { reportScheduler } from '@/lib/reporting';

const schedule = await reportScheduler.scheduleReport({
  name: 'Weekly Executive Report',
  templateId: 'template-uuid',
  cronExpression: '0 9 * * 1', // Every Monday 9 AM
  timezone: 'America/Sao_Paulo',
  filters: {
    dateRange: 'last_7_days',
  },
  outputFormats: ['pdf', 'excel'],
  recipients: [
    'ceo@company.com',
    'cto@company.com',
  ],
  cc: ['board@company.com'],
  subjectTemplate: 'Weekly Governance Report - {{date}}',
  bodyTemplate: `
    Hi team,

    Attached is the weekly governance report.

    Key Highlights:
    - Overall Score: {{score}}
    - Critical Gaps: {{critical_gaps}}

    Best regards,
    TrustLayer
  `,
});
```

### Update Schedule

```typescript
await reportScheduler.updateSchedule(schedule.id, {
  enabled: false, // Pause schedule
});

await reportScheduler.updateSchedule(schedule.id, {
  recipients: [...schedule.recipients, 'new@company.com'],
});
```

### Manual Trigger

```typescript
// Trigger schedule manually (ignores cron)
const run = await reportScheduler.triggerSchedule(schedule.id);
console.log(`Run triggered: ${run.id}`);
```

## Report Formats

### PDF

Gerado com Puppeteer (headless Chrome):

```typescript
// Backend implementation (Edge Function)
import puppeteer from 'puppeteer';

async function generatePDF(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

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

### Excel

Gerado com ExcelJS:

```typescript
import ExcelJS from 'exceljs';

async function generateExcel(data: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Summary sheet
  const summary = workbook.addWorksheet('Summary');
  summary.addRow(['Metric', 'Value']);
  summary.addRow(['Total Score', data.totalScore]);
  summary.addRow(['Critical Gaps', data.criticalGaps]);

  // Gaps sheet
  const gaps = workbook.addWorksheet('Gaps');
  gaps.columns = [
    { header: 'Category', key: 'category', width: 30 },
    { header: 'Question', key: 'question', width: 50 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  data.gaps.forEach(gap => gaps.addRow(gap));

  return await workbook.xlsx.writeBuffer();
}
```

### CSV

```typescript
function generateCSV(data: any): string {
  const rows = [
    ['Category', 'Metric', 'Value'],
    ...data.items.map(item => [item.category, item.metric, item.value]),
  ];

  return rows.map(row => row.join(',')).join('\n');
}
```

## Email Distribution

### Templates

Email templates suportam variáveis:

```typescript
const subjectTemplate = 'Governance Report - {{date}}';
const bodyTemplate = `
Hi {{recipient_name}},

Your governance report for {{date_range}} is ready.

**Key Metrics:**
- Overall Score: {{score}}%
- Critical Gaps: {{critical_gaps}}
- Compliance Rate: {{compliance_rate}}%

Please review the attached report.

Best regards,
TrustLayer
`;
```

### Variáveis Disponíveis

- `{{date}}` - Data atual
- `{{date_range}}` - Período do relatório
- `{{score}}` - Score overall
- `{{critical_gaps}}` - Número de gaps críticos
- `{{compliance_rate}}` - Taxa de compliance
- `{{organization_name}}` - Nome da organização
- `{{recipient_name}}` - Nome do destinatário

### Tracking

Emails são rastreados na tabela `report_recipients`:

```typescript
// Query recipients
const { data } = await supabase
  .from('report_recipients')
  .select('*')
  .eq('run_id', runId);

// Check delivery status
const delivered = data?.filter(r => r.delivery_status === 'delivered').length;
const failed = data?.filter(r => r.delivery_status === 'failed').length;
```

## Scheduler (Edge Function)

Edge Function executada a cada 5 minutos via cron:

```bash
# Configure in Supabase Dashboard
# Cron: */5 * * * * (every 5 minutes)
# Function: report-scheduler
```

### Workflow

1. Buscar schedules com `next_run_at <= NOW()`
2. Para cada schedule:
   - Criar `report_run` com status `pending`
   - Triggerar geração de relatório
   - Calcular próximo `next_run_at`
   - Atualizar schedule

### Monitoring

```typescript
// Ver próximas execuções
const upcoming = await reportScheduler.getUpcomingRuns(10);

upcoming.forEach(schedule => {
  console.log(`${schedule.name}: ${schedule.next_run_at}`);
});
```

## Filtros Dinâmicos

### Tipos de Filtros

```typescript
interface ReportFilters {
  // By domain
  domainIds?: string[];

  // By framework
  frameworkIds?: string[];

  // By date range
  dateRange?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
  customDateStart?: string;
  customDateEnd?: string;

  // By score
  minScore?: number;
  maxScore?: number;

  // By severity
  severityLevels?: ('critical' | 'high' | 'medium' | 'low')[];

  // Include archived
  includeArchived?: boolean;
}
```

### Aplicando Filtros

```typescript
const filters: ReportFilters = {
  domainIds: ['ai-governance', 'cloud-security'],
  dateRange: 'last_30_days',
  minScore: 70,
  severityLevels: ['critical', 'high'],
};

const output = await reportEngine.generate({
  templateId: 'template-uuid',
  format: 'pdf',
  filters,
});
```

## Customização

### Branding

```typescript
const output = await reportEngine.generate({
  templateId: 'template-uuid',
  format: 'pdf',
  customization: {
    title: 'Custom Report Title',
    subtitle: 'Q1 2026',
    logo: 'https://storage.../org-logo.png',
    footer: '© 2026 Company Inc. All rights reserved.',
  },
});
```

### Styling

```typescript
const template = await reportService.createTemplate({
  name: 'Branded Report',
  config: {
    sections: [...],
    styling: {
      primaryColor: '#FF5733',
      secondaryColor: '#33FF57',
      fontFamily: 'Roboto',
      fontSize: '14px',
      pageSize: 'A4',
      orientation: 'landscape',
      showLogo: true,
      showPageNumbers: true,
      showTimestamp: true,
    },
  },
});
```

## Best Practices

### ✅ Faça

1. **Use templates** para relatórios recorrentes
2. **Agende relatórios** ao invés de gerar manualmente
3. **Filtre dados** para reduzir tamanho e tempo de geração
4. **Monitore falhas** e configure alertas
5. **Teste templates** antes de agendar
6. **Use formatos apropriados**: PDF para apresentações, Excel para análise

### ❌ Evite

1. **Relatórios muito grandes** (>10MB) - divida em múltiplos
2. **Agendamentos muito frequentes** - impacta performance
3. **Muitos recipients** em um único email - use distribuição
4. **Filtros complexos** que demorам muito
5. **Templates com muitas seções** - mantenha simples

## Troubleshooting

### Relatório não foi gerado

```typescript
// Verificar status do run
const { data: run } = await supabase
  .from('report_runs')
  .select('*')
  .eq('id', runId)
  .single();

if (run.status === 'failed') {
  console.error('Error:', run.error_message);
  console.error('Stack:', run.error_stack);
}
```

### Email não foi enviado

```typescript
// Verificar recipients
const { data: recipients } = await supabase
  .from('report_recipients')
  .select('*')
  .eq('run_id', runId);

const failed = recipients.filter(r => r.delivery_status === 'failed');
console.log('Failed recipients:', failed);
```

### Schedule não executou

```typescript
// Verificar próxima execução
const { data: schedule } = await supabase
  .from('report_schedules')
  .select('*')
  .eq('id', scheduleId)
  .single();

console.log('Next run:', schedule.next_run_at);
console.log('Enabled:', schedule.enabled);
console.log('Last status:', schedule.last_run_status);
```

## Próximos Passos

- [ADR-0026: Advanced Reporting System](../../adr/0026-reporting-system.md)
- [Reports Page UI](../../../src/pages/ReportsPage.tsx)
- [Report Engine](../../../src/lib/reporting/report-engine.ts)

## Referências

- [Puppeteer Docs](https://pptr.dev/)
- [ExcelJS Docs](https://github.com/exceljs/exceljs)
- [Cron Expression Guide](https://crontab.guru/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Dúvidas?** Consulte [Developer Docs](./README.md) ou [GitHub Discussions](https://github.com/your-org/trustlayer/discussions)

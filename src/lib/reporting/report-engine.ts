/**
 * Report Engine
 * Generates reports in multiple formats (PDF, Excel, CSV, HTML)
 *
 * This implementation provides client-side report generation capabilities.
 * For server-side generation (PDF with Puppeteer, complex Excel), use the
 * report-generator Edge Function.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ReportTemplate,
  ReportGenerationOptions,
  ReportOutputFile,
  IReportEngine,
  ReportFilters,
  ReportDataSnapshot,
} from './types';

/**
 * Report data structure after fetching
 */
interface ReportData {
  generatedAt: string;
  templateName: string;
  filters: ReportFilters;
  snapshot: ReportDataSnapshot;
  assessments?: AssessmentData[];
  compliance?: ComplianceData;
  audit?: AuditData;
  trends?: TrendData[];
  gaps?: GapData[];
}

interface AssessmentData {
  id: string;
  frameworkId: string;
  frameworkName: string;
  frameworkCode: string;
  questionId: string;
  questionText: string;
  category: string;
  maturityLevel: number;
  evidence?: string;
  notes?: string;
  updatedAt: string;
}

interface ComplianceData {
  totalQuestions: number;
  answeredQuestions: number;
  frameworks: Array<{
    id: string;
    name: string;
    code: string;
    totalQuestions: number;
    answered: number;
    avgMaturity: number;
    complianceRate: number;
  }>;
}

interface AuditData {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByUser: Array<{ userId: string; email: string; count: number }>;
  recentEvents: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    createdAt: string;
  }>;
}

interface TrendData {
  date: string;
  overallScore: number;
  domainScores: Record<string, number>;
}

interface GapData {
  frameworkId: string;
  frameworkName: string;
  questionId: string;
  questionText: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Default templates for system reports
 */
const DEFAULT_TEMPLATES: Record<string, ReportTemplate> = {
  executive_summary: {
    id: 'executive_summary',
    name: 'Executive Summary',
    description: 'High-level overview for executive stakeholders',
    type: 'executive_summary',
    config: {
      sections: [
        {
          id: 'overview',
          title: 'Overview',
          components: ['kpi-cards', 'maturity-gauge'],
        },
        {
          id: 'compliance',
          title: 'Compliance Status',
          components: ['framework-compliance-table'],
        },
        {
          id: 'gaps',
          title: 'Critical Gaps',
          components: ['top-gaps-list'],
        },
      ],
      styling: {
        primaryColor: '#3B82F6',
        showLogo: true,
        showTimestamp: true,
        showPageNumbers: true,
      },
    },
    visibility: 'global',
    allowedRoles: ['admin', 'manager', 'analyst', 'auditor'],
    isSystemTemplate: true,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  compliance_status: {
    id: 'compliance_status',
    name: 'Compliance Status Report',
    description: 'Detailed compliance status by framework',
    type: 'compliance_status',
    config: {
      sections: [
        {
          id: 'summary',
          title: 'Summary',
          components: ['compliance-summary-cards'],
        },
        {
          id: 'by-framework',
          title: 'Framework Details',
          components: ['framework-detail-table'],
        },
        {
          id: 'by-category',
          title: 'By Category',
          components: ['category-breakdown'],
        },
      ],
      styling: {
        primaryColor: '#10B981',
        showLogo: true,
        showTimestamp: true,
        showPageNumbers: true,
      },
    },
    visibility: 'global',
    allowedRoles: ['admin', 'manager', 'analyst', 'auditor'],
    isSystemTemplate: true,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  audit_report: {
    id: 'audit_report',
    name: 'Audit Report',
    description: 'Audit trail and activity log',
    type: 'audit_log',
    config: {
      sections: [
        {
          id: 'summary',
          title: 'Audit Summary',
          components: ['audit-summary-cards'],
        },
        {
          id: 'activity',
          title: 'Activity by User',
          components: ['user-activity-table'],
        },
        {
          id: 'timeline',
          title: 'Recent Events',
          components: ['audit-timeline'],
        },
      ],
      styling: {
        primaryColor: '#8B5CF6',
        showLogo: true,
        showTimestamp: true,
        showPageNumbers: true,
      },
    },
    visibility: 'global',
    allowedRoles: ['admin', 'auditor'],
    isSystemTemplate: true,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

/**
 * Report Engine Implementation
 */
export class ReportEngine implements IReportEngine {
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  }

  /**
   * Generate report in specified format
   */
  async generate(options: ReportGenerationOptions): Promise<ReportOutputFile> {
    const { format, templateId, filters = {} } = options;

    // Fetch template
    const template = await this.fetchTemplate(templateId);

    // Fetch data based on filters
    const data = await this.fetchReportData(template.type, filters);

    // Generate based on format
    let content: Uint8Array | string;
    let contentType: string;
    let fileExtension: string;

    switch (format) {
      case 'pdf':
        // PDF generation requires server-side processing
        return this.generateViaEdgeFunction(options);

      case 'excel':
        // Excel generation requires server-side processing for complex files
        return this.generateViaEdgeFunction(options);

      case 'csv':
        content = await this.generateCSV(data, template);
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;

      case 'html':
        content = await this.generateHTML(data, template);
        contentType = 'text/html';
        fileExtension = 'html';
        break;

      case 'json':
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Upload to storage
    const fileUrl = await this.uploadToStorage(content, fileExtension, contentType, template.name);

    // Calculate size
    const sizeBytes = typeof content === 'string'
      ? new TextEncoder().encode(content).length
      : content.length;

    // Return output file metadata
    return {
      format,
      url: fileUrl,
      sizeBytes,
      checksum: await this.calculateChecksum(content),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate report via Edge Function (for PDF/Excel)
   */
  private async generateViaEdgeFunction(options: ReportGenerationOptions): Promise<ReportOutputFile> {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/report-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        template_id: options.templateId,
        filters: options.filters,
        formats: [options.format],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Report generation failed: ${error.error || response.statusText}`);
    }

    const result = await response.json();
    if (!result.success || !result.files?.length) {
      throw new Error('Report generation returned no files');
    }

    return result.files[0];
  }

  /**
   * Generate PDF report
   * Note: Actual PDF rendering requires Puppeteer on server-side
   */
  async generatePDF(data: ReportData, template: ReportTemplate): Promise<Buffer> {
    // Generate HTML first, then convert to PDF via Edge Function
    const html = await this.generateHTML(data, template);

    const response = await fetch(`${this.supabaseUrl}/functions/v1/report-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        html_content: html,
        format: 'pdf',
        template_name: template.name,
      }),
    });

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generate Excel report
   */
  async generateExcel(data: ReportData, template: ReportTemplate): Promise<Buffer> {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/report-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        data,
        template,
        format: 'excel',
      }),
    });

    if (!response.ok) {
      throw new Error(`Excel generation failed: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generate CSV report
   */
  async generateCSV(data: ReportData, template: ReportTemplate): Promise<string> {
    const rows: string[][] = [];

    // Header info
    rows.push(['Report', template.name]);
    rows.push(['Generated', data.generatedAt]);
    rows.push(['']);

    // Add assessment data if available
    if (data.assessments?.length) {
      rows.push(['ASSESSMENT DETAILS']);
      rows.push(['Framework', 'Category', 'Question', 'Maturity Level', 'Evidence', 'Notes']);

      for (const assessment of data.assessments) {
        rows.push([
          assessment.frameworkName,
          assessment.category,
          assessment.questionText,
          String(assessment.maturityLevel),
          assessment.evidence || '',
          assessment.notes || '',
        ]);
      }
      rows.push(['']);
    }

    // Add compliance data if available
    if (data.compliance) {
      rows.push(['COMPLIANCE SUMMARY']);
      rows.push(['Framework', 'Code', 'Total Questions', 'Answered', 'Avg Maturity', 'Compliance Rate']);

      for (const fw of data.compliance.frameworks) {
        rows.push([
          fw.name,
          fw.code,
          String(fw.totalQuestions),
          String(fw.answered),
          fw.avgMaturity.toFixed(2),
          `${fw.complianceRate.toFixed(1)}%`,
        ]);
      }
      rows.push(['']);
    }

    // Add gaps data if available
    if (data.gaps?.length) {
      rows.push(['GAPS ANALYSIS']);
      rows.push(['Framework', 'Category', 'Question', 'Current Level', 'Target Level', 'Gap', 'Priority']);

      for (const gap of data.gaps) {
        rows.push([
          gap.frameworkName,
          gap.category,
          gap.questionText,
          String(gap.currentLevel),
          String(gap.targetLevel),
          String(gap.gap),
          gap.priority,
        ]);
      }
      rows.push(['']);
    }

    // Add audit data if available
    if (data.audit) {
      rows.push(['AUDIT SUMMARY']);
      rows.push(['Total Events', String(data.audit.totalEvents)]);
      rows.push(['']);

      if (data.audit.recentEvents?.length) {
        rows.push(['RECENT EVENTS']);
        rows.push(['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User ID']);

        for (const event of data.audit.recentEvents) {
          rows.push([
            event.createdAt,
            event.action,
            event.entityType,
            event.entityId,
            event.userId,
          ]);
        }
      }
    }

    // Convert to CSV string
    return rows
      .map(row => row.map(cell => this.escapeCsv(cell)).join(','))
      .join('\n');
  }

  /**
   * Generate HTML report
   */
  async generateHTML(data: ReportData, template: ReportTemplate): Promise<string> {
    const { styling = {} } = template.config;
    const primaryColor = styling.primaryColor || '#3B82F6';

    let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${styling.fontFamily || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"};
      font-size: ${styling.fontSize || '14px'};
      color: #1f2937;
      background: #ffffff;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 3px solid ${primaryColor};
    }
    .header h1 {
      color: ${primaryColor};
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .header .subtitle { color: #6b7280; font-size: 16px; }
    .header .meta { margin-top: 15px; color: #9ca3af; font-size: 12px; }
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 20px;
      padding-left: 15px;
      border-left: 4px solid ${primaryColor};
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: linear-gradient(135deg, ${primaryColor}10, ${primaryColor}05);
      border: 1px solid ${primaryColor}30;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
    }
    .metric-value {
      font-size: 36px;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 8px;
    }
    .metric-label { color: #6b7280; font-size: 14px; font-weight: 500; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 12px 15px;
      text-align: left;
    }
    th {
      background: ${primaryColor};
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    tr:nth-child(even) { background: #f9fafb; }
    tr:hover { background: #f3f4f6; }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-high { background: #dcfce7; color: #166534; }
    .status-medium { background: #fef3c7; color: #92400e; }
    .status-low { background: #fee2e2; color: #991b1b; }
    .footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${styling.showLogo ? '<img src="/logo.png" alt="TrustLayer" style="max-height: 50px; margin-bottom: 15px;">' : ''}
    <h1>${template.name}</h1>
    <p class="subtitle">${template.description || ''}</p>
    ${styling.showTimestamp ? `<p class="meta">Generated: ${new Date(data.generatedAt).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</p>` : ''}
  </div>
`;

    // Summary metrics
    if (data.snapshot) {
      html += `
  <div class="section">
    <h2 class="section-title">Summary</h2>
    <div class="metric-grid">
      ${data.snapshot.totalAssessments !== undefined ? `
        <div class="metric-card">
          <div class="metric-value">${data.snapshot.totalAssessments}</div>
          <div class="metric-label">Total Assessments</div>
        </div>` : ''}
      ${data.snapshot.totalFrameworks !== undefined ? `
        <div class="metric-card">
          <div class="metric-value">${data.snapshot.totalFrameworks}</div>
          <div class="metric-label">Frameworks</div>
        </div>` : ''}
      ${data.snapshot.averageScore !== undefined ? `
        <div class="metric-card">
          <div class="metric-value">${data.snapshot.averageScore.toFixed(1)}</div>
          <div class="metric-label">Average Score</div>
        </div>` : ''}
      ${data.snapshot.criticalGaps !== undefined ? `
        <div class="metric-card">
          <div class="metric-value">${data.snapshot.criticalGaps}</div>
          <div class="metric-label">Critical Gaps</div>
        </div>` : ''}
    </div>
  </div>
`;
    }

    // Compliance status
    if (data.compliance?.frameworks?.length) {
      html += `
  <div class="section">
    <h2 class="section-title">Compliance Status</h2>
    <table>
      <thead>
        <tr>
          <th>Framework</th>
          <th>Code</th>
          <th>Questions</th>
          <th>Answered</th>
          <th>Avg. Maturity</th>
          <th>Compliance</th>
        </tr>
      </thead>
      <tbody>
`;
      for (const fw of data.compliance.frameworks) {
        const statusClass = fw.complianceRate >= 70 ? 'status-high' : fw.complianceRate >= 40 ? 'status-medium' : 'status-low';
        html += `
        <tr>
          <td><strong>${fw.name}</strong></td>
          <td>${fw.code}</td>
          <td>${fw.totalQuestions}</td>
          <td>${fw.answered}</td>
          <td>${fw.avgMaturity.toFixed(2)}</td>
          <td><span class="status-badge ${statusClass}">${fw.complianceRate.toFixed(1)}%</span></td>
        </tr>
`;
      }
      html += `
      </tbody>
    </table>
  </div>
`;
    }

    // Gaps analysis
    if (data.gaps?.length) {
      html += `
  <div class="section">
    <h2 class="section-title">Gap Analysis</h2>
    <table>
      <thead>
        <tr>
          <th>Framework</th>
          <th>Category</th>
          <th>Question</th>
          <th>Current</th>
          <th>Target</th>
          <th>Gap</th>
          <th>Priority</th>
        </tr>
      </thead>
      <tbody>
`;
      for (const gap of data.gaps.slice(0, 20)) {
        const priorityClass = gap.priority === 'critical' ? 'status-low' : gap.priority === 'high' ? 'status-medium' : 'status-high';
        html += `
        <tr>
          <td>${gap.frameworkName}</td>
          <td>${gap.category}</td>
          <td>${gap.questionText.substring(0, 80)}${gap.questionText.length > 80 ? '...' : ''}</td>
          <td>${gap.currentLevel}</td>
          <td>${gap.targetLevel}</td>
          <td>${gap.gap}</td>
          <td><span class="status-badge ${priorityClass}">${gap.priority}</span></td>
        </tr>
`;
      }
      html += `
      </tbody>
    </table>
    ${data.gaps.length > 20 ? `<p style="color: #6b7280; font-style: italic;">Showing 20 of ${data.gaps.length} gaps</p>` : ''}
  </div>
`;
    }

    // Audit section
    if (data.audit) {
      html += `
  <div class="section">
    <h2 class="section-title">Audit Trail</h2>
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-value">${data.audit.totalEvents}</div>
        <div class="metric-label">Total Events</div>
      </div>
    </div>
`;
      if (data.audit.recentEvents?.length) {
        html += `
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Action</th>
          <th>Entity Type</th>
          <th>Entity ID</th>
        </tr>
      </thead>
      <tbody>
`;
        for (const event of data.audit.recentEvents.slice(0, 15)) {
          html += `
        <tr>
          <td>${new Date(event.createdAt).toLocaleString('pt-BR')}</td>
          <td>${event.action}</td>
          <td>${event.entityType}</td>
          <td><code>${event.entityId?.substring(0, 8)}...</code></td>
        </tr>
`;
        }
        html += `
      </tbody>
    </table>
`;
      }
      html += `
  </div>
`;
    }

    // Footer
    html += `
  <div class="footer">
    ${styling.showPageNumbers ? '<p>Page 1</p>' : ''}
    <p>Generated by TrustLayer Security Governance Platform</p>
    <p>This report is confidential and intended for authorized recipients only.</p>
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Fetch template from database or use default
   */
  async fetchTemplate(templateId: string): Promise<ReportTemplate> {
    // Check if it's a system template
    if (DEFAULT_TEMPLATES[templateId]) {
      return DEFAULT_TEMPLATES[templateId];
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error || !data) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      type: data.type,
      config: data.config,
      visibility: data.visibility,
      allowedRoles: data.allowed_roles || [],
      isSystemTemplate: data.is_system_template,
      version: data.version,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Fetch report data based on type and filters
   */
  async fetchReportData(reportType: string, filters: ReportFilters): Promise<ReportData> {
    const data: ReportData = {
      generatedAt: new Date().toISOString(),
      templateName: reportType,
      filters,
      snapshot: {},
    };

    // Get current user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .single();

    const orgId = profile?.organization_id;

    // Fetch based on report type
    switch (reportType) {
      case 'executive_summary':
        data.compliance = await this.fetchComplianceData(orgId, filters);
        data.gaps = await this.fetchGapsData(orgId, filters);
        data.snapshot = {
          totalFrameworks: data.compliance?.frameworks.length || 0,
          totalAssessments: data.compliance?.totalQuestions || 0,
          averageScore: this.calculateAverageScore(data.compliance),
          criticalGaps: data.gaps?.filter(g => g.priority === 'critical').length || 0,
        };
        break;

      case 'compliance_status':
        data.compliance = await this.fetchComplianceData(orgId, filters);
        data.assessments = await this.fetchAssessmentData(orgId, filters);
        data.snapshot = {
          totalFrameworks: data.compliance?.frameworks.length || 0,
          totalAssessments: data.compliance?.totalQuestions || 0,
          averageScore: this.calculateAverageScore(data.compliance),
        };
        break;

      case 'gap_analysis':
        data.gaps = await this.fetchGapsData(orgId, filters);
        data.snapshot = {
          criticalGaps: data.gaps?.filter(g => g.priority === 'critical').length || 0,
          totalAssessments: data.gaps?.length || 0,
        };
        break;

      case 'audit_log':
        data.audit = await this.fetchAuditData(orgId, filters);
        data.snapshot = {
          totalAssessments: data.audit?.totalEvents || 0,
        };
        break;

      case 'trend_analysis':
        data.trends = await this.fetchTrendData(orgId, filters);
        break;

      default:
        // Fetch all available data for custom reports
        data.compliance = await this.fetchComplianceData(orgId, filters);
        data.assessments = await this.fetchAssessmentData(orgId, filters);
        data.gaps = await this.fetchGapsData(orgId, filters);
    }

    return data;
  }

  /**
   * Fetch compliance data
   */
  private async fetchComplianceData(orgId: string | undefined, filters: ReportFilters): Promise<ComplianceData> {
    let query = supabase
      .from('answers')
      .select(`
        id,
        framework_id,
        question_id,
        maturity_level,
        default_frameworks!inner(id, name, code)
      `);

    if (filters.frameworkIds?.length) {
      query = query.in('framework_id', filters.frameworkIds);
    }

    const { data: answers, error } = await query;

    if (error) {
      console.error('Failed to fetch compliance data:', error);
      return { totalQuestions: 0, answeredQuestions: 0, frameworks: [] };
    }

    // Group by framework
    const frameworkMap = new Map<string, {
      id: string;
      name: string;
      code: string;
      answers: number[];
    }>();

    for (const answer of answers || []) {
      const fw = answer.default_frameworks as any;
      if (!frameworkMap.has(fw.id)) {
        frameworkMap.set(fw.id, {
          id: fw.id,
          name: fw.name,
          code: fw.code,
          answers: [],
        });
      }
      frameworkMap.get(fw.id)!.answers.push(answer.maturity_level || 0);
    }

    const frameworks = Array.from(frameworkMap.values()).map(fw => {
      const avgMaturity = fw.answers.length > 0
        ? fw.answers.reduce((a, b) => a + b, 0) / fw.answers.length
        : 0;
      return {
        id: fw.id,
        name: fw.name,
        code: fw.code,
        totalQuestions: fw.answers.length,
        answered: fw.answers.filter(a => a > 0).length,
        avgMaturity,
        complianceRate: (avgMaturity / 5) * 100,
      };
    });

    return {
      totalQuestions: answers?.length || 0,
      answeredQuestions: answers?.filter(a => (a.maturity_level || 0) > 0).length || 0,
      frameworks,
    };
  }

  /**
   * Fetch assessment data
   */
  private async fetchAssessmentData(orgId: string | undefined, filters: ReportFilters): Promise<AssessmentData[]> {
    let query = supabase
      .from('answers')
      .select(`
        id,
        framework_id,
        question_id,
        maturity_level,
        evidence,
        notes,
        updated_at,
        default_questions!inner(id, text, category),
        default_frameworks!inner(id, name, code)
      `)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (filters.frameworkIds?.length) {
      query = query.in('framework_id', filters.frameworkIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch assessment data:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      frameworkId: row.framework_id,
      frameworkName: (row.default_frameworks as any)?.name || '',
      frameworkCode: (row.default_frameworks as any)?.code || '',
      questionId: row.question_id,
      questionText: (row.default_questions as any)?.text || '',
      category: (row.default_questions as any)?.category || '',
      maturityLevel: row.maturity_level || 0,
      evidence: row.evidence,
      notes: row.notes,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Fetch gaps data
   */
  private async fetchGapsData(orgId: string | undefined, filters: ReportFilters): Promise<GapData[]> {
    const assessments = await this.fetchAssessmentData(orgId, filters);

    // Calculate gaps (target level is 5 for all)
    const targetLevel = 5;

    return assessments
      .filter(a => a.maturityLevel < targetLevel)
      .map(a => ({
        frameworkId: a.frameworkId,
        frameworkName: a.frameworkName,
        questionId: a.questionId,
        questionText: a.questionText,
        category: a.category,
        currentLevel: a.maturityLevel,
        targetLevel,
        gap: targetLevel - a.maturityLevel,
        priority: this.calculateGapPriority(targetLevel - a.maturityLevel),
      }))
      .sort((a, b) => b.gap - a.gap);
  }

  /**
   * Fetch audit data
   */
  private async fetchAuditData(orgId: string | undefined, filters: ReportFilters): Promise<AuditData> {
    let query = supabase
      .from('change_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (filters.dateRange === 'last_7_days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte('created_at', sevenDaysAgo.toISOString());
    } else if (filters.dateRange === 'last_30_days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('created_at', thirtyDaysAgo.toISOString());
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Failed to fetch audit data:', error);
      return { totalEvents: 0, eventsByAction: {}, eventsByUser: [], recentEvents: [] };
    }

    // Aggregate by action
    const eventsByAction: Record<string, number> = {};
    const userCounts = new Map<string, { email: string; count: number }>();

    for (const log of logs || []) {
      eventsByAction[log.action] = (eventsByAction[log.action] || 0) + 1;

      if (log.user_id) {
        if (!userCounts.has(log.user_id)) {
          userCounts.set(log.user_id, { email: log.user_id, count: 0 });
        }
        userCounts.get(log.user_id)!.count++;
      }
    }

    return {
      totalEvents: logs?.length || 0,
      eventsByAction,
      eventsByUser: Array.from(userCounts.entries())
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      recentEvents: (logs || []).slice(0, 50).map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        userId: log.user_id,
        createdAt: log.created_at,
      })),
    };
  }

  /**
   * Fetch trend data
   */
  private async fetchTrendData(orgId: string | undefined, filters: ReportFilters): Promise<TrendData[]> {
    const { data: snapshots, error } = await supabase
      .from('maturity_snapshots')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Failed to fetch trend data:', error);
      return [];
    }

    return (snapshots || []).map(snapshot => ({
      date: snapshot.created_at,
      overallScore: snapshot.overall_score || 0,
      domainScores: snapshot.domain_scores || {},
    }));
  }

  /**
   * Upload file to storage
   */
  async uploadToStorage(
    content: Uint8Array | string,
    format: string,
    contentType: string,
    templateName: string
  ): Promise<string> {
    const fileName = `${templateName.replace(/\s+/g, '_')}_${Date.now()}.${format}`;
    const filePath = `reports/${fileName}`;

    const blob = typeof content === 'string'
      ? new Blob([content], { type: contentType })
      : new Blob([content], { type: contentType });

    const { data, error } = await supabase.storage
      .from('reports')
      .upload(filePath, blob, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Failed to upload report:', error);
      // Return a data URL as fallback
      if (typeof content === 'string') {
        return `data:${contentType};base64,${btoa(content)}`;
      }
      throw new Error(`Failed to upload report: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  /**
   * Calculate file checksum (SHA-256)
   */
  private async calculateChecksum(content: Uint8Array | string): Promise<string> {
    const data = typeof content === 'string'
      ? new TextEncoder().encode(content)
      : content;
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Escape CSV value
   */
  private escapeCsv(value: string): string {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Calculate average score from compliance data
   */
  private calculateAverageScore(compliance?: ComplianceData): number {
    if (!compliance?.frameworks?.length) return 0;
    const total = compliance.frameworks.reduce((sum, fw) => sum + fw.avgMaturity, 0);
    return total / compliance.frameworks.length;
  }

  /**
   * Calculate gap priority
   */
  private calculateGapPriority(gap: number): 'critical' | 'high' | 'medium' | 'low' {
    if (gap >= 4) return 'critical';
    if (gap >= 3) return 'high';
    if (gap >= 2) return 'medium';
    return 'low';
  }

  /**
   * Get available system templates
   */
  getSystemTemplates(): ReportTemplate[] {
    return Object.values(DEFAULT_TEMPLATES);
  }
}

// Singleton instance
export const reportEngine = new ReportEngine();

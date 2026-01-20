/**
 * Advanced Reporting System Types
 */

export type ReportType =
  | 'executive_summary'
  | 'compliance_status'
  | 'gap_analysis'
  | 'trend_analysis'
  | 'risk_assessment'
  | 'audit_log'
  | 'custom';

export type ReportVisibility = 'private' | 'shared' | 'global';

export type ReportOutputFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'html';

export type ReportRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export type DeliveryStatus = 'sent' | 'delivered' | 'failed' | 'bounced';

/**
 * Report Template Component Configuration
 */
export interface ReportComponent {
  type: string;
  title?: string;
  config?: Record<string, any>;
}

/**
 * Report Template Section
 */
export interface ReportSection {
  id: string;
  title: string;
  components: (string | ReportComponent)[];
  order?: number;
}

/**
 * Report Template Configuration
 */
export interface ReportTemplateConfig {
  sections: ReportSection[];
  charts?: any[];
  filters?: Record<string, any>;
  styling?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    fontSize?: string;
    pageSize?: 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    showLogo?: boolean;
    showPageNumbers?: boolean;
    showTimestamp?: boolean;
  };
}

/**
 * Report Template
 */
export interface ReportTemplate {
  id: string;
  organizationId?: string;
  name: string;
  description?: string;
  type: ReportType;
  config: ReportTemplateConfig;
  createdBy?: string;
  visibility: ReportVisibility;
  allowedRoles: string[];
  isSystemTemplate: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Report Schedule Filters
 */
export interface ReportFilters {
  domainIds?: string[];
  frameworkIds?: string[];
  dateRange?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year' | 'custom';
  customDateStart?: string;
  customDateEnd?: string;
  includeArchived?: boolean;
  minScore?: number;
  maxScore?: number;
  severityLevels?: string[];
  [key: string]: any;
}

/**
 * Report Schedule
 */
export interface ReportSchedule {
  id: string;
  organizationId: string;
  templateId: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  filters: ReportFilters;
  outputFormats: ReportOutputFormat[];
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  subjectTemplate?: string;
  bodyTemplate?: string;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed' | 'running';
  nextRunAt?: string;
  runCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Report Output File
 */
export interface ReportOutputFile {
  format: ReportOutputFormat;
  url: string;
  sizeBytes: number;
  checksum?: string;
  generatedAt?: string;
}

/**
 * Report Run Data Snapshot
 */
export interface ReportDataSnapshot {
  totalAssessments?: number;
  totalFrameworks?: number;
  averageScore?: number;
  criticalGaps?: number;
  dataAsOf?: string;
  [key: string]: any;
}

/**
 * Report Run
 */
export interface ReportRun {
  id: string;
  organizationId: string;
  scheduleId?: string;
  templateId?: string;
  status: ReportRunStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  errorStack?: string;
  retryCount: number;
  outputFiles: ReportOutputFile[];
  generatedBy?: string;
  filtersUsed: ReportFilters;
  dataSnapshot?: ReportDataSnapshot;
  createdAt: string;
}

/**
 * Report Recipient
 */
export interface ReportRecipient {
  id: string;
  runId: string;
  email: string;
  sentAt: string;
  deliveryStatus: DeliveryStatus;
  openedAt?: string;
  createdAt: string;
}

/**
 * Report Generation Options
 */
export interface ReportGenerationOptions {
  templateId: string;
  format: ReportOutputFormat;
  filters?: ReportFilters;
  customization?: {
    title?: string;
    subtitle?: string;
    logo?: string;
    footer?: string;
  };
  emailTo?: string[];
  emailCc?: string[];
  emailSubject?: string;
  emailBody?: string;
}

/**
 * Report Engine Interface
 */
export interface IReportEngine {
  generate(options: ReportGenerationOptions): Promise<ReportOutputFile>;
  generatePDF(data: any, template: ReportTemplate): Promise<Buffer>;
  generateExcel(data: any, template: ReportTemplate): Promise<Buffer>;
  generateCSV(data: any, template: ReportTemplate): Promise<string>;
  generateHTML(data: any, template: ReportTemplate): Promise<string>;
}

/**
 * Report Scheduler Interface
 */
export interface IReportScheduler {
  scheduleReport(schedule: Partial<ReportSchedule>): Promise<ReportSchedule>;
  updateSchedule(id: string, updates: Partial<ReportSchedule>): Promise<ReportSchedule>;
  deleteSchedule(id: string): Promise<void>;
  triggerSchedule(id: string): Promise<ReportRun>;
  getUpcomingRuns(limit?: number): Promise<ReportSchedule[]>;
}

/**
 * Cron Expression Helper
 */
export interface CronSchedule {
  expression: string;
  timezone: string;
  description: string;
}

export const CRON_PRESETS: Record<string, CronSchedule> = {
  daily_9am: {
    expression: '0 9 * * *',
    timezone: 'America/Sao_Paulo',
    description: 'Daily at 9:00 AM',
  },
  weekly_monday: {
    expression: '0 9 * * 1',
    timezone: 'America/Sao_Paulo',
    description: 'Every Monday at 9:00 AM',
  },
  weekly_friday: {
    expression: '0 17 * * 5',
    timezone: 'America/Sao_Paulo',
    description: 'Every Friday at 5:00 PM',
  },
  monthly_first: {
    expression: '0 9 1 * *',
    timezone: 'America/Sao_Paulo',
    description: 'First day of month at 9:00 AM',
  },
  monthly_last: {
    expression: '0 9 L * *',
    timezone: 'America/Sao_Paulo',
    description: 'Last day of month at 9:00 AM',
  },
  quarterly: {
    expression: '0 9 1 1,4,7,10 *',
    timezone: 'America/Sao_Paulo',
    description: 'First day of quarter at 9:00 AM',
  },
};

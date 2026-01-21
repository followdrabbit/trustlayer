/**
 * Email Service Client
 * Client-side API for sending emails via the email-service Edge Function
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export interface EmailAttachment {
  filename: string;
  content?: string; // Base64 encoded
  url?: string; // URL to fetch content from
  contentType?: string;
}

export interface EmailTemplate {
  id: 'report-ready' | 'scheduled-report' | 'anomaly-alert';
  variables: Record<string, string>;
}

export interface SendEmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  html?: string;
  text?: string;
  template?: EmailTemplate;
  attachments?: EmailAttachment[];
  replyTo?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  metadata?: Record<string, string>;
}

export interface EmailRecipientStatus {
  email: string;
  status: 'sent' | 'failed';
  error?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  recipients: EmailRecipientStatus[];
}

// ============================================
// Email Service
// ============================================

/**
 * Sends an email using the email-service Edge Function
 */
export async function sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
  // Validate required fields
  if (!request.to || request.to.length === 0) {
    return {
      success: false,
      error: 'At least one recipient is required',
      provider: 'none',
      recipients: [],
    };
  }

  if (!request.subject && !request.template) {
    return {
      success: false,
      error: 'Subject or template is required',
      provider: 'none',
      recipients: [],
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke<SendEmailResponse>('email-service', {
      body: request,
    });

    if (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'unknown',
        recipients: request.to.map(email => ({ email, status: 'failed', error: error.message })),
      };
    }

    return data || {
      success: false,
      error: 'No response from email service',
      provider: 'unknown',
      recipients: [],
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send email:', err);
    return {
      success: false,
      error: errorMessage,
      provider: 'unknown',
      recipients: request.to.map(email => ({ email, status: 'failed', error: errorMessage })),
    };
  }
}

/**
 * Sends a report notification email
 */
export async function sendReportNotification(options: {
  recipients: string[];
  cc?: string[];
  reportName: string;
  reportFormat: string;
  downloadUrl: string;
  customSubject?: string;
  customBody?: string;
}): Promise<SendEmailResponse> {
  const { recipients, cc, reportName, reportFormat, downloadUrl, customSubject, customBody } = options;

  if (customSubject && customBody) {
    // Use custom content
    return sendEmail({
      to: recipients,
      cc,
      subject: customSubject,
      html: customBody,
      trackOpens: true,
      trackClicks: true,
      metadata: {
        type: 'report-notification',
        report_name: reportName,
      },
    });
  }

  // Use template
  return sendEmail({
    to: recipients,
    cc,
    template: {
      id: 'report-ready',
      variables: {
        report_name: reportName,
        generated_at: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        format: reportFormat.toUpperCase(),
        download_url: downloadUrl,
      },
    },
    trackOpens: true,
    trackClicks: true,
    metadata: {
      type: 'report-notification',
      report_name: reportName,
    },
  });
}

/**
 * Sends a scheduled report email
 */
export async function sendScheduledReportEmail(options: {
  recipients: string[];
  cc?: string[];
  reportName: string;
  period: string;
  metrics: {
    overallScore: number;
    criticalGaps: number;
    complianceRate: number;
    trend: string;
  };
  dashboardUrl: string;
  unsubscribeUrl?: string;
  attachments?: EmailAttachment[];
}): Promise<SendEmailResponse> {
  const { recipients, cc, reportName, period, metrics, dashboardUrl, unsubscribeUrl, attachments } = options;

  return sendEmail({
    to: recipients,
    cc,
    template: {
      id: 'scheduled-report',
      variables: {
        report_name: reportName,
        period,
        overall_score: metrics.overallScore.toString(),
        critical_gaps: metrics.criticalGaps.toString(),
        compliance_rate: metrics.complianceRate.toString(),
        trend: metrics.trend,
        dashboard_url: dashboardUrl,
        unsubscribe_url: unsubscribeUrl || dashboardUrl,
      },
    },
    attachments,
    trackOpens: true,
    trackClicks: true,
    metadata: {
      type: 'scheduled-report',
      report_name: reportName,
      period,
    },
  });
}

/**
 * Sends an anomaly alert email
 */
export async function sendAnomalyAlert(options: {
  recipients: string[];
  anomalyType: string;
  severity: 'high' | 'medium' | 'low';
  detectedAt: Date;
  userEmail: string;
  ipAddress: string;
  location: string;
  description: string;
  recommendation: string;
  investigateUrl: string;
}): Promise<SendEmailResponse> {
  const {
    recipients,
    anomalyType,
    severity,
    detectedAt,
    userEmail,
    ipAddress,
    location,
    description,
    recommendation,
    investigateUrl,
  } = options;

  const severityLabels = {
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
  };

  return sendEmail({
    to: recipients,
    template: {
      id: 'anomaly-alert',
      variables: {
        anomaly_type: anomalyType,
        severity,
        severity_label: severityLabels[severity],
        detected_at: detectedAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        user_email: userEmail,
        ip_address: ipAddress,
        location,
        description,
        recommendation,
        investigate_url: investigateUrl,
      },
    },
    trackOpens: true,
    trackClicks: true,
    metadata: {
      type: 'anomaly-alert',
      anomaly_type: anomalyType,
      severity,
    },
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a list of email addresses
 */
export function validateEmailList(emails: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    if (isValidEmail(email.trim())) {
      valid.push(email.trim().toLowerCase());
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}

/**
 * Parses a comma-separated list of emails
 */
export function parseEmailList(input: string): string[] {
  return input
    .split(/[,;\n]/)
    .map(e => e.trim())
    .filter(e => e.length > 0);
}

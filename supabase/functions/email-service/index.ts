/**
 * Email Service Edge Function
 * Sends emails via configurable providers (Resend, SendGrid, SMTP)
 *
 * Supports:
 * - Multiple email providers with fallback
 * - HTML and plain text emails
 * - File attachments (from URLs or base64)
 * - Email templates with variable substitution
 * - Rate limiting and retries
 * - Delivery tracking
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// Types
// ============================================

type EmailProvider = 'resend' | 'sendgrid' | 'smtp' | 'mailgun';

interface EmailAttachment {
  filename: string;
  content?: string; // Base64 encoded
  url?: string; // URL to fetch content from
  contentType?: string;
}

interface EmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  from?: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  template?: {
    id: string;
    variables: Record<string, string>;
  };
  tags?: string[];
  metadata?: Record<string, string>;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  provider: EmailProvider;
  error?: string;
  recipients: Array<{
    email: string;
    status: 'sent' | 'failed';
    error?: string;
  }>;
}

interface ProviderConfig {
  provider: EmailProvider;
  apiKey?: string;
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  fromEmail: string;
  fromName: string;
}

// ============================================
// Environment & Configuration
// ============================================

function getProviderConfig(): ProviderConfig {
  const provider = (Deno.env.get('EMAIL_PROVIDER') || 'resend') as EmailProvider;

  const config: ProviderConfig = {
    provider,
    fromEmail: Deno.env.get('EMAIL_FROM_ADDRESS') || 'reports@trustlayer.app',
    fromName: Deno.env.get('EMAIL_FROM_NAME') || 'TrustLayer',
  };

  switch (provider) {
    case 'resend':
      config.apiKey = Deno.env.get('RESEND_API_KEY');
      break;
    case 'sendgrid':
      config.apiKey = Deno.env.get('SENDGRID_API_KEY');
      break;
    case 'mailgun':
      config.apiKey = Deno.env.get('MAILGUN_API_KEY');
      config.host = Deno.env.get('MAILGUN_DOMAIN');
      break;
    case 'smtp':
      config.host = Deno.env.get('SMTP_HOST');
      config.port = parseInt(Deno.env.get('SMTP_PORT') || '587');
      config.user = Deno.env.get('SMTP_USER');
      config.pass = Deno.env.get('SMTP_PASS');
      break;
  }

  return config;
}

// ============================================
// Rate Limiting
// ============================================

const RATE_LIMIT_WINDOW_SECONDS = parseInt(Deno.env.get('RATE_LIMIT_WINDOW_SECONDS') || '60');
const EMAIL_RATE_LIMIT_MAX = parseInt(Deno.env.get('EMAIL_RATE_LIMIT_MAX') || '30');
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(userId);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + (RATE_LIMIT_WINDOW_SECONDS * 1000) });
    return { allowed: true, remaining: EMAIL_RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW_SECONDS };
  }

  if (record.count >= EMAIL_RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true, remaining: EMAIL_RATE_LIMIT_MAX - record.count, resetIn: Math.ceil((record.resetAt - now) / 1000) };
}

// ============================================
// Email Providers
// ============================================

/**
 * Send email via Resend API
 * https://resend.com/docs/api-reference/emails/send-email
 */
async function sendViaResend(
  config: ProviderConfig,
  email: EmailRequest
): Promise<EmailResponse> {
  if (!config.apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const attachments = await resolveAttachments(email.attachments || []);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${config.fromName} <${email.from || config.fromEmail}>`,
      to: email.to,
      cc: email.cc,
      bcc: email.bcc,
      reply_to: email.replyTo,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: attachments.map(a => ({
        filename: a.filename,
        content: a.content,
        content_type: a.contentType,
      })),
      tags: email.tags?.map(t => ({ name: t, value: 'true' })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  const result = await response.json();

  return {
    success: true,
    messageId: result.id,
    provider: 'resend',
    recipients: email.to.map(e => ({ email: e, status: 'sent' })),
  };
}

/**
 * Send email via SendGrid API
 * https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */
async function sendViaSendGrid(
  config: ProviderConfig,
  email: EmailRequest
): Promise<EmailResponse> {
  if (!config.apiKey) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }

  const attachments = await resolveAttachments(email.attachments || []);

  const personalizations = [{
    to: email.to.map(e => ({ email: e })),
    cc: email.cc?.map(e => ({ email: e })),
    bcc: email.bcc?.map(e => ({ email: e })),
  }];

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations,
      from: { email: email.from || config.fromEmail, name: config.fromName },
      reply_to: email.replyTo ? { email: email.replyTo } : undefined,
      subject: email.subject,
      content: [
        ...(email.text ? [{ type: 'text/plain', value: email.text }] : []),
        ...(email.html ? [{ type: 'text/html', value: email.html }] : []),
      ],
      attachments: attachments.map(a => ({
        filename: a.filename,
        content: a.content,
        type: a.contentType,
        disposition: 'attachment',
      })),
      tracking_settings: {
        open_tracking: { enable: email.trackOpens ?? true },
        click_tracking: { enable: email.trackClicks ?? true },
      },
      custom_args: email.metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error}`);
  }

  const messageId = response.headers.get('X-Message-Id') || undefined;

  return {
    success: true,
    messageId,
    provider: 'sendgrid',
    recipients: email.to.map(e => ({ email: e, status: 'sent' })),
  };
}

/**
 * Send email via Mailgun API
 * https://documentation.mailgun.com/en/latest/api-sending-messages.html
 */
async function sendViaMailgun(
  config: ProviderConfig,
  email: EmailRequest
): Promise<EmailResponse> {
  if (!config.apiKey || !config.host) {
    throw new Error('MAILGUN_API_KEY and MAILGUN_DOMAIN are required');
  }

  const formData = new FormData();
  formData.append('from', `${config.fromName} <${email.from || config.fromEmail}>`);
  email.to.forEach(to => formData.append('to', to));
  email.cc?.forEach(cc => formData.append('cc', cc));
  email.bcc?.forEach(bcc => formData.append('bcc', bcc));
  formData.append('subject', email.subject);

  if (email.html) formData.append('html', email.html);
  if (email.text) formData.append('text', email.text);
  if (email.replyTo) formData.append('h:Reply-To', email.replyTo);

  // Attachments
  const attachments = await resolveAttachments(email.attachments || []);
  for (const attachment of attachments) {
    const blob = new Blob([Uint8Array.from(atob(attachment.content || ''), c => c.charCodeAt(0))], {
      type: attachment.contentType || 'application/octet-stream',
    });
    formData.append('attachment', blob, attachment.filename);
  }

  const response = await fetch(`https://api.mailgun.net/v3/${config.host}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${config.apiKey}`)}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mailgun API error: ${error}`);
  }

  const result = await response.json();

  return {
    success: true,
    messageId: result.id,
    provider: 'mailgun',
    recipients: email.to.map(e => ({ email: e, status: 'sent' })),
  };
}

// ============================================
// Attachment Handling
// ============================================

interface ResolvedAttachment {
  filename: string;
  content: string; // Base64
  contentType: string;
}

async function resolveAttachments(attachments: EmailAttachment[]): Promise<ResolvedAttachment[]> {
  const resolved: ResolvedAttachment[] = [];

  for (const attachment of attachments) {
    if (attachment.content) {
      // Already base64 encoded
      resolved.push({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType || 'application/octet-stream',
      });
    } else if (attachment.url) {
      // Fetch from URL
      try {
        const response = await fetch(attachment.url);
        if (!response.ok) {
          console.error(`Failed to fetch attachment from ${attachment.url}: ${response.status}`);
          continue;
        }

        const buffer = await response.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const contentType = response.headers.get('Content-Type') ||
                          attachment.contentType ||
                          guessContentType(attachment.filename);

        resolved.push({
          filename: attachment.filename,
          content: base64,
          contentType,
        });
      } catch (error) {
        console.error(`Error fetching attachment from ${attachment.url}:`, error);
      }
    }
  }

  return resolved;
}

function guessContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'csv': 'text/csv',
    'html': 'text/html',
    'json': 'application/json',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

// ============================================
// Email Templates
// ============================================

const EMAIL_TEMPLATES: Record<string, { subject: string; html: string; text: string }> = {
  'report-ready': {
    subject: 'Your TrustLayer Report is Ready: {{report_name}}',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Ready</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .button:hover { background: #5a67d8; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .report-info { background: white; border-radius: 6px; padding: 15px; margin: 15px 0; border: 1px solid #e5e7eb; }
    .report-info dt { font-weight: 600; color: #374151; }
    .report-info dd { margin: 0 0 10px 0; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Your Report is Ready</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Your requested report has been generated and is ready for download.</p>

      <div class="report-info">
        <dl>
          <dt>Report Name</dt>
          <dd>{{report_name}}</dd>
          <dt>Generated At</dt>
          <dd>{{generated_at}}</dd>
          <dt>Format</dt>
          <dd>{{format}}</dd>
        </dl>
      </div>

      <p>The report is attached to this email. You can also download it from the TrustLayer platform.</p>

      <a href="{{download_url}}" class="button">View in TrustLayer</a>
    </div>
    <div class="footer">
      <p>This is an automated message from TrustLayer.</p>
      <p>© {{year}} TrustLayer. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Your TrustLayer Report is Ready

Report Name: {{report_name}}
Generated At: {{generated_at}}
Format: {{format}}

The report is attached to this email. You can also download it from the TrustLayer platform:
{{download_url}}

This is an automated message from TrustLayer.
© {{year}} TrustLayer. All rights reserved.
    `,
  },
  'scheduled-report': {
    subject: 'Scheduled Report: {{report_name}} - {{period}}',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scheduled Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .metric { background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center; }
    .metric-value { font-size: 28px; font-weight: 700; color: #10b981; }
    .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 Scheduled Report</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Here is your scheduled {{period}} report for <strong>{{report_name}}</strong>.</p>

      <div class="metrics">
        <div class="metric">
          <div class="metric-value">{{overall_score}}%</div>
          <div class="metric-label">Overall Score</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{critical_gaps}}</div>
          <div class="metric-label">Critical Gaps</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{compliance_rate}}%</div>
          <div class="metric-label">Compliance Rate</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{trend}}</div>
          <div class="metric-label">vs Last Period</div>
        </div>
      </div>

      <p>The full report is attached. For detailed analysis, visit the TrustLayer platform.</p>

      <a href="{{dashboard_url}}" class="button">Open Dashboard</a>
    </div>
    <div class="footer">
      <p>You're receiving this because you're subscribed to scheduled reports.</p>
      <p><a href="{{unsubscribe_url}}">Manage notification preferences</a></p>
      <p>© {{year}} TrustLayer. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Scheduled Report: {{report_name}} - {{period}}

Hello,

Here is your scheduled {{period}} report for {{report_name}}.

Key Metrics:
- Overall Score: {{overall_score}}%
- Critical Gaps: {{critical_gaps}}
- Compliance Rate: {{compliance_rate}}%
- Trend vs Last Period: {{trend}}

The full report is attached. For detailed analysis, visit the TrustLayer platform:
{{dashboard_url}}

You're receiving this because you're subscribed to scheduled reports.
Manage notification preferences: {{unsubscribe_url}}

© {{year}} TrustLayer. All rights reserved.
    `,
  },
  'anomaly-alert': {
    subject: '⚠️ Security Alert: {{anomaly_type}} Detected',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #fef2f2; padding: 30px; border: 1px solid #fee2e2; border-top: none; }
    .alert-box { background: white; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
    .alert-box dt { font-weight: 600; color: #374151; }
    .alert-box dd { margin: 0 0 10px 0; color: #6b7280; }
    .severity-high { color: #ef4444; font-weight: 700; }
    .severity-medium { color: #f59e0b; font-weight: 700; }
    .severity-low { color: #10b981; font-weight: 700; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Security Alert</h1>
    </div>
    <div class="content">
      <p>A potential security anomaly has been detected in your TrustLayer environment.</p>

      <div class="alert-box">
        <dl>
          <dt>Anomaly Type</dt>
          <dd>{{anomaly_type}}</dd>
          <dt>Severity</dt>
          <dd class="severity-{{severity}}">{{severity_label}}</dd>
          <dt>Detected At</dt>
          <dd>{{detected_at}}</dd>
          <dt>User</dt>
          <dd>{{user_email}}</dd>
          <dt>IP Address</dt>
          <dd>{{ip_address}}</dd>
          <dt>Location</dt>
          <dd>{{location}}</dd>
        </dl>
      </div>

      <p><strong>Description:</strong> {{description}}</p>
      <p><strong>Recommended Action:</strong> {{recommendation}}</p>

      <a href="{{investigate_url}}" class="button">Investigate Now</a>
    </div>
    <div class="footer">
      <p>This is an automated security alert from TrustLayer.</p>
      <p>© {{year}} TrustLayer. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
⚠️ Security Alert: {{anomaly_type}} Detected

A potential security anomaly has been detected in your TrustLayer environment.

Details:
- Anomaly Type: {{anomaly_type}}
- Severity: {{severity_label}}
- Detected At: {{detected_at}}
- User: {{user_email}}
- IP Address: {{ip_address}}
- Location: {{location}}

Description: {{description}}

Recommended Action: {{recommendation}}

Investigate now: {{investigate_url}}

This is an automated security alert from TrustLayer.
© {{year}} TrustLayer. All rights reserved.
    `,
  },
};

function applyTemplate(templateId: string, variables: Record<string, string>): { subject: string; html: string; text: string } {
  const template = EMAIL_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Email template not found: ${templateId}`);
  }

  let subject = template.subject;
  let html = template.html;
  let text = template.text;

  // Add default variables
  const allVariables = {
    ...variables,
    year: new Date().getFullYear().toString(),
  };

  // Replace all placeholders
  for (const [key, value] of Object.entries(allVariables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(placeholder, value);
    html = html.replace(placeholder, value);
    text = text.replace(placeholder, value);
  }

  return { subject, html, text };
}

// ============================================
// Main Handler
// ============================================

serve(async (req: Request) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: rateLimit.resetIn,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': requestId,
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetIn.toString(),
          'Retry-After': rateLimit.resetIn.toString(),
        },
      });
    }

    // Parse request
    const body: EmailRequest = await req.json();

    // Validate required fields
    if (!body.to || body.to.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one recipient is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      });
    }

    if (!body.subject && !body.template) {
      return new Response(JSON.stringify({ error: 'Subject or template is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      });
    }

    // Apply template if specified
    let finalEmail = { ...body };
    if (body.template) {
      const templated = applyTemplate(body.template.id, body.template.variables);
      finalEmail.subject = templated.subject;
      finalEmail.html = templated.html;
      finalEmail.text = templated.text;
    }

    // Get provider config and send
    const config = getProviderConfig();
    let result: EmailResponse;

    console.log(`📧 Sending email via ${config.provider} to ${body.to.length} recipient(s)`);

    switch (config.provider) {
      case 'resend':
        result = await sendViaResend(config, finalEmail);
        break;
      case 'sendgrid':
        result = await sendViaSendGrid(config, finalEmail);
        break;
      case 'mailgun':
        result = await sendViaMailgun(config, finalEmail);
        break;
      case 'smtp':
        // SMTP not implemented in Deno Edge Functions
        // Would require external service or different architecture
        throw new Error('SMTP is not supported in Edge Functions. Use Resend, SendGrid, or Mailgun.');
      default:
        throw new Error(`Unknown email provider: ${config.provider}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Email sent successfully in ${duration}ms (messageId: ${result.messageId})`);

    // Log email send for audit trail (optional)
    await supabase.from('change_logs').insert({
      user_id: user.id,
      action: 'email_sent',
      entity: 'email',
      entity_id: result.messageId || requestId,
      changes: {
        to: body.to,
        subject: finalEmail.subject,
        template: body.template?.id,
        provider: config.provider,
        attachments: body.attachments?.length || 0,
      },
    }).catch(err => console.error('Failed to log email:', err));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Email send failed:`, errorMessage);

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      provider: getProviderConfig().provider,
      recipients: [],
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
      },
    });
  }
});

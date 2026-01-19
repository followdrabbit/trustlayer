import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildCorsHeaders,
  isJsonRequest,
  isOriginAllowed,
  isRequestTooLarge,
  jsonHeaders,
  withRequestId,
} from "../_shared/http.ts";
import { logError, logWarn } from "../_shared/logging.ts";
import { fetchWithProxy } from "../_shared/proxy.ts";
import { resolveSecretValue } from "../_shared/secrets.ts";
import {
  checkRateLimit,
  getRateLimitConfig,
  rateLimitHeaders,
} from "../_shared/rateLimit.ts";
import { validateExternalUrl } from "../_shared/urlValidation.ts";

const corsOptions = {
  allowHeaders: "authorization, x-client-info, apikey, content-type",
  allowMethods: "POST, OPTIONS",
};

interface AuditEvent {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  changes: Record<string, unknown>;
  userId: string | null;
  ipAddress: string | null;
  geoCountry: string | null;
  geoCity: string | null;
  deviceType: string | null;
  browserName: string | null;
  osName: string | null;
  createdAt: string;
}

interface SIEMIntegration {
  id: string;
  name: string;
  endpoint_url: string;
  format: 'json' | 'cef' | 'leef' | 'syslog';
  auth_type: 'none' | 'bearer' | 'basic' | 'api_key';
  auth_header: string | null;
  auth_value_encrypted: string | null;
  include_ip: boolean;
  include_geo: boolean;
  include_device: boolean;
  severity_filter: string[] | null;
  entity_filter: string[] | null;
  action_filter: string[] | null;
}

const rateLimitConfig = getRateLimitConfig("SIEM_FORWARD");
const ALLOWED_ENTITY_TYPES = new Set(['framework', 'question', 'setting', 'answer']);
const ALLOWED_ACTIONS = new Set(['create', 'update', 'delete', 'disable', 'enable']);
const MAX_ENTITY_ID_LENGTH = 200;
const MAX_USER_ID_LENGTH = 200;
const MAX_CHANGES_JSON = 20_000;

// Convert event to CEF (Common Event Format) for ArcSight, Splunk, etc.
function toCEF(event: AuditEvent, integration: SIEMIntegration): string {
  const severity = getSeverity(event.action);
  const extension = buildCEFExtension(event, integration);
  
  // CEF:Version|Device Vendor|Device Product|Device Version|Signature ID|Name|Severity|Extension
  return `CEF:0|SecurityAssessment|AuditLog|1.0|${event.action}|${event.entityType} ${event.action}|${severity}|${extension}`;
}

// Convert event to LEEF (Log Event Extended Format) for IBM QRadar
function toLEEF(event: AuditEvent, integration: SIEMIntegration): string {
  const parts: string[] = [];
  
  parts.push(`devTime=${new Date(event.createdAt).toISOString()}`);
  parts.push(`cat=${event.entityType}`);
  parts.push(`sev=${getSeverity(event.action)}`);
  parts.push(`action=${event.action}`);
  parts.push(`resource=${event.entityId}`);
  
  if (event.userId) parts.push(`usrName=${event.userId}`);
  if (integration.include_ip && event.ipAddress) parts.push(`src=${event.ipAddress}`);
  if (integration.include_geo) {
    if (event.geoCountry) parts.push(`country=${event.geoCountry}`);
    if (event.geoCity) parts.push(`city=${event.geoCity}`);
  }
  if (integration.include_device) {
    if (event.deviceType) parts.push(`devType=${event.deviceType}`);
    if (event.browserName) parts.push(`browser=${event.browserName}`);
    if (event.osName) parts.push(`os=${event.osName}`);
  }
  
  // LEEF:Version|Vendor|Product|Version|EventID|Extension
  return `LEEF:2.0|SecurityAssessment|AuditLog|1.0|${event.id}|${parts.join('\t')}`;
}

// Convert to Syslog format (RFC 5424)
function toSyslog(event: AuditEvent, integration: SIEMIntegration): string {
  const severity = getSeverity(event.action);
  const facility = 13; // log audit
  const priority = facility * 8 + mapSeverityToSyslog(severity);
  const timestamp = new Date(event.createdAt).toISOString();
  const hostname = 'security-assessment';
  const appName = 'audit-log';
  
  const structuredData = buildStructuredData(event, integration);
  const message = `${event.entityType} ${event.action}: ${event.entityId}`;
  
  return `<${priority}>1 ${timestamp} ${hostname} ${appName} - ${event.id} ${structuredData} ${message}`;
}

// Convert to JSON format
function toJSON(event: AuditEvent, integration: SIEMIntegration): string {
  const output: Record<string, unknown> = {
    timestamp: event.createdAt,
    eventId: event.id,
    severity: getSeverity(event.action),
    category: 'audit',
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    changes: event.changes,
  };
  
  if (event.userId) output.userId = event.userId;
  if (integration.include_ip && event.ipAddress) output.sourceIp = event.ipAddress;
  if (integration.include_geo) {
    if (event.geoCountry || event.geoCity) {
      output.geo = {
        country: event.geoCountry,
        city: event.geoCity,
      };
    }
  }
  if (integration.include_device) {
    output.device = {
      type: event.deviceType,
      browser: event.browserName,
      os: event.osName,
    };
  }
  
  return JSON.stringify(output);
}

function getSeverity(action: string): number {
  switch (action) {
    case 'delete': return 7;
    case 'disable': return 5;
    case 'create': return 3;
    case 'update': return 3;
    case 'enable': return 3;
    default: return 5;
  }
}

function mapSeverityToSyslog(severity: number): number {
  if (severity >= 7) return 2; // Critical
  if (severity >= 5) return 4; // Warning
  return 6; // Informational
}

function buildCEFExtension(event: AuditEvent, integration: SIEMIntegration): string {
  const parts: string[] = [];
  
  parts.push(`rt=${new Date(event.createdAt).getTime()}`);
  parts.push(`cs1=${event.entityId}`);
  parts.push(`cs1Label=EntityID`);
  
  if (event.userId) {
    parts.push(`suser=${event.userId}`);
  }
  
  if (integration.include_ip && event.ipAddress) {
    parts.push(`src=${event.ipAddress}`);
  }
  
  if (integration.include_geo) {
    if (event.geoCountry) parts.push(`cs2=${event.geoCountry} cs2Label=Country`);
    if (event.geoCity) parts.push(`cs3=${event.geoCity} cs3Label=City`);
  }
  
  if (integration.include_device) {
    if (event.deviceType) parts.push(`cs4=${event.deviceType} cs4Label=DeviceType`);
    if (event.browserName) parts.push(`cs5=${event.browserName} cs5Label=Browser`);
  }
  
  return parts.join(' ');
}

function buildStructuredData(event: AuditEvent, integration: SIEMIntegration): string {
  const parts: string[] = [];
  
  parts.push(`entityType="${event.entityType}"`);
  parts.push(`action="${event.action}"`);
  parts.push(`entityId="${event.entityId}"`);
  
  if (event.userId) parts.push(`userId="${event.userId}"`);
  if (integration.include_ip && event.ipAddress) parts.push(`srcIp="${event.ipAddress}"`);
  if (integration.include_geo) {
    if (event.geoCountry) parts.push(`country="${event.geoCountry}"`);
    if (event.geoCity) parts.push(`city="${event.geoCity}"`);
  }
  
  return `[audit@12345 ${parts.join(' ')}]`;
}

function formatEvent(event: AuditEvent, integration: SIEMIntegration): string {
  switch (integration.format) {
    case 'cef': return toCEF(event, integration);
    case 'leef': return toLEEF(event, integration);
    case 'syslog': return toSyslog(event, integration);
    case 'json':
    default: return toJSON(event, integration);
  }
}

function validateEndpointUrl(raw: string): string | null {
  const result = validateExternalUrl(raw);
  if (result.ok) return null;
  switch (result.reason) {
    case "invalid_url":
      return "Invalid SIEM endpoint URL";
    case "invalid_protocol":
      return "SIEM endpoint must use http or https";
    case "credentials_in_url":
      return "SIEM endpoint must not include credentials";
    case "local_host":
    case "private_network":
      return "SIEM endpoint must not use local/private addresses";
    default:
      return "Invalid SIEM endpoint URL";
  }
}

async function forwardToSIEM(
  event: AuditEvent,
  integration: SIEMIntegration
): Promise<{ success: boolean; latencyMs: number; responseStatus?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const urlError = validateEndpointUrl(integration.endpoint_url);
    if (urlError) {
      return { success: false, latencyMs: 0, error: urlError };
    }

    const formattedEvent = formatEvent(event, integration);
    
    const headers: Record<string, string> = {
      'Content-Type': integration.format === 'json' ? 'application/json' : 'text/plain',
    };
    
    // Add authentication
    if (integration.auth_type !== 'none') {
      const authValue = await resolveSecretValue(integration.auth_value_encrypted, {
        decodeBase64: false,
      });
      if (!authValue) {
        return { success: false, latencyMs: 0, error: "Missing SIEM auth value" };
      }
      
      switch (integration.auth_type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${authValue}`;
          break;
        case 'basic':
          headers['Authorization'] = `Basic ${authValue}`;
          break;
        case 'api_key':
          headers[integration.auth_header || 'X-API-Key'] = authValue;
          break;
      }
    }
    
    const response = await fetchWithProxy(integration.endpoint_url, {
      method: 'POST',
      headers,
      body: formattedEvent,
      signal: AbortSignal.timeout(5000),
    });
    
    const latencyMs = Date.now() - startTime;
    
    if (!response.ok) {
      return { 
        success: false,
        latencyMs,
        responseStatus: response.status,
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
    
    return { success: true, latencyMs, responseStatus: response.status };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return { 
      success: false,
      latencyMs,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

function shouldForwardEvent(event: AuditEvent, integration: SIEMIntegration): boolean {
  // Check entity filter
  if (integration.entity_filter && integration.entity_filter.length > 0) {
    if (!integration.entity_filter.includes(event.entityType)) {
      return false;
    }
  }
  
  // Check action filter
  if (integration.action_filter && integration.action_filter.length > 0) {
    if (!integration.action_filter.includes(event.action)) {
      return false;
    }
  }
  
  return true;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const path = new URL(req.url).pathname;
  const logContext = { requestId, path };
  const origin = req.headers.get("Origin");
  const baseJsonHeaders = (originValue: string | null) =>
    withRequestId(jsonHeaders(originValue, corsOptions), requestId);
  const baseCorsHeaders = (originValue: string | null) =>
    withRequestId(buildCorsHeaders(originValue, corsOptions), requestId);

  if (!isOriginAllowed(origin)) {
    logWarn("Origin not allowed", logContext, { origin });
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      { status: 403, headers: baseJsonHeaders(origin) }
    );
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: baseCorsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: baseJsonHeaders(origin) }
    );
  }

  if (isRequestTooLarge(req)) {
    return new Response(
      JSON.stringify({ error: "Request body too large" }),
      { status: 413, headers: baseJsonHeaders(origin) }
    );
  }

  if (!isJsonRequest(req)) {
    return new Response(
      JSON.stringify({ error: "Content-Type must be application/json" }),
      { status: 415, headers: baseJsonHeaders(origin) }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = await resolveSecretValue(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    if (!supabaseServiceKey) {
      logError("Supabase configuration missing", logContext);
      return new Response(
        JSON.stringify({ error: "Supabase configuration missing" }),
        { status: 500, headers: baseJsonHeaders(origin) }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      logWarn("Missing authorization token", logContext);
      return new Response(
        JSON.stringify({ error: "Missing authorization token" }),
        { status: 401, headers: baseJsonHeaders(origin) }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logWarn("Invalid or expired token", logContext);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: baseJsonHeaders(origin) }
      );
    }

    if (rateLimitConfig.limit > 0) {
      const rate = checkRateLimit(`siem-forward:${user.id}`, rateLimitConfig.limit, rateLimitConfig.windowMs);
      if (!rate.allowed) {
        logWarn("Rate limit exceeded", { ...logContext, userId: user.id });
        const retryAfter = Math.ceil(rate.resetMs / 1000);
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: {
              ...baseJsonHeaders(origin),
              ...rateLimitHeaders(rateLimitConfig.limit, rate.remaining, rate.resetMs),
              "Retry-After": String(retryAfter),
            },
          }
        );
      }
    }

    let body: { event?: AuditEvent; userId?: string };
    try {
      body = await req.json();
    } catch {
      logWarn("Invalid JSON body", logContext);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    const { event, userId } = body;
    
    if (!event || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing event or userId" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (typeof userId !== "string" || userId.length > MAX_USER_ID_LENGTH) {
      logWarn("Invalid userId", logContext);
      return new Response(
        JSON.stringify({ error: "Invalid userId" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (typeof event !== "object" || event === null || Array.isArray(event)) {
      logWarn("Invalid event payload", logContext);
      return new Response(
        JSON.stringify({ error: "Invalid event payload" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    const eventRecord = event as AuditEvent;

    if (!Number.isFinite(eventRecord.id)) {
      logWarn("Invalid event id", logContext);
      return new Response(
        JSON.stringify({ error: "Invalid event id" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (!ALLOWED_ENTITY_TYPES.has(eventRecord.entityType)) {
      logWarn("Invalid entityType", logContext, { entityType: eventRecord.entityType });
      return new Response(
        JSON.stringify({ error: "Invalid entityType" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (!ALLOWED_ACTIONS.has(eventRecord.action)) {
      logWarn("Invalid action", logContext, { action: eventRecord.action });
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (typeof eventRecord.entityId !== "string" || eventRecord.entityId.length > MAX_ENTITY_ID_LENGTH) {
      logWarn("Invalid entityId", logContext);
      return new Response(
        JSON.stringify({ error: "Invalid entityId" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (typeof eventRecord.createdAt !== "string" || Number.isNaN(Date.parse(eventRecord.createdAt))) {
      logWarn("Invalid createdAt", logContext);
      return new Response(
        JSON.stringify({ error: "Invalid createdAt" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (eventRecord.userId && eventRecord.userId !== userId) {
      logWarn("Event user mismatch", logContext, { payloadUserId: userId, eventUserId: eventRecord.userId });
      return new Response(
        JSON.stringify({ error: "Event user mismatch" }),
        { status: 403, headers: baseJsonHeaders(origin) }
      );
    }

    if (eventRecord.changes && (typeof eventRecord.changes !== "object" || Array.isArray(eventRecord.changes))) {
      logWarn("Invalid changes payload", logContext);
      return new Response(
        JSON.stringify({ error: "changes must be an object" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    try {
      const changesJson = JSON.stringify(eventRecord.changes || {});
      if (changesJson.length > MAX_CHANGES_JSON) {
        logWarn("Changes payload too large", logContext);
        return new Response(
          JSON.stringify({ error: "changes payload too large" }),
          { status: 400, headers: baseJsonHeaders(origin) }
        );
      }
    } catch {
      logWarn("Invalid changes payload", logContext);
      return new Response(
        JSON.stringify({ error: "changes must be JSON serializable" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (userId !== user.id) {
      logWarn("User mismatch", { ...logContext, userId: user.id }, { payloadUserId: userId });
      return new Response(
        JSON.stringify({ error: "User mismatch" }),
        { status: 403, headers: baseJsonHeaders(origin) }
      );
    }
    
    // Get enabled SIEM integrations for this user
    const { data: integrations, error: intError } = await supabase
      .from('siem_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true);
    
    if (intError) {
      logError("Failed to fetch integrations", { ...logContext, userId: user.id }, {
        error: intError.message,
      });
      return new Response(
        JSON.stringify({ error: "Failed to fetch integrations" }),
        { status: 500, headers: baseJsonHeaders(origin) }
      );
    }
    
    if (!integrations || integrations.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active integrations", forwarded: 0 }),
        { status: 200, headers: baseJsonHeaders(origin) }
      );
    }
    
    const results: { integrationId: string; success: boolean; latencyMs: number; error?: string }[] = [];
    
    for (const integration of integrations) {
      if (!shouldForwardEvent(event, integration)) {
        continue;
      }
      
      const result = await forwardToSIEM(event, integration);
      results.push({ integrationId: integration.id, success: result.success, latencyMs: result.latencyMs, error: result.error });
      
      // Record metrics
      await supabase
        .from('siem_metrics')
        .insert({
          integration_id: integration.id,
          latency_ms: result.latencyMs,
          success: result.success,
          error_code: result.responseStatus?.toString() || null,
          error_message: result.error || null,
          events_batch_size: 1,
          response_status: result.responseStatus || null,
        });
      
      // Update integration stats
      if (result.success) {
        await supabase
          .from('siem_integrations')
          .update({
            last_success_at: new Date().toISOString(),
            events_sent: integration.events_sent + 1,
            consecutive_failures: 0,
          })
          .eq('id', integration.id);
      } else {
        await supabase
          .from('siem_integrations')
          .update({
            last_error_at: new Date().toISOString(),
            last_error_message: result.error,
            consecutive_failures: (integration.consecutive_failures || 0) + 1,
            total_failures: (integration.total_failures || 0) + 1,
          })
          .eq('id', integration.id);
      }
      
      // Update health status asynchronously
      await supabase.rpc('update_siem_integration_health', { p_integration_id: integration.id });
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return new Response(
      JSON.stringify({ 
        message: `Forwarded to ${successCount}/${results.length} integrations`,
        results 
      }),
      { status: 200, headers: baseJsonHeaders(origin) }
    );
    
  } catch (error) {
    logError("SIEM forward error", logContext, {
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: baseJsonHeaders(origin) }
    );
  }
});

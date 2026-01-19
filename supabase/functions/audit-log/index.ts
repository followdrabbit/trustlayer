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

const corsOptions = {
  allowHeaders: "authorization, x-client-info, apikey, content-type, x-session-id",
  allowMethods: "POST, OPTIONS",
};

interface AuditLogRequest {
  entityType: 'framework' | 'question' | 'setting' | 'answer';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'disable' | 'enable';
  changes: Record<string, unknown>;
  sessionId?: string;
}

interface GeoLocation {
  country: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
  isp: string | null;
}

const rateLimitConfig = getRateLimitConfig("AUDIT_LOG");
const ALLOWED_ENTITY_TYPES = new Set(['framework', 'question', 'setting', 'answer']);
const ALLOWED_ACTIONS = new Set(['create', 'update', 'delete', 'disable', 'enable']);
const MAX_ENTITY_ID_LENGTH = 200;
const MAX_SESSION_ID_LENGTH = 200;
const MAX_CHANGES_JSON = 20_000;

function parseUserAgent(ua: string): { deviceType: string; browserName: string; osName: string } {
  let deviceType = 'desktop';
  let browserName = 'Unknown';
  let osName = 'Unknown';

  // Device type detection
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    deviceType = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
  }

  // Browser detection
  if (/Firefox/i.test(ua)) browserName = 'Firefox';
  else if (/Edg/i.test(ua)) browserName = 'Edge';
  else if (/Chrome/i.test(ua)) browserName = 'Chrome';
  else if (/Safari/i.test(ua)) browserName = 'Safari';
  else if (/Opera|OPR/i.test(ua)) browserName = 'Opera';

  // OS detection
  if (/Windows/i.test(ua)) osName = 'Windows';
  else if (/Mac OS X/i.test(ua)) osName = 'macOS';
  else if (/Linux/i.test(ua)) osName = 'Linux';
  else if (/Android/i.test(ua)) osName = 'Android';
  else if (/iOS|iPhone|iPad|iPod/i.test(ua)) osName = 'iOS';

  return { deviceType, browserName, osName };
}

function getClientIp(req: Request): string | null {
  // Try various headers that might contain the real IP
  const headers = [
    'x-real-ip',
    'x-forwarded-for',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
    'true-client-ip',
  ];

  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return value.split(',')[0].trim();
    }
  }

  return null;
}

/**
 * Fetch geolocation data for an IP address using ip-api.com (free, no API key required)
 * Rate limit: 45 requests per minute for free tier
 */
async function getGeoLocation(ip: string | null): Promise<GeoLocation> {
  const defaultGeo: GeoLocation = {
    country: null,
    countryCode: null,
    city: null,
    region: null,
    timezone: null,
    isp: null,
  };

  if (!ip) return defaultGeo;

  // Skip private/local IPs
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.') || 
      ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
    return { ...defaultGeo, country: 'Local Network', city: 'Private' };
  }

  try {
    // Optional geo lookup (disabled by default). Uses ip-api.com free tier.
    const response = await fetchWithProxy(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,timezone,isp`,
      {
        signal: AbortSignal.timeout(3000) // 3 second timeout
      }
    );

    if (!response.ok) {
      console.warn(`Geo lookup failed for ${ip}: HTTP ${response.status}`);
      return defaultGeo;
    }

    const data = await response.json();

    if (data.status === 'fail') {
      console.warn(`Geo lookup failed for ${ip}: ${data.message}`);
      return defaultGeo;
    }

    return {
      country: data.country || null,
      countryCode: data.countryCode || null,
      city: data.city || null,
      region: data.regionName || data.region || null,
      timezone: data.timezone || null,
      isp: data.isp || null,
    };
  } catch (error) {
    console.warn(`Geo lookup error for ${ip}:`, error);
    return defaultGeo;
  }
}

Deno.serve(async (req: Request) => {
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
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logWarn("Missing authorization header", logContext);
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: baseJsonHeaders(origin) }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = await resolveSecretValue(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    if (!supabaseKey) {
      logError("Supabase configuration missing", logContext);
      return new Response(
        JSON.stringify({ error: "Supabase configuration missing" }),
        { status: 500, headers: baseJsonHeaders(origin) }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user's JWT token
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
      const rate = checkRateLimit(`audit-log:${user.id}`, rateLimitConfig.limit, rateLimitConfig.windowMs);
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

    let body: AuditLogRequest;
    try {
      body = await req.json();
    } catch {
      logWarn("Invalid JSON body", logContext);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }
    
    // Validate required fields
    if (!body.entityType || !body.entityId || !body.action) {
      logWarn("Missing required fields", logContext);
      return new Response(
        JSON.stringify({ error: "Missing required fields: entityType, entityId, action" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (!ALLOWED_ENTITY_TYPES.has(body.entityType)) {
      logWarn("Invalid entityType", logContext, { entityType: body.entityType });
      return new Response(
        JSON.stringify({ error: "Invalid entityType" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (!ALLOWED_ACTIONS.has(body.action)) {
      logWarn("Invalid action", logContext, { action: body.action });
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (typeof body.entityId !== "string") {
      logWarn("Invalid entityId", logContext);
      return new Response(
        JSON.stringify({ error: "Invalid entityId" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (body.entityId.length > MAX_ENTITY_ID_LENGTH) {
      logWarn("EntityId too long", logContext);
      return new Response(
        JSON.stringify({ error: "entityId too long" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (body.sessionId && body.sessionId.length > MAX_SESSION_ID_LENGTH) {
      logWarn("sessionId too long", logContext);
      return new Response(
        JSON.stringify({ error: "sessionId too long" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    if (body.changes && (typeof body.changes !== "object" || Array.isArray(body.changes))) {
      logWarn("Invalid changes payload", logContext);
      return new Response(
        JSON.stringify({ error: "changes must be an object" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    try {
      const changesJson = JSON.stringify(body.changes || {});
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

    // Extract request metadata
    const userAgent = req.headers.get("user-agent") || "";
    const ipAddress = getClientIp(req);
    const sessionId = req.headers.get("x-session-id") || body.sessionId;
    const { deviceType, browserName, osName } = parseUserAgent(userAgent);

    if (sessionId && sessionId.length > MAX_SESSION_ID_LENGTH) {
      logWarn("sessionId too long", logContext);
      return new Response(
        JSON.stringify({ error: "sessionId too long" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    // Fetch geolocation data (non-blocking, with timeout)
    const geoLookupEnabled = Deno.env.get("AUDIT_GEO_LOOKUP_ENABLED") === "true";
    const geoLocation = geoLookupEnabled ? await getGeoLocation(ipAddress) : {
      country: null,
      countryCode: null,
      city: null,
      region: null,
      timezone: null,
      isp: null,
    };

    // Insert audit log with detailed metadata including geolocation
    const { data, error } = await supabase
      .from("change_logs")
      .insert({
        user_id: user.id,
        entity_type: body.entityType,
        entity_id: body.entityId,
        action: body.action,
        changes: body.changes || {},
        ip_address: ipAddress,
        user_agent: userAgent,
        session_id: sessionId,
        device_type: deviceType,
        browser_name: browserName,
        os_name: osName,
        geo_country: geoLocation.country,
        geo_city: geoLocation.city,
      })
      .select("id, request_id")
      .single();

    if (error) {
      logError("Error inserting audit log", { ...logContext, userId: user.id }, {
        error: error.message,
      });
      return new Response(
        JSON.stringify({ error: "Failed to create audit log", details: error.message }),
        { status: 500, headers: baseJsonHeaders(origin) }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data.id,
        requestId: data.request_id,
        geo: geoLocation
      }),
      { status: 200, headers: baseJsonHeaders(origin) }
    );

  } catch (error) {
    logError("Audit log error", logContext, {
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: baseJsonHeaders(origin) }
    );
  }
});

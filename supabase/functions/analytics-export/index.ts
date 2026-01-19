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
import { validateExternalUrl } from "../_shared/urlValidation.ts";
import {
  checkRateLimit,
  getRateLimitConfig,
  rateLimitHeaders,
} from "../_shared/rateLimit.ts";

const corsOptions = {
  allowHeaders: "authorization, x-client-info, apikey, content-type",
  allowMethods: "POST, OPTIONS",
};

const rateLimitConfig = getRateLimitConfig("ANALYTICS_EXPORT");
const ALLOWED_SNAPSHOT_TYPES = new Set(["automatic", "manual"]);
const MAX_DOMAIN_METRICS = 50;
const MAX_FRAMEWORK_METRICS = 200;
const MAX_FRAMEWORK_CATEGORY_METRICS = 50;

type DomainMetric = {
  domainId: string;
  domainName: string;
  score: number;
  coverage: number;
  criticalGaps: number;
};

type FrameworkMetric = {
  framework: string;
  score: number;
  coverage: number;
  totalQuestions: number;
  answeredQuestions: number;
};

type FrameworkCategoryMetric = {
  categoryId: string;
  categoryName: string;
  score: number;
  coverage: number;
};

type SnapshotPayload = {
  snapshotDate: string;
  snapshotType: "automatic" | "manual";
  securityDomainId?: string | null;
  overallScore: number;
  overallCoverage: number;
  evidenceReadiness: number;
  maturityLevel: number;
  totalQuestions: number;
  answeredQuestions: number;
  criticalGaps: number;
  domainMetrics: DomainMetric[];
  frameworkMetrics: FrameworkMetric[];
  frameworkCategoryMetrics: FrameworkCategoryMetric[];
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeDomainMetrics(raw: unknown): DomainMetric[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_DOMAIN_METRICS).map((item) => {
    const record = item as Record<string, unknown>;
    return {
      domainId: asString(record.domainId),
      domainName: asString(record.domainName),
      score: asNumber(record.score),
      coverage: asNumber(record.coverage),
      criticalGaps: asNumber(record.criticalGaps),
    };
  });
}

function sanitizeFrameworkMetrics(raw: unknown): FrameworkMetric[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_FRAMEWORK_METRICS).map((item) => {
    const record = item as Record<string, unknown>;
    return {
      framework: asString(record.framework),
      score: asNumber(record.score),
      coverage: asNumber(record.coverage),
      totalQuestions: asNumber(record.totalQuestions),
      answeredQuestions: asNumber(record.answeredQuestions),
    };
  });
}

function sanitizeFrameworkCategoryMetrics(raw: unknown): FrameworkCategoryMetric[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_FRAMEWORK_CATEGORY_METRICS).map((item) => {
    const record = item as Record<string, unknown>;
    return {
      categoryId: asString(record.categoryId),
      categoryName: asString(record.categoryName),
      score: asNumber(record.score),
      coverage: asNumber(record.coverage),
    };
  });
}

function parseSnapshot(payload: unknown): { snapshot?: SnapshotPayload; error?: string } {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid payload" };
  }

  const root = payload as Record<string, unknown>;
  const snapshotRaw = root.snapshot;
  if (!snapshotRaw || typeof snapshotRaw !== "object") {
    return { error: "Missing snapshot" };
  }

  const snapshot = snapshotRaw as Record<string, unknown>;
  const snapshotDate = asString(snapshot.snapshotDate);
  const snapshotTypeRaw = asString(snapshot.snapshotType);
  if (!snapshotDate) {
    return { error: "Missing snapshotDate" };
  }
  if (!ALLOWED_SNAPSHOT_TYPES.has(snapshotTypeRaw)) {
    return { error: "Invalid snapshotType" };
  }

  return {
    snapshot: {
      snapshotDate,
      snapshotType: snapshotTypeRaw as SnapshotPayload["snapshotType"],
      securityDomainId: snapshot.securityDomainId ? asString(snapshot.securityDomainId) : null,
      overallScore: asNumber(snapshot.overallScore),
      overallCoverage: asNumber(snapshot.overallCoverage),
      evidenceReadiness: asNumber(snapshot.evidenceReadiness),
      maturityLevel: asNumber(snapshot.maturityLevel),
      totalQuestions: asNumber(snapshot.totalQuestions),
      answeredQuestions: asNumber(snapshot.answeredQuestions),
      criticalGaps: asNumber(snapshot.criticalGaps),
      domainMetrics: sanitizeDomainMetrics(snapshot.domainMetrics),
      frameworkMetrics: sanitizeFrameworkMetrics(snapshot.frameworkMetrics),
      frameworkCategoryMetrics: sanitizeFrameworkCategoryMetrics(snapshot.frameworkCategoryMetrics),
    },
  };
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

  const exportUrlRaw = Deno.env.get("ANALYTICS_EXPORT_URL");
  if (!exportUrlRaw) {
    return new Response(
      JSON.stringify({ message: "Analytics export disabled" }),
      { status: 200, headers: baseJsonHeaders(origin) }
    );
  }

  const validation = validateExternalUrl(exportUrlRaw);
  if (!validation.ok || !validation.normalized) {
    logError("Invalid analytics export URL", logContext, { reason: validation.reason });
    return new Response(
      JSON.stringify({ error: "Analytics export misconfigured" }),
      { status: 500, headers: baseJsonHeaders(origin) }
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logWarn("Missing authorization header", logContext);
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: baseJsonHeaders(origin) }
      );
    }

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
      const rate = checkRateLimit(`analytics-export:${user.id}`, rateLimitConfig.limit, rateLimitConfig.windowMs);
      if (!rate.allowed) {
        logWarn("Rate limit exceeded", { ...logContext, userId: user.id });
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: {
              ...baseJsonHeaders(origin),
              ...rateLimitHeaders(rateLimitConfig.limit, rate.remaining, rate.resetMs),
            },
          }
        );
      }
    }

    const payload = await req.json();
    const parsed = parseSnapshot(payload);
    if (!parsed.snapshot) {
      logWarn("Invalid snapshot payload", logContext, { error: parsed.error });
      return new Response(
        JSON.stringify({ error: parsed.error || "Invalid payload" }),
        { status: 400, headers: baseJsonHeaders(origin) }
      );
    }

    const tokenRaw = Deno.env.get("ANALYTICS_EXPORT_TOKEN");
    const tokenValue = tokenRaw ? await resolveSecretValue(tokenRaw) : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Request-Id": requestId,
    };
    if (tokenValue) {
      headers["Authorization"] = `Bearer ${tokenValue}`;
    }

    const includeUserId = Deno.env.get("ANALYTICS_EXPORT_INCLUDE_USER_ID") === "true";
    const outboundPayload = {
      eventType: "maturity_snapshot",
      exportedAt: new Date().toISOString(),
      snapshot: parsed.snapshot,
      context: includeUserId ? { userId: user.id } : undefined,
    };

    const timeoutMs = Number.parseInt(Deno.env.get("ANALYTICS_EXPORT_TIMEOUT_MS") || "10000", 10);
    const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetchWithProxy(validation.normalized, {
        method: "POST",
        headers,
        body: JSON.stringify(outboundPayload),
        signal: controller.signal,
      });

      if (!response.ok) {
        logError("Analytics export failed", logContext, { status: response.status });
        return new Response(
          JSON.stringify({ error: "Analytics export failed", status: response.status }),
          { status: 502, headers: baseJsonHeaders(origin) }
        );
      }
    } finally {
      clearTimeout(timer);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: baseJsonHeaders(origin) }
    );
  } catch (error) {
    logError("Analytics export error", logContext, {
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: baseJsonHeaders(origin) }
    );
  }
});

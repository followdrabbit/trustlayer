const DEFAULT_MAX_BODY_BYTES = 1_048_576; // 1 MB

interface CorsOptions {
  allowHeaders?: string;
  allowMethods?: string;
}

function parseAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS") || "";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin: string | null): boolean {
  const allowed = parseAllowedOrigins();
  if (allowed.length === 0) return true;
  if (!origin) return true;
  return allowed.includes(origin);
}

export function buildCorsHeaders(
  origin: string | null,
  options: CorsOptions = {}
): Record<string, string> {
  const allowed = parseAllowedOrigins();
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": options.allowHeaders ||
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": options.allowMethods || "POST, OPTIONS",
  };

  if (allowed.length === 0) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return headers;
}

export function jsonHeaders(
  origin: string | null,
  options?: CorsOptions
): Record<string, string> {
  return {
    ...buildCorsHeaders(origin, options),
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

export function streamHeaders(
  origin: string | null,
  options?: CorsOptions
): Record<string, string> {
  return {
    ...buildCorsHeaders(origin, options),
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
  };
}

export function withRequestId(
  headers: Record<string, string>,
  requestId: string
): Record<string, string> {
  return {
    ...headers,
    "X-Request-Id": requestId,
  };
}

export function isRequestTooLarge(req: Request): boolean {
  const limitRaw = Deno.env.get("MAX_REQUEST_BODY_BYTES");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : DEFAULT_MAX_BODY_BYTES;
  if (!Number.isFinite(limit) || limit <= 0) return false;
  const length = req.headers.get("content-length");
  if (!length) return false;
  const size = Number.parseInt(length, 10);
  return Number.isFinite(size) && size > limit;
}

export function isJsonRequest(req: Request): boolean {
  const contentType = req.headers.get("content-type");
  if (!contentType) return false;
  return contentType.toLowerCase().startsWith("application/json");
}

export interface LogContext {
  requestId: string;
  path: string;
  userId?: string;
}

type LogLevel = "info" | "warn" | "error";

const SENSITIVE_KEYS = [
  "authorization",
  "token",
  "api_key",
  "apikey",
  "secret",
  "password",
  "cookie",
  "set-cookie",
];

const SENSITIVE_PATTERNS = [
  /Bearer\s+[^\s]+/gi,
  /Basic\s+[^\s]+/gi,
  /sb_(secret|publishable)_[A-Za-z0-9_-]+/g,
  /sk-[A-Za-z0-9_-]+/g,
  /AIza[0-9A-Za-z_-]+/g,
];

function redactString(value: string): string {
  let output = value;
  for (const pattern of SENSITIVE_PATTERNS) {
    output = output.replace(pattern, "[REDACTED]");
  }
  return output;
}

function isSensitiveKey(key?: string): boolean {
  if (!key) return false;
  const normalized = key.toLowerCase();
  return SENSITIVE_KEYS.some((sensitive) => normalized.includes(sensitive));
}

function redactValue(value: unknown, key?: string): unknown {
  if (typeof value === "string") {
    if (isSensitiveKey(key)) return "[REDACTED]";
    return redactString(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry, key));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      result[childKey] = redactValue(childValue, childKey);
    }
    return result;
  }
  return value;
}

function log(level: LogLevel, message: string, context: LogContext, meta?: Record<string, unknown>): void {
  const payload = {
    level,
    message: redactString(message),
    requestId: context.requestId,
    path: context.path,
    userId: context.userId,
    timestamp: new Date().toISOString(),
    ...(meta ? (redactValue(meta) as Record<string, unknown>) : {}),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export function logInfo(message: string, context: LogContext, meta?: Record<string, unknown>): void {
  log("info", message, context, meta);
}

export function logWarn(message: string, context: LogContext, meta?: Record<string, unknown>): void {
  log("warn", message, context, meta);
}

export function logError(message: string, context: LogContext, meta?: Record<string, unknown>): void {
  log("error", message, context, meta);
}

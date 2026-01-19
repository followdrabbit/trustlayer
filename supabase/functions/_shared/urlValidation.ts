const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

const DEFAULT_ALLOW_LOCAL = Deno.env.get("ALLOW_LOCAL_ENDPOINTS") === "true";

function isIPv4(hostname: string): boolean {
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return false;
  const parts = hostname.split(".").map(Number);
  return parts.every((part) => part >= 0 && part <= 255);
}

function isPrivateIPv4(hostname: string): boolean {
  if (!isIPv4(hostname)) return false;
  const [a, b] = hostname.split(".").map(Number);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIPv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd")
  );
}

export function validateExternalUrl(
  input: string,
  options?: { allowLocal?: boolean }
): { ok: boolean; reason?: string; normalized?: string } {
  const allowLocal = options?.allowLocal ?? DEFAULT_ALLOW_LOCAL;
  let parsed: URL;

  try {
    parsed = new URL(input);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, reason: "invalid_protocol" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: "credentials_in_url" };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (!allowLocal) {
    if (LOCAL_HOSTNAMES.has(hostname)) {
      return { ok: false, reason: "local_host" };
    }
    if (isPrivateIPv4(hostname) || isPrivateIPv6(hostname)) {
      return { ok: false, reason: "private_network" };
    }
  }

  return { ok: true, normalized: parsed.toString() };
}

import { resolveSecretRef } from "../../../shared/secretRefs.ts";
import { fetchWithProxy } from "./proxy.ts";
import { validateExternalUrl } from "./urlValidation.ts";

async function readSecretFile(path: string): Promise<string> {
  return await Deno.readTextFile(path);
}

async function resolveExternalSecret(reference: string): Promise<string | null> {
  const urlRaw = Deno.env.get("SECRET_PROVIDER_URL");
  if (!urlRaw) return null;
  const validation = validateExternalUrl(urlRaw);
  if (!validation.ok || !validation.normalized) {
    return null;
  }
  const url = validation.normalized;

  const tokenRef = Deno.env.get("SECRET_PROVIDER_TOKEN");
  const token = tokenRef
    ? await resolveSecretRef(tokenRef, { env: Deno.env, readFile: readSecretFile })
    : null;
  const timeoutMs = Number.parseInt(
    Deno.env.get("SECRET_PROVIDER_TIMEOUT_MS") || "10000",
    10
  );
  const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetchWithProxy(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ reference }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      if (payload && typeof payload === "object") {
        const record = payload as Record<string, unknown>;
        if (typeof record.value === "string") return record.value;
        if (typeof record.secret === "string") return record.secret;
        if (typeof record.data === "string") return record.data;
      }
      return null;
    }

    const text = await response.text();
    const trimmed = text.trim();
    return trimmed ? trimmed : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveSecretValue(
  raw: string | null,
  options?: { decodeBase64?: boolean }
): Promise<string | null> {
  return resolveSecretRef(raw, {
    env: Deno.env,
    readFile: readSecretFile,
    decodeBase64: options?.decodeBase64,
    resolveExternal: resolveExternalSecret,
  });
}

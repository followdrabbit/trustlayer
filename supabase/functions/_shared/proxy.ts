import { getProxyUrlForTarget } from "../../../shared/proxyConfig.ts";

let cachedProxyUrl: string | null = null;
let cachedCaFingerprint: string | null = null;
let cachedClient: Deno.HttpClient | null = null;

function getProxyEnv(): {
  HTTP_PROXY?: string;
  HTTPS_PROXY?: string;
  NO_PROXY?: string;
  no_proxy?: string;
} {
  return {
    HTTP_PROXY: Deno.env.get("HTTP_PROXY") ?? undefined,
    HTTPS_PROXY: Deno.env.get("HTTPS_PROXY") ?? undefined,
    NO_PROXY: Deno.env.get("NO_PROXY") ?? undefined,
    no_proxy: Deno.env.get("no_proxy") ?? undefined,
  };
}

function loadCustomCaCerts(): string[] {
  const certs: string[] = [];
  const pem = Deno.env.get("CUSTOM_CA_CERT");
  const base64 = Deno.env.get("CUSTOM_CA_CERT_BASE64");
  if (pem) {
    certs.push(pem);
  }
  if (base64) {
    try {
      certs.push(atob(base64));
    } catch {
      // ignore invalid base64
    }
  }
  return certs;
}

function getClient(proxyUrl: string): Deno.HttpClient | undefined {
  const caCerts = loadCustomCaCerts();
  const caFingerprint = caCerts.join("|");

  if (cachedClient && cachedProxyUrl === proxyUrl && cachedCaFingerprint === caFingerprint) {
    return cachedClient;
  }

  try {
    cachedClient?.close();
    cachedClient = Deno.createHttpClient({
      proxy: { url: proxyUrl },
      caCerts: caCerts.length > 0 ? caCerts : undefined,
    });
    cachedProxyUrl = proxyUrl;
    cachedCaFingerprint = caFingerprint;
    return cachedClient;
  } catch {
    return undefined;
  }
}

function getClientForUrl(targetUrl: string): Deno.HttpClient | undefined {
  const proxyUrl = getProxyUrlForTarget(targetUrl, getProxyEnv());
  if (!proxyUrl) return undefined;
  return getClient(proxyUrl);
}

export async function fetchWithProxy(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
  const client = getClientForUrl(url);
  if (!client) {
    return fetch(input, init);
  }

  const requestInit: RequestInit & { client?: Deno.HttpClient } = init
    ? { ...init }
    : {};
  requestInit.client = client;
  return fetch(input, requestInit);
}

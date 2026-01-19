export interface ProxyEnv {
  HTTP_PROXY?: string;
  HTTPS_PROXY?: string;
  NO_PROXY?: string;
  no_proxy?: string;
}

const DEFAULT_NO_PROXY = ['localhost', '127.0.0.1', '::1'];

function normalizeEntry(entry: string): string {
  return entry.trim();
}

function splitHostPort(entry: string): { host: string; port: string | null } {
  const trimmed = normalizeEntry(entry);
  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']');
    if (end !== -1) {
      const host = trimmed.slice(1, end);
      const rest = trimmed.slice(end + 1);
      if (rest.startsWith(':')) {
        return { host, port: rest.slice(1) || null };
      }
      return { host, port: null };
    }
  }

  const firstColon = trimmed.indexOf(':');
  const lastColon = trimmed.lastIndexOf(':');
  if (firstColon !== -1 && firstColon === lastColon) {
    return {
      host: trimmed.slice(0, lastColon),
      port: trimmed.slice(lastColon + 1) || null,
    };
  }

  return { host: trimmed, port: null };
}

export function parseNoProxyList(raw?: string): string[] {
  const entries = (raw || '')
    .split(',')
    .map(normalizeEntry)
    .filter(Boolean);

  for (const entry of DEFAULT_NO_PROXY) {
    if (!entries.includes(entry)) {
      entries.push(entry);
    }
  }

  return entries;
}

function hostMatches(targetHost: string, entryHost: string): boolean {
  const host = targetHost.toLowerCase();
  const entry = entryHost.toLowerCase();

  if (!entry) return false;
  if (entry.startsWith('.')) {
    return host.endsWith(entry);
  }
  if (host === entry) return true;
  return host.endsWith(`.${entry}`);
}

export function isNoProxyTarget(
  hostname: string,
  port: string | null,
  noProxyList: string[]
): boolean {
  for (const entry of noProxyList) {
    if (!entry) continue;
    if (entry === '*') return true;
    const { host, port: entryPort } = splitHostPort(entry);
    if (!host) continue;
    if (entryPort && port && entryPort !== port) {
      continue;
    }
    if (hostMatches(hostname, host)) {
      return true;
    }
  }
  return false;
}

export function getProxyUrlForTarget(
  targetUrl: string,
  env: ProxyEnv
): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return undefined;
  }

  const noProxyRaw = env.NO_PROXY || env.no_proxy;
  const noProxyList = parseNoProxyList(noProxyRaw);
  if (isNoProxyTarget(parsed.hostname, parsed.port || null, noProxyList)) {
    return undefined;
  }

  if (parsed.protocol === 'https:') {
    return env.HTTPS_PROXY || env.HTTP_PROXY;
  }
  if (parsed.protocol === 'http:') {
    return env.HTTP_PROXY || env.HTTPS_PROXY;
  }
  return undefined;
}

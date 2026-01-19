export interface EnvReader {
  get(name: string): string | undefined;
}

export interface SecretRefOptions {
  env?: EnvReader;
  readFile?: (path: string) => Promise<string>;
  decodeBase64?: boolean;
  resolveExternal?: (reference: string) => Promise<string | null>;
}

const ENV_PREFIX = 'env:';
const FILE_PREFIX = 'file:';
const EXTERNAL_PREFIX = 'secret:';
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

function isLikelyBase64(value: string): boolean {
  if (!value) return false;
  if (value.length < 8) return false;
  if (value.length % 4 !== 0) return false;
  return BASE64_PATTERN.test(value);
}

function decodeBase64(value: string): string {
  if (typeof atob === 'function') {
    return atob(value);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64').toString('utf-8');
  }
  return value;
}

async function resolveFromReference(
  value: string,
  options: SecretRefOptions
): Promise<string | null> {
  if (value.startsWith(ENV_PREFIX)) {
    const key = value.slice(ENV_PREFIX.length).trim();
    if (!key) return null;
    return options.env?.get(key) ?? null;
  }

  if (value.startsWith(FILE_PREFIX)) {
    const path = value.slice(FILE_PREFIX.length).trim();
    if (!path || !options.readFile) return null;
    try {
      const content = await options.readFile(path);
      return content.trim();
    } catch {
      return null;
    }
  }

  return value;
}

export async function resolveSecretRef(
  raw: string | null,
  options: SecretRefOptions = {}
): Promise<string | null> {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(ENV_PREFIX) || trimmed.startsWith(FILE_PREFIX)) {
    return resolveFromReference(trimmed, options);
  }

  if (trimmed.startsWith(EXTERNAL_PREFIX)) {
    const reference = trimmed.slice(EXTERNAL_PREFIX.length).trim();
    if (!reference || !options.resolveExternal) return null;
    return options.resolveExternal(reference);
  }

  if (options.decodeBase64 && isLikelyBase64(trimmed)) {
    const decoded = decodeBase64(trimmed);
    if (decoded !== trimmed) {
      return resolveSecretRef(decoded, { ...options, decodeBase64: false });
    }
  }

  return trimmed;
}

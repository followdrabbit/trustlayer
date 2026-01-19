import { describe, it, expect } from 'vitest';
import { resolveSecretRef } from '../../shared/secretRefs';

describe('resolveSecretRef', () => {
  it('returns null for empty values', async () => {
    expect(await resolveSecretRef(null)).toBeNull();
    expect(await resolveSecretRef('   ')).toBeNull();
  });

  it('resolves env references', async () => {
    const env = { get: (name: string) => (name === 'OPENAI_KEY' ? 'sk-test' : undefined) };
    const value = await resolveSecretRef('env:OPENAI_KEY', { env });
    expect(value).toBe('sk-test');
  });

  it('resolves file references', async () => {
    const readFile = async (path: string) => (path === '/secrets/key' ? 'file-secret\n' : '');
    const value = await resolveSecretRef('file:/secrets/key', { readFile });
    expect(value).toBe('file-secret');
  });

  it('decodes base64 values when enabled', async () => {
    const encoded = Buffer.from('sk-live').toString('base64');
    const value = await resolveSecretRef(encoded, { decodeBase64: true });
    expect(value).toBe('sk-live');
  });

  it('decodes base64 env references', async () => {
    const env = { get: (name: string) => (name === 'OPENAI_KEY' ? 'sk-env' : undefined) };
    const encoded = Buffer.from('env:OPENAI_KEY').toString('base64');
    const value = await resolveSecretRef(encoded, { decodeBase64: true, env });
    expect(value).toBe('sk-env');
  });

  it('resolves external secret references', async () => {
    const resolveExternal = async (reference: string) =>
      reference === 'prod/api-key' ? 'external-secret' : null;
    const value = await resolveSecretRef('secret:prod/api-key', { resolveExternal });
    expect(value).toBe('external-secret');
  });

  it('returns null when external resolver is missing', async () => {
    const value = await resolveSecretRef('secret:prod/api-key');
    expect(value).toBeNull();
  });

  it('returns raw value when not base64', async () => {
    const value = await resolveSecretRef('not-base64', { decodeBase64: true });
    expect(value).toBe('not-base64');
  });
});

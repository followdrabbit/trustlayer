import { describe, it, expect } from 'vitest';
import { isSecretReference, isInlineSecretAllowed } from '@/lib/secretInput';

describe('secretInput', () => {
  it('detects env and file references', () => {
    expect(isSecretReference('env:API_KEY')).toBe(true);
    expect(isSecretReference('file:/secrets/key')).toBe(true);
    expect(isSecretReference('ENV:API_KEY')).toBe(true);
    expect(isSecretReference('secret:prod/api-key')).toBe(true);
  });

  it('rejects inline values', () => {
    expect(isSecretReference('sk-live')).toBe(false);
  });

  it('returns a boolean for inline secret allowance', () => {
    expect(typeof isInlineSecretAllowed()).toBe('boolean');
  });
});

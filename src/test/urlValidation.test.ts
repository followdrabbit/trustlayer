import { describe, it, expect } from 'vitest';
import { validateExternalUrl } from '@/lib/urlValidation';

describe('validateExternalUrl', () => {
  it('accepts http and https urls', () => {
    expect(validateExternalUrl('https://example.com').ok).toBe(true);
    expect(validateExternalUrl('http://example.com/path').ok).toBe(true);
  });

  it('rejects non-http protocols', () => {
    expect(validateExternalUrl('ftp://example.com').ok).toBe(false);
    expect(validateExternalUrl('file:///etc/passwd').ok).toBe(false);
  });

  it('rejects urls with embedded credentials', () => {
    const result = validateExternalUrl('https://user:pass@example.com');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('credentials_in_url');
  });

  it('rejects localhost by default', () => {
    const result = validateExternalUrl('http://localhost:8080');
    expect(result.ok).toBe(false);
  });

  it('allows localhost when explicitly enabled', () => {
    const result = validateExternalUrl('http://localhost:8080', { allowLocal: true });
    expect(result.ok).toBe(true);
  });
});

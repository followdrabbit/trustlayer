import { describe, it, expect } from 'vitest';
import { parseNoProxyList, isNoProxyTarget, getProxyUrlForTarget } from '../../shared/proxyConfig';

describe('parseNoProxyList', () => {
  it('adds default localhost entries', () => {
    const list = parseNoProxyList('example.com');
    expect(list).toContain('localhost');
    expect(list).toContain('127.0.0.1');
    expect(list).toContain('::1');
    expect(list).toContain('example.com');
  });
});

describe('isNoProxyTarget', () => {
  it('matches exact and subdomain entries', () => {
    expect(isNoProxyTarget('example.com', null, ['example.com'])).toBe(true);
    expect(isNoProxyTarget('api.example.com', null, ['example.com'])).toBe(true);
    expect(isNoProxyTarget('example.com', null, ['.example.com'])).toBe(false);
    expect(isNoProxyTarget('api.example.com', null, ['.example.com'])).toBe(true);
  });

  it('respects port-specific entries', () => {
    expect(isNoProxyTarget('example.com', '8443', ['example.com:8443'])).toBe(true);
    expect(isNoProxyTarget('example.com', '8080', ['example.com:8443'])).toBe(false);
  });
});

describe('getProxyUrlForTarget', () => {
  it('selects protocol-specific proxies and honors no_proxy', () => {
    const env = {
      HTTP_PROXY: 'http://proxy.local:8080',
      HTTPS_PROXY: 'http://proxy.local:8443',
      NO_PROXY: 'internal.local',
    };

    expect(getProxyUrlForTarget('https://service.com', env)).toBe('http://proxy.local:8443');
    expect(getProxyUrlForTarget('http://service.com', env)).toBe('http://proxy.local:8080');
    expect(getProxyUrlForTarget('https://internal.local', env)).toBeUndefined();
    expect(getProxyUrlForTarget('http://localhost:3000', env)).toBeUndefined();
  });
});

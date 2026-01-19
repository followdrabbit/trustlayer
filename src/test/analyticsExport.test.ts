import { describe, expect, it } from 'vitest';
import { buildAnalyticsPayload, ANALYTICS_EXPORT_LIMITS } from '@/lib/analyticsExport';

function buildSnapshot(overrides?: Partial<Parameters<typeof buildAnalyticsPayload>[0]>) {
  return {
    snapshotDate: '2026-01-19',
    snapshotType: 'manual' as const,
    securityDomainId: 'AI_SECURITY',
    overallScore: 0.75,
    overallCoverage: 0.6,
    evidenceReadiness: 0.55,
    maturityLevel: 3,
    totalQuestions: 120,
    answeredQuestions: 72,
    criticalGaps: 10,
    domainMetrics: Array.from({ length: ANALYTICS_EXPORT_LIMITS.domainMetrics + 2 }, (_, idx) => ({
      domainId: `DOM_${idx}`,
      domainName: `Domain ${idx}`,
      score: 0.7,
      coverage: 0.6,
      criticalGaps: 1,
    })),
    frameworkMetrics: Array.from({ length: ANALYTICS_EXPORT_LIMITS.frameworkMetrics + 2 }, (_, idx) => ({
      framework: `FW_${idx}`,
      score: 0.7,
      coverage: 0.6,
      totalQuestions: 10,
      answeredQuestions: 7,
    })),
    frameworkCategoryMetrics: Array.from({ length: ANALYTICS_EXPORT_LIMITS.frameworkCategoryMetrics + 2 }, (_, idx) => ({
      categoryId: `CAT_${idx}`,
      categoryName: `Category ${idx}`,
      score: 0.7,
      coverage: 0.6,
    })),
    ...overrides,
  };
}

describe('analytics export payload', () => {
  it('truncates snapshot arrays to limits', () => {
    const payload = buildAnalyticsPayload(buildSnapshot());
    expect(payload.eventType).toBe('maturity_snapshot');
    expect(payload.snapshot.domainMetrics).toHaveLength(ANALYTICS_EXPORT_LIMITS.domainMetrics);
    expect(payload.snapshot.frameworkMetrics).toHaveLength(ANALYTICS_EXPORT_LIMITS.frameworkMetrics);
    expect(payload.snapshot.frameworkCategoryMetrics).toHaveLength(ANALYTICS_EXPORT_LIMITS.frameworkCategoryMetrics);
  });
});

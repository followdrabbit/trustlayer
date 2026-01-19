import { supabase } from '@/integrations/supabase/client';
import type { MaturitySnapshot, DomainSnapshot, FrameworkSnapshot, FrameworkCategorySnapshot } from '@/lib/database';

const ANALYTICS_EXPORT_ENABLED = import.meta.env.VITE_ANALYTICS_EXPORT_ENABLED === 'true';

export const ANALYTICS_EXPORT_LIMITS = {
  domainMetrics: 50,
  frameworkMetrics: 200,
  frameworkCategoryMetrics: 50,
};

export interface AnalyticsExportPayload {
  eventType: 'maturity_snapshot';
  exportedAt: string;
  snapshot: Omit<MaturitySnapshot, 'id' | 'createdAt'>;
}

function clampArray<T>(items: T[], limit: number): T[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, limit);
}

function normalizeDomainMetrics(items: DomainSnapshot[]): DomainSnapshot[] {
  return clampArray(items, ANALYTICS_EXPORT_LIMITS.domainMetrics).map((item) => ({
    domainId: item.domainId,
    domainName: item.domainName,
    score: item.score,
    coverage: item.coverage,
    criticalGaps: item.criticalGaps,
  }));
}

function normalizeFrameworkMetrics(items: FrameworkSnapshot[]): FrameworkSnapshot[] {
  return clampArray(items, ANALYTICS_EXPORT_LIMITS.frameworkMetrics).map((item) => ({
    framework: item.framework,
    score: item.score,
    coverage: item.coverage,
    totalQuestions: item.totalQuestions,
    answeredQuestions: item.answeredQuestions,
  }));
}

function normalizeFrameworkCategoryMetrics(items: FrameworkCategorySnapshot[]): FrameworkCategorySnapshot[] {
  return clampArray(items, ANALYTICS_EXPORT_LIMITS.frameworkCategoryMetrics).map((item) => ({
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    score: item.score,
    coverage: item.coverage,
  }));
}

export function buildAnalyticsPayload(
  snapshot: Omit<MaturitySnapshot, 'id' | 'createdAt'>
): AnalyticsExportPayload {
  const sanitized: Omit<MaturitySnapshot, 'id' | 'createdAt'> = {
    snapshotDate: snapshot.snapshotDate,
    snapshotType: snapshot.snapshotType,
    securityDomainId: snapshot.securityDomainId,
    overallScore: snapshot.overallScore,
    overallCoverage: snapshot.overallCoverage,
    evidenceReadiness: snapshot.evidenceReadiness,
    maturityLevel: snapshot.maturityLevel,
    totalQuestions: snapshot.totalQuestions,
    answeredQuestions: snapshot.answeredQuestions,
    criticalGaps: snapshot.criticalGaps,
    domainMetrics: normalizeDomainMetrics(snapshot.domainMetrics),
    frameworkMetrics: normalizeFrameworkMetrics(snapshot.frameworkMetrics),
    frameworkCategoryMetrics: normalizeFrameworkCategoryMetrics(snapshot.frameworkCategoryMetrics),
  };

  return {
    eventType: 'maturity_snapshot',
    exportedAt: new Date().toISOString(),
    snapshot: sanitized,
  };
}

export async function exportAnalyticsSnapshot(
  snapshot: Omit<MaturitySnapshot, 'id' | 'createdAt'>
): Promise<void> {
  if (!ANALYTICS_EXPORT_ENABLED) return;

  try {
    const payload = buildAnalyticsPayload(snapshot);
    const { error } = await supabase.functions.invoke('analytics-export', {
      body: payload,
    });
    if (error) {
      console.warn('Analytics export failed:', error.message);
    }
  } catch (error) {
    console.warn('Analytics export error:', error);
  }
}

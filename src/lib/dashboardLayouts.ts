import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type DashboardKey = 'executive' | 'grc' | 'specialist';

export const DASHBOARD_KEYS: DashboardKey[] = ['executive', 'grc', 'specialist'];

export interface DashboardLayoutConfig {
  version: string;
  widgets: string[];
}

export const DASHBOARD_LAYOUT_VERSION = '1.0';

export const DEFAULT_DASHBOARD_LAYOUTS: Record<DashboardKey, DashboardLayoutConfig> = {
  executive: {
    version: DASHBOARD_LAYOUT_VERSION,
    widgets: [
      'executive.header',
      'executive.kpis',
      'executive.indicators',
      'executive.charts',
      'executive.frameworkCoverage',
      'executive.frameworkCategories',
      'executive.roadmap',
      'executive.criticalGaps',
      'shared.periodComparison',
      'shared.maturityTrend',
    ],
  },
  grc: {
    version: DASHBOARD_LAYOUT_VERSION,
    widgets: [
      'grc.header',
      'grc.statusPills',
      'grc.kpis',
      'grc.frameworkCoverage',
      'grc.indicators',
      'grc.roadmap',
      'grc.tabs',
      'shared.periodComparison',
      'shared.maturityTrend',
    ],
  },
  specialist: {
    version: DASHBOARD_LAYOUT_VERSION,
    widgets: [
      'specialist.header',
      'specialist.filters',
      'specialist.kpis',
      'specialist.roadmap',
      'specialist.indicators',
      'specialist.tabs',
      'shared.periodComparison',
      'shared.maturityTrend',
    ],
  },
};

function normalizeWidgetIds(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const sanitized: string[] = [];

  items.forEach((value) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    sanitized.push(trimmed);
  });

  return sanitized;
}

function parseLayout(payload: unknown): DashboardLayoutConfig | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidate = payload as { version?: unknown; widgets?: unknown };
  const widgets = normalizeWidgetIds(candidate.widgets);
  if (widgets.length === 0) return null;
  return {
    version: typeof candidate.version === 'string' ? candidate.version : DASHBOARD_LAYOUT_VERSION,
    widgets,
  };
}

export function getDefaultDashboardLayout(dashboardKey: DashboardKey): DashboardLayoutConfig {
  const fallback = DEFAULT_DASHBOARD_LAYOUTS[dashboardKey];
  return {
    version: fallback.version,
    widgets: [...fallback.widgets],
  };
}

export async function loadDashboardLayout(dashboardKey: DashboardKey): Promise<DashboardLayoutConfig> {
  const { data, error } = await supabase
    .from('dashboard_layouts')
    .select('layout')
    .eq('dashboard_key', dashboardKey)
    .maybeSingle();

  if (error) {
    console.warn('Failed to load dashboard layout:', error);
    return getDefaultDashboardLayout(dashboardKey);
  }

  const parsed = parseLayout(data?.layout);
  if (!parsed) {
    return getDefaultDashboardLayout(dashboardKey);
  }

  return parsed;
}

export async function saveDashboardLayout(
  dashboardKey: DashboardKey,
  layout: DashboardLayoutConfig
): Promise<void> {
  const payload: DashboardLayoutConfig = {
    version: layout.version || DASHBOARD_LAYOUT_VERSION,
    widgets: normalizeWidgetIds(layout.widgets),
  };

  await supabase
    .from('dashboard_layouts')
    .upsert({
      dashboard_key: dashboardKey,
      layout: payload as unknown as Json,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'dashboard_key' });
}

import type { DashboardKey } from './dashboardLayouts';

export type DashboardWidgetCategory = 'core' | 'insights' | 'coverage' | 'roadmap' | 'gaps' | 'trend';

export interface DashboardWidgetDefinition {
  id: string;
  dashboardKeys: DashboardKey[];
  category: DashboardWidgetCategory;
  labelKey: string;
  descriptionKey?: string;
}

export const DASHBOARD_WIDGET_CATALOG: DashboardWidgetDefinition[] = [
  {
    id: 'executive.header',
    dashboardKeys: ['executive'],
    category: 'core',
    labelKey: 'settings.dashboardWidgets.executiveHeader.label',
    descriptionKey: 'settings.dashboardWidgets.executiveHeader.description',
  },
  {
    id: 'executive.kpis',
    dashboardKeys: ['executive'],
    category: 'core',
    labelKey: 'settings.dashboardWidgets.executiveKpis.label',
    descriptionKey: 'settings.dashboardWidgets.executiveKpis.description',
  },
  {
    id: 'executive.indicators',
    dashboardKeys: ['executive'],
    category: 'insights',
    labelKey: 'settings.dashboardWidgets.executiveIndicators.label',
    descriptionKey: 'settings.dashboardWidgets.executiveIndicators.description',
  },
  {
    id: 'executive.charts',
    dashboardKeys: ['executive'],
    category: 'insights',
    labelKey: 'settings.dashboardWidgets.executiveCharts.label',
    descriptionKey: 'settings.dashboardWidgets.executiveCharts.description',
  },
  {
    id: 'executive.frameworkCoverage',
    dashboardKeys: ['executive'],
    category: 'coverage',
    labelKey: 'settings.dashboardWidgets.executiveFrameworkCoverage.label',
    descriptionKey: 'settings.dashboardWidgets.executiveFrameworkCoverage.description',
  },
  {
    id: 'executive.frameworkCategories',
    dashboardKeys: ['executive'],
    category: 'coverage',
    labelKey: 'settings.dashboardWidgets.executiveFrameworkCategories.label',
    descriptionKey: 'settings.dashboardWidgets.executiveFrameworkCategories.description',
  },
  {
    id: 'executive.roadmap',
    dashboardKeys: ['executive'],
    category: 'roadmap',
    labelKey: 'settings.dashboardWidgets.executiveRoadmap.label',
    descriptionKey: 'settings.dashboardWidgets.executiveRoadmap.description',
  },
  {
    id: 'executive.criticalGaps',
    dashboardKeys: ['executive'],
    category: 'gaps',
    labelKey: 'settings.dashboardWidgets.executiveCriticalGaps.label',
    descriptionKey: 'settings.dashboardWidgets.executiveCriticalGaps.description',
  },
  {
    id: 'grc.header',
    dashboardKeys: ['grc'],
    category: 'core',
    labelKey: 'settings.dashboardWidgets.grcHeader.label',
    descriptionKey: 'settings.dashboardWidgets.grcHeader.description',
  },
  {
    id: 'grc.statusPills',
    dashboardKeys: ['grc'],
    category: 'core',
    labelKey: 'settings.dashboardWidgets.grcStatusPills.label',
    descriptionKey: 'settings.dashboardWidgets.grcStatusPills.description',
  },
  {
    id: 'grc.kpis',
    dashboardKeys: ['grc'],
    category: 'core',
    labelKey: 'settings.dashboardWidgets.grcKpis.label',
    descriptionKey: 'settings.dashboardWidgets.grcKpis.description',
  },
  {
    id: 'grc.frameworkCoverage',
    dashboardKeys: ['grc'],
    category: 'coverage',
    labelKey: 'settings.dashboardWidgets.grcFrameworkCoverage.label',
    descriptionKey: 'settings.dashboardWidgets.grcFrameworkCoverage.description',
  },
  {
    id: 'grc.indicators',
    dashboardKeys: ['grc'],
    category: 'insights',
    labelKey: 'settings.dashboardWidgets.grcIndicators.label',
    descriptionKey: 'settings.dashboardWidgets.grcIndicators.description',
  },
  {
    id: 'grc.roadmap',
    dashboardKeys: ['grc'],
    category: 'roadmap',
    labelKey: 'settings.dashboardWidgets.grcRoadmap.label',
    descriptionKey: 'settings.dashboardWidgets.grcRoadmap.description',
  },
  {
    id: 'grc.tabs',
    dashboardKeys: ['grc'],
    category: 'insights',
    labelKey: 'settings.dashboardWidgets.grcTabs.label',
    descriptionKey: 'settings.dashboardWidgets.grcTabs.description',
  },
  {
    id: 'specialist.header',
    dashboardKeys: ['specialist'],
    category: 'core',
    labelKey: 'settings.dashboardWidgets.specialistHeader.label',
    descriptionKey: 'settings.dashboardWidgets.specialistHeader.description',
  },
  {
    id: 'specialist.filters',
    dashboardKeys: ['specialist'],
    category: 'core',
    labelKey: 'settings.dashboardWidgets.specialistFilters.label',
    descriptionKey: 'settings.dashboardWidgets.specialistFilters.description',
  },
  {
    id: 'specialist.kpis',
    dashboardKeys: ['specialist'],
    category: 'core',
    labelKey: 'settings.dashboardWidgets.specialistKpis.label',
    descriptionKey: 'settings.dashboardWidgets.specialistKpis.description',
  },
  {
    id: 'specialist.indicators',
    dashboardKeys: ['specialist'],
    category: 'insights',
    labelKey: 'settings.dashboardWidgets.specialistIndicators.label',
    descriptionKey: 'settings.dashboardWidgets.specialistIndicators.description',
  },
  {
    id: 'specialist.roadmap',
    dashboardKeys: ['specialist'],
    category: 'roadmap',
    labelKey: 'settings.dashboardWidgets.specialistRoadmap.label',
    descriptionKey: 'settings.dashboardWidgets.specialistRoadmap.description',
  },
  {
    id: 'specialist.tabs',
    dashboardKeys: ['specialist'],
    category: 'insights',
    labelKey: 'settings.dashboardWidgets.specialistTabs.label',
    descriptionKey: 'settings.dashboardWidgets.specialistTabs.description',
  },
  {
    id: 'shared.periodComparison',
    dashboardKeys: ['executive', 'grc', 'specialist'],
    category: 'trend',
    labelKey: 'settings.dashboardWidgets.periodComparison.label',
    descriptionKey: 'settings.dashboardWidgets.periodComparison.description',
  },
  {
    id: 'shared.maturityTrend',
    dashboardKeys: ['executive', 'grc', 'specialist'],
    category: 'trend',
    labelKey: 'settings.dashboardWidgets.maturityTrend.label',
    descriptionKey: 'settings.dashboardWidgets.maturityTrend.description',
  },
];

export function getWidgetsForDashboard(dashboardKey: DashboardKey): DashboardWidgetDefinition[] {
  return DASHBOARD_WIDGET_CATALOG.filter((widget) => widget.dashboardKeys.includes(dashboardKey));
}

export function getWidgetDefinition(widgetId: string): DashboardWidgetDefinition | undefined {
  return DASHBOARD_WIDGET_CATALOG.find((widget) => widget.id === widgetId);
}

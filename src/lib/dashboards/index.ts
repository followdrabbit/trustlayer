/**
 * Custom Dashboards System
 * Entry point for drag-and-drop dashboard builder
 */

export * from './types';
export * from './dashboard-service';

// Re-export commonly used items
export {
  DashboardService,
  dashboardService,
} from './dashboard-service';

export {
  DEFAULT_LAYOUT_CONFIG,
  WIDGET_CATEGORIES,
  TEMPLATE_CATEGORIES,
  METRIC_FORMATS,
} from './types';

export type {
  Dashboard,
  DashboardWidget,
  WidgetType,
  DashboardTemplate,
  DataSource,
  UserDashboardPreferences,
  LayoutConfig,
  WidgetLayout,
  GridLayoutItem,
  BaseWidgetProps,
} from './types';

/**
 * Custom Dashboards Types
 * Types for drag-and-drop dashboard builder system
 */

// ============================================================================
// Dashboard Core Types
// ============================================================================

export type DashboardVisibility = 'private' | 'shared' | 'organization' | 'public';

export interface LayoutConfig {
  columns: number;
  rowHeight: number;
  gap: number;
  breakpoints?: {
    lg: number;
    md: number;
    sm: number;
    xs: number;
  };
}

export interface WidgetLayout {
  x: number; // Column position (0-based)
  y: number; // Row position (0-based)
  w: number; // Width in columns
  h: number; // Height in rows
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface DashboardWidget {
  id: string;
  type: string; // References widget_types.type_key
  title: string;
  description?: string;
  config: Record<string, any>;
  layout: WidgetLayout;
  dataSourceId?: string;
  refreshInterval?: number; // Seconds
}

export interface Dashboard {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  icon?: string;
  createdBy: string;
  visibility: DashboardVisibility;
  allowedRoles?: string[];
  layoutConfig: LayoutConfig;
  widgets: DashboardWidget[];
  isDefault: boolean;
  isTemplate: boolean;
  refreshInterval?: number;
  shareToken?: string;
  shareExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Widget Types
// ============================================================================

export type WidgetCategory = 'metric' | 'chart' | 'data' | 'audit' | 'custom';

export interface WidgetType {
  id: string;
  typeKey: string;
  name: string;
  description?: string;
  category: WidgetCategory;
  icon?: string;
  configSchema: Record<string, any>; // JSON Schema
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
  supportsFilters: boolean;
  supportsExport: boolean;
  requiresDataSource: boolean;
  isSystem: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Widget Configuration Types
// ============================================================================

export type MetricFormat = 'number' | 'percentage' | 'currency' | 'duration';
export type ChartOrientation = 'vertical' | 'horizontal';
export type ChartVariant = 'pie' | 'donut';
export type TextAlignment = 'left' | 'center' | 'right';

export interface KPICardConfig {
  metric: string;
  format: MetricFormat;
  color?: string;
  icon?: string;
  prefix?: string;
  suffix?: string;
}

export interface MetricTrendConfig {
  metric: string;
  comparison: 'previous-period' | 'previous-month' | 'previous-year';
  showSparkline?: boolean;
  format?: MetricFormat;
}

export interface GaugeConfig {
  metric: string;
  min: number;
  max: number;
  thresholds?: Array<{ value: number; color: string; label?: string }>;
  unit?: string;
}

export interface LineChartConfig {
  dataSource: string;
  xAxis: string;
  yAxis: string[];
  smooth?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  colors?: string[];
}

export interface BarChartConfig {
  dataSource: string;
  xAxis: string;
  yAxis: string;
  orientation: ChartOrientation;
  stacked?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  colors?: string[];
}

export interface PieChartConfig {
  dataSource: string;
  labelField: string;
  valueField: string;
  variant: ChartVariant;
  showLabels?: boolean;
  showLegend?: boolean;
  colors?: string[];
}

export interface AreaChartConfig {
  dataSource: string;
  xAxis: string;
  yAxis: string[];
  stacked?: boolean;
  fillOpacity?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  colors?: string[];
}

export interface DataTableConfig {
  dataSource: string;
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    width?: number;
    format?: string;
  }>;
  pageSize: number;
  sortable: boolean;
  filterable?: boolean;
  exportable?: boolean;
}

export interface ListConfig {
  dataSource: string;
  itemTemplate: string; // Template string with {{field}} placeholders
  limit: number;
  showMore?: boolean;
}

export interface TimelineConfig {
  eventTypes?: string[];
  limit: number;
  showFilters?: boolean;
  onlySuspicious?: boolean;
}

export interface ActivityFeedConfig {
  limit: number;
  filterByUser?: boolean;
  onlySuspicious?: boolean;
}

export interface TextWidgetConfig {
  content: string; // Markdown supported
  alignment: TextAlignment;
  fontSize?: string;
}

export interface IframeConfig {
  url: string;
  allowScripts?: boolean;
}

// ============================================================================
// Dashboard Templates
// ============================================================================

export type TemplateCategory = 'executive' | 'compliance' | 'security' | 'audit' | 'operations';

export interface DashboardTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  previewImage?: string;
  layoutConfig: LayoutConfig;
  widgets: DashboardWidget[];
  useCount: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Data Sources
// ============================================================================

export type DataSourceType = 'query' | 'function' | 'api' | 'computed';

export interface QueryDataSourceConfig {
  table: string;
  select: string;
  filters?: Array<{
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';
    value: any;
  }>;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

export interface FunctionDataSourceConfig {
  functionName: string;
  params: Record<string, any>;
}

export interface APIDataSourceConfig {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  transform?: string; // JavaScript transform function
}

export interface ComputedDataSourceConfig {
  sources: string[]; // Other data source IDs
  computeFunction: string; // JavaScript compute function
}

export interface DataSource {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  sourceType: DataSourceType;
  config: QueryDataSourceConfig | FunctionDataSourceConfig | APIDataSourceConfig | ComputedDataSourceConfig;
  cacheDuration?: number;
  lastCachedAt?: string;
  cachedData?: any;
  createdBy: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// User Preferences
// ============================================================================

export interface UserDashboardPreferences {
  id: string;
  userId: string;
  organizationId: string;
  defaultDashboardId?: string;
  theme?: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  recentDashboards: string[];
  favoriteDashboards: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Dashboard Service Interface
// ============================================================================

export interface IDashboardService {
  // Dashboards
  getDashboards(organizationId: string, filters?: DashboardFilters): Promise<Dashboard[]>;
  getDashboard(id: string): Promise<Dashboard | null>;
  createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard>;
  updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard>;
  deleteDashboard(id: string): Promise<void>;
  cloneDashboard(id: string, name: string): Promise<Dashboard>;
  shareDashboard(id: string, expiresIn?: number): Promise<string>; // Returns share token

  // Widget Types
  getWidgetTypes(category?: WidgetCategory): Promise<WidgetType[]>;
  getWidgetType(typeKey: string): Promise<WidgetType | null>;

  // Templates
  getTemplates(category?: TemplateCategory): Promise<DashboardTemplate[]>;
  getTemplate(id: string): Promise<DashboardTemplate | null>;
  createFromTemplate(templateId: string, name: string, organizationId: string): Promise<Dashboard>;

  // Data Sources
  getDataSources(organizationId: string): Promise<DataSource[]>;
  getDataSource(id: string): Promise<DataSource | null>;
  createDataSource(dataSource: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataSource>;
  updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource>;
  deleteDataSource(id: string): Promise<void>;
  fetchDataSourceData(id: string, forceRefresh?: boolean): Promise<any>;

  // User Preferences
  getUserPreferences(userId: string, organizationId: string): Promise<UserDashboardPreferences | null>;
  updateUserPreferences(userId: string, organizationId: string, updates: Partial<UserDashboardPreferences>): Promise<UserDashboardPreferences>;
  addToRecent(userId: string, organizationId: string, dashboardId: string): Promise<void>;
  toggleFavorite(userId: string, organizationId: string, dashboardId: string): Promise<void>;
}

// ============================================================================
// Helper Types
// ============================================================================

export interface DashboardFilters {
  visibility?: DashboardVisibility;
  createdBy?: string;
  isTemplate?: boolean;
  isDefault?: boolean;
  search?: string;
}

export interface WidgetData {
  widgetId: string;
  data: any;
  loading: boolean;
  error?: string;
  lastUpdated?: string;
}

export interface DashboardExportOptions {
  format: 'json' | 'pdf' | 'png';
  includeData?: boolean;
  layout?: 'portrait' | 'landscape';
}

// ============================================================================
// Grid Layout Types (for react-grid-layout)
// ============================================================================

export interface GridLayoutItem {
  i: string; // Widget ID
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean; // Widget cannot be moved/resized
  isDraggable?: boolean;
  isResizable?: boolean;
}

export type GridBreakpoint = 'lg' | 'md' | 'sm' | 'xs';

export interface GridLayouts {
  lg: GridLayoutItem[];
  md: GridLayoutItem[];
  sm: GridLayoutItem[];
  xs: GridLayoutItem[];
}

// ============================================================================
// Widget Component Props
// ============================================================================

export interface BaseWidgetProps {
  widget: DashboardWidget;
  data?: any;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onConfigure?: () => void;
  onRemove?: () => void;
  isEditing?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  columns: 12,
  rowHeight: 80,
  gap: 16,
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
  },
};

export const WIDGET_CATEGORIES: Record<WidgetCategory, { label: string; icon: string }> = {
  metric: { label: 'Métricas', icon: 'activity' },
  chart: { label: 'Gráficos', icon: 'bar-chart' },
  data: { label: 'Dados', icon: 'table' },
  audit: { label: 'Auditoria', icon: 'shield' },
  custom: { label: 'Personalizado', icon: 'puzzle' },
};

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { label: string; icon: string }> = {
  executive: { label: 'Executivo', icon: 'briefcase' },
  compliance: { label: 'Conformidade', icon: 'check-circle' },
  security: { label: 'Segurança', icon: 'shield' },
  audit: { label: 'Auditoria', icon: 'file-search' },
  operations: { label: 'Operações', icon: 'settings' },
};

export const METRIC_FORMATS: Record<MetricFormat, { label: string; example: string }> = {
  number: { label: 'Número', example: '1,234' },
  percentage: { label: 'Porcentagem', example: '85%' },
  currency: { label: 'Moeda', example: 'R$ 1.234,56' },
  duration: { label: 'Duração', example: '2h 30m' },
};

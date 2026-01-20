/**
 * Dashboard Service
 * Manages custom dashboards, widgets, templates, and data sources
 */

import { supabase } from '@/lib/supabase';
import type {
  IDashboardService,
  Dashboard,
  DashboardFilters,
  WidgetType,
  WidgetCategory,
  DashboardTemplate,
  TemplateCategory,
  DataSource,
  DataSourceType,
  UserDashboardPreferences,
} from './types';

export class DashboardService implements IDashboardService {
  // ============================================================================
  // Dashboards
  // ============================================================================

  async getDashboards(
    organizationId: string,
    filters?: DashboardFilters
  ): Promise<Dashboard[]> {
    let query = supabase
      .from('dashboards')
      .select('*')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (filters?.visibility) {
      query = query.eq('visibility', filters.visibility);
    }
    if (filters?.createdBy) {
      query = query.eq('created_by', filters.createdBy);
    }
    if (filters?.isTemplate !== undefined) {
      query = query.eq('is_template', filters.isTemplate);
    }
    if (filters?.isDefault !== undefined) {
      query = query.eq('is_default', filters.isDefault);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.map(this.mapDashboard) || [];
  }

  async getDashboard(id: string): Promise<Dashboard | null> {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapDashboard(data);
  }

  async createDashboard(
    dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Dashboard> {
    const { data, error} = await supabase
      .from('dashboards')
      .insert({
        organization_id: dashboard.organizationId,
        name: dashboard.name,
        description: dashboard.description,
        icon: dashboard.icon,
        created_by: dashboard.createdBy,
        visibility: dashboard.visibility,
        allowed_roles: dashboard.allowedRoles,
        layout_config: dashboard.layoutConfig,
        widgets: dashboard.widgets,
        is_default: dashboard.isDefault,
        is_template: dashboard.isTemplate,
        refresh_interval: dashboard.refreshInterval,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapDashboard(data);
  }

  async updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.visibility !== undefined) updateData.visibility = updates.visibility;
    if (updates.allowedRoles !== undefined) updateData.allowed_roles = updates.allowedRoles;
    if (updates.layoutConfig !== undefined) updateData.layout_config = updates.layoutConfig;
    if (updates.widgets !== undefined) updateData.widgets = updates.widgets;
    if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;
    if (updates.refreshInterval !== undefined) updateData.refresh_interval = updates.refreshInterval;

    const { data, error } = await supabase
      .from('dashboards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapDashboard(data);
  }

  async deleteDashboard(id: string): Promise<void> {
    const { error } = await supabase.from('dashboards').delete().eq('id', id);
    if (error) throw error;
  }

  async cloneDashboard(id: string, name: string): Promise<Dashboard> {
    const original = await this.getDashboard(id);
    if (!original) throw new Error('Dashboard not found');

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    return this.createDashboard({
      ...original,
      name,
      createdBy: user.user.id,
      isDefault: false,
      isTemplate: false,
      shareToken: undefined,
      shareExpiresAt: undefined,
    });
  }

  async shareDashboard(id: string, expiresIn?: number): Promise<string> {
    const token = this.generateShareToken();
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : undefined;

    await this.updateDashboard(id, {
      shareToken: token,
      shareExpiresAt: expiresAt,
    });

    return token;
  }

  // ============================================================================
  // Widget Types
  // ============================================================================

  async getWidgetTypes(category?: WidgetCategory): Promise<WidgetType[]> {
    let query = supabase
      .from('widget_types')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.map(this.mapWidgetType) || [];
  }

  async getWidgetType(typeKey: string): Promise<WidgetType | null> {
    const { data, error } = await supabase
      .from('widget_types')
      .select('*')
      .eq('type_key', typeKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapWidgetType(data);
  }

  // ============================================================================
  // Templates
  // ============================================================================

  async getTemplates(category?: TemplateCategory): Promise<DashboardTemplate[]> {
    let query = supabase
      .from('dashboard_templates')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('use_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.map(this.mapTemplate) || [];
  }

  async getTemplate(id: string): Promise<DashboardTemplate | null> {
    const { data, error } = await supabase
      .from('dashboard_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapTemplate(data);
  }

  async createFromTemplate(
    templateId: string,
    name: string,
    organizationId: string
  ): Promise<Dashboard> {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Create dashboard from template
    const dashboard = await this.createDashboard({
      organizationId,
      name,
      description: template.description,
      createdBy: user.user.id,
      visibility: 'private',
      layoutConfig: template.layoutConfig,
      widgets: template.widgets,
      isDefault: false,
      isTemplate: false,
    });

    // Increment template use count
    await supabase
      .from('dashboard_templates')
      .update({ use_count: template.useCount + 1 })
      .eq('id', templateId);

    return dashboard;
  }

  // ============================================================================
  // Data Sources
  // ============================================================================

  async getDataSources(organizationId: string): Promise<DataSource[]> {
    const { data, error } = await supabase
      .from('dashboard_data_sources')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data?.map(this.mapDataSource) || [];
  }

  async getDataSource(id: string): Promise<DataSource | null> {
    const { data, error } = await supabase
      .from('dashboard_data_sources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapDataSource(data);
  }

  async createDataSource(
    dataSource: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DataSource> {
    const { data, error } = await supabase
      .from('dashboard_data_sources')
      .insert({
        organization_id: dataSource.organizationId,
        name: dataSource.name,
        description: dataSource.description,
        source_type: dataSource.sourceType,
        config: dataSource.config,
        cache_duration: dataSource.cacheDuration,
        created_by: dataSource.createdBy,
        is_shared: dataSource.isShared,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapDataSource(data);
  }

  async updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.config !== undefined) updateData.config = updates.config;
    if (updates.cacheDuration !== undefined) updateData.cache_duration = updates.cacheDuration;
    if (updates.isShared !== undefined) updateData.is_shared = updates.isShared;

    const { data, error } = await supabase
      .from('dashboard_data_sources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapDataSource(data);
  }

  async deleteDataSource(id: string): Promise<void> {
    const { error } = await supabase.from('dashboard_data_sources').delete().eq('id', id);
    if (error) throw error;
  }

  async fetchDataSourceData(id: string, forceRefresh = false): Promise<any> {
    const dataSource = await this.getDataSource(id);
    if (!dataSource) throw new Error('Data source not found');

    // Check cache
    if (
      !forceRefresh &&
      dataSource.cachedData &&
      dataSource.lastCachedAt &&
      dataSource.cacheDuration
    ) {
      const cacheAge = Date.now() - new Date(dataSource.lastCachedAt).getTime();
      if (cacheAge < dataSource.cacheDuration * 1000) {
        return dataSource.cachedData;
      }
    }

    // Fetch fresh data based on source type
    let data: any;

    switch (dataSource.sourceType) {
      case 'query':
        data = await this.executeQueryDataSource(dataSource);
        break;
      case 'function':
        data = await this.executeFunctionDataSource(dataSource);
        break;
      case 'api':
        data = await this.executeAPIDataSource(dataSource);
        break;
      case 'computed':
        data = await this.executeComputedDataSource(dataSource);
        break;
      default:
        throw new Error(`Unsupported data source type: ${dataSource.sourceType}`);
    }

    // Update cache
    if (dataSource.cacheDuration) {
      await supabase
        .from('dashboard_data_sources')
        .update({
          cached_data: data,
          last_cached_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return data;
  }

  // ============================================================================
  // User Preferences
  // ============================================================================

  async getUserPreferences(
    userId: string,
    organizationId: string
  ): Promise<UserDashboardPreferences | null> {
    const { data, error } = await supabase
      .from('user_dashboard_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Create default preferences
        return this.createDefaultPreferences(userId, organizationId);
      }
      throw error;
    }

    return this.mapUserPreferences(data);
  }

  async updateUserPreferences(
    userId: string,
    organizationId: string,
    updates: Partial<UserDashboardPreferences>
  ): Promise<UserDashboardPreferences> {
    const updateData: any = {};

    if (updates.defaultDashboardId !== undefined) updateData.default_dashboard_id = updates.defaultDashboardId;
    if (updates.theme !== undefined) updateData.theme = updates.theme;
    if (updates.compactMode !== undefined) updateData.compact_mode = updates.compactMode;
    if (updates.recentDashboards !== undefined) updateData.recent_dashboards = updates.recentDashboards;
    if (updates.favoriteDashboards !== undefined) updateData.favorite_dashboards = updates.favoriteDashboards;

    const { data, error } = await supabase
      .from('user_dashboard_preferences')
      .upsert({
        user_id: userId,
        organization_id: organizationId,
        ...updateData,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapUserPreferences(data);
  }

  async addToRecent(userId: string, organizationId: string, dashboardId: string): Promise<void> {
    const prefs = await this.getUserPreferences(userId, organizationId);
    if (!prefs) return;

    const recent = prefs.recentDashboards.filter((id) => id !== dashboardId);
    recent.unshift(dashboardId);

    await this.updateUserPreferences(userId, organizationId, {
      recentDashboards: recent.slice(0, 10), // Keep last 10
    });
  }

  async toggleFavorite(userId: string, organizationId: string, dashboardId: string): Promise<void> {
    const prefs = await this.getUserPreferences(userId, organizationId);
    if (!prefs) return;

    const favorites = prefs.favoriteDashboards.includes(dashboardId)
      ? prefs.favoriteDashboards.filter((id) => id !== dashboardId)
      : [...prefs.favoriteDashboards, dashboardId];

    await this.updateUserPreferences(userId, organizationId, {
      favoriteDashboards: favorites,
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async executeQueryDataSource(dataSource: DataSource): Promise<any> {
    const config = dataSource.config as any;
    let query = supabase.from(config.table).select(config.select);

    // Apply filters
    if (config.filters) {
      for (const filter of config.filters) {
        switch (filter.operator) {
          case 'eq':
            query = query.eq(filter.field, filter.value);
            break;
          case 'neq':
            query = query.neq(filter.field, filter.value);
            break;
          case 'gt':
            query = query.gt(filter.field, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.field, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.field, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.field, filter.value);
            break;
          case 'in':
            query = query.in(filter.field, filter.value);
            break;
          case 'like':
            query = query.like(filter.field, filter.value);
            break;
        }
      }
    }

    // Apply ordering
    if (config.orderBy) {
      query = query.order(config.orderBy.field, { ascending: config.orderBy.direction === 'asc' });
    }

    // Apply limit
    if (config.limit) {
      query = query.limit(config.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }

  private async executeFunctionDataSource(dataSource: DataSource): Promise<any> {
    const config = dataSource.config as any;

    const { data, error } = await supabase.rpc(config.functionName, config.params);
    if (error) throw error;

    return data;
  }

  private async executeAPIDataSource(dataSource: DataSource): Promise<any> {
    const config = dataSource.config as any;

    const response = await fetch(config.url, {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    let data = await response.json();

    // Apply transform if provided
    if (config.transform) {
      const transformFn = new Function('data', config.transform);
      data = transformFn(data);
    }

    return data;
  }

  private async executeComputedDataSource(dataSource: DataSource): Promise<any> {
    const config = dataSource.config as any;

    // Fetch source data
    const sourceData: any[] = [];
    for (const sourceId of config.sources) {
      const data = await this.fetchDataSourceData(sourceId);
      sourceData.push(data);
    }

    // Execute compute function
    const computeFn = new Function('sources', config.computeFunction);
    return computeFn(sourceData);
  }

  private async createDefaultPreferences(
    userId: string,
    organizationId: string
  ): Promise<UserDashboardPreferences> {
    const { data, error } = await supabase
      .from('user_dashboard_preferences')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        compact_mode: false,
        recent_dashboards: [],
        favorite_dashboards: [],
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapUserPreferences(data);
  }

  private generateShareToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  private mapDashboard(data: any): Dashboard {
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      createdBy: data.created_by,
      visibility: data.visibility,
      allowedRoles: data.allowed_roles,
      layoutConfig: data.layout_config,
      widgets: data.widgets,
      isDefault: data.is_default,
      isTemplate: data.is_template,
      refreshInterval: data.refresh_interval,
      shareToken: data.share_token,
      shareExpiresAt: data.share_expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapWidgetType(data: any): WidgetType {
    return {
      id: data.id,
      typeKey: data.type_key,
      name: data.name,
      description: data.description,
      category: data.category,
      icon: data.icon,
      configSchema: data.config_schema,
      defaultWidth: data.default_width,
      defaultHeight: data.default_height,
      minWidth: data.min_width,
      minHeight: data.min_height,
      maxWidth: data.max_width,
      maxHeight: data.max_height,
      supportsFilters: data.supports_filters,
      supportsExport: data.supports_export,
      requiresDataSource: data.requires_data_source,
      isSystem: data.is_system,
      isPremium: data.is_premium,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapTemplate(data: any): DashboardTemplate {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      previewImage: data.preview_image,
      layoutConfig: data.layout_config,
      widgets: data.widgets,
      useCount: data.use_count,
      isFeatured: data.is_featured,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapDataSource(data: any): DataSource {
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      sourceType: data.source_type,
      config: data.config,
      cacheDuration: data.cache_duration,
      lastCachedAt: data.last_cached_at,
      cachedData: data.cached_data,
      createdBy: data.created_by,
      isShared: data.is_shared,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapUserPreferences(data: any): UserDashboardPreferences {
    return {
      id: data.id,
      userId: data.user_id,
      organizationId: data.organization_id,
      defaultDashboardId: data.default_dashboard_id,
      theme: data.theme,
      compactMode: data.compact_mode,
      recentDashboards: data.recent_dashboards || [],
      favoriteDashboards: data.favorite_dashboards || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Singleton instance
export const dashboardService = new DashboardService();

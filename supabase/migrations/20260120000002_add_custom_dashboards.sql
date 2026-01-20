-- Custom Dashboards Migration
-- Enables users to create personalized dashboards with drag-and-drop widgets

-- Dashboards Table
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Dashboard metadata
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- lucide icon name

  -- Ownership and visibility
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('private', 'shared', 'organization', 'public')),
  allowed_roles TEXT[], -- Roles that can view this dashboard

  -- Layout configuration
  layout_config JSONB NOT NULL DEFAULT '{"columns": 12, "rowHeight": 80, "gap": 16}'::jsonb,
  -- Example layout_config:
  -- {
  --   "columns": 12,       // Grid columns (responsive)
  --   "rowHeight": 80,     // Height of each row in pixels
  --   "gap": 16,           // Gap between widgets in pixels
  --   "breakpoints": {
  --     "lg": 1200,
  --     "md": 996,
  --     "sm": 768,
  --     "xs": 480
  --   }
  -- }

  -- Widget placements
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example widgets array:
  -- [
  --   {
  --     "id": "widget-1",
  --     "type": "kpi-card",
  --     "title": "Total Assessments",
  --     "config": { "metric": "assessments_count", "format": "number" },
  --     "layout": { "x": 0, "y": 0, "w": 3, "h": 2 }
  --   },
  --   {
  --     "id": "widget-2",
  --     "type": "chart",
  --     "title": "Compliance Trend",
  --     "config": { "chartType": "line", "dataSource": "compliance_over_time" },
  --     "layout": { "x": 3, "y": 0, "w": 6, "h": 4 }
  --   }
  -- ]

  -- Dashboard settings
  is_default BOOLEAN DEFAULT false, -- Is this the default dashboard for the organization?
  is_template BOOLEAN DEFAULT false, -- Is this a template that can be cloned?
  refresh_interval INTEGER, -- Auto-refresh interval in seconds (null = no auto-refresh)

  -- Sharing and collaboration
  share_token TEXT UNIQUE, -- Token for public sharing
  share_expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dashboard Widgets Library (predefined widget types)
CREATE TABLE IF NOT EXISTS widget_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Widget type info
  type_key TEXT NOT NULL UNIQUE, -- e.g., 'kpi-card', 'chart', 'table', 'timeline'
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'metric', 'chart', 'data', 'audit', 'custom'
  icon TEXT, -- lucide icon name

  -- Configuration schema
  config_schema JSONB NOT NULL,
  -- Example config_schema (JSON Schema):
  -- {
  --   "type": "object",
  --   "properties": {
  --     "metric": { "type": "string", "enum": ["assessments_count", "compliance_score"] },
  --     "format": { "type": "string", "enum": ["number", "percentage", "currency"] },
  --     "color": { "type": "string" }
  --   },
  --   "required": ["metric"]
  -- }

  -- Default size
  default_width INTEGER NOT NULL DEFAULT 4,
  default_height INTEGER NOT NULL DEFAULT 2,
  min_width INTEGER NOT NULL DEFAULT 2,
  min_height INTEGER NOT NULL DEFAULT 1,
  max_width INTEGER,
  max_height INTEGER,

  -- Capabilities
  supports_filters BOOLEAN DEFAULT true,
  supports_export BOOLEAN DEFAULT true,
  requires_data_source BOOLEAN DEFAULT true,

  -- Availability
  is_system BOOLEAN DEFAULT true, -- System widgets vs custom widgets
  is_premium BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dashboard Templates (pre-built dashboards for quick start)
CREATE TABLE IF NOT EXISTS dashboard_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'executive', 'compliance', 'security', 'audit', 'operations'
  preview_image TEXT, -- URL to preview image

  -- Template content
  layout_config JSONB NOT NULL,
  widgets JSONB NOT NULL,

  -- Metadata
  use_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data Sources (for widgets that need dynamic data)
CREATE TABLE IF NOT EXISTS dashboard_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Data source info
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('query', 'function', 'api', 'computed')),

  -- Configuration
  config JSONB NOT NULL,
  -- Example for source_type = 'query':
  -- {
  --   "table": "assessments",
  --   "select": "id, name, score, created_at",
  --   "filters": [{"field": "status", "operator": "eq", "value": "completed"}],
  --   "orderBy": {"field": "created_at", "direction": "desc"},
  --   "limit": 100
  -- }
  -- Example for source_type = 'function':
  -- {
  --   "functionName": "get_compliance_trend",
  --   "params": {"period": "30d"}
  -- }

  -- Caching
  cache_duration INTEGER, -- Cache duration in seconds
  last_cached_at TIMESTAMPTZ,
  cached_data JSONB,

  -- Access control
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_shared BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Dashboard Preferences
CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Preferences
  default_dashboard_id UUID REFERENCES dashboards(id) ON DELETE SET NULL,
  theme TEXT CHECK (theme IN ('light', 'dark', 'auto')),
  compact_mode BOOLEAN DEFAULT false,

  -- Recently viewed dashboards
  recent_dashboards UUID[] DEFAULT '{}',

  -- Favorite dashboards
  favorite_dashboards UUID[] DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, organization_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboards_org ON dashboards(organization_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_by ON dashboards(created_by);
CREATE INDEX IF NOT EXISTS idx_dashboards_visibility ON dashboards(visibility);
CREATE INDEX IF NOT EXISTS idx_dashboards_is_default ON dashboards(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_dashboards_is_template ON dashboards(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_dashboards_share_token ON dashboards(share_token) WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_widget_types_category ON widget_types(category);
CREATE INDEX IF NOT EXISTS idx_widget_types_type_key ON widget_types(type_key);

CREATE INDEX IF NOT EXISTS idx_dashboard_templates_category ON dashboard_templates(category);
CREATE INDEX IF NOT EXISTS idx_dashboard_templates_is_featured ON dashboard_templates(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_data_sources_org ON dashboard_data_sources(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_created_by ON dashboard_data_sources(created_by);

CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_dashboard_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prefs_org ON user_dashboard_preferences(organization_id);

-- Row Level Security
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dashboards
-- Users can view dashboards based on visibility settings
CREATE POLICY "Users can view accessible dashboards"
  ON dashboards FOR SELECT
  USING (
    visibility = 'public'
    OR (
      visibility = 'organization'
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND organization_id = dashboards.organization_id
      )
    )
    OR (
      visibility = 'shared'
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE user_id = auth.uid()
          AND organization_id = dashboards.organization_id
          AND (allowed_roles IS NULL OR role = ANY(dashboards.allowed_roles))
        )
      )
    )
    OR (visibility = 'private' AND created_by = auth.uid())
  );

-- Users can create dashboards in their organization
CREATE POLICY "Users can create dashboards"
  ON dashboards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = dashboards.organization_id
    )
  );

-- Users can update their own dashboards or org dashboards if admin
CREATE POLICY "Users can update their dashboards"
  ON dashboards FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = dashboards.organization_id
      AND role IN ('admin', 'manager')
    )
  );

-- Users can delete their own dashboards
CREATE POLICY "Users can delete their dashboards"
  ON dashboards FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = dashboards.organization_id
      AND role = 'admin'
    )
  );

-- RLS Policies for widget_types (read-only for all authenticated users)
CREATE POLICY "Anyone can view widget types"
  ON widget_types FOR SELECT
  USING (true);

-- RLS Policies for dashboard_templates (read-only for all authenticated users)
CREATE POLICY "Anyone can view dashboard templates"
  ON dashboard_templates FOR SELECT
  USING (is_active = true);

-- RLS Policies for data_sources
CREATE POLICY "Users can view org data sources"
  ON dashboard_data_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = dashboard_data_sources.organization_id
    )
  );

CREATE POLICY "Users can create data sources"
  ON dashboard_data_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = dashboard_data_sources.organization_id
    )
  );

CREATE POLICY "Users can update their data sources"
  ON dashboard_data_sources FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their data sources"
  ON dashboard_data_sources FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for user preferences
CREATE POLICY "Users can view own preferences"
  ON user_dashboard_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own preferences"
  ON user_dashboard_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Functions
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dashboard_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_updated_at();

CREATE TRIGGER trigger_widget_types_updated_at
  BEFORE UPDATE ON widget_types
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_updated_at();

CREATE TRIGGER trigger_data_sources_updated_at
  BEFORE UPDATE ON dashboard_data_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_updated_at();

-- Increment template use count when dashboard is created from template
CREATE OR REPLACE FUNCTION increment_template_use_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_template = false AND OLD.is_template = true THEN
    UPDATE dashboard_templates
    SET use_count = use_count + 1
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Insert default widget types
INSERT INTO widget_types (type_key, name, description, category, icon, config_schema, default_width, default_height, min_width, min_height) VALUES
  -- Metric widgets
  ('kpi-card', 'KPI Card', 'Display a single key performance indicator', 'metric', 'activity',
    '{"type": "object", "properties": {"metric": {"type": "string"}, "format": {"type": "string", "enum": ["number", "percentage", "currency"]}, "color": {"type": "string"}}, "required": ["metric"]}'::jsonb,
    3, 2, 2, 2),

  ('metric-trend', 'Metric with Trend', 'Display a metric with trend indicator', 'metric', 'trending-up',
    '{"type": "object", "properties": {"metric": {"type": "string"}, "comparison": {"type": "string", "enum": ["previous-period", "previous-month", "previous-year"]}, "showSparkline": {"type": "boolean"}}, "required": ["metric"]}'::jsonb,
    4, 2, 3, 2),

  ('gauge', 'Gauge Chart', 'Circular gauge for percentage values', 'metric', 'gauge',
    '{"type": "object", "properties": {"metric": {"type": "string"}, "min": {"type": "number"}, "max": {"type": "number"}, "thresholds": {"type": "array"}}, "required": ["metric"]}'::jsonb,
    4, 3, 3, 3),

  -- Chart widgets
  ('line-chart', 'Line Chart', 'Time series line chart', 'chart', 'line-chart',
    '{"type": "object", "properties": {"dataSource": {"type": "string"}, "xAxis": {"type": "string"}, "yAxis": {"type": "array"}, "smooth": {"type": "boolean"}}, "required": ["dataSource"]}'::jsonb,
    6, 4, 4, 3),

  ('bar-chart', 'Bar Chart', 'Vertical or horizontal bar chart', 'chart', 'bar-chart',
    '{"type": "object", "properties": {"dataSource": {"type": "string"}, "orientation": {"type": "string", "enum": ["vertical", "horizontal"]}, "stacked": {"type": "boolean"}}, "required": ["dataSource"]}'::jsonb,
    6, 4, 4, 3),

  ('pie-chart', 'Pie Chart', 'Pie or donut chart', 'chart', 'pie-chart',
    '{"type": "object", "properties": {"dataSource": {"type": "string"}, "variant": {"type": "string", "enum": ["pie", "donut"]}, "showLabels": {"type": "boolean"}}, "required": ["dataSource"]}'::jsonb,
    4, 4, 3, 3),

  ('area-chart', 'Area Chart', 'Stacked area chart', 'chart', 'area-chart',
    '{"type": "object", "properties": {"dataSource": {"type": "string"}, "stacked": {"type": "boolean"}, "fillOpacity": {"type": "number"}}, "required": ["dataSource"]}'::jsonb,
    6, 4, 4, 3),

  -- Data widgets
  ('data-table', 'Data Table', 'Sortable and filterable data table', 'data', 'table',
    '{"type": "object", "properties": {"dataSource": {"type": "string"}, "columns": {"type": "array"}, "pageSize": {"type": "number"}, "sortable": {"type": "boolean"}}, "required": ["dataSource"]}'::jsonb,
    12, 6, 6, 4),

  ('list', 'List View', 'Simple list of items', 'data', 'list',
    '{"type": "object", "properties": {"dataSource": {"type": "string"}, "itemTemplate": {"type": "string"}, "limit": {"type": "number"}}, "required": ["dataSource"]}'::jsonb,
    4, 6, 3, 4),

  -- Audit widgets
  ('timeline', 'Activity Timeline', 'Chronological event timeline', 'audit', 'clock',
    '{"type": "object", "properties": {"eventTypes": {"type": "array"}, "limit": {"type": "number"}, "showFilters": {"type": "boolean"}}, "required": []}'::jsonb,
    6, 8, 4, 6),

  ('activity-feed', 'Activity Feed', 'Recent activity feed', 'audit', 'activity',
    '{"type": "object", "properties": {"limit": {"type": "number"}, "filterByUser": {"type": "boolean"}, "onlySuspicious": {"type": "boolean"}}, "required": []}'::jsonb,
    4, 6, 3, 4),

  -- Custom widgets
  ('text', 'Text Widget', 'Rich text content', 'custom', 'file-text',
    '{"type": "object", "properties": {"content": {"type": "string"}, "alignment": {"type": "string", "enum": ["left", "center", "right"]}, "fontSize": {"type": "string"}}, "required": ["content"]}'::jsonb,
    6, 3, 3, 2),

  ('iframe', 'Embedded Content', 'Embed external content via iframe', 'custom', 'globe',
    '{"type": "object", "properties": {"url": {"type": "string"}, "allowScripts": {"type": "boolean"}}, "required": ["url"]}'::jsonb,
    6, 6, 4, 4);

-- Insert default dashboard templates
INSERT INTO dashboard_templates (name, description, category, layout_config, widgets, is_featured) VALUES
  ('Executive Overview', 'High-level KPIs and trends for executives', 'executive',
    '{"columns": 12, "rowHeight": 80, "gap": 16}'::jsonb,
    '[
      {"id": "w1", "type": "kpi-card", "title": "Total Assessments", "config": {"metric": "total_assessments", "format": "number"}, "layout": {"x": 0, "y": 0, "w": 3, "h": 2}},
      {"id": "w2", "type": "kpi-card", "title": "Compliance Score", "config": {"metric": "avg_compliance_score", "format": "percentage"}, "layout": {"x": 3, "y": 0, "w": 3, "h": 2}},
      {"id": "w3", "type": "kpi-card", "title": "Active Controls", "config": {"metric": "active_controls", "format": "number"}, "layout": {"x": 6, "y": 0, "w": 3, "h": 2}},
      {"id": "w4", "type": "kpi-card", "title": "Open Findings", "config": {"metric": "open_findings", "format": "number"}, "layout": {"x": 9, "y": 0, "w": 3, "h": 2}},
      {"id": "w5", "type": "line-chart", "title": "Compliance Trend", "config": {"dataSource": "compliance_over_time"}, "layout": {"x": 0, "y": 2, "w": 8, "h": 4}},
      {"id": "w6", "type": "pie-chart", "title": "Status Distribution", "config": {"dataSource": "assessment_status", "variant": "donut"}, "layout": {"x": 8, "y": 2, "w": 4, "h": 4}}
    ]'::jsonb,
    true),

  ('Compliance Dashboard', 'Detailed compliance metrics and analysis', 'compliance',
    '{"columns": 12, "rowHeight": 80, "gap": 16}'::jsonb,
    '[
      {"id": "w1", "type": "gauge", "title": "Overall Compliance", "config": {"metric": "compliance_score", "min": 0, "max": 100}, "layout": {"x": 0, "y": 0, "w": 4, "h": 3}},
      {"id": "w2", "type": "bar-chart", "title": "Compliance by Framework", "config": {"dataSource": "framework_compliance", "orientation": "horizontal"}, "layout": {"x": 4, "y": 0, "w": 8, "h": 3}},
      {"id": "w3", "type": "data-table", "title": "Framework Details", "config": {"dataSource": "frameworks", "pageSize": 10, "sortable": true}, "layout": {"x": 0, "y": 3, "w": 12, "h": 6}}
    ]'::jsonb,
    true),

  ('Security Monitoring', 'Security events and audit trail', 'security',
    '{"columns": 12, "rowHeight": 80, "gap": 16}'::jsonb,
    '[
      {"id": "w1", "type": "kpi-card", "title": "Active Sessions", "config": {"metric": "active_sessions", "format": "number"}, "layout": {"x": 0, "y": 0, "w": 3, "h": 2}},
      {"id": "w2", "type": "kpi-card", "title": "Failed Logins", "config": {"metric": "failed_logins_today", "format": "number"}, "layout": {"x": 3, "y": 0, "w": 3, "h": 2}},
      {"id": "w3", "type": "kpi-card", "title": "Suspicious Events", "config": {"metric": "suspicious_events", "format": "number"}, "layout": {"x": 6, "y": 0, "w": 3, "h": 2}},
      {"id": "w4", "type": "kpi-card", "title": "Avg Risk Score", "config": {"metric": "avg_risk_score", "format": "number"}, "layout": {"x": 9, "y": 0, "w": 3, "h": 2}},
      {"id": "w5", "type": "timeline", "title": "Recent Activity", "config": {"limit": 20, "showFilters": true}, "layout": {"x": 0, "y": 2, "w": 8, "h": 8}},
      {"id": "w6", "type": "activity-feed", "title": "Security Alerts", "config": {"limit": 10, "onlySuspicious": true}, "layout": {"x": 8, "y": 2, "w": 4, "h": 8}}
    ]'::jsonb,
    true);

-- Comments for documentation
COMMENT ON TABLE dashboards IS 'User-created custom dashboards with drag-and-drop widgets';
COMMENT ON TABLE widget_types IS 'Available widget types and their configuration schemas';
COMMENT ON TABLE dashboard_templates IS 'Pre-built dashboard templates for quick start';
COMMENT ON TABLE dashboard_data_sources IS 'Data sources for dashboard widgets';
COMMENT ON TABLE user_dashboard_preferences IS 'User preferences for dashboard experience';

COMMENT ON COLUMN dashboards.widgets IS 'Array of widget configurations with layout positions';
COMMENT ON COLUMN dashboards.layout_config IS 'Grid layout configuration (columns, row height, gaps)';
COMMENT ON COLUMN dashboards.visibility IS 'Dashboard visibility: private, shared, organization, or public';
COMMENT ON COLUMN widget_types.config_schema IS 'JSON Schema defining valid configuration for this widget type';

-- Grant permissions
GRANT SELECT ON dashboards TO authenticated;
GRANT INSERT, UPDATE, DELETE ON dashboards TO authenticated;
GRANT SELECT ON widget_types TO authenticated;
GRANT SELECT ON dashboard_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dashboard_data_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_dashboard_preferences TO authenticated;

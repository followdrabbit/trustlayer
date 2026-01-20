-- Advanced Reporting System Migration
-- Creates tables for report templates, schedules, and execution history

-- Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template metadata
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'executive_summary',
    'compliance_status',
    'gap_analysis',
    'trend_analysis',
    'risk_assessment',
    'audit_log',
    'custom'
  )),

  -- Template configuration (JSON)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example config structure:
  -- {
  --   "sections": [...],
  --   "charts": [...],
  --   "filters": {...},
  --   "styling": {...}
  -- }

  -- Permissions
  created_by UUID REFERENCES auth.users(id),
  visibility TEXT NOT NULL CHECK (visibility IN ('private', 'shared', 'global')) DEFAULT 'private',
  allowed_roles TEXT[] DEFAULT ARRAY['admin', 'manager']::TEXT[],

  -- Metadata
  is_system_template BOOLEAN DEFAULT false, -- Built-in templates
  version INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report Schedules
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,

  -- Schedule metadata
  name TEXT NOT NULL,
  description TEXT,

  -- Cron scheduling
  cron_expression TEXT NOT NULL, -- '0 9 * * 1' = Every Monday at 9 AM
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  enabled BOOLEAN NOT NULL DEFAULT true,

  -- Dynamic filters (evaluated at runtime)
  filters JSONB DEFAULT '{}'::jsonb,
  -- Example:
  -- {
  --   "domain_ids": ["ai-governance"],
  --   "framework_ids": ["nist-csf"],
  --   "date_range": "last_30_days"
  -- }

  -- Output configuration
  output_formats TEXT[] NOT NULL DEFAULT ARRAY['pdf']::TEXT[],
  -- Supported: 'pdf', 'excel', 'csv', 'json', 'html'

  -- Email distribution
  recipients TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  cc TEXT[] DEFAULT ARRAY[]::TEXT[],
  bcc TEXT[] DEFAULT ARRAY[]::TEXT[],
  subject_template TEXT,
  body_template TEXT,

  -- Execution tracking
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'running')),
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report Runs (Execution history)
CREATE TABLE IF NOT EXISTS report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,

  -- Execution info
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER, -- Execution duration in milliseconds

  -- Error tracking
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Output files
  output_files JSONB DEFAULT '[]'::jsonb,
  -- Example:
  -- [
  --   {
  --     "format": "pdf",
  --     "url": "https://storage.../report.pdf",
  --     "size_bytes": 1024000,
  --     "checksum": "sha256:..."
  --   }
  -- ]

  -- Execution context
  generated_by UUID REFERENCES auth.users(id), -- User who triggered (null for scheduled)
  filters_used JSONB DEFAULT '{}'::jsonb,
  data_snapshot JSONB, -- Summary of data at time of generation

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report Recipients (Track who received each report)
CREATE TABLE IF NOT EXISTS report_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES report_runs(id) ON DELETE CASCADE,

  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_status TEXT CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'bounced')),
  opened_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_templates_org ON report_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(type);
CREATE INDEX IF NOT EXISTS idx_report_templates_created_by ON report_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_report_schedules_org ON report_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_template ON report_schedules(template_id);

CREATE INDEX IF NOT EXISTS idx_report_runs_org ON report_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_schedule ON report_runs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_template ON report_runs(template_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_status ON report_runs(status);
CREATE INDEX IF NOT EXISTS idx_report_runs_created_at ON report_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_recipients_run ON report_recipients(run_id);
CREATE INDEX IF NOT EXISTS idx_report_recipients_email ON report_recipients(email);

-- Row Level Security (RLS)
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_templates
CREATE POLICY "Users can view templates from their organization"
  ON report_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
    OR visibility = 'global'
  );

CREATE POLICY "Admins and managers can create templates"
  ON report_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = report_templates.organization_id
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Creators can update their own templates"
  ON report_templates FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = report_templates.organization_id
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete templates"
  ON report_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = report_templates.organization_id
      AND role = 'admin'
    )
  );

-- RLS Policies for report_schedules
CREATE POLICY "Users can view schedules from their organization"
  ON report_schedules FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can create schedules"
  ON report_schedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = report_schedules.organization_id
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Creators and admins can update schedules"
  ON report_schedules FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = report_schedules.organization_id
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete schedules"
  ON report_schedules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = report_schedules.organization_id
      AND role = 'admin'
    )
  );

-- RLS Policies for report_runs
CREATE POLICY "Users can view runs from their organization"
  ON report_runs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create report runs"
  ON report_runs FOR INSERT
  WITH CHECK (true); -- Scheduler service role will handle this

-- RLS Policies for report_recipients
CREATE POLICY "Users can view recipients of runs from their organization"
  ON report_recipients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM report_runs
      WHERE report_runs.id = report_recipients.run_id
      AND organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Function to calculate next run time
CREATE OR REPLACE FUNCTION calculate_next_run(
  cron_expr TEXT,
  tz TEXT DEFAULT 'UTC',
  from_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
DECLARE
  next_run TIMESTAMPTZ;
BEGIN
  -- This is a placeholder - in production, use pg_cron or external scheduler
  -- For now, just add 1 day as example
  next_run := from_time + INTERVAL '1 day';
  RETURN next_run;
END;
$$;

-- Trigger to update next_run_at when schedule is created/updated
CREATE OR REPLACE FUNCTION update_schedule_next_run()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (
    NEW.cron_expression IS DISTINCT FROM OLD.cron_expression OR
    NEW.timezone IS DISTINCT FROM OLD.timezone
  )) THEN
    NEW.next_run_at := calculate_next_run(NEW.cron_expression, NEW.timezone);
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_schedule_next_run
  BEFORE INSERT OR UPDATE ON report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_next_run();

-- Insert system templates (built-in)
INSERT INTO report_templates (id, organization_id, name, description, type, config, visibility, is_system_template, allowed_roles)
VALUES
  (
    gen_random_uuid(),
    NULL, -- Global template
    'Executive Summary',
    'High-level overview of governance posture',
    'executive_summary',
    '{
      "sections": [
        {"id": "overview", "title": "Overview", "components": ["kpi-cards", "score-trend"]},
        {"id": "domains", "title": "Domain Breakdown", "components": ["domain-comparison"]},
        {"id": "gaps", "title": "Critical Gaps", "components": ["gap-table"]}
      ]
    }'::jsonb,
    'global',
    true,
    ARRAY['admin', 'manager', 'viewer']::TEXT[]
  ),
  (
    gen_random_uuid(),
    NULL,
    'Compliance Status Report',
    'Detailed compliance status across frameworks',
    'compliance_status',
    '{
      "sections": [
        {"id": "frameworks", "title": "Framework Compliance", "components": ["framework-grid", "control-heatmap"]},
        {"id": "evidence", "title": "Evidence Status", "components": ["evidence-table"]}
      ]
    }'::jsonb,
    'global',
    true,
    ARRAY['admin', 'manager', 'auditor']::TEXT[]
  ),
  (
    gen_random_uuid(),
    NULL,
    'Gap Analysis Report',
    'Comprehensive gap analysis with remediation recommendations',
    'gap_analysis',
    '{
      "sections": [
        {"id": "summary", "title": "Gap Summary", "components": ["gap-severity-chart", "gap-category-breakdown"]},
        {"id": "details", "title": "Gap Details", "components": ["gap-table-detailed"]},
        {"id": "remediation", "title": "Remediation Plan", "components": ["remediation-timeline"]}
      ]
    }'::jsonb,
    'global',
    true,
    ARRAY['admin', 'manager', 'analyst']::TEXT[]
  )
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE report_templates IS 'Report template definitions with reusable configurations';
COMMENT ON TABLE report_schedules IS 'Scheduled report execution configurations';
COMMENT ON TABLE report_runs IS 'Report execution history and output tracking';
COMMENT ON TABLE report_recipients IS 'Email delivery tracking for reports';

COMMENT ON COLUMN report_schedules.cron_expression IS 'Cron expression for scheduling (e.g., ''0 9 * * 1'' for Monday 9 AM)';
COMMENT ON COLUMN report_runs.output_files IS 'JSON array of generated file metadata (URLs, formats, sizes)';
COMMENT ON COLUMN report_runs.data_snapshot IS 'Summary of data state when report was generated (for audit trail)';

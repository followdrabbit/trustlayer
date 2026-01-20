-- Auditor Role & Enhanced Audit Logging Migration
-- Implements comprehensive audit trail with forensic capabilities

-- Add 'auditor' role to existing role check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'manager', 'analyst', 'auditor', 'viewer', 'user'));

-- Enhanced Change Logs Table (extends existing if present, creates if not)
CREATE TABLE IF NOT EXISTS change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Event metadata
  event_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
  resource_type TEXT NOT NULL, -- 'assessment', 'user', 'organization', etc.
  resource_id UUID,

  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,

  -- Session tracking
  session_id UUID,

  -- Network context
  ip_address INET,
  user_agent TEXT,
  geolocation JSONB,
  -- Example geolocation:
  -- {
  --   "city": "São Paulo",
  --   "country": "Brazil",
  --   "lat": -23.5505,
  --   "lon": -46.6333,
  --   "timezone": "America/Sao_Paulo"
  -- }

  -- Device fingerprinting
  device_info JSONB,
  -- Example device_info:
  -- {
  --   "type": "desktop",
  --   "os": "Windows 11",
  --   "browser": "Chrome 120.0",
  --   "screen_resolution": "1920x1080"
  -- }

  -- State tracking (before/after)
  before_state JSONB,
  after_state JSONB,
  changed_fields TEXT[],

  -- Additional context
  metadata JSONB,
  description TEXT,

  -- Correlation
  correlation_id UUID, -- Groups related events
  parent_event_id UUID REFERENCES change_logs(id),

  -- Risk indicators
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  is_suspicious BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Session lifecycle
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Session context
  ip_address INET,
  user_agent TEXT,
  geolocation JSONB,
  device_info JSONB,

  -- Authentication
  auth_method TEXT CHECK (auth_method IN ('password', 'sso', 'saml', 'oauth')),
  mfa_verified BOOLEAN DEFAULT false,
  mfa_method TEXT, -- 'totp', 'webauthn', etc.

  -- Activity tracking
  page_views INTEGER DEFAULT 0,
  actions_count INTEGER DEFAULT 0,
  last_page_url TEXT,

  -- Security flags
  is_active BOOLEAN DEFAULT true,
  terminated_by TEXT, -- 'user', 'admin', 'timeout', 'system'
  termination_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Login History Table (separate from sessions for audit trail)
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Login attempt info
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,

  -- Context
  ip_address INET,
  user_agent TEXT,
  geolocation JSONB,

  -- Security
  mfa_required BOOLEAN DEFAULT false,
  mfa_success BOOLEAN,
  is_suspicious BOOLEAN DEFAULT false,
  risk_score INTEGER,

  -- Session created (if successful)
  session_id UUID REFERENCES user_sessions(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Trail Views (for auditor convenience)
CREATE OR REPLACE VIEW audit_trail_summary AS
SELECT
  DATE(created_at) as date,
  event_type,
  resource_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT organization_id) as unique_orgs,
  SUM(CASE WHEN is_suspicious THEN 1 ELSE 0 END) as suspicious_count
FROM change_logs
GROUP BY DATE(created_at), event_type, resource_type
ORDER BY date DESC, event_count DESC;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_change_logs_org ON change_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_user ON change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_session ON change_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_event_type ON change_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_change_logs_resource ON change_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_created_at ON change_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_logs_suspicious ON change_logs(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_change_logs_correlation ON change_logs(correlation_id) WHERE correlation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_org ON user_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_email ON login_history(email);
CREATE INDEX IF NOT EXISTS idx_login_history_success ON login_history(success);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_suspicious ON login_history(is_suspicious) WHERE is_suspicious = true;

-- Geolocation index for spatial queries
CREATE INDEX IF NOT EXISTS idx_change_logs_geo ON change_logs USING GIN (geolocation);
CREATE INDEX IF NOT EXISTS idx_login_history_geo ON login_history USING GIN (geolocation);

-- Row Level Security
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for change_logs
-- Auditors can read all logs from their organization
CREATE POLICY "Auditors can view all change logs"
  ON change_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = change_logs.organization_id
      AND role IN ('admin', 'auditor')
    )
  );

-- System can insert logs
CREATE POLICY "System can insert change logs"
  ON change_logs FOR INSERT
  WITH CHECK (true);

-- No one can update or delete logs (immutable audit trail)
CREATE POLICY "Logs are immutable"
  ON change_logs FOR UPDATE
  USING (false);

CREATE POLICY "Logs cannot be deleted"
  ON change_logs FOR DELETE
  USING (false);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = user_sessions.organization_id
      AND role IN ('admin', 'auditor')
    )
  );

CREATE POLICY "System can manage sessions"
  ON user_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for login_history
CREATE POLICY "Auditors can view login history"
  ON login_history FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND organization_id = login_history.organization_id
      AND role IN ('admin', 'auditor')
    )
  );

CREATE POLICY "System can insert login history"
  ON login_history FOR INSERT
  WITH CHECK (true);

-- Functions for audit logging
CREATE OR REPLACE FUNCTION log_change_event(
  p_event_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_before_state JSONB DEFAULT NULL,
  p_after_state JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_user_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_org_id UUID;
  v_session_id UUID;
  v_changed_fields TEXT[];
BEGIN
  -- Get current user context
  v_user_id := auth.uid();

  SELECT email, role, organization_id INTO v_user_email, v_user_role, v_org_id
  FROM profiles
  WHERE user_id = v_user_id;

  -- Get current session (from request header or create one)
  v_session_id := current_setting('request.headers', true)::json->>'x-session-id';

  -- Calculate changed fields
  IF p_before_state IS NOT NULL AND p_after_state IS NOT NULL THEN
    SELECT ARRAY_AGG(key)
    INTO v_changed_fields
    FROM jsonb_each(p_after_state) a
    WHERE NOT EXISTS (
      SELECT 1 FROM jsonb_each(p_before_state) b
      WHERE a.key = b.key AND a.value = b.value
    );
  END IF;

  -- Insert change log
  INSERT INTO change_logs (
    organization_id,
    event_type,
    resource_type,
    resource_id,
    user_id,
    user_email,
    user_role,
    session_id,
    before_state,
    after_state,
    changed_fields,
    description,
    metadata
  ) VALUES (
    v_org_id,
    p_event_type,
    p_resource_type,
    p_resource_id,
    v_user_id,
    v_user_email,
    v_user_role,
    v_session_id,
    p_before_state,
    p_after_state,
    v_changed_fields,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Function to calculate session duration on end
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at));
  END IF;

  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_session_duration
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_duration();

-- Trigger to automatically update last_activity_at
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update session activity when a change_log is created
  IF NEW.session_id IS NOT NULL THEN
    UPDATE user_sessions
    SET
      last_activity_at = NOW(),
      actions_count = actions_count + 1,
      updated_at = NOW()
    WHERE id = NEW.session_id
    AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_session_activity
  AFTER INSERT ON change_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- Function to detect suspicious activity (basic example)
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_recent_failures INTEGER;
  v_ip_changes INTEGER;
  v_unusual_hours BOOLEAN;
BEGIN
  -- Check for multiple failed logins
  IF NEW.event_type = 'auth.login_failed' THEN
    SELECT COUNT(*) INTO v_recent_failures
    FROM change_logs
    WHERE user_id = NEW.user_id
    AND event_type = 'auth.login_failed'
    AND created_at > NOW() - INTERVAL '15 minutes';

    IF v_recent_failures >= 3 THEN
      NEW.is_suspicious := true;
      NEW.risk_score := GREATEST(NEW.risk_score, 70);
    END IF;
  END IF;

  -- Check for unusual hours (0-6 AM)
  v_unusual_hours := EXTRACT(HOUR FROM NEW.created_at) BETWEEN 0 AND 6;
  IF v_unusual_hours THEN
    NEW.risk_score := COALESCE(NEW.risk_score, 0) + 20;
  END IF;

  -- Check for IP address changes
  SELECT COUNT(DISTINCT ip_address) INTO v_ip_changes
  FROM change_logs
  WHERE user_id = NEW.user_id
  AND created_at > NOW() - INTERVAL '1 hour';

  IF v_ip_changes > 3 THEN
    NEW.is_suspicious := true;
    NEW.risk_score := GREATEST(NEW.risk_score, 60);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_detect_suspicious_activity
  BEFORE INSERT ON change_logs
  FOR EACH ROW
  EXECUTE FUNCTION detect_suspicious_activity();

-- Comments for documentation
COMMENT ON TABLE change_logs IS 'Comprehensive audit trail with before/after states and forensic metadata';
COMMENT ON TABLE user_sessions IS 'User session tracking with device fingerprinting and activity metrics';
COMMENT ON TABLE login_history IS 'Login attempt history for security monitoring';

COMMENT ON COLUMN change_logs.geolocation IS 'GeoIP-derived location: {city, country, lat, lon, timezone}';
COMMENT ON COLUMN change_logs.device_info IS 'Device fingerprint: {type, os, browser, screen_resolution}';
COMMENT ON COLUMN change_logs.before_state IS 'Full state before change (for rollback and forensics)';
COMMENT ON COLUMN change_logs.after_state IS 'Full state after change';
COMMENT ON COLUMN change_logs.correlation_id IS 'Groups related events (e.g., bulk operations)';
COMMENT ON COLUMN change_logs.risk_score IS 'Automated risk assessment (0-100)';

-- Grant permissions
GRANT SELECT ON change_logs TO authenticated;
GRANT SELECT ON user_sessions TO authenticated;
GRANT SELECT ON login_history TO authenticated;
GRANT SELECT ON audit_trail_summary TO authenticated;

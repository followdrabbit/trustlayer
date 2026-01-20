-- Multi-Factor Authentication Support
-- Supports TOTP (Google Authenticator) and WebAuthn (FIDO2 keys)

-- MFA Factors table
CREATE TABLE IF NOT EXISTS mfa_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  factor_type TEXT NOT NULL CHECK (factor_type IN ('totp', 'webauthn')),

  -- TOTP fields
  secret TEXT,  -- Base32-encoded TOTP secret (encrypted in production)
  backup_codes TEXT[],  -- Hashed backup codes

  -- WebAuthn fields
  credential_id TEXT,  -- Base64-encoded credential ID
  credential_public_key TEXT,  -- Base64-encoded public key
  credential_transports TEXT[],  -- ['usb', 'nfc', 'ble', 'internal']
  counter BIGINT DEFAULT 0,  -- Signature counter for replay protection
  aaguid UUID,  -- Authenticator Attestation GUID

  -- Common fields
  friendly_name TEXT,  -- User-provided name (e.g., "YubiKey 5", "Phone Authenticator")
  status TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified', 'verified', 'disabled')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE (user_id, credential_id),
  CHECK (
    (factor_type = 'totp' AND secret IS NOT NULL) OR
    (factor_type = 'webauthn' AND credential_id IS NOT NULL AND credential_public_key IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_mfa_factors_user_id ON mfa_factors(user_id);
CREATE INDEX idx_mfa_factors_credential_id ON mfa_factors(credential_id) WHERE credential_id IS NOT NULL;
CREATE INDEX idx_mfa_factors_status ON mfa_factors(status);

-- RLS Policies
ALTER TABLE mfa_factors ENABLE ROW LEVEL SECURITY;

-- Users can view their own MFA factors
CREATE POLICY "Users can view own MFA factors"
  ON mfa_factors
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update/delete MFA factors
-- (MFA operations must go through Edge Functions for security)
CREATE POLICY "Service role only for MFA modifications"
  ON mfa_factors
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Add MFA requirement tracking to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS mfa_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_enabled_at TIMESTAMPTZ;

-- Create index for MFA-required users
CREATE INDEX idx_profiles_mfa_required ON profiles(mfa_required) WHERE mfa_required = TRUE;

-- MFA challenges table (for pending verifications)
CREATE TABLE IF NOT EXISTS mfa_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,  -- Base64-encoded challenge
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (expires_at > created_at)
);

CREATE INDEX idx_mfa_challenges_user_id ON mfa_challenges(user_id);
CREATE INDEX idx_mfa_challenges_expires_at ON mfa_challenges(expires_at);

-- RLS for MFA challenges
ALTER TABLE mfa_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for MFA challenges"
  ON mfa_challenges
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to clean up expired challenges
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_challenges()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM mfa_challenges
  WHERE expires_at < NOW();
END;
$$;

-- Audit log for MFA events
CREATE OR REPLACE FUNCTION log_mfa_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO change_logs (
      user_id,
      entity_type,
      entity_id,
      action,
      changes
    ) VALUES (
      NEW.user_id,
      'mfa_factor',
      NEW.id::TEXT,
      'mfa_factor_created',
      jsonb_build_object(
        'factor_type', NEW.factor_type,
        'friendly_name', NEW.friendly_name
      )
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status != NEW.status) THEN
      INSERT INTO change_logs (
        user_id,
        entity_type,
        entity_id,
        action,
        changes
      ) VALUES (
        NEW.user_id,
        'mfa_factor',
        NEW.id::TEXT,
        CASE NEW.status
          WHEN 'verified' THEN 'mfa_factor_verified'
          WHEN 'disabled' THEN 'mfa_factor_disabled'
          ELSE 'mfa_factor_updated'
        END,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO change_logs (
      user_id,
      entity_type,
      entity_id,
      action,
      changes
    ) VALUES (
      OLD.user_id,
      'mfa_factor',
      OLD.id::TEXT,
      'mfa_factor_deleted',
      jsonb_build_object(
        'factor_type', OLD.factor_type,
        'friendly_name', OLD.friendly_name
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for MFA audit logging
CREATE TRIGGER trigger_log_mfa_event
  AFTER INSERT OR UPDATE OR DELETE ON mfa_factors
  FOR EACH ROW
  EXECUTE FUNCTION log_mfa_event();

-- Comments
COMMENT ON TABLE mfa_factors IS 'Multi-factor authentication factors (TOTP, WebAuthn)';
COMMENT ON TABLE mfa_challenges IS 'Temporary MFA challenges for WebAuthn registration/authentication';
COMMENT ON COLUMN mfa_factors.secret IS 'TOTP secret (should be encrypted at rest in production)';
COMMENT ON COLUMN mfa_factors.backup_codes IS 'SHA-256 hashed backup codes (one-time use)';
COMMENT ON COLUMN mfa_factors.counter IS 'WebAuthn signature counter for replay attack prevention';
COMMENT ON COLUMN profiles.mfa_required IS 'Whether MFA is mandatory for this user (admin-enforced)';

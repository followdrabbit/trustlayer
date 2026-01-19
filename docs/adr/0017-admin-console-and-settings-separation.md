# ADR 0017: Admin Console and Settings Separation

- Status: Proposed
- Date: 2026-01-17

## Context
Enterprise deployments require clear separation between global configuration
and user preferences. Global settings (catalog management, SIEM, AI providers,
audit logs) must be restricted to administrators and not exposed in user
settings.

## Decision
Introduce an admin-only console at `/admin` and restrict it via role checks.
Limit the user settings page to personal preferences (language, theme, voice,
notifications, and STT options). The admin console is not listed in the sidebar.

## Consequences
- Admins manage global configuration in a dedicated panel.
- Users see only personal preferences in Settings.
- Requires role-aware navigation for admin access.

## Alternatives Considered
- Keep a single Settings page with conditional admin sections (risk of
  accidental exposure and mixed responsibilities).

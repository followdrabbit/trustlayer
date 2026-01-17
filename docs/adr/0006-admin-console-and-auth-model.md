# ADR 0006: Admin Console and Authentication Model

- Status: Proposed
- Date: 2026-01-17

## Context
Enterprise deployments require centralized control of global settings, restricted
access to administrative functions, and controlled user provisioning. The
current settings page mixes user preferences with system-wide configuration,
and self-signup is not desired.

## Decision
- Create a restricted Admin Console for global settings (SIEM, AI, TTS, logs,
  health, and other tenant-wide configuration).
- Restrict the user settings page to profile-specific preferences (voice, TTS
  speed, language, theme, etc.).
- Disable self-signup. On deployment, an admin user/password is provisioned.
- Admins can create local users and/or configure LDAP or EntraID integration.
- The Admin Console is not listed in the sidebar navigation.
- Remove demo users and demo data flows from enterprise builds.

## Consequences
- Requires clear role/permission boundaries and dedicated admin routes.
- Requires secure provisioning flow and secret storage for the initial admin.
- Requires documentation for admins and operators.

## Alternatives Considered
- Keep settings mixed in one page (confusing, increases risk of misconfig).
- Allow self-signup (not aligned with enterprise controls).

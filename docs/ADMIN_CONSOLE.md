# Admin Console

The Admin Console is the restricted area for global configuration. It is
accessible at `/admin` and is not listed in the sidebar.

## Scope

Admins can manage:
- Domains, frameworks, and questions (catalog management)
- Dashboard layouts and widget catalog (ordering, visibility, composition)
- Framework enablement for assessments
- SIEM integrations and health
- AI provider configurations
- Audit logs
- Export and reset actions

## Catalog Import

- Domain catalog imports accept `.xlsx` (recommended) or legacy `.json`.
- Download the XLSX template from the Domains screen before preparing imports.
- The import dialog includes a preview/dry-run with sample records and integrity checks.
- XLSX templates include a `templateVersion` metadata field for compatibility.
- Imports enforce file size limits, row limits, and formula/macro blocking.
- Imports apply a basic client-side rate limit to prevent accidental repeats.
- Optional antivirus scanning can be enforced via `VITE_IMPORT_MALWARE_SCAN_URL`.

User-only preferences (language, theme, voice, notifications, STT) remain in
`/settings`.

## Secret References

AI provider keys and SIEM auth values can use secret references instead of raw
values. Supported reference formats:
- `env:SECRET_NAME` (environment variable)
- `file:/path/to/secret` (mounted secret file)
- `secret:reference` (external resolver via `SECRET_PROVIDER_URL`)

This enables integration with Vault, AWS Secrets Manager, Azure Key Vault, or
other secret managers that inject secrets into the runtime.
Inline secrets can be enabled only for trusted environments with
`VITE_ALLOW_INLINE_SECRETS=true`.

Local/private endpoints are blocked by default. To allow local or private
endpoints (for example, Ollama or on-prem SIEM), set
`VITE_ALLOW_LOCAL_ENDPOINTS=true` (frontend) and `ALLOW_LOCAL_ENDPOINTS=true`
for Edge Functions.

## Access Control

Access is restricted to users with `role = 'admin'` in the `profiles` table.
Use the provisioning scripts in `docs/SETUP.md` to bootstrap admin accounts.
RLS policies enforce admin-only writes for catalog data, AI providers, and SIEM integrations.

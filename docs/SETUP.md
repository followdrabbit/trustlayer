# Setup and Bootstrap (Enterprise)

This guide covers initial setup tasks that must be completed by an administrator
after installation.

## 0) Environment File

Copy `.env.example` to `.env` and fill in the required values.

## 1) Admin Account Bootstrap

Create an initial admin user that will access the Admin Console and configure
the platform.

### Supabase (local or self-hosted)
- Provision the admin user with the CLI helper (recommended).
- This uses the Supabase service role key and never runs in the browser.

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
ADMIN_EMAIL=admin@company.com \
ADMIN_PASSWORD=change-me-now \
ADMIN_DISPLAY_NAME="Admin" \
npm run provision:admin
```

Optional flags:
- `ADMIN_FORCE_RESET=1` to reset the password if the user already exists.

Manual fallback:
- Use Supabase Studio to create a user under Auth.
- Mark the user as confirmed.
- Update the `profiles` row to set `role = 'admin'`.

Admin Console:
- Access the admin panel at `/admin`.
- The admin panel is not listed in the sidebar.

### External Auth (LDAP/EntraID)
- Configure the IdP integration first.
- Assign the admin role to at least one IdP user/group.

## 2) Local User Provisioning (Optional)

Use the CLI helper to create local users after the admin is ready.

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
USER_EMAIL=user@company.com \
USER_PASSWORD=change-me-now \
USER_DISPLAY_NAME="User" \
USER_ROLE=user \
npm run provision:user
```

Optional flags:
- `USER_FORCE_RESET=1` to reset the password if the user already exists.
- `USER_ROLE=admin|manager|analyst|viewer|user` to set the user role (`user` is legacy).

## 3) Initial Catalog Import (Domains, Frameworks, Questions)

The initial catalog must be imported by the admin after install.

- Use the Admin Console import flow (recommended).
- The system will validate and load the catalog into the database.
- Review the preview/dry-run before confirming the import.
- This applies to Supabase, RDS, on-prem BDS, or other supported backends.
- Prefer the XLSX template export from the Admin Console for standardized imports.

Catalog files are provided in the distribution package. See:
- `docs/catalog/README.md`

## 4) Verify Catalog Load

- Open the Assessment page and confirm questions load.
- Open Settings and confirm frameworks and domains are visible.

## 5) Data Retention (Optional)

Schedule retention cleanup using the CLI helper:

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
RETENTION_CHANGE_LOGS_DAYS=365 \
RETENTION_SNAPSHOTS_DAYS=730 \
RETENTION_SIEM_METRICS_DAYS=90 \
RETENTION_APPLY=true \
npm run retention:cleanup
```

See `docs/DATA_RETENTION.md` for policy guidance.

## Optional Environment Flags

- `VITE_ALLOW_LOCAL_ENDPOINTS=true` (frontend) and `ALLOW_LOCAL_ENDPOINTS=true`
  (Edge Functions) to permit localhost/private endpoints for admin-configured
  integrations (use only in trusted networks).
- `VITE_IMPORT_MAX_FILE_BYTES=5242880` to cap XLSX/JSON import file size.
- `VITE_IMPORT_MAX_CELL_CHARS=2000` to cap cell length in XLSX imports.
- `VITE_IMPORT_MAX_ROWS=5000` to cap XLSX import row count.
- `VITE_IMPORT_MALWARE_SCAN_URL=https://scanner.local/scan` to enable optional XLSX antivirus scanning (expects multipart file upload and JSON response).
- `VITE_IMPORT_MALWARE_SCAN_REQUIRED=true` to block imports when the scanner is unavailable or not configured.
- `VITE_ALLOW_INLINE_SECRETS=true` to allow storing raw secrets in the database (not recommended; required for API-key STT providers).
- `SECRET_PROVIDER_URL=https://secrets.local/resolve` to enable external secret resolver for `secret:` references (Edge Functions).
- `SECRET_PROVIDER_TOKEN=env:SECRET_PROVIDER_TOKEN` optional auth token for the external secret resolver (supports `env:` or `file:`).
- `SECRET_PROVIDER_TIMEOUT_MS=10000` to set the external secret resolver timeout (ms).
- `VITE_ANALYTICS_EXPORT_ENABLED=true` to enable analytics export hooks from the frontend.
- `ANALYTICS_EXPORT_URL=https://analytics.local/ingest` to enable the analytics export Edge Function.
- `ANALYTICS_EXPORT_TOKEN=env:ANALYTICS_EXPORT_TOKEN` optional auth token for analytics export (supports `env:` or `file:`).
- `ANALYTICS_EXPORT_TIMEOUT_MS=10000` to set the analytics export timeout (ms).
- `ANALYTICS_EXPORT_INCLUDE_USER_ID=false` to control whether user IDs are included in analytics payloads.
- See `docs/ANALYTICS_EXPORT.md` for the export contract and demo receiver.
- `VITE_IDLE_TIMEOUT_MINUTES=0` to disable/enable idle logout (minutes > 0).
- `VITE_SESSION_MAX_MINUTES=0` to disable/enable absolute session timeout (minutes > 0).
- `ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com` to
  restrict Edge Function CORS origins (comma-separated list).
- `MAX_REQUEST_BODY_BYTES=1048576` to cap Edge Function payload size.
- `AUDIT_GEO_LOOKUP_ENABLED=true` to enable external geo lookups (disabled by default).
- `MAX_AI_MESSAGES=50` to cap the number of chat messages sent to the AI proxy.
- `MAX_AI_MESSAGE_CHARS=4000` to cap characters per AI message.
- `MAX_AI_TOTAL_CHARS=20000` to cap total characters across AI messages.
- `RATE_LIMIT_WINDOW_SECONDS=60` to define the Edge Function rate limit window.
- `AI_ASSISTANT_RATE_LIMIT_MAX=60` to cap AI assistant requests per window.
- `AUDIT_LOG_RATE_LIMIT_MAX=120` to cap audit log requests per window.
- `SIEM_FORWARD_RATE_LIMIT_MAX=60` to cap SIEM forward requests per window.
- `ANALYTICS_EXPORT_RATE_LIMIT_MAX=60` to cap analytics export requests per window.
- `HTTP_PROXY=http://proxy.local:8080` to proxy outbound Edge Function traffic.
- `HTTPS_PROXY=http://proxy.local:8443` to proxy outbound HTTPS traffic.
- `NO_PROXY=localhost,127.0.0.1,::1,.internal` to bypass the proxy for specific hosts.
- `CUSTOM_CA_CERT=...` to trust a custom CA bundle (PEM) for TLS inspection.
- `CUSTOM_CA_CERT_BASE64=...` to trust a custom CA bundle (base64) for TLS inspection.

## Secret References (KMS/Vault/Secrets Manager)

To avoid storing raw secrets in the database, integrations accept secret references:
- `env:SECRET_NAME` reads from environment variables.
- `file:/path/to/secret` reads from a mounted secret file.
- `secret:reference` resolves via `SECRET_PROVIDER_URL` when configured.
  Local/private URLs require `ALLOW_LOCAL_ENDPOINTS=true`.
  See `docs/SECRET_PROVIDER.md` for the resolver contract and demo server.

Use your secret manager (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
to inject secrets as env vars or mounted files, then reference them in the UI.
Edge Functions also accept secret references for `SUPABASE_SERVICE_ROLE_KEY` and
`LOVABLE_API_KEY` via `env:` or `file:` indirection.

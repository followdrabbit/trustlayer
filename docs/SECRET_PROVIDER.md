# External Secret Resolver

This document defines the contract for resolving `secret:` references via an
external provider using `SECRET_PROVIDER_URL`.

## Overview

Edge Functions can resolve secrets using a remote service so credentials do not
need to be stored in the database. The resolver is invoked whenever a `secret:`
reference is used in the Admin Console.

## Request

`POST ${SECRET_PROVIDER_URL}`

Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (optional, when `SECRET_PROVIDER_TOKEN` is set)

Body:
```json
{
  "reference": "path/or/key"
}
```

## Response

Return one of the following on `200 OK`:
- JSON `{ "value": "secret" }`
- JSON `{ "secret": "secret" }`
- JSON `{ "data": "secret" }`
- Plain text body with the secret value

Non-2xx responses are treated as failures.

## Security and Networking

- Only `http` and `https` URLs are allowed.
- Credentials in the URL are rejected.
- Local/private addresses are blocked unless `ALLOW_LOCAL_ENDPOINTS=true`.
- Proxy settings are honored via `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY`.
- Custom CA bundles are supported via `CUSTOM_CA_CERT` or `CUSTOM_CA_CERT_BASE64`.
- Default timeout is 10s (configurable via `SECRET_PROVIDER_TIMEOUT_MS`).

## Example: Local Demo Provider

Use the demo resolver for local testing:

```bash
node scripts/secret-provider-demo.mjs
```

Then configure:
```bash
SECRET_PROVIDER_URL=http://127.0.0.1:8787/resolve
SECRET_PROVIDER_TOKEN=env:SECRET_PROVIDER_TOKEN
```

The demo server accepts `SECRET_PROVIDER_DATA` (JSON map) to predefine values:
```bash
SECRET_PROVIDER_DATA='{"demo/api-key":"demo-secret"}'
```

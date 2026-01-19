# ADR 0021: SSO Provider Strategy

- Status: Proposed
- Date: 2026-01-18

## Context
Enterprise deployments require centralized authentication and lifecycle
management via SSO (OIDC/SAML), with optional SCIM provisioning. The platform
must support common enterprise IdPs while keeping local provisioning as a
fallback for air-gapped or on-prem environments.

## Decision
Adopt OIDC as the primary SSO integration path and support SAML via IdP
bridging where required. Initial provider targets:
- Azure Entra ID (OIDC/SAML)
- Okta (OIDC/SAML)
- Auth0 (OIDC)

SCIM remains optional and is supported when the IdP provides it. Local users
and admin bootstrap remain available for offline environments.

## Consequences
- Requires admin-only IdP configuration and role mapping.
- User provisioning must reconcile IdP identities with local profiles.
- SAML support may require an external IdP bridge when not natively supported.

## Alternatives Considered
- SAML-only strategy (slower rollout and higher complexity).
- Custom auth service replacing Supabase Auth (higher maintenance cost).

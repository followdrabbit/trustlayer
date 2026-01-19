# ADR 0022: RBAC Model and Role Mapping

- Status: Proposed
- Date: 2026-01-18

## Context
Enterprise customers need clear separation of duties across administration,
governance, and assessment workflows. The current model distinguishes admin
and non-admin users but needs a formal RBAC mapping to scale.

## Decision
Adopt a role-based access control model with explicit scopes for:
- Global configuration (admin console, integrations, catalog import)
- Assessment operations (answering, evidence, exports)
- Reporting and dashboards (read-only vs. manage layouts)

Baseline roles (subject to refinement):
- `admin`: full access to global settings and catalog.
- `manager`: manage assessments and dashboard layouts.
- `analyst`: answer assessments and view dashboards.
- `viewer`: read-only access to dashboards and exports.

## Consequences
- Requires role mapping for IdP groups and local users.
- Requires policy checks in UI and RLS enforcement in the database.
- Existing users must be migrated to default roles.

## Alternatives Considered
- Attribute-based access control only (higher complexity to implement).
- Admin/user only (insufficient separation for enterprise audits).

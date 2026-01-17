# ADR 0007: Modular Dashboards and Widget Catalog

- Status: Proposed
- Date: 2026-01-17

## Context
Enterprise users need dashboards tailored to different roles and objectives.
The current fixed dashboards should remain the default, but admins need the
ability to assemble custom dashboards, reorder sections, and add/remove items.

## Decision
Provide a widget catalog and admin-managed layouts for dashboards. The system
ships with the current default dashboards, and administrators can create new
dashboards or customize existing ones (order, visibility, and composition).

## Consequences
- Requires a catalog of widgets with metadata (inputs, permissions, data source).
- Requires layout persistence and versioning per tenant/role.
- Enables custom dashboards such as OKR tracking or benchmark comparisons.

## Alternatives Considered
- Keep fixed dashboards only (insufficient flexibility for enterprise use).


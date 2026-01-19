# ADR 0005: Framework Catalog Defaults and XLSX Import

- Status: Accepted
- Date: 2026-01-17

## Context
Enterprises need to customize domains, frameworks, and questions. The system
must ship with a robust default catalog and allow standardized import to
accelerate onboarding and ensure consistency.

## Decision
Provide a default framework catalog out-of-the-box and support standardized
XLSX import for creating domains, frameworks, and questions. All domains,
frameworks, and questions must be loaded from the database (no static JSON).
Administrators can enable/disable frameworks per persona and modify the catalog
as required.
Initial catalog load is performed by the admin after installation using the
provided import files.

## Consequences
- Reduces onboarding time for enterprise customers.
- Requires a strict XLSX template, validation rules, and import audit logs.
- Requires migration/versioning strategy for catalog updates.
- Requires migrating existing static data to the database.
- Requires secure XLSX processing (size limits, schema validation, antivirus
  scan, macro blocking, rate limiting, and least-privilege import roles).

## Alternatives Considered
- Manual UI-only creation (too slow for large catalogs).
- JSON-only imports (less friendly for business users).

# Changelog

All notable changes to TrustLayer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Phase 2: Enhanced Enterprise Features

### Planned Features (Q1-Q3 2026)

#### Documentation System
- Multi-profile documentation (Admin, Developer, QA, User, Auditor)
- Support for 3 languages (PT-BR, EN-US, ES-ES)
- Documentation portal with search and PDF export
- Profile-specific content and navigation

#### Architecture & Infrastructure
- Modular architecture with module loader system
- Event bus for inter-module communication
- Service registry for module integration
- On-premises deployment support
- Separate FE/BE Dockerfiles
- Docker Compose all-in-one deployment

#### UX/UI Enhancements
- Theme system with 5+ built-in themes
- Custom font and color customization
- Organization-specific branding (logos, colors)
- Page transitions and animations (Framer Motion)
- Draggable AI assistant with position persistence
- User avatar upload and display
- Custom dashboard builder with drag-and-drop

#### Advanced Reporting System
- Dedicated Reports page
- Scheduled reports with cron expressions
- Custom report templates
- Multiple export formats (PDF, Excel, CSV, JSON)
- Email distribution for scheduled reports
- Report history and versioning
- Template library

#### Auditor Role & Forensics
- New "Auditor" role with read-only access to logs
- Enhanced audit logging with before/after states
- IP address and geolocation tracking
- Device fingerprinting
- Timeline view for event analysis
- User activity dashboard with heatmap
- Session tracking and management
- Forensic investigation tools
- Relationship graphs for correlation analysis

#### Observability Integrations
- Grafana dashboard templates
- ELK Stack integration
- Custom metric exporters
- Comprehensive logging strategy

#### CI/CD Enhancements
- Danger.js for automated PR validation
- Dependabot for dependency management
- ESLint strict configuration
- Prettier code formatting
- Automated type checking

### Architecture Decision Records (ADRs)

- [ADR-0024](./docs/adr/0024-modular-architecture.md): Modular Architecture
- [ADR-0025](./docs/adr/0025-multi-profile-documentation.md): Multi-Profile Documentation Strategy
- [ADR-0026](./docs/adr/0026-reporting-system.md): Advanced Reporting System
- [ADR-0027](./docs/adr/0027-ux-enhancements.md): UX/UI Enhancements
- [ADR-0028](./docs/adr/0028-auditor-role.md): Auditor Role and Forensics

---

## [1.0.0] - 2026-01-15 - Phase 1: 90% Enterprise Ready

### Added

#### Authentication & Security
- Email/password authentication
- SSO/SAML 2.0 integration
- Multi-Factor Authentication (MFA):
  - TOTP (Time-based One-Time Password)
  - WebAuthn (Security Keys/Biometrics)
- Session management with automatic expiration
- Password reset flow
- Role-Based Access Control (RBAC) with 5 roles:
  - Admin
  - Manager
  - Analyst
  - Viewer
  - User

#### Core Features - Assessments
- Create security assessments based on frameworks
- Multi-domain support (AI Governance, Cloud Security, DevSecOps, etc.)
- Framework support:
  - NIST Cybersecurity Framework (CSF)
  - ISO 27001
  - SOC 2
  - CIS Controls
  - OWASP Top 10
  - PCI-DSS
- Question answering with evidence upload
- Auto-save functionality
- Progress tracking
- Assessment submission and locking
- Gap analysis with severity levels
- Score calculation engine

#### Dashboards
- Executive Dashboard with overall metrics
- GRC Dashboard with framework coverage
- Specialist Dashboard with domain-specific insights
- Interactive charts and visualizations (Recharts)
- Score trends over time
- Domain comparison charts
- Critical gaps table
- Filters by organization, domain, framework, date range

#### Reports & Export
- HTML export
- Excel export (.xlsx)
- Email report functionality
- Executive summary generation
- Gap analysis reports

#### Admin Panel
- User management (create, edit, delete, deactivate)
- Organization management
- Role assignment
- System settings
- Email configuration

#### Technical Infrastructure
- React 18.3 with TypeScript 5
- Vite 6 build system
- Supabase backend (PostgreSQL + Auth + Storage)
- Tailwind CSS 4 for styling
- Radix UI components
- Zustand for state management
- React Query for server state
- React Router 7 for navigation

#### Database
- PostgreSQL 15 with Row Level Security (RLS)
- Multi-tenancy support
- Optimized indexes
- Database migrations
- Comprehensive schema for:
  - Organizations
  - Users and profiles
  - Assessments and answers
  - Frameworks and questions
  - Audit logs

#### Deployment
- Kubernetes deployment support
- Helm charts
- OpenTelemetry integration
- WAF (Web Application Firewall) configuration
- Health checks and monitoring

#### Documentation
- Architecture documentation
- API documentation
- Deployment guides (K8s, On-prem)
- SSO integration guide
- WAF configuration guide
- OpenTelemetry setup guide

### Architecture Decision Records (Phase 1)

- [ADR-0001](./docs/adr/0001-react-typescript.md): React + TypeScript Stack
- [ADR-0002](./docs/adr/0002-tailwind-radix.md): Tailwind CSS + Radix UI
- [ADR-0003](./docs/adr/0003-state-management.md): Zustand + React Query
- [ADR-0004](./docs/adr/0004-supabase-backend.md): Supabase Backend
- [ADR-0015](./docs/adr/0015-opentelemetry.md): OpenTelemetry Integration
- [ADR-0021](./docs/adr/0021-sso-strategy.md): SSO/SAML Strategy
- [ADR-0022](./docs/adr/0022-rbac-model.md): RBAC Model
- [ADR-0023](./docs/adr/0023-waf-integration.md): WAF Integration

### Security
- Input sanitization (XSS prevention)
- SQL injection prevention (prepared statements)
- CSRF protection
- Rate limiting (100 requests per 15 minutes)
- Content Security Policy (CSP)
- Secure session handling
- Password complexity requirements
- MFA enforcement options
- Audit logging for security events

### Performance
- Code splitting by route
- Lazy loading of components
- Image optimization
- Database query optimization
- Caching strategy (React Query)
- Paginated data fetching

### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- ARIA labels
- Focus management
- Color contrast requirements

---

## [0.1.0] - 2025-12-01 - MVP Release

### Added
- Basic assessment creation
- Simple scoring calculation
- User authentication
- Basic dashboard
- Initial database schema

### Fixed
- Various bug fixes
- Performance improvements

---

## Version History Summary

| Version | Release Date | Status | Enterprise Readiness |
|---------|-------------|--------|---------------------|
| 0.1.0   | 2025-12-01  | Released | 30% (MVP) |
| 1.0.0   | 2026-01-15  | Released | 90% (Phase 1) |
| 2.0.0   | 2026-Q3     | Planned  | 100% (Phase 2) |

---

## Migration Guides

### Upgrading from 0.1.0 to 1.0.0

**Breaking Changes:**
- Database schema changes require migration
- Authentication system completely revamped
- API endpoints restructured

**Steps:**
1. Backup database: `pg_dump trustlayer > backup.sql`
2. Run migrations: `npm run migrate`
3. Update environment variables (see `.env.example`)
4. Restart application

**New Requirements:**
- Node.js 18+ (previously 16+)
- PostgreSQL 15+ (previously 14+)
- Supabase project

### Upgrading to 2.0.0 (Planned)

**Expected Breaking Changes:**
- Modular architecture refactor
- New database schemas for modules
- Enhanced RBAC with Auditor role

**Migration timeline:** Q3 2026

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

Proprietary - All rights reserved

## Support

- **Documentation**: https://docs.trustlayer.com
- **Email**: support@trustlayer.com
- **Status**: https://status.trustlayer.com

---

**Note:** This changelog follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version (X.0.0): Incompatible API changes
- **MINOR** version (0.X.0): Backwards-compatible new features
- **PATCH** version (0.0.X): Backwards-compatible bug fixes

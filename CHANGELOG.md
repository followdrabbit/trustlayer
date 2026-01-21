# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Feat
- **Core Infrastructure**: Implemented `ModuleLoader`, `EventBus`, and `ServiceRegistry` to support the modular architecture (ADR-0024).
- **ModuleLoader**: Added capability to register, activate, and aggregate routes/navigation from modules.
- **Routing**: Implemented `AppRouter` to dynamically render routes from active modules.
- **Layout**: Created `MainLayout` to dynamically render sidebar navigation based on active modules.

### Refactor
- **Modular Architecture**: Moved core governance features (pages, components, hooks, services) into the `src/modules/governance` directory.
- **Shared Code**: Migrated shared utilities, hooks, and components to the `src/shared` directory.
- **UI/UX**: Improved `MainLayout` to correctly render dynamic icons from module manifests.
- **Routing**: Moved 404 fallback route inside `MainLayout` for consistent user experience.
- This aligns the codebase with the modular architecture defined in ADR-0024.

### Fix
- Fixed missing icon rendering in sidebar navigation.
- Fixed 404 page layout consistency.
- **Build**: Created missing page components (`Assessment`, `Dashboard`, etc.) referenced in the governance module manifest.
- **Types**: Added shared type definitions (`Answer`, `UserProfile`) to resolve import errors.
- **UI**: Implemented `DashboardCard` component and integrated `useDashboardMetrics` into `DashboardExecutive`.
- **UI**: Enhanced `Assessment` page with domain selection list.
- **UI**: Fully implemented `DashboardGRC` with charts and `DashboardSpecialist` with gap lists in the correct module path.
- **Logic**: Updated `useDashboardMetrics` to provide mock data for charts and domain scores.
- **UI**: Fully implemented `DashboardGRC` with charts and `DashboardSpecialist` with gap lists.
- **Logic**: Updated `useDashboardMetrics` to provide mock data for charts and domain scores.
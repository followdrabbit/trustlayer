/**
 * Audit & Forensic Investigation System
 * Entry point for all audit logging functionality
 */

export * from './types';
export * from './audit-service';

// Re-export commonly used items
export {
  AuditLogService,
  auditLogService,
} from './audit-service';

export {
  RISK_THRESHOLDS,
  EVENT_TYPE_LABELS,
  RESOURCE_TYPE_LABELS,
  AUTH_METHOD_LABELS,
} from './types';

export type {
  ChangeLog,
  ChangeLogFilters,
  UserSession,
  SessionFilters,
  LoginHistory,
  LoginHistoryFilters,
  UserActivityMetrics,
  OrganizationActivityMetrics,
  TimelineEvent,
  ForensicInvestigation,
  ForensicSearchQuery,
  ForensicSearchResult,
  EventType,
  ResourceType,
  AuthMethod,
} from './types';

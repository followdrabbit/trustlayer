/**
 * Audit & Forensic Investigation System
 * Entry point for all audit logging functionality
 */

export * from './types';
export * from './audit-service';
export * from './device-fingerprint';
export * from './anomaly-detection';

// Re-export commonly used items
export {
  AuditLogService,
  auditLogService,
} from './audit-service';

export {
  DeviceFingerprintService,
  deviceFingerprint,
  getDeviceFingerprintHash,
  getDeviceInfo,
  matchesStoredFingerprint,
} from './device-fingerprint';

export type {
  DeviceFingerprint,
  FingerprintComponents,
  FingerprintMatch,
} from './device-fingerprint';

export {
  AnomalyDetectionService,
  anomalyDetection,
  DEFAULT_ANOMALY_CONFIG,
} from './anomaly-detection';

export type {
  Anomaly,
  AnomalyType,
  AnomalySeverity,
  AnomalyDetectionConfig,
  UserBaseline,
  DetectionContext,
} from './anomaly-detection';

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

/**
 * Audit & Forensic Investigation Types
 * Types for enhanced audit logging with forensic capabilities
 */

// ============================================================================
// Change Logs
// ============================================================================

export type EventType =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_reset'
  | 'permission_change'
  | 'export'
  | 'import'
  | 'access_denied'
  | 'suspicious_activity';

export type ResourceType =
  | 'assessment'
  | 'framework'
  | 'control'
  | 'evidence'
  | 'user'
  | 'organization'
  | 'role'
  | 'setting'
  | 'report'
  | 'integration';

export interface Geolocation {
  city: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  screenResolution: string;
}

export interface ChangeLog {
  id: string;
  organizationId: string;

  // Event metadata
  eventType: EventType;
  resourceType: ResourceType;
  resourceId?: string;

  // User context
  userId?: string;
  userEmail?: string;
  userRole?: string;

  // Session tracking
  sessionId?: string;

  // Network context
  ipAddress?: string;
  userAgent?: string;
  geolocation?: Geolocation;

  // Device fingerprinting
  deviceInfo?: DeviceInfo;

  // State tracking (before/after)
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  changedFields?: string[];

  // Additional context
  metadata?: Record<string, any>;
  description?: string;

  // Correlation
  correlationId?: string;
  parentEventId?: string;

  // Risk indicators
  riskScore?: number; // 0-100
  isSuspicious: boolean;

  createdAt: string;
}

export interface ChangeLogFilters {
  organizationId?: string;
  userId?: string;
  eventType?: EventType | EventType[];
  resourceType?: ResourceType | ResourceType[];
  resourceId?: string;
  sessionId?: string;
  isSuspicious?: boolean;
  minRiskScore?: number;
  dateFrom?: string;
  dateTo?: string;
  correlationId?: string;
}

// ============================================================================
// User Sessions
// ============================================================================

export type AuthMethod = 'password' | 'sso' | 'saml' | 'oauth';
export type SessionTerminationReason = 'user' | 'admin' | 'timeout' | 'system';

export interface UserSession {
  id: string;
  userId: string;
  organizationId: string;

  // Session lifecycle
  startedAt: string;
  lastActivityAt: string;
  endedAt?: string;
  durationSeconds?: number;

  // Session context
  ipAddress?: string;
  userAgent?: string;
  geolocation?: Geolocation;
  deviceInfo?: DeviceInfo;

  // Authentication
  authMethod: AuthMethod;
  mfaVerified: boolean;
  mfaMethod?: string;

  // Activity tracking
  pageViews: number;
  actionsCount: number;
  lastPageUrl?: string;

  // Security flags
  isActive: boolean;
  terminatedBy?: SessionTerminationReason;
  terminationReason?: string;

  createdAt: string;
  updatedAt: string;
}

export interface SessionFilters {
  organizationId?: string;
  userId?: string;
  isActive?: boolean;
  authMethod?: AuthMethod;
  mfaVerified?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface SessionActivitySummary {
  sessionId: string;
  userId: string;
  totalDuration: number;
  pageViews: number;
  actionsCount: number;
  uniquePages: number;
  avgPageDuration: number;
  suspiciousEvents: number;
}

// ============================================================================
// Login History
// ============================================================================

export interface LoginHistory {
  id: string;
  userId?: string;
  organizationId: string;

  // Login attempt info
  email: string;
  success: boolean;
  failureReason?: string;

  // Context
  ipAddress?: string;
  userAgent?: string;
  geolocation?: Geolocation;

  // Security
  mfaRequired: boolean;
  mfaSuccess?: boolean;
  isSuspicious: boolean;
  riskScore?: number;

  // Session created (if successful)
  sessionId?: string;

  createdAt: string;
}

export interface LoginHistoryFilters {
  organizationId?: string;
  userId?: string;
  email?: string;
  success?: boolean;
  isSuspicious?: boolean;
  minRiskScore?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface LoginAttemptsSummary {
  total: number;
  successful: number;
  failed: number;
  suspicious: number;
  uniqueIps: number;
  uniqueUsers: number;
  topFailureReasons: Array<{ reason: string; count: number }>;
}

// ============================================================================
// Audit Trail Views
// ============================================================================

export interface AuditTrailSummary {
  date: string;
  eventType: EventType;
  resourceType: ResourceType;
  eventCount: number;
  uniqueUsers: number;
  uniqueOrgs: number;
  suspiciousCount: number;
}

// ============================================================================
// Timeline & Activity Feed
// ============================================================================

export interface TimelineEvent {
  id: string;
  timestamp: string;
  eventType: EventType;
  resourceType: ResourceType;
  resourceId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  description: string;
  metadata?: Record<string, any>;
  isSuspicious: boolean;
  riskScore?: number;
}

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  icon: string;
  title: string;
  description: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  resource?: {
    type: ResourceType;
    id: string;
    name: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  isSuspicious: boolean;
}

// ============================================================================
// User Activity Dashboard
// ============================================================================

export interface UserActivityMetrics {
  userId: string;
  userEmail: string;
  period: {
    start: string;
    end: string;
  };

  // Activity stats
  totalSessions: number;
  totalDuration: number;
  avgSessionDuration: number;
  totalActions: number;
  totalPageViews: number;

  // Login stats
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  uniqueIpAddresses: number;
  uniqueDevices: number;

  // Security stats
  suspiciousEvents: number;
  avgRiskScore: number;
  mfaUsageRate: number;

  // Top activities
  topEventTypes: Array<{ eventType: EventType; count: number }>;
  topResourceTypes: Array<{ resourceType: ResourceType; count: number }>;
  activityByHour: Array<{ hour: number; count: number }>;
  activityByDay: Array<{ date: string; count: number }>;
}

export interface OrganizationActivityMetrics {
  organizationId: string;
  period: {
    start: string;
    end: string;
  };

  // Overall stats
  totalUsers: number;
  activeUsers: number;
  totalEvents: number;
  totalSessions: number;

  // Security stats
  suspiciousEvents: number;
  avgRiskScore: number;
  failedLoginRate: number;

  // Top users by activity
  topUsers: Array<{
    userId: string;
    userEmail: string;
    actionsCount: number;
    riskScore: number;
  }>;

  // Event distribution
  eventsByType: Array<{ eventType: EventType; count: number }>;
  eventsByResource: Array<{ resourceType: ResourceType; count: number }>;

  // Trends
  activityTrend: Array<{ date: string; count: number }>;
  riskTrend: Array<{ date: string; avgRisk: number }>;
}

// ============================================================================
// Forensic Investigation
// ============================================================================

export interface ForensicInvestigation {
  id: string;
  organizationId: string;

  // Investigation metadata
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Investigator
  assignedTo?: string;
  createdBy: string;

  // Scope
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  dateRange: {
    start: string;
    end: string;
  };

  // Findings
  suspiciousEvents: string[];
  relatedSessions: string[];
  relatedUsers: string[];
  notes: string;
  evidence: Array<{
    type: 'log' | 'session' | 'screenshot' | 'document';
    id: string;
    description: string;
    timestamp: string;
  }>;

  // Resolution
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ForensicSearchQuery {
  organizationId: string;
  query: string; // Natural language or structured query
  filters: {
    eventTypes?: EventType[];
    resourceTypes?: ResourceType[];
    userIds?: string[];
    ipAddresses?: string[];
    dateRange: {
      start: string;
      end: string;
    };
    minRiskScore?: number;
    onlySuspicious?: boolean;
  };
  sortBy?: 'timestamp' | 'riskScore' | 'relevance';
  limit?: number;
  offset?: number;
}

export interface ForensicSearchResult {
  events: ChangeLog[];
  sessions: UserSession[];
  logins: LoginHistory[];
  totalResults: number;
  correlatedEvents: Map<string, ChangeLog[]>; // Grouped by correlation_id
  timeline: TimelineEvent[];
  suspiciousPatterns: Array<{
    type: 'multiple_failed_logins' | 'ip_change' | 'unusual_hours' | 'privilege_escalation';
    description: string;
    relatedEvents: string[];
    riskScore: number;
  }>;
}

// ============================================================================
// Audit Log Service Interface
// ============================================================================

export interface IAuditLogService {
  // Change logs
  logEvent(event: Omit<ChangeLog, 'id' | 'createdAt'>): Promise<ChangeLog>;
  getChangeLogs(filters: ChangeLogFilters): Promise<ChangeLog[]>;
  getChangeLog(id: string): Promise<ChangeLog | null>;

  // Sessions
  createSession(session: Omit<UserSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserSession>;
  updateSession(id: string, updates: Partial<UserSession>): Promise<UserSession>;
  endSession(id: string, terminatedBy: SessionTerminationReason, reason?: string): Promise<UserSession>;
  getSessions(filters: SessionFilters): Promise<UserSession[]>;
  getActiveSessionsCount(organizationId: string): Promise<number>;

  // Login history
  logLogin(login: Omit<LoginHistory, 'id' | 'createdAt'>): Promise<LoginHistory>;
  getLoginHistory(filters: LoginHistoryFilters): Promise<LoginHistory[]>;
  getLoginAttemptsSummary(organizationId: string, dateFrom: string, dateTo: string): Promise<LoginAttemptsSummary>;

  // Activity metrics
  getUserActivityMetrics(userId: string, dateFrom: string, dateTo: string): Promise<UserActivityMetrics>;
  getOrganizationActivityMetrics(organizationId: string, dateFrom: string, dateTo: string): Promise<OrganizationActivityMetrics>;

  // Timeline
  getActivityTimeline(organizationId: string, filters: ChangeLogFilters): Promise<TimelineEvent[]>;

  // Forensics
  searchForensic(query: ForensicSearchQuery): Promise<ForensicSearchResult>;
  detectSuspiciousPatterns(organizationId: string, dateFrom: string, dateTo: string): Promise<ForensicSearchResult['suspiciousPatterns']>;
}

// ============================================================================
// Helper Functions Types
// ============================================================================

export interface RiskCalculationFactors {
  failedLoginCount: number;
  ipAddressChanges: number;
  unusualHours: boolean;
  unusualLocation: boolean;
  privilegeEscalation: boolean;
  rapidActions: boolean;
  suspiciousPatterns: string[];
}

export interface AuditExportOptions {
  format: 'json' | 'csv' | 'pdf';
  filters: ChangeLogFilters;
  includeMetadata: boolean;
  includeRelatedSessions: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const RISK_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 50,
  HIGH: 70,
  CRITICAL: 90,
} as const;

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  login: 'Login',
  logout: 'Logout',
  login_failed: 'Falha de Login',
  password_reset: 'Redefinição de Senha',
  permission_change: 'Mudança de Permissão',
  export: 'Exportação',
  import: 'Importação',
  access_denied: 'Acesso Negado',
  suspicious_activity: 'Atividade Suspeita',
};

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  assessment: 'Avaliação',
  framework: 'Framework',
  control: 'Controle',
  evidence: 'Evidência',
  user: 'Usuário',
  organization: 'Organização',
  role: 'Papel',
  setting: 'Configuração',
  report: 'Relatório',
  integration: 'Integração',
};

export const AUTH_METHOD_LABELS: Record<AuthMethod, string> = {
  password: 'Senha',
  sso: 'SSO',
  saml: 'SAML',
  oauth: 'OAuth',
};

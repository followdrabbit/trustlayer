/**
 * Anomaly Detection Service
 *
 * Detects suspicious patterns and anomalies in user behavior.
 * Uses statistical analysis and rule-based detection.
 *
 * Detection categories:
 * - Authentication anomalies (failed logins, unusual times, location changes)
 * - Behavioral anomalies (unusual activity patterns, rapid actions)
 * - Access anomalies (privilege escalation, unauthorized access attempts)
 * - Data anomalies (bulk exports, unusual queries)
 */

import type {
  ChangeLog,
  UserSession,
  LoginHistory,
  EventType,
  ResourceType,
  RiskCalculationFactors,
  Geolocation,
} from './types';

// ============================================================================
// Types
// ============================================================================

export type AnomalyType =
  | 'multiple_failed_logins'
  | 'brute_force_attempt'
  | 'ip_change'
  | 'location_change'
  | 'unusual_hours'
  | 'rapid_actions'
  | 'privilege_escalation'
  | 'bulk_export'
  | 'bulk_delete'
  | 'unauthorized_access'
  | 'session_hijacking'
  | 'impossible_travel'
  | 'new_device'
  | 'dormant_account'
  | 'concurrent_sessions'
  | 'permission_abuse';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  relatedEventIds: string[];
  metadata: Record<string, any>;
  riskScore: number; // 0-100
  detectedAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  falsePositive: boolean;
}

export interface AnomalyDetectionConfig {
  // Authentication thresholds
  maxFailedLogins: number; // per time window
  failedLoginWindow: number; // minutes
  maxConcurrentSessions: number;

  // Behavioral thresholds
  unusualHoursStart: number; // 0-23
  unusualHoursEnd: number; // 0-23
  rapidActionThreshold: number; // actions per minute
  rapidActionWindow: number; // minutes

  // Location thresholds
  impossibleTravelSpeed: number; // km/h
  locationChangeAlertEnabled: boolean;

  // Data thresholds
  bulkExportThreshold: number; // records
  bulkDeleteThreshold: number; // records

  // Account thresholds
  dormantAccountDays: number;

  // General settings
  enabled: boolean;
  realTimeEnabled: boolean;
  alertOnCritical: boolean;
}

export interface UserBaseline {
  userId: string;

  // Typical activity patterns
  typicalLoginHours: number[]; // hours of day (0-23)
  typicalDaysOfWeek: number[]; // 0-6 (Sun-Sat)
  avgActionsPerSession: number;
  avgSessionDuration: number; // minutes

  // Known devices/locations
  knownIpAddresses: string[];
  knownDeviceHashes: string[];
  knownLocations: Array<{ city: string; country: string }>;

  // Activity metrics
  avgDailyEvents: number;
  avgWeeklyLogins: number;

  // Updated timestamp
  lastUpdated: string;
}

export interface DetectionContext {
  currentEvent?: ChangeLog;
  currentSession?: UserSession;
  recentEvents: ChangeLog[];
  recentLogins: LoginHistory[];
  userBaseline?: UserBaseline;
  config: AnomalyDetectionConfig;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_ANOMALY_CONFIG: AnomalyDetectionConfig = {
  // Authentication
  maxFailedLogins: 5,
  failedLoginWindow: 15, // 15 minutes
  maxConcurrentSessions: 3,

  // Behavioral
  unusualHoursStart: 0, // midnight
  unusualHoursEnd: 6, // 6 AM
  rapidActionThreshold: 60, // 60 actions per minute
  rapidActionWindow: 5, // 5 minute window

  // Location
  impossibleTravelSpeed: 1000, // 1000 km/h (faster than commercial flights)
  locationChangeAlertEnabled: true,

  // Data
  bulkExportThreshold: 1000,
  bulkDeleteThreshold: 50,

  // Account
  dormantAccountDays: 90,

  // General
  enabled: true,
  realTimeEnabled: true,
  alertOnCritical: true,
};

// ============================================================================
// Anomaly Detection Service
// ============================================================================

export class AnomalyDetectionService {
  private config: AnomalyDetectionConfig;
  private userBaselines: Map<string, UserBaseline> = new Map();

  constructor(config: Partial<AnomalyDetectionConfig> = {}) {
    this.config = { ...DEFAULT_ANOMALY_CONFIG, ...config };
  }

  /**
   * Analyze events and detect anomalies
   */
  async detectAnomalies(context: DetectionContext): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    if (!this.config.enabled) {
      return anomalies;
    }

    // Run all detection algorithms
    const detectors = [
      () => this.detectFailedLogins(context),
      () => this.detectBruteForce(context),
      () => this.detectIpChange(context),
      () => this.detectLocationChange(context),
      () => this.detectUnusualHours(context),
      () => this.detectRapidActions(context),
      () => this.detectPrivilegeEscalation(context),
      () => this.detectBulkExport(context),
      () => this.detectBulkDelete(context),
      () => this.detectUnauthorizedAccess(context),
      () => this.detectImpossibleTravel(context),
      () => this.detectNewDevice(context),
      () => this.detectConcurrentSessions(context),
    ];

    for (const detector of detectors) {
      const detected = detector();
      if (detected) {
        anomalies.push(...(Array.isArray(detected) ? detected : [detected]));
      }
    }

    return anomalies;
  }

  /**
   * Calculate risk score for an event
   */
  calculateRiskScore(factors: RiskCalculationFactors): number {
    let score = 0;

    // Failed logins (max 30 points)
    score += Math.min(30, factors.failedLoginCount * 6);

    // IP changes (max 20 points)
    score += Math.min(20, factors.ipAddressChanges * 10);

    // Unusual hours (15 points)
    if (factors.unusualHours) {
      score += 15;
    }

    // Unusual location (20 points)
    if (factors.unusualLocation) {
      score += 20;
    }

    // Privilege escalation (25 points)
    if (factors.privilegeEscalation) {
      score += 25;
    }

    // Rapid actions (15 points)
    if (factors.rapidActions) {
      score += 15;
    }

    // Suspicious patterns (up to 25 points)
    score += Math.min(25, factors.suspiciousPatterns.length * 5);

    return Math.min(100, score);
  }

  /**
   * Update user baseline from historical data
   */
  updateUserBaseline(userId: string, events: ChangeLog[], logins: LoginHistory[]): UserBaseline {
    const loginHours: number[] = [];
    const loginDays: number[] = [];
    const ipAddresses: Set<string> = new Set();
    const locations: Map<string, { city: string; country: string }> = new Map();

    // Analyze logins
    for (const login of logins) {
      if (login.success) {
        const date = new Date(login.createdAt);
        loginHours.push(date.getHours());
        loginDays.push(date.getDay());

        if (login.ipAddress) {
          ipAddresses.add(login.ipAddress);
        }

        if (login.geolocation) {
          const key = `${login.geolocation.city}-${login.geolocation.country}`;
          if (!locations.has(key)) {
            locations.set(key, {
              city: login.geolocation.city,
              country: login.geolocation.country,
            });
          }
        }
      }
    }

    // Calculate typical hours (most common)
    const typicalLoginHours = this.getMostCommon(loginHours, 4);
    const typicalDaysOfWeek = this.getMostCommon(loginDays, 5);

    // Calculate averages
    const sessionsData = this.groupEventsBySessions(events);
    const avgActionsPerSession = sessionsData.length > 0
      ? sessionsData.reduce((sum, s) => sum + s.events.length, 0) / sessionsData.length
      : 0;
    const avgSessionDuration = sessionsData.length > 0
      ? sessionsData.reduce((sum, s) => sum + s.duration, 0) / sessionsData.length
      : 0;

    // Daily/weekly averages
    const eventDays = new Set(events.map(e => e.createdAt.split('T')[0]));
    const avgDailyEvents = eventDays.size > 0 ? events.length / eventDays.size : 0;
    const avgWeeklyLogins = logins.filter(l => l.success).length / Math.max(1, Math.ceil(eventDays.size / 7));

    const baseline: UserBaseline = {
      userId,
      typicalLoginHours,
      typicalDaysOfWeek,
      avgActionsPerSession,
      avgSessionDuration,
      knownIpAddresses: [...ipAddresses],
      knownDeviceHashes: [], // Will be populated by device fingerprinting
      knownLocations: [...locations.values()],
      avgDailyEvents,
      avgWeeklyLogins,
      lastUpdated: new Date().toISOString(),
    };

    this.userBaselines.set(userId, baseline);
    return baseline;
  }

  // ============================================================================
  // Detection Algorithms
  // ============================================================================

  private detectFailedLogins(context: DetectionContext): Anomaly | null {
    const { recentLogins, config } = context;

    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - config.failedLoginWindow);

    const failedLogins = recentLogins.filter(
      l => !l.success && new Date(l.createdAt) >= windowStart
    );

    if (failedLogins.length >= config.maxFailedLogins) {
      const severity: AnomalySeverity =
        failedLogins.length >= config.maxFailedLogins * 2 ? 'high' : 'medium';

      return this.createAnomaly({
        type: 'multiple_failed_logins',
        severity,
        title: 'Multiple Failed Login Attempts',
        description: `${failedLogins.length} failed login attempts in the last ${config.failedLoginWindow} minutes`,
        userId: failedLogins[0]?.userId,
        userEmail: failedLogins[0]?.email,
        relatedEventIds: failedLogins.map(l => l.id),
        metadata: {
          failedCount: failedLogins.length,
          windowMinutes: config.failedLoginWindow,
          ipAddresses: [...new Set(failedLogins.map(l => l.ipAddress))],
        },
        riskScore: Math.min(100, failedLogins.length * 15),
      });
    }

    return null;
  }

  private detectBruteForce(context: DetectionContext): Anomaly | null {
    const { recentLogins } = context;

    // Check for rapid login attempts (more than 10 in 1 minute)
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    const rapidAttempts = recentLogins.filter(
      l => new Date(l.createdAt) >= oneMinuteAgo
    );

    if (rapidAttempts.length >= 10) {
      return this.createAnomaly({
        type: 'brute_force_attempt',
        severity: 'critical',
        title: 'Possible Brute Force Attack',
        description: `${rapidAttempts.length} login attempts in the last minute`,
        userEmail: rapidAttempts[0]?.email,
        relatedEventIds: rapidAttempts.map(l => l.id),
        metadata: {
          attemptCount: rapidAttempts.length,
          ipAddresses: [...new Set(rapidAttempts.map(l => l.ipAddress))],
        },
        riskScore: 95,
      });
    }

    return null;
  }

  private detectIpChange(context: DetectionContext): Anomaly | null {
    const { currentEvent, recentEvents, userBaseline, config } = context;

    if (!currentEvent || !userBaseline || !config.locationChangeAlertEnabled) {
      return null;
    }

    const currentIp = currentEvent.ipAddress;
    if (!currentIp || userBaseline.knownIpAddresses.includes(currentIp)) {
      return null;
    }

    // Find the last known IP
    const lastKnownIpEvent = recentEvents.find(
      e => e.userId === currentEvent.userId && e.ipAddress && e.ipAddress !== currentIp
    );

    if (lastKnownIpEvent) {
      return this.createAnomaly({
        type: 'ip_change',
        severity: 'medium',
        title: 'IP Address Changed',
        description: `User accessed from new IP address: ${currentIp}`,
        userId: currentEvent.userId,
        userEmail: currentEvent.userEmail,
        sessionId: currentEvent.sessionId,
        relatedEventIds: [currentEvent.id],
        metadata: {
          newIp: currentIp,
          previousIp: lastKnownIpEvent.ipAddress,
          knownIps: userBaseline.knownIpAddresses,
        },
        riskScore: 35,
      });
    }

    return null;
  }

  private detectLocationChange(context: DetectionContext): Anomaly | null {
    const { currentEvent, userBaseline, config } = context;

    if (!currentEvent || !userBaseline || !config.locationChangeAlertEnabled) {
      return null;
    }

    const currentLoc = currentEvent.geolocation;
    if (!currentLoc) {
      return null;
    }

    const isKnownLocation = userBaseline.knownLocations.some(
      loc => loc.city === currentLoc.city && loc.country === currentLoc.country
    );

    if (!isKnownLocation) {
      return this.createAnomaly({
        type: 'location_change',
        severity: 'medium',
        title: 'Access from New Location',
        description: `User accessed from ${currentLoc.city}, ${currentLoc.country}`,
        userId: currentEvent.userId,
        userEmail: currentEvent.userEmail,
        sessionId: currentEvent.sessionId,
        relatedEventIds: [currentEvent.id],
        metadata: {
          newLocation: currentLoc,
          knownLocations: userBaseline.knownLocations,
        },
        riskScore: 40,
      });
    }

    return null;
  }

  private detectUnusualHours(context: DetectionContext): Anomaly | null {
    const { currentEvent, userBaseline, config } = context;

    if (!currentEvent) {
      return null;
    }

    const hour = new Date(currentEvent.createdAt).getHours();
    const isUnusualSystemHours = hour >= config.unusualHoursStart && hour < config.unusualHoursEnd;
    const isUnusualUserHours = userBaseline && !userBaseline.typicalLoginHours.includes(hour);

    if (isUnusualSystemHours || isUnusualUserHours) {
      return this.createAnomaly({
        type: 'unusual_hours',
        severity: 'low',
        title: 'Activity at Unusual Hours',
        description: `User activity detected at ${hour}:00`,
        userId: currentEvent.userId,
        userEmail: currentEvent.userEmail,
        sessionId: currentEvent.sessionId,
        relatedEventIds: [currentEvent.id],
        metadata: {
          hour,
          typicalHours: userBaseline?.typicalLoginHours || [],
          systemUnusualHours: { start: config.unusualHoursStart, end: config.unusualHoursEnd },
        },
        riskScore: 25,
      });
    }

    return null;
  }

  private detectRapidActions(context: DetectionContext): Anomaly | null {
    const { recentEvents, config } = context;

    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - config.rapidActionWindow);

    const recentWindowEvents = recentEvents.filter(
      e => new Date(e.createdAt) >= windowStart
    );

    // Group by user
    const eventsByUser: Record<string, ChangeLog[]> = {};
    for (const event of recentWindowEvents) {
      const userId = event.userId || 'unknown';
      if (!eventsByUser[userId]) {
        eventsByUser[userId] = [];
      }
      eventsByUser[userId].push(event);
    }

    const anomalies: Anomaly[] = [];
    for (const [userId, events] of Object.entries(eventsByUser)) {
      const actionsPerMinute = events.length / config.rapidActionWindow;

      if (actionsPerMinute >= config.rapidActionThreshold) {
        anomalies.push(
          this.createAnomaly({
            type: 'rapid_actions',
            severity: 'high',
            title: 'Unusually Rapid Activity',
            description: `${Math.round(actionsPerMinute)} actions per minute detected`,
            userId: userId !== 'unknown' ? userId : undefined,
            relatedEventIds: events.map(e => e.id),
            metadata: {
              actionsPerMinute: Math.round(actionsPerMinute),
              totalActions: events.length,
              windowMinutes: config.rapidActionWindow,
            },
            riskScore: 70,
          })
        );
      }
    }

    return anomalies.length > 0 ? anomalies[0] : null;
  }

  private detectPrivilegeEscalation(context: DetectionContext): Anomaly | null {
    const { recentEvents } = context;

    const permissionChanges = recentEvents.filter(
      e => e.eventType === 'permission_change' && e.resourceType === 'user'
    );

    for (const event of permissionChanges) {
      const beforeRole = event.beforeState?.role;
      const afterRole = event.afterState?.role;

      const roleHierarchy = ['viewer', 'analyst', 'manager', 'admin'];
      const beforeIndex = roleHierarchy.indexOf(beforeRole);
      const afterIndex = roleHierarchy.indexOf(afterRole);

      // Escalation detected
      if (afterIndex > beforeIndex && afterIndex >= 2) {
        // manager or admin
        return this.createAnomaly({
          type: 'privilege_escalation',
          severity: afterRole === 'admin' ? 'critical' : 'high',
          title: 'Privilege Escalation Detected',
          description: `User role changed from ${beforeRole} to ${afterRole}`,
          userId: event.resourceId,
          relatedEventIds: [event.id],
          metadata: {
            previousRole: beforeRole,
            newRole: afterRole,
            changedBy: event.userId,
          },
          riskScore: afterRole === 'admin' ? 90 : 70,
        });
      }
    }

    return null;
  }

  private detectBulkExport(context: DetectionContext): Anomaly | null {
    const { recentEvents, config } = context;

    const exportEvents = recentEvents.filter(e => e.eventType === 'export');

    // Group by user in last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentExports = exportEvents.filter(e => new Date(e.createdAt) >= oneHourAgo);

    for (const userId of new Set(recentExports.map(e => e.userId))) {
      const userExports = recentExports.filter(e => e.userId === userId);
      const totalRecords = userExports.reduce(
        (sum, e) => sum + (e.metadata?.recordCount || 0),
        0
      );

      if (totalRecords >= config.bulkExportThreshold) {
        return this.createAnomaly({
          type: 'bulk_export',
          severity: 'high',
          title: 'Bulk Data Export Detected',
          description: `${totalRecords} records exported in the last hour`,
          userId,
          relatedEventIds: userExports.map(e => e.id),
          metadata: {
            totalRecords,
            exportCount: userExports.length,
            threshold: config.bulkExportThreshold,
          },
          riskScore: 75,
        });
      }
    }

    return null;
  }

  private detectBulkDelete(context: DetectionContext): Anomaly | null {
    const { recentEvents, config } = context;

    const deleteEvents = recentEvents.filter(e => e.eventType === 'delete');

    // Group by user in last 30 minutes
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    const recentDeletes = deleteEvents.filter(e => new Date(e.createdAt) >= thirtyMinutesAgo);

    for (const userId of new Set(recentDeletes.map(e => e.userId))) {
      const userDeletes = recentDeletes.filter(e => e.userId === userId);

      if (userDeletes.length >= config.bulkDeleteThreshold) {
        return this.createAnomaly({
          type: 'bulk_delete',
          severity: 'critical',
          title: 'Bulk Deletion Detected',
          description: `${userDeletes.length} items deleted in the last 30 minutes`,
          userId,
          relatedEventIds: userDeletes.map(e => e.id),
          metadata: {
            deleteCount: userDeletes.length,
            threshold: config.bulkDeleteThreshold,
            resourceTypes: [...new Set(userDeletes.map(e => e.resourceType))],
          },
          riskScore: 90,
        });
      }
    }

    return null;
  }

  private detectUnauthorizedAccess(context: DetectionContext): Anomaly | null {
    const { recentEvents } = context;

    const accessDeniedEvents = recentEvents.filter(e => e.eventType === 'access_denied');

    // More than 5 access denied in 10 minutes is suspicious
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const recentDenied = accessDeniedEvents.filter(e => new Date(e.createdAt) >= tenMinutesAgo);

    for (const userId of new Set(recentDenied.map(e => e.userId))) {
      const userDenied = recentDenied.filter(e => e.userId === userId);

      if (userDenied.length >= 5) {
        return this.createAnomaly({
          type: 'unauthorized_access',
          severity: 'high',
          title: 'Multiple Unauthorized Access Attempts',
          description: `${userDenied.length} access denied events in the last 10 minutes`,
          userId,
          relatedEventIds: userDenied.map(e => e.id),
          metadata: {
            deniedCount: userDenied.length,
            resources: [...new Set(userDenied.map(e => e.resourceType))],
          },
          riskScore: 65,
        });
      }
    }

    return null;
  }

  private detectImpossibleTravel(context: DetectionContext): Anomaly | null {
    const { recentLogins, config } = context;

    // Need at least 2 logins to compare
    if (recentLogins.length < 2) {
      return null;
    }

    // Sort by time
    const sortedLogins = [...recentLogins]
      .filter(l => l.success && l.geolocation)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (let i = 1; i < sortedLogins.length; i++) {
      const prev = sortedLogins[i - 1];
      const curr = sortedLogins[i];

      if (!prev.geolocation || !curr.geolocation) continue;

      const distance = this.calculateDistance(prev.geolocation, curr.geolocation);
      const timeDiffHours =
        (new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime()) / (1000 * 60 * 60);

      if (timeDiffHours > 0) {
        const speed = distance / timeDiffHours;

        if (speed > config.impossibleTravelSpeed) {
          return this.createAnomaly({
            type: 'impossible_travel',
            severity: 'critical',
            title: 'Impossible Travel Detected',
            description: `Login from ${curr.geolocation.city} after ${prev.geolocation.city} at impossible speed`,
            userId: curr.userId,
            userEmail: curr.email,
            relatedEventIds: [prev.id, curr.id],
            metadata: {
              fromLocation: prev.geolocation,
              toLocation: curr.geolocation,
              distanceKm: Math.round(distance),
              timeDiffHours: Math.round(timeDiffHours * 10) / 10,
              impliedSpeedKmh: Math.round(speed),
              maxAllowedSpeed: config.impossibleTravelSpeed,
            },
            riskScore: 95,
          });
        }
      }
    }

    return null;
  }

  private detectNewDevice(context: DetectionContext): Anomaly | null {
    const { currentEvent, userBaseline } = context;

    if (!currentEvent || !userBaseline || userBaseline.knownDeviceHashes.length === 0) {
      return null;
    }

    const currentDeviceHash = currentEvent.metadata?.deviceHash;
    if (!currentDeviceHash) {
      return null;
    }

    if (!userBaseline.knownDeviceHashes.includes(currentDeviceHash)) {
      return this.createAnomaly({
        type: 'new_device',
        severity: 'medium',
        title: 'Access from New Device',
        description: 'User logged in from a previously unknown device',
        userId: currentEvent.userId,
        userEmail: currentEvent.userEmail,
        sessionId: currentEvent.sessionId,
        relatedEventIds: [currentEvent.id],
        metadata: {
          deviceHash: currentDeviceHash,
          deviceInfo: currentEvent.deviceInfo,
          knownDevices: userBaseline.knownDeviceHashes.length,
        },
        riskScore: 40,
      });
    }

    return null;
  }

  private detectConcurrentSessions(context: DetectionContext): Anomaly | null {
    const { currentSession, config } = context;

    // This would need access to active sessions
    // For now, check if metadata indicates concurrent sessions
    if (currentSession?.metadata?.concurrentSessionCount >= config.maxConcurrentSessions) {
      return this.createAnomaly({
        type: 'concurrent_sessions',
        severity: 'medium',
        title: 'Multiple Concurrent Sessions',
        description: `User has ${currentSession.metadata.concurrentSessionCount} active sessions`,
        userId: currentSession.userId,
        sessionId: currentSession.id,
        relatedEventIds: [],
        metadata: {
          sessionCount: currentSession.metadata.concurrentSessionCount,
          maxAllowed: config.maxConcurrentSessions,
        },
        riskScore: 45,
      });
    }

    return null;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createAnomaly(data: Omit<Anomaly, 'id' | 'detectedAt' | 'acknowledged' | 'falsePositive'>): Anomaly {
    return {
      ...data,
      id: this.generateId(),
      detectedAt: new Date().toISOString(),
      acknowledged: false,
      falsePositive: false,
    };
  }

  private generateId(): string {
    return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMostCommon<T>(arr: T[], count: number): T[] {
    const frequency = new Map<T, number>();
    for (const item of arr) {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    }
    return [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([item]) => item);
  }

  private groupEventsBySessions(events: ChangeLog[]): Array<{ sessionId: string; events: ChangeLog[]; duration: number }> {
    const sessions = new Map<string, ChangeLog[]>();
    for (const event of events) {
      const sessionId = event.sessionId || 'unknown';
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, []);
      }
      sessions.get(sessionId)!.push(event);
    }

    return [...sessions.entries()].map(([sessionId, sessionEvents]) => {
      const sorted = sessionEvents.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const duration = (new Date(last.createdAt).getTime() - new Date(first.createdAt).getTime()) / (1000 * 60);
      return { sessionId, events: sessionEvents, duration };
    });
  }

  private calculateDistance(loc1: Geolocation, loc2: Geolocation): number {
    // Haversine formula for distance between two points on Earth
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLon = this.toRad(loc2.lon - loc1.lon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.lat)) * Math.cos(this.toRad(loc2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AnomalyDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AnomalyDetectionConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const anomalyDetection = new AnomalyDetectionService();

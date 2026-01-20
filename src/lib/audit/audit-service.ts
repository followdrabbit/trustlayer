/**
 * Audit Log Service
 * Manages comprehensive audit trail with forensic capabilities
 */

import { supabase } from '@/lib/supabase';
import type {
  IAuditLogService,
  ChangeLog,
  ChangeLogFilters,
  UserSession,
  SessionFilters,
  SessionTerminationReason,
  LoginHistory,
  LoginHistoryFilters,
  LoginAttemptsSummary,
  UserActivityMetrics,
  OrganizationActivityMetrics,
  TimelineEvent,
  ForensicSearchQuery,
  ForensicSearchResult,
  EventType,
  ResourceType,
} from './types';

export class AuditLogService implements IAuditLogService {
  // ============================================================================
  // Change Logs
  // ============================================================================

  async logEvent(event: Omit<ChangeLog, 'id' | 'createdAt'>): Promise<ChangeLog> {
    const { data, error } = await supabase
      .from('change_logs')
      .insert({
        organization_id: event.organizationId,
        event_type: event.eventType,
        resource_type: event.resourceType,
        resource_id: event.resourceId,
        user_id: event.userId,
        user_email: event.userEmail,
        user_role: event.userRole,
        session_id: event.sessionId,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        geolocation: event.geolocation,
        device_info: event.deviceInfo,
        before_state: event.beforeState,
        after_state: event.afterState,
        changed_fields: event.changedFields,
        metadata: event.metadata,
        description: event.description,
        correlation_id: event.correlationId,
        parent_event_id: event.parentEventId,
        risk_score: event.riskScore,
        is_suspicious: event.isSuspicious,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapChangeLog(data);
  }

  async getChangeLogs(filters: ChangeLogFilters): Promise<ChangeLog[]> {
    let query = supabase
      .from('change_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.eventType) {
      if (Array.isArray(filters.eventType)) {
        query = query.in('event_type', filters.eventType);
      } else {
        query = query.eq('event_type', filters.eventType);
      }
    }
    if (filters.resourceType) {
      if (Array.isArray(filters.resourceType)) {
        query = query.in('resource_type', filters.resourceType);
      } else {
        query = query.eq('resource_type', filters.resourceType);
      }
    }
    if (filters.resourceId) {
      query = query.eq('resource_id', filters.resourceId);
    }
    if (filters.sessionId) {
      query = query.eq('session_id', filters.sessionId);
    }
    if (filters.isSuspicious !== undefined) {
      query = query.eq('is_suspicious', filters.isSuspicious);
    }
    if (filters.minRiskScore !== undefined) {
      query = query.gte('risk_score', filters.minRiskScore);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    if (filters.correlationId) {
      query = query.eq('correlation_id', filters.correlationId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.map(this.mapChangeLog) || [];
  }

  async getChangeLog(id: string): Promise<ChangeLog | null> {
    const { data, error } = await supabase
      .from('change_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapChangeLog(data);
  }

  // ============================================================================
  // User Sessions
  // ============================================================================

  async createSession(
    session: Omit<UserSession, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserSession> {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: session.userId,
        organization_id: session.organizationId,
        started_at: session.startedAt,
        last_activity_at: session.lastActivityAt,
        ip_address: session.ipAddress,
        user_agent: session.userAgent,
        geolocation: session.geolocation,
        device_info: session.deviceInfo,
        auth_method: session.authMethod,
        mfa_verified: session.mfaVerified,
        mfa_method: session.mfaMethod,
        page_views: session.pageViews,
        actions_count: session.actionsCount,
        last_page_url: session.lastPageUrl,
        is_active: session.isActive,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapUserSession(data);
  }

  async updateSession(id: string, updates: Partial<UserSession>): Promise<UserSession> {
    const updateData: any = {};

    if (updates.lastActivityAt) updateData.last_activity_at = updates.lastActivityAt;
    if (updates.endedAt !== undefined) updateData.ended_at = updates.endedAt;
    if (updates.pageViews !== undefined) updateData.page_views = updates.pageViews;
    if (updates.actionsCount !== undefined) updateData.actions_count = updates.actionsCount;
    if (updates.lastPageUrl !== undefined) updateData.last_page_url = updates.lastPageUrl;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.terminatedBy !== undefined) updateData.terminated_by = updates.terminatedBy;
    if (updates.terminationReason !== undefined) updateData.termination_reason = updates.terminationReason;

    const { data, error } = await supabase
      .from('user_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapUserSession(data);
  }

  async endSession(
    id: string,
    terminatedBy: SessionTerminationReason,
    reason?: string
  ): Promise<UserSession> {
    return this.updateSession(id, {
      endedAt: new Date().toISOString(),
      isActive: false,
      terminatedBy,
      terminationReason: reason,
    });
  }

  async getSessions(filters: SessionFilters): Promise<UserSession[]> {
    let query = supabase
      .from('user_sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (filters.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.authMethod) {
      query = query.eq('auth_method', filters.authMethod);
    }
    if (filters.mfaVerified !== undefined) {
      query = query.eq('mfa_verified', filters.mfaVerified);
    }
    if (filters.dateFrom) {
      query = query.gte('started_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('started_at', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.map(this.mapUserSession) || [];
  }

  async getActiveSessionsCount(organizationId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) throw error;
    return count || 0;
  }

  // ============================================================================
  // Login History
  // ============================================================================

  async logLogin(login: Omit<LoginHistory, 'id' | 'createdAt'>): Promise<LoginHistory> {
    const { data, error } = await supabase
      .from('login_history')
      .insert({
        user_id: login.userId,
        organization_id: login.organizationId,
        email: login.email,
        success: login.success,
        failure_reason: login.failureReason,
        ip_address: login.ipAddress,
        user_agent: login.userAgent,
        geolocation: login.geolocation,
        mfa_required: login.mfaRequired,
        mfa_success: login.mfaSuccess,
        is_suspicious: login.isSuspicious,
        risk_score: login.riskScore,
        session_id: login.sessionId,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapLoginHistory(data);
  }

  async getLoginHistory(filters: LoginHistoryFilters): Promise<LoginHistory[]> {
    let query = supabase
      .from('login_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.email) {
      query = query.eq('email', filters.email);
    }
    if (filters.success !== undefined) {
      query = query.eq('success', filters.success);
    }
    if (filters.isSuspicious !== undefined) {
      query = query.eq('is_suspicious', filters.isSuspicious);
    }
    if (filters.minRiskScore !== undefined) {
      query = query.gte('risk_score', filters.minRiskScore);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.map(this.mapLoginHistory) || [];
  }

  async getLoginAttemptsSummary(
    organizationId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<LoginAttemptsSummary> {
    const { data: logins, error } = await supabase
      .from('login_history')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo);

    if (error) throw error;

    const total = logins?.length || 0;
    const successful = logins?.filter((l) => l.success).length || 0;
    const failed = total - successful;
    const suspicious = logins?.filter((l) => l.is_suspicious).length || 0;
    const uniqueIps = new Set(logins?.map((l) => l.ip_address).filter(Boolean)).size;
    const uniqueUsers = new Set(logins?.map((l) => l.user_id).filter(Boolean)).size;

    // Count failure reasons
    const failureReasonMap = new Map<string, number>();
    logins
      ?.filter((l) => !l.success && l.failure_reason)
      .forEach((l) => {
        const count = failureReasonMap.get(l.failure_reason!) || 0;
        failureReasonMap.set(l.failure_reason!, count + 1);
      });

    const topFailureReasons = Array.from(failureReasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total,
      successful,
      failed,
      suspicious,
      uniqueIps,
      uniqueUsers,
      topFailureReasons,
    };
  }

  // ============================================================================
  // Activity Metrics
  // ============================================================================

  async getUserActivityMetrics(
    userId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<UserActivityMetrics> {
    // Fetch user data
    const { data: user } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    // Fetch sessions
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', dateFrom)
      .lte('started_at', dateTo);

    // Fetch change logs
    const { data: changeLogs } = await supabase
      .from('change_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo);

    // Fetch login history
    const { data: logins } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo);

    // Calculate metrics
    const totalSessions = sessions?.length || 0;
    const totalDuration = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
    const avgSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
    const totalActions = sessions?.reduce((sum, s) => sum + (s.actions_count || 0), 0) || 0;
    const totalPageViews = sessions?.reduce((sum, s) => sum + (s.page_views || 0), 0) || 0;

    const totalLogins = logins?.length || 0;
    const successfulLogins = logins?.filter((l) => l.success).length || 0;
    const failedLogins = totalLogins - successfulLogins;
    const uniqueIpAddresses = new Set(sessions?.map((s) => s.ip_address).filter(Boolean)).size;
    const uniqueDevices = new Set(sessions?.map((s) => JSON.stringify(s.device_info)).filter(Boolean)).size;

    const suspiciousEvents = changeLogs?.filter((l) => l.is_suspicious).length || 0;
    const avgRiskScore =
      changeLogs && changeLogs.length > 0
        ? changeLogs.reduce((sum, l) => sum + (l.risk_score || 0), 0) / changeLogs.length
        : 0;
    const mfaSessions = sessions?.filter((s) => s.mfa_verified).length || 0;
    const mfaUsageRate = totalSessions > 0 ? mfaSessions / totalSessions : 0;

    // Top event types
    const eventTypeMap = new Map<EventType, number>();
    changeLogs?.forEach((l) => {
      const count = eventTypeMap.get(l.event_type as EventType) || 0;
      eventTypeMap.set(l.event_type as EventType, count + 1);
    });
    const topEventTypes = Array.from(eventTypeMap.entries())
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top resource types
    const resourceTypeMap = new Map<ResourceType, number>();
    changeLogs?.forEach((l) => {
      const count = resourceTypeMap.get(l.resource_type as ResourceType) || 0;
      resourceTypeMap.set(l.resource_type as ResourceType, count + 1);
    });
    const topResourceTypes = Array.from(resourceTypeMap.entries())
      .map(([resourceType, count]) => ({ resourceType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Activity by hour (0-23)
    const activityByHour = new Array(24).fill(0).map((_, hour) => ({ hour, count: 0 }));
    changeLogs?.forEach((l) => {
      const hour = new Date(l.created_at).getHours();
      activityByHour[hour].count++;
    });

    // Activity by day
    const dayMap = new Map<string, number>();
    changeLogs?.forEach((l) => {
      const date = new Date(l.created_at).toISOString().split('T')[0];
      dayMap.set(date, (dayMap.get(date) || 0) + 1);
    });
    const activityByDay = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      userId,
      userEmail: user?.email || '',
      period: { start: dateFrom, end: dateTo },
      totalSessions,
      totalDuration,
      avgSessionDuration,
      totalActions,
      totalPageViews,
      totalLogins,
      successfulLogins,
      failedLogins,
      uniqueIpAddresses,
      uniqueDevices,
      suspiciousEvents,
      avgRiskScore,
      mfaUsageRate,
      topEventTypes,
      topResourceTypes,
      activityByHour,
      activityByDay,
    };
  }

  async getOrganizationActivityMetrics(
    organizationId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<OrganizationActivityMetrics> {
    // Fetch all data
    const { data: users } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('organization_id', organizationId);

    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('started_at', dateFrom)
      .lte('started_at', dateTo);

    const { data: changeLogs } = await supabase
      .from('change_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo);

    const { data: logins } = await supabase
      .from('login_history')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo);

    // Calculate metrics
    const totalUsers = users?.length || 0;
    const activeUsers = new Set(sessions?.map((s) => s.user_id)).size;
    const totalEvents = changeLogs?.length || 0;
    const totalSessions = sessions?.length || 0;

    const suspiciousEvents = changeLogs?.filter((l) => l.is_suspicious).length || 0;
    const avgRiskScore =
      changeLogs && changeLogs.length > 0
        ? changeLogs.reduce((sum, l) => sum + (l.risk_score || 0), 0) / changeLogs.length
        : 0;

    const totalLogins = logins?.length || 0;
    const failedLogins = logins?.filter((l) => !l.success).length || 0;
    const failedLoginRate = totalLogins > 0 ? failedLogins / totalLogins : 0;

    // Top users by activity
    const userActivityMap = new Map<string, { email: string; actions: number; risk: number[] }>();
    changeLogs?.forEach((l) => {
      if (!l.user_id) return;
      const current = userActivityMap.get(l.user_id) || { email: l.user_email || '', actions: 0, risk: [] };
      current.actions++;
      if (l.risk_score) current.risk.push(l.risk_score);
      userActivityMap.set(l.user_id, current);
    });

    const topUsers = Array.from(userActivityMap.entries())
      .map(([userId, data]) => ({
        userId,
        userEmail: data.email,
        actionsCount: data.actions,
        riskScore: data.risk.length > 0 ? data.risk.reduce((a, b) => a + b, 0) / data.risk.length : 0,
      }))
      .sort((a, b) => b.actionsCount - a.actionsCount)
      .slice(0, 10);

    // Events by type
    const eventTypeMap = new Map<EventType, number>();
    changeLogs?.forEach((l) => {
      eventTypeMap.set(l.event_type as EventType, (eventTypeMap.get(l.event_type as EventType) || 0) + 1);
    });
    const eventsByType = Array.from(eventTypeMap.entries())
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count);

    // Events by resource
    const resourceTypeMap = new Map<ResourceType, number>();
    changeLogs?.forEach((l) => {
      resourceTypeMap.set(l.resource_type as ResourceType, (resourceTypeMap.get(l.resource_type as ResourceType) || 0) + 1);
    });
    const eventsByResource = Array.from(resourceTypeMap.entries())
      .map(([resourceType, count]) => ({ resourceType, count }))
      .sort((a, b) => b.count - a.count);

    // Activity trend
    const dayMap = new Map<string, number>();
    changeLogs?.forEach((l) => {
      const date = new Date(l.created_at).toISOString().split('T')[0];
      dayMap.set(date, (dayMap.get(date) || 0) + 1);
    });
    const activityTrend = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Risk trend
    const riskDayMap = new Map<string, number[]>();
    changeLogs?.forEach((l) => {
      if (!l.risk_score) return;
      const date = new Date(l.created_at).toISOString().split('T')[0];
      const risks = riskDayMap.get(date) || [];
      risks.push(l.risk_score);
      riskDayMap.set(date, risks);
    });
    const riskTrend = Array.from(riskDayMap.entries())
      .map(([date, risks]) => ({
        date,
        avgRisk: risks.reduce((a, b) => a + b, 0) / risks.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      organizationId,
      period: { start: dateFrom, end: dateTo },
      totalUsers,
      activeUsers,
      totalEvents,
      totalSessions,
      suspiciousEvents,
      avgRiskScore,
      failedLoginRate,
      topUsers,
      eventsByType,
      eventsByResource,
      activityTrend,
      riskTrend,
    };
  }

  // ============================================================================
  // Timeline
  // ============================================================================

  async getActivityTimeline(
    organizationId: string,
    filters: ChangeLogFilters
  ): Promise<TimelineEvent[]> {
    const logs = await this.getChangeLogs({
      ...filters,
      organizationId,
    });

    return logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt,
      eventType: log.eventType,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      userId: log.userId,
      userEmail: log.userEmail,
      userRole: log.userRole,
      description: log.description || this.formatEventDescription(log),
      metadata: log.metadata,
      isSuspicious: log.isSuspicious,
      riskScore: log.riskScore,
    }));
  }

  // ============================================================================
  // Forensic Search
  // ============================================================================

  async searchForensic(query: ForensicSearchQuery): Promise<ForensicSearchResult> {
    const { organizationId, filters } = query;

    // Fetch change logs
    const events = await this.getChangeLogs({
      organizationId,
      eventType: filters.eventTypes,
      resourceType: filters.resourceTypes,
      userId: filters.userIds?.[0],
      dateFrom: filters.dateRange.start,
      dateTo: filters.dateRange.end,
      minRiskScore: filters.minRiskScore,
      isSuspicious: filters.onlySuspicious,
    });

    // Fetch related sessions
    const sessionIds = [...new Set(events.map((e) => e.sessionId).filter(Boolean))] as string[];
    const sessions = sessionIds.length > 0
      ? await this.getSessions({
          organizationId,
          dateFrom: filters.dateRange.start,
          dateTo: filters.dateRange.end,
        })
      : [];

    // Fetch login history
    const logins = await this.getLoginHistory({
      organizationId,
      userId: filters.userIds?.[0],
      dateFrom: filters.dateRange.start,
      dateTo: filters.dateRange.end,
      minRiskScore: filters.minRiskScore,
      isSuspicious: filters.onlySuspicious,
    });

    // Group by correlation ID
    const correlatedEvents = new Map<string, ChangeLog[]>();
    events.forEach((event) => {
      if (event.correlationId) {
        const group = correlatedEvents.get(event.correlationId) || [];
        group.push(event);
        correlatedEvents.set(event.correlationId, group);
      }
    });

    // Create timeline
    const timeline = events.map((log) => ({
      id: log.id,
      timestamp: log.createdAt,
      eventType: log.eventType,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      userId: log.userId,
      userEmail: log.userEmail,
      userRole: log.userRole,
      description: log.description || this.formatEventDescription(log),
      metadata: log.metadata,
      isSuspicious: log.isSuspicious,
      riskScore: log.riskScore,
    }));

    // Detect suspicious patterns
    const suspiciousPatterns = await this.detectSuspiciousPatterns(
      organizationId,
      filters.dateRange.start,
      filters.dateRange.end
    );

    return {
      events,
      sessions: sessions.filter((s) => sessionIds.includes(s.id)),
      logins,
      totalResults: events.length,
      correlatedEvents,
      timeline,
      suspiciousPatterns,
    };
  }

  async detectSuspiciousPatterns(
    organizationId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<ForensicSearchResult['suspiciousPatterns']> {
    const patterns: ForensicSearchResult['suspiciousPatterns'] = [];

    // Get all change logs for the period
    const logs = await this.getChangeLogs({
      organizationId,
      dateFrom,
      dateTo,
    });

    // Pattern 1: Multiple failed logins
    const failedLogins = logs.filter((l) => l.eventType === 'login_failed');
    const userFailedLogins = new Map<string, string[]>();
    failedLogins.forEach((l) => {
      if (!l.userId) return;
      const events = userFailedLogins.get(l.userId) || [];
      events.push(l.id);
      userFailedLogins.set(l.userId, events);
    });

    userFailedLogins.forEach((eventIds, userId) => {
      if (eventIds.length >= 3) {
        patterns.push({
          type: 'multiple_failed_logins',
          description: `Usuário ${userId} teve ${eventIds.length} tentativas de login falhadas`,
          relatedEvents: eventIds,
          riskScore: Math.min(50 + eventIds.length * 10, 100),
        });
      }
    });

    // Pattern 2: IP address changes
    const userIpChanges = new Map<string, Set<string>>();
    logs.forEach((l) => {
      if (!l.userId || !l.ipAddress) return;
      const ips = userIpChanges.get(l.userId) || new Set();
      ips.add(l.ipAddress);
      userIpChanges.set(l.userId, ips);
    });

    userIpChanges.forEach((ips, userId) => {
      if (ips.size > 3) {
        const relatedEvents = logs.filter((l) => l.userId === userId).map((l) => l.id);
        patterns.push({
          type: 'ip_change',
          description: `Usuário ${userId} acessou de ${ips.size} endereços IP diferentes`,
          relatedEvents,
          riskScore: Math.min(40 + ips.size * 5, 80),
        });
      }
    });

    // Pattern 3: Unusual hours (0-6 AM)
    const unusualHourEvents = logs.filter((l) => {
      const hour = new Date(l.createdAt).getHours();
      return hour >= 0 && hour < 6;
    });

    if (unusualHourEvents.length > 5) {
      patterns.push({
        type: 'unusual_hours',
        description: `${unusualHourEvents.length} eventos detectados em horário incomum (0h-6h)`,
        relatedEvents: unusualHourEvents.map((e) => e.id),
        riskScore: 30,
      });
    }

    // Pattern 4: Privilege escalation
    const permissionChanges = logs.filter((l) => l.eventType === 'permission_change');
    if (permissionChanges.length > 0) {
      patterns.push({
        type: 'privilege_escalation',
        description: `${permissionChanges.length} mudanças de permissão detectadas`,
        relatedEvents: permissionChanges.map((e) => e.id),
        riskScore: 60,
      });
    }

    return patterns.sort((a, b) => b.riskScore - a.riskScore);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private mapChangeLog(data: any): ChangeLog {
    return {
      id: data.id,
      organizationId: data.organization_id,
      eventType: data.event_type,
      resourceType: data.resource_type,
      resourceId: data.resource_id,
      userId: data.user_id,
      userEmail: data.user_email,
      userRole: data.user_role,
      sessionId: data.session_id,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      geolocation: data.geolocation,
      deviceInfo: data.device_info,
      beforeState: data.before_state,
      afterState: data.after_state,
      changedFields: data.changed_fields,
      metadata: data.metadata,
      description: data.description,
      correlationId: data.correlation_id,
      parentEventId: data.parent_event_id,
      riskScore: data.risk_score,
      isSuspicious: data.is_suspicious,
      createdAt: data.created_at,
    };
  }

  private mapUserSession(data: any): UserSession {
    return {
      id: data.id,
      userId: data.user_id,
      organizationId: data.organization_id,
      startedAt: data.started_at,
      lastActivityAt: data.last_activity_at,
      endedAt: data.ended_at,
      durationSeconds: data.duration_seconds,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      geolocation: data.geolocation,
      deviceInfo: data.device_info,
      authMethod: data.auth_method,
      mfaVerified: data.mfa_verified,
      mfaMethod: data.mfa_method,
      pageViews: data.page_views,
      actionsCount: data.actions_count,
      lastPageUrl: data.last_page_url,
      isActive: data.is_active,
      terminatedBy: data.terminated_by,
      terminationReason: data.termination_reason,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapLoginHistory(data: any): LoginHistory {
    return {
      id: data.id,
      userId: data.user_id,
      organizationId: data.organization_id,
      email: data.email,
      success: data.success,
      failureReason: data.failure_reason,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      geolocation: data.geolocation,
      mfaRequired: data.mfa_required,
      mfaSuccess: data.mfa_success,
      isSuspicious: data.is_suspicious,
      riskScore: data.risk_score,
      sessionId: data.session_id,
      createdAt: data.created_at,
    };
  }

  private formatEventDescription(log: ChangeLog): string {
    const action = this.getEventAction(log.eventType);
    const resource = this.getResourceName(log.resourceType);
    return `${action} ${resource}`;
  }

  private getEventAction(eventType: EventType): string {
    const actions: Record<EventType, string> = {
      create: 'Criou',
      update: 'Atualizou',
      delete: 'Excluiu',
      login: 'Fez login',
      logout: 'Fez logout',
      login_failed: 'Falha no login',
      password_reset: 'Redefiniu senha',
      permission_change: 'Alterou permissões',
      export: 'Exportou',
      import: 'Importou',
      access_denied: 'Acesso negado',
      suspicious_activity: 'Atividade suspeita',
    };
    return actions[eventType] || eventType;
  }

  private getResourceName(resourceType: ResourceType): string {
    const names: Record<ResourceType, string> = {
      assessment: 'avaliação',
      framework: 'framework',
      control: 'controle',
      evidence: 'evidência',
      user: 'usuário',
      organization: 'organização',
      role: 'papel',
      setting: 'configuração',
      report: 'relatório',
      integration: 'integração',
    };
    return names[resourceType] || resourceType;
  }
}

// Singleton instance
export const auditLogService = new AuditLogService();

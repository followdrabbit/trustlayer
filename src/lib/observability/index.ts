/**
 * Observability Module for TrustLayer
 *
 * Centralized exports for telemetry, metrics, logging, health checks, and Prometheus.
 */

// Telemetry (OpenTelemetry)
export {
  initializeTelemetry,
  getTracer,
  getMeter,
  shutdownTelemetry,
  startSpan,
  traceAsync,
  traceSync,
  recordMetric,
  createHistogram,
  createUpDownCounter,
} from './telemetry';

export type { TelemetryConfig } from './telemetry';

// Metrics
export {
  initializeMetrics,
  initializeSLOMetrics,
  recordAssessmentCompletion,
  trackActiveUser,
  recordDashboardLoad,
  recordAIAssistantLatency,
  recordVoiceCommand,
  recordLoginAttempt,
  usePageViewTracking,
  useRenderTracking,
} from './metrics';

// Logging
export {
  LogLevel,
  initializeLogger,
  getLogger,
  shutdownLogger,
  useLogger,
  logErrorBoundary,
  logHttpRequest,
  logPerformance,
  logAuditEvent,
} from './logging';

export type {
  LogContext,
  LogEntry,
  LoggerConfig,
} from './logging';

// Health Checks
export {
  HealthStatus,
  getHealthCheckManager,
  useHealthStatus,
  healthEndpoint,
  readinessEndpoint,
  livenessEndpoint,
} from './health-checks';

export type {
  HealthCheckResult,
  OverallHealth,
  HealthCheckFunction,
} from './health-checks';

// Prometheus
export {
  getPrometheusRegistry,
  prometheusMetricsEndpoint,
  recordHttpRequest as recordPrometheusHttpRequest,
  recordAssessmentCompletion as recordPrometheusAssessment,
  recordDashboardView,
  recordError,
  recordDatabaseQuery,
  trackActiveUsers,
  trackActiveSessions,
  usePrometheusTracking,
} from './prometheus';

export type {
  PrometheusMetric,
  PrometheusHistogram,
  PrometheusHistogramBucket,
} from './prometheus';

/**
 * Initialize all observability systems
 */
export function initializeObservability(config?: {
  telemetry?: {
    enabled: boolean;
    serviceName: string;
    serviceVersion: string;
    environment: string;
    collectorUrl: string;
    tracingSampleRate?: number;
  };
  logger?: {
    minLevel?: any;
    enableConsole?: boolean;
    enableRemote?: boolean;
    remoteEndpoint?: string;
  };
}) {
  // Initialize telemetry
  if (config?.telemetry?.enabled) {
    const { initializeTelemetry } = require('./telemetry');
    initializeTelemetry(config.telemetry);
  }

  // Initialize logger
  const { initializeLogger } = require('./logging');
  initializeLogger(config?.logger);

  // Initialize custom metrics
  const { initializeMetrics, initializeSLOMetrics } = require('./metrics');
  initializeMetrics();
  initializeSLOMetrics();

  // Initialize health checks
  const { getHealthCheckManager } = require('./health-checks');
  getHealthCheckManager();

  // Initialize Prometheus registry
  const { getPrometheusRegistry } = require('./prometheus');
  getPrometheusRegistry();

  console.log('✅ Observability systems initialized');
}

/**
 * Shutdown all observability systems
 */
export async function shutdownObservability() {
  const promises: Promise<void>[] = [];

  // Shutdown telemetry
  try {
    const { shutdownTelemetry } = require('./telemetry');
    promises.push(shutdownTelemetry());
  } catch (error) {
    console.warn('Failed to shutdown telemetry:', error);
  }

  // Shutdown logger
  try {
    const { shutdownLogger } = require('./logging');
    shutdownLogger();
  } catch (error) {
    console.warn('Failed to shutdown logger:', error);
  }

  await Promise.all(promises);
  console.log('✅ Observability systems shut down');
}

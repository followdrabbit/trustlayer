/**
 * Custom Metrics for TrustLayer
 *
 * Business-specific metrics tracked via OpenTelemetry.
 */

import { getMeter, createHistogram, createUpDownCounter } from './telemetry';

// Metric instances
let assessmentCompletionTime: ReturnType<typeof createHistogram> | null = null;
let activeUsers: ReturnType<typeof createUpDownCounter> | null = null;
let dashboardLoadTime: ReturnType<typeof createHistogram> | null = null;
let aiAssistantLatency: ReturnType<typeof createHistogram> | null = null;
let voiceCommandsProcessed: ReturnType<typeof createHistogram> | null = null;

/**
 * Initialize custom metrics
 */
export function initializeMetrics() {
  try {
    const meter = getMeter('trustlayer.business');

    // Assessment metrics
    assessmentCompletionTime = meter.createHistogram('trustlayer.assessment.completion_time', {
      description: 'Time to complete an assessment (seconds)',
      unit: 's',
    });

    // User metrics
    activeUsers = meter.createUpDownCounter('trustlayer.users.active', {
      description: 'Number of currently active users',
    });

    // Dashboard metrics
    dashboardLoadTime = meter.createHistogram('trustlayer.dashboard.load_time', {
      description: 'Dashboard load time (milliseconds)',
      unit: 'ms',
    });

    // AI Assistant metrics
    aiAssistantLatency = meter.createHistogram('trustlayer.ai_assistant.latency', {
      description: 'AI assistant response latency (milliseconds)',
      unit: 'ms',
    });

    // Voice metrics
    voiceCommandsProcessed = meter.createHistogram('trustlayer.voice.command_processing_time', {
      description: 'Voice command processing time (milliseconds)',
      unit: 'ms',
    });

    console.log('Custom metrics initialized');
  } catch (error) {
    console.warn('Failed to initialize custom metrics:', error);
  }
}

/**
 * Record assessment completion
 */
export function recordAssessmentCompletion(
  durationSeconds: number,
  attributes?: {
    domain?: string;
    framework?: string;
    questionsAnswered?: number;
  }
) {
  assessmentCompletionTime?.record(durationSeconds, attributes);
}

/**
 * Track active user (increment on login, decrement on logout)
 */
export function trackActiveUser(action: 'login' | 'logout', attributes?: { role?: string }) {
  const delta = action === 'login' ? 1 : -1;
  activeUsers?.add(delta, attributes);
}

/**
 * Record dashboard load time
 */
export function recordDashboardLoad(
  durationMs: number,
  attributes?: {
    dashboardType?: 'executive' | 'grc' | 'specialist';
    domain?: string;
  }
) {
  dashboardLoadTime?.record(durationMs, attributes);
}

/**
 * Record AI assistant interaction
 */
export function recordAIAssistantLatency(
  latencyMs: number,
  attributes?: {
    provider?: string;
    model?: string;
    success?: boolean;
  }
) {
  aiAssistantLatency?.record(latencyMs, attributes);
}

/**
 * Record voice command processing
 */
export function recordVoiceCommand(
  processingTimeMs: number,
  attributes?: {
    command?: string;
    verified?: boolean;
  }
) {
  voiceCommandsProcessed?.record(processingTimeMs, attributes);
}

/**
 * SLO Metrics (track against defined SLOs)
 */

// SLO 1: Login Availability (target: 99.9%)
let loginAttempts: ReturnType<typeof getMeter>['createCounter'] | null = null;
let loginSuccesses: ReturnType<typeof getMeter>['createCounter'] | null = null;

export function initializeSLOMetrics() {
  try {
    const meter = getMeter('trustlayer.slo');

    loginAttempts = meter.createCounter('trustlayer.slo.login.attempts', {
      description: 'Total login attempts',
    });

    loginSuccesses = meter.createCounter('trustlayer.slo.login.successes', {
      description: 'Successful login attempts',
    });

    console.log('SLO metrics initialized');
  } catch (error) {
    console.warn('Failed to initialize SLO metrics:', error);
  }
}

export function recordLoginAttempt(success: boolean, attributes?: { method?: string }) {
  loginAttempts?.add(1, attributes);
  if (success) {
    loginSuccesses?.add(1, attributes);
  }
}

/**
 * React Hook: Track page view duration
 */
export function usePageViewTracking(pageName: string) {
  const startTime = Date.now();

  return () => {
    const duration = Date.now() - startTime;
    const meter = getMeter('trustlayer.pages');
    const histogram = meter.createHistogram('trustlayer.page.view_duration', {
      description: 'Page view duration (milliseconds)',
      unit: 'ms',
    });
    histogram.record(duration, { page: pageName });
  };
}

/**
 * React Hook: Track component render time
 */
export function useRenderTracking(componentName: string) {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    const meter = getMeter('trustlayer.components');
    const histogram = meter.createHistogram('trustlayer.component.render_time', {
      description: 'Component render time (milliseconds)',
      unit: 'ms',
    });
    histogram.record(duration, { component: componentName });
  };
}

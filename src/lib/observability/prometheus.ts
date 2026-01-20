/**
 * Prometheus Metrics Exporter for TrustLayer
 *
 * Exports metrics in Prometheus text format for scraping.
 * Provides an HTTP endpoint that Prometheus can poll.
 */

export interface PrometheusMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

export interface PrometheusHistogramBucket {
  le: number | string;
  count: number;
}

export interface PrometheusHistogram extends Omit<PrometheusMetric, 'value'> {
  type: 'histogram';
  buckets: PrometheusHistogramBucket[];
  sum: number;
  count: number;
}

class PrometheusRegistry {
  private metrics: Map<string, PrometheusMetric | PrometheusHistogram> = new Map();
  private prefix: string = 'trustlayer_';

  /**
   * Register a counter metric
   */
  registerCounter(name: string, help: string, labels?: Record<string, string>) {
    const fullName = this.prefix + name;
    this.metrics.set(fullName, {
      name: fullName,
      type: 'counter',
      help,
      value: 0,
      labels,
    });
  }

  /**
   * Register a gauge metric
   */
  registerGauge(name: string, help: string, labels?: Record<string, string>) {
    const fullName = this.prefix + name;
    this.metrics.set(fullName, {
      name: fullName,
      type: 'gauge',
      help,
      value: 0,
      labels,
    });
  }

  /**
   * Register a histogram metric
   */
  registerHistogram(name: string, help: string, buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]) {
    const fullName = this.prefix + name;
    this.metrics.set(fullName, {
      name: fullName,
      type: 'histogram',
      help,
      buckets: buckets.map(le => ({ le, count: 0 })).concat([{ le: '+Inf', count: 0 }]),
      sum: 0,
      count: 0,
    } as PrometheusHistogram);
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>) {
    const fullName = this.prefix + name;
    const metric = this.metrics.get(fullName);

    if (metric && metric.type === 'counter') {
      metric.value += value;
      if (labels) {
        metric.labels = { ...metric.labels, ...labels };
      }
      metric.timestamp = Date.now();
    }
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const fullName = this.prefix + name;
    const metric = this.metrics.get(fullName);

    if (metric && metric.type === 'gauge') {
      metric.value = value;
      if (labels) {
        metric.labels = { ...metric.labels, ...labels };
      }
      metric.timestamp = Date.now();
    }
  }

  /**
   * Increment a gauge
   */
  incrementGauge(name: string, value: number = 1, labels?: Record<string, string>) {
    const fullName = this.prefix + name;
    const metric = this.metrics.get(fullName);

    if (metric && metric.type === 'gauge') {
      metric.value += value;
      if (labels) {
        metric.labels = { ...metric.labels, ...labels };
      }
      metric.timestamp = Date.now();
    }
  }

  /**
   * Decrement a gauge
   */
  decrementGauge(name: string, value: number = 1, labels?: Record<string, string>) {
    this.incrementGauge(name, -value, labels);
  }

  /**
   * Observe a histogram value
   */
  observeHistogram(name: string, value: number, labels?: Record<string, string>) {
    const fullName = this.prefix + name;
    const metric = this.metrics.get(fullName);

    if (metric && metric.type === 'histogram') {
      const histogram = metric as PrometheusHistogram;

      // Update buckets
      for (const bucket of histogram.buckets) {
        if (bucket.le === '+Inf' || value <= (bucket.le as number)) {
          bucket.count++;
        }
      }

      // Update sum and count
      histogram.sum += value;
      histogram.count++;

      if (labels) {
        // Note: In Prometheus, labels should be set at registration time
        // This is a simplified implementation
      }
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): (PrometheusMetric | PrometheusHistogram)[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Export metrics in Prometheus text format
   */
  export(): string {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {
      // HELP line
      lines.push(`# HELP ${metric.name} ${metric.help}`);

      // TYPE line
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      if (metric.type === 'histogram') {
        const histogram = metric as PrometheusHistogram;

        // Bucket lines
        for (const bucket of histogram.buckets) {
          const labels = this.formatLabels({ le: bucket.le.toString() });
          lines.push(`${metric.name}_bucket${labels} ${bucket.count}`);
        }

        // Sum line
        lines.push(`${metric.name}_sum ${histogram.sum}`);

        // Count line
        lines.push(`${metric.name}_count ${histogram.count}`);
      } else {
        // Simple metric (counter, gauge)
        const labels = metric.labels ? this.formatLabels(metric.labels) : '';
        const timestamp = metric.timestamp ? ` ${metric.timestamp}` : '';
        lines.push(`${metric.name}${labels} ${metric.value}${timestamp}`);
      }

      // Empty line between metrics
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Format labels for Prometheus
   */
  private formatLabels(labels: Record<string, string>): string {
    if (Object.keys(labels).length === 0) {
      return '';
    }

    const pairs = Object.entries(labels).map(
      ([key, value]) => `${key}="${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    );

    return `{${pairs.join(',')}}`;
  }

  /**
   * Reset all metrics
   */
  reset() {
    for (const metric of this.metrics.values()) {
      if (metric.type === 'histogram') {
        const histogram = metric as PrometheusHistogram;
        histogram.buckets.forEach(b => b.count = 0);
        histogram.sum = 0;
        histogram.count = 0;
      } else {
        metric.value = 0;
      }
    }
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }
}

// Singleton instance
let prometheusRegistry: PrometheusRegistry | null = null;

/**
 * Get Prometheus registry instance
 */
export function getPrometheusRegistry(): PrometheusRegistry {
  if (!prometheusRegistry) {
    prometheusRegistry = new PrometheusRegistry();
    registerDefaultPrometheusMetrics();
  }
  return prometheusRegistry;
}

/**
 * Register default Prometheus metrics
 */
function registerDefaultPrometheusMetrics() {
  const registry = prometheusRegistry!;

  // HTTP metrics
  registry.registerCounter('http_requests_total', 'Total HTTP requests', { method: '', path: '', status: '' });
  registry.registerHistogram('http_request_duration_seconds', 'HTTP request duration in seconds');

  // Application metrics
  registry.registerGauge('active_users', 'Number of active users');
  registry.registerGauge('active_sessions', 'Number of active sessions');

  // Assessment metrics
  registry.registerCounter('assessments_completed_total', 'Total assessments completed', { domain: '' });
  registry.registerHistogram('assessment_completion_time_seconds', 'Assessment completion time in seconds');

  // Dashboard metrics
  registry.registerCounter('dashboard_views_total', 'Total dashboard views', { type: '' });
  registry.registerHistogram('dashboard_load_time_seconds', 'Dashboard load time in seconds');

  // Error metrics
  registry.registerCounter('errors_total', 'Total errors', { type: '', severity: '' });

  // Database metrics
  registry.registerCounter('database_queries_total', 'Total database queries', { operation: '' });
  registry.registerHistogram('database_query_duration_seconds', 'Database query duration in seconds');

  // Cache metrics
  registry.registerCounter('cache_hits_total', 'Total cache hits');
  registry.registerCounter('cache_misses_total', 'Total cache misses');

  // AI Assistant metrics
  registry.registerCounter('ai_assistant_requests_total', 'Total AI assistant requests', { model: '' });
  registry.registerHistogram('ai_assistant_latency_seconds', 'AI assistant latency in seconds');

  // Voice Command metrics
  registry.registerCounter('voice_commands_total', 'Total voice commands processed', { verified: '' });
  registry.registerHistogram('voice_command_processing_time_seconds', 'Voice command processing time in seconds');
}

/**
 * Export Prometheus metrics endpoint
 */
export async function prometheusMetricsEndpoint(): Promise<Response> {
  const registry = getPrometheusRegistry();
  const metrics = registry.export();

  return new Response(metrics, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * Helper: Record HTTP request
 */
export function recordHttpRequest(
  method: string,
  path: string,
  statusCode: number,
  durationSeconds: number
) {
  const registry = getPrometheusRegistry();

  registry.incrementCounter('http_requests_total', 1, {
    method,
    path,
    status: statusCode.toString(),
  });

  registry.observeHistogram('http_request_duration_seconds', durationSeconds);
}

/**
 * Helper: Record assessment completion
 */
export function recordAssessmentCompletion(domain: string, durationSeconds: number) {
  const registry = getPrometheusRegistry();

  registry.incrementCounter('assessments_completed_total', 1, { domain });
  registry.observeHistogram('assessment_completion_time_seconds', durationSeconds);
}

/**
 * Helper: Record dashboard view
 */
export function recordDashboardView(type: string, loadTimeSeconds: number) {
  const registry = getPrometheusRegistry();

  registry.incrementCounter('dashboard_views_total', 1, { type });
  registry.observeHistogram('dashboard_load_time_seconds', loadTimeSeconds);
}

/**
 * Helper: Record error
 */
export function recordError(type: string, severity: string) {
  const registry = getPrometheusRegistry();
  registry.incrementCounter('errors_total', 1, { type, severity });
}

/**
 * Helper: Record database query
 */
export function recordDatabaseQuery(operation: string, durationSeconds: number) {
  const registry = getPrometheusRegistry();

  registry.incrementCounter('database_queries_total', 1, { operation });
  registry.observeHistogram('database_query_duration_seconds', durationSeconds);
}

/**
 * Helper: Track active users
 */
export function trackActiveUsers(count: number) {
  const registry = getPrometheusRegistry();
  registry.setGauge('active_users', count);
}

/**
 * Helper: Track active sessions
 */
export function trackActiveSessions(count: number) {
  const registry = getPrometheusRegistry();
  registry.setGauge('active_sessions', count);
}

/**
 * React Hook: Auto-track component renders in Prometheus
 */
export function usePrometheusTracking(componentName: string) {
  const { useEffect } = require('react');

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const duration = (performance.now() - startTime) / 1000; // Convert to seconds
      const registry = getPrometheusRegistry();

      registry.observeHistogram('component_render_time_seconds', duration);
    };
  }, [componentName]);
}

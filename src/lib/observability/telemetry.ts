/**
 * OpenTelemetry Instrumentation for TrustLayer
 *
 * Configures tracing, metrics, and logs export to OTLP collector.
 */

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { ZoneContextManager } from '@opentelemetry/context-zone';

interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  collectorUrl: string;
  tracingSampleRate?: number;
  enabled?: boolean;
}

let tracerProvider: WebTracerProvider | null = null;
let meterProvider: MeterProvider | null = null;

/**
 * Initialize OpenTelemetry instrumentation
 */
export function initializeTelemetry(config: TelemetryConfig) {
  if (!config.enabled) {
    console.log('OpenTelemetry is disabled');
    return;
  }

  console.log('Initializing OpenTelemetry...', config);

  // Create resource with service metadata
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
  });

  // Initialize Tracing
  initializeTracing(resource, config);

  // Initialize Metrics
  initializeMetrics(resource, config);

  // Register auto-instrumentations
  registerInstrumentations({
    instrumentations: [
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-fetch': {
          enabled: true,
          propagateTraceHeaderCorsUrls: [
            /.*/,  // Propagate to all origins
          ],
          clearTimingResources: true,
        },
        '@opentelemetry/instrumentation-xml-http-request': {
          enabled: true,
          propagateTraceHeaderCorsUrls: [
            /.*/,
          ],
        },
        '@opentelemetry/instrumentation-document-load': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-user-interaction': {
          enabled: true,
          eventNames: ['click', 'submit', 'keypress'],
        },
      }),
    ],
  });

  console.log('OpenTelemetry initialized successfully');
}

/**
 * Initialize tracing
 */
function initializeTracing(resource: Resource, config: TelemetryConfig) {
  // Create OTLP trace exporter
  const traceExporter = new OTLPTraceExporter({
    url: `${config.collectorUrl}/v1/traces`,
    headers: {},
  });

  // Create tracer provider
  tracerProvider = new WebTracerProvider({
    resource,
    sampler: createSampler(config.tracingSampleRate || 1.0),
  });

  // Add batch span processor
  tracerProvider.addSpanProcessor(new BatchSpanProcessor(traceExporter, {
    maxQueueSize: 100,
    maxExportBatchSize: 10,
    scheduledDelayMillis: 500,
  }));

  // Set context manager
  tracerProvider.register({
    contextManager: new ZoneContextManager(),
    propagator: new W3CTraceContextPropagator(),
  });
}

/**
 * Initialize metrics
 */
function initializeMetrics(resource: Resource, config: TelemetryConfig) {
  // Create OTLP metric exporter
  const metricExporter = new OTLPMetricExporter({
    url: `${config.collectorUrl}/v1/metrics`,
    headers: {},
  });

  // Create metric reader
  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000,  // Export every 10 seconds
  });

  // Create meter provider
  meterProvider = new MeterProvider({
    resource,
    readers: [metricReader],
  });
}

/**
 * Create sampler based on sample rate
 */
function createSampler(sampleRate: number) {
  const { ParentBasedSampler, TraceIdRatioBasedSampler } = require('@opentelemetry/sdk-trace-base');

  return new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(sampleRate),
  });
}

/**
 * Get tracer instance
 */
export function getTracer(name: string = 'trustlayer') {
  if (!tracerProvider) {
    throw new Error('Tracer provider not initialized. Call initializeTelemetry() first.');
  }
  return tracerProvider.getTracer(name);
}

/**
 * Get meter instance
 */
export function getMeter(name: string = 'trustlayer') {
  if (!meterProvider) {
    throw new Error('Meter provider not initialized. Call initializeTelemetry() first.');
  }
  return meterProvider.getMeter(name);
}

/**
 * Shutdown telemetry (for cleanup)
 */
export async function shutdownTelemetry() {
  const promises: Promise<void>[] = [];

  if (tracerProvider) {
    promises.push(tracerProvider.shutdown());
  }

  if (meterProvider) {
    promises.push(meterProvider.shutdown());
  }

  await Promise.all(promises);
  console.log('OpenTelemetry shutdown complete');
}

/**
 * Helper: Create custom span
 */
export function startSpan(name: string, attributes?: Record<string, string | number | boolean>) {
  const tracer = getTracer();
  return tracer.startSpan(name, {
    attributes,
  });
}

/**
 * Helper: Wrap async function with tracing
 */
export async function traceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: 1 });  // OK
      return result;
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' });  // ERROR
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Helper: Wrap sync function with tracing
 */
export function traceSync<T>(
  name: string,
  fn: () => T,
  attributes?: Record<string, string | number | boolean>
): T {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, { attributes }, (span) => {
    try {
      const result = fn();
      span.setStatus({ code: 1 });
      return result;
    } catch (error) {
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Helper: Record custom metric
 */
export function recordMetric(
  name: string,
  value: number,
  attributes?: Record<string, string | number | boolean>
) {
  const meter = getMeter();
  const counter = meter.createCounter(name);
  counter.add(value, attributes);
}

/**
 * Helper: Create histogram metric
 */
export function createHistogram(name: string, description?: string) {
  const meter = getMeter();
  return meter.createHistogram(name, { description });
}

/**
 * Helper: Create up/down counter
 */
export function createUpDownCounter(name: string, description?: string) {
  const meter = getMeter();
  return meter.createUpDownCounter(name, { description });
}

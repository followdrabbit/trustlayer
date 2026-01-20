/**
 * OpenTelemetry for Edge Functions (Deno)
 *
 * Provides tracing and metrics for Supabase Edge Functions.
 */

import { trace, SpanStatusCode, context, propagation } from "npm:@opentelemetry/api@1.7.0";
import { Resource } from "npm:@opentelemetry/resources@1.18.0";
import { SemanticResourceAttributes } from "npm:@opentelemetry/semantic-conventions@1.18.0";
import { NodeTracerProvider } from "npm:@opentelemetry/sdk-trace-node@1.18.0";
import { OTLPTraceExporter } from "npm:@opentelemetry/exporter-trace-otlp-http@0.45.0";
import { BatchSpanProcessor } from "npm:@opentelemetry/sdk-trace-base@1.18.0";
import { W3CTraceContextPropagator } from "npm:@opentelemetry/core@1.18.0";

let tracerProvider: NodeTracerProvider | null = null;

/**
 * Initialize OpenTelemetry for Edge Functions
 */
export function initEdgeTelemetry(functionName: string) {
  const collectorUrl = Deno.env.get('OTEL_COLLECTOR_URL') || 'http://localhost:4318';
  const environment = Deno.env.get('ENVIRONMENT') || 'development';

  // Create resource
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: `trustlayer-functions-${functionName}`,
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.2.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
  });

  // Create exporter
  const exporter = new OTLPTraceExporter({
    url: `${collectorUrl}/v1/traces`,
  });

  // Create provider
  tracerProvider = new NodeTracerProvider({
    resource,
  });

  // Add processor
  tracerProvider.addSpanProcessor(new BatchSpanProcessor(exporter));

  // Register provider
  tracerProvider.register({
    propagator: new W3CTraceContextPropagator(),
  });

  console.log(`OpenTelemetry initialized for function: ${functionName}`);
}

/**
 * Create traced handler wrapper
 */
export function tracedHandler(
  name: string,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const tracer = trace.getTracer('trustlayer-edge-functions');

    // Extract trace context from headers
    const carrier = Object.fromEntries(req.headers.entries());
    const ctx = propagation.extract(context.active(), carrier);

    return tracer.startActiveSpan(name, { kind: 1 }, ctx, async (span) => {
      try {
        // Add request attributes
        span.setAttributes({
          'http.method': req.method,
          'http.url': req.url,
          'http.user_agent': req.headers.get('user-agent') || 'unknown',
        });

        // Execute handler
        const response = await handler(req);

        // Add response attributes
        span.setAttributes({
          'http.status_code': response.status,
        });

        // Set span status
        if (response.status >= 500) {
          span.setStatus({ code: SpanStatusCode.ERROR });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        return response;
      } catch (error) {
        // Record exception
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      } finally {
        span.end();
      }
    });
  };
}

/**
 * Create child span
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = trace.getTracer('trustlayer-edge-functions');

  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Add custom attributes to current span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * Record exception in current span
 */
export function recordException(error: Error) {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}

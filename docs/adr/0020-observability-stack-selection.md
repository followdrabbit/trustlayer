# ADR 0020: Observability Stack Selection

- Status: Proposed
- Date: 2026-01-17

## Context
Enterprise deployments require logs, metrics, and traces that can run on-prem,
in Kubernetes, or in managed cloud services. The stack must support OpenTelemetry
and be vendor-neutral.

## Decision
Adopt OpenTelemetry as the standard instrumentation layer, with a default stack
based on open-source components:

- OTel Collector for ingest and export
- Prometheus for metrics
- Grafana for dashboards
- Loki for logs
- Tempo for traces

Allow optional integrations with managed equivalents (CloudWatch, Azure Monitor,
Splunk, Elastic) via OTel exporter configuration.

## Consequences
- Requires OTel instrumentation in frontend and server-side components.
- Requires standardized labels and resource attributes for correlation.
- Requires deployment manifests for the chosen stack in K8s.

## Alternatives Considered
- Cloud-specific stacks only (limits on-prem portability).
- Proprietary APM-only tools (vendor lock-in risk).

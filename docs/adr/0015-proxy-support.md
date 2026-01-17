# ADR 0015: Proxy Support

- Status: Proposed
- Date: 2026-01-17

## Context
Some enterprise environments require outbound traffic through HTTP/HTTPS proxies
or custom TLS inspection. The platform must work in proxy-restricted networks.

## Decision
Support proxy configuration for outbound services with standard environment
variables and documented TLS/CA handling. This includes AI providers, SIEM
forwarding, and update checks.

## Consequences
- Requires consistent proxy support across services.
- Requires documentation for proxy and custom CA setup.

## Alternatives Considered
- Assume direct internet access (not valid for enterprise environments).


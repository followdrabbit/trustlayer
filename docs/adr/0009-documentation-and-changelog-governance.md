# ADR 0009: Documentation and Changelog Governance

- Status: Proposed
- Date: 2026-01-17

## Context
Enterprise releases require traceability and consistent documentation. Changes
have been made without always updating README, llm.txt, and the changelog.

## Decision
Every feature, fix, or change must update the relevant docs, including README,
llm.txt, and CHANGELOG, alongside any technical documentation impacted.

## Consequences
- Increases release discipline and auditability.
- Adds minor overhead to each change.

## Alternatives Considered
- Rely on informal updates (inconsistent and hard to audit).


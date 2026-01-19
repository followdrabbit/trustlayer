# Incident Response Runbook

This runbook defines the minimum steps for incident response.

## 1) Triage
- Confirm alert validity (false positive vs. real incident).
- Identify impacted services and user scope.
- Assign an incident commander.

## 2) Containment
- Mitigate blast radius (feature flag, rate limit, isolate integration).
- Preserve logs and evidence.

## 3) Remediation
- Apply fix or rollback.
- Validate recovery using health checks and dashboards.

## 4) Communication
- Internal updates every 30-60 minutes.
- External updates per SLA/contract.

## 5) Post-Incident
- Create a postmortem within 5 business days.
- Record root cause, timeline, and follow-up actions.

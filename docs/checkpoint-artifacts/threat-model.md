# Checkpoint Artifact Submission - Threat Model

## Artifact Identification

Checkpoint Catalog Item: **Threat Model**

Primary Artifact: **GradEval360 Threat Model**

## Submitted Files

- [Threat Model](../security/threat-model.md)
- [System Architecture Diagram](../architecture.svg)
- [Auth Tables and Authentication Flow](../AUTH_TABLES_AND_FLOW.md)
- [Appointment Status Enum Reference](../status-enum.md)

## Rationale

We selected the Threat Model checkpoint because GradEval360 now handles security-sensitive workflow data across multiple roles. The system includes Okta-based authentication, Better Auth sessions, role-based access control, unit-scoped admin visibility, and evaluation records that move from expectation setting through final sign-off. At this point in the project, security analysis is directly relevant because the team has enough implementation detail to reason about real risks instead of guessing.

This checkpoint contributes to the final product and community strategy by documenting the system's most important assets, trust boundaries, threats, and mitigation priorities. It gives current and future contributors a shared security map for protecting GA evaluation data, preserving workflow integrity, and avoiding regressions in authorization behavior. It also turns security concerns into actionable backlog items, which makes the project easier to maintain beyond the current team.

## Summary of Artifact Work

The threat model documents:

- System scope and trust boundaries.
- Primary assets such as sessions, roles, evaluation records, appointment ownership, and secrets.
- Actors including GAs, mentors, admins, unauthenticated attackers, unauthorized authenticated users, and contributors.
- Existing controls already present in the codebase.
- STRIDE-based threats with impact, likelihood, current controls, and recommended mitigations.
- Highest-priority risks for role authorization, evaluation record integrity, and deployment auth configuration.
- A mitigation backlog for future development and handoff.

## Evidence of Substantive Engagement

This artifact is grounded in the actual GradEval360 codebase and documentation. It references the current architecture diagram, auth flow, appointment status model, shared schemas, route-level authorization behavior, and contributor workflow. The threat model identifies project-specific risks such as admin unit scope, direct appointment access, mutable JSONB evaluation records, Okta redirect configuration, and status-transition tampering.

## Recommended Next Steps

- Add automated authorization tests for every role and appointment action.
- Confirm whether admins without unit scope should have global access.
- Add secret scanning and dependency scanning to CI.
- Review API response shapes before deployment to reduce unnecessary data exposure.
- Document production Okta redirect URI and trusted origin requirements.

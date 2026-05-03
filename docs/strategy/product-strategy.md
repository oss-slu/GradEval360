# Product Strategy Draft

## Product

GradEval360 is a centralized performance management platform for Saint Louis University Graduate Assistants. The current product focus is the Milestone 2 annual evaluation workflow, from expectation setting through final evaluation.

## Problem

Graduate Assistant evaluation work is spread across people, units, and lifecycle stages. Mentors, GAs, and administrators need a reliable way to see what is pending, complete required actions in the right order, and preserve evaluation records without relying on scattered documents or informal reminders.

## Target Users

- Graduate Assistants who need to review expectations, add personal goals, complete self-evaluations, and acknowledge final evaluation completion.
- Mentors who need to set expectations, review GA progress, and submit mentor evaluations.
- Administrators who need visibility across units, status reporting, and final sign-off control.
- Future project teams who need a maintainable system that can evolve beyond the current milestone.

## Product Goals

- Complete the full annual evaluation workflow through `FinalEvaluated`.
- Make the next action obvious for each role based on appointment status.
- Preserve role-specific evaluation data in a structured and reviewable format.
- Give administrators a clear operational view of pending and completed appointments.
- Keep shared schemas, workflow logic, and tests stable enough for future contributors.

## Current Scope

The current implementation supports:

- Role-scoped appointment lists for GAs, mentors, and admins.
- Status-based workflow progression:
  `AwaitingExpectationSetting -> ExpectationSet -> AwaitingSelfEvaluation -> SelfEvaluationCompleted -> MentorEvaluationCompleted -> AwaitingSignOff -> FinalEvaluated`
- Mentor expectation setting with goals, responsibilities, hours, job category, expected outputs, and meeting date.
- GA acknowledgment with personal goal additions.
- GA self-evaluation.
- Mentor evaluation.
- Admin sign-off preparation and final acknowledgment.
- Dashboard summary data for completion and pending work.

## Strategic Decisions

- Use a status-driven workflow so each actor only sees actions that match the current stage.
- Keep validation rules in shared Zod schemas so client and server contracts stay aligned.
- Use role-based access checks to protect appointment records by GA, mentor, and unit.
- Store flexible evaluation payloads in JSONB while keeping appointment ownership and status as structured database fields.
- Keep workflow transformation logic in testable route logic helpers instead of burying all behavior inside Express handlers.

## Near-Term Roadmap

- Strengthen the appointment detail experience with clearer review states and role-specific summaries.
- Expand automated coverage for full workflow transitions and API behavior.
- Improve admin reporting for unit-level progress, blocked appointments, and completion percentage.
- Add curated contributor issues for documentation, tests, and small UI improvements.
- Validate the evaluation flow with representative GAs, mentors, and administrators.

## Risks and Open Questions

- The workflow needs user validation to confirm that the sequence matches real evaluation practices.
- JSONB payloads give flexibility, but future reporting needs may require more structured fields.
- Authentication and role mapping must remain reliable before broader deployment.
- Admin sign-off requirements may differ across units and should be confirmed with stakeholders.
- The team needs clear handoff documentation so future contributors can extend the workflow without breaking status transitions.

## Success Measures

- A seeded appointment can move through every status to `FinalEvaluated`.
- Users can identify their next required action without external instructions.
- Admins can see completion progress and pending items by role scope.
- New contributors can set up the project and make a focused PR using existing docs and templates.
- Future work can extend the workflow without duplicating validation or status logic.

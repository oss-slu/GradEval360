# Appointment Status Enum Reference

This document describes the Milestone 2 annual evaluation workflow as implemented in:

- [server/src/db/schema.ts](../server/src/db/schema.ts)
- [server/src/routes/appointments.ts](../server/src/routes/appointments.ts)
- [client/src/pages/appointment-details.tsx](../client/src/pages/appointment-details.tsx)

The appointment details page is the primary action surface for every actor after appointment creation.

## Status Flow

1. **AwaitingExpectationSetting**
   Displayed when: Appointment is created and mentor has not submitted expectations.
   Primary actor: Mentor
   Action to advance: Mentor submits expectations and acknowledges the work plan.
   Required data:
   - `expectationData.goals`
   - `expectationData.responsibilities`
   - `expectationData.weeklyHours`
   - `expectationData.jobCategory`
   - `expectationData.expectedOutputs`
   - `expectationData.expectationsMeetingDate`
   - `expectationData.mentorAcknowledged = true`
   - `expectationData.mentorAcknowledgedAt`
   Next status: `ExpectationSet`

2. **ExpectationSet**
   Displayed when: Mentor expectations are saved and awaiting GA acknowledgment.
   Primary actor: GA
   Action to advance: GA reviews the plan and adds 1 to 3 personal goals.
   Required data:
   - `expectationData.gaAcknowledged = true`
   - `expectationData.gaAcknowledgedAt`
   Next status: `AwaitingSelfEvaluation`

3. **AwaitingSelfEvaluation**
   Displayed when: GA has acknowledged expectations and self-evaluation is pending.
   Primary actor: GA
   Action to advance: GA submits self-evaluation.
   Required data:
   - `selfEvaluationData.goalProgress`
   - `selfEvaluationData.strengths`
   - `selfEvaluationData.challenges`
   - Optional: `selfEvaluationData.additionalComments`
   Next status: `SelfEvaluationCompleted`

4. **SelfEvaluationCompleted**
   Displayed when: GA self-evaluation is complete and mentor evaluation can begin.
   Primary actor: Mentor
   Action to advance: Mentor completes evaluation.
   Required data to move forward: none yet, but mentor evaluation is now enabled.
   Next status: `MentorEvaluationCompleted`

5. **AwaitingMentorEvaluation**
   Displayed when: A record is explicitly parked for mentor completion.
   Primary actor: Mentor
   Action to advance: Mentor completes evaluation from the appointment details page.
   Required data:
   - `mentorEvaluationData.ratings`
   - `mentorEvaluationData.narrative`
   - `mentorEvaluationData.overallSummary`
   - `mentorEvaluationData.finalMeetingDate`
   Next status: `MentorEvaluationCompleted`

6. **MentorEvaluationCompleted**
   Displayed when: Mentor evaluation is submitted and admin review is next.
   Primary actor: Admin
   Action to advance: Admin prepares final sign-off.
   Required data:
   - `mentorEvaluationData.signOffDecision`
   - `mentorEvaluationData.signOffNotes`
   - `mentorEvaluationData.signOffPreparedAt`
   - `mentorEvaluationData.signOffPreparedBy`
   Next status: `AwaitingSignOff`

7. **AwaitingSignOff**
   Displayed when: Admin sign-off notes are prepared and final acknowledgment is pending.
   Primary actor: Admin
   Action to advance: Admin confirms final acknowledgment.
   Required data:
   - `mentorEvaluationData.finalAcknowledged = true`
   - `mentorEvaluationData.finalAcknowledgedAt`
   - `mentorEvaluationData.finalAcknowledgedBy`
   Next status: `FinalEvaluated`

8. **FinalEvaluated**
   Displayed when: Evaluation cycle is fully complete.
   Primary actor: System / read-only
   Action to advance: none
   Required data: expectation, self-evaluation, mentor evaluation, and sign-off data should all be present.

## Actor Ownership Summary

- Mentor owns:
  - expectation setting
  - mentor evaluation
- GA owns:
  - expectation acknowledgment
  - self-evaluation
- Admin owns:
  - sign-off preparation
  - final acknowledgment

## Reporting Notes

The dashboard summary and appointments list reflect this same status model:

- appointments by status
- completion progress toward `FinalEvaluated`
- pending / incomplete items within the signed-in user’s role scope

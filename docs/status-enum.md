# Appointment Status Enum Reference

This document describes the current appointment status workflow as implemented in
`/Users/premkiran/OSS/GradEval360/server/src/db/schema.ts`. It maps each status to:
what the UI should display, who acts, what action advances the status, and which
data is required at that stage.

## Status Flow

1. **AwaitingExpectationSetting**
   Displayed when: Appointment is created and mentor has not submitted expectations.
   Primary actor: Mentor
   Action to advance: Mentor submits expectations.
   Required data:
   - `expectationData.goals`
   - `expectationData.responsibilities`
   - `expectationData.weeklyHours`
   - Optional: `expectationData.mentorNotes`
   Next status: `ExpectationSet`

2. **ExpectationSet**
   Displayed when: Expectations are saved and awaiting GA acknowledgment.
   Primary actor: GA
   Action to advance: GA reviews and acknowledges expectations.
   Required data:
   - `expectationData.gaAcknowledged = true`
   - `expectationData.gaAcknowledgedAt` (date string)
   Next status: `AwaitingSelfEvaluation`

3. **AwaitingSelfEvaluation**
   Displayed when: GA has acknowledged expectations, waiting on self-evaluation.
   Primary actor: GA
   Action to advance: GA submits self-evaluation.
   Required data:
   - `selfEvaluationData.goalProgress`
   - Optional: `selfEvaluationData.strengths`
   - Optional: `selfEvaluationData.challenges`
   - Optional: `selfEvaluationData.additionalComments`
   Next status: `SelfEvaluationCompleted`

4. **SelfEvaluationCompleted**
   Displayed when: GA self-evaluation is complete and mentor review has not started.
   Primary actor: Mentor
   Action to advance: Mentor begins or submits evaluation.
   Required data to move forward: none yet, mentor should complete evaluation.
   Next status: `AwaitingMentorEvaluation`

5. **AwaitingMentorEvaluation**
   Displayed when: Mentor is expected to complete evaluation.
   Primary actor: Mentor
   Action to advance: Mentor submits evaluation.
   Required data:
   - `mentorEvaluationData.ratings` (rubric scores)
   - Optional: `mentorEvaluationData.narrative`
   - Optional: `mentorEvaluationData.overallSummary`
   - Optional: `mentorEvaluationData.finalMeetingDate`
   Next status: `MentorEvaluationCompleted`

6. **MentorEvaluationCompleted**
   Displayed when: Mentor evaluation is complete, awaiting GA sign-off.
   Primary actor: GA
   Action to advance: GA signs off after final meeting.
   Required data:
   - `mentorEvaluationData.gaSignOff = true`
   - `mentorEvaluationData.gaSignOffAt` (date string)
   Next status: `AwaitingSignOff`

7. **AwaitingSignOff**
   Displayed when: Final meeting date is recorded and GA sign-off is pending or just initiated.
   Primary actor: GA
   Action to advance: GA completes sign-off.
   Required data:
   - `mentorEvaluationData.finalMeetingDate`
   - `mentorEvaluationData.gaSignOff = true`
   - `mentorEvaluationData.gaSignOffAt`
   Next status: `FinalEvaluated`

8. **FinalEvaluated**
   Displayed when: Evaluation cycle is fully complete.
   Primary actor: System (read-only)
   Action to advance: none (terminal status).
   Required data: all evaluation blobs should be present.

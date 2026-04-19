import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  APPOINTMENT_STATUS,
  FinalAcknowledgmentSchema,
  FinalSignOffPreparationSchema,
  GAAcknowledgeExpectationsSchema,
  MentorEvaluationSchema,
  MentorExpectationSettingSchema,
  SelfEvaluationSchema,
} from '../../schemas/appointment';

describe('Shared appointment schemas', () => {
  test('accepts a valid mentor expectation payload', () => {
    const result = MentorExpectationSettingSchema.safeParse({
      goals: ['Ship tests', 'Document workflows'],
      responsibilities: 'Support backend development and review pull requests.',
      weeklyHours: 15,
      jobCategory: 'Research',
      expectedOutputs: 'Weekly progress updates and merged pull requests',
      expectationsMeetingDate: '2026-04-18',
      mentorNotes: 'Focus on quality and communication.',
    });

    assert.equal(result.success, true);
  });

  test('rejects mentor expectation payloads with too many goals', () => {
    const result = MentorExpectationSettingSchema.safeParse({
      goals: ['Goal one', 'Goal two', 'Goal three', 'Goal four', 'Goal five', 'Goal six'],
      responsibilities: 'Support backend development and review pull requests.',
      weeklyHours: 15,
      jobCategory: 'Research',
      expectedOutputs: 'Weekly progress updates and merged pull requests',
      expectationsMeetingDate: '2026-04-18',
    });

    assert.equal(result.success, false);
  });

  test('accepts GA acknowledgment goals within the allowed range', () => {
    const result = GAAcknowledgeExpectationsSchema.safeParse({
      goals: ['Lead weekly discussions', 'Improve documentation', 'Support grading'],
    });

    assert.equal(result.success, true);
  });

  test('rejects GA acknowledgment payloads with more than three goals', () => {
    const result = GAAcknowledgeExpectationsSchema.safeParse({
      goals: ['Goal one', 'Goal two', 'Goal three', 'Goal four'],
    });

    assert.equal(result.success, false);
  });

  test('accepts a complete self-evaluation payload', () => {
    const result = SelfEvaluationSchema.safeParse({
      goalProgress: 'I completed the implementation milestones for this cycle.',
      strengths: 'Clear communication and steady follow-through.',
      challenges: 'Balancing deadlines across several courses.',
      additionalComments: 'Would like more time for UX polish.',
    });

    assert.equal(result.success, true);
  });

  test('rejects mentor evaluation ratings outside the allowed scale', () => {
    const result = MentorEvaluationSchema.safeParse({
      ratings: {
        communication: 6,
        dependability: 5,
        initiative: 4,
        qualityOfWork: 5,
      },
      narrative: 'Consistently strong communication and collaboration.',
      overallSummary: 'A reliable GA with strong outcomes this term.',
      finalMeetingDate: '2026-04-18',
    });

    assert.equal(result.success, false);
  });

  test('requires meaningful admin sign-off notes', () => {
    const result = FinalSignOffPreparationSchema.safeParse({
      signOffDecision: 'Approve',
      signOffNotes: 'Too short',
    });

    assert.equal(result.success, false);
  });

  test('requires a true final acknowledgment flag', () => {
    const result = FinalAcknowledgmentSchema.safeParse({
      finalAcknowledged: false,
    });

    assert.equal(result.success, false);
  });
});

describe('Appointment status workflow', () => {
  test('exports the expected status constants', () => {
    assert.deepEqual(APPOINTMENT_STATUS, {
      AWAITING: 'AwaitingExpectationSetting',
      SET: 'ExpectationSet',
      AWAITING_SELF_EVAL: 'AwaitingSelfEvaluation',
      SELF_EVAL_DONE: 'SelfEvaluationCompleted',
      MENTOR_EVAL_DONE: 'MentorEvaluationCompleted',
      AWAITING_SIGN_OFF: 'AwaitingSignOff',
      FINAL: 'FinalEvaluated',
    });
  });

  test('should not include AwaitingMentorEvaluation in the shared status model', () => {
    const schemaSource = readFileSync(new URL('../../schemas/appointment.ts', import.meta.url), 'utf8');

    assert.equal(schemaSource.includes("AWAITING_MENTOR_EVAL"), false);
    assert.equal(schemaSource.includes("'AwaitingMentorEvaluation'"), false);
  });

  test('should keep the simplified annual evaluation flow in order', () => {
    const schemaSource = readFileSync(new URL('../../schemas/appointment.ts', import.meta.url), 'utf8');
    const statusSectionMatch = schemaSource.match(
      /export const APPOINTMENT_STATUS = \{([\s\S]*?)\} as const;/
    );
    const statuses = [
      'AwaitingExpectationSetting',
      'ExpectationSet',
      'AwaitingSelfEvaluation',
      'SelfEvaluationCompleted',
      'MentorEvaluationCompleted',
      'AwaitingSignOff',
      'FinalEvaluated',
    ];
    const statusSection = statusSectionMatch?.[1] ?? '';

    assert.notEqual(statusSectionMatch, null);

    let previousIndex = -1;

    for (const status of statuses) {
      const nextIndex = statusSection.indexOf(`'${status}'`);
      assert.equal(nextIndex > previousIndex, true);
      previousIndex = nextIndex;
    }
  });
});

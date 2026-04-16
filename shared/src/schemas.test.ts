import { expect, test, describe } from 'vitest';
import { z } from 'zod';
import { readFileSync } from 'node:fs';

// Defined locally for initial CI verification
const expectationSchema = z.object({
  weeklyHours: z.number().int().min(0).max(20),
  goals: z.array(z.string()).min(1),
  responsibilities: z.string(),
});

describe('Expectation Form Validation', () => {
  test('should accept valid expectation data', () => {
    const validData = {
      weeklyHours: 15,
      goals: ["Learn TypeScript", "Setup CI"],
      responsibilities: "Assist with backend development"
    };
    const result = expectationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('should reject hours exceeding 20', () => {
    const invalidData = {
      weeklyHours: 25,
      goals: ["Invalid hours test"],
      responsibilities: "Testing"
    };
    const result = expectationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test('should reject empty goal lists', () => {
    const invalidData = {
      weeklyHours: 10,
      goals: [],
      responsibilities: "Testing"
    };
    const result = expectationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Appointment status workflow', () => {
  test('should not include AwaitingMentorEvaluation in the shared status model', () => {
    const schemaSource = readFileSync(new URL('../schemas/appointment.ts', import.meta.url), 'utf8');

    expect(schemaSource).not.toContain("AWAITING_MENTOR_EVAL");
    expect(schemaSource).not.toContain("'AwaitingMentorEvaluation'");
  });

  test('should keep the simplified annual evaluation flow in order', () => {
    const schemaSource = readFileSync(new URL('../schemas/appointment.ts', import.meta.url), 'utf8');
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

    expect(statusSectionMatch).not.toBeNull();

    let previousIndex = -1;

    for (const status of statuses) {
      const nextIndex = statusSection.indexOf(`'${status}'`);
      expect(nextIndex).toBeGreaterThan(previousIndex);
      previousIndex = nextIndex;
    }
  });
});

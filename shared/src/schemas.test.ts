import { expect, test, describe } from 'vitest';
import { z } from 'zod';

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
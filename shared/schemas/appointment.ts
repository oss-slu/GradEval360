
import { z } from 'zod';


// The specific data captured during the first phase of the GA cycle
export const ExpectationSettingSchema = z.object({
  appointmentId: z.string().uuid(),
  goals: z.array(z.string().min(5, "Goal must be at least 5 characters")).nonempty("At least one goal is required"),
  responsibilities: z.string().min(10, "Please provide more detail on responsibilities"),
  weeklyHours: z.number().min(1).max(20), // Standard GA limit
  stipendConfirmed: z.boolean().refine(val => val === true, "Must confirm stipend details"),
  mentorNotes: z.string().optional(),
  gaAcknowledged: z.boolean().optional(),
  gaAcknowledgedAt: z.string().optional(),
});

export const MentorExpectationSettingSchema = z
  .object({
    goals: z
      .array(z.string().trim().min(5, "Each goal must be at least 5 characters"))
      .min(1, "At least 1 goal is required")
      .max(5, "You can add at most 5 goals"),
    responsibilities: z
      .string()
      .trim()
      .min(10, "Responsibilities must be at least 10 characters"),
    weeklyHours: z.number().min(1).max(20),
    jobCategory: z.string().trim().min(2, "Job category is required"),
    expectedOutputs: z.string().trim().min(5, "Expected outputs are required"),
    expectationsMeetingDate: z.string().trim().min(4, "Meeting date is required"),
    mentorNotes: z.string().trim().optional(),
  })
  .strict();

// Strict schema for GA acknowledgment payload only
export const GAAcknowledgeExpectationsSchema = z
  .object({
    goals: z
      .array(z.string().trim().min(5, "Each goal must be at least 5 characters"))
      .min(1, "At least 1 goal is required")
      .max(3, "You can add at most 3 goals"),
  })
  .strict();

// TypeScript type inference
export type ExpectationSettingInput = z.infer<typeof ExpectationSettingSchema>;
export type MentorExpectationSettingInput = z.infer<typeof MentorExpectationSettingSchema>;
export type GAAcknowledgeExpectationsInput = z.infer<typeof GAAcknowledgeExpectationsSchema>;

// Shared Constants for the UI
export const APPOINTMENT_STATUS = {
  AWAITING: 'AwaitingExpectationSetting',
  SET: 'ExpectationSet',
  AWAITING_SELF_EVAL: 'AwaitingSelfEvaluation',
  SELF_EVAL_DONE: 'SelfEvaluationCompleted',
  MENTOR_EVAL_DONE: 'MentorEvaluationCompleted',
  AWAITING_SIGN_OFF: 'AwaitingSignOff',
  FINAL: 'FinalEvaluated',
} as const;

export const SelfEvaluationSchema = z.object({
  goalProgress: z.string().min(5, "Must be at least 5 characters"),
  strengths: z.string().min(5, "Must be at least 5 characters"),
  challenges: z.string().min(5, "Must be at least 5 characters"),
  additionalComments: z.string().optional(),
});

/*
export const SelfEvaluationSchema = z.object({
  appointmentId: z.string().uuid(),
  goalProgress: z.string().min(5, "Please describe your goal progress").optional(),
  strengths: z.string().min(5, "Please describe strengths").optional(),
  challenges: z.string().min(5, "Please describe challenges").optional(),
  additionalComments: z.string().optional(),
});
*/

export const MentorEvaluationSchema = z.object({
  ratings: z
    .object({
      communication: z.number().min(1).max(5),
      dependability: z.number().min(1).max(5),
      initiative: z.number().min(1).max(5),
      qualityOfWork: z.number().min(1).max(5),
    })
    .strict(),
  narrative: z.string().trim().min(10, "Narrative must be at least 10 characters"),
  overallSummary: z.string().trim().min(10, "Overall summary must be at least 10 characters"),
  finalMeetingDate: z.string().trim().min(4, "Final meeting date is required"),
}).strict();

export const FinalSignOffPreparationSchema = z
  .object({
    signOffDecision: z.string().trim().min(3, "Sign-off decision is required"),
    signOffNotes: z.string().trim().min(10, "Sign-off notes must be at least 10 characters"),
  })
  .strict();

export const FinalAcknowledgmentSchema = z
  .object({
    finalAcknowledged: z
      .boolean()
      .refine((value) => value === true, "Final acknowledgment is required"),
  })
  .strict();

export const AppointmentSchema = z.object({

  id: z.string().uuid(),
  appointmentCode: z.string(),

  gaId: z.string().uuid(),
  mentorId: z.string().uuid(),
  unitId: z.string(),

  status: z.string(),

  expectationData: z.any(),
  selfEvaluationData: z.any(),
  mentorEvaluationData: z.any(), 
});

export type Appointment = z.infer<typeof AppointmentSchema>;
export type MentorEvaluationInput = z.infer<typeof MentorEvaluationSchema>;
export type FinalSignOffPreparationInput = z.infer<typeof FinalSignOffPreparationSchema>;
export type FinalAcknowledgmentInput = z.infer<typeof FinalAcknowledgmentSchema>;

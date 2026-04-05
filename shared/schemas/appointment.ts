
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

// TypeScript type inference
export type ExpectationSettingInput = z.infer<typeof ExpectationSettingSchema>;

// Shared Constants for the UI
export const APPOINTMENT_STATUS = {
  AWAITING: 'AwaitingExpectationSetting',
  SET: 'ExpectationSet',
  AWAITING_SELF_EVAL: 'AwaitingSelfEvaluation',
  SELF_EVAL_DONE: 'SelfEvaluationCompleted',
  AWAITING_MENTOR_EVAL: 'AwaitingMentorEvaluation',
  MENTOR_EVAL_DONE: 'MentorEvaluationCompleted',
  AWAITING_SIGN_OFF: 'AwaitingSignOff',
  FINAL: 'FinalEvaluated',
} as const;

export const SelfEvaluationSchema = z.object({
  appointmentId: z.string().uuid(),
  goalProgress: z.string().min(5, "Please describe your goal progress").optional(),
  strengths: z.string().min(5, "Please describe strengths").optional(),
  challenges: z.string().min(5, "Please describe challenges").optional(),
  additionalComments: z.string().optional(),
});

export const MentorEvaluationSchema = z.object({
  appointmentId: z.string().uuid(),
  ratings: z.record(z.number()).optional(),
  narrative: z.string().optional(),
  overallSummary: z.string().optional(),
  finalMeetingDate: z.string().optional(),
  gaSignOff: z.boolean().optional(),
  gaSignOffAt: z.string().optional(),
});

export const AppointmentSchema = z.object({

  id: z.string().uuid(),

  gaId: z.string().uuid(),
  mentorId: z.string().uuid(),
  unitId: z.string(),

  status: z.string(),

  expectationData: z.any(),
  selfEvaluationData: z.any(),
  mentorEvaluationData: z.any(), 
});

export type Appointment = z.infer<typeof AppointmentSchema>;

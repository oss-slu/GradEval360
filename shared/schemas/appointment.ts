import { appointments } from 'src/db/schema';
import { z } from 'zod';

// The specific data captured during the first phase of the GA cycle
export const ExpectationSettingSchema = z.object({
  appointmentId: z.string().uuid(),
  goals: z.array(z.string().min(5, "Goal must be at least 5 characters")).nonempty("At least one goal is required"),
  responsibilities: z.string().min(10, "Please provide more detail on responsibilities"),
  weeklyHours: z.number().min(1).max(20), // Standard GA limit
  stipendConfirmed: z.boolean().refine(val => val === true, "Must confirm stipend details"),
  mentorNotes: z.string().optional(),
});

// TypeScript type inference
export type ExpectationSettingInput = z.infer<typeof ExpectationSettingSchema>;

// Shared Constants for the UI
export const APPOINTMENT_STATUS = {
  AWAITING: 'AwaitingExpectationSetting',
  SET: 'ExpectationSet',
  MID_YEAR: 'MidYearCompleted',
  FINAL: 'FinalEvaluated',
} as const;

export const AppointmentSchema = z.object({

  id: z.string().uuid(),

  gaId: z.string().uuid(),
  mentorId: z.string().uuid(),
  unitId: z.string(),

  status: z.string(),

  expectationData: z.any(),
  midYearData: z.any(),
  finalEvaluationData: z.any(), 
});

export type Appointment = z.infer<typeof AppointmentSchema>;

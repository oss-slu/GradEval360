import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { UserRoleEnum } from "../../../shared/src/types";

// Enum for the 3-part annual cycle
export const statusEnum = pgEnum('status', [
  'AwaitingExpectationSetting', 
  'ExpectationSet', 
  'MidYearCompleted', 
  'FinalEvaluated'
]);

interface Expectation {
  goals: string[];
  weeklyHours?: number;
  responsibilities?: string;
}

interface MidYear {
  performance: string;
  feedback?: string;
}

interface FinalEval {
  grade: string;
  summary: string;
}

// Pass the Zod options to Postgres Enum
export const roleEnum = pgEnum("user_role", UserRoleEnum.options as [string, ...string[]]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: roleEnum("role").notNull().default("GA"),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  gaId: uuid('ga_id').references(() => users.id),
  mentorId: uuid('mentor_id').references(() => users.id),
  unitId: text('unit_id').notNull(), // For departmental tracking
  status: statusEnum('status').default('AwaitingExpectationSetting'),
  
  // Hybrid Data Strategy: JSONB for flexible form questions 
  expectationData: jsonb('expectation_data').$type<Expectation>(), 
  midYearData: jsonb('mid_year_data').$type<MidYear>(),
  finalEvaluationData: jsonb('final_evaluation_data').$type<FinalEval>(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
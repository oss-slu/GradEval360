import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { UserRoleEnum } from "../../../shared/src/types.js";

// Enum for the 3-part annual cycle
export const statusEnum = pgEnum('status', [
  'AwaitingExpectationSetting', 
  'ExpectationSet', 
  'MidYearCompleted', 
  'FinalEvaluated'
]);

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
  expectationData: jsonb('expectation_data'), 
  midYearData: jsonb('mid_year_data'),
  finalEvaluationData: jsonb('final_evaluation_data'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
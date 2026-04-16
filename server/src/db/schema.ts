import { pgTable, uuid, text, timestamp, jsonb, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { sql } from "drizzle-orm";
import { UserRoleEnum } from "../../../shared/src/types";

// Enum for the 3-part annual cycle
export const statusEnum = pgEnum('status', [
  'AwaitingExpectationSetting', 
  'ExpectationSet', 
  'AwaitingSelfEvaluation',
  'SelfEvaluationCompleted',
  'MentorEvaluationCompleted',
  'AwaitingSignOff',
  'FinalEvaluated'
]);

interface Expectation {
  goals: string[];
  mentorGoals?: string[];
  gaGoals?: string[];
  weeklyHours?: number;
  jobCategory?: string;
  expectedOutputs?: string;
  expectationsMeetingDate?: string;
  responsibilities?: string;
  mentorNotes?: string;
  mentorAcknowledged?: boolean;
  mentorAcknowledgedAt?: string;
  gaAcknowledged?: boolean;
  gaAcknowledgedAt?: string;
}

interface SelfEvaluation {
  goalProgress?: string;
  strengths?: string;
  challenges?: string;
  additionalComments?: string;
}

interface MentorEvaluation {
  ratings?: Record<string, number>;
  narrative?: string;
  overallSummary?: string;
  finalMeetingDate?: string;
  evaluationSubmittedAt?: string;
  evaluationSubmittedBy?: string;
  signOffDecision?: string;
  signOffNotes?: string;
  signOffPreparedAt?: string;
  signOffPreparedBy?: string;
  finalAcknowledged?: boolean;
  finalAcknowledgedAt?: string;
  finalAcknowledgedBy?: string;
}

// Pass the Zod options to Postgres Enum
export const roleEnum = pgEnum("user_role", UserRoleEnum.options as [string, ...string[]]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: roleEnum("role").notNull().default("GA"),
  unitId: text('unit_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userUnits = pgTable('user_units', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  unitId: text('unit_id').notNull(),
});

// Better Auth tables (kept separate from app-domain "users")
export const authUsers = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("GA"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const authSessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
});

export const authAccounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const authVerifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentCode: text('appointment_code')
    .notNull()
    .unique()
    .default(
      sql`('GEA-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)))`
    ),

  gaId: uuid('ga_id').references(() => users.id).notNull(),
  mentorId: uuid('mentor_id').references(() => users.id).notNull(),
  unitId: text('unit_id').notNull(), // For departmental tracking
  status: statusEnum('status').default('AwaitingExpectationSetting').notNull(),
  
  // Hybrid Data Strategy: JSONB for flexible form questions 
  expectationData: jsonb('expectation_data').$type<Expectation>()
    .default({} as any)
    .notNull(), 

  selfEvaluationData: jsonb('self_evaluation_data').$type<SelfEvaluation>()
    .default({} as any)
    .notNull(),

  mentorEvaluationData: jsonb('mentor_evaluation_data').$type<MentorEvaluation>().default({} as any).notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

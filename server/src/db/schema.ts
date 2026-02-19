import { pgTable, uuid, text, timestamp, jsonb, pgEnum, boolean } from 'drizzle-orm/pg-core';
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

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_id" uuid NOT NULL REFERENCES "users"("id"),
  "actor_role" "user_role" NOT NULL,
  "action" text NOT NULL,
  "description" text NOT NULL,
  "appointment_id" uuid REFERENCES "appointments"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" ("created_at" DESC);

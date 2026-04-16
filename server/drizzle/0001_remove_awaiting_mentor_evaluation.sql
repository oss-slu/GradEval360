ALTER TABLE appointments
  ALTER COLUMN status DROP DEFAULT;

UPDATE appointments
SET status = 'SelfEvaluationCompleted'
WHERE status = 'AwaitingMentorEvaluation';

ALTER TYPE status RENAME TO status_old;

CREATE TYPE status AS ENUM (
  'AwaitingExpectationSetting',
  'ExpectationSet',
  'AwaitingSelfEvaluation',
  'SelfEvaluationCompleted',
  'MentorEvaluationCompleted',
  'AwaitingSignOff',
  'FinalEvaluated'
);

ALTER TABLE appointments
  ALTER COLUMN status TYPE status
  USING status::text::status;

ALTER TABLE appointments
  ALTER COLUMN status SET DEFAULT 'AwaitingExpectationSetting';

DROP TYPE status_old;

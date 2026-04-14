ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS appointment_code TEXT;

UPDATE appointments
SET appointment_code =
  COALESCE(
    appointment_code,
    'GEA-' || to_char(now(), 'YYYYMMDD') || '-' ||
      upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6))
  )
WHERE appointment_code IS NULL;

ALTER TABLE appointments
  ALTER COLUMN appointment_code SET DEFAULT
    ('GEA-' || to_char(now(), 'YYYYMMDD') || '-' ||
      upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)));

ALTER TABLE appointments
  ALTER COLUMN appointment_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_appointment_code_idx
  ON appointments (appointment_code);

-- Apply to EXISTING Supabase projects that previously ran supabase/schema.sql.
-- Skip this file for fresh projects: the updated schema.sql already includes these changes.
-- Take a database backup first. Run exactly once with Supabase SQL Editor.
BEGIN;
ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS batches_mode_check;
ALTER TABLE public.batches ADD CONSTRAINT batches_mode_check CHECK (mode IN ('online','offline','home'));
ALTER TABLE public.admissions DROP CONSTRAINT IF EXISTS admissions_mode_snapshot_check;
ALTER TABLE public.admissions ADD CONSTRAINT admissions_mode_snapshot_check CHECK (mode_snapshot IN ('online','offline','home'));
ALTER TABLE public.admissions DROP CONSTRAINT IF EXISTS admissions_status_check;
ALTER TABLE public.admissions ADD CONSTRAINT admissions_status_check CHECK (status IN ('awaiting_quote','pending_payment','paid','cancelled','refunded'));
ALTER TABLE public.admissions
 ADD COLUMN IF NOT EXISTS guardian_name text,
 ADD COLUMN IF NOT EXISTS guardian_phone text,
 ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'malayalam',
 ADD COLUMN IF NOT EXISTS preferred_days text,
 ADD COLUMN IF NOT EXISTS preferred_time text,
 ADD COLUMN IF NOT EXISTS home_address text,
 ADD COLUMN IF NOT EXISTS musical_goals text,
 ADD COLUMN IF NOT EXISTS base_fee_paise integer,
 ADD COLUMN IF NOT EXISTS travel_charge_paise integer,
 ADD COLUMN IF NOT EXISTS quote_approved_at timestamptz;
UPDATE public.admissions SET base_fee_paise=amount_due_paise WHERE base_fee_paise IS NULL;
ALTER TABLE public.admissions ALTER COLUMN base_fee_paise SET NOT NULL;
ALTER TABLE public.admissions ADD CONSTRAINT admission_base_fee_positive CHECK (base_fee_paise > 0);
ALTER TABLE public.admissions ADD CONSTRAINT admission_travel_charge_nonnegative CHECK (travel_charge_paise IS NULL OR travel_charge_paise >= 0);
ALTER TABLE public.admissions ADD CONSTRAINT valid_admission_total CHECK (amount_due_paise = base_fee_paise + coalesce(travel_charge_paise,0));
COMMIT;
-- No batches or fictitious schedules are inserted by this migration.

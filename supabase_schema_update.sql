-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;

-- Drop columns that don't match CSV
ALTER TABLE patients
DROP COLUMN IF EXISTS condition_type,
DROP COLUMN IF EXISTS medical_state,
DROP COLUMN IF EXISTS form_month,
DROP COLUMN IF EXISTS test_results2,
DROP COLUMN IF EXISTS worsening,
DROP COLUMN IF EXISTS improvement,
DROP COLUMN IF EXISTS stability;

-- Ensure we have the right columns for CSV import
-- id, workspace_id, first_name, last_name, phone, address, city, medical_condition, aloe_tweak, test_results

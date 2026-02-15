-- STEP 1: First, get your workspace_id
-- Run this in Supabase SQL Editor to find your workspace ID:
SELECT id, name FROM workspaces LIMIT 5;

-- STEP 2: Clean up the patients table (remove extra columns)
ALTER TABLE patients
DROP COLUMN IF EXISTS condition_type,
DROP COLUMN IF EXISTS medical_state,
DROP COLUMN IF EXISTS form_month,
DROP COLUMN IF EXISTS test_results2,
DROP COLUMN IF EXISTS worsening,
DROP COLUMN IF EXISTS improvement,
DROP COLUMN IF EXISTS stability;

-- STEP 3: Import your CSV using Supabase UI
-- When importing, Supabase will:
-- - Auto-generate 'id' (UUID)
-- - You need to manually set 'workspace_id' to YOUR workspace ID from STEP 1
--
-- Column mapping:
-- Nome → first_name
-- Cognome → last_name
-- Telefono → phone
-- Indirizzo → address
-- Città → city
-- Patologia → medical_condition
-- Cura → aloe_tweak
-- Controllo Esami → test_results
--
-- For workspace_id: Use the ID from STEP 1 (looks like: abc123-def456-...)

-- ALTERNATIVE: If CSV import doesn't work, use this SQL template:
-- Replace 'YOUR_WORKSPACE_ID_HERE' with the actual ID from STEP 1

/*
INSERT INTO patients (workspace_id, first_name, last_name, phone, address, city, medical_condition, aloe_tweak, test_results)
VALUES
  ('YOUR_WORKSPACE_ID_HERE', 'PAPA MONICA', '', '', '', 'MEDICINA', 'GLAUCOMA, TUMORE RENE, OPERATO', 'ALOE+GRAPPA+MIELE CASTAGNO+POCA VIT C', ''),
  ('YOUR_WORKSPACE_ID_HERE', 'MONICA', '', '', '', '', 'STITICHEZZA, COLESTEROLO, TIROIDE', 'MIELE CASTAGNO+ALOINA+VC+ALOE GRAPPA', ''),
  -- ... add more rows here
;
*/

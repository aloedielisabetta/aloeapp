-- Migration: Add missing fields to patients table to fix saving issues
ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_duration TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS test_results TEXT;

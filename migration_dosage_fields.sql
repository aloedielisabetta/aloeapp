-- Migration to add customizable dosage fields for the 7th day
ALTER TABLE patients ADD COLUMN dosage_morning_whole TEXT DEFAULT '1';
ALTER TABLE patients ADD COLUMN dosage_morning_fraction TEXT DEFAULT '½';
ALTER TABLE patients ADD COLUMN dosage_evening_whole TEXT DEFAULT '1';
ALTER TABLE patients ADD COLUMN dosage_evening_fraction TEXT DEFAULT '½';

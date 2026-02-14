-- Migration: Add is_hidden to salespersons
ALTER TABLE salespersons ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

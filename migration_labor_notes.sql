-- Migration: Add notes column to labor_records table for collaborator notes
ALTER TABLE public.labor_records ADD COLUMN IF NOT EXISTS notes TEXT;

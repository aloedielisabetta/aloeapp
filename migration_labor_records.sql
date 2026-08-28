-- Migration: Create labor_records table for collaborator hours & rates

CREATE TABLE IF NOT EXISTS public.labor_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    salesperson_id UUID REFERENCES public.salespersons(id) ON DELETE CASCADE NOT NULL,
    hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.labor_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins manage labor records" ON public.labor_records;
DROP POLICY IF EXISTS "Collaborators manage own labor records" ON public.labor_records;

-- 1. Admins manage all labor records in their owned workspaces
CREATE POLICY "Admins manage labor records" ON public.labor_records 
    FOR ALL 
    USING (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    ));

-- 2. Collaborators can view, insert, and delete their own labor records
CREATE POLICY "Collaborators manage own labor records" ON public.labor_records
    FOR ALL
    USING (
        salesperson_id IN (
            SELECT salesperson_id FROM public.workspace_users WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        salesperson_id IN (
            SELECT salesperson_id FROM public.workspace_users WHERE user_id = auth.uid()
        )
    );

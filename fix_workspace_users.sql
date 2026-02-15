
-- Migration: Fix workspace_users schema and RLS
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS user_id UUID;

-- Re-enable RLS with proper policies
ALTER TABLE workspace_users ENABLE ROW LEVEL SECURITY;

-- Policy for Select (Admin can see all, Collaborator can see self)
DROP POLICY IF EXISTS "Workspace users visible to workspace members" ON workspace_users;
CREATE POLICY "Workspace users visible to workspace members" ON workspace_users
    FOR SELECT USING (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
        OR user_id = auth.uid()
    );

-- Policy for Insert (Only Admin/Owner)
DROP POLICY IF EXISTS "Only admin can insert workspace users" ON workspace_users;
CREATE POLICY "Only admin can insert workspace users" ON workspace_users
    FOR INSERT WITH CHECK (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    );

-- Policy for Delete
DROP POLICY IF EXISTS "Only admin can delete workspace users" ON workspace_users;
CREATE POLICY "Only admin can delete workspace users" ON workspace_users
    FOR DELETE USING (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    );

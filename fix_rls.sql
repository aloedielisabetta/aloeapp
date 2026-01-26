-- Fix Infinite Recursion in RLS

-- 1. Create a secure function to check ownership without triggering RLS loops
CREATE OR REPLACE FUNCTION is_workspace_owner(_workspace_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM workspaces
    WHERE id = _workspace_id
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can manage workspace users" ON workspace_users;

-- 3. Re-create the policy using the secure function
CREATE POLICY "Admins can manage workspace users" ON workspace_users
    FOR ALL
    USING (is_workspace_owner(workspace_id));

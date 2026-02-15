-- 1. Create a brand new workspace and user for Elisabetta
DO $$
DECLARE
  new_workspace_id uuid;
  new_salesperson_id uuid;
BEGIN
  -- Create the Workspace
  INSERT INTO workspaces (name)
  VALUES ('Elisabetta Studio')
  RETURNING id INTO new_workspace_id;

  -- Create the Salesperson Record
  INSERT INTO salespersons (workspace_id, name)
  VALUES (new_workspace_id, 'Elisabetta')
  RETURNING id INTO new_salesperson_id;

  -- Create the Login User
  INSERT INTO workspace_users (workspace_id, salesperson_id, username, password, role)
  VALUES (new_workspace_id, new_salesperson_id, 'Elisabetta', 'Eli080684', 'admin');
END $$;

-- 2. Display the NEW Workspace ID
-- COPY THIS ID! You will need it for your CSV import.
SELECT 
    wu.username, 
    w.name as workspace_name, 
    w.id as YOUR_NEW_WORKSPACE_ID 
FROM workspace_users wu
JOIN workspaces w ON wu.workspace_id = w.id
WHERE wu.username = 'Elisabetta';

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE salespersons ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;

-- Add owner_id to workspaces if not exists (handled by app code? No, schema needs it)
-- Since we can't migrate schema easily without SQL, we add this column here.
-- Note: Existing workspaces will have NULL owner_id. They must be claimed or updated manually.
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- WORKSPACES POLICIES
-- Admin (Owner) can do everything
CREATE POLICY "Admins can do everything on their workspaces" ON workspaces
    FOR ALL
    USING (auth.uid() = owner_id);

-- Users can view workspaces they belong to
CREATE POLICY "Users can view their workspaces" ON workspaces
    FOR SELECT
    USING (id IN (
        SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    ));

-- Users can create workspaces (become owner)
CREATE POLICY "Authenticated users can create workspaces" ON workspaces
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);


-- WORKSPACE_USERS POLICIES
-- Admins can manage users in their workspaces (View, Add, Delete)
CREATE POLICY "Admins can manage workspace users" ON workspace_users
    FOR ALL
    USING (workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
    ));

-- Users can view themselves (to know their role/workspace)
CREATE POLICY "Users can view their own membership" ON workspace_users
    FOR SELECT
    USING (user_id = auth.uid());


-- DATA TABLES POLICIES (Applies to all data tables linked to workspace_id)
-- We use a common pattern for: patients, products, orders, etc.

-- Helper Macros (Applied manually per table)

-- PATIENTS
CREATE POLICY "Admins manage patients" ON patients FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "Users view/edit patients" ON patients FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- PRODUCTS
CREATE POLICY "Admins manage products" ON products FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "Users view products" ON products FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));
-- Note: If users need to edit products, change FOR SELECT to FOR ALL

-- ORDERS
CREATE POLICY "Admins manage orders" ON orders FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "Users manage orders" ON orders FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- RECIPES
CREATE POLICY "Admins manage recipes" ON recipes FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "Users view recipes" ON recipes FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- CITY FOLDERS
CREATE POLICY "Admins manage cities" ON city_folders FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "Users view cities" ON city_folders FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- MODIFIER GROUPS
CREATE POLICY "Admins manage modifiers" ON modifier_groups FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "Users view modifiers" ON modifier_groups FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- SALESPERSONS
CREATE POLICY "Admins manage salespersons" ON salespersons FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "Users view salespersons" ON salespersons FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- GENERAL COSTS (Admin Only?) -> Assuming only Admin sees costs
CREATE POLICY "Admins manage costs" ON general_costs FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

-- RAW MATERIALS
CREATE POLICY "Admins manage raw materials" ON raw_materials FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "Users view raw materials" ON raw_materials FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

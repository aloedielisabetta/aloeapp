-- ==========================================
-- COMPLETE SQL SCHEMA - ALOE DI ELISABETTA
-- Includes: Tables, Security Updates, RLS Policies, and SKU Integration
-- ==========================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Clean up (DANGER: Resets all data)
-- DROP TABLE IF EXISTS workspace_users CASCADE;
-- DROP TABLE IF EXISTS recipes CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS patients CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS raw_materials CASCADE;
-- DROP TABLE IF EXISTS general_costs CASCADE;
-- DROP TABLE IF EXISTS city_folders CASCADE;
-- DROP TABLE IF EXISTS modifier_groups CASCADE;
-- DROP TABLE IF EXISTS salespersons CASCADE;
-- DROP TABLE IF EXISTS workspaces CASCADE;

-- 3. Create Tables

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    admin_password TEXT, -- Legacy/Fallback
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- City Folders
CREATE TABLE IF NOT EXISTS city_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modifier Groups
CREATE TABLE IF NOT EXISTS modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    options JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salespersons
CREATE TABLE IF NOT EXISTS salespersons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Users
CREATE TABLE IF NOT EXISTS workspace_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    salesperson_id UUID REFERENCES salespersons(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    password TEXT NOT NULL, -- Legacy
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    medical_condition TEXT,
    condition_type TEXT,
    medical_state TEXT,
    aloe_tweak TEXT,
    treatment_duration TEXT,
    test_results TEXT,
    journal JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (Updated with SKU)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) DEFAULT 0,
    cost_per_item NUMERIC(10, 2) DEFAULT 0,
    labour_cost NUMERIC(10, 2) DEFAULT 0,
    external_commission NUMERIC(10, 2) DEFAULT 0,
    modifier_group_ids JSONB DEFAULT '[]',
    sku TEXT,
    variant_map JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw Materials
CREATE TABLE IF NOT EXISTS raw_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    total_quantity NUMERIC(10, 2) DEFAULT 0,
    total_price NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    modifier_option TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    date TIMESTAMPTZ DEFAULT NOW(),
    is_external BOOLEAN DEFAULT FALSE,
    is_shipping BOOLEAN DEFAULT FALSE,
    is_free BOOLEAN DEFAULT FALSE,
    commission NUMERIC(10, 2) DEFAULT 0,
    salesperson_id UUID REFERENCES salespersons(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'In attesa',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- General Costs
CREATE TABLE IF NOT EXISTS general_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC(10, 2) DEFAULT 0,
    category TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. Helper Function to Prevent RLS Recursion
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


-- 6. Enable Row Level Security (RLS)
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


-- 7. Define RLS Policies

-- WORKSPACES
-- Drop existing policies if needed to avoid conflicts when re-running
DROP POLICY IF EXISTS "Admins (Owners) have full access" ON workspaces;
DROP POLICY IF EXISTS "Members view their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON workspaces;

CREATE POLICY "Admins (Owners) have full access" ON workspaces
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Members view their workspaces" ON workspaces
    FOR SELECT USING (id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can create workspaces" ON workspaces
    FOR INSERT WITH CHECK (auth.uid() = owner_id);


-- WORKSPACE USERS
DROP POLICY IF EXISTS "Admins manage workspace users" ON workspace_users;
DROP POLICY IF EXISTS "Users view own membership" ON workspace_users;

CREATE POLICY "Admins manage workspace users" ON workspace_users
    FOR ALL USING (is_workspace_owner(workspace_id));

CREATE POLICY "Users view own membership" ON workspace_users
    FOR SELECT USING (user_id = auth.uid());


-- DATA TABLES
-- Re-create policies for clarity (idempotency is hard with CREATE POLICY, assumed acceptable to fail if exists, or Drop First)

-- Patients
DROP POLICY IF EXISTS "Admins manage patients" ON patients;
DROP POLICY IF EXISTS "Members view patients" ON patients;
CREATE POLICY "Admins manage patients" ON patients FOR ALL USING (is_workspace_owner(workspace_id));
CREATE POLICY "Members view patients" ON patients FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- Products
DROP POLICY IF EXISTS "Admins manage products" ON products;
DROP POLICY IF EXISTS "Members view products" ON products;
CREATE POLICY "Admins manage products" ON products FOR ALL USING (is_workspace_owner(workspace_id));
CREATE POLICY "Members view products" ON products FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- Orders
DROP POLICY IF EXISTS "Admins manage orders" ON orders;
DROP POLICY IF EXISTS "Members manage orders" ON orders;
CREATE POLICY "Admins manage orders" ON orders FOR ALL USING (is_workspace_owner(workspace_id));
CREATE POLICY "Members manage orders" ON orders FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- Recipes
DROP POLICY IF EXISTS "Admins manage recipes" ON recipes;
DROP POLICY IF EXISTS "Members view recipes" ON recipes;
CREATE POLICY "Admins manage recipes" ON recipes FOR ALL USING (is_workspace_owner(workspace_id));
CREATE POLICY "Members view recipes" ON recipes FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- City Folders
DROP POLICY IF EXISTS "Admins manage cities" ON city_folders;
DROP POLICY IF EXISTS "Members view cities" ON city_folders;
CREATE POLICY "Admins manage cities" ON city_folders FOR ALL USING (is_workspace_owner(workspace_id));
CREATE POLICY "Members view cities" ON city_folders FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- Modifier Groups
DROP POLICY IF EXISTS "Admins manage modifiers" ON modifier_groups;
DROP POLICY IF EXISTS "Members view modifiers" ON modifier_groups;
CREATE POLICY "Admins manage modifiers" ON modifier_groups FOR ALL USING (is_workspace_owner(workspace_id));
CREATE POLICY "Members view modifiers" ON modifier_groups FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- Salespersons
DROP POLICY IF EXISTS "Admins manage salespersons" ON salespersons;
DROP POLICY IF EXISTS "Members view salespersons" ON salespersons;
CREATE POLICY "Admins manage salespersons" ON salespersons FOR ALL USING (is_workspace_owner(workspace_id));
CREATE POLICY "Members view salespersons" ON salespersons FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

-- General Costs
DROP POLICY IF EXISTS "Admins manage costs" ON general_costs;
CREATE POLICY "Admins manage costs" ON general_costs FOR ALL USING (is_workspace_owner(workspace_id));

-- Raw Materials
DROP POLICY IF EXISTS "Admins manage raw materials" ON raw_materials;
DROP POLICY IF EXISTS "Members view raw materials" ON raw_materials;
CREATE POLICY "Admins manage raw materials" ON raw_materials FOR ALL USING (is_workspace_owner(workspace_id));
CREATE POLICY "Members view raw materials" ON raw_materials FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()));

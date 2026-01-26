-- Migration: Add SKU support for E-commerce Integration

-- 1. Add 'sku' for the main product (e.g. for simple products or base code)
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;

-- 2. Add 'variant_mapping' to store SKU -> Modifier rules
-- Format example: { "ALOE_SMALL": { "Size": "Small" }, "ALOE_LARGE": { "Size": "Large" } }
-- Or simpler: { "Small": "ALOE_SMALL", "Large": "ALOE_LARGE" } if we assume one modifier group.
-- Let's stick to a versatile JSONB map: stores specific variant codes or overrides.
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_map JSONB DEFAULT '{}';

-- 3. Add constraint to ensure SKUs are unique per workspace (Optional but recommended)
-- We won't enforce unique strictness yet to avoid migration errors on existing duplicates, 
-- but normally: CREATE UNIQUE INDEX products_sku_idx ON products (workspace_id, sku);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmhyucystwoxiinyptwx.supabase.co';
const supabaseKey = 'sb_publishable_2gExbZoCjh1NBCAJO0ZPWA_Ek2M86xG';

/**
 * SETUP SCRIPT: Create "Online Store" Salesperson
 * 
 * Run this ONCE per workspace to set up the virtual salesperson
 * that represents all online orders from Shopify/E-commerce platforms.
 * 
 * Usage:
 * node setup_online_store_salesperson.js <WORKSPACE_ID>
 */

const log = (msg) => console.log(`[SETUP] ${msg}`);
const err = (msg, e) => { console.error(`[ERROR] ${msg}`, e?.message || e); process.exit(1); };

async function setupOnlineStoreSalesperson(workspaceId) {
    log('Setting up Online Store Salesperson...');

    if (!workspaceId) {
        err('Missing workspace ID. Usage: node setup_online_store_salesperson.js <WORKSPACE_ID>');
    }

    const adminClient = createClient(supabaseUrl, supabaseKey);

    // Check if "Online Store" salesperson already exists
    const { data: existing, error: checkErr } = await adminClient
        .from('salespersons')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('name', 'Online Store')
        .maybeSingle();

    if (checkErr) err('Failed to check existing salesperson', checkErr);

    if (existing) {
        log(`✓ Online Store salesperson already exists (ID: ${existing.id})`);
        log(`  You can use this ID in your webhook configuration.`);
        return existing.id;
    }

    // Create new "Online Store" salesperson
    const { data: newSalesperson, error: createErr } = await adminClient
        .from('salespersons')
        .insert({
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            name: 'Online Store'
        })
        .select()
        .single();

    if (createErr) err('Failed to create Online Store salesperson', createErr);

    log(`✓ Created Online Store salesperson (ID: ${newSalesperson.id})`);
    log(`  Add this to your .env file:`);
    log(`  ONLINE_STORE_SALESPERSON_ID=${newSalesperson.id}`);

    return newSalesperson.id;
}

// Run if called directly
const workspaceId = process.argv[2];
if (workspaceId) {
    setupOnlineStoreSalesperson(workspaceId)
        .then(() => process.exit(0))
        .catch(e => err('Setup failed', e));
} else {
    log('Usage: node setup_online_store_salesperson.js <WORKSPACE_ID>');
    log('Example: node setup_online_store_salesperson.js 123e4567-e89b-12d3-a456-426614174000');
    process.exit(1);
}

export { setupOnlineStoreSalesperson };

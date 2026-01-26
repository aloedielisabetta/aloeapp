import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmhyucystwoxiinyptwx.supabase.co';
const supabaseKey = 'sb_publishable_2gExbZoCjh1NBCAJO0ZPWA_Ek2M86xG';

const log = (msg) => console.log(`[SETUP] ${msg}`);
const err = (msg, e) => { console.error(`[ERROR] ${msg}`, e?.message || e); process.exit(1); };

async function createWorkspaceAndSetupEcommerce() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    log('Creating "Aloe" workspace and setting up e-commerce...\n');

    // Step 1: Create Admin User
    log('Step 1: Creating admin user...');
    const adminEmail = `admin@aloe-${Date.now()}.local`;
    const adminPwd = 'AloeAdmin123!';

    const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPwd
    });

    if (authErr) err('Failed to create admin user', authErr);

    const userId = authData.user.id;
    log(`✓ Created admin user (ID: ${userId})`);
    log(`  Email: ${adminEmail}`);
    log(`  Password: ${adminPwd}\n`);

    // Step 2: Create Workspace
    log('Step 2: Creating "Aloe" workspace...');
    const workspaceId = crypto.randomUUID();

    const { data: workspace, error: wsErr } = await supabase
        .from('workspaces')
        .insert({
            id: workspaceId,
            name: 'Aloe',
            owner_id: userId
        })
        .select()
        .single();

    if (wsErr) err('Failed to create workspace', wsErr);

    log(`✓ Created workspace "Aloe"`);
    log(`  Workspace ID: ${workspace.id}\n`);

    // Step 3: Create "Online Store" Salesperson
    log('Step 3: Creating "Online Store" salesperson...');
    const salespersonId = crypto.randomUUID();

    const { data: salesperson, error: spErr } = await supabase
        .from('salespersons')
        .insert({
            id: salespersonId,
            workspace_id: workspace.id,
            name: 'Online Store'
        })
        .select()
        .single();

    if (spErr) err('Failed to create salesperson', spErr);

    log(`✓ Created "Online Store" salesperson`);
    log(`  Salesperson ID: ${salesperson.id}\n`);

    // Print summary
    printSummary(workspace, salesperson, adminEmail, adminPwd);
}

function printSummary(workspace, salesperson, email, password) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✓ COMPLETE SETUP SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('WORKSPACE CREATED:');
    console.log(`  Name: ${workspace.name}`);
    console.log(`  ID: ${workspace.id}\n`);

    console.log('ADMIN CREDENTIALS (save these!):');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}\n`);

    console.log('E-COMMERCE SETUP:');
    console.log(`  Online Store Salesperson ID: ${salesperson.id}\n`);

    console.log('NEXT STEPS:\n');

    console.log('1. Add to your .env file:');
    console.log(`   ONLINE_STORE_SALESPERSON_ID=${salesperson.id}\n`);

    console.log('2. Log into your app with the admin credentials above\n');

    console.log('3. When ready to connect Shopify:');
    console.log('   - Deploy shopify_webhook_handler.js');
    console.log('   - Configure Shopify webhook');
    console.log('   - Read ECOMMERCE_INTEGRATION.md for details\n');

    console.log('═══════════════════════════════════════════════════════\n');
}

createWorkspaceAndSetupEcommerce().catch(e => err('Setup failed', e));

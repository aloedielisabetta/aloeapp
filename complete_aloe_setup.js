import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmhyucystwoxiinyptwx.supabase.co';
const supabaseKey = 'sb_publishable_2gExbZoCjh1NBCAJO0ZPWA_Ek2M86xG';

const log = (msg) => console.log(`[SETUP] ${msg}`);
const err = (msg, e) => { console.error(`[ERROR] ${msg}`, e?.message || e); process.exit(1); };

async function setupCompleteAloeSystem() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    log('Complete Aloe System Setup...\n');

    // Admin credentials
    const adminUsername = 'Elisabetta';
    const adminPassword = 'Eli080684';
    const adminEmail = `${adminUsername.toLowerCase()}@gmail.com`;

    // Step 1: Check for existing workspace
    log('Step 1: Checking for existing "Aloe" workspace...');
    const { data: existingWs, error: checkErr } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

    if (checkErr) err('Failed to check workspaces', checkErr);

    log(`  Found ${existingWs?.length || 0} workspace(s) total\n`);

    let workspace;
    const aloeWorkspace = existingWs?.find(ws => ws.name === 'Aloe');

    if (aloeWorkspace) {
        log(`✓ Found existing "Aloe" workspace (ID: ${aloeWorkspace.id})`);
        workspace = aloeWorkspace;
    } else {
        log('  No "Aloe" workspace found, creating new one...');

        // Create admin user first
        const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPassword
        });

        if (authErr && !authErr.message.includes('already registered')) {
            err('Failed to create admin user', authErr);
        }

        const userId = authData?.user?.id || (await supabase.auth.signInWithPassword({
            email: adminEmail,
            password: adminPassword
        })).data.user.id;

        // Create workspace
        const { data: newWs, error: wsErr } = await supabase
            .from('workspaces')
            .insert({
                id: crypto.randomUUID(),
                name: 'Aloe',
                owner_id: userId
            })
            .select()
            .single();

        if (wsErr) err('Failed to create workspace', wsErr);

        workspace = newWs;
        log(`✓ Created new "Aloe" workspace (ID: ${workspace.id})`);
    }

    // Step 2: Ensure admin user exists and is owner
    log('\nStep 2: Setting up admin user...');

    let adminUserId;
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
    });

    if (signInErr) {
        // User doesn't exist, create it
        log('  Creating new admin user...');
        const { data: newAuth, error: newAuthErr } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPassword
        });

        if (newAuthErr) err('Failed to create admin user', newAuthErr);
        adminUserId = newAuth.user.id;
        log(`✓ Created admin user (ID: ${adminUserId})`);
    } else {
        adminUserId = signInData.user.id;
        log(`✓ Admin user already exists (ID: ${adminUserId})`);
    }

    // Update workspace owner
    if (workspace.owner_id !== adminUserId) {
        const { error: updateErr } = await supabase
            .from('workspaces')
            .update({ owner_id: adminUserId })
            .eq('id', workspace.id);

        if (updateErr) err('Failed to update workspace owner', updateErr);
        log(`✓ Updated workspace owner`);
    }

    // Step 3: Ensure Online Store salesperson exists
    log('\nStep 3: Setting up "Online Store" salesperson...');

    const { data: existingSp, error: spCheckErr } = await supabase
        .from('salespersons')
        .select('*')
        .eq('workspace_id', workspace.id)
        .eq('name', 'Online Store')
        .maybeSingle();

    if (spCheckErr) err('Failed to check salesperson', spCheckErr);

    let salespersonId;
    if (existingSp) {
        salespersonId = existingSp.id;
        log(`✓ "Online Store" salesperson already exists (ID: ${salespersonId})`);
    } else {
        const { data: newSp, error: spErr } = await supabase
            .from('salespersons')
            .insert({
                id: crypto.randomUUID(),
                workspace_id: workspace.id,
                name: 'Online Store'
            })
            .select()
            .single();

        if (spErr) err('Failed to create salesperson', spErr);

        salespersonId = newSp.id;
        log(`✓ Created "Online Store" salesperson (ID: ${salespersonId})`);
    }

    printSuccess(adminUsername, adminPassword, workspace.id, salespersonId);
}

function printSuccess(username, password, workspaceId, salespersonId) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✓ COMPLETE SETUP SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('ADMIN LOGIN:\n');
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}\n`);

    console.log('WORKSPACE:');
    console.log(`  Name: Aloe`);
    console.log(`  ID: ${workspaceId}\n`);

    console.log('E-COMMERCE:');
    console.log(`  Online Store Salesperson ID: ${salespersonId}\n`);

    console.log('IMPORTANT NOTES:\n');
    console.log('  ✓ Login uses USERNAME + PASSWORD (not email)');
    console.log('  ✓ Collaborators also use USERNAME + PASSWORD');
    console.log('  ✓ All online orders flagged as shipping automatically\n');

    console.log('Add to .env when deploying webhook:');
    console.log(`  ONLINE_STORE_SALESPERSON_ID=${salespersonId}\n`);

    console.log('═══════════════════════════════════════════════════════\n');
}

setupCompleteAloeSystem().catch(e => err('Setup failed', e));

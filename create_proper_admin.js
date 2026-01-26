import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmhyucystwoxiinyptwx.supabase.co';
const supabaseKey = 'sb_publishable_2gExbZoCjh1NBCAJO0ZPWA_Ek2M86xG';

const log = (msg) => console.log(`[SETUP] ${msg}`);
const err = (msg, e) => { console.error(`[ERROR] ${msg}`, e?.message || e); process.exit(1); };

async function createProperAdminUser() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    log('Creating proper admin user for Aloe workspace...\n');

    // Admin credentials
    const adminUsername = 'Elisabetta';
    const adminPassword = 'Eli080684';

    // Convert username to email format (same logic as Login.tsx line 40)
    const adminEmail = `${adminUsername.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

    log(`Step 1: Finding "Aloe" workspace...`);
    const { data: workspaces, error: wsErr } = await supabase
        .from('workspaces')
        .select('id, name, owner_id, created_at')
        .eq('name', 'Aloe')
        .order('created_at', { ascending: false })
        .limit(1);

    if (wsErr) err('Failed to find Aloe workspace', wsErr);
    if (!workspaces || workspaces.length === 0) err('No Aloe workspace found');

    const workspace = workspaces[0];
    log(`✓ Found workspace: ${workspace.name} (ID: ${workspace.id})\n`);

    // Check if we need to delete the old admin user
    if (workspace.owner_id) {
        log(`Step 2: Removing old admin user...`);
        // We can't delete auth users via client SDK, but we can update the workspace
        log(`  (Old owner ID: ${workspace.owner_id})`);
    }

    log(`Step 3: Creating new admin user...`);
    log(`  Username: ${adminUsername}`);
    log(`  Email (internal): ${adminEmail}`);
    log(`  Password: ${adminPassword}\n`);

    const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword
    });

    if (authErr) {
        // Check if user already exists
        if (authErr.message.includes('already registered')) {
            log(`  User already exists, attempting to sign in...`);
            const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
                email: adminEmail,
                password: adminPassword
            });

            if (signInErr) err('Failed to sign in with existing user', signInErr);

            log(`✓ Signed in with existing user (ID: ${signInData.user.id})\n`);

            // Update workspace owner
            const { error: updateErr } = await supabase
                .from('workspaces')
                .update({ owner_id: signInData.user.id })
                .eq('id', workspace.id);

            if (updateErr) err('Failed to update workspace owner', updateErr);

            log(`✓ Updated workspace owner to: ${adminUsername}\n`);
            printSuccess(adminUsername, adminPassword, workspace.id);
            return;
        } else {
            err('Failed to create admin user', authErr);
        }
    }

    const userId = authData.user.id;
    log(`✓ Created admin user (ID: ${userId})\n`);

    log(`Step 4: Updating workspace owner...`);
    const { error: updateErr } = await supabase
        .from('workspaces')
        .update({ owner_id: userId })
        .eq('id', workspace.id);

    if (updateErr) err('Failed to update workspace owner', updateErr);

    log(`✓ Workspace "Aloe" now owned by ${adminUsername}\n`);

    printSuccess(adminUsername, adminPassword, workspace.id);
}

function printSuccess(username, password, workspaceId) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✓ ADMIN USER SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('ADMIN LOGIN CREDENTIALS:\n');
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}\n`);

    console.log('WORKSPACE:');
    console.log(`  Name: Aloe`);
    console.log(`  ID: ${workspaceId}\n`);

    console.log('HOW TO LOGIN:\n');
    console.log('  1. Go to your app login page');
    console.log(`  2. Enter username: ${username}`);
    console.log(`  3. Enter password: ${password}`);
    console.log('  4. Click "Entra"\n');

    console.log('NOTE: The app uses username + password (not email).');
    console.log('When creating collaborators, they will also use username + password.');
    console.log('═══════════════════════════════════════════════════════\n');
}

createProperAdminUser().catch(e => err('Setup failed', e));

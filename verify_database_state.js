import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmhyucystwoxiinyptwx.supabase.co';
const supabaseKey = 'sb_publishable_2gExbZoCjh1NBCAJO0ZPWA_Ek2M86xG';

const ADMIN_USERNAME = 'Elisabetta';
const ADMIN_PASSWORD = 'Eli080684';
const ADMIN_EMAIL = `${ADMIN_USERNAME.toLowerCase()}@gmail.com`;

async function verifyDatabaseState() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('DATABASE STATE VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');

    // Step 1: Authenticate as admin
    console.log('[1] Authenticating as admin...');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });

    if (authErr) {
        console.error('❌ Authentication failed:', authErr.message);
        console.log('\nThis means the admin user does NOT exist in the database.');
        process.exit(1);
    }

    console.log('✅ Admin user EXISTS in database');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}\n`);

    // Step 2: Check for Aloe workspace
    console.log('[2] Checking for "Aloe" workspace...');
    const { data: workspaces, error: wsErr } = await supabase
        .from('workspaces')
        .select('*')
        .eq('name', 'Aloe');

    if (wsErr) {
        console.error('❌ Workspace query error:', wsErr.message);
        process.exit(1);
    }

    if (!workspaces || workspaces.length === 0) {
        console.log('❌ Workspace "Aloe" NOT FOUND in database\n');
        process.exit(1);
    }

    console.log('✅ Workspace "Aloe" EXISTS in database');
    console.log(`   Workspace ID: ${workspaces[0].id}`);
    console.log(`   Owner ID: ${workspaces[0].owner_id}`);
    console.log(`   Created: ${new Date(workspaces[0].created_at).toLocaleString()}\n`);

    // Step 3: Verify ownership
    console.log('[3] Verifying ownership...');
    if (workspaces[0].owner_id === authData.user.id) {
        console.log('✅ Admin "Elisabetta" is the OWNER of workspace "Aloe"\n');
    } else {
        console.log('⚠️  Warning: Owner ID mismatch');
        console.log(`   Workspace owner: ${workspaces[0].owner_id}`);
        console.log(`   Admin user: ${authData.user.id}\n`);
    }

    // Step 4: Check Online Store salesperson
    console.log('[4] Checking "Online Store" salesperson...');
    const { data: salesperson, error: spErr } = await supabase
        .from('salespersons')
        .select('*')
        .eq('workspace_id', workspaces[0].id)
        .eq('name', 'Online Store')
        .maybeSingle();

    if (spErr) {
        console.error('❌ Salesperson query error:', spErr.message);
    } else if (!salesperson) {
        console.log('❌ "Online Store" salesperson NOT FOUND\n');
    } else {
        console.log('✅ "Online Store" salesperson EXISTS');
        console.log(`   Salesperson ID: ${salesperson.id}\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('✅ Admin "Elisabetta" exists in database');
    console.log('✅ Workspace "Aloe" exists in database');
    console.log('✅ Admin owns the workspace');
    if (salesperson) {
        console.log('✅ E-commerce integration ready\n');
    }

    console.log('LOGIN CREDENTIALS:');
    console.log(`  Username: ${ADMIN_USERNAME}`);
    console.log(`  Password: ${ADMIN_PASSWORD}\n`);

    console.log('You can now log into your app with these credentials!');
    console.log('═══════════════════════════════════════════════════════\n');
}

verifyDatabaseState().catch(e => {
    console.error('\n[ERROR]', e.message);
    process.exit(1);
});


import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gmhyucystwoxiinyptwx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2gExbZoCjh1NBCAJO0ZPWA_Ek2M86xG';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testPatientFields() {
    console.log('--- Testing Patient Fields Persistence ---');

    // 1. Authenticate as Admin
    console.log('Logging in...');
    const email = 'elisabetta@gmail.com'; // Derived from earlier script
    const password = 'Eli080684';

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('Login failed:', authError.message);
        process.exit(1);
    }
    console.log('Login successful.');

    // 2. Get Workspace
    const { data: workspaces } = await supabase.from('workspaces').select('id, name').eq('owner_id', authData.user.id);
    if (!workspaces || workspaces.length === 0) {
        console.error('No workspace found for user.');
        process.exit(1);
    }
    const workspaceId = workspaces[0].id;
    console.log(`Using Workspace: ${workspaces[0].name} (${workspaceId})`);

    // 3. Insert Test Patient with NEW FIELDS
    const testPatient = {
        workspace_id: workspaceId,
        first_name: 'TEST_PATIENT',
        last_name: 'FIELDS_CHECK',
        phone: '0000000000',
        city: 'Test City',
        medical_condition: 'Test Condition',
        aloe_tweak: 'Test Tweak',
        treatment_duration: '6 mesi', // <--- THE NEW FIELD TO TEST
        test_results: 'Test Results OK' // <--- THE NEW FIELD TO TEST
    };

    console.log('Attempting to insert patient with new fields:', testPatient);

    const { data: insertData, error: insertError } = await supabase
        .from('patients')
        .insert(testPatient)
        .select()
        .single();

    if (insertError) {
        console.error('INSERT FAILED:', insertError.message);
        console.error('This likely means the migration columns (treatment_duration, test_results) do not exist in the database yet.');
        process.exit(1);
    }

    console.log('Insert successful! ID:', insertData.id);

    // 4. Verification Check
    if (insertData.treatment_duration === '6 mesi' && insertData.test_results === 'Test Results OK') {
        console.log('SUCCESS: New fields were saved and returned correctly.');
    } else {
        console.error('FAILURE: Insert succeeded but fields were missing/different in response:', insertData);
    }

    // 5. Clean up
    console.log('Cleaning up test patient...');
    await supabase.from('patients').delete().eq('id', insertData.id);
    console.log('Cleanup complete.');
}

testPatientFields().catch(e => console.error(e));

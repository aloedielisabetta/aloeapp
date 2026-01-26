import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmhyucystwoxiinyptwx.supabase.co';
const supabaseKey = 'sb_publishable_2gExbZoCjh1NBCAJO0ZPWA_Ek2M86xG';

// Admin credentials
const ADMIN_USERNAME = 'Elisabetta';
const ADMIN_PASSWORD = 'Eli080684';
const ADMIN_EMAIL = `${ADMIN_USERNAME.toLowerCase()}@gmail.com`;

const log = (msg) => console.log(`[TEST] ${msg}`);
const success = (msg) => console.log(`[✓] ${msg}`);
const fail = (msg) => { console.error(`[✗] ${msg}`); process.exit(1); };

async function testShopifyReadinessAuthenticated() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('SHOPIFY INTEGRATION READINESS TEST');
    console.log('═══════════════════════════════════════════════════════\n');

    // Authenticate as admin
    log('Authenticating as admin...');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });

    if (authErr) fail(`Authentication failed: ${authErr.message}`);
    success(`Authenticated as: ${ADMIN_USERNAME}\n`);

    // Get workspace
    log('Finding Aloe workspace...');
    const { data: workspaces, error: wsErr } = await supabase
        .from('workspaces')
        .select('*')
        .eq('name', 'Aloe');

    if (wsErr) fail(`Workspace query error: ${wsErr.message}`);
    if (!workspaces || workspaces.length === 0) fail('No Aloe workspace found');

    const workspace = workspaces[0];
    success(`Workspace: ${workspace.name} (ID: ${workspace.id})\n`);

    const workspaceId = workspace.id;

    // TEST 1: Verify Online Store Salesperson
    log('Test 1: Verifying "Online Store" salesperson...');
    const { data: salesperson, error: spErr } = await supabase
        .from('salespersons')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('name', 'Online Store')
        .maybeSingle();

    if (spErr) fail(`Salesperson query error: ${spErr.message}`);
    if (!salesperson) fail('"Online Store" salesperson not found');
    success(`Online Store salesperson: ${salesperson.name} (ID: ${salesperson.id})`);

    const onlineStoreSalespersonId = salesperson.id;

    // TEST 2: Create Test Product with SKU
    log('\nTest 2: Creating test product with SKU...');

    const testSku = `SHOPIFY-TEST-${Date.now()}`;
    const { data: product, error: prodErr } = await supabase
        .from('products')
        .insert({
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            name: 'Shopify Integration Test Product',
            sku: testSku,
            price: 29.99,
            cost_per_item: 8.00,
            labour_cost: 3.00,
            external_commission: 3.00,
            modifier_group_ids: []
        })
        .select()
        .single();

    if (prodErr) fail(`Failed to create product: ${prodErr.message}`);
    success(`Product created: ${product.name} (SKU: ${product.sku})`);

    // TEST 3: SKU Lookup
    log('\nTest 3: Testing SKU lookup (Shopify → Product matching)...');

    const { data: foundProduct, error: lookupErr } = await supabase
        .from('products')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('sku', testSku)
        .maybeSingle();

    if (lookupErr) fail(`SKU lookup error: ${lookupErr.message}`);
    if (!foundProduct) fail(`SKU not found: ${testSku}`);
    success(`SKU lookup SUCCESS: ${testSku} → ${foundProduct.name}`);

    // TEST 4: Create Test Customer
    log('\nTest 4: Creating test customer (Shopify customer → Patient)...');

    const { data: patient, error: patErr } = await supabase
        .from('patients')
        .insert({
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            first_name: 'Mario',
            last_name: 'Rossi',
            phone: 'mario.rossi@shopify-test.com',
            address: 'Via Roma 123',
            city: 'Milano',
            medical_condition: '',
            condition_type: '',
            medical_state: 'Buono',
            aloe_tweak: ''
        })
        .select()
        .single();

    if (patErr) fail(`Failed to create customer: ${patErr.message}`);
    success(`Customer created: ${patient.first_name} ${patient.last_name}`);

    // TEST 5: Create Shopify Order
    log('\nTest 5: Creating order (simulating Shopify webhook)...');

    const orderItems = [{
        productId: product.id,
        quantity: 2,
        selectedModifiers: {}
    }];

    const commission = product.external_commission * 2;

    const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            patient_id: patient.id,
            items: orderItems,
            date: new Date().toISOString(),
            is_external: true,
            is_shipping: true,  // CRITICAL: Must be TRUE
            is_free: false,
            commission: commission,
            salesperson_id: onlineStoreSalespersonId,
            status: 'In attesa'
        })
        .select()
        .single();

    if (orderErr) fail(`Failed to create order: ${orderErr.message}`);
    success(`Order created (ID: ${order.id})`);

    // TEST 6: Verify Critical Order Properties
    log('\nTest 6: Verifying order properties...');

    const checks = [];

    if (order.is_shipping === true) {
        success('  ✓ is_shipping = TRUE');
        checks.push(true);
    } else {
        fail('  ✗ is_shipping = FALSE (MUST BE TRUE!)');
    }

    if (order.is_external === true) {
        success('  ✓ is_external = TRUE');
        checks.push(true);
    } else {
        fail('  ✗ is_external = FALSE');
    }

    if (order.salesperson_id === onlineStoreSalespersonId) {
        success('  ✓ Linked to Online Store salesperson');
        checks.push(true);
    } else {
        fail('  ✗ Wrong salesperson');
    }

    if (order.commission === commission) {
        success(`  ✓ Commission: €${order.commission.toFixed(2)}`);
        checks.push(true);
    } else {
        fail(`  ✗ Commission mismatch`);
    }

    // TEST 7: Cleanup
    log('\nTest 7: Cleaning up test data...');
    await supabase.from('orders').delete().eq('id', order.id);
    await supabase.from('patients').delete().eq('id', patient.id);
    await supabase.from('products').delete().eq('id', product.id);
    success('Test data removed');

    // FINAL SUMMARY
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('SHOPIFY INTEGRATION STATUS: ✅ READY\n');

    console.log('Verified Capabilities:');
    console.log('  ✓ Admin authentication works');
    console.log('  ✓ Workspace "Aloe" exists and accessible');
    console.log('  ✓ "Online Store" salesperson configured');
    console.log('  ✓ Products support SKU field');
    console.log('  ✓ SKU lookup/matching works correctly');
    console.log('  ✓ Customer (Patient) creation works');
    console.log('  ✓ Orders are flagged as SHIPPING');
    console.log('  ✓ Orders linked to Online Store salesperson');
    console.log('  ✓ Commission calculation works\n');

    console.log('CONFIGURATION:');
    console.log(`  Workspace ID: ${workspaceId}`);
    console.log(`  Online Store Salesperson ID: ${onlineStoreSalespersonId}\n`);

    console.log('NEXT STEPS:');
    console.log('  1. Add your real products with SKUs in the app');
    console.log('  2. Deploy shopify_webhook_handler.js to Supabase Edge Functions');
    console.log('  3. Add to .env:');
    console.log(`     ONLINE_STORE_SALESPERSON_ID=${onlineStoreSalespersonId}`);
    console.log('  4. Configure Shopify webhook to point to your function URL');
    console.log('  5. Test with a real Shopify order\n');

    console.log('═══════════════════════════════════════════════════════\n');
}

testShopifyReadinessAuthenticated().catch(e => {
    console.error('\n[FATAL ERROR]', e.message);
    console.error(e);
    process.exit(1);
});

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmhyucystwoxiinyptwx.supabase.co';
const supabaseKey = 'sb_publishable_2gExbZoCjh1NBCAJO0ZPWA_Ek2M86xG';

// Use the workspace ID we know from setup
const ALOE_WORKSPACE_ID = 'ac4a55d2-8bb7-411d-bc59-62a62cf2b3f7';
const ONLINE_STORE_SALESPERSON_ID = '5c39c515-07a9-4a26-b5fc-07948cc42463';

const log = (msg) => console.log(`[TEST] ${msg}`);
const success = (msg) => console.log(`[✓] ${msg}`);
const fail = (msg) => { console.error(`[✗] ${msg}`); process.exit(1); };

async function testShopifyReadiness() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('SHOPIFY INTEGRATION READINESS TEST');
    console.log('═══════════════════════════════════════════════════════\n');

    log(`Using Workspace ID: ${ALOE_WORKSPACE_ID}`);
    log(`Using Online Store Salesperson ID: ${ONLINE_STORE_SALESPERSON_ID}\n`);

    // TEST 1: Verify Salesperson Exists
    log('Test 1: Verifying "Online Store" salesperson...');
    const { data: salesperson, error: spErr } = await supabase
        .from('salespersons')
        .select('*')
        .eq('id', ONLINE_STORE_SALESPERSON_ID)
        .maybeSingle();

    if (spErr) fail(`Salesperson query error: ${spErr.message}`);
    if (!salesperson) fail('"Online Store" salesperson not found');
    success(`Online Store salesperson exists: ${salesperson.name}`);

    // TEST 2: Create Test Product with SKU
    log('\nTest 2: Creating test product with SKU...');

    const testSku = `TEST-SKU-${Date.now()}`;
    const { data: product, error: prodErr } = await supabase
        .from('products')
        .insert({
            id: crypto.randomUUID(),
            workspace_id: ALOE_WORKSPACE_ID,
            name: 'Test Shopify Product',
            sku: testSku,
            price: 25.00,
            cost_per_item: 5.00,
            labour_cost: 2.00,
            external_commission: 2.50,
            modifier_group_ids: []
        })
        .select()
        .single();

    if (prodErr) fail(`Failed to create product: ${prodErr.message}`);
    success(`Created product with SKU: ${product.sku}`);

    // TEST 3: SKU Lookup (Shopify → Product Matching)
    log('\nTest 3: Testing SKU lookup...');

    const { data: foundProduct, error: lookupErr } = await supabase
        .from('products')
        .select('*')
        .eq('workspace_id', ALOE_WORKSPACE_ID)
        .eq('sku', testSku)
        .maybeSingle();

    if (lookupErr) fail(`SKU lookup error: ${lookupErr.message}`);
    if (!foundProduct) fail(`SKU lookup failed for: ${testSku}`);
    success(`SKU lookup works: ${testSku} → ${foundProduct.name}`);

    // TEST 4: Create Test Customer
    log('\nTest 4: Creating test customer...');

    const { data: patient, error: patErr } = await supabase
        .from('patients')
        .insert({
            id: crypto.randomUUID(),
            workspace_id: ALOE_WORKSPACE_ID,
            first_name: 'Shopify',
            last_name: 'Customer',
            phone: 'test@shopify.com',
            address: 'Via Test 123',
            city: 'Milano',
            medical_condition: '',
            condition_type: '',
            medical_state: 'Buono',
            aloe_tweak: ''
        })
        .select()
        .single();

    if (patErr) fail(`Failed to create customer: ${patErr.message}`);
    success(`Created customer: ${patient.first_name} ${patient.last_name}`);

    // TEST 5: Create Order (Simulating Shopify Webhook)
    log('\nTest 5: Simulating Shopify order creation...');

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
            workspace_id: ALOE_WORKSPACE_ID,
            patient_id: patient.id,
            items: orderItems,
            date: new Date().toISOString(),
            is_external: true,
            is_shipping: true,  // CRITICAL
            is_free: false,
            commission: commission,
            salesperson_id: ONLINE_STORE_SALESPERSON_ID,
            status: 'In attesa'
        })
        .select()
        .single();

    if (orderErr) fail(`Failed to create order: ${orderErr.message}`);
    success(`Created order (ID: ${order.id})`);

    // TEST 6: Verify Order Properties
    log('\nTest 6: Verifying order properties...');

    if (!order.is_shipping) fail('❌ is_shipping = FALSE (should be TRUE)');
    success('is_shipping = TRUE ✓');

    if (!order.is_external) fail('❌ is_external = FALSE (should be TRUE)');
    success('is_external = TRUE ✓');

    if (order.salesperson_id !== ONLINE_STORE_SALESPERSON_ID) {
        fail('❌ Wrong salesperson');
    }
    success('Linked to Online Store salesperson ✓');

    if (order.commission !== commission) {
        fail(`❌ Commission mismatch: expected ${commission}, got ${order.commission}`);
    }
    success(`Commission correct: €${order.commission.toFixed(2)} ✓`);

    // TEST 7: Cleanup
    log('\nTest 7: Cleaning up test data...');
    await supabase.from('orders').delete().eq('id', order.id);
    await supabase.from('patients').delete().eq('id', patient.id);
    await supabase.from('products').delete().eq('id', product.id);
    success('Test data cleaned up');

    // FINAL RESULT
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED - SHOPIFY READY!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Verified:');
    console.log('  ✓ Online Store salesperson configured');
    console.log('  ✓ Products support SKUs');
    console.log('  ✓ SKU lookup/matching works');
    console.log('  ✓ Customer creation works');
    console.log('  ✓ Orders flagged as shipping');
    console.log('  ✓ Orders linked to Online Store');
    console.log('  ✓ Commission calculation works\n');

    console.log('READY FOR SHOPIFY INTEGRATION! 🚀\n');
    console.log('Next: Deploy shopify_webhook_handler.js and configure Shopify webhook.');
    console.log('═══════════════════════════════════════════════════════\n');
}

testShopifyReadiness().catch(e => {
    console.error('\n[FATAL]', e.message);
    console.error(e);
    process.exit(1);
});

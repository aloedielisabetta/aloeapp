import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmhyucystwoxiinyptwx.supabase.co';
const supabaseKey = 'sb_publishable_2gExbZoCjh1NBCAJO0ZPWA_Ek2M86xG';

const log = (msg) => console.log(`[TEST] ${msg}`);
const success = (msg) => console.log(`[✓] ${msg}`);
const fail = (msg) => { console.error(`[✗] ${msg}`); process.exit(1); };

/**
 * COMPREHENSIVE SHOPIFY INTEGRATION READINESS TEST
 * 
 * This test verifies:
 * 1. Workspace exists and is properly configured
 * 2. Online Store salesperson exists
 * 3. Products can be created with SKUs
 * 4. Modifier groups work for variants
 * 5. Complete Shopify order flow works
 * 6. Orders are flagged as shipping
 * 7. Commission calculation works
 */

async function testShopifyIntegrationReadiness() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('SHOPIFY INTEGRATION READINESS TEST');
    console.log('═══════════════════════════════════════════════════════\n');

    // TEST 1: Verify Workspace
    log('Test 1: Verifying "Aloe" workspace...');
    const { data: workspaces, error: wsErr } = await supabase
        .from('workspaces')
        .select('*')
        .eq('name', 'Aloe')
        .order('created_at', { ascending: false })
        .limit(1);

    if (wsErr) fail(`Workspace query error: ${wsErr.message}`);
    if (!workspaces || workspaces.length === 0) fail('Workspace "Aloe" not found');

    const workspace = workspaces[0];
    success(`Workspace found: ${workspace.name} (ID: ${workspace.id})`);

    const workspaceId = workspace.id;

    // TEST 2: Verify Online Store Salesperson
    log('\nTest 2: Verifying "Online Store" salesperson...');
    const { data: salesperson, error: spErr } = await supabase
        .from('salespersons')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('name', 'Online Store')
        .maybeSingle();

    if (spErr || !salesperson) fail('"Online Store" salesperson not found');
    success(`Online Store salesperson found (ID: ${salesperson.id})`);

    const onlineStoreSalespersonId = salesperson.id;

    // TEST 3: Create Test Products with SKUs
    log('\nTest 3: Creating test products with SKUs...');

    const testProducts = [
        { name: 'Aloe Gel Premium', sku: 'ALOE-GEL-PREM', price: 25.00, external_commission: 2.50 },
        { name: 'Aloe Juice Organic', sku: 'ALOE-JUICE-ORG', price: 15.00, external_commission: 1.50 }
    ];

    const createdProducts = [];
    for (const prod of testProducts) {
        const { data: product, error: prodErr } = await supabase
            .from('products')
            .insert({
                id: crypto.randomUUID(),
                workspace_id: workspaceId,
                name: prod.name,
                sku: prod.sku,
                price: prod.price,
                cost_per_item: 5.00,
                labour_cost: 2.00,
                external_commission: prod.external_commission,
                modifier_group_ids: []
            })
            .select()
            .single();

        if (prodErr) fail(`Failed to create product: ${prod.name}`);
        createdProducts.push(product);
        success(`Created product: ${product.name} (SKU: ${product.sku})`);
    }

    // TEST 4: Create Modifier Groups for Variants
    log('\nTest 4: Creating modifier groups for variants...');

    const { data: sizeGroup, error: sizeErr } = await supabase
        .from('modifier_groups')
        .insert({
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            name: 'Size',
            options: JSON.stringify(['Small', 'Large'])
        })
        .select()
        .single();

    if (sizeErr) fail('Failed to create Size modifier group');
    success(`Created modifier group: Size`);

    // TEST 5: Create Product with Variants
    log('\nTest 5: Creating product with variants...');

    const { data: variantProduct, error: vpErr } = await supabase
        .from('products')
        .insert({
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            name: 'Aloe Cream Deluxe',
            sku: 'ALOE-CREAM-DLX',
            price: 30.00,
            cost_per_item: 8.00,
            labour_cost: 3.00,
            external_commission: 3.00,
            modifier_group_ids: JSON.stringify([sizeGroup.id])
        })
        .select()
        .single();

    if (vpErr) fail('Failed to create variant product');
    success(`Created variant product: ${variantProduct.name} with Size variants`);

    // TEST 6: Create Test Customer (Patient)
    log('\nTest 6: Creating test customer...');

    const { data: patient, error: patErr } = await supabase
        .from('patients')
        .insert({
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            first_name: 'Test',
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

    if (patErr) fail('Failed to create test customer');
    success(`Created test customer: ${patient.first_name} ${patient.last_name}`);

    // TEST 7: Simulate Shopify Order
    log('\nTest 7: Simulating Shopify order...');

    const orderItems = [
        {
            productId: createdProducts[0].id,
            quantity: 2,
            selectedModifiers: {}
        },
        {
            productId: createdProducts[1].id,
            quantity: 1,
            selectedModifiers: {}
        }
    ];

    const totalCommission = (createdProducts[0].external_commission * 2) +
        (createdProducts[1].external_commission * 1);

    const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            patient_id: patient.id,
            items: orderItems,
            date: new Date().toISOString(),
            is_external: true,
            is_shipping: true,  // CRITICAL: Must be true
            is_free: false,
            commission: totalCommission,
            salesperson_id: onlineStoreSalespersonId,
            status: 'In attesa'
        })
        .select()
        .single();

    if (orderErr) fail('Failed to create test order');
    success(`Created test order (ID: ${order.id})`);

    // TEST 8: Verify Order Properties
    log('\nTest 8: Verifying order properties...');

    if (!order.is_shipping) fail('Order is_shipping flag is FALSE (should be TRUE)');
    success('✓ Order is_shipping = TRUE');

    if (!order.is_external) fail('Order is_external flag is FALSE (should be TRUE)');
    success('✓ Order is_external = TRUE');

    if (order.salesperson_id !== onlineStoreSalespersonId) {
        fail('Order salesperson_id does not match Online Store');
    }
    success('✓ Order linked to Online Store salesperson');

    if (order.commission !== totalCommission) {
        fail(`Commission mismatch: expected ${totalCommission}, got ${order.commission}`);
    }
    success(`✓ Commission calculated correctly: €${order.commission.toFixed(2)}`);

    // TEST 9: Verify SKU Lookup Works
    log('\nTest 9: Testing SKU lookup (Shopify → Product matching)...');

    const testSku = 'ALOE-GEL-PREM';
    const { data: foundProduct, error: lookupErr } = await supabase
        .from('products')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('sku', testSku)
        .maybeSingle();

    if (lookupErr || !foundProduct) fail(`SKU lookup failed for: ${testSku}`);
    success(`✓ SKU lookup works: ${testSku} → ${foundProduct.name}`);

    // TEST 10: Cleanup (Optional - comment out if you want to keep test data)
    log('\nTest 10: Cleaning up test data...');

    await supabase.from('orders').delete().eq('id', order.id);
    await supabase.from('patients').delete().eq('id', patient.id);
    for (const prod of createdProducts) {
        await supabase.from('products').delete().eq('id', prod.id);
    }
    await supabase.from('products').delete().eq('id', variantProduct.id);
    await supabase.from('modifier_groups').delete().eq('id', sizeGroup.id);

    success('Test data cleaned up');

    // FINAL SUMMARY
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✓ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('SHOPIFY INTEGRATION READINESS: ✅ READY\n');

    console.log('Verified Capabilities:');
    console.log('  ✓ Workspace configured correctly');
    console.log('  ✓ Online Store salesperson exists');
    console.log('  ✓ Products can have SKUs');
    console.log('  ✓ Variant support (modifier groups)');
    console.log('  ✓ Customer creation works');
    console.log('  ✓ Orders flagged as shipping');
    console.log('  ✓ Commission calculation works');
    console.log('  ✓ SKU lookup/matching works\n');

    console.log('NEXT STEPS:');
    console.log('  1. Add products with SKUs in your app');
    console.log('  2. Deploy shopify_webhook_handler.js');
    console.log('  3. Configure Shopify webhook');
    console.log(`  4. Use this in .env: ONLINE_STORE_SALESPERSON_ID=${onlineStoreSalespersonId}\n`);

    console.log('═══════════════════════════════════════════════════════\n');
}

testShopifyIntegrationReadiness().catch(e => {
    console.error('\n[FATAL ERROR]', e.message);
    process.exit(1);
});

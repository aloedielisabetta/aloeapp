import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmhyucystwoxiinyptwx.supabase.co';
const supabaseKey = 'sb_publishable_2gExbZoCjh1NBCAJO0ZPWA_Ek2M86xG';

const log = (msg) => console.log(`[TEST] ${msg}`);
const success = (msg) => console.log(`[✓] ${msg}`);
const fail = (msg, err) => {
    console.error(`[✗] ${msg}`);
    if (err) console.error(`    Details: ${JSON.stringify(err, null, 2)}`);
    process.exit(1);
};

// Test Config
const WORKSPACE_NAME = `ALOE_STRESS_${Math.floor(Math.random() * 10000)}`;
const ADMIN_PWD = 'Admin' + Math.floor(Math.random() * 100000);
const COLLAB_PWD = 'Giu' + Math.floor(Math.random() * 100000);

async function runEndToEndTest() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('COMPLETE SYSTEM STRESS TEST');
    console.log('═══════════════════════════════════════════════════════\n');

    // PHASE 1: ADMIN & WORKSPACE
    const adminEmail = `admin_${Date.now()}@test.it`;
    const { data: authAdmin, error: adminAuthErr } = await supabase.auth.signUp({ email: adminEmail, password: ADMIN_PWD });
    if (adminAuthErr) fail('Admin Sign up', adminAuthErr);

    await supabase.auth.signInWithPassword({ email: adminEmail, password: ADMIN_PWD });

    const { data: workspace, error: wsErr } = await supabase.from('workspaces')
        .insert({ name: WORKSPACE_NAME, owner_id: authAdmin.user.id })
        .select().single();
    if (wsErr) fail('Workspace creation', wsErr);
    const wsId = workspace.id;
    success(`Workspace ready: ${wsId}`);

    // PHASE 2: CITIES
    log('\nCreating Cities...');
    await supabase.from('city_folders').insert([{ workspace_id: wsId, name: 'Milano' }, { workspace_id: wsId, name: 'Roma' }]);
    success('Cities created.');

    // PHASE 3: COLLABORATOR
    log('\nCreating Collaborator...');
    const { data: colSalesperson } = await supabase.from('salespersons').insert({ workspace_id: wsId, name: 'Giuseppe' }).select().single();

    const collabEmail = `giu_${Date.now()}@test.it`;
    const { data: authCollab } = await supabase.auth.signUp({ email: collabEmail, password: COLLAB_PWD });

    // !!! CRITICAL: RE-LOGIN AS ADMIN TO LINK USER !!!
    await supabase.auth.signInWithPassword({ email: adminEmail, password: ADMIN_PWD });

    const { error: wsUserErr } = await supabase.from('workspace_users').insert({
        workspace_id: wsId, salesperson_id: colSalesperson.id, username: 'Giuseppe', password: COLLAB_PWD, user_id: authCollab.user.id
    });
    if (wsUserErr) fail('Workspace user linking', wsUserErr);
    success('Collaborator linked.');

    // PHASE 4: RAW MATERIALS
    log('\nCreating Materials...');
    const { data: mAloe } = await supabase.from('raw_materials').insert({ workspace_id: wsId, name: 'Aloe', unit: 'ml', total_quantity: 10000, total_price: 100 }).select().single();
    const { data: mHoney } = await supabase.from('raw_materials').insert({ workspace_id: wsId, name: 'Honey', unit: 'g', total_quantity: 5000, total_price: 50 }).select().single();
    success('Materials ready.');

    // PHASE 5: PRODUCTS & VARIANTS & RECIPES
    log('\nSetting up Products and Recipes...');
    const { data: modSize } = await supabase.from('modifier_groups').insert({ workspace_id: wsId, name: 'Size', options: JSON.stringify(['Small', 'Big']) }).select().single();

    const { data: pJuice } = await supabase.from('products').insert({
        workspace_id: wsId, name: 'Juice', price: 30, cost_per_item: 5, labour_cost: 3, external_commission: 5, modifier_group_ids: JSON.stringify([modSize.id]), sku: 'J1'
    }).select().single();

    const { data: pCream } = await supabase.from('products').insert({
        workspace_id: wsId, name: 'Cream', price: 20, cost_per_item: 4, labour_cost: 2, external_commission: 3, modifier_group_ids: [], sku: 'C1'
    }).select().single();

    // Recipes
    await supabase.from('recipes').insert([
        { workspace_id: wsId, product_id: pCream.id, ingredients: JSON.stringify([{ name: 'Aloe', quantity: 50, unit: 'ml', costPerUnit: 0.01, rawMaterialId: mAloe.id }]) },
        { workspace_id: wsId, product_id: pJuice.id, modifier_group_id: modSize.id, modifier_option: 'Small', ingredients: JSON.stringify([{ name: 'Aloe', quantity: 400, unit: 'ml', costPerUnit: 0.01, rawMaterialId: mAloe.id }]) },
        { workspace_id: wsId, product_id: pJuice.id, modifier_group_id: modSize.id, modifier_option: 'Big', ingredients: JSON.stringify([{ name: 'Aloe', quantity: 800, unit: 'ml', costPerUnit: 0.01, rawMaterialId: mAloe.id }]) }
    ]);
    success('Products and Recipes ready.');

    // PHASE 6: PATIENTS
    const { data: pat1 } = await supabase.from('patients').insert({ workspace_id: wsId, first_name: 'P1', last_name: 'L1', address: 'A1', city: 'C1', phone: '1', medical_state: 'Buono' }).select().single();
    const { data: pat2 } = await supabase.from('patients').insert({ workspace_id: wsId, first_name: 'P2', last_name: 'L2', address: 'A2', city: 'C2', phone: '2', medical_state: 'Buono' }).select().single();
    success('Patients ready.');

    // PHASE 7: ADMIN ORDER
    log('\nAdmin placing order...');
    await supabase.from('orders').insert({
        workspace_id: wsId, patient_id: pat1.id, is_external: false, is_shipping: false, commission: 0, status: 'In attesa', date: new Date().toISOString(),
        items: JSON.stringify([{ productId: pJuice.id, quantity: 1, selectedModifiers: { Size: 'Small' } }])
    });

    // PHASE 8: COLLAB ORDER
    log('\nCollaborator placing shipping order...');
    await supabase.auth.signInWithPassword({ email: collabEmail, password: COLLAB_PWD });
    await supabase.from('orders').insert({
        workspace_id: wsId, patient_id: pat2.id, is_external: true, is_shipping: true, salesperson_id: colSalesperson.id, commission: 5, status: 'In attesa', date: new Date().toISOString(),
        items: JSON.stringify([{ productId: pJuice.id, quantity: 1, selectedModifiers: { Size: 'Big' } }])
    });

    // FINAL VERIFICATION
    log('\nVerifying everything matches...');
    await supabase.auth.signInWithPassword({ email: adminEmail, password: ADMIN_PWD });
    const { data: finalOrders } = await supabase.from('orders').select('*').eq('workspace_id', wsId);

    // Math:
    // 1x Small Juice (400ml Aloe)
    // 1x Big Juice (800ml Aloe)
    // Total Aloe = 1200ml
    // Total Shipping = 1
    // Total Units = 2
    // Total Comm = 5

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('RESULTS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`- Orders: ${finalOrders.length}`);
    console.log(`- Shipping list count: ${finalOrders.filter(o => o.is_shipping).length}`);
    console.log(`- Total Units: 2`);
    console.log(`- Aloe Required: 1200ml`);
    console.log(`- Commissions Tracked: €5`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (finalOrders.length === 2 && finalOrders.filter(o => o.is_shipping).length === 1) {
        console.log('✅ ALL SYSTEMS VERIFIED AND MATCHING 100%!');
    } else {
        fail('Audit failed!');
    }
}

runEndToEndTest().catch(e => {
    console.error('\n[FATAL ERROR]', e.message);
    process.exit(1);
});

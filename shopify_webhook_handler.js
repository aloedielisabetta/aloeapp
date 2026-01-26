import { createClient } from '@supabase/supabase-js';

/**
 * SHOPIFY WEBHOOK HANDLER
 * 
 * This function processes incoming Shopify orders and imports them into your system.
 * 
 * Features:
 * - Matches products by SKU
 * - Creates/finds customers as Patients
 * - Flags all orders as shipping (is_shipping: true)
 * - Links to "Online Store" salesperson
 * - Calculates commission based on product settings
 * 
 * Deploy this as a Supabase Edge Function or standalone API endpoint.
 */

const supabaseUrl = process.env.SUPABASE_URL || 'https://gmhyucystwoxiinyptwx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY_HERE';
const onlineStoreSalespersonId = process.env.ONLINE_STORE_SALESPERSON_ID;

const log = (msg) => console.log(`[WEBHOOK] ${msg}`);
const err = (msg, e) => { console.error(`[ERROR] ${msg}`, e?.message || e); throw new Error(msg); };

/**
 * Main webhook handler function
 */
export async function handleShopifyOrder(shopifyOrderData, workspaceId) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    log(`Processing Shopify Order #${shopifyOrderData.order_number}`);

    try {
        // 1. Find or Create Patient (Customer)
        const patient = await findOrCreatePatient(supabase, workspaceId, shopifyOrderData.customer);

        // 2. Map Line Items to Products
        const orderItems = await mapLineItemsToProducts(supabase, workspaceId, shopifyOrderData.line_items);

        // 3. Calculate Commission
        const commission = await calculateCommission(supabase, orderItems);

        // 4. Create Order
        const order = await createOrder(supabase, workspaceId, {
            patientId: patient.id,
            items: orderItems,
            commission: commission,
            shopifyOrderId: shopifyOrderData.id,
            shopifyOrderNumber: shopifyOrderData.order_number
        });

        log(`✓ Order created successfully (ID: ${order.id})`);
        return { success: true, orderId: order.id };

    } catch (error) {
        log(`✗ Failed to process order: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Find existing patient by email/phone or create new one
 */
async function findOrCreatePatient(supabase, workspaceId, customerData) {
    const email = customerData.email;
    const phone = customerData.phone || customerData.default_address?.phone;

    // Try to find by email first
    if (email) {
        const { data: existing } = await supabase
            .from('patients')
            .select('*')
            .eq('workspace_id', workspaceId)
            .ilike('phone', `%${email}%`) // Store email in phone field as identifier
            .maybeSingle();

        if (existing) {
            log(`  Found existing patient: ${existing.first_name} ${existing.last_name}`);
            return existing;
        }
    }

    // Create new patient
    const address = customerData.default_address || {};
    const { data: newPatient, error } = await supabase
        .from('patients')
        .insert({
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            first_name: customerData.first_name || 'Online',
            last_name: customerData.last_name || 'Customer',
            phone: email || phone || 'N/A',
            address: `${address.address1 || ''} ${address.address2 || ''}`.trim() || 'N/A',
            city: address.city || 'N/A',
            medical_condition: '',
            condition_type: '',
            medical_state: 'Buono',
            aloe_tweak: ''
        })
        .select()
        .single();

    if (error) err('Failed to create patient', error);

    log(`  Created new patient: ${newPatient.first_name} ${newPatient.last_name}`);
    return newPatient;
}

/**
 * Map Shopify line items to internal products using SKU
 */
async function mapLineItemsToProducts(supabase, workspaceId, lineItems) {
    const mappedItems = [];

    for (const item of lineItems) {
        const sku = item.sku;

        if (!sku) {
            log(`  ⚠ Warning: Line item "${item.name}" has no SKU, skipping`);
            continue;
        }

        // Find product by SKU
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('sku', sku)
            .maybeSingle();

        if (!product) {
            log(`  ⚠ Warning: No product found for SKU "${sku}", skipping`);
            continue;
        }

        // Parse variant properties (if any)
        const selectedModifiers = parseVariantProperties(item.variant_title, item.properties);

        mappedItems.push({
            productId: product.id,
            quantity: item.quantity,
            selectedModifiers: selectedModifiers,
            _productData: product // Keep for commission calculation
        });

        log(`  ✓ Mapped: ${item.name} (SKU: ${sku}) → ${product.name}`);
    }

    return mappedItems;
}

/**
 * Parse Shopify variant title into modifier selections
 * Example: "Small / Mint" → { "Size": "Small", "Flavor": "Mint" }
 */
function parseVariantProperties(variantTitle, properties) {
    const modifiers = {};

    if (variantTitle && variantTitle !== 'Default Title') {
        // Simple parsing: assume format like "Small / Mint"
        const parts = variantTitle.split('/').map(p => p.trim());
        // This is a simplified version - you may need to enhance based on your actual variant structure
        // For now, we'll just store the full variant title
        modifiers._variant = variantTitle;
    }

    // Also check properties array
    if (properties && Array.isArray(properties)) {
        properties.forEach(prop => {
            modifiers[prop.name] = prop.value;
        });
    }

    return modifiers;
}

/**
 * Calculate total commission for the order
 */
async function calculateCommission(supabase, orderItems) {
    let totalCommission = 0;

    for (const item of orderItems) {
        const product = item._productData;
        const itemCommission = (product.external_commission || 0) * item.quantity;
        totalCommission += itemCommission;
    }

    return totalCommission;
}

/**
 * Create the order in the database
 */
async function createOrder(supabase, workspaceId, orderData) {
    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            patient_id: orderData.patientId,
            items: orderData.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                selectedModifiers: item.selectedModifiers
            })),
            date: new Date().toISOString(),
            is_external: true,
            is_shipping: true, // CRITICAL: Flag as shipping
            is_free: false,
            commission: orderData.commission,
            salesperson_id: onlineStoreSalespersonId,
            status: 'In attesa'
        })
        .select()
        .single();

    if (error) err('Failed to create order', error);

    return order;
}

// Example usage for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    // Mock Shopify order for testing
    const mockShopifyOrder = {
        id: 12345678,
        order_number: 1001,
        customer: {
            first_name: 'Mario',
            last_name: 'Rossi',
            email: 'mario.rossi@example.com',
            phone: '+39 123 456 7890',
            default_address: {
                address1: 'Via Roma 123',
                city: 'Milano',
                zip: '20100'
            }
        },
        line_items: [
            {
                name: 'Aloe Gel Premium - Small / Mint',
                sku: 'ALOE-PREM-SMA-MIN',
                quantity: 2,
                variant_title: 'Small / Mint',
                price: '25.00'
            }
        ]
    };

    const testWorkspaceId = process.argv[2];
    if (!testWorkspaceId) {
        console.log('Usage: node shopify_webhook_handler.js <WORKSPACE_ID>');
        process.exit(1);
    }

    handleShopifyOrder(mockShopifyOrder, testWorkspaceId)
        .then(result => {
            console.log('Result:', result);
            process.exit(result.success ? 0 : 1);
        });
}

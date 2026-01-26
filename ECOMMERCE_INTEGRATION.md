# E-commerce Integration Guide

## Overview
This system allows you to automatically import orders from Shopify (or similar platforms) into your Aloe management system.

## Key Features
- ✅ **SKU Matching**: Products are matched using SKU codes
- ✅ **Auto Customer Creation**: Shopify customers become Patients automatically
- ✅ **Shipping Flag**: All online orders are flagged as `is_shipping: true`
- ✅ **Commission Tracking**: Commissions are calculated based on product settings
- ✅ **"Online Store" Salesperson**: All online orders are attributed to a virtual salesperson

---

## Setup Instructions

### Step 1: Create "Online Store" Salesperson

Run this command **once** for your workspace:

```bash
node setup_online_store_salesperson.js YOUR_WORKSPACE_ID
```

This creates a virtual salesperson named "Online Store". Copy the ID it returns.

### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
ONLINE_STORE_SALESPERSON_ID=<the-id-from-step-1>
SUPABASE_SERVICE_KEY=<your-service-role-key>
```

> **Note**: The Service Key is different from the Anon Key. Get it from Supabase Dashboard → Settings → API → `service_role` key.

### Step 3: Deploy Webhook Handler

You have two options:

#### Option A: Supabase Edge Function (Recommended)

1. Create a new Edge Function in Supabase:
   ```bash
   supabase functions new shopify-webhook
   ```

2. Copy the content of `shopify_webhook_handler.js` into the function.

3. Deploy:
   ```bash
   supabase functions deploy shopify-webhook
   ```

4. Get the function URL from Supabase Dashboard.

#### Option B: Standalone API (Node.js/Express)

Create a simple Express server:

```javascript
import express from 'express';
import { handleShopifyOrder } from './shopify_webhook_handler.js';

const app = express();
app.use(express.json());

app.post('/webhooks/shopify/orders/create', async (req, res) => {
  const workspaceId = req.headers['x-workspace-id']; // Or however you identify workspace
  const result = await handleShopifyOrder(req.body, workspaceId);
  res.json(result);
});

app.listen(3000, () => console.log('Webhook server running on port 3000'));
```

### Step 4: Configure Shopify Webhook

1. Go to Shopify Admin → Settings → Notifications → Webhooks
2. Click "Create webhook"
3. **Event**: `Order creation`
4. **Format**: `JSON`
5. **URL**: Your webhook endpoint (from Step 3)
6. **API version**: Latest stable
7. Save

---

## How It Works

### 1. SKU Matching

When an order comes in:
- Shopify sends: `{ sku: "ALOE-PREM-SMA-MIN", quantity: 2 }`
- System queries: `SELECT * FROM products WHERE sku = 'ALOE-PREM-SMA-MIN'`
- If found → Order item created
- If not found → Item skipped (warning logged)

### 2. Customer → Patient Mapping

```javascript
Shopify Customer {
  first_name: "Mario",
  last_name: "Rossi",
  email: "mario@example.com"
}
↓
Patient {
  first_name: "Mario",
  last_name: "Rossi",
  phone: "mario@example.com", // Email stored here as identifier
  city: "Milano"
}
```

### 3. Order Creation

```javascript
Order {
  patient_id: <patient-id>,
  items: [{ productId, quantity, selectedModifiers }],
  is_external: true,
  is_shipping: true,  // ← ALWAYS TRUE for online orders
  salesperson_id: <online-store-id>,
  commission: <calculated-total>,
  status: "In attesa"
}
```

---

## Testing

### Test the Setup Script

```bash
node setup_online_store_salesperson.js <YOUR_WORKSPACE_ID>
```

Expected output:
```
[SETUP] Setting up Online Store Salesperson...
[SETUP] ✓ Created Online Store salesperson (ID: abc-123-def)
[SETUP]   Add this to your .env file:
[SETUP]   ONLINE_STORE_SALESPERSON_ID=abc-123-def
```

### Test the Webhook Handler

```bash
node shopify_webhook_handler.js <YOUR_WORKSPACE_ID>
```

This runs with a mock Shopify order. Expected output:
```
[WEBHOOK] Processing Shopify Order #1001
[WEBHOOK]   Created new patient: Mario Rossi
[WEBHOOK]   ✓ Mapped: Aloe Gel Premium - Small / Mint (SKU: ALOE-PREM-SMA-MIN) → Aloe Gel Premium
[WEBHOOK] ✓ Order created successfully (ID: xyz-789)
```

---

## Variant Handling

### Simple Variants (Recommended)

Use SKU per variant:
- Product: "Aloe Gel"
- Variant 1: SKU = `ALOE-GEL-SMALL`
- Variant 2: SKU = `ALOE-GEL-LARGE`

In Shopify, assign these SKUs to each variant. The system will match automatically.

### Complex Variants (Advanced)

If you use the `variant_map` field in your products table:

```json
{
  "ALOE-PREM-SMA-MIN": { "Size": "Small", "Flavor": "Mint" },
  "ALOE-PREM-LAR-LEM": { "Size": "Large", "Flavor": "Lemon" }
}
```

The webhook handler can be enhanced to use this mapping for more precise variant selection.

---

## Troubleshooting

### "No product found for SKU"

**Cause**: The SKU in Shopify doesn't match any product in your database.

**Fix**:
1. Export your SKU list: Click "Scarica Lista SKU" in the Products page
2. Compare with Shopify product SKUs
3. Update either Shopify or your products to match

### "Online Store salesperson not found"

**Cause**: The `ONLINE_STORE_SALESPERSON_ID` environment variable is not set or incorrect.

**Fix**: Re-run the setup script and update your `.env` file.

### Orders not flagged as shipping

**Cause**: The webhook handler code was modified.

**Fix**: Ensure this line exists in `createOrder()`:
```javascript
is_shipping: true,  // CRITICAL: Flag as shipping
```

---

## Security Considerations

### Webhook Verification

For production, add Shopify webhook verification:

```javascript
import crypto from 'crypto';

function verifyShopifyWebhook(req) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body)
    .digest('base64');
  
  return hash === hmac;
}

// In your endpoint:
if (!verifyShopifyWebhook(req)) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### API Key Protection

- Never commit `.env` files
- Use Supabase Service Key (not Anon Key) for webhook handlers
- Restrict Edge Function access to Shopify IPs if possible

---

## Next Steps

1. ✅ Run setup script
2. ✅ Deploy webhook handler
3. ✅ Configure Shopify webhook
4. ✅ Test with a real order
5. ✅ Monitor the "Online Store" salesperson in Reports

All online orders will now appear in:
- **Orders** page (flagged with shipping icon)
- **Reports** → **Salesperson Performance** (under "Online Store")
- **Shipping List** (automatically included)

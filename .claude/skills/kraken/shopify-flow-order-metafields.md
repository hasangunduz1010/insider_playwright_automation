---
name: shopify-flow-order-metafields
description: Send order events and order metafields to Insider via Shopify Flow. Prereq:custom event in InOne, UCD API key. Order metafield, Flow trigger, HTTP to UCD. Use cases:recipient_name, delivery_note, loyalty_level, order status. Use when testing Shopify Flow-based custom event delivery to UCD or verifying that order metafield data reaches Insider correctly.
---

# Kraken Shopify Flow Order Events & Metafields Skill

## Integration Context
- **Product**: Kraken (UCD), Shopify Flow
- **Purpose**: Insider One's Shopify integration does not natively support order metafields in order events. Shopify Flow can capture order metafields and send them to Insider One via custom HTTP request to UCD Upsert API.

---

## Prerequisites

- **Admin** in Shopify (apps, flows) and **InOne** (API keys).
- **Custom event** created in InOne with desired parameters (e.g. `recipient_name`, `event_source`).
- **UCD API key**: InOne > Username > InOne Settings > Integration Settings > API Keys > Generate API Key (Unified Customer Database).

### Create Custom Event in InOne
1. Navigate to **InOne > Components > Attributes and Events**.
2. Open **Events** tab, click **+Create**.
3. Enter **Event System Name** and **Event Display Name** (e.g. `recipient_name`).
4. Add **Custom Parameters** and data types (e.g. `event_source`/string, `recipient_name`/string).

---

## Setup Steps

### Step 1: Create Order Metafield in Shopify
1. **Settings > Metafields and Metaobjects > Orders**.
2. Click **Add definition**.
3. Enter **Name** and **Definition** (e.g. `recipient_name`).
4. Save.

### Step 2: Install Flow App
1. Shopify Admin sidebar > **Apps**.
2. Search for **Flow**, click **Add app**, complete installation.

### Step 3: Create Workflow
1. Open Flow app, click **Create Workflow**.
2. Click **Select a trigger**.

### Step 4: Trigger – Order Created
- Add **Order Created** as the starting block.

### Step 5: Update Order Metafield
- Add action **Update Order Metafield**.
- Select the metafield (e.g. `recipient_name`).
- Set value via dynamic attribute (e.g. `{{ order.customer.firstName }}`).

### Step 6: Send HTTP Request to Insider One
- Add action **Send HTTP Request**.
- **Method**: `POST`.
- **URL**: `https://unification.useinsider.com/api/user/v1/upsert`.
- **Headers**:
  - `X-PARTNER-NAME`: InOne panel name (e.g. `insider-demo`).
  - `X-REQUEST-TOKEN`: UCD API Key from InOne.
  - `Content-Type`: `application/json`.
- **Body** (example):
```json
{
  "skip_hook": false,
  "users": [
    {
      "identifiers": {
        "email": "{{order.email}}"
      },
      "events": [
        {
          "event_name": "recipient_name",
          "timestamp": "{{order.processedAt}}",
          "event_params": {
            "custom": {
              "recipient_name": "{{order.customer.firstName}}"
            }
          }
        }
      ]
    }
  ]
}
```

### Step 7: Activate
- Click **Turn On Flow**. On each order created, Flow updates the metafield and sends the custom event to UCD.

---

## Common Use Cases

| Use Case | Metafield / Event Example | Benefit |
|----------|---------------------------|---------|
| Personalized recipient | `recipient_name`, `gift_message` | Follow-up emails/SMS with recipient details |
| Delivery instructions | `delivery_note` | Personalize shipping updates |
| Loyalty / membership | `loyalty_level`, `membership_id` | Trigger campaigns by tier |
| Gift wrap / customization | `gift_wrap`, `engraving_text` | Thank-you or upsell campaigns |
| Occasion tracking | `occasion_type`, `event_date` | Event-driven reminders |
| B2B vs B2C | `customer_type` | Segment communication |
| Attribution | `campaign_id`, `sales_channel` | Attribution and retargeting in InOne |
| Order status changes | `order_paid`, `order_fulfilled`, `order_delivered` | Timely notifications |

---

## API Test Flows

### Flow 1: Verify Custom Event in InOne
```javascript
// Ensure event and params exist before testing Flow
await page.goto('/components/attributes-events');
await page.click('text=Events');
await page.fill('input[placeholder*="Search"]', 'recipient_name');
await expect(page.locator('text=recipient_name')).toBeVisible();
```

### Flow 2: Mock UCD Upsert from Flow
```javascript
// Simulate Flow sending to UCD
const response = await request.post('https://unification.useinsider.com/api/user/v1/upsert', {
  headers: {
    'X-PARTNER-NAME': process.env.PARTNER_NAME,
    'X-REQUEST-TOKEN': process.env.UCD_API_KEY,
    'Content-Type': 'application/json'
  },
  data: {
    skip_hook: false,
    users: [{
      identifiers: { email: 'test@example.com' },
      events: [{
        event_name: 'recipient_name',
        timestamp: new Date().toISOString(),
        event_params: { custom: { recipient_name: 'Jane' } }
      }]
    }]
  }
});
expect(response.status()).toBe(200);
```

---

## Expected Behaviors

- Metafield name in Shopify must match the one used in Flow.
- Each order triggers one (or more) events to UCD with the defined parameters.
- Admin rights in both Shopify and InOne are required for setup.

---

## Related Skills
- [shopify-api-purchase-sync.md](shopify-api-purchase-sync.md) – Native purchase/order sync
- [webhook-integration.md](webhook-integration.md) – Webhook patterns

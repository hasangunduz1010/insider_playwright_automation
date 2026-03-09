---
name: webhook-integration
description: kraken custom webhook integration page in Insider InOne. Covers incoming/outgoing webhooks, authentication methods (API Key, HMAC signature), body validation rules, and test/monitoring flows. Use when testing webhook creation, configuring body validation rules, or troubleshooting webhook authentication and payload processing errors.
---

# Kraken Webhook Integration Page Skill

## Page Information
- **URL**: `/integration-hub/webhooks` or `/kraken/webhooks`
- **Full URL**: `https://{partner}.inone.insidethekube.com/integration-hub/webhooks`
- **Title Pattern**: `{Partner} - Webhook Integration - Insider InOne`
- **Product**: Kraken (Custom Webhook Integration)

---

## Locators

### Header Section
| Element | Selector | Description |
|---------|----------|-------------|
| Page Title | `paragraph:has-text("Webhooks")` | Main heading |
| CREATE WEBHOOK Button | `button:has-text("CREATE WEBHOOK")` | Add new webhook |
| Webhook List | `grid` or table | Existing webhooks |

### Webhook Configuration
| Element | Selector | Description |
|---------|----------|-------------|
| Webhook Name | `textbox[name="Name"]` | Descriptive name |
| Endpoint URL | `paragraph` (read-only) | Generated webhook URL |
| Authentication Type | `button` (dropdown) | None/API Key/Signature |
| Status Toggle | `checkbox` or toggle | Enable/disable webhook |
| Test Webhook Button | `button:has-text("Test")` | Send test payload |

### Body Validation
| Element | Selector | Description |
|---------|----------|-------------|
| Add Validation Rule | `button:has-text("Add Rule")` | Define validation |
| Field Path | `textbox[name="Field Path"]` | JSON path to validate |
| Validation Type | `button` (dropdown) | Required/Type/Format |
| Expected Value | `textbox[name="Expected Value"]` | Validation value |

---

## Webhook Types

### 1. Incoming Webhooks (Data In)
- **Purpose**: Receive data from external systems
- **Use Cases**: Order events, user updates, custom events
- **Flow**: External System → Webhook URL → Kraken → UCD

### 2. Outgoing Webhooks (Data Out)
- **Purpose**: Send Insider events to external systems
- **Use Cases**: Send campaign results, user segments, events
- **Flow**: Insider Event → Kraken → External System

---

## Authentication Methods

### None (Public)
- No authentication required
- Use only for testing or trusted networks
- Not recommended for production

### API Key
- Simple token-based auth
- Sent in header: `X-API-Key: {token}`
- Shared secret between systems

### Signature Validation
- HMAC signature verification
- Most secure method
- Validates payload hasn't been tampered
- Format: `HMAC-SHA256(body, secret)`

---

## User Flows

### Flow 1: Create Incoming Webhook
```javascript
// Navigate to webhooks
await page.goto('/integration-hub/webhooks');

// Click CREATE WEBHOOK
await page.click('button:has-text("CREATE WEBHOOK")');

// Fill webhook name
await page.fill('textbox[name="Name"]', 'Order Created Events');

// Select type
await page.click('button:has-text("Type")');
await page.click('text=Incoming');

// Select authentication
await page.click('button:has-text("Authentication")');
await page.click('text=API Key');

// Generate API key
await page.click('button:has-text("Generate Key")');

// Copy webhook URL
const webhookUrl = await page.locator('paragraph').filter({ hasText: 'https://webhook.useinsider.com' }).textContent();
console.log('Webhook URL:', webhookUrl);

// Save webhook
await page.click('button:has-text("Save")');
```

### Flow 2: Add Body Validation Rules
```javascript
// Open webhook configuration
await page.click('text=Order Created Events');

// Navigate to Validation tab
await page.click('text=Validation');

// Add required field validation
await page.click('button:has-text("Add Rule")');

// Set field path
await page.fill('textbox[name="Field Path"]', 'order.id');

// Set validation type
await page.click('button:has-text("Validation Type")');
await page.click('text=Required');

// Add type validation
await page.click('button:has-text("Add Rule")');
await page.fill('textbox[name="Field Path"]', 'order.total');
await page.click('button:has-text("Validation Type")');
await page.click('text=Type');
await page.fill('textbox[name="Expected Type"]', 'number');

// Save validation rules
await page.click('button:has-text("Save Rules")');
```

### Flow 3: Test Webhook
```javascript
// Open webhook
await page.click('text=Order Created Events');

// Click Test button
await page.click('button:has-text("Test")');

// Enter test payload
await page.fill('textarea[name="Test Payload"]', JSON.stringify({
  order: {
    id: '12345',
    total: 99.99,
    currency: 'USD'
  }
}));

// Send test
await page.click('button:has-text("Send Test")');

// Check result
await expect(page.locator('text=Test Successful')).toBeVisible();
// OR
await expect(page.locator('text=Validation Failed')).toBeVisible();
```

### Flow 4: Monitor Webhook Activity
```javascript
// Open webhook logs
await page.click('text=Order Created Events');
await page.click('text=Activity');

// View recent requests
await expect(page.locator('text=Last 24 Hours')).toBeVisible();

// Check success/fail counts
const successCount = await page.locator('text=Successful').locator('..').locator('paragraph').last().textContent();
const failCount = await page.locator('text=Failed').locator('..').locator('paragraph').last().textContent();

console.log(`Success: ${successCount}, Failed: ${failCount}`);

// View failed requests
await page.click('button:has-text("Show Failed")');

// Inspect failure details
await page.click('row').first();
await expect(page.locator('text=Error Details')).toBeVisible();
```

---

## Body Validation Rules

### Required Fields
- Ensures field exists in payload
- Fails if field missing
- **Example**: `order.id` must be present

### Type Validation
- Validates field data type
- **Types**: string, number, boolean, array, object
- **Example**: `order.total` must be number

### Format Validation
- Validates field format/pattern
- **Formats**: email, url, date, uuid
- **Example**: `customer.email` must be valid email

### Value Validation
- Checks field value matches expected
- **Operators**: equals, contains, regex
- **Example**: `event_type` equals "order_created"

---

## Expected Behaviors

### Request Processing
- Validate authentication first
- Parse JSON body
- Run validation rules
- Transform to Insider format
- Queue for UCD processing
- Return 200 OK on success
- Return 400/401/422 on failure

### Error Handling
- 400: Invalid payload format
- 401: Authentication failed
- 422: Validation rules failed
- 500: Server error (retry)

### Retry Logic
- External systems should retry on 5xx errors
- Use exponential backoff
- Max 3 retries recommended

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check API key is correct, verify header format |
| 422 Validation Failed | Check payload matches validation rules |
| Webhook not receiving data | Verify URL is correct, check firewall rules |
| Payload format error | Ensure valid JSON, check encoding |
| Missing required fields | Review validation rules, update payload |
| Signature validation fails | Check secret key, verify HMAC calculation |

---

## Related Pages
- Integration Hub: `/integration-hub`
- Webhook Logs: View detailed activity
- API Documentation: Payload schemas

---

## Security Best Practices

1. **Always use authentication** - Never use "None" in production
2. **HTTPS only** - Webhook URLs are HTTPS by default
3. **Validate payloads** - Add validation rules for all critical fields
4. **Monitor activity** - Check logs regularly for suspicious patterns
5. **Rotate keys** - Change API keys periodically
6. **IP whitelisting** - If supported, restrict source IPs
7. **Rate limiting** - Be aware of rate limits (typically 1000/min)

---

## Webhook URL Format
```
https://webhook.useinsider.com/v1/partner/{partner_id}/webhook/{webhook_id}
```

### Headers Required
```
Content-Type: application/json
X-API-Key: {your_api_key}  // if API Key auth
X-Signature: {hmac_signature}  // if Signature auth
```

### Example Payload
```json
{
  "event_type": "order_created",
  "timestamp": "2025-01-08T10:00:00Z",
  "order": {
    "id": "12345",
    "total": 99.99,
    "currency": "USD",
    "customer_email": "user@example.com"
  }
}
```

---

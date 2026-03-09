---
name: integration-hub
description: kraken Integration Hub page for managing external integrations (Shopify, Yotpo, webhooks, etc.) in Insider InOne. Contains page locators, integration card selectors, and connect/configure/disconnect flow patterns. Use when testing integration listing, searching or filtering integrations, or troubleshooting OAuth and webhook connection flows.
---

# Kraken Integration Hub Page Skill

## Page Information
- **URL**: `/integration-hub` or `/kraken`
- **Full URL**: `https://{partner}.inone.insidethekube.com/integration-hub`
- **Title Pattern**: `{Partner} - Integration Hub - Insider InOne`
- **Product**: Kraken (Integration Management)

---

## Locators

### Header Section
| Element | Selector | Description |
|---------|----------|-------------|
| Page Title | `paragraph:has-text("Integration Hub")` | Main heading |
| Search Integrations | `textbox[name="Search"]` | Search available integrations |
| Filter Dropdown | `button:has-text("Filter")` | Filter by category/status |

### Integration Categories
| Element | Selector | Description |
|---------|----------|-------------|
| E-commerce Tab | `generic:has-text("E-commerce")` in `listitem` | Shopify, Magento, etc. |
| Marketing Tab | `generic:has-text("Marketing")` in `listitem` | Yotpo, Klaviyo, etc. |
| Data Warehouse Tab | `generic:has-text("Data Warehouse")` in `listitem` | DWH, Amplitude, etc. |
| Custom Tab | `generic:has-text("Custom")` in `listitem` | Webhook integrations |

### Integration Card
| Element | Selector | Description |
|---------|----------|-------------|
| Integration Name | `paragraph` (card title) | Integration name |
| Integration Logo | `img` | Platform logo |
| Status Badge | `generic` (badge) | Connected/Not Connected |
| Connect Button | `button:has-text("Connect")` | Initialize integration |
| Configure Button | `button:has-text("Configure")` | Edit integration settings |
| Disconnect Button | `button:has-text("Disconnect")` | Remove integration |

---

## Integration Types

### 1. Source Integrations (Data In)
- **Purpose**: Import data from external platforms into Insider
- **Examples**: Shopify (orders, customers), Yotpo (reviews), Amplitude (events)
- **Flow**: External Platform → Kraken → UCD System

### 2. Destination Integrations (Data Out)
- **Purpose**: Send Insider data to external platforms
- **Examples**: Google Ads, Facebook Ads, Data Warehouse exports
- **Flow**: Insider → Kraken → External Platform

### 3. Bidirectional Integrations
- **Purpose**: Two-way data sync
- **Examples**: CRM systems, Marketing automation platforms
- **Flow**: Platform ↔ Kraken ↔ Insider

---

## User Flows

### Flow 1: Navigate to Integration Hub
```javascript
// Direct navigation
await page.goto('/integration-hub');
await page.waitForURL('**/integration-hub**');

// Verify page loaded
await expect(page.locator('text=Integration Hub')).toBeVisible();
await expect(page.locator('text=E-commerce')).toBeVisible();
```

### Flow 2: Search for Integration
```javascript
// Type integration name
await page.fill('textbox[name="Search"]', 'Shopify');

// Press Enter or wait for results
await page.press('textbox[name="Search"]', 'Enter');

// Verify integration card appears
await expect(page.locator('text=Shopify')).toBeVisible();
```

### Flow 3: Filter Integrations by Category
```javascript
// Click E-commerce tab
await page.click('text=E-commerce');

// Wait for filtered view
await page.waitForTimeout(500);

// Verify only e-commerce integrations shown
await expect(page.locator('text=Shopify')).toBeVisible();
await expect(page.locator('text=Yotpo')).not.toBeVisible(); // Marketing category
```

### Flow 4: Connect New Integration
```javascript
// Find integration card
const shopifyCard = page.locator('generic:has-text("Shopify")');

// Click Connect button
await shopifyCard.locator('button:has-text("Connect")').click();

// Wait for setup modal or OAuth redirect
await page.waitForTimeout(1000);

// Complete OAuth flow (if applicable)
// Implementation varies by integration
```

### Flow 5: Configure Existing Integration
```javascript
// Find connected integration
const integrationCard = page.locator('generic:has-text("Yotpo")');

// Verify connected status
await expect(integrationCard.locator('text=Connected')).toBeVisible();

// Click Configure button
await integrationCard.locator('button:has-text("Configure")').click();

// Wait for configuration modal
await page.waitForSelector('text=Integration Settings');
```

### Flow 6: Disconnect Integration
```javascript
// Find integration card
const integrationCard = page.locator('generic:has-text("Yotpo")');

// Click Disconnect button
await integrationCard.locator('button:has-text("Disconnect")').click();

// Wait for confirmation modal
await page.waitForSelector('text=Disconnect Integration?');

// Confirm disconnection
await page.click('button:has-text("Disconnect")');

// Verify status changed
await expect(integrationCard.locator('text=Not Connected')).toBeVisible();
```

---

## Expected Behaviors

### Integration Status
- **Not Connected**: No active integration
- **Connected**: Successfully configured and active
- **Error**: Authentication or configuration issue
- **Syncing**: Data sync in progress

### OAuth Integrations
- Redirect to external platform for authorization
- Return with auth code/token
- Store credentials securely
- Auto-register webhooks (if applicable)

### Webhook Integrations
- Provide unique webhook URL
- Support authentication methods (API key, signature)
- Validate incoming payloads
- Queue for processing

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Integration not appearing | Check category filter, use search |
| Connect button not working | Check permissions, verify OAuth URL |
| OAuth redirect fails | Check callback URL configuration |
| Disconnection fails | Check for dependent campaigns/workflows |
| Data not syncing | Verify credentials, check logs |

---

## Related Pages
- Shopify Integration: Detailed Shopify setup
- Webhook Integration: Custom webhook configuration
- Integration Logs: View sync history and errors

---

## Usage Tips

1. **Test Connections**: Use test mode before production
2. **Monitor Sync Status**: Check regularly for errors
3. **Webhook Security**: Always use signature validation
4. **Data Mapping**: Review field mappings carefully
5. **Historical Sync**: May take hours for initial import

---

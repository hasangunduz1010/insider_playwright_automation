---
name: shopify-integration
description: Shopify integration page locators, sync types, user flows, internal SfyApp panel, and storefront E2E test patterns for Insider InOne. Use when testing Shopify connection setup, catalog/user/checkout sync configuration, internal feature toggles, or end-to-end WebPixel purchase flows.
---

# Kraken Shopify Integration Page Skill

## Page Information
- **URL**: `/integration-hub/shopify`
- **Full URL**: `https://{partner}.inone.insidethekube.com/integration-hub/shopify`
- **Title Pattern**: `{Partner} - Shopify Integration - Insider InOne`
- **Product**: Kraken (Shopify Integration)

### Setup / Onboarding Reference
Full setup is done via **Components > Integrations > External Integrations** (select Shopify): enter store name, **Install** app, **Preview and Enable** (Insider Object + ins.js), enable App Embed toggles in Shopify theme, add **Custom Web Pixel** (Shopify Settings > Customer Events), configure **Attributes** (Shopify↔Insider, metafield mapping, create new users), **Events** (purchase TTL, order status Open/Archived), **Products** (category mapping, options, metafields, primary locale), then **Review & Activate**. See [shopify-onboarding-wizard.md](shopify-onboarding-wizard.md) for step-by-step details.

---

## Locators

### Configuration Tabs
| Element | Selector | Description |
|---------|----------|-------------|
| Overview Tab | `generic:has-text("Overview")` in `listitem` | Integration status & info |
| Catalog Sync Tab | `generic:has-text("Catalog Sync")` | Product catalog settings |
| User Sync Tab | `generic:has-text("User Sync")` | Customer data settings |
| Checkout Tab | `generic:has-text("Checkout")` | Purchase tracking config |
| Markets Tab | `generic:has-text("Markets")` | Multi-market configuration |

### Overview Section
| Element | Selector | Description |
|---------|----------|-------------|
| Store URL | `paragraph:has-text("Store URL")` | Shopify store address |
| Connection Status | `generic` (badge) | Connected/Disconnected |
| Last Sync Time | `paragraph:has-text("Last Sync")` | Most recent sync timestamp |
| Disconnect Button | `button:has-text("Disconnect")` | Remove integration |

### Catalog Sync Section
| Element | Selector | Description |
|---------|----------|-------------|
| Auto Sync Toggle | `checkbox` or toggle | Enable automatic catalog sync |
| Sync Frequency | `button` (dropdown) | Hourly/Daily/Weekly |
| Manual Sync Button | `button:has-text("Sync Now")` | Trigger immediate sync |
| Product Count | `paragraph` with number | Total products synced |
| Field Mapping | `button:has-text("Configure Mapping")` | Map Shopify fields to Insider |

### User Sync Section
| Element | Selector | Description |
|---------|----------|-------------|
| Customer Sync Toggle | `checkbox` or toggle | Enable customer sync |
| Sync Scope | `button` (dropdown) | All customers or filtered |
| Historical Sync | `button:has-text("Import Historical")` | Sync past customers |
| Last Sync Status | `paragraph` | Success/Error status |

---

## Sync Types

### 1. Catalog Sync
- **Purpose**: Import product catalog from Shopify
- **Data**: Products, variants, prices, inventory, images
- **Frequency**: Real-time (webhooks) + periodic full sync
- **Use Cases**: Product recommendations, search, personalization

### 2. User Sync
- **Purpose**: Import customer data from Shopify
- **Data**: Customer profiles, email, phone, addresses, tags
- **Frequency**: Real-time + daily full sync
- **Use Cases**: Segmentation, targeting, personalization

### 3. Order/Checkout Sync
- **Purpose**: Track purchases and checkout events
- **Data**: Orders, line items, cart data, transaction details
- **Frequency**: Real-time (webhooks)
- **Use Cases**: Attribution, revenue tracking, abandonment campaigns

### 4. Markets Sync (Multi-region)
- **Purpose**: Support Shopify Markets (multi-currency/language)
- **Data**: Market-specific pricing, currency, localization
- **Frequency**: Follows catalog sync
- **Use Cases**: International personalization

---

## User Flows

### Flow 1: Connect Shopify Store
```javascript
// Navigate to Shopify integration
await page.goto('/integration-hub/shopify');

// Click Connect button (if not connected)
await page.click('button:has-text("Connect Shopify")');

// Enter Shopify store URL
await page.fill('textbox[name="Store URL"]', 'mystore.myshopify.com');

// Click Continue
await page.click('button:has-text("Continue")');

// Redirected to Shopify OAuth page
// Approve permissions on Shopify
// Redirected back to Insider

// Verify connection successful
await expect(page.locator('text=Connected')).toBeVisible();
```

### Flow 2: Configure Catalog Sync
```javascript
// Navigate to Catalog Sync tab
await page.click('text=Catalog Sync');

// Enable auto sync
await page.click('checkbox[name="Auto Sync"]');

// Set sync frequency
await page.click('button:has-text("Sync Frequency")');
await page.click('text=Every 6 hours');

// Configure field mapping
await page.click('button:has-text("Configure Mapping")');

// Map Shopify fields to Insider fields
await page.click('button:has-text("product_id")');
await page.click('text=id');

await page.click('button:has-text("title")');
await page.click('text=name');

// Save mapping
await page.click('button:has-text("Save Mapping")');

// Trigger manual sync to test
await page.click('button:has-text("Sync Now")');

// Wait for sync to start
await page.waitForSelector('text=Syncing...');

// Wait for completion
await page.waitForSelector('text=Sync Complete', { timeout: 60000 });
```

### Flow 3: Enable User Sync
```javascript
// Navigate to User Sync tab
await page.click('text=User Sync');

// Enable customer sync
await page.click('checkbox[name="Customer Sync"]');

// Select sync scope
await page.click('button:has-text("Sync Scope")');
await page.click('text=All Customers');

// Start historical sync
await page.click('button:has-text("Import Historical")');

// Confirm historical sync (may be large)
await page.click('button:has-text("Confirm")');

// Monitor sync progress
await page.waitForSelector('text=Historical sync started');
```

### Flow 4: Configure Checkout Tracking
```javascript
// Navigate to Checkout tab
await page.click('text=Checkout');

// Enable checkout tracking
await page.click('checkbox[name="Track Checkouts"]');

// Enable Web Pixel (Shopify's new tracking)
await page.click('checkbox[name="Enable Web Pixel"]');

// Save settings
await page.click('button:has-text("Save")');

// Verify tracking active
await expect(page.locator('text=Tracking Active')).toBeVisible();
```

### Flow 5: Configure Markets (Multi-region)
```javascript
// Navigate to Markets tab
await page.click('text=Markets');

// Enable Markets sync
await page.click('checkbox[name="Sync Markets"]');

// Configure market-specific settings
await page.click('button:has-text("Add Market")');

// Select market
await page.click('button:has-text("Select Market")');
await page.click('text=United States');

// Set market currency
await page.click('button:has-text("Currency")');
await page.click('text=USD');

// Save market configuration
await page.click('button:has-text("Save Market")');
```

---

## Expected Behaviors

### Initial Connection
- OAuth redirect to Shopify admin
- User approves app installation
- Webhook auto-registration
- Initial catalog sync starts automatically
- Historical user sync optional

### Real-Time Sync (Webhooks)
- Product updates sync within seconds
- Order events tracked immediately
- Customer updates propagate real-time
- Inventory changes reflected quickly

### Periodic Full Sync
- Catches missed webhook events
- Ensures data consistency
- Runs at configured frequency
- Can be triggered manually

### Field Mapping
- Default mapping provided
- Custom fields supported
- Validation on save
- Changes apply to future syncs only

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| OAuth redirect fails | Check Shopify app settings, verify callback URL |
| Catalog not syncing | Check webhook registration, trigger manual sync |
| Products missing | Verify products are published in Shopify |
| Customer sync fails | Check API permissions, verify customer scope |
| Checkout tracking not working | Enable Web Pixel, check Shopify theme compatibility |
| Markets not syncing | Verify Shopify Markets is enabled on store |
| Field mapping errors | Check data types match, verify custom field exists |

**FAQ**: See [shopify-faq.md](shopify-faq.md) for common questions (yellow warning, single-page store, IO behavior, GDPR opt-in).

---

## Related Pages
- [shopify-onboarding-wizard.md](shopify-onboarding-wizard.md) – Step-by-step setup
- Integration Hub: `/integration-hub`
- Product Catalog: `/catalog`
- Customer Profiles: `/user-profiles`

---

## Internal Admin Panel (SfyApp)

Internal panel used by the Kraken team to manage per-partner settings. Used in the production environment.

### Panel Pages & URLs
| Page | URL | Description |
|------|-----|-------------|
| Login | `https://internal-integration.useinsider.com/panel/login` | SfyApp login page |
| Home | `https://internal-integration.useinsider.com/panel/...` | Welcome heading + date picker + slide menu |
| Partner List | `https://sfyapp.useinsider.com/panel/shopify/partner-list` | All Shopify partner list; search box + Test + Features buttons |
| Test Screen | `https://sfyapp.insidethekube.com/panel/shopify/test-screen?shop={store}.myshopify.com` | Per-partner accordion settings |
| Features | `https://sfyapp.useinsider.com/panel/shopify/partner-list` > Features button | Per-partner feature toggle management |
| Integration Settings | `https://sfyapp.insidethekube.com/panel/shopify/test-screen?shop=...` > Edit Integration Settings | Account name/ID entry screen (inside iframe) |

### Feature Toggles (Per Partner)
| Toggle | CSS Locator | Feature ID | Description |
|--------|-------------|------------|-------------|
| Sync Purchase Events | `label[for='feature-8']` | 8 | Enables purchase event synchronization |
| Collect Only Paid Orders | `label[for='feature-12']` | 12 | Collects only orders with "paid" status |
| Disable Web Pixel Alert | `label[for='feature-20']` | 20 | Suppresses Web Pixel alerts |

- **Toggle status class**: `in-toggle-wrapper_checked` — present in element class means toggle is on
- **Toggle XPath pattern**: `//label[@for="feature-{id}"]/parent::fieldset`
- **Temporary API Key**: `input#temporary-api-key` — Generate New Temporary API Key button `button#primary-button`

### Test Screen Accordion Structure
| Index | Accordion Name | Toggle Names |
|-------|---------------|--------------|
| 0 | User Syncronization | `subscriptions`, `two-way-user-sync`, `email-subscriptions`, `sms-subscriptions` |
| 1 | Event Sync | `purchase`, `checkout` |
| 2 | Product Catalog syncronization | `catalog-sync` |

- **Accordion toggle check**: `.in-toggle-wrapper_checked input[id*='{toggle_name}']`
- **Accordion title**: `Class: qa-accordion-title` — click to open accordion
- **Accordion open state**: `.qa-accordion-content.in-accordion-wrapper__content_opened`

### Integration Settings (inside iframe)
| Element | Locator | Description |
|---------|---------|-------------|
| Frame | `#integration .test-screen-frame` | All settings are inside this frame |
| Account Name | `input#partner-name` | Insider partner/account name |
| Account ID | `input#insider-api-key` | Insider API key |
| Save Button | `button#save-button` | Save settings |
| Save on Popup | `button#accept` | Confirm button on popup |
| Discard Popup | `button#save` | Discard changes popup |
| Enable Toggle | `.qa-toggle .in-toggle-wrapper__label` | Enable/disable integration |
| Activate Theme | `button#activate-app` | Activate Insider theme |

### Internal Panel Login Flow
```typescript
// 1. SfyApp panel login
await page.goto('https://internal-integration.useinsider.com/panel/login');
await page.fill('#email', shopifyUser);
await page.fill('#password', shopifyPassword);
await page.click('#login-button');

// 2. Navigate from Home page to partner list
await page.locator('.in-sidebar-v2-wrapper__category-name').nth(1).click();
await page.click("span:has-text('Shopify Partner List')");

// 3. Search for partner and click Feature/Test button
await page.fill('#search', 'insdev-automation');
await page.click("p:has-text('Features')");  // or "p:has-text('Test')"

// 4. Check feature toggle state and enable
for (const featureId of [8, 12, 20]) {
  const toggleFieldset = page.locator(`xpath=//label[@for="feature-${featureId}"]/parent::fieldset`);
  const cls = await toggleFieldset.getAttribute('class') ?? '';
  if (!cls.includes('in-toggle-wrapper_checked')) {
    await page.click(`label[for='feature-${featureId}']`);
  }
}
// Save
await page.click('#button-footer-primary-edit-translation');
```

### Shopify Admin Panel (admin.shopify.com)
| Element | Locator | Description |
|---------|---------|-------------|
| Email Input | `#account_email` | Login screen email |
| Password Input | `#account_password` | Login screen password |
| Continue with Email | `//span[@class="ui-button__text" and text()="Continue with email"]/parent::span` | Continue with email |
| Login Button | `//span[@class="ui-button__text" and normalize-space(text())="Log in"]/parent::span` | Log in |
| Add Customer | `//span[contains(text(), "Add customer")]` | Create new customer |
| First Name | `//input[@name="firstName"]` | Customer first name |
| Last Name | `//input[@name="lastName"]` | Customer last name |
| Email | `//input[@name="email"]` | Customer email |
| Phone | `//input[@name="phone"]` | Customer phone |
| Email Opt-in | `//input[@name="acceptsEmailMarketing"]` | Email marketing opt-in |
| SMS Opt-in | `//input[@name="acceptsSmsMarketing"]` | SMS marketing opt-in |
| Save | `//button[@aria-label="Save"]` | Save |
| Install | `//span[text()='Install']` | App installation button |

```typescript
// Log in to Shopify Admin
await page.goto('https://admin.shopify.com/store/YOUR_STORE');
await page.fill('#account_email', email);
await page.click("span.ui-button__text:has-text('Continue with email')");
await page.fill('#account_password', password);
await page.click("span.ui-button__text:has-text('Log in')");
// Click Install button if visible
if (await page.locator("span:has-text('Install')").isVisible()) {
  await page.click("span:has-text('Install')");
}
// Get Customer ID from URL: /admin/customers/{storeId}/customers/{customerId}
await page.locator("button[aria-label='Save']").waitFor();
const customerId = page.url().split('/').at(-1);
```

---

## Storefront E2E Test Pages (insdev-kraken1.myshopify.com)

Shopify store pages for WebPixel and Checkout tests:

| Page | Class | Control Element |
|------|-------|-----------------|
| Product Detail | `ProductDetailsPage` | `Add to Cart` button (`button[type='submit'][name='add']`) |
| Cart | `CartPage` | `Check out` submit button |
| Checkout | `CheckoutPage` | `#email` contact input |
| Thank You | `ThankYouPage` | `section[aria-label="Your order is confirmed"]` |

### Checkout Page Main Locators
| Element | Locator |
|---------|---------|
| Contact (email/phone) | `input#email[name='email']` |
| Surname | `input[name="lastName"]` (aria-hidden=false) |
| Country Dropdown | `select[name="countryCode"]` |
| Zone Dropdown | `select[name="zone"]` |
| Address | `input[name='address1']` |
| Postal Code | `input[name='postalCode']` |
| City | `input[name='city']` |
| Shipping Methods | `#shipping_methods` |
| Standard Shipping | `//label[p[contains(text(), 'Standard')]]` |
| Expedited Shipping | `//label[p[contains(text(), 'Expedited')]]` |
| International Shipping | `//label[p[contains(text(), 'International Shipping')]]` |
| Card Number (iframe) | `iframe[title*='Card number']` |
| Expiry (iframe) | `iframe[src*='expiry']` |
| CVV (iframe) | `iframe[title*='Security code']` |
| Card Holder (iframe) | `iframe[title*='Name on card']` |
| Discount Code Input | `input[name='reductions'][placeholder='Discount code or gift card']` |
| Apply Discount | `button[aria-label='Apply Discount Code'][type='submit']` |
| Invalid Discount Error | `//*/[contains(text(),'discount code') and contains(text(),'valid')]` |
| Pay Now | `button#checkout-pay-button` |

### E2E Test Flow (WebPixel)
```typescript
test('WebPixel purchase event sync', async ({ page, request }) => {
  // 1. Navigate to product page
  await page.goto(productUrl);

  // 2. Add product to cart and go to cart
  await page.locator("button[type='submit'][name='add']").click();
  await page.locator("a[href='/cart'].btn--secondary-accent").click();

  // 3. Proceed to checkout
  await page.click("input[type='submit'][name='checkout'][value='Check out']");

  // 4. Fill contact info (email or phone)
  const email = `test_${Date.now()}@example.com`;
  await page.fill('#email', email);

  // 5. Fill delivery details (Ireland address)
  await page.fill("input[name='lastName']", 'IPEK');
  await page.selectOption("select[name='countryCode']", 'IE');
  await page.selectOption("select[name='zone']", 'D');
  await page.fill("input[name='postalCode']", 'R93 A029');
  await page.fill("input[name='city']", 'dublin');
  await page.fill("input[name='address1']", 'KEBAB');
  await page.locator('#shipping_methods').waitFor();

  // 6. Optional: Apply discount code
  await page.fill("input[name='reductions']", 'DISCOUNT_CODE');
  await page.click("button[aria-label='Apply Discount Code']");

  // 7. Payment details (iframes)
  await page.frameLocator("iframe[title*='Card number']").locator('#number').fill('1');
  await page.frameLocator("iframe[src*='expiry']").locator('#expiry').fill('1233');
  await page.frameLocator("iframe[title*='Security code']").locator('#verification_value').fill('000');
  await page.frameLocator("iframe[title*='Name on card']").locator('#name').fill('IPEK TEST');

  // 8. Complete payment
  await page.click('#checkout-pay-button');

  // 9. Verify Thank You page
  await expect(page.locator('section[aria-label="Your order is confirmed"]')).toBeVisible();

  // 10. Verify event in UCD (polling)
  const ucdData = await retryUcdProfileCheckWithEvents(request, {
    identifierType: 'em',
    identifier: email,
    partner: 'insdevkraken1',
    eventList: [{ event_name: 'confirmation_page_view', params: ['up', 'usp', 'cu', 'sc', 'pid'] }],
    maxRetries: 15,
  });
  expect(ucdData.events['confirmation_page_view']).toBeDefined();
});
```

---

## Data Flow

### Shopify → Insider (Import)
```
Shopify Store
  ↓ (Webhooks + Periodic Sync)
Kraken (Validation & Transformation)
  ↓
UCD System (Storage)
  ↓
Used in: Recommendations, Segmentation, Personalization
```

### Insider → Shopify (Export)
```
Insider Campaign
  ↓
Kraken (Format & Send)
  ↓
Shopify Admin API
  ↓
Shopify Store (e.g., create draft order, tag customer)
```

---

## Shopify API Permissions Required
- `read_products` - Product catalog access
- `read_customers` - Customer data access
- `read_orders` - Order history access
- `read_inventory` - Stock levels
- `write_pixels` - Checkout tracking (Web Pixel)

---

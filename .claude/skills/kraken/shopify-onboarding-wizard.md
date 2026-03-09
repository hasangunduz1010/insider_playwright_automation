---
name: shopify-onboarding-wizard
description: Step-by-step Shopify integration setup in InOne. Covers Install app, Preview & Enable (IO + ins.js), App Embed toggles, Custom Pixel, Attributes (Shopify↔Insider, metafield mapping), Events, Products (category mapping, options, metafields), Review & Activate. Use when writing UI tests for the Shopify onboarding wizard steps or verifying initial integration setup and activation flows.
---

# Kraken Shopify Onboarding Wizard Skill

## Integration Context
- **Product**: Kraken (Shopify Integration Setup)
- **Source**: Components > Integrations > External Integrations on InOne panel
- **Prerequisite**: Administrator or Editor with PII access for External Platform Integrations

---

## Wizard Steps Overview

1. **Install the Shopify app** – Store name, Install button, Terms & authorizations
2. **Preview and Enable** – Insider Object (IO) and JS Tag (ins.js); redirect to App Embed
3. **Custom Web Pixel** – Copy code, add in Shopify Customer Events, test
4. **Attributes** – Sync direction (Shopify↔Insider), metafield mapping, create new users option
5. **Events** – Purchase TTL, order status (Open/Archived only)
6. **Products** – Category mapping, product options, metafields, primary locale note
7. **Review & Activate** – Finalize and start historical user, purchase, and product sync

---

## Step 1: Install the Shopify App

- Navigate to **Components > Integrations > External Integrations**.
- Select **Shopify** as the platform.
- Enter **store name** (the part before `.myshopify.com`; find in Shopify Settings).
- Click **Install** to accept Terms and authorizations.
- After redirect from Shopify, click **Next** on success.

---

## Step 2: Preview and Enable (IO + ins.js)

- Click **Preview and Enable** for Insider Object (IO) and JS Tag.
- User is redirected to Shopify **App Embed** for the published theme.
- Enable toggles: **Insider App**, **Insider Object**, **Insider JS Tag (ins.js)**.
- Click **Save** in Shopify; return to InOne and click **Next**.

**Note:** For Hydrogen or custom storefront, IO and JS Tag must be implemented manually; contact Insider One team.

---

## Step 3: Custom Web Pixel

- Copy the Custom Web Pixel code from InOne.
- In Shopify: **Settings > Customer Events > Add custom pixel**.
- Name the pixel (e.g. "Insider Order Status Custom Pixel").
- Select permissions: **Marketing and Analytics**, **Data collected qualifies as a data sale**.
- Click **Connect** to save.
- In InOne, click **Test Custom Web Pixel** to verify; then **Next**.

---

## Step 4: Attributes Tab

### Shopify to Insider One
- Sync SMS, Email, and (optionally) WhatsApp subscribers (WhatsApp from SMS opt-in; one-way from Shopify to Insider).
- Map **Shopify metafields** to Insider One attributes (dropdown selection).

### Insider One to Shopify
- Updates Shopify profiles: Email, SMS Opt-In from Lead Collection, API Data, Data Uploads.
- **Update existing + create new** – Insider can create new customer profiles and update consent.
- **Only update existing** – No new profiles; only consent updates for existing customers.
- When both toggles are on, full sync is possible; if either is off, full sync is not guaranteed.
- If a field (e.g. phone) is empty in Shopify, Insider can populate it when "Insider One to Shopify" is active; existing values are not overwritten.

---

## Step 5: Events Tab

- Lists events collected from Shopify after Attributes.
- **Purchase migration** may take time; only orders with **Open** or **Archived** status are collected.
- Purchase data follows **event TTL** (default 2 years). See Purchase Data Synchronization and Checkout Event Synchronization docs for parameters.

---

## Step 6: Products Tab

- Choose whether to **sync product data via API** and map metafields.
- **Category mapping**: Default is Collections → category; can change (e.g. Product Type, Tags, Metafields). Consult Insider One before changing; mapping can be updated later.
- If category is changed from Collections, collections can still be used by mapping to another product attribute.
- **Custom storefront/Hydrogen**: Configure taxonomy in the Insider Object as well.
- **Product options** (e.g. size, color): Enter option name manually (case-insensitive); map to Insider product attribute.
- **Product metafields**: Map Shopify metafield to Insider product attribute. Use **Refresh** if new attributes/metafields do not appear.
- **Primary locale/currency only** via API; multiple languages/markets/currencies require other feed methods – contact Insider One.

---

## Step 7: Review & Activate

- Review all settings and click **Activate Integration**.
- Historical user, purchase, and product sync starts with the selected settings.

---

## Special Cases

### Single-Page Websites
- Shopify does not offer a single-page template; use extensions. For single-page sites use backend-only features: purchase sync, checkout events, user sync, product catalog sync, and ins.js. For IO, prefer populating the Insider Object or WebSDK; or disable IO from the preview theme page.

### Insider Object Behavior
- IO loads data when the user visits or refreshes the page.
- IO does not receive new information without a page refresh.

### GDPR Opt-In
- Insider One does not collect `gdpr_optin` from Shopify. All existing Shopify users are treated as having gdpr_optin by default. See Insider Privacy Policy for details.

---

## UI Test Flows

### Flow 1: Navigate to Shopify Integration Setup
```javascript
await page.goto('/integration-hub');
await page.click('text=Shopify');
await page.click('button:has-text("Connect")');
// Or: navigate to Components > Integrations > External Integrations > Shopify
await expect(page.locator('text=Store name')).toBeVisible();
```

### Flow 2: Complete Store Name and Install
```javascript
await page.fill('input[placeholder*="store"]', 'mystore');
await page.click('button:has-text("Install")');
// Redirect to Shopify OAuth; after return
await expect(page.locator('text=Preview and Enable')).toBeVisible();
```

### Flow 3: Verify App Embed Step Redirect
```javascript
await page.click('button:has-text("Preview and Enable")');
// New tab: Shopify App Embed
await page.waitForURL(/admin.*themes.*editor/);
await expect(page.locator('text=Insider App')).toBeVisible();
await expect(page.locator('text=Insider Object')).toBeVisible();
await expect(page.locator('text=Insider JS Tag')).toBeVisible();
```

### Flow 4: Test Custom Web Pixel
```javascript
// After pixel is connected in Shopify
await page.click('button:has-text("Test Custom Web Pixel")');
await expect(page.locator('text=confirmation') || page.locator('text=success')).toBeVisible();
```

---

## Related Skills
- [shopify-integration.md](shopify-integration.md) – Integration page and sync types
- [shopify-checkout-extensibility-pixel.md](shopify-checkout-extensibility-pixel.md) – Custom Web Pixel details
- [shopify-api-customer-sync.md](shopify-api-customer-sync.md) – User sync attributes and API
- [shopify-api-catalog-sync.md](shopify-api-catalog-sync.md) – Product catalog sync

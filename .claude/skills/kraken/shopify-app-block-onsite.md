---
name: shopify-app-block-onsite
description: Insider One Shopify App Block for OnSite campaigns. Theme 2.0+, Add App Block in Body, block ID, Set Exact Location in InOne. Reconfigure after theme change. Use when testing App Block placement for OnSite campaigns, validating block ID uniqueness, or verifying campaign behavior after Shopify theme updates.
---

# Kraken Shopify App Block for OnSite Campaigns Skill

## Integration Context
- **Product**: OnSite Campaigns on Shopify Store
- **Feature**: Display OnSite campaigns in specific sections via App Block
- **Requirement**: Shopify themes **version 2.0 and above**

---

## Prerequisites

- Shopify store uses **Theme v2.0 or higher**.
- **Insider One Shopify App** is installed.
- **ins.js** and **IO (Insider Object)** are enabled in the theme.

---

## Add and Target the App Block

### In Shopify (Theme Editor)
1. Go to **Shopify Admin > Online Store > Themes**.
2. Click **Customize** on the active theme.
3. In the **Body** section, click **Add App Block**.
4. Select **Insider App Block**.
5. Open the added block and assign a **unique ID** (e.g. `insider1`). This ID is used to target the OnSite campaign.

**Note:** App blocks can only be added within the body section (not header or footer).

### In Insider One (OnSite Campaign)
1. Open the OnSite campaign in InOne.
2. Select **Set Exact Location** from the menu.
3. Enter the block ID with a hash prefix (e.g. `#insider1`).
4. Set position to **Insert Before**.
5. Click **Set Location**.
6. Activate the campaign and click **Generate**.

---

## Reconfigure After Theme Change

When the theme is updated or switched:

1. **Re-add** the Insider App Block to the desired location in the new theme.
2. Use the **same block ID** (e.g. `insider1`) so campaign placement in InOne does not need to change.
3. Ensure **ins.js** and **IO** are enabled in the new theme.
4. If the campaign uses a **system rule** (e.g. AddToCart), verify it still works; theme structure changes can affect event tracking.

**Warning:** Using the same ID for multiple app blocks on one page will duplicate the campaign.

---

## UI Test Flows

### Flow 1: Verify App Block in Theme Editor
```javascript
// Simulate or assert theme customizer
await page.goto('/admin/themes/current/editor');
await page.click('text=Body');
await page.click('text=Add App Block');
await expect(page.locator('text=Insider App Block')).toBeVisible();
```

### Flow 2: Set Exact Location in OnSite Campaign
```javascript
await page.goto('/onsite/campaigns');
await page.click('text=My OnSite Campaign');
await page.click('text=Set Exact Location');
await page.fill('input[placeholder*="location"]', '#insider1');
await page.click('button:has-text("Insert Before")');
await page.click('button:has-text("Set Location")');
await expect(page.locator('text=#insider1')).toBeVisible();
```

### Flow 3: Verify Block ID Uniqueness
```javascript
// Test: same ID on multiple blocks should be flagged or documented
// Assert campaign placement targets single block when ID is unique
```

---

## Expected Behaviors

- Campaign renders only in the section where the App Block with the matching ID is placed.
- Changing theme without re-adding the block removes the campaign from the storefront until the block is re-added.
- System rules (e.g. AddToCart) depend on theme DOM; theme changes may require re-validation.

---

## Related Skills
- [shopify-integration.md](shopify-integration.md) – Shopify integration overview
- [shopify-onboarding-wizard.md](shopify-onboarding-wizard.md) – Enabling ins.js and IO

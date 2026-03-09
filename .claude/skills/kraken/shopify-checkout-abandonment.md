---
name: shopify-checkout-abandonment
description: Checkout abandonment journeys for Shopify. Checkout Page View starter, Wait + Purchase check, Check Reachability/Next Best Channel, content (event params), display conditions, Web Push/Email/OnSite. Advanced:Check Conditions, Check Interaction, A/B Split, Set Goals. Use when testing checkout abandonment journey setup in Architect, verifying Checkout Page View event parameters, or validating journey logic with wait/check conditions.
---

# Kraken Shopify Checkout Abandonment Skill

## Integration Context
- **Product**: Architect (Journeys), Checkout Event Synchronization
- **Starter Event**: Checkout Page View (synced via Shopify Checkout Webhook)
- **Requirement**: Checkout abandonment enabled on Insider One Shopify App; checkout items and purchase info collected (default after mapping)

---

## When Checkout Page View Is Tracked

- Logged-in user visits the checkout page.
- Logged-in user updates items on the checkout page.
- User enters contact and shipping info on the first page of Shopify Checkout and proceeds to the next step.

**Note:** Checkout Event data can be used in OnSite only via Architect's OnSite channel (e.g. checkout abandonment journeys).

---

## Journey Structure

### 1. Select Starter
- **Event starter**: **Checkout Page View** under Events.
- Optional: filter by event parameters (e.g. product name, category).
- Optional: add segment filter so users who purchase within a time window are excluded.

### 2. Flow Logic
- Add **Wait** (e.g. at least 1 hour) after starter.
- **Check** whether user completed **Purchase** in that period (Purchase event or same event).
- Use **Check Reachability** before sending; use **Next Best Channel** for fallback paths.
- References: Check Conditions, Check Reachability, Next Best Channel.

### 3. Content and Event Parameters

Event parameters available for personalization:

| Event Parameter | Personalization / Description |
|----------------|-------------------------------|
| Product Name | Checkout Page View.Product Name / Last Abandoned Product Name |
| Image URL | Checkout Page View.Product Image URL |
| URL | Checkout Page View.URL / Last Abandoned Product URL |
| Unit Sales Price | Checkout Page View.Unit Sales Price |
| Quantity | Checkout Page View.Quantity |
| Abandoned Checkout URL | Checkout Page View.Abandoned Checkout URL (Shopify checkout recovery URL) |

- **Group events** option: show products from the same transaction and multiple event parameters in content.
- **Email**: Use display conditions for rows (e.g. show 1 row if 1 product, 2 rows if 2 products). Cart abandonment templates use these conditions.
- **Web Push**: Use last abandoned product (name, URL, image, etc.) e.g. `checkout_page_view.name`.

---

## Advanced Checkout Abandonment

- **Check Conditions**: Different paths by attributes/segments (e.g. VIP vs standard).
- **Check Interaction**: React to clicks (e.g. web push or email link) and continue on same channel.
- **Check Reachability**: Multiple channels; route by reachability.
- **A/B Split**: Compare content or channels; auto winner.
- **Set Goals**: Custom goals (e.g. custom event, ride booking, coupon redeem, specific product purchase) besides purchase.

---

## Best Practices (Academy)

- Show item(s) in the checkout.
- Clear call-to-action.
- Highlight advantages of buying now.
- Act according to user behavior.

---

## API / UI Test Flows

### Flow 1: Verify Checkout Page View in User Profile
```javascript
// After triggering checkout (no purchase), check User Profile events
await page.goto('/user-profiles');
await page.fill('input[placeholder*="Search"]', 'test@example.com');
await page.click('text=Checkout Page View');
// Assert event params: line_items-title, abandoned_checkout_url, etc.
```

### Flow 2: Architect Journey – Checkout Abandonment Starter
```javascript
await page.goto('/architect');
await page.click('button:has-text("Create Journey")');
await page.click('text=Event starter');
await page.click('text=Checkout Page View');
await expect(page.locator('text=Checkout Page View')).toBeVisible();
```

### Flow 3: Add Wait and Purchase Check
```javascript
// In journey canvas: add Wait (1 hour), then Check Condition
await page.click('button:has-text("Add element")');
await page.click('text=Wait');
await page.fill('input[name="duration"]', '60');
await page.click('button:has-text("Add element")');
await page.click('text=Check Conditions');
// Select Purchase event, time window
```

---

## Expected Behaviors

- Checkout Page View is emitted only when conditions above are met (logged-in visit, update, or contact/shipping entered).
- Historic checkout data is not available from Shopify; only new checkout events after integration.
- Segment counts: compare **unique users** with purchases, not order count (Shopify shows orders; Insider shows users with Purchase event).

---

## Related Skills
- [shopify-checkout-extensibility-pixel.md](shopify-checkout-extensibility-pixel.md) – Checkout event parameters and Custom Pixel
- [shopify-api-purchase-sync.md](shopify-api-purchase-sync.md) – Checkout webhook and event params

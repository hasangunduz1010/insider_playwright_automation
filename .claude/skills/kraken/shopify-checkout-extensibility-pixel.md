---
name: shopify-checkout-extensibility-pixel
description: Explains the Shopify Checkout Extensibility upgrade, Custom Web Pixel implementation, WebView tracking limitations, and checkout event parameters for UI/Integration tests. Use when testing Custom Web Pixel loading on order status pages, verifying checkout event parameter collection, or handling WebView duplicate tracking scenarios.
---

# Shopify Checkout Extensibility & Custom Web Pixel Skill

## Integration Context
- **Product**: Shopify Custom Web Pixel & Checkout Event Synchronization
- **Deprecation Notice**: Shopify Plus stores disabled `checkout.liquid` for info/shipping/payment pages on Aug 13, 2024, and for thank-you/order status pages on Aug 28, 2025.
- **Solution**: Insider requires a **Custom Web Pixel** to track conversions, purchase events, and execute campaigns on order status pages.

---

## Custom Web Pixel Configuration

### Permissions Required
When injecting the pixel script in Shopify Admin (`Settings > Customer Events`), the following permissions must be explicitly granted:
- **Marketing and Analytics** permission.
- **Data collected qualifies as a data sale** flag.

### WebView (Mobile App) Limitations
- If a mobile app displays Shopify's checkout page via a web view, Insider's Custom Webpixel might track purchase events from the app with lower accuracy (duplicate tracking).
- **Rule**: A specific parameter must be passed to Insider to block Webpixel from collecting these WebView purchases. Update **cart attributes** before sending the user to checkout (e.g. add a note attribute). Inform Insider One team which attribute to use to differentiate source.
- **Example note_attributes** (e.g. in cart update):
```json
"note_attributes": [
  { "name": "Platform", "value": "ANDROID" },
  { "name": "log_state", "value": "Logged In" },
  { "name": "Channel", "value": "Mobile App" }
]
```
- References: Shopify theme editor – [Update cart attributes](https://shopify.dev/docs/api/ajax/reference/cart#update-cart-attributes); Hydrogen – see Confirmation Page View (Purchase) in React Native / mobile docs.

---

## Checkout Event Synchronization

### Checkout Event Parameters (Full List)
When a logged-in customer visits the checkout or enters contact/shipping info, the following parameters are synced via the Shopify Checkout Webhook (Insider One does not collect custom parameters other than these):

| Parameter Name on Insider One | Description |
|-------------------------------|-------------|
| line_items-product_id | Product ID |
| line_items-title | Name |
| collections | Taxonomy |
| currency_code | Currency |
| total_line_items_price | Unit Price |
| total_price | Unit Sales Price |
| id | Event Group ID |
| variant-size | Unit Size |
| variant-color | Color |
| discount_codes | Promotion Name |
| total_discounts | Promotion Discount |
| image.src | Product Image URL |
| handle | Product URL |
| line_items-quantity | Quantity |
| product_type | Product Type |
| abandoned_checkout_url | Abandoned Checkout URL |

### Test Custom Web Pixel
1. In InOne Shopify App settings, copy the Custom Web Pixel code.
2. In Shopify: **Settings > Customer Events > Add custom pixel** → name (e.g. "Insider Order Status Custom Pixel") → select **Marketing and Analytics** and **Data collected qualifies as a data sale** → **Connect**.
3. Return to InOne and click **Test Custom Web Pixel** to verify; proceed to Next when confirmation is shown.

### Test Purchase Flow on Order Status Page
1. Complete a test purchase on the store.
2. In InOne go to **User Profiles**, search for the test user.
3. Open the user → **Events** tab; confirm purchase information is present.
4. If errors occur, contact Insider One team.

---

## UI/Integration Test Flows

### Flow 1: Verifying Custom Web Pixel Loading
```typescript
// Navigate to the Shopify Order Status (Thank You) page
await page.goto('[https://teststore.myshopify.com/checkout/thank_you](https://teststore.myshopify.com/checkout/thank_you)');

// Verify if the Custom Pixel script is injected and tracking the purchase
const pixelRequestPromise = page.waitForRequest(request => 
  request.url().includes('hit.useinsider.com') && 
  request.postData()?.includes('purchase')
);

const pixelRequest = await pixelRequestPromise;
expect(pixelRequest.method()).toBe('POST');
```

---

## Expected Behaviors & Checkout Limitations

- **Architect Dependency**: Checkout Events (like Checkout Page View) synced via Webhooks can only be used in the Architect's OnSite channel for Checkout Abandonment journeys.
- **Extensibility Upgrade Check**: New stores are automatically upgraded. Tests should account for the absence of checkout.liquid elements in the DOM.

---

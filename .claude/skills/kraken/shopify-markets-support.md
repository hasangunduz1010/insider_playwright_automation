---
name: shopify-markets-support
description: Shopify Markets support in Insider One. Market-locale model, REGION-type, locale limit 300. Setup, initial/live/daily sync, parent/submarket, currency, limitations (B2B, locale delete). Use when testing multi-market catalog sync, locale creation, market-specific pricing or stock, or segmentation by market locale attribute.
---

# Kraken Shopify Markets Support Skill

## Integration Context
- **Product**: Kraken (Catalog), Smart Recommender
- **Feature**: Multiple regions, countries, currencies, and languages from a single Shopify store
- **Scope**: Insider One supports **REGION-type** Shopify Markets only; B2B market types are not supported

---

## Benefits

- **No manual multi-market feeds**: Catalog (prices, currencies, languages, stock, metafields) synced per market.
- **Single InOne panel**: One place for scenarios, segments, journeys, analytics; market→locale mapping (e.g. `en_US:34421455234`).
- **Localized experiences**: Smart Recommender and campaigns support multiple languages and currencies per market.
- **Accurate stock per market**: Stock and availability tracked per market; wrong recommendations avoided.

---

## Product Catalog Structure

### Market–Locale Model
- Insider One creates a **separate catalog locale** per **Market × Language**.
- **Locale format**: `{language_code}:{MarketID}` (e.g. `en_US:34421455234`, `tr_TR:76334565658`).
- Locales are created automatically during catalog sync.

### Locale Rules
- Locales are **not merged or reused**; each market and language has its own locale.
- Locales **cannot be edited or deleted** in catalog.
- If a market or language is unpublished, drafted, or removed in Shopify, the corresponding locale remains in Insider One with last synced data.
- **Limit**: 300 locales. If reached, no new locales are created. Outdated locales can be removed by Insider One Support on request.

### Languages & Translations
- Only translations provided by Shopify are synced (during daily catalog sync).
- Missing translation for a locale falls back to default locale content.
- Product: title, description, SEO. Metafields: custom attributes. **Shopify Adapt** translations are not synced.

### Pricing & Currency
- Prices synced as provided by Shopify; pricing is at market level.
- Countries in the same currency share the same prices; exchange rates are managed in Shopify; Insider One syncs converted prices and updates exchange rates once per day (temporary differences possible until next sync).

### Stock & Availability
- Stock is per market; inventory aggregated from fulfillment locations for that market.
- Out-of-stock → Passive via live sync; products excluded from a market → Passive after daily sync or manual resync.

---

## Set Up and Activate

### Prerequisites
- Shopify store with **active REGION-type markets** and **published languages**.
- **Markets × Languages ≤ 250** (Insider reserves buffer for 300-locale limit).
- InOne plan includes **Product Catalog** and **Smart Recommender**.
- **Shopify integration** active; **Markets permissions** granted to Insider One App.

If the feature is not enabled, open a support ticket for evaluation.

---

## Data Synchronization

### Initial Historical Sync
- Runs when Shopify integration is activated.
- Fetches markets (for locale creation) and full product catalog per market-locale (localization, prices, availability).

### Live Sync (Near Real-Time)
- Stock (quantity), products added/removed from markets, prices (6-hour cooldown), collections, new markets.
- Triggers: product updates, market changes, domain config, fulfillment location changes, stock updates.

### Daily Sync
- Product details, translations, metafield translations, product URLs, prices.

### Manual Resync
- Trigger from Shopify Integration settings when immediate catalog update is needed (use sparingly).

---

## Parent Market & Submarket

- **Submarkets** take priority; their countries are excluded from the parent market sync.
- If all countries are overridden by submarkets, the parent market is not synced.
- Parent and submarket locales remain separate with their own pricing; storefront follows submarket rules.

---

## Product URLs

- Updated in daily catalog sync or manual resync. If a market domain is removed, URLs fall back to the store’s default domain after next sync.

---

## Limitations & Constraints

- Only **REGION-type** markets are processed; B2B not supported.
- **Max 300** catalog locales; locales cannot be deleted or edited from catalog.
- Keep **Markets × Languages** under 250.
- Avoid very frequent price changes in short periods.
- Monitor passive products after market exclusions.

---

## Use Cases (Testing)

- **Segmentation**: Use locale attribute (e.g. `en_US:34421455234`) so campaigns target the correct catalog.
- **Journeys & Email**: Market-specific journeys, email recommendations, and localized campaigns with correct language, currency, and stock.

---

## API / UI Test Flows

### Flow 1: Verify Locales in Catalog Settings
```javascript
await page.goto('/integration-hub/shopify');
await page.click('text=Catalog Sync');
// Or Catalog Settings > Integration Settings
await expect(page.locator('text=Markets')).toBeVisible();
// Locale list or market-locale IDs
```

### Flow 2: Segment by Locale
```javascript
await page.goto('/audience/segments');
await page.click('button:has-text("Create")');
await page.click('text=Dynamic Segment');
// Add attribute filter: locale or language_code:MarketID
await page.fill('input[name="attribute"]', 'en_US:34421455234');
```

---

## Related Skills
- [shopify-api-catalog-sync.md](shopify-api-catalog-sync.md) – Catalog sync API and limits
- [shopify-integration.md](shopify-integration.md) – Integration overview

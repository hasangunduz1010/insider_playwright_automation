# How To Run Shopify Automation Tests (TypeScript / Playwright)

TypeScript counterpart of the Python Shopify automation suite.
Covers Live User Sync scenarios using Playwright's API test runner.

---

## 1. Prerequisites

- Node.js 18+ (native `fetch` support)
- `.env` file configured (see section 2)
- For local Kubernetes runs: active kube context pointing to the correct cluster

---

## 2. Configuration (`.env`)

Create or update `.env` in the project root:

```env
# Test environment — controls store selection and UCD domain
# Options: LOCAL | JENKINS_TEST | JENKINS_DEPLOYMENT | PROD_KUBERNETES
TEST_ENV=LOCAL

# UCD / Atrium API key for the target partner
UCD_API_KEY=<your_ucd_api_key>

# Shopify store tokens
SHOPIFY_STORE_1_TOKEN=shpat_...
SHOPIFY_STORE_2_TOKEN=shpat_...
SHOPIFY_STORE_3_TOKEN=shpat_...
SHOPIFY_STORE_4_TOKEN=shpat_...
SHOPIFY_STORE_5_TOKEN=shpat_...
SHOPIFY_STORE_6_TOKEN=shpat_...
PROD_SHOPIFY_LIVE_SYNC_TOKEN=shpat_...
SHOPIFY_AUTOMATION_STORE_TOKEN=shpat_...
INSDEV_MARKET_AUTOMATION_TOKEN=shpat_...
```

> **`TEST_ENV` → Store & Domain mapping:**
>
> | TEST_ENV | Store used | UCD domain |
> |---|---|---|
> | `LOCAL` | STORE_1 | insidethekube.com |
> | `JENKINS_TEST` | PROD_LIVE_SYNC | useinsider.com |
> | `JENKINS_DEPLOYMENT` | PROD_LIVE_SYNC | useinsider.com |
> | `PROD_KUBERNETES` | STORE_1 | useinsider.com |

---

## 3. Usage in Code

`ShopifyStoreConfig` automatically selects the store based on `TEST_ENV`.

**Default behavior (auto-resolve by environment):**
```typescript
const config = ShopifyStoreConfig.resolveConfig(settings);
```

**Override store explicitly (e.g. production sync while running locally):**
```typescript
const config = ShopifyStoreConfig.resolveConfig(settings, ShopifyStores.PROD_LIVE_SYNC);
```

---

## 4. Store Configuration

All store metadata is defined in `src/data/shopify/shopify-config.ts`.

**Local / Test Store (default for LOCAL env):**
```typescript
STORE_1 = {
  shopUrl:  'ins-qa-automation-1',
  partner:  'krakentest',
  locale:   'en_US:36206313714',
  currency: 'USD',
  tokenKey: SettingKeys.SHOPIFY_STORE_1_TOKEN,
  apiVersion: '2026-01',
}
```

**Production — Live Sync Automation (Jenkins):**
```typescript
PROD_LIVE_SYNC = {
  shopUrl:  'insdev-test-automation-kraken',
  partner:  'shopifytest',
  locale:   'es_ES',
  currency: 'SGD',
  tokenKey: SettingKeys.PROD_SHOPIFY_LIVE_SYNC_TOKEN,
  apiVersion: '2026-01',
}
```

**Production — Historical Sync Automation:**
```typescript
PROD_HISTORICAL_SYNC = {
  shopUrl:  'insdev-automation-kraken',
  partner:  'insdevautomation',
  locale:   'fi_FI',
  currency: 'USD',
  tokenKey: SettingKeys.SHOPIFY_AUTOMATION_STORE_TOKEN,
  apiVersion: '2026-01',
}
```

---

## 5. Running Tests

```bash
# Run all Shopify API tests
npx playwright test tests/api/shopify --project=api

# Run a specific test file
npx playwright test tests/api/shopify/sms-optin-subscribed-to-unsubscribed.spec.ts --project=api

# Run with Allure report
npx playwright test tests/api/shopify --project=api && npx allure generate allure-results --clean && npx allure open
```

---

## 6. Test Cases

| File | TC ID | Description |
|---|---|---|
| `sms-optin-subscribed-to-unsubscribed.spec.ts` | TC-6829 / TC-6827 | SMS opt-in: Subscribed → Unsubscribed |
| `email-sms-optin-subscribed-to-unsubscribed.spec.ts` | — | Email + SMS opt-in: Subscribed → Unsubscribed |

---

## 7. Python vs TypeScript Karşılaştırması

| | Python | TypeScript (bu proje) |
|---|---|---|
| Config dosyası | `settings.ini` | `.env` |
| Env seçimi | `local_kube = 1` | `TEST_ENV=LOCAL` |
| Store seçimi | `ShopifyStoreConfig.setup_test_store_config()` | `ShopifyStoreConfig.resolveConfig()` |
| HTTP client | `requests` / `ucd_requests.py` | Playwright `APIRequestContext` |
| Test runner | `pytest` | `npx playwright test --project=api` |

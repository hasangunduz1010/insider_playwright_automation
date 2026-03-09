---
name: shopify-api-catalog-sync
description: Backend architecture and API endpoints for Shopify Catalog Sync (Historical and Live). Contains JSONL parsing rules, Bulk Operations GraphQL mutations, and Catalog API endpoints for Playwright integration tests. Use when writing tests for product sync (categories, metafields, options, prices), verifying Insider Catalog API responses, or debugging bulk operation flows.
---

# Kraken Shopify Catalog Sync API Skill

## API Information
- **Type**: Backend Data Flow / API Integration
- **Product**: Kraken (Shopify Catalog Sync)
- **Primary AWS Services**: Kinesis, Lambda, SQS
- **External Dependency**: Shopify GraphQL Bulk Operations & REST API

---

## Sync Features & Limitations

### Product Categories & Options
- **Category Limit**: Insider supports syncing up to **100 categories** per product. If a product has more than 100, the excess will be cropped.
- **Collections Mapping**: Shopify Collections are mapped to the `category` field in Insider by default (used for Smart Recommender/Eureka).
- **Options Case-Insensitivity**: Shopify option inputs are case-insensitive. Inputs like "SiZE", "size", or "SIZE" are all converted to lowercase and treated as the same attribute.

### Multi-Market Support (Shopify Markets)
- For stores with the "market" feature enabled, the **"Via Click Stream Web"** option must be activated in `Catalog Settings > Integration Settings` to localize the product catalog on the front end.

### Product Attribute Mapping (Shopify → Insider One)
| Product Attribute on Shopify | Product Attribute on Insider One |
|------------------------------|----------------------------------|
| variant.id | Item ID |
| body_html | Description |
| product_id | Groupcode |
| product_type | Product Type |
| language_country | Locale |
| title | Name |
| default store currency | Currency |
| handle | URL |
| images.src | Image URL |
| Product.hasOutOfStockVariants | In Stock |
| variants.price | Price |
| variants.price | Original Price |
| inventory.quantity | Quantity |
| sku | SKU |
| inventory_quantity | Stock |
| creation_date (for variant) | activation_date |
| collections | category |

### Category Mapping
- **Default**: Shopify **Collections** are mapped to Insider One **category** (used in Smart Recommender/Eureka).
- **Alternatives**: You may map **Tags**, **Product Type**, or **Product/Category Metafields** to category (variant metafields are not suitable for category). If you change from Collections to another field, map Collections to a different product attribute if you still need them.
- **Hydrogen / custom storefront**: If using App Embed, mapping updates automatically. If not (Hydrogen or custom storefront), update the **taxonomy** object in the Insider Object (IO) so category values come from the correct field.

### Product Metafields
- Product metafields store extra data (materials, badges, ingredients, reviews, gift message, etc.). Create product attributes in InOne and map Shopify metafields in the integration; use **Refresh** if new attribute/metafield is not visible.
- **Product Metafields Data Type Mapping** (Shopify → Insider One): single_line_text_field→string, boolean→boolean, color→string, date/date_time→datetime, decimal→number, id→number, json→string, link→string, multi_line_text_field→string, number_integer→number, rating→string, rich_text_field→string, url→url; list types: list.color→strings, list.date/list.date_time→string array, list.link→string array, list.number_integer→numbers, list.rating→string array, list.single_line_text_field→strings, list.url→strings. Other Shopify metafield types are not mapped.

### Collections & Sync Behavior
- **Collections** created/updated in Shopify sync to Insider in real time via webhooks. Fallback: collections refreshed daily at **8 AM UTC** (historical sync).
- **Collections with >25K assigned products** are excluded from real-time create/update and synced only at 8 AM UTC daily.
- **Do not trigger product updates**: Bulk edit to Cost per Item; Unavailable Count changes; removal of a variant metafield value; products without variants (variant metafield updates); deleting a variant metafield definition or value (not reflected in Insider).
- **Primary locale and currency only** via API; other locales/currencies require other feed methods (contact Insider One).

---

## Endpoints & Headers

### Insider Catalog API Endpoints
| API | Method | Endpoint | Description |
|-----|--------|----------|-------------|
| Ingest API | `POST` | `https://1uslnm6i2f.execute-api.eu-west-1.amazonaws.com/v2/v2/ingest` | Process JSONL bulk data |
| Update API | `POST` | `https://1uslnm6i2f.execute-api.eu-west-1.amazonaws.com/v2/v2/update` | Live product updates |

### Required Headers
| Header Name | Type | Description |
|-------------|------|-------------|
| `X-PARTNER-NAME` | String | e.g., `shopifytest` |
| `X-REQUEST-TOKEN` | String | Authentication token for Catalog API |
| `Content-Type` | String | `application/jsonl` for Ingest, `application/json` for Update |

---

## Sync Types & Limitations

### 1. Historical Sync (Bulk Operations)
- **Mechanism**: Shopify GraphQL `bulkOperationRunQuery`
- **Output**: JSONL format file (1 line = 1 product)
- **Limitation**: Catalog API only supports ISO locales (`en_US`, `tr_TR`). Unsupported (`en_TH`) will fail.

### 2. Live Sync
- **Mechanism**: 15-minute cron job / Polling
- **Logic**: Uses Bulk Operations if >1000 products, else REST API.
- **Limitation**: Currently does NOT track deleted products automatically.

---

## API Test Flows

### Flow 1: Mocking Historical Sync Bulk Query
```typescript
// Intercept Shopify GraphQL Bulk Operation to simulate successful sync order
await page.route('**/graphql.json', async (route) => {
  const request = route.request();
  if (request.postData()?.includes('bulkOperationRunQuery')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          bulkOperationRunQuery: {
            bulkOperation: {
              id: "gid://shopify/BulkOperation/123",
              status: "CREATED"
            },
            userErrors: []
          }
        }
      })
    });
  } else {
    await route.continue();
  }
});
```

### Flow 2: Testing Catalog Ingest API Directly
```typescript
// Send Direct Request to Catalog API simulating JSONL parsing worker
const response = await request.post('[https://1uslnm6i2f.execute-api.eu-west-1.amazonaws.com/v2/v2/ingest](https://1uslnm6i2f.execute-api.eu-west-1.amazonaws.com/v2/v2/ingest)', {
  headers: {
    'X-PARTNER-NAME': 'shopifytest',
    'X-REQUEST-TOKEN': process.env.CATALOG_API_TOKEN,
    'Content-Type': 'application/jsonl'
  },
  data: `{"id":"1","title":"Test Product 1","price":"10.00"}\n{"id":"2","title":"Test Product 2","price":"20.00"}`
});

// Verify ingestion response
expect(response.status()).toBe(200);
const body = await response.json();
expect(body.success).toBeTruthy();
```

---
## Expected Behaviors & Error Handling

- **JSONL Parsing**: System must parse JSONL part by part to avoid RAM/Memory issues.
- **Retriable Jobs**: Failed operations retry with exponential backoff (up to 1 hour).
- **Error 400**: Thrown when invalid locales are sent (e.g., `en_TH`).
- **Error 401**: Missing `X-PARTNER-NAME` or invalid token.

---

## E2E Test Senaryoları (Atlas / ShopifyProductUCDAPI)

Atlas projesindeki product sync testleri `ShopifyProductUCDAPI` sınıfını kullanır:
`pages/Integration/ShopifyIntegration/shopify_product_ucd_api.py`

### ShopifyProductUCDAPI – Temel Metodlar
| Metod | Açıklama |
|-------|----------|
| `create_and_get_shopify_product_data(status, product_type, shop_url, token, tags)` | Shopify GraphQL ile ürün oluşturur (ACTIVE/DRAFT) |
| `get_shopify_product_data(product_id, store_domain, token)` | REST API ile ürün detayı çeker |
| `update_shopify_product_data(shop_url, token, product_id, variant_id, price, compare_at_price, ...)` | Ürün fiyat, miktar, SKU, başlık vb. günceller |
| `delete_shopify_product(shop_url, token, product_numeric_id)` | Ürünü Shopify'dan siler |
| `fetch_live_insider_product_data(product_id, partner, locale)` | Insider Catalog API'den ürün verisi çeker |
| `wait_for_ucd_product_update(product_id_or_variant_id, by, key_to_check, locale, currency, **expected)` | Insider'da beklenen ürün field'larının güncellenmesini bekler |
| `calculate_discount_percentage(price, compare_at_price)` | İndirim yüzdesi hesaplar |

### Insider Catalog Ürün Interface'i (TypeScript)
```typescript
// Insider Catalog API'den dönen ürün yapısı
interface InsiderProduct {
  name?:             string;
  description?:      string;
  price?:            Record<string, number>;          // { SGD: 22.5, USD: 16.8 }
  original_price?:   Record<string, number>;
  discount?:         Record<string, number>;          // indirim yüzdesi
  is_status_passive?: boolean;                        // true = draft/archived
  sku?:              string;
  category?:         string[];
  brand?:            string;
  gender?:           string;
  custom_score?:     number;
  multipack?:        number;
  color?:            string | string[];
  size?:             string | string[];
  google_title?:     string;
  gtin?:             string;
  translated_content?: Record<string, unknown>;
  groupcode?:        string;   // product_id
  item_id?:          string;   // variant_id
  quantity?:         number;
}

// Fiyat erişimi: para birimine göre
// variant.price?.['SGD']
// variant.original_price?.['USD']
```

### Historical Sync Test Senaryoları
| Test Adı | Doğrulanan Alan | Açıklama |
|----------|-----------------|----------|
| Category mapping with Collections | `category` | Shopify Collections → Insider category |
| Category mapping with Tags | `category` | Shopify Tags → Insider category |
| Category mapping with Product Type | `category` | Shopify Product Type → Insider category |
| Category mapping with Product Metafield | `category` | Metafield → Insider category |
| Collections mapping box | `category` | Collections mapping box'taki yapılandırma |
| Historical options sync | `size`, `color` vb. | Ürün options (case-insensitive) |
| Historical product metafields sync | custom attribute | Metafield → Insider product attribute |
| Historical variant metafields sync | variant attribute | Variant metafield → Insider field |
| Array product metafields (>1024 chars) | custom attribute | 1024 karakter sonrası kırpılmalı |

### Live Sync Test Senaryoları
| Test Adı | Doğrulanan Alan | Açıklama |
|----------|-----------------|----------|
| Create active product | `is_status_passive = False` | Aktif ürün sync |
| Create draft product | `is_status_passive = True` | Taslak ürün — Insider'da passive |
| Update product price & compare_at_price | `price`, `original_price`, `discount` | Fiyat + indirim yüzdesi doğrulama |
| Update product quantity | `quantity` | Stok güncelleme |
| Update product quantity to 0 | `quantity = 0`, `in_stock` | Stok bitince in_stock değişimi |
| Update product SKU | `sku` | SKU güncellemesi |
| Update product title & description | `name`, `description` | İçerik güncelleme |
| Update product type | `product_type` | Ürün tipi değişimi |
| Update product tags | `category` (tags mapping) | Tag → category mapping güncellemesi |
| Update product: draft → active | `is_status_passive False → True` | Durum geçişi |
| Update product: active → archived | `is_status_passive True` | Arşivlenen ürün |
| Update collections | `category` | Koleksiyon değişimi → category güncelleme |
| Smart collections update | `category` | Otomatik koleksiyon güncellemesi |
| Collections with max allowed characters | `category` | Uzun koleksiyon adı sınır kontrolü |
| Collections with updated title | `category` | Koleksiyon başlığı değişince sync |
| Collection deletion from collections page | `category` | Koleksiyon silinince category güncelleme |
| Category mapping box (live sync) | `category` | Live sync'te category map box doğrulama |
| Live options sync | `size`, `color` vb. | Options live güncelleme |
| Live product metafields sync | custom attribute | Metafield live güncelleme |
| Live variant metafields sync | variant attribute | Variant metafield live güncelleme |
| Array metafields (>1024 chars, live) | custom attribute | Kırpma davranışı live sync'te |
| Collection translations on markets | `translated_content` | Markets + çeviri sync |
| Collection fallback to default language | `translated_content` | Çeviri silinince fallback |

### Tipik Test Pattern (Live Sync)
```typescript
// 1. Shopify'da ürün oluştur
const { catalogData } = await createShopifyProduct({
  status: 'ACTIVE',
  productType: 'Accessories',
  shopUrl: storeDomain,
  token,
  tags: ['IPEK AUTOMATION'],
});
const productId = catalogData.product.id.split('/').at(-1)!;
const variantId = catalogData.product.variants.edges[0].node.id.split('/').at(-1)!;

// 2. Insider'da sync'i bekle ve doğrula
const initialData = await fetchLiveInsiderProductData({ productId, partner, locale });

// 3. Güncelleme yap
await updateShopifyProductData({
  shopUrl: storeDomain, token,
  productId, variantId,
  price: '25.99', compareAtPrice: '39.99',
});

// 4. Insider'da güncellemeyi bekle
const updatedData = await waitForUCDProductUpdate({
  productIdOrVariantId: variantId,
  by: 'item_id',              // veya 'product_id'
  keysToCheck: ['price', 'original_price', 'discount'],
  locale, currency,
  expected: { price: 25.99, original_price: 39.99, discount: expectedDiscountPct },
  partner,
});

// 5. Doğrulama
const variant = updatedData[0] as InsiderProduct;
const insiderPrice = variant.price?.[currency];
expect(insiderPrice).toBe(25.99);

// 6. Temizlik
await deleteShopifyProduct({ shopUrl: storeDomain, token, productNumericId: productId });
```

### Discount Yüzdesi Hesaplama
```typescript
// Shopify'da compareAtPrice varsa Insider discount hesaplar:
// discount = (compareAtPrice - price) / compareAtPrice * 100
function calculateDiscountPercentage(price: number, compareAtPrice: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

const expectedDiscount = calculateDiscountPercentage(newPrice, newCompareAtPrice);
```

### Insider Catalog API Sorgusu
```typescript
// Ürünü product_id (groupcode) veya variant_id (item_id) ile sorgulanabilir:
// by: 'item_id'    → variant_id ile arama
// by: 'product_id' → product_id (groupcode) ile arama
// locale: "en_SG", "tr_TR" vb. ISO locale
// currency: "SGD", "USD" vb.

const queryParams = new URLSearchParams({
  partner,
  locale,          // örn. "en_SG"
  currency,        // örn. "SGD"
  by: 'item_id',   // veya 'product_id'
  id: variantId,
});
const response = await request.get(`${CATALOG_API_BASE}/product?${queryParams}`);
const products = (await response.json()) as InsiderProduct[];
```

---

---
name: shopify-api-purchase-sync
description: Backend context for Shopify Purchase and Cart Abandonment integrations. Contains webhook topics, UCD Upsert API payloads, Cron jobs, DB Log Queries (Athena/Postgres) and detailed pricing logic for test automation. Use when testing purchase event sync, checkout abandonment webhook payloads, WebPixel confirmation_page_view parameters, or discount and shipping cost pricing logic.
---

# Kraken Shopify Purchase & Cart Sync API Skill

## API Information
- **Type**: Webhook Processing, Cron Jobs & Data Transformation
- **Product**: Kraken (Shopify Purchase Sync)
- **Target Endpoints**: UCD Upsert API, UCD Profile API
- **Goal**: Maintain 99% purchase log accuracy

### Historical vs Real-Time Purchase Sync
- **Historical**: Triggered when Shopify App integration is activated from InOne. Migration may take time; only orders with **Open** or **Archived** status are collected; data follows purchase event **TTL** (default 2 years).
- **Real-time**: Insider One uses **Custom Web Pixel** to collect real-time purchase data. Ensure Custom Web Pixel is implemented (see [shopify-checkout-extensibility-pixel.md](shopify-checkout-extensibility-pixel.md)).

---

## Endpoints, Cron Jobs & DB Queries

### API Endpoints
| API | Method | Endpoint | Description |
|-----|--------|----------|-------------|
| Upsert API | `POST` | `https://unification.useinsider.com/api/user/v1/upsert` | Save user and event data |
| Profile API | `POST` | `http://atrium.insidethekube.com/api/contact/v1/profile` | Check user events & attributes |
| Live Sync Cron | `GET` | `https://kraken.insidethekube.com/shopify-historical-sync/v1/cron/verify-purchases/{store}/5min` | Manually trigger 5-min sync |

### Debugging & Database Queries
- **Athena Webhook Logs**:
  ```sql
  SELECT * FROM AwsDataCatalog.kraken.webhook_logs 
  WHERE integration IN ('shopify', 'ucd-to-shopify', 'shopify-compliance', 'shopify-historical-sync-purchase')
  AND payload LIKE '%test@email.com%' LIMIT 100;
```

## Purchase Event Parameters (Academy)

Parameters collected when syncing purchase from Shopify to Insider One (historical API sync):

| Name on Insider | Source (Shopify) |
|-----------------|------------------|
| event_group_id | o.Id |
| product_id | l.ProductId |
| name | l.GetProductName() |
| product_image_url | p.Image.Src |
| quantity | l.Quantity |
| size | v.GetSize() |
| color | v.GetColor() |
| url | p.GetUrl(domain) |
| currency | l.PriceSet.ShopMoney.CurrencyCode |
| unit_price | l.GetUnitPrice() |
| unit_price_sale | l.GetUnitSalePrice() |
| displayed_currency | l.PriceSet.PresentmentMoney.CurrencyCode |
| displayed_unit_sales_price | l.GetDisplayedUnitSalePrice() |
| displayed_unit_price | l.GetDisplayedUnitPrice() |
| taxonomy | p.Taxonomies |
| promotion_name | o.DiscountCodes.GetCode() |
| promotion_discount | o.TotalDiscounts |
| shipping_cost | o.TotalShippingPriceSet.ShopMoney.Amount |
| source_name | web |
| shopify_order_name | o.Name |
| product_type | p.ProductType |

Insider One does not collect custom event parameters other than those listed above (and the real-time custom params below).

### Real-Time Purchase Custom Parameters (Custom Web Pixel)
For real-time purchase sync, six custom parameters can be sent. Create them in InOne if not auto-created: **Components > Attributes and Events > Events** tab → search "purchase" → three dots → **Edit** → scroll to **+Add Custom Parameter**.

| Parameter Name | Data Type | Usage |
|----------------|-----------|--------|
| c_delivery_options_title | Array Strings | Title of selected shipping method (e.g. "Fast", "Standard") |
| c_delivery_options_type | Array Strings | Type of shipping (pickup, shipping, etc.) |
| c_variant_title | String | Variant title as shown to user (e.g. "blue", "red") |
| c_untranslated_variant_title | String | Untranslated/original variant name (e.g. "mavi" when store is multi-language) |
| c_product_coupon_codes | Array Strings | Coupon code applied to the product |
| c_cart_coupon_codes | Array Strings | Coupon code applied to the whole cart |

---

## Kube Redis Checkout Token Injection
Redis içerisine checkout token bazlı veri enjekte edilmesi işlemi.

### Command (Bash)

    SET medusa_database_pre-id:Z2...:store.myshopify.com "{\"insiderId\":\"123...\",\"sessionId\":\"456...\"}"

### Payload Example (JSON)

    {
      "insiderId": "123...",
      "sessionId": "456..."
    }

## Event Parameters & Pricing Logic

### Confirmation Page View (Purchase)

- **nc_up / nc_usp**: Presentment (Not converted) Unit Price / Unit Sales Price  
- **up / usp**: Converted Unit Price / Unit Sales Price  
- **pd**: Promotion Discount  
- **sc**: Shipping Cost  

**Note:**  
Gift cards are NOT counted as `promotion_discount (pd)`.  
If a gift card is applied, `nc_usp`, `nc_up`, `up`, and `usp` parameters will have equal values.

---

### Checkout Page View (Abandonment)

- **c_abandoned_checkout_url**: Link to recover the cart  
- **e_guid**: Unique ID of the checkout  
- **pid**: Variant ID (Not Product ID)  
- **qu**: Quantity  

### Shopify Webhook Headers
| Header Name | Type | Description |
|-------------|------|-------------|
| `x-shopify-shop-domain` | String | Used to identify the partner |
| `x-shopify-topic` | String | Defines event type (e.g., `orders/paid`) |

---

## Webhook Topics & Logic

### 1. Cart Abandonment
- **`checkouts/create`**: Triggered when a checkout is initiated. Data available only if user is logged in.
- **`checkouts/update`**: Triggered as user fills the form. Used to capture anonymous user details.
- **Data Extracted**: `abandoned_checkout_url`, `unit_sale_price`, `currency`.

### 2. Live Purchase
- **`orders/paid`**: Webhook registered to track completed purchases.
- **Verification**: Cron jobs run every 5 mins/daily to fetch missed orders and guarantee 99% accuracy.

---

## API Test Flows

### Flow 1: Simulating Cart Abandonment Webhook
```typescript
// Simulate Shopify hitting our Webhook Endpoint for Cart Abandonment
const response = await request.post('/api/webhook/shopify', {
  headers: {
    'x-shopify-shop-domain': 'teststore.myshopify.com',
    'x-shopify-topic': 'checkouts/update',
    'Content-Type': 'application/json'
  },
  data: {
    id: 23790352105517,
    token: "44d44fcad38d2d69aa7aa88f6774c5b0",
    email: "test@example.com",
    abandoned_checkout_url: "https://teststore.myshopify.com/checkout/recover"
  }
});

expect(response.status()).toBe(200);
// Add assertion to check if data is queued for UCD Upsert
```

### Flow 2: Mocking UCD Upsert Request
```typescript
// Verify that our system correctly transforms the Shopify payload and sends to UCD
await page.route('https://unification.useinsider.com/api/user/v1/upsert', async (route) => {
  const postData = route.request().postDataJSON();
  
  // Assert payload structure
  expect(postData.users[0].events[0].event_name).toBe('cart_page_view');
  expect(postData.users[0].attributes.email).toBe('test@example.com');
  
  await route.fulfill({ status: 200, body: '{"success": true}' });
});
```

---
## Expected Behaviors & Error Handling

- **Race Conditions**: System must use DB locks when writing historical sync and live webhook data simultaneously.
- **Retry Logic**: If UCD Upsert fails (5xx), the payload must be pushed to a Dead Letter Queue (DLQ) for retry.
- **Queue Backup**: All incoming webhooks must be dumped to a queue (e.g., SQS) immediately before processing to prevent timeouts.
- **Multiple Products in Order**: If purchasing 2 different products, 2 different events should exist on UCD. Order discount will be divided between events.
- **Compare At Price**: Products with `compare_at_price` will be counted as `up` currently.

---

## UCD Event Parameters (Gerçek Test Verilerinden)

### checkout_page_view Event (Checkout Webhook)

Kullanıcı checkout formunu doldurduğunda ve submit ettiğinde oluşur. Test edilen tam parametre listesi:

| UCD Param | Açıklama | Örnek Değer |
|-----------|----------|-------------|
| `up` | Unit price (dönüştürülmüş) | `22` |
| `usp` | Unit sales price (indirimli) | `22` |
| `cu` | Currency (mağaza para birimi) | `"SGD"` |
| `src` | Kaynak | `"crm"` |
| `crea` | Oluşturulma tarihi | `"2025-09-15T08:46:01Z"` |
| `pd` | Promotion discount | `0` (indirimsiz) |
| `e_guid` | Event benzersiz ID | `"458157877167..."` |
| `na` | Ürün adı | `"PRODUCT A..."` |
| `qu` | Miktar | `1` |
| `pid` | Variant ID | `"44464172761271"` |
| `ta` | Taxonomy/Koleksiyonlar | `["Smart collection", "Test Automation", ...]` |
| `piu` | Product image URL | CDN URL |
| `c_product_type` | Ürün tipi | `"accessories"` |
| `pn` | Promotion name (discount kodu) | `"PRODUCT_CART50"` |
| `url` | Ürün URL | `"https://.../products/..."` |
| `c_abandoned_checkout_url` | Sepet kurtarma URL | `"https://.../checkouts/.../recover?key=..."` |
| `c_checkout_action` | Checkout aksiyonu | `"update"` |
| `platform` | Platform | `"shopify"` |
| `sid` | Session ID | `"ayaetfu9-...1757925932"` |
| `si` | Size | `"M"` |

**Not:** Discount kodu uygulandığında `pn` = discount code adı, `pd` = toplam indirim tutarı olur.

### confirmation_page_view Event (WebPixel / Custom Web Pixel)

Ödeme tamamlandıktan sonra Thank You sayfasında tetiklenir. Test edilen tam parametre listesi:

| UCD Param | Açıklama | Örnek Değer |
|-----------|----------|-------------|
| `c_delivery_options_title` | Kargo seçeneği başlığı | `["Standard"]` / `["Expedited"]` / `["International Shipping"]` |
| `c_delivery_options_type` | Kargo türü | `["shipping"]` |
| `c_product_type` | Ürün tipi | `"Калик))"` |
| `cu` | Para birimi (dönüştürülmüş) | `"USD"` |
| `device_type` | Cihaz tipi | `"WEB BROWSER"` |
| `e_guid` | Order ID | `"5705640935607"` |
| `na` | Ürün adı | unicode chars dahil |
| `nc_cu` | Orijinal para birimi (dönüştürülmemiş) | `"SGD"` |
| `nc_up` | Dönüştürülmemiş unit price | `2` |
| `nc_usp` | Dönüştürülmemiş unit sales price | `2` |
| `sc` | Kargo ücreti | `10` |
| `pid` | Variant ID | `"45068853805239"` |
| `piu` | Ürün görseli URL | CDN URL |
| `qu` | Miktar | `1` |
| `referrer` | Yönlendiren sayfa | `".../cart"` |
| `sid` | Session ID | string |
| `source` | Mağaza domain'i | `"insdev-kraken1.myshopify.com"` |
| `src` | Kaynak | `"web"` |
| `ta` | Taxonomy/Koleksiyonlar | array of strings |
| `up` | Dönüştürülmüş unit price | `1.56` |
| `url` | Ürün varyant URL | `"...?variant=..."` |
| `usp` | Dönüştürülmüş unit sales price | `1.56` |

**Discount Kodu Olan Senaryolarda Ek Parametreler:**
| UCD Param | Açıklama |
|-----------|----------|
| `pn` | Discount code adı (c_cart_coupon_codes veya c_product_coupon_codes) |
| `pd` | Toplam indirim tutarı |

### Fiyat Parametreleri Mantığı
```
up  = Dönüştürülmüş birim fiyat (indirimli)
usp = Dönüştürülmüş birim satış fiyatı
nc_up  = Orijinal birim fiyat (SGD/prezantasyon para birimi)
nc_usp = Orijinal birim satış fiyatı
sc  = Kargo ücreti (shipping cost)
pd  = Promotion discount (hediye kartı ≠ pd)
```

---

## WebPixel Test Senaryoları

### Shipping Type Testleri (confirmation_page_view)
| Test Senaryosu | `c_delivery_options_title` | `sc` |
|----------------|---------------------------|------|
| Standart kargo, discount yok | `["Standard"]` | sabit değer |
| Expedited kargo, discount yok | `["Expedited"]` | kargo fiyatı |
| International kargo, discount yok | `["International Shipping"]` | kargo fiyatı |
| Discount sadece kargoya, expedited | `["Expedited"]` | `sc = 0` |
| Discount kargoya, international | `["International Shipping"]` | `sc = 0` |

### Discount Kodu Testleri
| Test Senaryosu | Event | Kontrol Parametreleri |
|----------------|-------|-----------------------|
| Cart-level discount (1x ürün) | checkout_page_view | `pd`, `pn` (discount kodu adı), `up = usp` |
| Cart-level discount + free shipping | checkout_page_view | `pd`, `pn`, `sc = 0` |
| Product-level discount (belirli ürüne) | checkout_page_view | `pd` (sadece ilgili üründe), `pn` |
| Product-level discount (sipariş geneli) | checkout_page_view | `pd` her üründe, `pn` |
| Product-level + cart-level combined | checkout_page_view | her iki `pd` değeri |
| Discount code unicode karakter içeriyor | checkout_page_view | `pn` unicode preserve |
| Discount kargo hariç uygulanıyor | checkout_page_view | `pd > 0`, `sc` değişmez |
| BOGO (Buy 1 Get 1 Free, aynı ürün) | checkout_page_view | `pd`, `qu = 2`, `pn` |
| Buy X Get Y (farklı ürün) | checkout_page_view | `pd`, `qu`, `pn` |

### Non-ASCII / Unicode Testleri
- Ürün adı Arapça, Kiril, Türkçe karakter içeriyorsa `na` parametresi değişmemeli
- Discount kodu unicode içeriyorsa `pn` parametresi encode edilmemeli
- Taxonomy/koleksiyon adları unicode içerebilir → `ta` array'de korunmalı

---

## Storefront Test Konfigürasyonu (insdev-kraken1)

```typescript
// Test sabitleri
const PARTNER = 'insdevkraken1';
const PRODUCT_URL = 'https://insdev-kraken1.myshopify.com/products/...';
const CHECKOUT_DEBOUNCE_MS = 120_000; // checkout_page_view için 2 dakika bekle

// UCD event sorgulama (polling helper)
const ucdData = await retryUcdProfileCheckWithEvents(request, {
  identifierType: 'em',        // "em" (email) veya "pn" (phone)
  identifier: email,           // gerçek email veya phone değeri
  partner: PARTNER,
  eventList: [
    { event_name: 'checkout_page_view', params: ['up', 'usp', 'pd', 'e_guid', 'pn', 'na', 'qu'] },
  ],
  expectedEventCounts: { checkout_page_view: 1 },
  maxRetries: 25,  // checkout_page_view için; confirmation_page_view için 15
});

// Validation
// Birden fazla event data nesnesi beklenen durum (checkout — birden fazla ürün):
validateMultipleEvents(ucdData.events, 'checkout_page_view', expectedEventDataArray);

// Tek event data nesnesi beklenen durum (webpixel — confirmation_page_view):
validateSingleEvent(ucdData.events, 'confirmation_page_view', expectedEventDataObject);
```

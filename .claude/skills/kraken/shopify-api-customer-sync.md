---
name: shopify-api-customer-sync  
description: Backend architecture for Shopify Customer Bulk Updates, Metafields, WhatsApp/Double Opt-in settings, Bi-directional Sync logic, Athena Debugging, and Lead Collection Webhooks. Explains AWS Serverless flow and UCD verification logic. Use when writing tests for customer opt-in sync, metafield or tag sync, bi-directional Shopify↔Insider user data flows, or debugging via Athena webhook logs.
---

# Kraken Shopify Customer & Lead Sync API Skill

## API Information
- **Type**: High-volume Data Streaming, Bi-directional Sync & API Integration
- **Product**: Kraken (Customer Bulk Update & Sync)
- **Services**: Kinesis Data Stream, Firehose, S3, SQS, Redis, Lambda, Athena (Logging)

---

## Sync Features & Attributes

### Identifiers & Anonymous Users
- **Primary Identifiers**: Email Address, Phone Number (`pn`), and Shopify ID (`c_shopify_id`).
- **Anonymous Users**: Insider does NOT sync anonymous user data. Users without an email or phone number will not be synced between Shopify and Insider.

### Opt-in Logic & States
Shopify marketing states are strictly mapped to Insider reachable statuses:
- `subscribed` → Reachable (Subscribed for Email/SMS)
- `unsubscribe` → Unreachable (Unsubscribed from Email/SMS)
- `not_subscribed` → Unreachable (Not subscribed for Email/SMS)

**Double Opt-in:**
- If `marketing_State = Pending` in Shopify, the user received the email/SMS but hasn't approved yet.
- If `marketingOptInLevel = Confirmed_OPT_IN`, double opt-in is complete, and the `eo` (email opt-in) attribute on UCD becomes `true`.

**WhatsApp Opt-in:**
- Populated using Shopify’s `sms_marketing_consent` field.
- If enabled and a phone number is added, `whatsapp_optin` and `so` (sms_optin) attributes become `true` on UCD.
- Syncing SMS subscribers also collects email addresses since Email is Shopify's main identifier.

### Metafields
- Enabling Metafields syncs custom Shopify fields.
- Default mappings: `gender`, `birthday`, `age`, `timezone` appear as default attributes on UCD.
- Other metafields are considered custom attributes.
- Mapped customer metafields sync in real time (within ~5 minutes). Add new metafields via **Sync Shopify Customer Metafields** checkbox and map in integration; use **Refresh** if new attribute/metafield is not visible.

### User Data Collection (Shopify → Insider One)
| Shopify Attribute | Insider One Attribute |
|-------------------|----------------------|
| first_name | Name |
| last_name | Surname |
| email | Email Address |
| city | City |
| country | Country |
| LanguageCode | Language (from Insider Object, not Shopify API) |
| email_marketing_consent | Email Optin |
| email_marketing_consent* | Email Double Optin |
| phone_number | Phone Number |
| sms_marketing_consent* | SMS Optin |
| WhatsApp Optin* | (from sms_marketing_consent when enabled) |
| tags | Shopify Tags |
| shopify_id | Shopify ID |
| state | Shopify State |

### Shopify State
Differentiates customer status: **Enabled** (signed up), **Invited** (invited, not completed), **Disabled** (purchase without sign-up), **Declined** (invited but declined).

### Exclude User from Sync
Assign tag **`insider_exclude_user`** in Shopify to prevent a user from syncing to Insider One. If added when creating the user, Insider will not create them. If added after creation, Insider will not apply further updates from Shopify (user may already exist from initial sync).

### Customer Metafield Data Types (Academy)
| Shopify Data Type | Supported | Mapped to (Insider One) |
|-------------------|-----------|--------------------------|
| single_line_text_field | Yes | string |
| boolean | Yes | boolean |
| color | Yes | string |
| date, date_time | Yes | datetime |
| decimal | Yes | number |
| id | Yes | number |
| json | Yes | string |
| link | Yes | string |
| multi_line_text_field | Yes | string |
| number_integer | Yes | number |
| rating | Yes | string |
| rich_text_field | Yes | string |
| url | Yes | url |
| list.color | Yes | strings |
| list.date / list.date_time | Yes | string array |
| list.link | Yes | string array |
| list.number_integer | Yes | numbers |
| list.rating | Yes | string array |
| list.single_line_text_field | Yes | strings |
| list.url | Yes | strings |
| dimension, money, volume, weight | No | — |
| *_reference (collection, file, metaobject, page, product, variant, etc.) | No | — |

### Customer Deletion
If a store owner requests customer data deletion in Shopify, Insider One also deletes that customer from the Unified Customer Database.

### Sync Options (Insider One → Shopify)
- **Update existing + create new**: Insider can create new customer profiles in Shopify and update Email/SMS consent for existing ones.
- **Only update existing**: No new profiles; only consent updates for existing customers.
- Only Email and SMS opt-in status are sent. Email/phone are sent only if empty in Shopify; existing values are not overwritten.

### User Upload Rate Limits (Academy)
- **Shopify Standard**: 5000 users/hour
- **Shopify Advanced**: 10000 users/hour
- **Shopify Plus**: 60000 users/hour

Uploading a large number of users directly into Insider One can hit Shopify throttling when syncing back. Prefer uploading users to Shopify first so they are forwarded to Insider in a rate-limited way. See [Shopify rate limits](https://shopify.dev/docs/api/usage/limits#rate-limits).

---

## Bi-Directional Sync Architecture

### 1. UCD to Shopify (`ucd-to-shopify`)
Triggered when a partner creates/updates a user via segments, internal APIs, or lead collection forms in Insider.

**Hooks listen for:**
- `any_change: true`
- Attributes: `wbo`, `wa_opt_out_user`, `pn`, `em`, `so`, `eo`, `email_double_optin`, `global_unsubscribe`, `sms_opt_out_user`

**Rule:**
When creating/updating in Shopify via Insider, DO NOT override any information other than consent status (unless the user is completely new).

### 2. Shopify to UCD (`shopify`)
Triggered when:
- A user updates their profile on the Shopify storefront.
- An admin changes attributes in the Shopify Admin panel.

---

## Endpoints, DB Queries & Rate Limits

### UCD Verification Endpoints

| API | Method | Endpoint | Description |
|-----|--------|----------|-------------|
| Profile API | `POST` | `http://atrium.insidethekube.com/api/contact/v1/profile` | Check user attributes/events |
| Update API | `POST` | `http://atrium.insidethekube.com/api/attribute/v1/update` | Update user data (e.g., opt-in) |

---

### Debugging with Athena (Webhook Logs)

To troubleshoot opt-in or user data changes, query `kraken.webhook_logs`:
```sql
    WITH vars AS (
        SELECT 'cantest@gmail.com' AS email, '123456789' AS id
    )
    SELECT * FROM kraken.webhook_logs, vars
    WHERE integration IN ('shopify', 'ucd-to-shopify')
      AND source IN ('webhook-api', 'webhook-consumer')
      AND year = <YYYY> AND month = <MM> AND day = <DD>  -- replace with target date
      AND (payload LIKE CONCAT('%', vars.email, '%')
           OR payload LIKE CONCAT('%', vars.id, '%'))
    ORDER BY time DESC
    LIMIT 100;
```

Tip: Also check `#kraken-shopify-bot` on Slack to see latest opt-in states without querying the DB directly.

---

### Rate Limit (Shopify REST Admin)
- 40 requests / app / store / minute (80 for Shopify Plus). Replenishes 2 req/sec.

---

## API Test Flows

### Flow 1: Verifying User Attributes via UCD Profile API
```typescript
// Check if WhatsApp opt-in and Metafields are synced to UCD
const response = await request.post('http://atrium.insidethekube.com/api/contact/v1/profile', {
  headers: {
    'x-ins-namespace': 'sd-106998',
    'Content-Type': 'application/json'
  },
  data: {
    partner: "shopbagg",
    sources: ["last"],
    identifiers: { em: "testnlcustomer@example.com" },
    attributes: ["*"]
  }
});

const body = await response.json();
// Verify double opt-in or whatsapp opt-in
expect(body.data.attributes.eo).toBe(true);
expect(body.data.attributes.whatsapp_optin).toBe(true);
```

### Flow 2: Simulating Bulk Operations Finish Callback
```typescript
// Simulate Shopify notifying us that the bulk operation is finished
const response = await request.post('/api/webhook/shopify/bulk-finish', {
  headers: {
    'x-shopify-shop-domain': 'teststore.myshopify.com',
    'x-shopify-topic': 'bulk_operations/finish'
  },
  data: {
    admin_graphql_api_id: "gid://shopify/BulkOperation/12345",
    status: "COMPLETED",
    error_code: null
  }
});

expect(response.status()).toBe(200);
// System should now read the Redis state and update internal DB
```

### Flow 3: Testing Rate Limit Handling (Lead Collection)
```typescript
// Simulate rapid UCD Webhook triggers to test rate limit handling
for (let i = 0; i < 45; i++) {
  const response = await request.post('/api/ucd-webhook/lead-collected', {
    data: { email: `user${i}@test.com`, source: 'email' }
  });
  expect([200, 202]).toContain(response.status()); 
}
```

---

## Expected Behaviors & Error Handling

- **Overlapping Identifiers**: If identifiers mismatch (same email, different phone), create a NEW user in Insider with the new phone number. Do not merge incorrectly.
- **Timestamp Resolution**: If UCD has a newer timestamp than incoming Shopify consent data, DO NOT update opt-in.
- **Suppression Table**: Kraken does NOT manage suppression tables. If opt-ins are correct but delivery fails, check UCD suppression logs.
- **TIMEOUT Errors**: If `BULK_OPERATIONS_FINISH` returns TIMEOUT, retry.
- **ACCESS_DENIED Errors**: Abort file processing immediately. No retry.
- **Global Unsubscribe**: If user unsubscribes from all subscriptions, send `global_unsubscribe = 1`.
- **S3 Partitioning**: Verify Kinesis Firehose partitions S3 by `partner_name` and `status`.
- **Global Unsubscribe → Shopify Email State**: `global_unsubscribe = 1` iken `eo = True` olsa bile Shopify'da email optin `unsubscribed` olarak yansımalıdır (global unsub öncelikli).
- **WBO Unsubscribe**: WhatsApp opt-out (`wa_opt_out_user`) SMS opt-in'i (`so`) etkilememelidir; Shopify'daki SMS durumu değişmemeli.
- **Identifier Update Kuralı**: UCD'den gelen identifier güncellemesi (email/phone) Shopify'daki mevcut değerin üzerine yazılmamalıdır; yalnızca boş alan doldurmaya izin verilir.

---

## Test Automation Utilities (CustomerShopifyUCDApi)

Atlas projesinde Shopify müşteri testleri için kullanılan utility sınıfı:
`pages/Integration/ShopifyIntegration/shopify_ucd_api.py`

### Test Konfigürasyonu (TypeScript)
```typescript
// Shopify Customer API helpers için temel sabitler
const SHOPIFY_API_VERSION = '2026-01';
const SHOPIFY_STORE       = 'shopifytest';  // .myshopify.com prefix
const PARTNER_NAME        = 'shopifytest';  // Insider partner name
const shopifyHeaders = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN!,
  'Content-Type': 'application/json',
};
const shopifyBaseUrl = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/customers`;
const ucdProfileUrl  = `http://atrium.insidethekube.com/api/contact/v1/profile`;
const ucdHeaders = {
  'X-REQUEST-TOKEN': process.env.UCD_API_KEY!,
  'X-PARTNER-NAME':  PARTNER_NAME,
  'Content-Type':    'application/json',
};
```

### Temel API Metodları

| Metod | Açıklama |
|-------|----------|
| `create_and_get_shopify_customer_data(email_marketing_state, sms_marketing_state)` | Shopify'da yeni müşteri oluşturur (subscribed/unsubscribed/not_subscribed) |
| `get_shopify_data(customer_id, store)` | Shopify REST API'den müşteri verisi çeker |
| `update_shopify_optin_data(customer_id, email_marketing_state, sms_marketing_state)` | Müşteri opt-in durumunu günceller; retry mekanizması vardır |
| `delete_shopify_user(customer_id)` | Shopify'dan müşteriyi siler (test teardown) |
| `get_ucd_data(email)` | Atrium UCD Profile API'den müşteri verisi çeker (email ile) |
| `get_ucd_data_with_pn(phone)` | Atrium UCD Profile API'den müşteri verisi çeker (phone ile) |
| `send_ucd_request(email)` | Ham UCD request gönderir (POST) |
| `send_ucd_request_with_phone(phone)` | Telefon numarasıyla UCD sorgusu yapar |
| `get_email_marketing_consent_state(customer_id)` | Shopify'dan email optin state döner (`True`/`False`/`'not_subscribed'`) |
| `get_sms_marketing_consent_state(customer_id)` | Shopify'dan SMS optin state döner |
| `get_shopify_metafields(customer_id)` | Müşteri metafield'larını çeker |
| `create_shopify_metafields(customer_id, metafields)` | Metafield ekler/günceller |
| `update_customer_tags(customer_id, tags)` | Müşteriye tag listesi atar |
| `update_customer_identifier(customer_id, identifier_type, new_identifier)` | Email (`em`) veya telefon (`pn`) günceller |
| `insert_metadata_attribute(partner, attribute_key, attribute_type)` | UCD metadata attribute ekler |
| `get_shopify_customer_by_query_normalized(query)` | Shopify search API ile müşteri bulur, normalize eder |
| `normalize_shopify_customer(customer)` | Shopify müşteri dict'ini standart formata çevirir |

### UCD Polling Metodları (Exponential Backoff)

| Metod | Bekleme Mantığı | Kullanım Amacı |
|-------|-----------------|----------------|
| `fetch_live_ucd_data(email, user_type, ...)` | İlk retry: 60s, sonraki: `5 * 2^n` sn | Email/SMS opt-in field'larının gelmesini bekler |
| `fetch_live_ucd_data_with_phone(phone, ...)` | `8 * 2^n` sn | Telefon identifier ile UCD sync bekler |
| `wait_for_ucd_state_update(email, eo=..., so=..., ...)` | `10 * 2^n` sn | Belirli opt-in state değerlerini bekler |
| `wait_for_ucd_customer_update(email, key_to_check=..., **expected)` | İlk retry: 60s, sonraki: 30s | Metafield veya custom attribute güncellenmesini bekler |
| `wait_for_ucd_tag_update(email, expected_tags)` | İlk retry: 60s, sonraki: `10 * 2^n` sn | c_shopify_tags array sync bekler |
| `wait_for_ucd_shopify_sync(buffer_time=120)` | Sabit bekleme | UCD → Shopify sync için basit buffer |

### Zorunlu UCD Field'ları (user_type'a göre)
```typescript
// Polling sırasında hangi field'ların dolu olduğu kontrol edilir
const REQUIRED_FIELDS_BY_USER_TYPE: Record<string, string[]> = {
  'email_un/subscribed': ['c_shopify_id', 'em', 'global_unsubscribe', 'eo'],
  'sms_un/subscribed':   ['c_shopify_id', 'sms_opt_out_user', 'so'],
  'not_subscribed':      ['c_shopify_id', 'em'],
};
```

### UCD Field Referansı (Shopify ↔ UCD)
| UCD Field | Açıklama | Değer Tipi |
|-----------|----------|-----------|
| `c_shopify_id` | Shopify customer ID | string (int olarak normalize edilmeli) |
| `em` | E-posta adresi | string |
| `pn` | Telefon numarası | string |
| `eo` | Email opt-in | boolean |
| `so` | SMS opt-in | boolean |
| `global_unsubscribe` | Tüm kanallardan çıkış | 0 veya 1 |
| `sms_opt_out_user` | SMS opt-out flag | boolean |
| `c_shopify_tags` | Shopify tag listesi | array of strings |
| `bi` | Doğum tarihi (metafield: birthday) | date string |
| `ge` | Cinsiyet (metafield: gender) | string |
| `ag` | Yaş (metafield: age) | number |
| `c_vip_tier` | VIP seviyesi (metafield: vipTier) | string |

### Key Normalization (Shopify Metafield → UCD)
```typescript
// Shopify metafield key → UCD attribute key dönüşümü
const KEY_MAPPING: Record<string, string> = {
  birthday: 'bi',
  gender:   'ge',
  age:      'ag',
  vipTier:  'c_vip_tier',
};
// Diğer tüm metafield'lar: 'c_' prefix eklenir
// Örnek: "custom_field" → "c_custom_field"
function normalizeKey(shopifyKey: string): string {
  return KEY_MAPPING[shopifyKey] ?? `c_${shopifyKey}`;
}
```

### Value Normalization
```typescript
// Değer normalizasyon kuralları:
// - Datetime string → sadece tarih kısmı: "2025-11-21T00:00:00Z" → "2025-11-21"
// - JSON string → parse edilir
// - Tek elemanlı array → string olarak döner, çok elemanlıysa string[] kalır
function normalizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.includes('T') && value.length >= 10) {
      const datePart = value.split('T')[0];
      if (datePart.length === 10) return datePart;
    }
    try { return JSON.parse(value); } catch { /* not JSON */ }
  }
  if (Array.isArray(value)) {
    const strArr = value.map(String);
    return strArr.length === 1 ? strArr[0] : strArr;
  }
  return value;
}
```

### Unit Normalization (Boyut/Ağırlık Metafield)
| Shopify Unit | UCD Unit |
|-------------|---------|
| MILLIMETERS | mm |
| GRAMS | g |
| CENTIMETERS | cm |
| METERS | m |
| MILLILITERS | ml |

### Tipik Test Senaryoları (UserSync)

**Shopify → Insider (LiveSync/HistoricalSync)**
- Email subscribed/unsubscribed/not_subscribed → UCD `eo` field doğrulama
- SMS subscribed/unsubscribed/not_subscribed → UCD `so` + `sms_opt_out_user` doğrulama
- Email not_subscribed → not_subscribed'dan subscribed'a yükseltme
- Email subscribed → subscribed'dan unsubscribed'a düşürme
- SMS not_subscribed → subscribed'a yükseltme
- SMS subscribed → unsubscribed'a düşürme
- Email resubscription (unsubscribed → subscribed)
- SMS resubscription (unsubscribed → subscribed)
- Customer metafields sync → UCD custom attribute doğrulama
- Customer tags sync → UCD `c_shopify_tags` array doğrulama

**Insider → Shopify (LiveSync/InsiderToShopify)**
- UCD'den yeni customer create → Shopify'da görünmeli (`email:xxx` query)
- UCD `eo=True, global_unsub=0` → Shopify email state `subscribed`
- UCD `eo=True, global_unsub=1` → Shopify email state `unsubscribed` (global_unsub öncelikli)
- UCD `so=True, sms_opt_out=0` → Shopify SMS state `subscribed`
- UCD `so=True, sms_opt_out=1` → Shopify SMS state `unsubscribed`
- SMS unsubscription → Shopify'da SMS state güncellenmeli
- WBO (wa_opt_out) unsubscription → Shopify SMS durumunu etkilememeli
- Identifier update (email farklıysa) → Shopify'daki mevcut email korunmalı
- Identifier update (phone farklıysa) → Shopify'daki mevcut phone korunmalı

**Historical Sync**
- Mevcut müşteri: email subscribed, unsubscribed, not_subscribed durumları
- Mevcut müşteri: SMS subscribed, unsubscribed, not_subscribed durumları
- Mevcut müşteri: attribute & metafield sync doğrulama
- Mevcut olmayan müşteri: UCD'de kayıt oluşmamalı

### Test Pattern (ShopifyToInsider LiveSync)
```typescript
test('live customer email/SMS unsubscribe syncs to UCD', async ({ request }) => {
  // 1. Shopify'da müşteri oluştur (subscribed)
  const email = `auto_${Date.now()}@example.com`;
  const createRes = await request.post(`${shopifyBaseUrl}.json`, {
    headers: shopifyHeaders,
    data: {
      customer: {
        email,
        verified_email: true,
        email_marketing_consent: { state: 'subscribed', opt_in_level: 'single_opt_in' },
        sms_marketing_consent:   { state: 'subscribed', opt_in_level: 'single_opt_in' },
      },
    },
  });
  const { customer } = await createRes.json();
  const customerId: number = customer.id;

  // 2. UCD'de müşteri görünmesini bekle (eo + c_shopify_id bekleniyor)
  const liveUcdData = await pollUcdProfile(request, { em: email }, PARTNER_NAME, {
    requiredFields: ['c_shopify_id', 'em', 'global_unsubscribe', 'eo'],
  });
  expect(parseInt(liveUcdData.c_shopify_id, 10)).toBe(customerId);

  // 3. Shopify opt-in durumunu güncelle (unsubscribed)
  await request.put(`${shopifyBaseUrl}/${customerId}.json`, {
    headers: shopifyHeaders,
    data: {
      customer: {
        id: customerId,
        email_marketing_consent: { state: 'unsubscribed', opt_in_level: 'single_opt_in' },
        sms_marketing_consent:   { state: 'unsubscribed', opt_in_level: 'single_opt_in' },
      },
    },
  });

  // 4. UCD'de state güncellemesini bekle (eo = false, so = false)
  const updatedUcd = await pollUcdProfile(request, { em: email }, PARTNER_NAME, {
    expectedValues: { eo: false, so: false },
  });

  // 5. Doğrula
  expect(updatedUcd.eo).toBe(false);
  expect(updatedUcd.so).toBe(false);

  // 6. Teardown
  await request.delete(`${shopifyBaseUrl}/${customerId}.json`, { headers: shopifyHeaders });
});
```

### Test Pattern (InsiderToShopify LiveSync)
```typescript
test('new customer created via UCD syncs to Shopify', async ({ request }) => {
  // 1. UCD üzerinden Shopify'da müşteri oluştur
  const newEmail = `ucd_${Date.now()}@example.com`;
  await request.post('https://unification.useinsider.com/api/user/v1/upsert', {
    data: {
      users: [{
        identifiers: { em: newEmail },
        attributes: { eo: true, global_unsubscribe: 0 },
      }],
    },
  });

  // 2. Shopify'da müşterinin oluştuğunu doğrula (polling)
  const customer = await pollShopifyCustomerByQuery(request, `email:${newEmail}`, shopifyHeaders);

  // 3. UCD sync doğrula
  const liveUcdData = await pollUcdProfile(request, { em: customer.email }, PARTNER_NAME, {
    requiredFields: ['c_shopify_id', 'em', 'global_unsubscribe', 'eo'],
  });

  // 4. Doğrulama
  expect(customer.id).toBe(parseInt(liveUcdData.c_shopify_id, 10));
  expect(customer.email).toBe(liveUcdData.em);

  // 5. Teardown
  await request.delete(`${shopifyBaseUrl}/${customer.id}.json`, { headers: shopifyHeaders });
});
```

---

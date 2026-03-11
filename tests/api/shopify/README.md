# Shopify API Testleri

Shopify Live Sync senaryolarını Playwright API test runner ile doğrular.
Müşteri oluşturma, opt-in durum değişiklikleri ve UCD senkronizasyonunu kapsar.

---

## Konfigürasyon (`.env`)

```env
ENV=prod                                  # prod | preprod | staging
UCD_API_KEY=<your_ucd_api_key>
PROD_SHOPIFY_LIVE_SYNC_TOKEN=shpat_...
SHOPIFY_AUTOMATION_STORE_TOKEN=shpat_...
INSDEV_MARKET_AUTOMATION_TOKEN=shpat_...
# ...diğer store token'ları
```

`ENV` → Store eşleşmesi:

| ENV | Store |
|---|---|
| `prod` | PROD_LIVE_SYNC (`insdev-test-automation-kraken`) |
| `preprod` | PROD_HISTORICAL_SYNC (`insdev-automation-kraken`) |
| `staging` | STORE_1 (`ins-qa-automation-1`) |

---

## Testleri Çalıştırma

```bash
# Tüm Shopify testleri
npx playwright test tests/api/shopify --project=api

# Belirli bir test
npx playwright test tests/api/shopify/sms-optin-subscribed-to-unsubscribed.spec.ts --project=api

# Allure raporu ile
npx playwright test tests/api/shopify --project=api \
  && npx allure generate allure-results --clean \
  && npx allure open
```

---

## Test Senaryoları

| Dosya | TC ID | Senaryo |
|---|---|---|
| `sms-optin-subscribed-to-unsubscribed.spec.ts` | TC-6829 / TC-6827 / TC-6830 | SMS opt-in tam lifecycle: Subscribed → Unsubscribed → Resubscribed |
| `email-sms-optin-subscribed-to-unsubscribed.spec.ts` | — | Email + SMS opt-in: Subscribed → Unsubscribed |

---

## Mimari

Testler **component tabanlı** tasarımla yazılmıştır. Her lifecycle aşaması
`src/pages/medusa/sms-optin/` altında ayrı bir component'tır:

```
src/pages/medusa/sms-optin/
├── create-customer.component.ts   # Adım 1: Müşteri oluştur + UCD ilk sync
├── sms-unsubscribe.component.ts   # Adım 2: Unsubscribe + UCD doğrula
└── sms-resubscribe.component.ts   # Adım 3: Resubscribe + UCD recovery
```

Her component `@Step` decorator ile sarılıdır — Allure raporunda aşamalar ayrı görünür.

Paylaşılan sabitler (`EmailState`, `SmsState`, `UcdExpected` vb.) `src/data/shopify/shopify.data.ts` içindedir.

---

## Servisler

| Sınıf | Dosya | Sorumluluk |
|---|---|---|
| `ShopifyService` | `src/api/shopify.service.ts` | Müşteri CRUD, opt-in güncelleme |
| `UcdService` | `src/api/ucd.service.ts` | UCD profil sorgulama, polling |
| `ShopifyStoreConfig` | `src/data/shopify/shopify-config.ts` | ENV → store config çözümleyici |

---

## Timeout Notları

- Full lifecycle sync (Subscribed → Unsubscribed → Resubscribed) **6–8 dakika** sürebilir.
- Test timeout `10 * 60 * 1000` ms olarak ayarlanmıştır.
- `UcdService.fetchWithPolling` → ilk bekleme 60 s, sonraki denemeler exponential back-off.
- `UcdService.waitForStateUpdate` → 30 s ilk bekleme, sonra 15 s aralıklarla max 12 deneme.

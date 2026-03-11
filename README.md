# Insider Playwright Automation

Playwright + TypeScript tabanlı enterprise test otomasyon projesi.
API, Web, Mobile ve Visual Regression testlerini kapsar.

---

## Proje Yapısı

```
src/
├── api/                        # API servis sınıfları
├── core/                       # Base class'lar, fixture'lar, helper'lar
│   ├── base.page.ts            # BasePage + @Step decorator
│   ├── base.service.ts         # BaseService (API)
│   ├── fixture.base.ts         # Custom Playwright fixture'ları
│   ├── global-setup.ts         # Auth storage state setup
│   ├── helper.ts               # Yardımcı fonksiyonlar
│   ├── popup-handler.ts        # Otomatik popup kapatma
│   └── visual.helpers.ts       # Visual test stabilizer'ları
├── data/
│   ├── shopify/                # Shopify test verileri ve config
│   └── visual/                 # Visual test sabitleri (URL, selector, timeout)
├── enums/                      # Enum tanımları
└── pages/
    ├── login/                  # Uygulama giriş sayfası (OTP destekli)
    ├── medusa/                 # Medusa entegrasyon component'ları
    │   └── sms-optin/          # SMS opt-in lifecycle component'ları
    └── panel/                  # Insider Panel sayfaları (visual test auth)

tests/
├── api/
│   └── shopify/                # Shopify Live Sync API testleri
├── visual-test/                # Visual regression testleri
├── web/                        # Web E2E testleri
└── mobile/                     # Mobile E2E testleri
```

---

## Kurulum

```bash
npm install
npx playwright install
```

---

## Ortam Konfigürasyonu

Proje kökünde `.env` dosyası oluştur:

```env
# Ortam seçimi — store ve UCD domain'i belirler
# Değerler: prod | preprod | staging
ENV=prod

# UCD / Atrium API key
UCD_API_KEY=<your_ucd_api_key>

# Shopify store token'ları
SHOPIFY_STORE_1_TOKEN=shpat_...
SHOPIFY_STORE_2_TOKEN=shpat_...
SHOPIFY_STORE_3_TOKEN=shpat_...
SHOPIFY_STORE_4_TOKEN=shpat_...
SHOPIFY_STORE_5_TOKEN=shpat_...
SHOPIFY_STORE_6_TOKEN=shpat_...
PROD_SHOPIFY_LIVE_SYNC_TOKEN=shpat_...
SHOPIFY_AUTOMATION_STORE_TOKEN=shpat_...
INSDEV_MARKET_AUTOMATION_TOKEN=shpat_...

# Panel auth (visual testler için)
PLAYWRIGHT_USER_EMAIL=test@example.com
PLAYWRIGHT_USER_PASSWORD=secret
```

`ENV` → Store & UCD domain eşleşmesi:

| ENV | Store | UCD Domain |
|---|---|---|
| `prod` | PROD_LIVE_SYNC | useinsider.com |
| `preprod` | PROD_HISTORICAL_SYNC | useinsider.com |
| `staging` | STORE_1 | useinsider.com |
| *(tanımsız)* | PROD_LIVE_SYNC | useinsider.com |

Yerel Kubernetes kullanımı için `.env`'e `LOCAL_KUBE=1` ekle → UCD domain `insidethekube.com` olur.

---

## Testleri Çalıştırma

```bash
# API testleri
npx playwright test --project=api

# Web testleri
npx playwright test --project=web

# Mobile testleri
npx playwright test --project=mobile-android
npx playwright test --project=mobile-ios

# Visual regression testleri
npx playwright test --project=visual

# Belirli bir test dosyası
npx playwright test tests/api/shopify/sms-optin-subscribed-to-unsubscribed.spec.ts --project=api

# Debug modu
npx playwright test --debug

# UI modu
npx playwright test --ui
```

---

## Visual Regression

### İlk snapshot oluşturma / güncelleme

```bash
npx playwright test --project=visual --update-snapshots
```

- Snapshot **yoksa oluşturur**
- Snapshot **varsa üzerine yazar**

### Normal karşılaştırma (CI)

```bash
npx playwright test --project=visual
```

- Kayıtlı snapshot ile karşılaştırır; fark varsa **test fail eder**

| Komut | Davranış |
|---|---|
| `--update-snapshots` | Mevcut hali doğru kabul et, kaydet |
| *(yok)* | Kayıtlı snapshot ile karşılaştır |

Snapshot'lar `snapshots/` klasöründe tutulur.

---

## Raporlama (Allure)

```bash
# Test çalıştır + rapor oluştur
npx playwright test --project=api
npx allure generate allure-results --clean
npx allure open
```

---

## Path Alias'ları

```typescript
@core/*   → src/core/*
@api/*    → src/api/*
@pages/*  → src/pages/*
@data/*   → src/data/*
@src/*    → src/*
@enums/*  → src/enums/*```


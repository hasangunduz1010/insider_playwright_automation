import { ShopifyEnv } from './shopify-env';

// ─── ShopifyStoreInfo ─────────────────────────────────────────────────────────

export interface ShopifyStoreInfo {
  shopUrl: string;
  partner: string;
  locale: string;
  currency: string;
  tokenKey: keyof typeof ShopifyEnv;
  apiVersion: string;
}

// ─── ShopifyStores ────────────────────────────────────────────────────────────

export const ShopifyStores = {
  STORE_1: {
    shopUrl: 'ins-qa-automation-1',
    partner: 'krakentest',
    locale: 'en_US:36206313714',
    currency: 'USD',
    tokenKey: 'SHOPIFY_STORE_1_TOKEN',
    apiVersion: '2026-01',
  },
  STORE_2: {
    shopUrl: 'ins-qa-automation-2',
    partner: 'shopbagg',
    locale: 'en_US:37539774720',
    currency: 'USD',
    tokenKey: 'SHOPIFY_STORE_2_TOKEN',
    apiVersion: '2026-01',
  },
  STORE_3: {
    shopUrl: 'ins-qa-automation-3',
    partner: 'inshoppingcart',
    locale: 'en_US:37907398715',
    currency: 'USD',
    tokenKey: 'SHOPIFY_STORE_3_TOKEN',
    apiVersion: '2026-01',
  },
  STORE_4: {
    shopUrl: 'ins-qa-automation-4',
    partner: 'insdevkraken1',
    locale: 'en_US:43930452153',
    currency: 'TRY',
    tokenKey: 'SHOPIFY_STORE_4_TOKEN',
    apiVersion: '2026-01',
  },
  STORE_5: {
    shopUrl: 'ins-qa-automation-5',
    partner: 'shopbagg',
    locale: 'en_US:40112947391',
    currency: 'EUR',
    tokenKey: 'SHOPIFY_STORE_5_TOKEN',
    apiVersion: '2026-01',
  },
  STORE_6: {
    shopUrl: 'ins-qa-automation-6',
    partner: 'insdevkraken2',
    locale: 'en_US:36387225818',
    currency: 'AED',
    tokenKey: 'SHOPIFY_STORE_6_TOKEN',
    apiVersion: '2026-01',
  },
  /** Production / Jenkins — Live Sync Automation */
  PROD_LIVE_SYNC: {
    shopUrl: 'insdev-test-automation-kraken',
    partner: 'shopifytest',
    locale: 'es_ES',
    currency: 'SGD',
    tokenKey: 'PROD_SHOPIFY_LIVE_SYNC_TOKEN',
    apiVersion: '2026-01',
  },
  /** Production / Jenkins — Historical Sync Automation */
  PROD_HISTORICAL_SYNC: {
    shopUrl: 'insdev-automation-kraken',
    partner: 'insdevautomation',
    locale: 'fi_FI',
    currency: 'USD',
    tokenKey: 'SHOPIFY_AUTOMATION_STORE_TOKEN',
    apiVersion: '2026-01',
  },
  MARKET_SYNC: {
    shopUrl: 'insdev-marketautomation',
    partner: 'insdevmedusa1',
    locale: 'en_US',
    currency: 'USD',
    tokenKey: 'INSDEV_MARKET_AUTOMATION_TOKEN',
    apiVersion: '2026-01',
  },
} as const satisfies Record<string, ShopifyStoreInfo>;

export type ShopifyStoreKey = keyof typeof ShopifyStores;

// ─── ResolvedStoreConfig ──────────────────────────────────────────────────────

export interface ResolvedStoreConfig {
  shopUrl: string;
  token: string;
  partner: string;
  locale: string;
  currency: string;
  apiVersion: string;
}

// ─── ShopifyStoreConfig ───────────────────────────────────────────────────────

const ENV_STORE_MAP: Record<string, ShopifyStoreInfo> = {
  prod:    ShopifyStores.PROD_LIVE_SYNC,
  preprod: ShopifyStores.PROD_HISTORICAL_SYNC,
  staging: ShopifyStores.STORE_1,
};

export class ShopifyStoreConfig {
  /** Returns the default store for the current ENV, or falls back to PROD_LIVE_SYNC. */
  static defaultStore(): ShopifyStoreInfo {
    const env = process.env['ENV'] ?? 'prod';
    return ENV_STORE_MAP[env] ?? ShopifyStores.PROD_LIVE_SYNC;
  }

  static resolveConfig(store: ShopifyStoreInfo = ShopifyStoreConfig.defaultStore()): ResolvedStoreConfig {
    return {
      shopUrl: store.shopUrl,
      token: ShopifyEnv[store.tokenKey] as string,
      partner: store.partner,
      locale: store.locale,
      currency: store.currency,
      apiVersion: store.apiVersion,
    };
  }
}

import { Environment } from './environments';
import { SettingKeys } from './setting-keys';
import { Settings } from './settings';

// ─── ShopifyStoreInfo ─────────────────────────────────────────────────────────

export interface ShopifyStoreInfo {
  shopUrl: string;
  partner: string;
  locale: string;
  currency: string;
  tokenKey: string;
  apiVersion: string;
}

// ─── ShopifyStores ────────────────────────────────────────────────────────────

export const ShopifyStores = {
  STORE_1: {
    shopUrl: 'ins-qa-automation-1',
    partner: 'krakentest',
    locale: 'en_US:36206313714',
    currency: 'USD',
    tokenKey: SettingKeys.SHOPIFY_STORE_1_TOKEN,
    apiVersion: '2026-01',
  },
  STORE_2: {
    shopUrl: 'ins-qa-automation-2',
    partner: 'shopbagg',
    locale: 'en_US:37539774720',
    currency: 'USD',
    tokenKey: SettingKeys.SHOPIFY_STORE_2_TOKEN,
    apiVersion: '2026-01',
  },
  STORE_3: {
    shopUrl: 'ins-qa-automation-3',
    partner: 'inshoppingcart',
    locale: 'en_US:37907398715',
    currency: 'USD',
    tokenKey: SettingKeys.SHOPIFY_STORE_3_TOKEN,
    apiVersion: '2026-01',
  },
  STORE_4: {
    shopUrl: 'ins-qa-automation-4',
    partner: 'insdevkraken1',
    locale: 'en_US:43930452153',
    currency: 'TRY',
    tokenKey: SettingKeys.SHOPIFY_STORE_4_TOKEN,
    apiVersion: '2026-01',
  },
  STORE_5: {
    shopUrl: 'ins-qa-automation-5',
    partner: 'shopbagg',
    locale: 'en_US:40112947391',
    currency: 'EUR',
    tokenKey: SettingKeys.SHOPIFY_STORE_5_TOKEN,
    apiVersion: '2026-01',
  },
  STORE_6: {
    shopUrl: 'ins-qa-automation-6',
    partner: 'insdevkraken2',
    locale: 'en_US:36387225818',
    currency: 'AED',
    tokenKey: SettingKeys.SHOPIFY_STORE_6_TOKEN,
    apiVersion: '2026-01',
  },
  /** Production / Jenkins — Live Sync Automation */
  PROD_LIVE_SYNC: {
    shopUrl: 'insdev-test-automation-kraken',
    partner: 'shopifytest',
    locale: 'es_ES',
    currency: 'SGD',
    tokenKey: SettingKeys.PROD_SHOPIFY_LIVE_SYNC_TOKEN,
    apiVersion: '2026-01',
  },
  /** Production / Jenkins — Historical Sync Automation */
  PROD_HISTORICAL_SYNC: {
    shopUrl: 'insdev-automation-kraken',
    partner: 'insdevautomation',
    locale: 'fi_FI',
    currency: 'USD',
    tokenKey: SettingKeys.SHOPIFY_AUTOMATION_STORE_TOKEN,
    apiVersion: '2026-01',
  },
  MARKET_SYNC: {
    shopUrl: 'insdev-marketautomation',
    partner: 'insdevmedusa1',
    locale: 'en_US',
    currency: 'USD',
    tokenKey: SettingKeys.INSDEV_MARKET_AUTOMATION_TOKEN,
    apiVersion: '2026-01',
  },
} as const satisfies Record<string, ShopifyStoreInfo>;

export type ShopifyStoreKey = keyof typeof ShopifyStores;

// ─── ShopifyStoreConfig ───────────────────────────────────────────────────────

export interface ResolvedStoreConfig {
  shopUrl: string;
  token: string;
  partner: string;
  locale: string;
  currency: string;
  apiVersion: string;
}

export class ShopifyStoreConfig {
  static getStoreForEnvironment(environment: Environment): ShopifyStoreInfo {
    const prodEnvs: Environment[] = [
      Environment.JENKINS_TEST,
      Environment.JENKINS_DEPLOYMENT,
      Environment.JENKINS_DEPLOYMENT_WINDOWS,
    ];
    return prodEnvs.includes(environment) ? ShopifyStores.PROD_LIVE_SYNC : ShopifyStores.STORE_1;
  }

  static getToken(settings: Settings, store: ShopifyStoreInfo): string {
    return settings.get(store.tokenKey as any);
  }

  static getStoreConfig(settings: Settings, store: ShopifyStoreInfo): ResolvedStoreConfig {
    return {
      shopUrl: store.shopUrl,
      token: ShopifyStoreConfig.getToken(settings, store),
      partner: store.partner,
      locale: store.locale,
      currency: store.currency,
      apiVersion: store.apiVersion,
    };
  }

  static resolveConfig(settings: Settings, store?: ShopifyStoreInfo): ResolvedStoreConfig {
    const resolvedStore = store ?? ShopifyStoreConfig.getStoreForEnvironment(settings.env);
    return ShopifyStoreConfig.getStoreConfig(settings, resolvedStore);
  }
}

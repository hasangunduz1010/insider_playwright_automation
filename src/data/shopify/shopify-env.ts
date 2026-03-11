import * as dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}. Add it to .env`);
  return value;
}

export const ShopifyEnv = {
  // UCD
  UCD_API_KEY: requireEnv('UCD_API_KEY'),
  UCD_DOMAIN: process.env['LOCAL_KUBE'] === '1' ? 'insidethekube.com' : 'useinsider.com',

  // Shopify store tokens
  SHOPIFY_STORE_1_TOKEN:          requireEnv('SHOPIFY_STORE_1_TOKEN'),
  SHOPIFY_STORE_2_TOKEN:          requireEnv('SHOPIFY_STORE_2_TOKEN'),
  SHOPIFY_STORE_3_TOKEN:          requireEnv('SHOPIFY_STORE_3_TOKEN'),
  SHOPIFY_STORE_4_TOKEN:          requireEnv('SHOPIFY_STORE_4_TOKEN'),
  SHOPIFY_STORE_5_TOKEN:          requireEnv('SHOPIFY_STORE_5_TOKEN'),
  SHOPIFY_STORE_6_TOKEN:          requireEnv('SHOPIFY_STORE_6_TOKEN'),
  PROD_SHOPIFY_LIVE_SYNC_TOKEN:   requireEnv('PROD_SHOPIFY_LIVE_SYNC_TOKEN'),
  SHOPIFY_AUTOMATION_STORE_TOKEN: requireEnv('SHOPIFY_AUTOMATION_STORE_TOKEN'),
  INSDEV_MARKET_AUTOMATION_TOKEN: requireEnv('INSDEV_MARKET_AUTOMATION_TOKEN'),
} as const;

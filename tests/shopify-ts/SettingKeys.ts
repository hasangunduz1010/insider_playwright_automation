/**
 * Keys used to read values from environment variables.
 * Mirrors Python's SettingKeys — only the keys relevant to Shopify Live Sync tests.
 */
export const SettingKeys = {
  // Partner / panel
  PARTNER_NAME: 'partner_name',
  PARTNER_ID: 'partner_id',
  PARTNER_PANEL_URL: 'partner_panel_url',
  PARTNER_SITE_URL: 'partner_site_url',

  // UCD
  UCD_API_KEY: 'ucd_api_key',

  // Shopify store tokens
  SHOPIFY_STORE_1_TOKEN: 'shopify_store_1_token',
  SHOPIFY_STORE_2_TOKEN: 'shopify_store_2_token',
  SHOPIFY_STORE_3_TOKEN: 'shopify_store_3_token',
  SHOPIFY_STORE_4_TOKEN: 'shopify_store_4_token',
  SHOPIFY_STORE_5_TOKEN: 'shopify_store_5_token',
  SHOPIFY_STORE_6_TOKEN: 'shopify_store_6_token',
  PROD_SHOPIFY_LIVE_SYNC_TOKEN: 'prod_shopify_live_sync_token',
  SHOPIFY_AUTOMATION_STORE_TOKEN: 'shopify_automation_store_token',
  INSDEV_MARKET_AUTOMATION_TOKEN: 'insdev_market_automation_token',
} as const;

export type SettingKey = (typeof SettingKeys)[keyof typeof SettingKeys];

import { test, expect } from '@core/fixture.base';
import ShopifyService from '@api/shopify.service';
import UcdService from '@api/ucd.service';
import { Settings } from '@data/shopify/settings';
import { ShopifyStoreConfig, ShopifyStores } from '@data/shopify/shopify-config';
import { SettingKeys } from '@data/shopify/setting-keys';
import { EmailState, SmsState, UcdExpected, UcdIdentifier } from './shopify.data';

/**
 * TC-6829 / TC-6827
 * Verifies that a Shopify customer's SMS opt-in state transitions from
 * "subscribed" to "unsubscribed" and is correctly reflected in UCD.
 *
 * Owner:  | Priority: MEDIUM | Team: kraken | Env: PRODUCTION
 */

test.use({
  epic: 'Shopify',
  feature: 'Live Sync',
  story: 'SMS Optin: Subscribed → Unsubscribed',
});

test('TC-6829 / TC-6827: SMS opt-in transitions from subscribed to unsubscribed', async ({ request}) => {
  const settings = new Settings();
  const config = ShopifyStoreConfig.resolveConfig(settings, ShopifyStores.PROD_LIVE_SYNC);

  const shopify = new ShopifyService(request, config.shopUrl, config.apiVersion, config.token);
  const ucd = new UcdService(request, config.partner, settings.getDomain(), settings.get(SettingKeys.UCD_API_KEY));

  let customerId: number | undefined;

  try {
    // ── Step 1: Create subscribed customer and verify in UCD ─────────────────
    const customer = await shopify.createCustomer(EmailState.NOT_SUBSCRIBED, SmsState.SUBSCRIBED);
    customerId = customer.id;
    const email = customer.email;

    const { ucdData: initialUcdData } = await ucd.fetchWithPolling(UcdIdentifier.EMAIL, email);

    expect(customerId).toBe(parseInt(initialUcdData.c_shopify_id, 10));
    expect(await shopify.getSmsConsentState(customerId)).toBe(initialUcdData.so);

    // ── Step 2: Update SMS consent to unsubscribed ───────────────────────────
    await ucd.waitForSync(60_000);
    const updatedCustomer = await shopify.updateOptin(
      customerId,
      EmailState.SUBSCRIBED,
      SmsState.UNSUBSCRIBED,
    );

    expect(updatedCustomer.sms_marketing_consent?.state).toBe(SmsState.UNSUBSCRIBED);

    // ── Step 3: Verify unsubscribed state on both Shopify and UCD ────────────
    const { ucdData: updatedUcdData } = await ucd.waitForStateUpdate(email, {
      ...UcdExpected.SMS_UNSUBSCRIBED,
      identifierValue: email,
    });

    expect(await shopify.getSmsConsentState(customerId)).toBe(updatedUcdData.so);
    expect(updatedUcdData.sms_opt_out_user).toBe(true);
  } finally {
    // ── Cleanup: always delete the created customer ───────────────────────────
    if (customerId !== undefined) {
      await shopify.deleteCustomer(customerId);
    }
  }
});

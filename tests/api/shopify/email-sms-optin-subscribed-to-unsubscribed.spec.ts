import { test, expect } from '@core/fixture.base';
import ShopifyService from '@api/shopify.service';
import UcdService from '@api/ucd.service';
import { Settings } from '@data/shopify/settings';
import { ShopifyStoreConfig, ShopifyStores } from '@data/shopify/shopify-config';
import { SettingKeys } from '@data/shopify/setting-keys';
import { EmailState, SmsState, UcdExpected, UcdIdentifier, UcdRequiredFields } from './shopify.data';

/**
 * Opt-in Change - Sub to Unsub (email + phone number)
 *
 * Prerequisites:
 *   - Access to Shopify with permissions to view and modify subscription statuses.
 *   - Access to the Insider platform to verify UCD synchronization.
 *   - User Subs toggle must be enabled.
 *
 * Owner:  | Priority: MEDIUM | Team: kraken | Env: PRODUCTION
 */

test.use({
  epic: 'Shopify',
  feature: 'Live Sync',
  story: 'Email + SMS Optin: Subscribed → Unsubscribed',
});

test('Email + SMS opt-in transitions from subscribed to unsubscribed', async ({ request }) => {
  const settings = new Settings();
  const config = ShopifyStoreConfig.resolveConfig(settings, ShopifyStores.PROD_LIVE_SYNC);

  const shopify = new ShopifyService(request, config.shopUrl, config.apiVersion, config.token);
  const ucd = new UcdService(
    request,
    config.partner,
    settings.getDomain(),
    settings.get(SettingKeys.UCD_API_KEY),
  );

  let customerId: number | undefined;

  try {
    // ── Step 1: Create customer subscribed for both email and SMS ─────────────
    const customer = await shopify.createCustomer(EmailState.SUBSCRIBED, SmsState.SUBSCRIBED);
    customerId = customer.id;
    const email = customer.email;

    const { ucdData: initialUcdData } = await ucd.fetchWithPolling(UcdIdentifier.EMAIL, email, {
      requiredFields: [...UcdRequiredFields.EMAIL_SMS],
    });

    expect(customerId).toBe(parseInt(initialUcdData.c_shopify_id, 10));
    expect(await shopify.getSmsConsentState(customerId)).toBe(initialUcdData.so);

    // ── Step 2: Update both email and SMS consent to unsubscribed ─────────────
    await ucd.waitForSync(60_000);
    const updatedCustomer = await shopify.updateOptin(
      customerId,
      EmailState.UNSUBSCRIBED,
      SmsState.UNSUBSCRIBED,
    );

    expect(updatedCustomer.email_marketing_consent?.state).toBe(EmailState.UNSUBSCRIBED);
    expect(updatedCustomer.sms_marketing_consent?.state).toBe(SmsState.UNSUBSCRIBED);

    // ── Step 3: Verify unsubscribed state for both channels in UCD ────────────
    const { ucdData: updatedUcdData } = await ucd.waitForStateUpdate(email, {
      ...UcdExpected.EMAIL_SMS_UNSUBSCRIBED,
      identifierValue: email,
    });

    expect(updatedUcdData.so).toBe(false);
    expect(updatedUcdData.eo).toBe(false);
  } finally {
    // ── Cleanup: always delete the created customer ───────────────────────────
    if (customerId !== undefined) {
      await shopify.deleteCustomer(customerId);
    }
  }
});

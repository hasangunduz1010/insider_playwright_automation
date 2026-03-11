import { test } from '@core/fixture.base';
import ShopifyService from '@api/shopify.service';
import UcdService from '@api/ucd.service';
import { ShopifyEnv } from '@data/shopify/shopify-env';
import { ShopifyStoreConfig, ShopifyStores } from '@data/shopify/shopify-config';
import CreateCustomerComponent from '@pages/medusa/sms-optin/create-customer.component';
import SmsUnsubscribeComponent from '@pages/medusa/sms-optin/sms-unsubscribe.component';
import SmsResubscribeComponent from '@pages/medusa/sms-optin/sms-resubscribe.component';

/**
 * TC-6829 / TC-6827 / TC-6830 (Resubscription)
 * Verifies the full lifecycle of Shopify SMS opt-in:
 * Subscribed → Unsubscribed → Resubscribed
 */

test.use({
    epic: 'Shopify',
    feature: 'Live Sync',
    story: 'SMS Optin: Lifecycle Management',
});

// Full lifecycle sync can take up to 6-8 minutes
test.setTimeout(10 * 60 * 1000);

test('TC-6829 / TC-6827: SMS opt-in full cycle transition and UCD sync', async ({ request }) => {
    const config = ShopifyStoreConfig.resolveConfig(ShopifyStores.PROD_LIVE_SYNC);

    const shopify = new ShopifyService(request, config.shopUrl, config.apiVersion, config.token);
    const ucd = new UcdService(request, config.partner, ShopifyEnv.UCD_DOMAIN, ShopifyEnv.UCD_API_KEY);

    const createCustomer = new CreateCustomerComponent(shopify, ucd);
    const smsUnsubscribe = new SmsUnsubscribeComponent(shopify, ucd);
    const smsResubscribe = new SmsResubscribeComponent(shopify, ucd);

    let customerId: number | undefined;

    try {
        // ── Step 1: Create subscribed customer ──────────────────────────────────
        const { customerId: id, email } = await createCustomer.run();
        customerId = id;

        // ── Step 2: Update to Unsubscribed ──────────────────────────────────────
        await smsUnsubscribe.run(customerId, email);

        // ── Step 3: Resubscribe ──────────────────────────────────────────────────
        await smsResubscribe.run(customerId, email);

    } finally {
        // ── Cleanup ──────────────────────────────────────────────────────────────
        if (customerId !== undefined) {
            await test.step('Cleanup: Delete Shopify customer', async () => {
                await shopify.deleteCustomer(customerId!);
            });
        }
    }
});

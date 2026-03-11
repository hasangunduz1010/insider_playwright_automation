import { expect } from '@playwright/test';
import { Step } from '@core/base.page';
import ShopifyService from '@api/shopify.service';
import UcdService from '@api/ucd.service';
import { EmailState, SmsState, UcdExpected } from '@data/shopify/shopify.data';

/**
 * Step 2 — Update SMS consent to "unsubscribed" and verify UCD sync.
 * TC-6829 / TC-6827
 */
export default class SmsUnsubscribeComponent {

    constructor(
        private readonly shopify: ShopifyService,
        private readonly ucd: UcdService,
    ) {}

    @Step('Step 2: Update SMS consent to unsubscribed and verify UCD sync')
    async run(customerId: number, email: string): Promise<void> {
        await this.shopify.updateOptin(
            customerId,
            EmailState.NOT_SUBSCRIBED,
            SmsState.UNSUBSCRIBED,
        );

        const { ucdData } = await this.ucd.waitForStateUpdate(email, {
            ...UcdExpected.SMS_UNSUBSCRIBED,
            identifierValue: email,
        });

        expect(ucdData.so, 'UCD so should be false — SMS unsubscribed')
            .toBe(false);

        expect(ucdData.sms_opt_out_user, 'UCD sms_opt_out_user should be true after unsubscribe')
            .toBe(true);
    }
}

import { expect } from '@playwright/test';
import { Step } from '@core/base.page';
import ShopifyService from '@api/shopify.service';
import UcdService from '@api/ucd.service';
import { EmailState, SmsState, UcdExpected } from '@data/shopify/shopify.data';

/**
 * Step 3 — Resubscribe customer on Shopify and verify UCD recovery.
 * TC-6830 (Resubscription)
 */
export default class SmsResubscribeComponent {

    constructor(
        private readonly shopify: ShopifyService,
        private readonly ucd: UcdService,
    ) {}

    @Step('Step 3: Resubscribe customer and verify UCD recovery')
    async run(customerId: number, email: string): Promise<void> {
        const updatedCustomer = await this.shopify.updateOptin(
            customerId,
            EmailState.NOT_SUBSCRIBED,
            SmsState.SUBSCRIBED,
        );

        expect(
            updatedCustomer.sms_marketing_consent?.state,
            'Shopify SMS consent should reflect resubscription',
        ).toBe(SmsState.SUBSCRIBED);

        const { ucdData } = await this.ucd.waitForStateUpdate(email, {
            ...UcdExpected.SMS_SUBSCRIBED,
            identifierValue: email,
        });

        expect(ucdData.so, 'UCD so should be true — SMS resubscribed')
            .toBe(true);

        expect(ucdData.sms_opt_out_user, 'UCD sms_opt_out_user should be false after resubscription')
            .toBe(false);
    }
}

import { expect } from '@playwright/test';
import { Step } from '@core/base.page';
import ShopifyService from '@api/shopify.service';
import UcdService from '@api/ucd.service';
import { EmailState, SmsState, UcdIdentifier } from '@data/shopify/shopify.data';

export interface CreateCustomerResult {
    customerId: number;
    email: string;
}

/**
 * Step 1 — Create subscribed customer and verify initial UCD sync.
 * TC-6829 / TC-6827
 */
export default class CreateCustomerComponent {

    constructor(
        private readonly shopify: ShopifyService,
        private readonly ucd: UcdService,
    ) {}

    @Step('Step 1: Create subscribed customer and verify initial UCD sync')
    async run(): Promise<CreateCustomerResult> {
        const customer = await this.shopify.createCustomer(
            EmailState.NOT_SUBSCRIBED,
            SmsState.SUBSCRIBED,
        );

        const { ucdData } = await this.ucd.fetchWithPolling(
            UcdIdentifier.EMAIL,
            customer.email,
        );

        expect(customer.id, 'customerId should match UCD c_shopify_id')
            .toBe(parseInt(ucdData.c_shopify_id, 10));

        expect(ucdData.so, 'UCD so should be true — SMS subscribed')
            .toBe(true);

        return { customerId: customer.id, email: customer.email };
    }
}

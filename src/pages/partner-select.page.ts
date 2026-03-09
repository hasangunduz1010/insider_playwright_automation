import { Page, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS, URL_PATTERNS } from '../../tests/visual-test/data/constants';

export class PartnerSelectPage {
    constructor(private readonly page: Page) {}

    async isLoaded(): Promise<void> {
        await expect(this.page.locator(SELECTORS.PARTNER_SELECT.SELECT_BOX)).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
    }

    async selectPartner(partnerName: string): Promise<void> {
        await this.page.locator(SELECTORS.PARTNER_SELECT.SELECT_BOX).click();
        await this.page.locator(SELECTORS.PARTNER_SELECT.DROPDOWN_SEARCH).fill(partnerName);

        const option = this.page.locator(SELECTORS.PARTNER_SELECT.OPTION(partnerName)).first();
        await expect(option).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await option.click();

        await this.page.getByRole('button', { name: 'Proceed' }).click();

        await this.page.waitForURL(
            url => URL_PATTERNS.isAnyPartnerURL(url.toString()),
            { timeout: TIMEOUTS.ELEMENT }
        );
    }
}

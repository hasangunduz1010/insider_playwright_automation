import {Page} from '@playwright/test';
import BasePage, {Step} from '@core/base.page';

export default class HomePage extends BasePage {

    // Locators
    readonly navLinks = this.page.locator('nav a');
    readonly heroTitle = this.page.locator('h1').first();

    constructor(page: Page, isMobile: boolean | null = null) {
        super(page, isMobile);
    }

    @Step('navigate to home page')
    async goto() {
        await this.gotoPage('/');
    }
}

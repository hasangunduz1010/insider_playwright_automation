import BasePage, { Step } from '@core/base.page';
import { expect, Locator, Page } from '@playwright/test';
import { URLS, SELECTORS, TIMEOUTS } from '@data/visual/constants';

export default class PanelLoginPage extends BasePage {
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;

    constructor(page: Page) {
        super(page);
        this.emailInput = page.locator(SELECTORS.LOGIN.EMAIL_INPUT);
        this.passwordInput = page.locator(SELECTORS.LOGIN.PASSWORD_INPUT);
        this.loginButton = page.locator(SELECTORS.LOGIN.LOGIN_BUTTON);
    }

    override async gotoPage(): Promise<void> {
        await this.page.goto(URLS.LOGIN, {
            waitUntil: 'domcontentloaded',
            timeout: TIMEOUTS.NAVIGATION,
        });
        await this.page.waitForLoadState('networkidle');
    }

    async isLoaded(): Promise<void> {
        await expect(this.emailInput).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
        await expect(this.passwordInput).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
        await expect(this.loginButton).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
    }

    @Step('login')
    async login(email: string, password: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}

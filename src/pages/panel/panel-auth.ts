import { Page } from '@playwright/test';
import PanelLoginPage from './panel-login.page';
import { PartnerSelectPage } from './partner-select.page';
import { TIMEOUTS, URL_PATTERNS } from '@data/visual/constants';

export class PanelAuth {
    private readonly loginPage: PanelLoginPage;
    private readonly partnerSelectPage: PartnerSelectPage;

    constructor(private readonly page: Page, private readonly isMobile: boolean = false) {
        this.loginPage = new PanelLoginPage(page, isMobile);
        this.partnerSelectPage = new PartnerSelectPage(page);
    }

    async login(email: string, password: string): Promise<void> {
        await this.loginPage.gotoPage();
        await this.loginPage.isLoaded();
        await this.loginPage.login(email, password);
        await this.page.waitForURL(
            url => !URL_PATTERNS.isLoginURL(url.toString()),
            { timeout: TIMEOUTS.ELEMENT }
        );
    }

    async loginAndSelectPartner(email: string, password: string, partnerName: string): Promise<void> {
        await this.login(email, password);

        if (!URL_PATTERNS.isPartnerURL(this.page.url(), partnerName)) {
            await this.partnerSelectPage.isLoaded();
            await this.partnerSelectPage.selectPartner(partnerName);
        }
    }
}

import BasePage, {Step} from "@core/base.page";
import {expect, Locator, Page} from "@playwright/test";
import IdentityServerDb from "@src/db/identity-server.db";

export default class LoginPage extends BasePage {
    readonly emailLogin: Locator;
    readonly passwordLogin: Locator;
    readonly loginButton: Locator;
    readonly otpModal: Locator;
    readonly otpInput: Locator;
    readonly verifyButton: Locator;

    private readonly phoneNumber: string = "5432240523";

    constructor(page: Page, isMobile: boolean) {
        super(page, isMobile)
        this.emailLogin = page.locator('#email-login');
        this.passwordLogin = page.locator('#password-login');
        this.loginButton = page.locator('#signin-btn');

        // OTP modal elemanları
        this.otpModal = page.locator('#otpModalDesc');
        this.otpInput = page.locator('#otp-code');
        this.verifyButton = page.locator('#verifyButton');
    }

    async gotoPage(): Promise<void> {
        await this.page.goto('/giris')
    }

    async isLogin() {
        const userText = this.page.getByTestId('user-text');
        return await userText.isVisible()
    }

    @Step('login')
    public async login(email: string, password: string) {
        const isLogin = await this.isLogin();
        if (isLogin) {
            return;
        }
        await this.emailLogin.fill(email);
        await this.page.waitForTimeout(1000);
        await this.emailLogin.click();
        await this.passwordLogin.fill(password);
        await this.page.waitForTimeout(1000);
        await this.passwordLogin.click();
        await this.loginButton.click();
        await this.handleOtpVerification(this.phoneNumber);

    }

    @Step('Handle OTP Verification Modal')
    private async handleOtpVerification(phoneNumber?: string): Promise<void> {
        if (!phoneNumber) {
            throw new Error("Phone number is required for OTP verification!");
        }

        const otpCode = await IdentityServerDb.getActiveOtpCodeWithSourceType(this.phoneNumber, "signin");
        console.log(`OTP code fetched from DB: ${otpCode}`);

        await this.otpInput.fill(otpCode);
        await this.verifyButton.click();

        await expect(this.otpModal).toBeHidden({timeout: 10000});
    }

    async verifyLoginSuccess() {
        await this.page.waitForLoadState('networkidle');
        await expect(this.page).not.toHaveURL(/.*giris.*/);
    }
}
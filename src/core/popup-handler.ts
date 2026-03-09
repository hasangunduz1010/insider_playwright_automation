import {Page} from '@playwright/test';
import {test} from '@core/fixture.base';

/**
 * Handles popups, modals and overlays that appear dynamically during tests.
 */
export class PopupHandler {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async closeGenericPopups(): Promise<void> {
        try {
            const popup = this.page.getByRole('button', {name: 'Close'});
            await this.page.addLocatorHandler(popup, async () => {
                await test.step('close pop-up', async () => {
                    await popup.click();
                });
            }, {times: 1});
        } catch {
            // popup may not exist
        }
    }

    async closeInsiderModals(): Promise<void> {
        const closeBtn = this.page
            .locator("form#ins-question-group-form [id^='close-button']")
            .first();

        await this.page.addLocatorHandler(closeBtn, async () => {
            await test.step('Close Insider modal', async () => {
                try {
                    await closeBtn.click({timeout: 3000, force: true});
                } catch {}
            });
        }, {times: 1});
    }

    async acceptCookies(): Promise<void> {
        try {
            // Adjust selector to match the cookie banner on the target site
            const acceptBtn = this.page.locator('[data-name="Accept All"], [id*="accept-all"], [class*="accept-all"]').first();
            await this.page.addLocatorHandler(acceptBtn, async () => {
                await test.step('accept cookies', async () => {
                    await acceptBtn.click();
                });
            }, {times: 1});
        } catch {
            // banner may not exist
        }
    }

    async closeModalDialogs(): Promise<void> {
        try {
            const closeSelectors = [
                '[class*="wrap-close-button"]',
                '[data-testid="modal-close"]',
                '[aria-label="Close"]',
                '.modal-close',
                '.close-modal',
            ];

            for (const selector of closeSelectors) {
                const closeButton = this.page.locator(selector).first();
                await this.page.addLocatorHandler(closeButton, async () => {
                    await test.step('close modal', async () => {
                        await closeButton.click();
                    });
                }, {times: 1});
            }
        } catch {
            // modal may not exist
        }
    }

    async handleAllPopups(): Promise<void> {
        await this.closeGenericPopups();
        await this.acceptCookies();
        await this.closeModalDialogs();
        await this.closeInsiderModals();
    }

    async hasVisiblePopup(): Promise<boolean> {
        const selectors = [
            '[class*="close-button"]',
            '[class*="wrap-close-button"]',
            '[role="dialog"]',
            '.modal',
            '.popup',
        ];
        for (const selector of selectors) {
            if (await this.page.locator(selector).first().isVisible()) return true;
        }
        return false;
    }
}

import * as allure from 'allure-js-commons';
import {expect, Page} from '@playwright/test';
import {test} from '@core/fixture.base';
import path from "path";

export interface VisualTestParam {
    name: string;
    url: string;
    selector?: string | string[];
}

export async function goto(page: Page, path: string, index: number = 0) {
    await test.step(`Navigating to ${path}`, async () => {
        try {
            await page.goto(path, {waitUntil: 'domcontentloaded'});
        } catch (error) {
            if (index < 2) {
                await test.step(`Got an error, trying again...`, async () => {});
                await page.waitForTimeout(1000);
                await goto(page, path, index + 1);
            }
        }
    });
}

export function getFileName(name: string): string {
    const branch = process.env.BRANCH_NAME ?? 'local';
    return `${branch}-${name.replace(/\s+/g, '-')}.png`;
}

export async function blockAds(page: Page) {
    await allure.step('Block ADs', async () => {
        await page.route('**/*', (route) => {
            const url = route.request().url();
            if (url.includes('doubleclick.net')) {
                return route.abort();
            }
            route.continue();
        });
    });
}

export async function waitUntilAllElementsLoaded(page: Page) {
    await scrollToBottom(page);
    await scrollToTop(page);
}

export async function scrollToBottom(page: Page) {
    await allure.step('Scroll to Bottom of Page', async () => {
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let lastScrollY = -1;
                const scroll = () => {
                    window.scrollBy(0, 500);
                    const currentScrollY = window.scrollY;
                    if (currentScrollY === lastScrollY) {
                        resolve();
                    } else {
                        lastScrollY = currentScrollY;
                        setTimeout(scroll, 150);
                    }
                };
                scroll();
            });
        });
    });
}

export async function scrollToTop(page: Page) {
    await allure.step('Scroll to Top of Page', async () => {
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let lastScrollY = -1;
                const scroll = () => {
                    window.scrollBy(0, -500);
                    const currentScrollY = window.scrollY;
                    if (currentScrollY === lastScrollY) {
                        resolve();
                    } else {
                        lastScrollY = currentScrollY;
                        setTimeout(scroll, 150);
                    }
                };
                scroll();
            });
        });
    });
}

export async function checkScreenComponent(
    page: Page,
    param: VisualTestParam,
    stylePath: string = 'screenshot.css'
): Promise<void> {
    await waitUntilAllElementsLoaded(page);

    const screenshotOptions = {
        maskColor: '#5d5bea',
        stylePath: path.join(__dirname, stylePath),
        timeout: 12_000,
    };

    if (param.selector) {
        const selectors = Array.isArray(param.selector) ? param.selector : [param.selector];

        for (const selector of selectors) {
            await expect(page.locator(selector)).toHaveScreenshot(
                getFileName(`${param.name}-${selector.replace(/[^a-z0-9]/gi, '_')}`),
                screenshotOptions
            );
        }
    } else {
        await expect(page).toHaveScreenshot(getFileName(param.name), {
            fullPage: true,
            ...screenshotOptions,
        });
    }
}

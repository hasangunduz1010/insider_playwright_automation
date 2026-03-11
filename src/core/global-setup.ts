import {chromium, FullConfig} from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {URLS, SELECTORS, CREDENTIALS, TIMEOUTS, URL_PATTERNS} from '@data/visual/constants';

/**
 * Global setup function that runs before all tests.
 * Performs login and saves storageState for authenticated tests.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
    console.log('[global-setup] start');

    const projectUse = config.projects[0].use;
    const rawStorageState = projectUse.storageState;
    const storageStatePath: string =
        typeof rawStorageState === 'string'
            ? rawStorageState
            : path.join(process.cwd(), 'playwright', '.auth', 'user.json');

    const {EMAIL: email, PASSWORD: password} = CREDENTIALS;

    if (!email || !password) {
        console.log('[global-setup] missing credentials, skipping login');
        console.warn('⚠️  Email or password not found. StorageState will not be saved.');
        return;
    }

    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    let page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newContext']>['newPage']> | undefined;

    try {
        browser = await chromium.launch({
            timeout: TIMEOUTS.NAVIGATION,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const context = await browser.newContext({
            ignoreHTTPSErrors: true,
            bypassCSP: true,
            baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://qaautomation1.inone.useinsider.com',
        });

        page = await context.newPage();

        const loginURL = process.env.PLAYWRIGHT_BASE_URL ? '/login' : URLS.LOGIN;

        await page.goto(loginURL, {waitUntil: 'domcontentloaded', timeout: TIMEOUTS.NAVIGATION});
        await page.waitForLoadState('load');
        await page.waitForLoadState('networkidle').catch(() => {});

        const emailSelectors = [
            SELECTORS.LOGIN.EMAIL_INPUT,
            '[name="email"]',
            'input[type="email"]',
        ];

        let emailInput = null;

        for (const selector of emailSelectors) {
            const candidate = page.locator(selector).first();
            const visible = await candidate
                .waitFor({state: 'visible', timeout: TIMEOUTS.ELEMENT})
                .then(() => true)
                .catch(() => false);
            if (visible) {
                emailInput = candidate;
                break;
            }
        }

        if (!emailInput) {
            console.warn(`⚠️  Login form not found during global setup. Current URL: ${page.url()}`);
            return;
        }

        await emailInput.fill(email);
        await page.locator(SELECTORS.LOGIN.PASSWORD_INPUT).fill(password);
        await page.locator(SELECTORS.LOGIN.LOGIN_BUTTON).click();

        await page.waitForURL(
            (url) => !URL_PATTERNS.isLoginURL(url.toString()),
            {timeout: TIMEOUTS.ELEMENT},
        );

        const authDir = path.dirname(storageStatePath);
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, {recursive: true});
        }
        await page.context().storageState({path: storageStatePath});
        console.log(`[global-setup] storageState saved: ${storageStatePath}`);
    } catch (error) {
        const err = error as Error;
        console.warn('⚠️  Global setup error:', err.message);
        console.warn('⚠️  Error All log:', err);
    } finally {
        console.log('[global-setup] end');
        if (page) await page.close().catch(() => {});
        if (browser) await browser.close().catch(() => {});
    }
}

import {defineConfig, devices} from '@playwright/test';
import * as os from 'node:os';
import {config} from 'dotenv';
import {resolve} from 'path';

config({path: resolve(__dirname, '.env')});
if (process.env.ENV) {
    config({path: resolve(__dirname, `.env.${process.env.ENV}`)});
}

const insiderAutomation = 'InsiderAutomation/1.0 (playwright)';
const userAgent = {
    desktop: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7339.16 Safari/537.36 ${insiderAutomation}`,
    android: `Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7339.16 Mobile Safari/537.36 ${insiderAutomation}`,
    ios: `Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1 ${insiderAutomation}`,
};

export default defineConfig({
    testDir: './tests',
    globalSetup: './src/core/global-setup.ts',
    //snapshotPathTemplate: '',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 5,
    reporter: [
        ['list'],
        [
            'allure-playwright',
            {
                resultsDir: './allure-results',
                detail: true,
                environmentInfo: {
                    env: process.env.ENV,
                    os_platform: os.platform(),
                    os_release: os.release(),
                    os_version: os.version(),
                    node_version: process.version,
                },
            },
        ],
    ],
    use: {
        baseURL: process.env.BASE_URL,
        actionTimeout: 7_000,
        trace: 'off',
        screenshot: 'on',
        testIdAttribute: 'data-testid',
        headless: process.env.HEADLESS === 'true',
        video: 'off',
        storageState: 'storage.json',
        userAgent: userAgent.desktop,
    },
    expect: {
        timeout: 3_000,
        toHaveScreenshot: {
            animations: 'disabled',
            maxDiffPixels: 210,
            pathTemplate: './snapshots/screenshots/{testFilePath}/{projectName}/{arg}{ext}',
        },
        toMatchAriaSnapshot: {
            pathTemplate: './snapshots/aria/{testFilePath}/{projectName}/{arg}{ext}',
        },
    },
    projects: [
        {
            name: 'web',
            testMatch: [/web\/.*\.spec\.ts/],
            use: {
                ...devices['Desktop Chrome'],
                userAgent: userAgent.desktop,
            },
        },
        {
            name: 'mobile-android',
            testMatch: [/mobile\/.*\.spec\.ts/],
            use: {
                ...devices['Pixel 7'],
                userAgent: userAgent.android,
            },
        },
        {
            name: 'mobile-ios',
            testMatch: [/mobile\/.*\.spec\.ts/],
            use: {
                ...devices['iPhone 15 Pro'],
                userAgent: userAgent.ios,
            },
        },
        {
            name: 'api',
            testMatch: [/api\/.*\.spec\.ts/],
        },
        {
            name: 'visual',
            testMatch: [/visual-test\/.*\.spec\.ts/],
            use: {
                ...devices['Desktop Chrome'],
            },
        },
    ],
});

import * as path from 'path';
import newsroomData from './data/insiderone-newsroom.data';
import {test} from '@core/fixture.base';
import {expect} from '@playwright/test';
import {blockAds, getFileName, goto, waitUntilAllElementsLoaded} from './helper/visual-test.helper';
import {USER_AGENT} from "@enums/common.enum";

const {suite, data} = newsroomData;

test.describe(`Visual Tests - ${suite}`, () => {
    data.forEach((param) => {
        test.use({
            userAgent: USER_AGENT,
        });

        test(`Compare ${param.name}`, async ({page}) => {
            test.setTimeout(120_000);
            await blockAds(page);
            await goto(page, param.url);
            await waitUntilAllElementsLoaded(page);

            const screenshotOptions = {
                maskColor: '#5d5bea',
                stylePath: path.join(__dirname, 'screenshot.css'),
                timeout: 12_000,
            };

           if (param.selector) {
                const selectors = Array.isArray(param.selector) ? param.selector : [param.selector];
                for (const selector of selectors) {
                    await expect(page.locator(selector)).toHaveScreenshot(getFileName(`${param.name}-${selector}`), screenshotOptions);
                }
            } else {
                await expect(page).toHaveScreenshot(getFileName(param.name), {
                    fullPage: true,
                    ...screenshotOptions,
                });
            }
        });
    });
});


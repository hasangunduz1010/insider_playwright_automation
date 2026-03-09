import { test as base, expect, Page, BrowserContext, Locator } from '@playwright/test';
import type { PageAssertionsToHaveScreenshotOptions } from '@playwright/test';

type InitScriptTarget = Pick<Page, 'addInitScript'> | Pick<BrowserContext, 'addInitScript'>;

export async function applyVisualStabilizers(target: InitScriptTarget): Promise<void> {
    await target.addInitScript(() => {
        window.localStorage.setItem('showNewSidebarInfo', 'false');
        window.localStorage.setItem('showNewSidebarOnboard', 'false');
    });

    await target.addInitScript(() => {
        const style = document.createElement('style');
        style.setAttribute('data-qa', 'visual-disable-animations');
        style.innerHTML = `
          *, *::before, *::after {
            transition: none !important;
            animation: none !important;
            caret-color: transparent !important;
          }
          .full-height {
            height: 90vh !important;
          }
        `;
        document.head.appendChild(style);
    });
}

export async function getDefaultScreenshotMask(page: Page): Promise<Locator[]> {
    const mask: Locator[] = [];

    const header = page.locator('header').first();
    if (await header.isVisible().catch(() => false)) {
        mask.push(header);
    }

    const sidebar = page.locator('.in-sidebar-v2-wrapper__outer').first();
    if (await sidebar.isVisible().catch(() => false)) {
        mask.push(sidebar);
    }

    return mask;
}

export async function buildScreenshotOptions(
    page: Page,
    options: Omit<PageAssertionsToHaveScreenshotOptions, 'mask'> = {},
    extraMask: Locator[] = [],
): Promise<PageAssertionsToHaveScreenshotOptions> {
    const mask = await getDefaultScreenshotMask(page);
    const mergedMask = [...mask, ...extraMask];

    return {
        ...options,
        mask: mergedMask.length > 0 ? mergedMask : undefined,
    };
}

export async function waitForStableScrollHeight(page: Page): Promise<void> {
    await page.evaluate(async () => {
        const getHeight = () => document.documentElement.scrollHeight;
        let last = getHeight();
        for (let i = 0; i < 3; i += 1) {
            await new Promise(requestAnimationFrame);
            const next = getHeight();
            if (next === last) return;
            last = next;
        }
    }).catch(() => {});
}

export async function waitForFonts(page: Page): Promise<void> {
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await waitForStableScrollHeight(page);
}

export const test = base.extend<{ page: Page }>({
    page: async ({ page }, use) => {
        await applyVisualStabilizers(page);
        await use(page);
    },
});

export { expect };

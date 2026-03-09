import {expect, Locator} from '@playwright/test';
import Helper from '@core/helper';

export const expectFixture = expect.extend({

    async toHaveLinks(received: Locator, expectedLinks: string | string[]) {
        const actualLinks = await Helper.getElementHrefs(received);
        const expectedLinksArray = Array.isArray(expectedLinks) ? expectedLinks : [expectedLinks];
        const pass =
            actualLinks.length === expectedLinksArray.length &&
            actualLinks.every((href, index) => href === expectedLinksArray[index]);

        return {
            pass,
            message: () => pass
                ? `Expected links NOT to match.\nReceived: ${JSON.stringify(actualLinks)}\nExpected: ${JSON.stringify(expectedLinksArray)}`
                : `Expected links to match.\nReceived: ${JSON.stringify(actualLinks)}\nExpected: ${JSON.stringify(expectedLinksArray)}`,
        };
    },

    async toHaveImageSrcs(received: Locator, expectedSrcs: string | string[]) {
        const all = await received.all();
        const actualSrcs = await Promise.all(all.map(l => l.getAttribute('src')));
        const expectedSrcsArray = Array.isArray(expectedSrcs) ? expectedSrcs : [expectedSrcs];
        const pass =
            actualSrcs.length === expectedSrcsArray.length &&
            actualSrcs.every((src, index) => src === expectedSrcsArray[index]);

        return {
            pass,
            message: () => pass
                ? `Expected image srcs NOT to match.\nReceived: ${JSON.stringify(actualSrcs)}\nExpected: ${JSON.stringify(expectedSrcsArray)}`
                : `Expected image srcs to match.\nReceived: ${JSON.stringify(actualSrcs)}\nExpected: ${JSON.stringify(expectedSrcsArray)}`,
        };
    },

    async toHaveSize(received: Locator, expected: string) {
        const box = await received.boundingBox();
        const actual = `${box?.width}x${box?.height}`;
        return {
            pass: actual === expected,
            expected,
            actual,
            message: () => `Expected size to be ${expected}, but was ${actual}`,
        };
    },

    async toBeCountGreaterThan(received: Locator, expected: number) {
        const count = await received.count();
        return {
            pass: count > expected,
            expected,
            actual: count,
            message: () => `Expected count to be greater than ${expected}, but was ${count}`,
        };
    },

    async toBeCountGreaterThanOrEqual(received: Locator, expected: number) {
        const count = await received.count();
        return {
            pass: count >= expected,
            expected,
            actual: count,
            message: () => `Expected count to be >= ${expected}, but was ${count}`,
        };
    },

    async toBeCountLessThan(received: Locator, expected: number) {
        const count = await received.count();
        return {
            pass: count < expected,
            expected,
            actual: count,
            message: () => `Expected count to be less than ${expected}, but was ${count}`,
        };
    },

    async toBeCountLessThanOrEqual(received: Locator, expected: number) {
        const count = await received.count();
        return {
            pass: count <= expected,
            expected,
            actual: count,
            message: () => `Expected count to be <= ${expected}, but was ${count}`,
        };
    },
});

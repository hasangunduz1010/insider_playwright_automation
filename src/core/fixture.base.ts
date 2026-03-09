import {Client} from 'pg';
import {APIRequestContext, Page, PlaywrightTestArgs, request, test as baseTest} from '@playwright/test';
import {epic, feature, parentSuite, story, subSuite, suite} from "allure-js-commons";
import {expectFixture} from '@core/expect-fixture';
import PagesInvestmentService from '@api/pages-investment.service';
import AuthService from "@api/auth.service";
import Helper from "./helper";
import {PopupHandler} from "@core/popup-handler";
import PagesRetirementBankingService from "@api/pages-retirement-banking.service";
//import LoginPage from "@pages/login/login.page";

export const expect = expectFixture;

export class PlaywrightTestInfo {
    constructor(public page: Page,
                public projectName: string,
                public isMobile: boolean,
                public requestContext: APIRequestContext) {
    }
}

export type MyOptions = {
    dbName: string;
    requireAuth: boolean;
};

type AllureTags = {
    epic: string;
    feature: string;
    story: string;
}

interface Pages {
    globalBeforeAfter: void;
    db: Client;
    playwrightTestInfo: PlaywrightTestInfo;
    authenticatedPage: void;
    //loginPage: LoginPage;
}

interface Services {
    authService: AuthService;
    investmentService: PagesInvestmentService;
    pagesRetirementBankingService: PagesRetirementBankingService;

}


export const TEST_USER = {
    email: process.env.LOGIN_EMAIL || 'hasan.gunduz@useinsider.com',
    password: process.env.LOGIN_USER_PASSWORD || 'Hasan.10'
};

export async function isPageClosed(page: Page) {
    try {
        await page.waitForTimeout(0); // is synchronous — no need to await it
        return false;
    } catch {
        // If accessing page.isClosed() throws, the page reference is likely invalid
        return true;
    }
}

export const test = baseTest.extend<MyOptions & AllureTags & Pages & Services>({
    // async page({context, baseURL}, use) {
    //     const page = await context.newPage();
    // const originalGoto = page.goto.bind(page);
    // page.goto = async (url, options?) => {
    //     const tryCount = 3;
    //     for (let i = 0; i < tryCount; i++) {
    //         if (await isPageClosed(page)) break;
    //         try {
    //             return await test.step(`navigate to ${baseURL}${url}`, async () => {
    //                 return await originalGoto(url, options);
    //             });
    //         } catch (error) {
    //             await test.step(`Got error ${error}`, async () => {
    //             });
    //         }
    //     }
    //     return null;
    // };
    //     await use(page);
    // },
    async request({}, use) {
        const context = await request.newContext({
            baseURL: process.env.GATEWAY_BASE_URL,
        });
        await use(context);
    },
    dbName: ['DB_NAME', {auto: true}],
    requireAuth: [false, {auto: true, option: true}],
    epic: ['HAS_NO_EPIC', {auto: true}],
    feature: ['HAS_NO_FEATURE', {auto: true}],
    story: ['HAS_NO_STORY', {auto: true}],
    db: async ({dbName}, use) => {
        const client = Helper.createDbClient(dbName);
        await client.connect();
        await use(client);
        await client.end();
    },
    globalBeforeAfter: [globalBeforeAfter(), {auto: true}],
    playwrightTestInfo: async ({page, request, isMobile}, use) => {
        const playwrightTestInfo = new PlaywrightTestInfo(page, test.info().project.name, isMobile, request);
        await use(playwrightTestInfo);
    },
    authenticatedPage: async ({page, isMobile, requireAuth}, use) => {
        // if (requireAuth) {
        //     const loginPage = new LoginPage(page, isMobile);
        //     await test.step('Performing authentication', async () => {
        //         const isLoggedIn = await loginPage.isLogin();
        //
        //         if (!isLoggedIn) {
        //             await loginPage.gotoPage();
        //             await loginPage.login(TEST_USER.email, TEST_USER.password);
        //             try {
        //                 await loginPage.verifyLoginSuccess();
        //             } catch (error) {
        //                 throw new Error(`Authentication failed: ${error}`);
        //             }
        //         }
        //     });
        // }

        await use();
    },

    authService: async ({request, isMobile}, use) => {
        const service = new AuthService(request, isMobile);
        await use(service);
    },
    investmentService: async ({request, isMobile}, use) => {
        const service = new PagesInvestmentService(request, isMobile);
        await use(service);
    },
    pagesRetirementBankingService: async ({request, isMobile}, use) => {
        const service = new PagesRetirementBankingService(request, isMobile);
        await use(service);
    }
});


function globalBeforeAfter() {
    return async ({page, epic, feature, story}: PlaywrightTestArgs & AllureTags, use: (arg: any) => any) => {
        await setAllureTags({epic: epic, feature: feature, story: story})
        await addTime('Start');

        // Enhanced popup handling using PopupHandler
        const popupHandler = new PopupHandler(page);
        await popupHandler.handleAllPopups();

        await use(page);
        await addTime('End');
    };
}

async function setAllureTags(allure: AllureTags) {
    await epic(allure.epic);
    await feature(allure.feature);
    await story(allure.story);

    await parentSuite(allure.epic);
    await suite(allure.feature);
    await subSuite(allure.story);
}

async function addTime(name: string) {
    const time = new Date().toISOString();
    baseTest.info().annotations.push({
        type: name,
        description: time,
    });
}

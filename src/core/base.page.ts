import {Locator, Page, test} from '@playwright/test';
import {expect} from '@core/fixture.base';
import Helper from '@core/helper';

export default class BasePage {

    isWeb: boolean;

    public constructor(
        readonly page: Page,
        readonly isMobile: boolean | null = null,
        readonly parent: Locator = page.locator('html'),
    ) {
        this.isWeb = !isMobile;
    }

    @Step('go to the page')
    async gotoPage(path: string = '/') {
        await this.page.goto(path);
    }

    @Step('click tab')
    async clickTab() {
        await this.page.keyboard.press('Tab');
    }

    @Step('check all checkboxes')
    async checkAllCheckboxes(checkboxes: Locator) {
        const count = await checkboxes.filter({visible: true}).count();
        for (let i = 0; i < count; i++) {
            await checkboxes.nth(i).click({position: {x: 15, y: 15}, force: true});
        }
    }

    @Step('check if element is visible on component')
    public async isVisibleOnComponent(locator: Locator) {
        const childBox = (await locator.boundingBox())!;
        const parentBox = (await this.parent.boundingBox())!;

        if (parentBox.x > childBox.x) return false;
        const parentEndX = parentBox.x + parentBox.width;
        return parentEndX >= childBox.x;
    }

    @Step('get visible elements on component')
    public async getVisibleElementsOnComponent(locator: Locator) {
        await expect(locator).not.toHaveCount(0);
        const elements = await locator.all();
        const visibleElements: Locator[] = [];
        for (const element of elements) {
            if (await this.isVisibleOnComponent(element)) {
                visibleElements.push(element);
            }
        }
        return visibleElements;
    }
}

/**
 * Step decorator — wraps POM methods in test.step with auto naming.
 *
 * Usage:
 *  @Step()                      → method name as step label
 *  @Step('custom label')        → custom label
 */
export function Step(name?: string, options: StepOptions = {}) {
    return (target: Function, context: ClassMethodDecoratorContext) => {
        const stepName = name ?? (context.name as string);
        const logArgs = options.logArgs !== false;
        const logResult = options.logResult !== false;

        return async function replacementMethod(this: any, ...args: any) {
            const formattedStepName = formatStepName(stepName, args, logArgs);

            const result = await test.step(formattedStepName, async () => {
                const startTime = Date.now();
                const result = await target.call(this, ...args);

                const executionTime = Date.now() - startTime;
                if (executionTime > 1000) {
                    console.log(`Step "${formattedStepName}" completed in ${executionTime}ms`);
                }
                if (logResult && result !== undefined) {
                    console.log(`Step "${formattedStepName}" result:`, result);
                }

                return result;
            });

            return await test.step(`Return result: ${Helper.truncate(result, 100)}`, () => result);
        };
    };
}

/**
 * Options for the Step decorator
 */
export interface StepOptions {
    /** Number of retry attempts for flaky operations */
    retries?: number;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Whether to log method arguments */
    logArgs?: boolean;
    /** Whether to log method result */
    logResult?: boolean;
}


function formatStepName(stepName: string, args: any[], logArgs: boolean): string {
    if (!logArgs || args.length === 0) return stepName;

    const formattedArgs = args.map(arg => {
        if (typeof arg === 'string') return `"${arg}"`;
        if (typeof arg === 'number' || typeof arg === 'boolean') return arg.toString();
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        return typeof arg;
    });

    return `${stepName}(${formattedArgs.join(', ')})`;
}

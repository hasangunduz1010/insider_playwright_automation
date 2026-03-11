import {Locator, Page, test} from '@playwright/test';
import {expect} from '@core/fixture.base';
import {attachment, parameter} from 'allure-js-commons';

export default class BasePage {

    public constructor(
        readonly page: Page,
        readonly parent: Locator = page.locator('html'),
    ) {
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
        if (parentEndX < childBox.x) return false;

        if (parentBox.y > childBox.y) return false;
        const parentEndY = parentBox.y + parentBox.height;
        return parentEndY >= childBox.y;
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

        const paramNames = getParamNames(target);

        return async function replacementMethod(this: any, ...args: any) {
            const formattedStepName = formatStepName(stepName, args, logArgs);

            return await test.step(formattedStepName, async () => {
                // ── Parameters panel ─────────────────────────────────────────
                if (logArgs && args.length > 0) {
                    for (let i = 0; i < args.length; i++) {
                        const name = paramNames[i] ?? `arg${i}`;
                        await parameter(name, serialize(args[i], 500));
                    }
                }

                const result = await target.call(this, ...args);

                // ── Result attachment ─────────────────────────────────────────
                if (logResult && result !== undefined) {
                    const isComplex = typeof result === 'object' && result !== null;
                    const content = isComplex
                        ? JSON.stringify(result, null, 2)
                        : String(result);
                    const mime = isComplex ? 'application/json' : 'text/plain';
                    await attachment('result', content, {contentType: mime});
                }

                return result;
            });
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


/**
 * Extracts parameter names from a function's source at runtime.
 * ts-node strips TypeScript type annotations, leaving clean JS names.
 * e.g. updateOptin(customerId, emailState, smsState) → ['customerId', 'emailState', 'smsState']
 */
function getParamNames(fn: Function): string[] {
    try {
        const src = fn.toString();
        const match = src.match(/\(([^)]*)\)/);
        if (!match?.[1]?.trim()) return [];
        return match[1]
            .split(',')
            .map(p => p.split(/[:=]/)[0].trim())
            .filter(Boolean);
    } catch {
        return [];
    }
}

function serialize(value: unknown, maxLength = 200): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value.length > maxLength ? value.slice(0, maxLength) + '…' : value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
        const json = JSON.stringify(value);
        return json.length > maxLength ? json.slice(0, maxLength) + '…' : json;
    } catch {
        return String(value);
    }
}

function formatStepName(stepName: string, args: any[], logArgs: boolean): string {
    if (!logArgs || args.length === 0) return stepName;

    const formattedArgs = args.map(arg => {
        if (typeof arg === 'string') return `"${arg}"`;
        if (typeof arg === 'number' || typeof arg === 'boolean') return arg.toString();
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        return serialize(arg, 100);
    });

    return `${stepName}(${formattedArgs.join(', ')})`;
}

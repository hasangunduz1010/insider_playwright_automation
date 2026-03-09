import {APIRequestContext, expect} from '@playwright/test';
import {APIResponse} from 'playwright';
import {test} from '@core/fixture.base';
import {ContentType} from 'allure-js-commons';

export default class BaseService {

    readonly device: string;

    constructor(readonly context: APIRequestContext, readonly isMobile: boolean) {
        this.device = isMobile ? '2' : '1';
    }
}

export async function checkGetMethod(
    requestContext: APIRequestContext,
    endpoint: string,
    statusCode: number,
    params?: Record<string, any>,
    headers?: Record<string, string>,
) {
    const response = await requestContext.get(endpoint, {params, headers});
    await addResponseToAttachment(response);
    expect(response.status()).toBe(statusCode);
}

export async function addRequestToAttachment(endpoint: string, request: unknown) {
    await test.info().attach(`Request: ${endpoint}`, {
        body: JSON.stringify(request, null, 2),
        contentType: ContentType.JSON,
    });
}

export async function addResponseToAttachment(response: APIResponse) {
    let body: unknown;
    try {
        body = await response.json();
    } catch (_) {
        const buffer = await response.body();
        body = buffer.toString('utf-8');
    }
    const url = new URL(response.url());
    await test.info().attach(`Response: ${url.pathname}`, {
        body: JSON.stringify(body, null, 2),
        contentType: ContentType.JSON,
    });
}

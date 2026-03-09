import {APIRequestContext, expect, request} from '@playwright/test';
import BaseService from '@core/base.service';
import {Step} from '@core/base.page';
import {ExchangeType} from '@enums/common.enum';

export default class PagesInvestmentService extends BaseService {
    constructor(request: APIRequestContext, isMobile: boolean) {
        super(request, isMobile);
    }

    @Step('Get Home')
    public async getHome() {
        const endpoint = '/pages/investment/home';
        const response = await this.context.get(endpoint, {
            headers: {Device: this.device},
        });
        expect(response.ok()).toBeTruthy();
        return response;
    }

    @Step('POST: /pages/investment/home/invesment-table')
    public async getInvestmentTable(exchangeType: ExchangeType, {
        currencyOrder = 0, goldOrder = 0, stockOrder = 0, stockIndexOrder = 0, fundOrder = 0, ipoOrder = 0,
    } = {}) {
        const endpoint = '/pages/investment/home/investment-table';
        const response = await this.context.post(endpoint, {
            headers: {device: this.device},
            data: {
                exchangeType: exchangeType,
                currencyOrder: currencyOrder,
                goldOrder: goldOrder,
                stockOrder: stockOrder,
                stockIndexOrder: stockIndexOrder,
                fundOrder: fundOrder,
                ipoOrder: ipoOrder
            },
        });

        expect(response.ok()).toBeTruthy();
        return response;
    }

    @Step('GET: Funds Home')
    public async getFundsHome() {
        const endpoint = '/pages/investment/fund/home';
        const response = await this.context.get(endpoint, {
            headers: {Device: this.device},
        });
        expect(response.ok()).toBeTruthy();
        return response;
    }

    @Step('GET: Index Home')
    public async getIndexHome(){
        const endpoint = '/pages/investment/index/home';
        const response = await this.context.get(endpoint,{
            headers: {Device: this.device},
        });

        expect(response.ok()).toBeTruthy();
        return response;
    }

    @Step('GET : Investment Search')
    public async getSearch(searchTerm: string, type: string) {
        const context = await request.newContext({
            baseURL: process.env.BASE_URL,
        });
        const endpoint = `/api/pages/investment/search?searchTerm=${searchTerm}&type=${type}`;
        const response = await context.get(endpoint, {
            headers: {
                Device: this.device,},
        });
        expect(response.ok()).toBeTruthy();
        return response;
    }

}

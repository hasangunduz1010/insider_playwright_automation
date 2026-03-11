import BaseService from "@core/base.service";
import {APIRequestContext, expect} from "@playwright/test";
import {Step} from "@core/base.page";

export interface RetirementBankingListRequest {
    limit?: number;
    currentPage?: number;
    count?: number;
    filters?: any[];
    order?: number;
    channelCampaignCode?: string;
}

export default class PagesRetirementBankingService extends BaseService {

    constructor(request: APIRequestContext) {
        super(request);
    }

    @Step('GET: /pages/retirementbanking/home')
    public async getHome() {
        const endpoint = '/pages/retirementbanking/home';
        const response = await this.context.get(endpoint, {
            headers: {device: this.device},
        });
        expect(response.ok()).toBeTruthy();
        return response;
    }

    @Step('POST: /pages/retirementbanking/list')
    public async getProductsList(options: RetirementBankingListRequest = {}) {
        const endpoint = '/pages/retirementbanking/list';
        const response = await this.context.post(endpoint, {
            headers: {device: this.device},
            data: {
                limit: options.limit ?? 20,
                currentPage: options.currentPage ?? 1,
                count: options.count ?? 20,
                filters: options.filters ?? [],
                order: options.order ?? 0,
                channelCampaignCode: options.channelCampaignCode ?? "string"
            }
        });
        expect(response.ok()).toBeTruthy();
        return response;
    }
}


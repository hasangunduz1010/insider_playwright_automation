import BaseService from "@core/base.service";
import {Step} from "@core/base.page";
import {APIRequestContext} from "@playwright/test";

export default class AuthService extends BaseService {

    constructor(context: APIRequestContext) {
        super(context);
    }

    @Step('PUT: /auth-services/api/communicationpermits/{userId}')
    async changeCommunicationPermits(userId: number, permits: {
        emailPermit: boolean,
        smsPermit: boolean,
        callPermit: boolean
    }) {
        const endpoint = `/auth-services/api/communicationpermits/${userId}`;
        await this.context.put(endpoint, {data: permits});
    }
}

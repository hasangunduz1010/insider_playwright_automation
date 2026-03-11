import { APIRequestContext } from '@playwright/test';
import BaseService from '@core/base.service';
import { Step } from '@core/base.page';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UcdAttributes {
  c_shopify_id: string;
  so: boolean;
  sms_opt_out_user: boolean;
  eo?: boolean;
  em?: string;
  global_unsubscribe?: number;
  [key: string]: unknown;
}

export interface UcdResponse {
  statusCode: number;
  raw: string;
  json: Record<string, unknown>;
}

export interface FetchUcdResult {
  ucdData: UcdAttributes;
  ucdResponse: UcdResponse;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UCD_DEFAULT_REQUIRED_FIELDS = ['c_shopify_id', 'sms_opt_out_user', 'so'];

// ─── Service ──────────────────────────────────────────────────────────────────

export default class UcdService extends BaseService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly partner: string;

  constructor(
    context: APIRequestContext,
    partner: string,
    domain: string,
    apiKey: string,
  ) {
    super(context);
    this.baseUrl = `http://atrium.${domain}/api/contact/v1/profile`;
    this.partner = partner;
    this.apiKey = apiKey;
  }

  private async queryProfile(
    identifierType: string,
    identifierValue: string,
  ): Promise<{ statusCode: number; responseText: string }> {
    const payload = {
      partner: this.partner,
      sources: ['last'],
      identifiers: { [identifierType]: identifierValue },
      attributes: ['*'],
    };

    try {
      const response = await this.context.post(this.baseUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-Atrium-Api-Key': this.apiKey,
        },
        data: payload,
        failOnStatusCode: false,
      });
      const body = await response.json().catch(() => ({ error: 'Invalid JSON' }));
      return { statusCode: response.status(), responseText: JSON.stringify(body) };
    } catch {
      return { statusCode: 500, responseText: '{"error":"Request failed"}' };
    }
  }

  /**
   * Polls UCD until all required fields are present.
   * First wait: 60 s, then exponential back-off.
   */
  @Step('Fetch UCD data (poll for required fields)')
  async fetchWithPolling(
    identifierType: string,
    identifierValue: string,
    options: {
      requiredFields?: string[];
      maxRetries?: number;
      pollingIntervalMs?: number;
    } = {},
  ): Promise<FetchUcdResult> {
    const {
      requiredFields = UCD_DEFAULT_REQUIRED_FIELDS,
      maxRetries = 8,
      pollingIntervalMs = 5_000,
    } = options;

    let lastResponseJson: Record<string, unknown> = {};

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { statusCode, responseText } = await this.queryProfile(identifierType, identifierValue);
      let responseJson: Record<string, unknown> = {};
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { error: 'Invalid JSON response' };
      }

      lastResponseJson = responseJson;
      const ucdData = responseJson.attributes as UcdAttributes | undefined;
      const ucdResponse: UcdResponse = { statusCode, raw: responseText, json: responseJson };

      if (statusCode !== 404 && ucdData) {
        const missing = requiredFields.filter((f) => !(f in ucdData));
        if (missing.length === 0) return { ucdData, ucdResponse };
      }

      if (attempt < maxRetries - 1) {
        const waitMs = attempt === 0 ? 60_000 : pollingIntervalMs * Math.pow(2, attempt);
        await this.sleep(waitMs);
      }
    }

    throw new Error(
      `Max retries reached. Missing required fields. Last response: ${JSON.stringify(lastResponseJson)}`,
    );
  }

  /**
   * Polls UCD until SMS / email / opt-out fields match expected values.
   * Linear polling with an optional initial wait before first check.
   */
  @Step('Wait for UCD state update')
  async waitForStateUpdate(
    email: string,
    options: {
      identifierType?: string;
      identifierValue?: string;
      emailExpectedValue?: boolean;
      smsExpectedValue?: boolean;
      globUnsubExpectedValue?: number;
      smsOptOutExpectedValue?: boolean;
      maxRetries?: number;
      pollingIntervalMs?: number;
      initialWaitMs?: number;
    } = {},
  ): Promise<FetchUcdResult> {
    const {
      identifierType = 'em',
      identifierValue,
      emailExpectedValue,
      smsExpectedValue,
      globUnsubExpectedValue,
      smsOptOutExpectedValue,
      maxRetries = 12,
      pollingIntervalMs = 15_000,
      initialWaitMs = 30_000,
    } = options;

    await this.sleep(initialWaitMs);

    const lookupValue = identifierValue ?? email;
    if (!lookupValue) throw new Error('Identifier value is required.');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const { statusCode, responseText } = await this.queryProfile(identifierType, lookupValue);
      let responseJson: Record<string, unknown> = {};
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = {};
      }

      const ucdData = responseJson.attributes as UcdAttributes | undefined;
      const ucdResponse: UcdResponse = { statusCode, raw: responseText, json: responseJson };

      if (statusCode !== 404 && ucdData) {
        const ok =
          (emailExpectedValue === undefined || ucdData.eo === emailExpectedValue) &&
          (smsExpectedValue === undefined || ucdData.so === smsExpectedValue) &&
          (globUnsubExpectedValue === undefined ||
            ucdData.global_unsubscribe === globUnsubExpectedValue) &&
          (smsOptOutExpectedValue === undefined ||
            ucdData.sms_opt_out_user === smsOptOutExpectedValue);

        if (ok) return { ucdData, ucdResponse };
      }

      if (attempt < maxRetries) {
        await this.sleep(pollingIntervalMs);
      }
    }

    throw new Error(`Max retries reached without meeting conditions for: ${email}`);
  }

  /** Waits a fixed buffer for Shopify → UCD sync to settle. */
  async waitForSync(bufferMs = 60_000): Promise<void> {
    await this.sleep(bufferMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

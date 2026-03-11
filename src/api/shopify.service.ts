import { APIRequestContext, expect } from '@playwright/test';
import BaseService from '@core/base.service';
import { Step } from '@core/base.page';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopifyMarketingConsent {
  state: string;
  opt_in_level: string;
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  email_marketing_consent: ShopifyMarketingConsent;
  sms_marketing_consent: ShopifyMarketingConsent;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_CODES = ['GB', 'TR', 'CA'] as const;
const COUNTRY_PREFIXES: Record<string, string> = { GB: '+44', TR: '+90', CA: '+1' };
// First digit per country: GB mobile=7, TR mobile=5, CA valid area=4
const COUNTRY_FIRST_DIGIT: Record<string, string> = { GB: '7', TR: '5', CA: '4' };

// ─── Service ──────────────────────────────────────────────────────────────────

export default class ShopifyService extends BaseService {
  private readonly storeBaseUrl: string;
  private readonly shopifyHeaders: Record<string, string>;

  constructor(
    context: APIRequestContext,
    storeName: string,
    apiVersion: string,
    shopifyToken: string,
  ) {
    super(context, false);
    this.storeBaseUrl = `https://${storeName}.myshopify.com/admin/api/${apiVersion}/customers`;
    this.shopifyHeaders = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    };
  }

  @Step('POST: Create Shopify customer')
  async createCustomer(
    emailMarketingState: string,
    smsMarketingState: string,
  ): Promise<ShopifyCustomer> {
    const ts = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const payload = {
      customer: {
        first_name: `first${ts}`,
        last_name: `last${ts}`,
        email: this.generateRandomEmail(),
        phone: this.generateUniquePhone(),
        verified_email: true,
        email_marketing_consent: { state: emailMarketingState, opt_in_level: 'single_opt_in' },
        sms_marketing_consent: { state: smsMarketingState, opt_in_level: 'single_opt_in' },
      },
    };

    const response = await this.context.post(`${this.storeBaseUrl}.json`, {
      headers: this.shopifyHeaders,
      data: payload,
    });
    const body = await response.json();
    expect(response.ok(), `Shopify createCustomer failed [${response.status()}]: ${JSON.stringify(body)}`).toBeTruthy();
    expect(body.customer, `Shopify response missing 'customer': ${JSON.stringify(body)}`).toBeDefined();
    return body.customer as ShopifyCustomer;
  }

  @Step('PUT: Update Shopify customer optin')
  async updateOptin(
    customerId: number,
    emailMarketingState: string,
    smsMarketingState: string,
    retries = 3,
    delayMs = 5_000,
  ): Promise<ShopifyCustomer> {
    const payload = {
      customer: {
        id: customerId,
        email_marketing_consent: { state: emailMarketingState, opt_in_level: 'single_opt_in' },
        sms_marketing_consent: { state: smsMarketingState, opt_in_level: 'single_opt_in' },
      },
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      const response = await this.context.put(`${this.storeBaseUrl}/${customerId}.json`, {
        headers: this.shopifyHeaders,
        data: payload,
      });
      expect(response.ok(), `Shopify updateOptin failed [${response.status()}]`).toBeTruthy();
      const body = await response.json();
      const customerData = body.customer as ShopifyCustomer;
      if (customerData?.sms_marketing_consent?.state === smsMarketingState) {
        return customerData;
      }
      if (attempt < retries) await this.sleep(delayMs);
    }

    throw new Error(
      `SMS marketing state was not updated to '${smsMarketingState}' after ${retries} attempts`,
    );
  }

  @Step('GET: Shopify customer SMS consent state')
  async getSmsConsentState(customerId: number): Promise<boolean | 'not_subscribed' | null> {
    const response = await this.context.get(`${this.storeBaseUrl}/${customerId}.json`, {
      headers: this.shopifyHeaders,
    });
    expect(response.ok(), `Shopify getSmsConsentState failed [${response.status()}]`).toBeTruthy();
    const body = await response.json();
    const customerData = body.customer as ShopifyCustomer;

    expect(
      customerData && 'sms_marketing_consent' in customerData,
      `'sms_marketing_consent' field not found for customer ${customerId}`,
    ).toBeTruthy();
    if (customerData.sms_marketing_consent === null) return null;

    const state = customerData.sms_marketing_consent?.state;
    if (state === 'subscribed') return true;
    if (state === 'unsubscribed') return false;
    if (state === 'not_subscribed') return 'not_subscribed';
    return null;
  }

  @Step('DELETE: Shopify customer')
  async deleteCustomer(customerId: number): Promise<void> {
    await this.context.delete(`${this.storeBaseUrl}/${customerId}.json`, {
      headers: this.shopifyHeaders,
    });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private generateRandomEmail(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const length = Math.floor(Math.random() * 6) + 5;
    const username = Array.from({ length }, () =>
      chars[Math.floor(Math.random() * chars.length)],
    ).join('');
    return `${username}@example.com`;
  }

  private generateUniquePhone(): string {
    const prefix = '+90';
    const validTrPrefixes = ['532', '533', '542', '505', '555', '530'];
    const selectedPrefix = validTrPrefixes[Math.floor(Math.random() * validTrPrefixes.length)];
    const rest = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
    const finalPhone = `${prefix}${selectedPrefix}${rest}`;
    console.log(`[ShopifyService] Generated Valid Phone: ${finalPhone}`);
    return finalPhone;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

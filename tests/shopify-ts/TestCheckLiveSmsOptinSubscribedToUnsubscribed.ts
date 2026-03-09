import { Settings } from './Settings';
import { ShopifyStoreConfig, ShopifyStores } from './ShopifyConfig';
import { SettingKeys } from './SettingKeys';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopifyMarketingConsent {
  state: string;
  opt_in_level: string;
}

interface ShopifyCustomer {
  id: number;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  email_marketing_consent: ShopifyMarketingConsent;
  sms_marketing_consent: ShopifyMarketingConsent;
}

interface UcdAttributes {
  c_shopify_id: string;
  so: boolean;
  sms_opt_out_user: boolean;
  eo?: boolean;
  em?: string;
  global_unsubscribe?: number;
  [key: string]: unknown;
}

interface UcdResponse {
  statusCode: number;
  raw: string;
  json: Record<string, unknown>;
}

interface CreateCustomerResult {
  customerData: ShopifyCustomer;
  email: string;
}

interface UpdateOptinResult {
  customerData: ShopifyCustomer;
}

interface FetchUcdResult {
  ucdData: UcdAttributes;
  ucdResponse: UcdResponse;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_CODES = ['GB', 'TR', 'CA'];
const COUNTRY_PREFIXES: Record<string, string> = { GB: '+44', TR: '+90', CA: '+1' };
const UCD_REQUIRED_FIELDS_SMS = new Set(['c_shopify_id', 'sms_opt_out_user', 'so']);

// ─── Test Class ───────────────────────────────────────────────────────────────

/**
 * TC-6829 / TC-6827
 * Verifies that a Shopify customer's SMS opt-in state transitions from
 * "subscribed" to "unsubscribed" and is correctly reflected in UCD.
 *
 * Owner: mariia_izio | Priority: MEDIUM | Team: Kraken | Env: PRODUCTION
 */
export class TestCheckLiveSmsOptinSubscribedToUnsubscribed {
  // ── Metadata ──────────────────────────────────────────────────────────────
  static readonly caseIds = ['TC-6829', 'TC-6827'];
  static readonly owner = 'mariia_izio';
  static readonly priority = 'MEDIUM';
  static readonly productTeam = 'Kraken';
  static readonly runOnly = 'PRODUCTION';

  // ── Config ────────────────────────────────────────────────────────────────
  private readonly storeName: string;
  private readonly partner: string;
  private readonly apiVersion: string;
  private readonly shopifyToken: string;
  private readonly ucdBaseUrl: string;
  private readonly ucdApiKey: string;

  constructor() {
    const settings = new Settings();

    // Auto-resolve store config based on the current environment.
    // In production / Jenkins → PROD_LIVE_SYNC store is used automatically.
    // Override with ShopifyStores.STORE_1 etc. if needed:
    //   const config = ShopifyStoreConfig.resolveConfig(settings, ShopifyStores.STORE_1);
    const config = ShopifyStoreConfig.resolveConfig(settings, ShopifyStores.PROD_LIVE_SYNC);

    this.storeName = config.shopUrl;
    this.partner = config.partner;
    this.apiVersion = config.apiVersion;
    this.shopifyToken = config.token;

    const domain = settings.getDomain();
    this.ucdBaseUrl = `http://atrium.${domain}/api/contact/v1/profile`;
    this.ucdApiKey = settings.get(SettingKeys.UCD_API_KEY);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private get shopifyBaseUrl(): string {
    return `https://${this.storeName}.myshopify.com/admin/api/${this.apiVersion}/customers`;
  }

  private get shopifyHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.shopifyToken,
    };
  }

  private generateRandomEmail(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const length = Math.floor(Math.random() * 6) + 5;
    const username = Array.from({ length }, () =>
      chars[Math.floor(Math.random() * chars.length)],
    ).join('');
    return `${username}@example.com`;
  }

  private generateUniquePhone(): string {
    const code = COUNTRY_CODES[Math.floor(Math.random() * COUNTRY_CODES.length)];
    const prefix = COUNTRY_PREFIXES[code];
    const number = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
    return `${prefix}${number}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private log(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  // ─── Shopify API ──────────────────────────────────────────────────────────

  /** Creates a new Shopify customer. */
  async createAndGetShopifyCustomerData(
    emailMarketingState: string,
    smsMarketingState: string,
  ): Promise<CreateCustomerResult> {
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

    const response = await fetch(`${this.shopifyBaseUrl}.json`, {
      method: 'POST',
      headers: this.shopifyHeaders,
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    const customerData: ShopifyCustomer = data.customer;
    const email = customerData?.email ?? '';

    this.log(`Shopify customer created [${response.status}]: ${JSON.stringify(customerData)}`);
    return { customerData, email };
  }

  /**
   * Updates email and SMS marketing consent for an existing customer.
   * Retries up to 3 times until the SMS state is confirmed.
   */
  async updateShopifyOptinData(
    customerId: number,
    emailMarketingState: string,
    smsMarketingState: string,
    retries = 3,
    delayMs = 5_000,
  ): Promise<UpdateOptinResult> {
    const payload = {
      customer: {
        id: customerId,
        email_marketing_consent: { state: emailMarketingState, opt_in_level: 'single_opt_in' },
        sms_marketing_consent: { state: smsMarketingState, opt_in_level: 'single_opt_in' },
      },
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.shopifyBaseUrl}/${customerId}.json`, {
          method: 'PUT',
          headers: this.shopifyHeaders,
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        const customerData: ShopifyCustomer = data.customer;
        if (customerData?.sms_marketing_consent?.state === smsMarketingState) {
          return { customerData };
        }
      } catch (err) {
        this.log(`[Attempt ${attempt}] updateShopifyOptinData failed: ${err}`);
      }
      if (attempt < retries) await this.sleep(delayMs);
    }

    throw new Error(
      `SMS marketing state was not updated to '${smsMarketingState}' after ${retries} attempts`,
    );
  }

  /**
   * Gets the SMS marketing consent state for a customer from Shopify.
   * Returns: true (subscribed) | false (unsubscribed) | 'not_subscribed' | null
   */
  async getSmsMarketingConsentState(
    customerId: number,
  ): Promise<boolean | 'not_subscribed' | null> {
    const response = await fetch(`${this.shopifyBaseUrl}/${customerId}.json`, {
      headers: this.shopifyHeaders,
    });
    const data = await response.json();
    const customerData: ShopifyCustomer = data.customer;

    if (!customerData || !('sms_marketing_consent' in customerData)) {
      throw new Error("'sms_marketing_consent' field not found for the customer.");
    }
    if (customerData.sms_marketing_consent === null) return null;

    const state = customerData.sms_marketing_consent?.state;
    if (state === 'subscribed') return true;
    if (state === 'unsubscribed') return false;
    if (state === 'not_subscribed') return 'not_subscribed';
    return null;
  }

  /** Deletes a Shopify customer by ID. */
  async deleteShopifyUser(customerId: number): Promise<void> {
    await fetch(`${this.shopifyBaseUrl}/${customerId}.json`, {
      method: 'DELETE',
      headers: this.shopifyHeaders,
    });
    this.log(`Customer ${customerId} deleted.`);
  }

  // ─── UCD (Atrium) API ─────────────────────────────────────────────────────

  private async queryContactProfile(
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
      const response = await fetch(this.ucdBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Atrium-Api-Key': this.ucdApiKey,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return { statusCode: response.status, responseText: JSON.stringify(data) };
    } catch {
      return { statusCode: 500, responseText: '{"error":"Request failed"}' };
    }
  }

  /**
   * Polls UCD until all required SMS fields are present.
   * First wait: 60 s, then exponential back-off.
   */
  async fetchLiveUcdData(
    identifierType: string,
    identifierValue: string,
    maxRetries = 8,
    pollingIntervalMs = 5_000,
  ): Promise<FetchUcdResult> {
    let lastResponseJson: Record<string, unknown> = {};

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { statusCode, responseText } = await this.queryContactProfile(
        identifierType,
        identifierValue,
      );
      let responseJson: Record<string, unknown> = {};
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { error: 'Invalid JSON response' };
      }

      lastResponseJson = responseJson;
      const ucdData = responseJson.attributes as UcdAttributes | undefined;
      const ucdResponse: UcdResponse = { statusCode, raw: responseText, json: responseJson };

      this.log(`[UCD ${attempt + 1}/${maxRetries}] status=${statusCode} data=${JSON.stringify(ucdData)}`);

      if (statusCode !== 404 && ucdData) {
        const missing = [...UCD_REQUIRED_FIELDS_SMS].filter((f) => !(f in ucdData));
        if (missing.length === 0) {
          this.log('[UCD] All required fields found.');
          return { ucdData, ucdResponse };
        }
        this.log(`[UCD] Missing fields: ${missing.join(', ')}`);
      } else {
        this.log('[UCD] User not found or no attributes yet.');
      }

      if (attempt < maxRetries - 1) {
        const waitMs = attempt === 0 ? 60_000 : pollingIntervalMs * Math.pow(2, attempt);
        this.log(`Waiting ${waitMs / 1000}s before retry…`);
        await this.sleep(waitMs);
      }
    }

    throw new Error(
      `Max retries reached. Missing SMS fields. Last response: ${JSON.stringify(lastResponseJson)}`,
    );
  }

  /** Waits a fixed buffer for Shopify → UCD sync to settle. */
  async waitForUcdShopifySync(bufferMs = 60_000): Promise<void> {
    this.log(`Waiting ${bufferMs / 1000}s for UCD ↔ Shopify sync…`);
    await this.sleep(bufferMs);
  }

  /**
   * Polls UCD until SMS / email / opt-out fields match expected values.
   * Exponential back-off between retries.
   */
  async waitForUcdStateUpdate(
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
    } = {},
  ): Promise<FetchUcdResult> {
    const {
      identifierType = 'em',
      identifierValue,
      emailExpectedValue,
      smsExpectedValue,
      globUnsubExpectedValue,
      smsOptOutExpectedValue,
      maxRetries = 8,
      pollingIntervalMs = 10_000,
    } = options;

    const lookupValue = identifierValue ?? email;
    if (!lookupValue) throw new Error('Identifier value is required.');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const { statusCode, responseText } = await this.queryContactProfile(
        identifierType,
        lookupValue,
      );
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
          (globUnsubExpectedValue === undefined || ucdData.global_unsubscribe === globUnsubExpectedValue) &&
          (smsOptOutExpectedValue === undefined || ucdData.sms_opt_out_user === smsOptOutExpectedValue);

        if (ok) return { ucdData, ucdResponse };
      }

      if (attempt < maxRetries) {
        const waitMs = pollingIntervalMs * Math.pow(2, attempt - 1);
        this.log(`[UCD] Conditions not met (attempt ${attempt}). Waiting ${waitMs / 1000}s…`);
        await this.sleep(waitMs);
      }
    }

    throw new Error(`Max retries reached without meeting conditions for: ${email}`);
  }

  // ─── Test ─────────────────────────────────────────────────────────────────

  /**
   * TC-6829 / TC-6827
   * 1. Create subscribed Shopify user (email=not_subscribed, sms=subscribed) → verify in UCD
   * 2. Update SMS consent to unsubscribed
   * 3. Verify unsubscribed on both Shopify and UCD
   * 4. Delete the created customer
   */
  async run(): Promise<void> {
    // Step 1 ─────────────────────────────────────────────────────────────────
    this.log('1. Create new subscribed shopify user and check common customer information on Shopify and UCD');

    const { customerData, email } = await this.createAndGetShopifyCustomerData(
      'not_subscribed',
      'subscribed',
    );
    const customerId = customerData.id;

    const { ucdData: liveUcdData } = await this.fetchLiveUcdData('em', email);

    if (customerId !== parseInt(liveUcdData.c_shopify_id, 10)) {
      throw new Error(`Id mismatch: Shopify=${customerId}, UCD=${liveUcdData.c_shopify_id}`);
    }

    const smsState = await this.getSmsMarketingConsentState(customerId);
    if (smsState !== liveUcdData.so) {
      throw new Error(`sms_marketing_consent mismatch: Shopify=${smsState}, UCD=${liveUcdData.so}`);
    }
    this.log('User was created successfully!');

    // Step 2 ─────────────────────────────────────────────────────────────────
    this.log("2. Update shopify marketing optins to 'unsubscribed' for newly created user");

    await this.waitForUcdShopifySync(60_000);

    const { customerData: updatedCustomerData } = await this.updateShopifyOptinData(
      customerId,
      'subscribed',
      'unsubscribed',
    );

    const updatedSmsState = updatedCustomerData.sms_marketing_consent?.state;
    if (updatedSmsState !== 'unsubscribed') {
      throw new Error(`Sms state was not 'unsubscribed', got: '${updatedSmsState}'`);
    }
    this.log('Updated optins successfully');

    // Step 3 ─────────────────────────────────────────────────────────────────
    this.log('3. Verify user is unsubscribed on Shopify and UCD');

    const { ucdData: updatedLiveUcdData } = await this.waitForUcdStateUpdate(email, {
      identifierType: 'em',
      identifierValue: email,
      smsExpectedValue: false,
      smsOptOutExpectedValue: true,
    });

    const updatedShopifySmsState = await this.getSmsMarketingConsentState(customerId);
    if (updatedShopifySmsState !== updatedLiveUcdData.so) {
      throw new Error(
        `Sms state mismatch after update: Shopify=${updatedShopifySmsState}, UCD=${updatedLiveUcdData.so}`,
      );
    }
    if (updatedLiveUcdData.sms_opt_out_user !== true) {
      throw new Error('Expected sms_opt_out_user to be true');
    }
    this.log('User is unsubscribed on Shopify and UCD');

    // Step 4 ─────────────────────────────────────────────────────────────────
    this.log('4. Delete created customer from Shopify');
    await this.deleteShopifyUser(customerId);
    this.log('User deleted successfully');
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

// const test = new TestCheckLiveSmsOptinSubscribedToUnsubscribed();
// test.run().catch(console.error);

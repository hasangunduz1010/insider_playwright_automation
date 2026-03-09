import * as dotenv from 'dotenv';
import { Environment } from './Environments';
import { SettingKey } from './SettingKeys';

dotenv.config();

/**
 * Mirrors Python's Settings class.
 *
 * Python reads secrets from settings.ini (local) or AWS S3 (CI/CD).
 * Here we read them from process.env / a .env file.
 *
 * Required env vars for this test:
 *   TEST_ENV                      → one of the Environment enum values (default: LOCAL)
 *   PROD_SHOPIFY_LIVE_SYNC_TOKEN  → Shopify admin API token for the prod live-sync store
 *   UCD_API_KEY                   → Atrium UCD API key
 *   PARTNER_NAME                  → partner slug (e.g. "shopifytest")
 */
export class Settings {
  readonly env: Environment;

  constructor() {
    this.env = this.resolveEnv();
  }

  private resolveEnv(): Environment {
    const raw = process.env['TEST_ENV'];
    if (!raw) return Environment.LOCAL;
    const match = Object.values(Environment).find((v) => v === raw);
    return match ?? Environment.LOCAL;
  }

  get(key: SettingKey): string {
    // env var name is the key uppercased
    const envKey = key.toUpperCase();
    const value = process.env[envKey];
    if (value === undefined) {
      throw new Error(
        `Missing required env variable: ${envKey}. Add it to your .env file.`,
      );
    }
    return value;
  }

  getOptional(key: SettingKey): string | undefined {
    return process.env[key.toUpperCase()];
  }

  /**
   * Mirrors Python's Settings.get_domain().
   * Production / Jenkins → useinsider.com
   * Everything else      → insidethekube.com
   */
  getDomain(): string {
    const prodEnvs: Environment[] = [
      Environment.PROD_KUBE,
      Environment.JENKINS_TEST,
    ];
    return prodEnvs.includes(this.env) ? 'useinsider.com' : 'insidethekube.com';
  }
}

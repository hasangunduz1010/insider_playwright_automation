export const DOMAINS = {
    INSIDETHEKUBE: 'inone.useinsider.com',
} as const;

export const PARTNERS = {
    KRAKENTEST: 'krakentest',
    QAAUTOMATION1: 'qaautomation1',
    HOLOCRON_AUTOMATION: 'holocronautomation',
} as const;

export const TIMEOUTS = {
    TEST: 60000,
    NAVIGATION: 30000,
    ELEMENT: 15000,
    NETWORK: 10000,
    SHORT: 5000,
} as const;

export type Partner = (typeof PARTNERS)[keyof typeof PARTNERS];
export type Timeout = (typeof TIMEOUTS)[keyof typeof TIMEOUTS];

const ALL_PLATFORMS_PATH = '/external-integrations/integrations/all' as const;
const INTEGRATED_PATH = '/external-integrations/integrations/integrated' as const;

export const URLS = {
    LOGIN: `https://${DOMAINS.INSIDETHEKUBE}/login`,
    ALL_PLATFORMS: ALL_PLATFORMS_PATH,
    getPartnerURL: (partner: string): string =>
        `https://${partner}.${DOMAINS.INSIDETHEKUBE}`,
    getAllPlatformsURL: (partner: string): string =>
        `https://${partner}.${DOMAINS.INSIDETHEKUBE}${ALL_PLATFORMS_PATH}`,
    getIntegratedURL: (partner: string): string =>
        `https://${partner}.${DOMAINS.INSIDETHEKUBE}${INTEGRATED_PATH}`,
};

export const SELECTORS = {
    LOGIN: {
        EMAIL_INPUT: '#email',
        PASSWORD_INPUT: '#password',
        LOGIN_BUTTON: '#login-button',
    },
    PARTNER_SELECT: {
        SELECT_BOX: '#qa-select',
        DROPDOWN_SEARCH: '#dropdownBox',
        OPTION: (value: string): string =>
            `.in-select__dropdown .in-dropdown-box__option:has([title="${value}"])`,
    },
    ALL_PLATFORMS: {
        LIST: '[data-testid="all-platforms-list"]',
    },
    LAUNCH: {
        PAGE: '[data-testid="launch-page"]',
    },
    DESTINATIONS_WRAPPER: '[data-testid="destinations-wrapper"]',
} as const;

export const CREDENTIALS = {
    EMAIL: process.env.PLAYWRIGHT_USER_EMAIL,
    PASSWORD: process.env.PLAYWRIGHT_USER_PASSWORD,
    PARTNER_NAME: PARTNERS.QAAUTOMATION1,
} as const;

export const URL_PATTERNS = {
    isPartnerURL: (url: string, partner: string): boolean =>
        url.includes(`${partner}.${DOMAINS.INSIDETHEKUBE}`),
    isAnyPartnerURL: (url: string): boolean =>
        url.includes(`${PARTNERS.QAAUTOMATION1}.${DOMAINS.INSIDETHEKUBE}`),
    isLoginURL: (url: string): boolean =>
        url.includes('login'),
} as const;

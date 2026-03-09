export enum ExchangeType {
    GOLD = 1, // Altın
    CURRENCY = 2, // Döviz
    BANK_CURRENCY = 3,
    BANK_GOLD = 4,
    DEPOSIT = 5,
    STOCK = 6, // Hisse Senetleri
    FUND = 7, // Fonlar
    IPO = 8, // Halka Arz
    STOCK_INDEX = 9, // Endeksler
    TI = 10,
    PORTFOLIO = 98,
    ALL = 99
}

export enum IysPermissionType {
    SMS = 1,
    CALL = 2,
    EMAIL = 3,
}

export enum Colors {
    WHITE = 'rgb(255, 255, 255)',
    LIGHT_PURPLE = 'rgb(185, 184, 229)',
    PURPLE = 'rgb(74, 73, 187)',
    PRICE_UP_GREEN = 'rgb(34, 197, 94)',
    PRICE_DOWN_RED = 'rgb(248, 113, 113)',
}

export enum Pages {
    HOME = '/',
    SHOPIFY_HOME = '/shopify',
}

export enum DBNames {
    CUSTOMER_DB = 'CustomerDB',
    IDENTITY_SERVER_DB = 'IdentityServerDB',
    CREDIT_CARD_DB = 'CreditCardDB'
}
export const USER_AGENT =
    'mozilla/5.0 (macintosh; intel mac os x 10_15_7) applewebkit/537.36 (khtml, like gecko) chrome/135.0.0.0 safari/537.36';

// ─── Shopify Marketing States ─────────────────────────────────────────────────

export const SmsState = {
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  NOT_SUBSCRIBED: 'not_subscribed',
} as const;

export const EmailState = {
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  NOT_SUBSCRIBED: 'not_subscribed',
} as const;

// ─── UCD Identifier Types ─────────────────────────────────────────────────────

export const UcdIdentifier = {
  EMAIL: 'em',
  PHONE: 'ph',
} as const;

// ─── UCD Required Fields ──────────────────────────────────────────────────────

export const UcdRequiredFields = {
  SMS: ['c_shopify_id', 'sms_opt_out_user', 'so'],
  EMAIL_SMS: ['c_shopify_id', 'sms_opt_out_user', 'so', 'eo'],
} as const;

// ─── UCD Expected States ──────────────────────────────────────────────────────

export const UcdExpected = {
  SMS_UNSUBSCRIBED: {
    identifierType: UcdIdentifier.EMAIL,
    smsExpectedValue: false,
    smsOptOutExpectedValue: true,
  },
  EMAIL_SMS_UNSUBSCRIBED: {
    identifierType: UcdIdentifier.EMAIL,
    emailExpectedValue: false,
    smsExpectedValue: false,
    smsOptOutExpectedValue: true,
  },
} as const;

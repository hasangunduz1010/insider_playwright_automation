---
name: shopify-tags-and-discounts
description: Details how Shopify Tags are synced as array attributes for dynamic segmentation, and how Shopify Discounts are generated and imported into Insider's Coupon Management module. Use when testing Shopify tag sync to UCD (c_shopify_tags), dynamic segment creation by tags, or coupon list upload and campaign assignment workflows.
---

# Shopify Tags & Discount Management Skill

## Integration Context
- **Type**: Data Segmentation & Campaign Management
- **Target Products**: UCD Attributes, Dynamic Segments, Coupon Management

---

## Shopify Tags Synchronization
- **Data Type**: Shopify Tags are automatically synced into Insider as a custom attribute named `Shopify Tags`.
- **Structure**: Stored as an **array of strings** (allowing multiple tags per user).
- **Segmentation**: Used in Dynamic Segments with operators **Matches** (include) or **Does Not Match** (exclude). You can select multiple tags.

### Segment Users by Shopify Tags (InOne)
1. **Audience > Segments > Saved Segments** → **Create** → **Dynamic Segment**.
2. Under **Attributes**, add filter **Shopify Tags**.
3. **Matches** – include users with selected tag(s). **Does Not Match** – exclude users with selected tag(s).
4. Select one or more tags → **Save**. Segment is available for all channels (e.g. Architect).

---

## Shopify Discounts (Coupon Management)
- **Generation**: Discounts cannot be generated directly inside Insider. Use the **Bulk Discount Code Bot** app in Shopify Admin to create discount sets.
- **Types**: Percentage, Fixed amount, Free shipping, Buy X Get Y (and other supported types).
- **Flow**: Create discount set in Shopify → Export codes as CSV → Prepare CSV per InOne rules → Upload to InOne **Components > Coupon Lists > Upload Coupons** → Use in Email, Architect, OnSite, App Push, Web Push, SMS, WhatsApp.

### Bulk Discount Code Bot (Shopify)
1. **Apps > Bulk Discount Code Bot** → **Create Discount Set**.
2. Choose: **Generate random codes**, **Provide specific codes**, or **Upload CSV**.
3. Configure discount type, amount/rule, eligible products/collections, minimum purchase, usage limits, validity period.
4. Generate at least as many unique codes as the number of users you will target (e.g. 50,000 recipients → 50,000+ codes).

### Export and InOne Upload
1. In Shopify: **Discounts** → select discount set → **View All Codes** → **Export** → **Export as CSV** (email with download link).
2. **CSV for InOne**: UTF-8 encoding; no headers (first row = first coupon); text after a comma on a line is ignored; one code per line; max **10MB** per file; up to **20 million** unique codes per list (use Single Code list for more); max expiration **1 year**; each code at least **2 alphanumeric characters** (`a-z`, `A-Z`, `0-9`, `-`, `_`). Duplicates are dropped on upload.
3. InOne: **Components > Coupon Lists > Upload Coupons** → select file, name list, set expiration → **Upload**.

### Using Coupons in Campaigns
- **Email**: Personalization token `{{coupon_code}}`.
- **Architect**: Coupon list block to assign a unique code per user in the flow.
- **OnSite, App Push, Web Push, SMS, WhatsApp**: Reference coupon lists for personalized promotions.

### Discount FAQ (Academy)
- **How many codes?** At least as many as users you plan to target.
- **File >10MB?** Split into smaller files (max 10MB per CSV).
- **Duplicate codes?** InOne drops duplicates on upload.
- **Reuse list?** Yes, if codes remain valid and unredeemed in Shopify.
- **Commas/headers in CSV?** Remove headers and avoid commas in code; they can cause errors.
- **Max codes per list?** Up to 20 million; use Single Code list for more.
- **Encoding?** Use UTF-8.

---

## API & UI Test Flows

### Flow 1: Verifying Shopify Tags in UCD Profile
```typescript
// Verify that Shopify Tags are synced as an array of strings
const response = await request.post('[http://atrium.insidethekube.com/api/contact/v1/profile](http://atrium.insidethekube.com/api/contact/v1/profile)', {
  headers: {
    'x-ins-namespace': 'sd-106998',
    'Content-Type': 'application/json'
  },
  data: {
    partner: "shopbagg",
    identifiers: { em: "test_tags@example.com" },
    attributes: ["Shopify Tags"]
  }
});

const body = await response.json();
const tags = body.data.attributes['Shopify Tags'];

// Assert it is an array and contains the specific tag
expect(Array.isArray(tags)).toBeTruthy();
expect(tags).toContain('VIP_Customer');
```

---

## Expected Behaviors & Error Handling

- **Discount Quantity Rule**: Tests checking coupon assignments must verify that the number of generated unique codes matches or exceeds the segment size (e.g., 50,000 users require 50,000 unique codes).
- **Tag Updates**: If a tag is removed in Shopify, the tag array in UCD must be overwritten to reflect the removal.
- **insider_exclude_user Tag**: Customers with this tag are not synced to Insider (see Customer Sync). If assigned at creation, the user is never created in Insider; if added later, no update is made to the existing user.

---

## UCD Tag Attribute Details

- **UCD Field Name**: `c_shopify_tags`
- **Type**: Array of strings (multiple tags per user)
- **Shopify Format**: Comma-separated string (`"VIP, premium, new-customer"`)
- **UCD Format**: String array (`["VIP", "premium", "new-customer"]`)
- **Normalization**: Tags on both sides are whitespace-trimmed; comparison is done via set equality (order does not matter)

### Tag Special Character Support
Supported tag examples from real test data:
```typescript
const TAG_LIST: string[] = [
  'automation', 'test', 'VIP', 'premium', 'new-customer',
  'test_tag%',       // % character
  'tag&value',       // & character
  'special(*)',      // parentheses and *
  'Winter', 'Summer',
  'test@!#$()§±>',   // special symbols
  'collection-2024', // contains hyphen
];
```

---

## Full Test Pattern (Tag Sync – LiveSync/ShopifyToInsider)

```typescript
import { sampleSize, random } from 'lodash';

// Test setup
const expectedTags = sampleSize(TAG_LIST, random(1, 5));

// 1. Create new customer in Shopify
const { customerData, email } = await createShopifyCustomer({
  emailMarketingState: 'subscribed',
  smsMarketingState: 'subscribed',
  partner, storeName, token,
});

// 2. Wait for customer to be created in UCD
const liveUcdData = await fetchLiveUcdData({
  email, userType: 'email_un/subscribed',
  identifierType: 'em', identifierValue: email,
  partner,
});
const customerId: number = customerData.id;
expect(customerId).toBe(Number(liveUcdData.c_shopify_id));

// 3. Add tags to customer
const updateResponse = await updateCustomerTags(customerId, expectedTags, { partner, token });
expect(updateResponse.status()).toBe(200);

// 4. Fetch updated tag list from Shopify
const shopifyDataAfter = await getShopifyCustomer(customerId, { partner, token });

// 5. Wait for tag sync in UCD
const ucdDataWithTags = await waitForUcdTagUpdate(email, expectedTags, { partner });

// 6. Assertion — Shopify tags
const shopifyTagsStr: string = shopifyDataAfter.tags ?? '';
const shopifyTagsSet = new Set(shopifyTagsStr.split(',').map(t => t.trim()).filter(Boolean));

// 7. Assertion — UCD tags
const rawUcdTags: string | string[] = ucdDataWithTags.c_shopify_tags ?? [];
const ucdTagsSet = new Set(
  Array.isArray(rawUcdTags)
    ? rawUcdTags.map(t => t.trim())
    : String(rawUcdTags).split(',').map(t => t.trim()).filter(Boolean)
);

const expectedSet = new Set(expectedTags.map(t => t.trim()));
expect(shopifyTagsSet).toEqual(expectedSet);  // Shopify tags mismatch
expect(ucdTagsSet).toEqual(expectedSet);      // UCD tags mismatch

// 8. Cleanup
await deleteShopifyCustomer(customerId, { partner, token });
```

### Tag Polling Details (`waitForUcdTagUpdate`)
- Polls until `c_shopify_tags` field is visible in UCD
- First retry: 60-second wait
- Subsequent retries: `10 * 2^attempt` seconds (exponential backoff)
- Default max_retries: 8
- Tags from UCD are validated using set comparison (order does not matter)

---

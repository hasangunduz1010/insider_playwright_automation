---
name: shopify-faq
description: FAQ about Shopify integration. Onboarding, user/subscriber sync, events, product catalog, Markets, campaigns (checkout, back-in-stock), coupons, theme changes, integration stopped, unsubscribed, Hydrogen, permissions. Use when validating expected integration behaviors, writing test assertions for edge cases, or understanding support scenarios and expected error states.
---

# Kraken Shopify FAQ Skill

## Integration Context
- **Product**: Kraken (Shopify Integration)
- **Source**: FAQ about Shopify (Academy); use for test expectations and support scenarios

---

## Onboarding

**How long does full integration take?**  
A few clicks; user data and events start collecting promptly.

**Do I need IT to integrate?**  
No. Follow the integration article; contact Insider One for technical questions.

**How do I test if Shopify data is collected correctly?**  
- Compare total purchase count (Insider vs Shopify).  
- Compare customer count (Shopify Customer base vs Insider user base).  
- Compare product count (Shopify vs Insider).

**What Insider One products can I use after integration?**  
All products in your plan: custom journeys, marketing campaigns, smart recommendations, web templates, etc.

**Multiple stores?**  
Create a **separate InOne panel per Shopify store**.

**One-way or two-way sync?**  
**Two-way**. User, product, and event data from Shopify to Insider; marketing consent (e.g. Email, SMS) from Insider to Shopify.

---

## User and Subscriber Sync

**Does Insider update marketing consents automatically when they change in Shopify?**  
Yes, when **Subscription Updates** toggle is on. By default Insider does not send this to Shopify.

**Can I update marketing consents manually?**  
Yes: (1) Update on Shopify – consent syncs to Insider if User Sync is on; (2) Import user data into Insider with updated consent attributes.

**How do I collect user metafields from Shopify?**  
Create the corresponding attribute in InOne (same name and data type as Shopify metafield), then enable user sync. See User Data Synchronization docs.

**How often is user data updated?**  
Near real-time for updates and new users. Initial sync of all existing users may take time depending on data size.

**Why don’t lead collection contacts sync to Shopify?**  
Check sync settings: enable both “Shopify → Insider” and “Insider → Shopify” and select “Create New Ones” for full sync. See Integrate Insider with Shopify Store.

---

## Events

**Can I send custom events and parameters to Insider?**  
Yes. Contact Insider One to set up custom events (theme changes may affect them).

**Does Insider collect historical checkout data?**  
No. Shopify does not allow historical checkout events. Historical **purchase** data can be collected.

**How often is purchase data updated?**  
New purchases appear in Insider near real-time. Initial sync of existing purchases may take time. See Purchase Data Synchronization.

---

## Product Catalog

**If I add a new product metafield, will Insider collect it?**  
Yes. See Product Catalog Synchronization for mapping new metafields.

**How often is product data updated?**  
Updates on Shopify are reflected in InOne within about **15 minutes**.

**Different pricing per country?**  
Insider One does not currently integrate with Shopify Markets for country-based pricing. Contact Insider One if this is required.

---

## Shopify Markets (Product Catalog & Purchase)

**If “market” feature is NOT enabled?**  
Future and historical purchase events work as before. If enabled with correct locales, catalog syncs accordingly.

**Steps when “market” feature IS enabled?**  
Go to **Components > Product Catalog Management > Catalog Settings > Integration Settings** and activate **Via Click Stream Web** to localize the product catalog on the front end.

**Why use Click Stream for product data?**  
To localize the catalog on the front end for different markets.

**Can historic purchase events be broken down by market after integration?**  
No. Historic purchase events are not segmented by market; only **new** purchase events reflect market-specific data.

---

## Campaigns & Checkout

**Can I run a campaign on the checkout page?**  
No. Shopify’s security and UX constraints prevent direct campaigns on the checkout page.

**Back-in-stock campaigns?**  
Yes, via **Architect** (e.g. Back in Stock use case).

---

## Coupons

**Can I create a coupon for Shopify campaigns through Insider?**  
Coupons used on Shopify must be **created in Shopify** (Insider does not auto-mirror). You can create bulk coupons in Shopify (e.g. Bulk Discount Code Bot) and import to Insider for campaigns. See Use Shopify Discounts in Insider.

---

## Theme & Integration Status

**What if I change my Shopify theme?**  
Re-activate the Insider One app for the new theme: open the Insider One app in Shopify > Integration Settings > **Activate Theme**.

**Does Insider work with all themes?**  
Compatibility can vary. Contact support to confirm your theme or customizations.

**Customized theme – will Insider still work?**  
Data flow can be affected by the level of customization. Test after changes; contact Insider One if issues appear.

**Why did I get a “Shopify Theme deactivation” email?**  
Insider JS Tag and Insider Object (IO) are no longer active. Re-activate Insider One from the Shopify theme so both are enabled. See Integrate Insider with Shopify Store.

**Why do I see an “integration stopped” banner?**  
- Ensure **Shopify Web Pixel** is active (reconnect if needed). See Custom Web Pixel guide.  
- Ensure **ins.js** and **IO** are active; follow Integrate Insider with Shopify Store to reactivate.

---

## Subscriber Status

**Why are my Shopify users marked unsubscribed?**  
- **All Subscription Statuses** may be on: checkout marketing consent is unchecked by default; if users don’t check it, they can be marked unsubscribed. Consider **Only New Subscription Statuses**.  
- Data from an outdated source flowing into Shopify can also cause mismatches; keep sources up to date.

---

## Hydrogen & Custom Storefronts

**Does Insider integrate with Shopify Hydrogen?**  
Yes. Implement **Insider Object (IO)** and **ins.js** manually on the Hydrogen storefront for full tracking and personalization. See Hydrogen / custom storefront docs.

---

## Permissions

**Why can’t I change External Platform Integrations?**  
You need **Administrator** or **Editor with PII access** in InOne. See User Roles.

---

## Test / Automation Hints

- Use FAQ answers as **expected behavior** in tests (e.g. no checkout campaigns, theme reactivation required, sync toggles).
- **Segment counts**: Compare unique users with purchases, not order count.
- **Markets**: Historic purchases are not per-market; only new events are.

---

## Related Skills
- [shopify-onboarding-wizard.md](shopify-onboarding-wizard.md) – Setup steps
- [shopify-integration.md](shopify-integration.md) – Overview and sync types
- [shopify-api-customer-sync.md](shopify-api-customer-sync.md) – User sync details
- [shopify-tags-and-discounts.md](shopify-tags-and-discounts.md) – Discounts and coupons

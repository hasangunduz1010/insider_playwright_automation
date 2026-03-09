import {Locator, Page} from '@playwright/test';
import {Step} from './base.page';
import {expect, test} from "./fixture.base";
import {load} from "cheerio";
import {Client} from 'pg';
import {logStep} from "allure-js-commons";

export default class Helper {

    /**
     * Validates that each element in the given locator redirects to the expected URL.
     *
     * @param page - The current Playwright Page instance.
     * @param locator - A Locator that resolves to one or more clickable elements (e.g., links).
     * @param options - Configuration object for the redirect check.
     * @param options.expectedLinks - Optional array of expected hrefs. If omitted, hrefs are fetched from DOM.
     * @param options.before - Optional async hook executed before each redirect check (e.g., closing modals).
     * @param options.after - Optional async hook executed after each redirect check (e.g., cleanup).
     *
     * @example
     * await checkItemRedirectsCorrectly(page, page.locator('a.item'), {
     *   expectedLinks: ['/kredi', '/kredi-karti', '/kredi-karti/sorgulama']
     * });
     */
    @Step('check elements redirect correctly')
    static async checkItemRedirectsCorrectly(
        page: Page,
        locator: Locator,
        options: {
            openNewTab?: boolean;
            expectedLinks?: string[];
            before?: (locator: Locator, index: number) => Promise<boolean | void>;
            after?: () => Promise<void>;
        } = {}
    ) {
        test.slow();
        options.openNewTab = options.openNewTab ?? false;
        options.before = options.before ?? (async () => true);
        options.after = options.after ?? (async () => {
        });

        await expect(locator, 'Element count should be greater than 0').not.toHaveCount(0);
        const count = await locator.count();
        const baseUrl = page.url();
        await test.step(`item count is ${count}`, () => {
        });

        for (let i = 0; i < count; i++) {
            await test.step(`Check redirect for item ${i + 1}`, async step => {
                const element = locator.nth(i);
                const isContinue = options.before != undefined && await options.before(locator, i);
                step.skip(isContinue === false);

                const newPage = await Helper.checkOneItemRedirectsCorrectly(page, element, options.expectedLinks?.[i], options.openNewTab);
                if (options.after) {
                    await options.after();
                }
                if (newPage) {
                    await newPage.close();
                } else {
                    await page.goBack({waitUntil: 'domcontentloaded'});
                    await page.waitForURL(baseUrl, {timeout: 2_100}).catch(() => {
                    });
                    if (baseUrl !== page.url()) {
                        await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
                    }
                }
            });
        }
    }

    /**
     * FAQ : Accordion içeriğini API'den gelen verilerle karşılaştırır.
     *
     *  Ne yapıyor bu func:
     * - Accordion başlıklarının sırayla API'deki `title` değerleriyle eşleştiğini kontrol eder.
     * - Her bir başlığa tıklar, içeriğin görünmesini bekler.
     * - Açılan içerikteki tüm `<p>` elementlerini alır, birleştirir.
     * - API'den gelen `description` HTML'ini düz metne çevirir (Cheerio ile).
     * - Her iki metni normalize eder (boşluk, &nbsp, \u00A0 temizliği vs).
     * - UI içeriğinin API'den gelen içeriği kapsadığını `expect.soft(...).toContain(...)` ile doğrular.
     *
     *  Neden `expect.soft`?
     * - Bir item fail verse bile diğerleri kontrol edilmeye devam eder.
     *
     * Örnek kullanım:
     * await Helper.checkFaqContentWithApi(page, component.subTitle, component.subTitleContent, apiData);
     */
    static async checkFaqContentWithApi(
        page: Page,
        faqTitles: Locator,
        faqContents: Locator,
        apiData: { title: string; description: string }[]
    ) {
        const titleTexts = apiData.map(item => item.title);
        await expect(faqTitles).toHaveText(titleTexts);

        // Başta bilinen overlay'leri temizle
        await Helper.dismissKnownOverlays(page);

        const normalize = (input: string) => {
            if (!input) return '';
            let s = String(input)
                .replace(/<\/li>\s*<li>/gi, ' ')
                .replace(/<br\s*\/?>/gi, ' ')
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/\u00A0/g, ' ')
                .replace(/\u200B/g, '')
                .replace('\n|\t|\r/g', '')
                .replace(/&amp;/g, '&')
                .replace(/ +/g, ' ')
                .trim();
            if (s.startsWith(' ')) s = s.substring(1);
            if (s.endsWith(' ')) s = s.substring(0, s.length - 1);
            return s;
        };

        for (let i = 0; i < apiData.length; i++) {
            await test.step(`FAQ ${i + 1}/${apiData.length} — "${apiData[i].title}"`, async () => {
                const element = faqTitles.nth(i);
                const content = faqContents.nth(i);
                const apiDescriptionHtml = apiData[i].description?.trim() || '';

                // Accordion başlığını güvenle aç (overlay varsa temizleyip tekrar dener)
                await element.scrollIntoViewIfNeeded();
                await Helper.safeClick(page, element);
                await content.waitFor({state: 'visible'});

                // "Daha fazla / Devamını oku" vb. varsa güvenli tıklama ile aç
                const expanders = [
                    content.getByRole('button', {name: /daha\s*(fazla|fazla görüntüle|fazlasını gör|fazlasını göster|devamını oku)/i}),
                    content.getByRole('link', {name: /daha\s*(fazla|fazla görüntüle|fazlasını gör|fazlasını göster|devamını oku)/i}),
                    content.locator('[data-testid="read-more"], [data-testid="see-more"]'),
                    content.getByText('Daha fazla görüntüle')
                ];
                for (const exp of expanders) {
                    if (await exp.count()) {
                        const btn = exp.first();
                        await btn.scrollIntoViewIfNeeded();
                        await Helper.safeClick(page, btn);
                        break;
                    }
                }

                // Tıklamalardan sonra tekrar overlay temizliği (yeniden çıkmış olabilir)
                await Helper.dismissKnownOverlays(page);

                // UI & API metinleri
                const uiHtml = await content.innerHTML();
                const normalizedUI = normalize(uiHtml);

                const $ = load(apiDescriptionHtml);
                const apiHtml = $('body').html() ?? apiDescriptionHtml;
                const plainTextFromAPI = normalize(apiHtml);

                // Sade log (istenen format)
                console.log(`index=${i}. [FAQ][UI]  title="${apiData[i].title}" description="${normalizedUI}"`);
                console.log(`index=${i}. [FAQ][API] title="${apiData[i].title}" description="${plainTextFromAPI}"`);

                // Orijinal beklenti yönünü koruyoruz (UI ⊇ API)
                expect.soft(normalizedUI).toContain(plainTextFromAPI);
            });
        }
    }

    @Step('get element href')
    static async getElementHref(element: Locator) {
        await Helper.scrollElementToCenter(element);
        const tag = await element.evaluate(el => el.tagName.toUpperCase());
        if (tag === 'A') {
            return await element.getAttribute('href');
        }

        return await element.getByRole('link').first().getAttribute('href');
    }

    @Step('get element hrefs')
    static async getElementHrefs(element: Locator) {
        const all = await element.all();
        const hrefs: string[] = [];

        for (const locator of all) {
            const href = await this.getElementHref(locator);
            if (href) hrefs.push(href);
        }
        return hrefs;
    }

    // Static method to remove HTML tags from a string
    static removeHtmlTags(text: string | null | undefined): string {
        if (!text) {
            return '';
        }

        let trim = text
            .replace(/<[^>]*>/g, '') // remove html tags
            .replace(/&nbsp;/g, ' ')
            .replace(/\u00A0/g, ' ')
            .replace(/\u200B/g, '')
            .replace(/\n/g, '') // remove enters
            .replace(/\t/g, '') // remove tabs
            .replace(/\r/g, '')
            .replace(/ +/g, ' ') // convert multiple spaces to single space
            .replace(/&amp;/g, '&')
            .trim();

        // remove spaces at the start and end
        trim = trim.startsWith(' ') ? trim.substring(1) : trim;
        trim = trim.endsWith(' ') ? trim.substring(0, trim.length - 1) : trim;

        return trim;
    }

    // HTML -> düz metin + normalizasyon
    static normalizeInlineText(input: string | null | undefined): string {
        return Helper.removeHtmlTags(input)
            .replace(/\u2019/g, "'") // ’ -> '
            .replace(/\u2018/g, "'")
            .replace(/\u201C|\u201D/g, '"') // “ ” -> "
            .replace(/\u00A0/g, ' ') // NBSP -> space
            .replace(/\s+/g, ' ')    // birden fazla boşluk -> tek boşluk
            .trim();
    }

// UI locator ile expected string listesini normalize ederek birebir karşılaştır
    static async expectTextsEqualNormalized(locator: Locator, expected: string[]) {
        const loc = locator.filter({visible: true});
        const count = await loc.count();
        expect(count).toBeGreaterThan(0);

        // UI metinlerini al ve normalize et
        const uiTexts = await loc.allInnerTexts();
        const normUI = uiTexts.map(t => Helper.normalizeInlineText(t));

        // expected'ı da normalize edip UI sayısına kırp
        const normExpected = expected
            .slice(0, count)
            .map(t => Helper.normalizeInlineText(t));

        expect(normUI).toEqual(normExpected);
    }


    /**
     * Convert a localized price string into a number.
     *
     * Examples:
     *  - "1.234,56 ₺"  →  1234.56
     *  - "$2,345.67"   →  2345.67
     */
    static getPrice(price?: string | null): number {
        if (!price) return 0;

        const formatted = price
            // remove thousands separators (.)
            .replace(/\./g, '')
            // convert decimal comma to dot
            .replace(/,/g, '.')
            // strip out any non‐digit/non‐dot chars
            .replace(/[^-0-9.]/g, '')
            .trim();

        return Number(formatted);
    }

    /**
     * Formats a number into Turkish Lira currency format used in the UI.
     *
     * Converts:
     *   - 1000.5 → "1.000,50 TL"
     *   - 38.7   → "38,70 TL"
     *
     * Adds a thousand separators (`.`), uses comma (`,`) for decimals,
     * and appends `" TL"` as a suffix.
     *
     * @param value - The numeric value to format
     * @param options - Options to format the value
     *
     * @returns Formatted string in TL currency style (e.g., `"4.198,88 TL"`)
     */
    static formatTL(value: number | string, options: {
        minimumFractionDigits?: number,
        maximumFractionDigits?: number
    } = {}): string {
        if (typeof value === 'string') value = this.getPrice(value);
        if (isNaN(value)) return '0,00 TL';

        return Intl.NumberFormat('tr-TR', {
            useGrouping: true,
            minimumFractionDigits: options.minimumFractionDigits ?? 0,
            maximumFractionDigits: options.maximumFractionDigits ?? 2
        }).format(value) + ' TL';
    }

    // Parses "44,50", "%44,50", "44.5" etc. -> number
    static toNumber(value: number | string): number {
        if (typeof value === 'number') return value;
        const s = value.replace('%', '').replace(/\./g, '').replace(',', '.').trim();
        return Number(s);
    }

    static formatPercent(value: number | string, options: { minimumFractionDigits?: number } = {}): string {
        const num = this.toNumber(value);
        if (!Number.isFinite(num)) return 'NaN';

        // UI: no trailing zeros, up to 2 decimals
        let formatted = new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: options.minimumFractionDigits ?? 0,
            maximumFractionDigits: 2,
        }).format(num);

        formatted = formatted.replace(/,?0+$/, '');

        return `%${formatted}`;
    }

    /**
     * Formats a number with thousands separators and 2 decimals.
     * Example: 13019.18 -> "13.019,18"
     */
    static formatNumber(value: number | string, options: {
        minimumFractionDigits?: number,
        maximumFractionDigits?: number
    } = {}): string {
        const num = this.toNumber(value);
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: options.minimumFractionDigits ?? 0,
            maximumFractionDigits: options.maximumFractionDigits ?? 2,
        }).format(num);
    }

    static zip<T, U>(a: T[], b: U[]): [T, U][] {
        const length = Math.min(a.length, b.length); // Ensure we don't go out of bounds
        const result: [T, U][] = [];

        for (let i = 0; i < length; i++) {
            result.push([a[i], b[i]]);
        }

        return result;
    }

    static createDbClient(dbName: string) {
        return new Client({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: dbName,
        });
    }

    @Step('check item redirects correctly')
    private static async checkOneItemRedirectsCorrectly(page: Page, element: Locator, expectedLink: string | null = null, openNewTab: boolean = false) {
        await Helper.scrollElementToCenter(element);

        await Helper.dismissKnownOverlays(page);
        const target = expectedLink ? null : await element.getAttribute('target');
        const href = expectedLink ?? await Helper.getElementHref(element)

        expect(href, 'Element href should not be null').not.toBeNull();

        if (target === '_blank' || openNewTab) {
            const [newPage] = await Promise.all([
                page.context().waitForEvent('page'), // wait for popup
                element.click()                      // click triggers popup
            ]);
            await newPage.waitForLoadState('domcontentloaded');
            await expect(newPage, `Expected navigation to ${href} with new tab`).toHaveURL(href!, {timeout: 7_000});
            return newPage;
        } else {
            await expect(async () => {
                try {
                    if (await element.isVisible()) await element.click();
                } finally {
                    await expect(page, `Expected navigation to ${href}`).toHaveURL(href!);
                }
            }).toPass({timeout: 21_000});
        }
    }


    @Step('dismiss known overlays (Insider, banners, etc.)')
    static async dismissKnownOverlays(page: Page, options?: { waitForStability?: boolean; settleTimeoutMs?: number; maxAttempts?: number; }) {
        const settleTimeoutMs = options?.settleTimeoutMs ?? 0;
        const maxAttempts = options?.maxAttempts ?? 5;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // 1) Check for Insider survey/dialog modal first (most aggressive)
            const insiderDialog = page.locator('[role="dialog"][aria-modal="true"], .ins-preview-wrapper').first();
            const hasDialog = (await insiderDialog.count()) > 0;

            if (hasDialog && await insiderDialog.isVisible().catch(() => false)) {
                const dialogCloseBtn = insiderDialog.locator('[id^="close-button"], [class*="close"]').first();
                if (await dialogCloseBtn.isVisible({timeout: 500}).catch(() => false)) {
                    await dialogCloseBtn.click({force: true, timeout: 1000}).catch(() => {});
                }
            }

            // 2) Overlay tıklanabiliyorsa (close-on-click) kapat
            const overlay = page.locator('#ins-frameless-overlay');
            if (await overlay.count()) {
                await overlay.click({timeout: 300}).catch(async () => {
                    // overlay click başarısızsa; sol üstten bir tık dene (close-on-click davranışı için)
                    await page.mouse.click(2, 2).catch(() => {
                    });
                });
            }

            // 3) Görünür close butonu varsa tıkla
            const closeBtn = page.locator('[class*="close-button"], .smart-banner-close-button, [id^="close-button"]').first();
            if (await closeBtn.isVisible().catch(() => false)) {
                await closeBtn.click({timeout: 500, force: true}).catch(() => {
                });
            }

            // 4) DOM'dan brute-force temizle
            await page.evaluate(() => {
                const selectors = [
                    '#ins-frameless-overlay',
                    '.ins-element-wrap',
                    '.ins-preview-wrapper',
                    '.smart-banner-close-button',
                    '[role="dialog"][aria-modal="true"]',
                    '[id^="ins-"]'
                ];
                selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => (el as HTMLElement).remove());
                });
            }).catch(() => {
            });

            // 5) Hâlâ varsa pointer-events'i iptal et + ESC
            if (await overlay.count() || await insiderDialog.count()) {
                await page.addStyleTag({
                    content: `
          #ins-frameless-overlay,
          .ins-element-wrap,
          .ins-preview-wrapper,
          .smart-banner-close-button,
          [role="dialog"][aria-modal="true"],
          [id^="ins-"] {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            opacity: 0 !important;
          }`
                }).catch(() => {
                });
                await page.keyboard.press('Escape').catch(() => {
                });
                await page.waitForTimeout(100);
            } else {
                break;
            }
        }

        if (settleTimeoutMs > 0) {
            await page.waitForTimeout(settleTimeoutMs);
        }
    }


    @Step('safe click with overlay dismiss & retry')
    static async safeClick(page: Page, target: Locator, timeout = 10_000) {
        const end = Date.now() + timeout;
        let lastError: unknown;

        while (Date.now() < end) {
            // Önce temizlik
            await Helper.dismissKnownOverlays(page);

            try {
                await target.scrollIntoViewIfNeeded();
                await target.click({timeout: 1_500});
                return;
            } catch (err) {
                lastError = err;
                // Bir nefes alıp tekrar temizlik
                await page.waitForTimeout(120);
            }
        }
        throw lastError ?? new Error('safeClick: failed after retries');
    }


    /**
     * Verilen tarih-zaman string'inden sadece saat ve dakikayı alarak "HH:mm" formatında döner.
     * Örnek:
     *  - Girdi: "2025-06-20T17:07:00"
     *  - Çıktı: "17:07"
     *
     */
    static formatHourMinute(datetime: string | null): string {
        if (!datetime) return '';
        const date = new Date(datetime);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    static compareRoundedTexts(apiValues: number[], uiTexts: string[], fractionDigits = 1) {
        const expected = apiValues.map(val =>
            val.toLocaleString('tr-TR', {
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits,
            })
        );

        const actual = uiTexts.map(text => {
            const normalized = text.replace(',', '.');
            const rounded = Number(normalized).toFixed(fractionDigits);
            return Number(rounded).toLocaleString('tr-TR', {
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits,
            });
        });

        actual.forEach((val, i) => {
            expect(val).toBe(expected[i]);
        });
    }

    static normalizeText(text: string) {
        return text
            .toLowerCase()
            .replace(/-/g, ' ')
            .normalize('NFD') // Unicode normalizasyonu
            .replace(/[\u0300-\u036f]/g, '') // aksanları kaldırır
            .replace(/ı/g, 'i') // Türkçe 'ı' -> 'i'
            .replace(/ş/g, 's')
            .replace(/ç/g, 'c')
            .replace(/ğ/g, 'g')
            .replace(/ö/g, 'o')
            .replace(/ü/g, 'u');
    }

    @Step('Scroll Element to Center')
    static async scrollElementToCenter(locator: Locator) {
        try {
            await locator.evaluate((el: HTMLElement) => {
                el.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});
            });
        } catch (e) {
            await logStep(`Element scroll failed. Error: ${e}`)
        }
    }
    static truncate = (value: unknown, max = 600) => {
        const str = String(value);
        return str.length > max ? str.slice(0, max) + '...' : str;
    };

    /**
     * Görsel URL’lerini normalize eder.
     * Örnek:
     *  - "https://mobileapp.mncdn.com/images/creditcard/xyz.png"
     *    → "/images/creditcard/xyz.png"
     *
     * @param url - Orijinal görsel URL'si
     * @returns "/images/..." ile başlayan normalized URL
     */
    static normalizeImageUrl(url: string): string {
        const idx = url.indexOf('/images/');
        return idx !== -1 ? url.substring(idx) : url;
    }

}

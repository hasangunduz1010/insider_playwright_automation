import {APIRequestContext} from "@playwright/test";
import {test} from "@core/fixture.base";
import {Step} from "@core/base.page";

/**
 * Interface representing a parsed sitemap URL entry
 */
export interface SitemapUrl {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: string;
}

/**
 * Service to fetch and parse XML sitemaps
 * Supports both regular sitemaps and sitemap index files
 */
export default class SitemapService {
    private readonly baseUrl: string;

    constructor(
        private readonly request: APIRequestContext,
        baseUrl?: string
    ) {
        this.baseUrl = baseUrl || process.env.BASE_URL || '';
    }

    /**
     * Fetch and parse the main sitemap.xml file
     * If it's a sitemap index, recursively fetches all child sitemaps
     * @param sitemapPath - Path to sitemap (default: /sitemap.xml)
     * @returns Array of page URLs from the sitemap
     */
    @Step('Fetch sitemap URLs', { logResult: false })
    async getSitemapUrls(sitemapPath: string = '/sitemap.xml'): Promise<string[]> {
        const urls: string[] = [];
        const sitemapUrl = this.baseUrl + sitemapPath;

        try {
            await test.step(`Fetching sitemap from ${sitemapUrl}`, async () => {
                const response = await this.fetchWithRetry(sitemapUrl);
                const xmlContent = await response.text();

                // Check if it's a sitemap index (contains <sitemapindex>)
                if (xmlContent.includes('<sitemapindex')) {
                    const childSitemapUrls = this.parseSitemapIndex(xmlContent);
                    await test.step(`Found sitemap index with ${childSitemapUrls.length} child sitemaps`, async () => {});

                    // Fetch each child sitemap
                    for (const childUrl of childSitemapUrls) {
                        const childUrls = await this.fetchChildSitemap(childUrl);
                        urls.push(...childUrls);
                    }
                } else {
                    // Regular sitemap
                    const parsedUrls = this.parseSitemap(xmlContent);
                    urls.push(...parsedUrls.map(u => u.loc));
                }
            });

            await test.step(`Total URLs found: ${urls.length}`, async () => {});
            return urls;

        } catch (error) {
            console.error(`Error fetching sitemap: ${error}`);
            throw error;
        }
    }

    /**
     * Fetch a URL with retry logic
     * @param url - URL to fetch
     * @param retries - Number of retries (default: 3)
     * @param delayMs - Delay between retries in ms (default: 5000)
     */
    private async fetchWithRetry(
        url: string,
        retries: number = 3,
        delayMs: number = 5000
    ): Promise<{ text: () => Promise<string>; status: () => number }> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await this.request.get(url, {
                    timeout: 60000,
                    headers: {
                        'Accept': 'application/xml, text/xml, */*'
                    }
                });

                if (response.status() >= 200 && response.status() < 300) {
                    return response;
                }

                throw new Error(`HTTP ${response.status()}`);
            } catch (error) {
                lastError = error as Error;
                console.warn(`Attempt ${attempt}/${retries} failed for ${url}: ${lastError.message}`);

                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        }

        throw lastError || new Error(`Failed to fetch ${url} after ${retries} attempts`);
    }

    /**
     * Parse a sitemap index XML and extract child sitemap URLs
     * @param xmlContent - XML content of sitemap index
     */
    private parseSitemapIndex(xmlContent: string): string[] {
        const urls: string[] = [];
        const sitemapRegex = /<sitemap>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/sitemap>/gi;
        let match;

        while ((match = sitemapRegex.exec(xmlContent)) !== null) {
            const url = this.decodeXmlEntities(match[1].trim());
            urls.push(url);
        }

        return urls;
    }

    /**
     * Fetch and parse a child sitemap
     * @param sitemapUrl - URL of the child sitemap
     */
    private async fetchChildSitemap(sitemapUrl: string): Promise<string[]> {
        const urls: string[] = [];

        try {
            await test.step(`Fetching child sitemap: ${sitemapUrl}`, async () => {
                const response = await this.fetchWithRetry(sitemapUrl);
                const xmlContent = await response.text();
                const parsedUrls = this.parseSitemap(xmlContent);
                urls.push(...parsedUrls.map(u => u.loc));
            });
        } catch (error) {
            console.warn(`Failed to fetch child sitemap ${sitemapUrl}: ${error}`);
        }

        return urls;
    }

    /**
     * Parse a sitemap XML and extract URL entries
     * @param xmlContent - XML content of sitemap
     */
    private parseSitemap(xmlContent: string): SitemapUrl[] {
        const urls: SitemapUrl[] = [];
        const urlRegex = /<url>[\s\S]*?<\/url>/gi;
        const locRegex = /<loc>(.*?)<\/loc>/i;
        const lastmodRegex = /<lastmod>(.*?)<\/lastmod>/i;
        const changefreqRegex = /<changefreq>(.*?)<\/changefreq>/i;
        const priorityRegex = /<priority>(.*?)<\/priority>/i;

        let match;
        while ((match = urlRegex.exec(xmlContent)) !== null) {
            const urlBlock = match[0];
            const locMatch = locRegex.exec(urlBlock);

            if (locMatch) {
                const entry: SitemapUrl = {
                    loc: this.decodeXmlEntities(locMatch[1].trim())
                };

                const lastmodMatch = lastmodRegex.exec(urlBlock);
                if (lastmodMatch) {
                    entry.lastmod = lastmodMatch[1].trim();
                }

                const changefreqMatch = changefreqRegex.exec(urlBlock);
                if (changefreqMatch) {
                    entry.changefreq = changefreqMatch[1].trim();
                }

                const priorityMatch = priorityRegex.exec(urlBlock);
                if (priorityMatch) {
                    entry.priority = priorityMatch[1].trim();
                }

                urls.push(entry);
            }
        }

        return urls;
    }

    /**
     * Decode XML entities in a string
     * @param str - String with XML entities
     */
    private decodeXmlEntities(str: string): string {
        return str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
    }
}


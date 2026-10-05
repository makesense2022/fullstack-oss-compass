

<!-- website-foundation:start -->
# SEO and AI discovery

Site: Fullstack OSS Compass. Production URL: **Unconfirmed; configure SITE_URL before publication. No domain has been guessed.**

Configuration lives in `site.foundation.json`. Existing titles, descriptions, metadata and structured data are retained. Missing metadata is filled from real page headings/descriptions; no reviews, facts, authors or dates are fabricated. Confirmed origins own canonicals and OG URLs; query/hash variants are not indexed independently. Static export finalization scans actual public HTML, excluding 404, private, test and preview pages. Native framework sitemap/robots routes remain the owner when present.

Generated files: `robots.txt`, `sitemap.xml` when a domain is configured, `llms.txt`, `llms-full.txt`, and `site-content-index.json`. AI files contain summaries/excerpts of the same public HTML. Private notes and unapproved content are excluded; the existing noindex/review boundary is retained. SPA modal content still needs explicit accessible URLs or prerendering to become independent search pages; no fictitious deep routes are added.

Title rule: meaningful page title + website name. Descriptions match the actual content; social tags use that same title and description. Structured data uses only WebSite/WebPage unless a project already provides a more specific accurate type. An OG WebP is available as a fallback; generated SVG/PNG sources are preserved under docs/assets.

## Google Search Console Setup

1. Add the confirmed production address as a URL-prefix property, or use DNS verification for a domain property.
2. For HTML-tag verification, copy only the token into `GOOGLE_SITE_VERIFICATION` (or the framework's public variable). A blank variable emits no extra tag. Existing verified tags are preserved.
3. Configure these values on the hosting provider when deployment is authorized.
4. After that deployment, inspect the raw homepage HTML for the verification meta tag, then click Verify in Search Console.
5. Submit the production `/sitemap.xml`; verify it and `/robots.txt` return 200.

No Search Console ownership claim, sitemap submission, indexing result, or deployment is made in this local upgrade. Manual actions are collected in Projects/site-analytics/docs/foundation/search-console-checklist.md.

## Limits and references

`llms.txt` is a discovery aid, not a guarantee of indexing or citation. Google AI features use the core SEO foundation and do not require a special AI file. Crawl accessibility, useful public text, accurate sourcing and route-specific content remain essential.

- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Search Console ownership verification](https://support.google.com/webmasters/answer/9008080)

<!-- website-foundation:end -->

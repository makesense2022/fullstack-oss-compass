# Portfolio analytics v2

Branch: codex/portfolio-analytics
Site ID: `fullstack-oss-compass`
Approved origins: none — dormant until a real production domain is verified

Source: Projects/site-analytics/client/portfolio-analytics.js. Do not edit the generated public copy directly. `window.portfolioAnalytics.track("start" | "complete" | "share" | "contact")` or an authored `data-analytics-event` attribute records only that fixed event name. Arbitrary properties are not supported. Contact clicks are wired automatically; other funnel events need product-specific, verified completion points.

PV counts visible initial pages and pathname changes, not query/hash updates. UV counts distinct random browsers, not people. Sessions are per tab with 30 min inactivity. Engagement is 30 seconds of visible page time, not comprehension. JS errors are deduplicated by type and hashed location, capped at 10 per document. No free text or raw paths leave the browser.

Deploy the collector and additive migration first, then deploy this branch. No collector or website was deployed merely by writing these files. Confirm local/preview exclusion and opt-out before release; confirm real D1 arrival after release. Existing platform analytics remain a separate source and must not be added to these totals.

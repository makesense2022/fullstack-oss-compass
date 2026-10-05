

<!-- website-foundation:start -->
# Analytics

Provider: PostHog project **Website Fleet (646771)**. Site ID: `fullstack-oss-compass`.

Production origin: **Pending: no verified production URL. Production capture stays disabled until SITE_URL is configured.**

The existing collector and native milestones are retained. `public/site-foundation.js` is the shared provider layer. Business code calls `foundation-analytics.ts`, existing `portfolioAnalytics.action`, or a declared data attribute; it never imports another SDK. SDK v1.435.9 is reused locally and loaded asynchronously. Sushi uses its existing npm SDK. No deployment has been performed by this upgrade.

## Event contract

| Event | Real trigger | Properties | Purpose |
|---|---|---|---|
| $pageview | First visible public page and pathname navigation | site_id, environment, path, page_title, source | Entry and navigation |
| content_opened | Public detail route or a product's existing content-open milestone | content_id, content_type, source | Core content consumption |
| content_completed | Existing terminal content milestone; never inferred from scrolling | content_id, duration | Actual completion |
| scroll_depth | User scroll crosses 50 or 90 percent on a scrollable page, once per route visit | percent, content_id, path | Reading depth |
| next_content_clicked | Link from a content page to another content page | from_content, to_content | Continued exploration |
| outbound_clicked | Click on an external HTTP(S) link | destination_domain, link_type | Referral or source use |
| share_clicked / share_completed | Declared share action / actual successful share callback | platform, content_id | Share intent versus success |
| internal_search | An explicit search submit or settled results callback where implemented | query_length, result_count | Search success; raw queries omitted |
| tool_started / tool_completed | Existing start or terminal tool milestones | content_id, attempt_id, duration, outcome | Tool funnel |
| game_started / game_completed / game_ended | Existing new-round and terminal gameplay milestones | content_id, attempt_id, outcome | Real game progression |
| client_error | Uncaught error, fingerprint only | error_type, signature | Runtime health |

Rows describe capabilities, not proof that every UI implements every behavior. Actual pre-existing native milestones found in this project: none; content routes, external links, scrolling, and separately documented explicit hooks provide the initial signal.



## Funnels and paths

Always filter `site_id = fullstack-oss-compass` and `environment = production`. Content: `$pageview → content_opened → scroll_depth (50) → scroll_depth (90) → next_content_clicked` or `share_completed`; completion is a separate terminal milestone where available. Tools: `$pageview → tool_started → tool_completed`, the acquisition step uses browser/session identity; compare `tool_started → tool_completed` separately with `attempt_id` held constant. Games: `$pageview → game_started → game_completed`; `game_ended` with failed/abandoned outcome is a separate branch. Use Paths to inspect native events and actual sequence; do not force the same funnel onto all products. A lack of deployed events is not a zero conversion rate.

## Environment and privacy

Production requires an ingestion key and host from environment variables and an exact confirmed origin. Localhost, previews, bots, webdriver, DNT/GPC, private paths and opt-outs are excluded. Sushi's explicit `local` mode remains available for its existing test; local events have `environment=local`. URLs exclude query/hash, sources use channel enums, and search text, form values, emails, health records, error messages and stack traces are omitted. Anonymous browser IDs are site-local. No session recording or autocapture is enabled. Query/filter and ordinary hash-anchor changes do not create duplicate pageviews; an actual configured hash router may opt into hash navigation.

## Future commerce

The adapter has dormant affiliate, CTA, signup and checkout functions. No new UI or synthetic conversion is added. `purchase_completed` must be sent only after a verified server payment webhook; there is no browser purchase-completion API.

## Validation

Build preparation emits an ignored public configuration from environment variables; finalization generates `docs/foundation-validation.json` without keys. For production acceptance after an authorized deployment, verify a real browser event arrives in PostHog, one pageview per navigation, opt-out and privacy behavior, and a real native completion. Build success alone is not ingestion proof.

Reference: [PostHog JavaScript configuration](https://posthog.com/docs/libraries/js/config).

<!-- website-foundation:end -->

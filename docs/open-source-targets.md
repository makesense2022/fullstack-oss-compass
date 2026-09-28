# Open Source Targets

Snapshot: 2026-07-08 Asia/Shanghai. Data came from GitHub public repository and issue APIs.

## First Wave

| Repo | Why it fits | First move |
| --- | --- | --- |
| [vueuse/vueuse](https://github.com/vueuse/vueuse) | TypeScript utility library, active, clear issue labels, local source already exists in this workspace. | Start with [#5314](https://github.com/vueuse/vueuse/issues/5314), [#4824](https://github.com/vueuse/vueuse/issues/4824), or [#4668](https://github.com/vueuse/vueuse/issues/4668). |
| [trpc/trpc](https://github.com/trpc/trpc) | Great bridge from frontend to backend because every change touches API contracts and TypeScript boundaries. | Start with [#6741](https://github.com/trpc/trpc/issues/6741) or [#5643](https://github.com/trpc/trpc/issues/5643). |
| [TanStack/router](https://github.com/TanStack/router) | Client-first but server-capable, with docs/examples issues that resemble real product bugs. | Start by reproducing [#7480](https://github.com/TanStack/router/issues/7480), [#7476](https://github.com/TanStack/router/issues/7476), or [#4888](https://github.com/TanStack/router/issues/4888). |
| [TanStack/query](https://github.com/TanStack/query) | Server-state expertise is high value for full-stack frontend engineers. | Start with [#9681](https://github.com/TanStack/query/issues/9681) or [#2712](https://github.com/TanStack/query/issues/2712). |
| [honojs/hono](https://github.com/honojs/hono) | Lightweight backend framework that teaches HTTP, middleware, runtime adapters, and edge/serverless behavior. | Start by writing a failing test for [#2343](https://github.com/honojs/hono/issues/2343). |

## Second Wave

| Repo | Why it matters | Caution |
| --- | --- | --- |
| [payloadcms/payload](https://github.com/payloadcms/payload) | Real product full stack: Next.js, admin UI, auth, database adapters, CMS workflows. | Larger codebase. Enter through docs, examples, or integration tests first. |
| [drizzle-team/drizzle-orm](https://github.com/drizzle-team/drizzle-orm) | SQL and TypeScript type-level design. Great for database depth. | Issue pool is large; choose only reproducible bugs with a narrow dialect. |
| [prisma/prisma](https://github.com/prisma/prisma) | Important ORM ecosystem project. Strong backend credibility if you land a PR. | Maintenance bar is high. Start with docs or reproduction work before code changes. |
| [nextauthjs/next-auth](https://github.com/nextauthjs/next-auth) | Authentication is a core full-stack skill. | Auth bugs are security-sensitive. Avoid behavior changes until you understand the threat model. |

## Selection Rules

Prefer issues where you can complete all five steps:

1. Reproduce the problem locally.
2. Point to the exact source path or docs page.
3. Add or update one focused test/example.
4. Explain compatibility risk in the PR.
5. Keep the change small enough that maintainers can review it quickly.

Avoid issues where:

- The expected behavior is still being debated.
- The issue needs access to a private service.
- The fix would require broad architecture changes.
- There are several stale PRs already attempting the same thing.

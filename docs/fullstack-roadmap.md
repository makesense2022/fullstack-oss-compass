# Full-Stack Roadmap

This roadmap assumes you are already a senior frontend engineer and want backend credibility without wasting time on toy-only learning.

## Phase 1: API And Runtime Basics

Goal: become comfortable reading and changing backend-facing TypeScript.

- Build: keep this app dependency-free and understand every line in `src/server.js`.
- Learn: HTTP status codes, headers, request body parsing, idempotency, validation, static serving.
- OSS: VueUse first PR, preferably docs, test, accessibility, or browser API behavior.
- Output: one merged PR or one high-quality maintainer response.

## Phase 2: Type-Safe API Boundary

Goal: understand how frontend code and backend contracts meet.

- Upgrade this app with a typed API layer.
- Add request validation with a schema library.
- Add tests around API behavior.
- OSS: tRPC docs/example PR or TanStack Query behavior reproduction.
- Output: one reproducible example repo or one PR with test coverage.

## Phase 3: Database And Persistence

Goal: replace JSON files with a real database.

- Add SQLite first, then Postgres.
- Model projects, tasks, issue snapshots, PR attempts, and review notes.
- Add migrations.
- Learn indexes, transactions, pagination, and query plans.
- OSS: Drizzle or Prisma docs/reproduction work.

## Phase 4: Auth And Multi-User Product Shape

Goal: understand the boring but critical full-stack surface.

- Add login.
- Add user-owned workspaces.
- Add private notes and public templates.
- Add server-side authorization checks.
- OSS: Auth.js docs or provider example work.

## Phase 5: GitHub Sync

Goal: turn this from a tracker into a useful OSS product.

- Sync repository metadata.
- Score issues by freshness, label quality, reproduction clarity, and maintainer responsiveness.
- Store snapshots so you can see stale vs active issues.
- Generate a PR readiness checklist from issue data.

## Phase 6: Public Release

Goal: make the project star-worthy.

- Publish a hosted demo.
- Write a clear README with screenshots.
- Add seed data for React, Vue, Node, database, auth, and runtime tracks.
- Add import/export for local-first users.
- Record short demos showing the workflow from issue selection to PR.

## Weekly Operating Rhythm

- Monday: pick one issue and write a reproduction plan.
- Tuesday: run the project locally and locate source paths.
- Wednesday: write or update a test/example.
- Thursday: make the smallest code/docs change.
- Friday: open PR or write a public technical note if the PR is not ready.
- Weekend: update this app with what you learned.

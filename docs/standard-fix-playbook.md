# Standard Fix Playbook

这份文档是给「人工操作 AI 写开源 PR」用的标准改法。核心目标不是一次写很多代码，而是让维护者能快速判断：你理解了问题、复现了问题、改动边界清楚、风险可控。

## 通用 SOP

### 1. Issue Intake

先不要写代码，先产出一段判断：

- 问题是否仍然存在：当前 main 分支是否可复现。
- 期望行为是否明确：如果 issue 里有争议，先评论确认。
- 改动属于哪类：docs、example、test、bug fix、API change、breaking change。
- 最小验收标准：一个测试、一个文档页面、一个示例，还是一个行为修复。

可以给 AI 的提示词：

```text
你是一个开源项目维护者视角的工程师。请阅读这个 issue 和相关源码，只输出：
1. 这个 issue 的真实问题是什么
2. 最小可接受 PR 应该改哪些文件
3. 必须补什么测试或文档
4. 哪些改法风险过高，不应该做
不要直接写代码。
```

### 2. Reproduce First

标准动作：

- 拉最新 main。
- 按贡献指南安装依赖。
- 只运行相关 package 的测试或 docs/example。
- 写下复现命令和实际结果。

PR 描述里要保留：

```text
Reproduction:
- command: ...
- before: ...
- after: ...
```

### 3. Test Before Fix

如果是 bug，先补一个失败测试。测试命名要像维护者写的，不要写成 issue 编号备忘录。

好的测试标题：

```text
it('stops observing after the first visibility change when once is true')
```

不好的测试标题：

```text
it('fixes issue 4704')
```

### 4. Minimal Change

优先级：

1. 文档/示例修正
2. 测试补充
3. 小范围行为修复
4. 新 API
5. 架构调整

前两个最容易合入。新 API 和架构调整必须先和维护者对齐。

### 5. PR Body Template

```md
## What

Fixes / improves ...

## Why

The previous behavior ...

## How

- ...
- ...

## Tests

- [x] ...

## Risk

Low / Medium / High. Existing behavior changes only when ...
```

## Issue-Specific Fix Plans

### VueUse: `useLiveAnnouncer`

Issue: [vueuse/vueuse#5314](https://github.com/vueuse/vueuse/issues/5314)

Recommended classification: docs-first or small composable PR. Because the issue is labeled documentation, confirm whether maintainers expect documentation for an existing composable or a new composable implementation.

Likely implementation shape if the composable does not exist:

- Add `packages/core/useLiveAnnouncer/index.ts`.
- Export from `packages/core/index.ts`.
- Add `packages/core/useLiveAnnouncer/index.test.ts`.
- Add `packages/core/useLiveAnnouncer/index.md`.
- Add metadata if the repo requires composable metadata generation.

Expected behavior:

- Create or reuse an offscreen live region.
- Support `polite` and `assertive`.
- Expose an `announce(message)` function.
- Avoid DOM work when `window` or `document` is unavailable.
- Clean up created nodes when scope disposes.

Test focus:

- SSR/no-document path does not throw.
- `announce('Saved')` writes the message into the live region.
- `assertive` maps to `aria-live="assertive"`.
- cleanup removes only the node created by this composable.

Risk:

- Accessibility behavior is easy to get superficially right and semantically wrong. Keep the first PR small and avoid adding timers, queues, or global state unless maintainers ask for it.

### VueUse: `refWithControl` Async `onBeforeChange`

Issue: [vueuse/vueuse#4668](https://github.com/vueuse/vueuse/issues/4668)

Relevant local files:

- `/Users/zhangjunnan/Documents/Projects/interview/source/vueuse/packages/shared/refWithControl/index.ts`
- `/Users/zhangjunnan/Documents/Projects/interview/source/vueuse/packages/shared/refWithControl/index.test.ts`
- `/Users/zhangjunnan/Documents/Projects/interview/source/vueuse/packages/shared/refWithControl/index.md`

Current behavior:

- `onBeforeChange` is synchronous.
- Returning `false` dismisses the change.
- Assignment through `ref.value = next` cannot be awaited.

Recommended standard fix:

- Do not make the normal setter secretly async.
- First comment on the issue with the API constraint: `ref.value = x` cannot expose async completion.
- Safer proposal: add an explicit async method such as `setAsync(value, triggering?)`, while preserving current sync setter behavior.

Possible test plan:

- `setAsync` waits for `onBeforeChange`.
- resolved `false` dismisses the change.
- rejected promise leaves the old value untouched and propagates the error.
- normal `ref.value = x` remains synchronous and backward compatible.

Risk:

- High if changing `value` setter semantics.
- Medium if adding a new method.
- Low if only documenting that async guards are unsupported.

### VueUse: `useElementVisibility` `once`

Issue: [vueuse/vueuse#4704](https://github.com/vueuse/vueuse/issues/4704)

Relevant local files:

- `/Users/zhangjunnan/Documents/Projects/interview/source/vueuse/packages/core/useElementVisibility/index.ts`
- `/Users/zhangjunnan/Documents/Projects/interview/source/vueuse/packages/core/useElementVisibility/index.test.ts`
- `/Users/zhangjunnan/Documents/Projects/interview/source/vueuse/packages/core/useElementVisibility/index.md`

Current suspicious pattern:

```ts
elementIsVisible.value = isIntersecting

if (once) {
  watchOnce(elementIsVisible, () => {
    stop()
  })
}
```

Why it is risky:

- The watcher is created after the value assignment.
- It may miss the first change.
- It may create repeated watchers on repeated observer callbacks.

Recommended fix shape:

- Add a failing test for `once: true`.
- Stop the observer directly after the first meaningful visibility update instead of creating a watcher inside the callback.
- Keep the existing return type unchanged.

Example test expectation:

```text
when once is true, callback receives a visibility change and stop() is called exactly once
```

Risk:

- Need to define whether "first time" means first observer callback or first actual value change. If the docs are unclear, update docs with the chosen meaning.

### tRPC: Next.js 15 App Router + React Query Example

Issue: [trpc/trpc#6741](https://github.com/trpc/trpc/issues/6741)

Recommended classification: docs/example PR.

Standard fix:

- Do not touch core runtime.
- Build a minimal local example first.
- Include current Next.js App Router conventions.
- Show server router creation, client provider, query usage, and hydration boundary if needed.
- Keep code snippets copy-pasteable.

PR contents:

- Docs page update or new example.
- One small runnable example if the repo uses examples.
- Note tested versions in the docs.

Verification:

```text
package manager install
docs build or example typecheck
example dev start
```

Risk:

- Next.js docs drift quickly. Avoid overspecifying file names that depend on canary-only APIs unless the issue explicitly asks for them.

### tRPC: Content-Type Docs

Issue: [trpc/trpc#5643](https://github.com/trpc/trpc/issues/5643)

Recommended classification: documentation PR.

Standard fix:

- Find the HTTP transport docs.
- Document which request content types are accepted.
- Document the default response content type.
- Include examples for common client calls.
- Add a short troubleshooting section for wrong content type errors.

Good PR boundary:

- Docs only.
- No runtime behavior change.
- Link existing code paths or tests in the PR description to show the docs are grounded in implementation.

### TanStack Router: StackBlitz Start Counter Example

Issue: [TanStack/router#7480](https://github.com/TanStack/router/issues/7480)

Recommended classification: example reproduction first.

Standard fix:

- Run the example locally.
- Open the StackBlitz link and compare dependency versions, scripts, and generated config.
- Identify whether the failure is caused by docs link, example package, dependency pinning, or StackBlitz environment.

PR options:

- Fix the docs link if the linked example is stale.
- Fix the example package if local reproduction fails too.
- Pin or update dependencies if only StackBlitz fails.

Risk:

- Do not patch router core until an example-level cause is ruled out.

### TanStack Router: Basepath Handling

Issue: [TanStack/router#4888](https://github.com/TanStack/router/issues/4888)

Recommended classification: tests first, docs second, core fix only if behavior is clearly wrong.

Standard fix:

- Create a tiny route tree with a configured basepath.
- Add tests for link generation, navigation, loader/action paths, and server-side entry if relevant.
- If docs currently imply unsupported behavior, fix docs instead of code.

Risk:

- Basepath bugs often cross routing, bundling, SSR, and deployment. Keep each PR focused on one observable behavior.

### Hono: `c.json(undefined)`

Issue: [honojs/hono#2343](https://github.com/honojs/hono/issues/2343)

Recommended classification: behavior clarification plus test.

Standard fix:

- First confirm expected behavior with maintainers: empty body, `null`, thrown error, or 204-style response.
- Write a focused test for the agreed behavior.
- Update docs if the behavior is surprising.

Questions to ask before coding:

```text
For `c.json(undefined)`, should Hono:
1. return an empty body,
2. serialize as `null`,
3. throw because undefined is not valid JSON,
4. or recommend `c.body(null, 204)` for no-content responses?
```

Risk:

- Medium to high. Response serialization affects many users and adapters. A test-only PR or docs clarification may be a better first contribution than changing behavior.

## AI Workflow For Each PR

Use this order when operating AI:

1. Ask AI to read the issue and source paths, then produce a plan only.
2. You review the plan and delete anything broad or speculative.
3. Ask AI to add one failing test or docs diff.
4. Run the narrow test locally.
5. Ask AI for the smallest implementation.
6. Review diff manually.
7. Ask AI to draft the PR body.
8. You rewrite the PR body in your own words.

Do not let AI:

- Change formatting across unrelated files.
- Update lockfiles unless dependency changes are necessary.
- Rewrite examples from scratch.
- Add new abstractions before a failing test exists.
- Invent expected behavior when the issue is ambiguous.

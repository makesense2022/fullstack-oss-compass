# 当前自用维护入口（2026-10-01）

继续保留原生 Node/JSON 结构，不增加数据库、账户或 SaaS。默认仅监听 127.0.0.1；原 OSS_ADMIN_KEY 接口保留。真实任务仍在 data/tasks.json，测试可用 OSS_DATA_DIR 指向独立目录；不要让两个进程同时写同一目录。

```sh
npm run check
npm test
npm run dev
```

本轮新增可编辑任务、六个流程阶段与保存反馈。任务 done 是用户自记完成，不等于真实 PR 提交/合并；阶段也是记录位置，不自动证明复现、测试或修复发生。记录命令、结果、来源和没有完成的原因，再决定是否继续。

存储修复：完整读-改-写串行化，临时文件原子替换，每次写入前在 data/history 新增原文副本；损坏 JSON 保留而不重建为空。UI 带 revision 检查旧窗口覆盖，409 保留输入供手动合并。只覆盖同进程并发，不承诺多进程锁、磁盘断电事务或无人值守备份。

恢复时先停止自己的本地写入，复制当前文件留档，选择历史副本在独立 OSS_DATA_DIR 预览验证，再手动替换；程序不自动删除历史或代替用户选择正确版本。磁盘写失败应保留当前输入并反馈，不显示已保存。

已核对 [VueUse #5314 案例](docs/cases/vueuse-5314-20261001.md)：issue 已被上游 PR 解决，停止重复提案。本机旧副本缺函数不构成当前上游 bug。其他候选、star/issue 数保留历史状态，未做全量更新。

验证：3 个自动回归、实际本地 HTTP 与浏览器新增/编辑/刷新/冲突恢复、390px 无横向溢出。合成测试数据在组合 execution/oss-fixture，未修改四条原任务。没有发布 PR 或向维护者发消息。采集仍是无正式 Origin 的 dormant 接入，不用页面 PV 评价贡献。

下面保留早期路线；数据库/鉴权/公开平台与 star 目标是历史设想，本轮维护边界以上述自用收益为准。

---

# Fullstack OSS Compass

这是一个给资深前端转全栈用的小型个人项目：用真实开源项目作为训练材料，把「找 issue、复现、写测试、改代码、开 PR、复盘」变成一个可追踪的系统。

它目前不依赖任何 npm 包，直接使用 Node.js 原生 HTTP 服务、JSON 文件持久化和浏览器端 fetch。这样第一版可以立刻跑起来，后续再逐步升级为真正的生产级全栈应用。

## 快速开始

```bash
cd /Users/zhangjunnan/Documents/Projects/fullstack-oss-compass
npm run dev
```

打开：

```text
http://localhost:4321
```

## 这个项目训练什么

- API 设计：`GET /api/projects`、`GET /api/tasks`、`POST /api/tasks`、`PATCH /api/tasks/:id`
- 数据建模：项目池、任务池、状态流转、难度和方向分类
- 前后端协作：浏览器 fetch、服务端校验、JSON 持久化
- 开源流程：候选项目筛选、issue 拆解、最小复现、测试优先、PR 描述
- 产品化思维：它可以从个人工具演进成「开源贡献机会雷达」

## 推荐路线

1. 第一周：用 VueUse 完成一个小 PR，目标是熟悉 fork、branch、test、PR review。
2. 第二到三周：用 tRPC 或 TanStack Router 完成一个文档/示例 PR，补 API 边界理解。
3. 第四到六周：用 Hono 写一个后端运行时相关复现或测试，补 HTTP、middleware、runtime。
4. 第七到十二周：把本项目升级到数据库、鉴权、GitHub API 同步、部署和可公开使用。

## 1000 star 方向

这个仓库如果要冲 1000 star，不建议只做学习笔记。更好的定位是：

> A contribution operating system for developers who use AI to contribute to serious open-source projects.

可以逐步加入：

- GitHub issue 评分：活跃度、难度、维护者反馈、是否适合 AI 辅助
- PR 准备清单：复现脚本、测试说明、风险说明、截图/录屏
- 项目知识库：贡献指南摘要、包管理器、测试命令、常见失败点
- AI prompt 模板：读源码、找调用链、生成测试、写 PR 描述
- 公开模板库：按 Vue、React、Node、DB、Auth、Runtime 分类

## 本地数据

- `data/projects.json`：当前筛出的候选开源项目
- `data/tasks.json`：你的训练任务板
- `docs/open-source-targets.md`：项目筛选结果和切入建议
- `docs/fullstack-roadmap.md`：12 周全栈升级路线
- `docs/standard-fix-playbook.md`：针对候选 issue 的标准改法和 PR 模板

<!-- website-foundation:start -->
## Google Search Console Setup

The local Analytics + SEO foundation is configured in `site.foundation.json`. See [docs/analytics.md](docs/analytics.md) for events and environment variables, and [docs/seo.md](docs/seo.md) for Google/AI SEO and ownership verification. Configure the production ingestion key/host, SITE_URL and optional GOOGLE_SITE_VERIFICATION in the hosting environment before the next authorized deployment. Existing verification methods remain intact. No deployment or Search Console action is performed by the local upgrade.
<!-- website-foundation:end -->

# Fullstack OSS Compass

这是一个给资深前端转全栈用的小型个人项目：用真实开源项目作为训练材料，把「找 issue、复现、写测试、改代码、开 PR、复盘」变成一个可追踪的系统。

它目前不依赖任何 npm 包，直接使用 Node.js 原生 HTTP 服务、JSON 文件持久化和浏览器端 fetch。这样第一版可以立刻跑起来，后续再逐步升级为真正的生产级全栈应用。

## 快速开始

```bash
cd /Users/zhangjunnan/Documents/code/fullstack-oss-compass
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

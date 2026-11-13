# CV-05 Window11 #02/08 — 东京 Agent 运行时路径漏判与定向修复

> 2026-11-13；仅记录可独立复现的东京 Preview 发布资格缺陷及最小工程修复，不重启 Railway 研究、不更改生产认证。来源 G（亲自读取 GitHub Actions Job 原始日志/本仓库源码），设计 D（白名单调整）。

## 一手证据 / 原因

1. [CV05 Agent Chat 导航 PR #1315](https://github.com/jiangxng/EVO-App-Platform/pull/1315) **已合并**，受保护 `main@0199378853a2e17fef7c8c45e7cc19a48b7e07b9`，原 HEAD `aa28a5375bf5ecee199239beb3cbd472726af9b4` 通过 **18/18 PR Checks**，Branch Hygiene [#43414446803](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43414446803) 日志确实删除该临时开发分支。
2. [东京 CI-Gated Preview #43414489235](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43414489235) 总体 SUCCESS，但 **preflight** job `131848818368` 原始输出为 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=0199378853a2e17fef7c8c45e7cc19a48b7e07b9`；对应 deploy job `131848870757` 实际为 **SKIPPED**，绝不冒称这次运行过镜像构建/发布。
3. 同 SHA 对应 merged PR 实际变更 `agents/enterprise-agent/reply-presentation.ts`，代码是运行时 Personal Agent Chat Action 消息的生产页面路径；但在 `.github/workflows/evo-tokyo-dev-deploy.yml` 第 57 行所用 `git diff --name-only HEAD^ HEAD` 的正则 **没有 `agents/`**，只有 `apps/`、`manager/`、`vendor/` 等，因此产生误判。已读实际 Workflow，而不以搜索摘要推断。
4. **历史上已由 Deploy Job 原始日志确证的东京镜像**为此前 [PR #1314 东京发布 Run #43411514038](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43411514038) 的 `ghcr.io/jiangxng/evo-app-platform:8945a50dfbe93cf553c9cee4a2f57c0867bcff2c`，不能把这当作新 live digest SSH 独立读回，也不能说 #1315 已部署。

## 本次最小决定与工程（D）

- 保留原主线验证、workflow_run 来源限制、SHA pin、15s*40 完整 CI 等待、Docker 不可变 SHA、SSH Secret、rollback、Basic Auth、东京远端健康判定逻辑，**只把 `agents/` 加入第 57 行合法运行时路径根**。工作流本身属于已有白名单，合并本修正后按原 CI-Gated Tokyo 发布本次新的真实 SHA，包含上次 #1315 的 Agent 导航成果。
- 在既有 `tests/protocol/evo-tokyo-auto-release.test.mjs` 增加清晰的反回退测试：`agents/enterprise-agent/reply-presentation.ts`、实际 chat handler 与 collection preview 都必须视作运行时变更；`docs/`、README、无关 Branch Hygiene workflow 仍不触发东京发布。
- 单独 Fix branch / Draft PR / 精确 HEAD CI / Ready / protected main 合并，保留原失败、确保 Actions 分支回收；只有真实 Deploy stdout 包括目标新 SHA 的 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS` 才能提升为 **CODE_DEPLOYED_PREVIEW**。

## 边界与接续

CV05 Chat 导航工程已合并，不重新开发。该修复不改变 Application/Agent 查询、Host/Eidos 的权限或业务语义；更不证明真人 390px、登录自然语言 Agent 完整链路。#1092 Railway Operator 与 #1212 生产 Owner 仍独立 OPEN；`N1=NOT_CERTIFIED`、CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF。并行窗口受管文件、#1184 Owner 文档、知行 #1313 部署文件都不触碰。

# PA05 / K0 工程整合候选（2026-10-22；NOT PRODUCTION SIGNOFF）

**Type:** ENGINEERING_INTEGRATION_CANDIDATE / DEV_STAGE_MAIN_MERGE_APPROVED / FULL_K0_NOT_SIGNED.
**Baseline:** `main@60ba2e31139933148dd1c6d0e5f6d713fe03dfcd`.
**Inputs:** [PR #1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) and source head `c9a3f85c06093f8e6aa0c117e616e6fe14012e6a` (Host shutdown); [PR #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) head `2b19d9f2c345a19e056884963ab7e7fcae1415b4` (PROCESS stop barrier). [PR #1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) intentionally failing old-runtime negative evidence is preserved via the closed PR, **not merged**.

## Scope and compatibility

- Take three bounded Host shutdown files from the #1074 source tree: `manager/server.ts`, `manager/host-shutdown.ts`, `tests/agent-line/pa05-host-shutdown-error-path.test.mjs`.
- Take the original 13 scoped PROCESS runtime and offline-only fixture/test files from #1082; these are separate from #1074.
- For `.github/workflows/lightweight-host.yml`, use the **current main original** including new `memory-intake-config-budget.test.mjs`, and add only the PA05 Host shutdown + J4J test step from #1074. Do **not** replace concurrent governance tests or provider code.
- Reuse existing local CI evidence and build on this combined exact-head; neither original branch's earlier green result alone proves cross-branch combination.

## Engineering pass ceiling / external signoff blockers

An isolated, directly spawned Node Host / PROCESS subprocess regression may prove bounded stop/reap/deny-new-admissions behavior, but does **not** prove production Railway PID1 to Node SIGTERM reachability, effective deployment drain/overlap, complete multi-Worker/runner/caller inventory, independently authorized external Supervisor, DBA/session absence, production IdP, credential custody, or signed centralized audit.

The [Owner issue #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) requires real and same-deployment R5-01/02 Operator receipts and authorized R5-03 external non-production Supervisor/TTL. At the time of this candidate, those remain `UNKNOWN/UNVERIFIED/BLOCKED`; complete K0, E01J4, PA05-05 E01–E05, and W06 remain **NOT_SIGNED**, production material WRITE stays **OFF**. Do not use a PR merge to claim otherwise.

**2026-10-22 开发阶段修订（Owner 明确同意）：** 项目负责人明确指示合并已通过 CI 的插件工程代码，避免长期 Draft/分支导致跨窗口重复开发；这是**工程入 main 的授权，不是正式生产安全认证**。合入前仍须与当前 main 同步、保证原有业务文件不冲突、准确 HEAD 通过 CI。当前 Railway 的 Ledger Configurator（环境名为 production）源分支为 `main`，因此合并**可能触发既有自动部署**；负责人知悉这一风险并授权继续合并。不要主动修改 Railway 配置、重启/停止其他服务、开启 material WRITE。继续独立追踪 #1092 R5-01/02/03；K0、E01J4、W06、PA05-05 仍 NOT_SIGNED。若确实触发自动部署，只能报告实际观察结果，不可把健康状态当成 K0 签收。

**Branch retirement rule:** superseded source refs #1074/#1081/#1082 may be retired only after confirming all source code/negative-evidence provenance and current SHA pins are preserved in this draft + GitHub PR history, there is no active PR using them, and a separately scoped CI deletion workflow produces actual `DELETED` logs. The active consolidated draft branch must remain until approved.

## 工程正式合入流程参考（2026-10-22）

- 合并请求：[PR #1104](https://github.com/jiangxng/EVO-App-Platform/pull/1104)；实际合并 SHA、检查与分支清理以 GitHub PR / Actions 原始记录为准，避免写死后续移动的 SHA。
- 本文原始 2026-10-22 “do not merge” 禁令已由项目负责人**限定为开发阶段允许工程合入**；不消除生产安全认证门禁，不许可正式材料 WRITE。
- 与 [PA05 阶段性工程收口记录](PA05-PHASED-ENGINEERING-CLOSEOUT-20261022.md) 的初次 Draft 快照不同，后续以本修订决定和 PR 合并状态为准，历史快照保留作审计。

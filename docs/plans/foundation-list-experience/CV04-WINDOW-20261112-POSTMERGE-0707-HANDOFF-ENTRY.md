# CV-04 / List Foundation / #05–#07 自动续跑：2026-11-12 窗口交接入口

> **交接时间：2026-11-12（香港/北京时间）。** 这是窗口退出用的简短入口；原始资料、GitHub 工作流/日志、方案取舍、失败历史与验证等级见 [详细研究与决策参考索引](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)。接续时 **先检查最新 `main`**，不要把本段记录的 SHA 当作不变的远端 HEAD。

## 一、状态和明确约束

- **仓库**：https://github.com/jiangxng/EVO-App-Platform；**准确基线分支：`main`**。截至本交接核验的受保护主线：`91356ae77df0a1af9f1993cdfc0909a1f3235f1e`（PR #1277 合并提交）；该 SHA 的 GitHub Checks **8/8 SUCCESS**，包括东京预览 `preflight/deploy`。东京实际部署日志确认 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=91356ae77df0a1af9f1993cdfc0909a1f3235f1e`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`。这是**镜像/认证边界健康**，不是 EXPORT 产品验收。
- 用户明确要求：**持续实际开发**，不逐步请人审批普通工程 PR；维护独立分支、Draft PR、精确 HEAD CI 全绿后 Ready→合并受保护 `main`，再核对主线、东京及 Branch Hygiene；不要直接 push main；不覆盖其他窗口并行开发；交接资料/原始引用必须可复用；Human 与 Personal Agent 共用真实 Owner/权限/企业隔离；保持现有 Eidos+Platform，不另起列表框架。
- **安全结论**：独立跨页 EXPORT 功能虽然已拥有 Domain Owner / 加密 PG CAS / 审计 / 测试级 Host 权限描述符 / 签名 PG 隔离网关 / 物理角色 / 到期清理源码，**正式 `manager/server.ts`、`catalog/seed.ts` 仍未注册 EXPORT Job Operation**。没有生产上可用的全量导出；无法把隔离 PG 实验写成真实 PA05/T0 Host 签名准入或 Google/OIDC 人工验收。
- CV-03 **`N1=NOT_CERTIFIED`，`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`**，正式 SAVE POST 403 / 未注册 GET 404 继续保持；并行 **PR #1184 尚未合并**，不编辑其受管计划文件。

## 二、本窗口实际完成的工程与证据

| 交付 | 准确 PR / 受保护 main 合并 SHA | 已核验及限制 |
|---|---|---|
| 独立 PG 原子不可变审计、SQL 低权限角色拒绝（#05） | [#1272](https://github.com/jiangxng/EVO-App-Platform/pull/1272) → `72989d259054df293dbe9ee2678e20be20ad187a` | 真实 PG 审计 **5/5**，加密 PG **5/5**，原 Owner **8/8**；数据库 trigger 同事务追加元数据审计。DB owner 仍可绕过，非生产 WORM |
| Dictionary 独立 `dictionary.export` Host Capability 受控装载（#05） | [#1273](https://github.com/jiangxng/EVO-App-Platform/pull/1273) → `98c32b63d2912b3bef997288093c8fd45ef30e98` | 仅测试时装载 Manager/Capability Fabric/ActionRouter+真实 Domain Owner；Host 专项 **4/4**，Owner+预算 **15/15**；READ 不升权、Human/AI parity、撤权、停用、跨企业拒绝；**未登记正式产品 Operation** |
| 独立物理 Host/Worker SQL 身份、一次性 permit、租约 Epoch（#06） | [#1275](https://github.com/jiangxng/EVO-App-Platform/pull/1275) → `5a65e949b6c2a32d3f86a55635a15c070e2c6ab0` | PostgreSQL16 **4/4**，已有 PG **10/10**；不同低权限 LOGIN、重放/过期/争抢/撤权拒绝。**只围住调度许可，原 Owner CAS 尚未与该 Epoch 强绑定** |
| 并行窗口的独立签名 SQL Export gateway（在本窗口期间协调核验，非本窗口独占开发） | [#1274](https://github.com/jiangxng/EVO-App-Platform/pull/1274) → `9ca4182c23ab761e08462e3f349b73780697aee5` | 在可见主线读取了源码/测试/方案。隔离 HMAC、AUTH mirror epoch、nonce、SQL EXECUTE-only 运行角色、worker lease/TTL 状态约束。**该镜像不是生产 PA05/T0 权威**；不要重复开发另一套 signed gateway |
| Host-only 到期任务发现 + 主动逻辑 TTL 清理（#07） | 冲突旧 [#1276](https://github.com/jiangxng/EVO-App-Platform/pull/1276) **CLOSED/未合并** → 迁移新 [#1277](https://github.com/jiangxng/EVO-App-Platform/pull/1277) → `91356ae77df0a1af9f1993cdfc0909a1f3235f1e` | 新基线真实 PG **4/4**、旧 PG **14/14**、Owner **8/8**；到期 READY/QUEUED 经 Host SQL due() 范围查询、先 revoke 再加密 CAS 写 `EXPIRED`，CSV/pages 不再留在**当前逻辑记录**，独立审计恰一次。**无实际生产定时调度、无 WAL/备份安全擦除** |

### 合并后主线证据

- `main@91356ae77df0a1af9f1993cdfc0909a1f3235f1e` 的 GitHub check-runs 共 **8 项 SUCCESS**：[PR #1277](https://github.com/jiangxng/EVO-App-Platform/pull/1277)、[主线 PG TTL](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177415445)、[主线 Host/Worker Lease](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177415372)、[原 Eidos Chromium CSV](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177415468)、[Lightweight Host](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177415361)、[Continuity](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177415464)；签名 PG 保持原单独协议，不能因这些 checks 推断真实正式 Host 上线。
- [东京预览](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177445714) `preflight`/ `deploy` SUCCESS（部署 job `131046056600`）；[Branch Hygiene](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43177416954) 原始日志：`DELETED_VERIFIED_MERGED_PR_BRANCH feat/cv04-export-pg-active-expiry-main-reconciled-20261112 @ 85fa44828495f9191bd833fd21a00d73e45634d8`。
- **尚未清理、不得误报**：关闭但未合并的 #1276 旧分支 `feat/cv04-export-pg-active-expiry-maintenance-20261112` 仍指向 `8ffd6efa3a327417d2d0a147cf78a93d5084c3c0`。本窗口没有对这个**非祖先/存在冲突**分支强行删除；需先做内容等价与不再被引用的 SHA-safe 核查。#1277 重建分支已自动删除。
- #1276 失败经验：TypeScript `found.revision` 可空静态报错；新 SQL due() 函数误用 `$…$` 而非 `$$…$$`；另窗口 #1274 改动相同 README 造成旧分支 `mergeable_state=dirty`。已重新从并行合并后的最新 main 移植，**不要再次合并旧 #1276**。

## 三、下一窗口优先任务

1. 先核验 `main` / PR #1274/#1275/#1277 状态、主线 8/8、东京部署和分支清理。再读 [详细资料索引](CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)，不要重新实现已有 PG gateway/Owner。
2. 在**未发布**的现有平台体系内，规划或实施受信任 Host 授权事件 → PA05/T0 账户/企业/插件撤权/Actor 分离 → SQL 签名者与 DB authority epoch 的真实可审计同步；SQL Owner CAS 需接受真正的签名准入/租约 Epoch 和停机围栏；避免把测试管理连接或 Worker 临时 Token 升级为生产写入许可。
3. 将 TTL `cleanup()` 与受管多 Worker 调度、心跳/重试、SQL least-privilege Owner、租约中断、真实物理多 Host 和失败清理验收衔接；引入符合保留规则的 Key/KMS/备份/WAL 处理；在完成后才考虑注册正式 `dictionary.export` Host Operation 和 Eidos/Personal Agent 下载。
4. 保留真实双主体 Human/Personal Agent、企业切换/撤权、手机浏览器和端到端外部 Agent Tool 验收；Owner 门禁通过前 **继续不开生产 EXPORT，也不改变 CV-03 SAVE**。对旧 #1276 分支只做有据可循的安全清理。

**研究来源边界**：本窗口未访问新的第三方技术文章、官方文档或外网搜索摘要；资料均来自 GitHub 源码原文、PR 状态、Actions 作业日志。截图未制作或保存。任何“生产已认证/外部资料已读”的说法均不成立。

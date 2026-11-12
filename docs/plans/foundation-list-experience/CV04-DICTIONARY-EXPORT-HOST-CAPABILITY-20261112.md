# CV-04 / 2026-11-12 — Dictionary EXPORT 独立 Host Capability 受控装载纵切

> 状态：**STAGING_DESCRIPTOR_AND_REAL_OWNER_ROUTER_TEST / NOT_IN_LIVE_HOST**。继承 [PG 不可变审计纵切](CV04-PG-IMMUTABLE-EXPORT-AUDIT-20261112.md)及[PG 加密任务](CV04-ENCRYPTED-POSTGRES-EXPORT-JOB-20261112.md)。这里复用真实现有 `Manager + Capability Fabric + ActionRouter + Dictionary Owner` 代码，不重造业务页面或权限系统。

## 操作和授权选择

[分离的三项 Capability Operation 描述符](../../../apps/business-dictionary/export-capability.ts)，**仅隔离测试 fixture 动态装载，不进入正式 `catalog/seed.ts` 和 `manager/server.ts`**：

| 操作 | 业务效果 | Host 资源授权 | 受众 | 必要保护 |
|---|---|---|---|---|
| `dictionary.collection.export.job.request` | WRITE：申请任务 | **`dictionary.export`**，`business-dictionary.definition`，企业 DATA_SCOPE | HUMAN + PERSONAL_AGENT | HOST_REQUIRED idempotency、HOST_REQUIRED receipt |
| `dictionary.collection.export.job.status` | READ：检查任务 | **`dictionary.export`**，相同资源/企业 | HUMAN + PERSONAL_AGENT | Owner 限定原 User/Actor/Enterprise Job |
| `dictionary.collection.export.job.download` | READ：领取文件 | **`dictionary.export`**，相同资源/企业 | HUMAN + PERSONAL_AGENT | Owner 下载前重验、持久审计、取文件预算 |

显式排除 `EXTERNAL_AGENT` 和任何 READ→EXPORT 权限继承；暴露前必须有单独 grant。原有当前页 CSV 仍是小边界 READ，**与后台全量导出权限无关**。这并非生产 Capability Operation 发布；`REQUEST` 的 HOST_REQUIRED 写安全只是契约声明，不代表实际正式 Host 已可签出生产 receipt。

## 行为由谁负责

- **Host Runtime（现有代码）**：[Manager lifecycle](../../../manager/service.ts) 判断插件/Feature 是否 active；[Capability 授权与发现](../../../manager/capability-operation-access.ts) 对每个请求 Actor + 企业 scope + 独立 EXPORT Action 实时检查；[ActionRouter](../../../actions/router.ts) 在调用业务 Owner 前阻断非法操作。
- **Domain Owner（现有代码）**：[Dictionary Export Owner](../../../apps/business-dictionary/export-jobs.ts) 仍在内部重检独立 `dictionary.export`、成员关系和插件启用；维护任务幂等、快照、审计、TTL 和最终下载。客户端请求不提供可信 Principal/SQL Token/企业授权的替身字段。
- **数据库（此前实现）**：隔离 PostgreSQL 加密存储 + 原子审计触发器 + 受限 SQL 登录拒绝；*仍未得到* 生产 Host→DB admission 签名和真实 SQL 角色/RLS、KMS 认证。

## 可机器验收清单

[隔离真实 Manager/ActionRouter/Owner 协议测试](../../../tests/protocol/cv04-dictionary-export-host-capability.test.mjs) 应证实：

1. 三项 Capability Operation 的授权 action 全部是 `dictionary.export`；请求任务声明 HOST_REQUIRED 写安全；发现阶段有 `dictionary.read` 但没有 EXPORT 时三项全部隐藏。
2. 显式允许同一个 Member 的 Human/Personal Agent 后，双方发现能力一致，合法请求进入原 Owner，完成的 CSV 字节一致；企业 B 和 External Agent 被拒绝。
3. 已完成任务在 Host EXPORT 授权撤销时被 PreExecute 阻断，不进入 Owner Handler；活跃企业关系撤销后由 Owner 拒绝下载；插件 Manager disable 后 Router 返回 `ACTION_FEATURE_NOT_ACTIVE`。
4. 缺请求上下文、错误输入版本、外国企业、Provider down 全部拒绝；客户端附加字段不能篡改真实 Host Context/Principal。测试使用本机隔离身份和真实 Memory Owner，**不是东京真 Google/OIDC 登录**。
5. CI 复跑原 Owner 8/8 + 跨页安全预算 7/7，并确认正式 `manager/server.ts` 和 `catalog/seed.ts` **没有注册任何新导出命令**。全项目 CI/Lightweight Host/Chromium 继续依旧门禁。

## 生产未决与下一段

- 正式 Function 注册前先完成独立受控 PostgreSQL SQL gateway/Role-bound Host 签名、密钥密封与轮换、可证明的不可删审计流水、Worker 多实例抢占与幂等恢复、download-at-time-of-use grant 复核。
- 将 staging descriptor 与原 Dictionary Owner ActionHandler 真正接进 Host（但仅在认证准入可用后），使用两个真实不同用户和 Agent 的可信 Session，在跨企业撤权/停用插件下验收；本次 Manager fixture **不能代替**外部 OIDC+PA05 或真实企业成员审批。
- 上线 Human / Mobile Eidos 和 Personal Agent 业务操作之前需真实授权方最终放行、审计与数据保留验收；并行 PR #1184 受管文件不碰。
- CV-03 N1 继续 `NOT_CERTIFIED`，生产 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、SAVE POST 403 / unregistered GET 404，严格不因为此纵切自动打开。

来源：2026-11-12 直接查阅的现有 Manager、Capability Fabric、ActionRouter、字典 Owner、原 PG 审计源文件及前序真实 Actions 日志。未新增外部研究来源；专项测试 PASS 必须以最终精确 HEAD GitHub Actions 原始日志核实。

# A05 会话用途与 A04 成员服务打包决定

日期：2026-10-14。核对 main 基线：`5b6cbf8d4d64ba5b4d8d4e97002f6185455f1ef6`。首次批次只修改用途说明及审查结论。2026-10-15 的请求认证回退整改见下节，原决策及历史证据保留。

## 2026-10-15 增量：已配置认证不得静默降级

核对 main `b3ae61d1c7c70e1731ddba74daa7ddcdd6fbd72a`，分支 `fix/governance-session-fallback-20261015`。只修正 Host 请求会话解析；不更换登录供应商、不修改生产配置、不接管 Agent 实现。

**发现：** `resolveRequestIdentitySession` 在有效请求 Provider 数量为零时无条件调用静态/本地身份解析。托管登录或 Bearer 服务已经配置，但其 Feature 被停用后，无凭据请求可能获得演示身份。这与已选定请求 Provider 后凭据无效就拒绝的逻辑不一致。

**本批修正：** 有下列任一明确配置时，无有效请求 Provider 返回既有 `REQUEST_IDENTITY_SESSION_PROVIDER_UNAVAILABLE`，经既有映射成为 HTTP 503 / AUTHENTICATION_UNAVAILABLE，不调用演示身份回退：

- APP_PLATFORM_MANAGED_SESSION_ENABLED=true；
- APP_PLATFORM_BEARER_SESSIONS_JSON 已成功解析，包括显式空 sessions；
- identity.session.request 存在 SYSTEM 或当前 default INSTALLATION 显式绑定。

仍存在请求 Provider 时，复用原候选/绑定/健康/凭据解析：没有或无效凭据继续返回 401；配置和身份错误不变成其他用户。未声明请求认证的旧演示配置仍保留原静态/本地身份，不依据 NODE_ENV 猜测部署用途，也不强制更改三包的安装状态。

### 验收与局限

真实本地 Host 子进程使用独立临时状态、隔离环境及禁止出站网络的既有 probe：验证托管/Bearer 正常无凭据拒绝、Bearer 有效凭据可用、停用状态重启后 503、不泄露回退主体、重新激活后恢复；同时验证未配置演示模式仍可用，显式绑定不存在的服务时拒绝回退。停用/恢复通过持久状态夹具模拟，不声称完成插件管理 UI 或生产登录验收。

测试沿用 `tests/integration/startup-defaults-restart.test.mjs`，由既有 Lightweight Host CI 执行；配合托管会话、个人上下文、Provider 解析回归。首次测试误把仅托管模式开放的 /auth/session 用于 Bearer/演示（实际返回 404）；已改用这两种模式真实的 /v1/contexts/effective 路径，没有修改产品路由来迎合测试。

**A05 仍为部分完成：** 已修复“配置仍在但服务消失”的降级缺口；未建设全面正式环境模式或配置迁移门禁。没有上述配置的自定义请求 Provider 被移除、进程内非 HTTP 兼容调用等仍需专项核对；不能将本次修复表述为所有认证入口均已审计。未审计线上安装、秘密或生产绑定。总表仍为 7 项 / 4 项闭环 / 3 项部分完成。

### 方案及阅读证据

| 方案 | 决定及理由 |
|---|---|
| 服务缺失继续静态回退 | 排除：服务停用不应扩大匿名访问权限 |
| 按已有配置判定必须请求认证 | 采用：保持原身份/绑定合同，小范围修复可验证缺陷 |
| 依 NODE_ENV 自动禁用所有演示或删除旧包 | 本批不采用：不能从运行标签推断已完成部署迁移，也不必重建认证框架 |

本次无新增外网研究。已读平台原文：server.ts 的 resolveRequestIdentitySession/resolveIdentitySession、条件安装、/auth/session 与 /v1/contexts/effective 及错误响应；request-authentication.ts 的 401/503 映射；request-session/runtime.ts 的令牌目录解析和校验；provider-resolution.ts 的候选与绑定；既有真实 Host 重启测试及网络隔离 probe。来源固定在上述 main 提交；方案选择是工程判断，函数行为与测试输出是证据。

本地构建与 25 项相关测试通过，轻量 Host 门禁保持 297 条历史边、无新增。准确 PR、最终提交及 CI 以本分支 PR 为准；本地和远端分支清理分别记录。

## A05：三种会话是身份来源，不是三种 Agent

| 包 | 本轮确定用途 | 当前代码事实 |
|---|---|---|
| host-static-session-provider | 开发、受控演示；不作为正式用户登录方案 | identity.session；由 APP_PLATFORM_STATIC_SESSION_JSON 提供固定身份 |
| host-bearer-session-provider | 预配置令牌的受控集成及旧系统兼容 | identity.session.request；验证配置内 Bearer token 和有效期，不管理正常登录的签发/撤销生命周期 |
| host-managed-session-provider | 正常登录的推荐默认方案 | identity.session.request；读取托管会话服务，支持 Cookie/sessionToken 和 Bearer；两种凭据冲突时拒绝 |

这三个包不负责划分个人、任务、企业 Agent 上下文。可信身份解析之后，企业目录与访问授权决定可进入哪些上下文；角色和具体业务权限另外检查。

### 推荐默认不等于当前无条件启用

已核对 `manager/server.ts`：
- managedSessionEnabled 由 APP_PLATFORM_MANAGED_SESSION_ENABLED 显式开启；未安装时按配置安装。
- Bearer 与静态服务分别在相应预配置存在时按条件安装；不因推荐托管就自动卸载旧服务。
- `resolveRequestIdentitySession` 先解析有效请求会话 Provider；多个候选需按 `provider-resolution.ts` 的绑定机制选择，否则歧义报错，不是按安装顺序选第一个。
- 已选定请求 Provider 但凭据无效时抛错，不退回静态身份。
- **没有任何请求会话 Provider 时**会进入 `resolveIdentitySession`；若静态 Provider 也没有，仍有 `host.compatibility-local` 身份回退。这是现有兼容行为，不是正式多用户登录的安全保证。
- `manager/startup-defaults.ts` 的 minimal 模式要求 managedSessionEnabled；默认启动 profile 仍是 compatible。本次没有改为强制生产模式。

正式环境若另行迁移，应核对实际安装、有效 Feature、请求会话绑定及无凭据拒绝行为，再退役兼容回退。不能仅添加用途文案就声称正式认证已经全面收敛；本窗口未读取线上配置或秘密。

## A04：本轮明确保留两包，不实施合包

这是对早期“默认打包收敛候选”的最终本轮决定，取代自动推进合包的建议。

| 判断依据 | 访问授权 Grant | 成员关系 Relationship |
|---|---|---|
| 契约 | enterprise.membership / evo.enterprise.context-grant | enterprise.relationship |
| 回答的问题 | 该主体获准进入哪些企业上下文 | 该主体是什么成员角色、企业有哪些有效成员 |
| 来源 | 预配置 grants 加治理 store 的动态 grants | 治理 store 的 relationships |
| 消费方式 | principalContextSources、上下文范围/外部授权等 | OWNER/ADMIN 判断及企业治理等 |
| 替换与绑定 | 按自身 capability 独立解析 | 按自身 capability 独立解析 |

两个薄适配共享治理 store，但不是两份相同算法；Relationship provider 本身主要查询有效关系，邀请/退出等变更由治理功能负责。本批据此修正卡片说明，避免把读取适配器介绍成完整管理应用。

采用保留分包的理由：现有契约和消费者不同；合包需要处理旧 packageId、Feature、Provider 绑定、安装状态和部署配置，静态代码不足以证明迁移收益。保留两个包可直接复用现有授权测试，且不会影响登录和成员访问。

排除立即合包：没有真实替换/部署清单和明确用户成本证据；减少两个卡片不是迁移权限基础设施的充分理由。也排除将两个接口合为一套权限规则：成员关系不等于每项业务操作的授权。

以后只有取得真实运维负担、替换需求、配置迁移及回滚证据时再立独立任务。此事项不再作为本轮未完成步骤，也不声明“永久不能合包”。

## 阅读证据及验证范围

- 已读完整短实现：`providers/managed-session/runtime.ts`、`providers/request-session/runtime.ts`、`providers/enterprise-context-grant/runtime.ts`、`providers/enterprise-relationship/runtime.ts`、`manager/startup-defaults.ts`。
- 已读相关声明/函数：五个包的 package.ts；server.ts 的条件安装、resolveIdentitySession、resolveRequestIdentitySession、principalContextSources、两种成员 Provider 解析；provider-resolution 的候选、绑定及健康拒绝。
- 沿用既有 managed-request-session、person-first-context、principal-grants、enterprise-relationship-lifecycle、provider-resolution、startup-defaults 与插件多语言说明测试。不新增只验证文案逐字相等的测试。
- 无新增外部资料，无线上认证验收，无远端仓库推测。用途说明中文均不超过 50 字，其他语言沿用中文 fallback。

本地验证：构建通过；上述 7 个测试文件共 43/43 通过；轻量 Host 门禁通过（297 条历史边），continuity:validate 通过。

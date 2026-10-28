# EVO 轻插件平台：新环境零默认业务安装、企业上下文后关联（2026-10-28）

> **决策**：用户明确要求“不默认安装业务插件”，并确认“先安装插件、后创建企业上下文也能使用”。范围为 EVO App Platform 的 Host bootstrap 规则；不改变企业资源权限与服务契约。**未上线、未对东京现有安装记录执行停用**。仓库及远端数据必须安全保留。

## 已读源码与证据等级

- P1 已读 [manager/startup-defaults.ts](../../manager/startup-defaults.ts)：旧无配置启动采用 compatible，自动安装任务是一次性 Host 账本。
- P1 已读 [manager/server.ts](../../manager/server.ts)：Host 在 startupProfile 为 compatible 时调用 `installBusinessDefaultOnce`，会安装 Counterparty、Data Import、Object Extension 等可用业务 Feature。其他 Host-owned 基础能力在单独治理路径装载，与业务默认包不同。
- P1 已读 [manager/store.ts](../../manager/store.ts)：Lifecycle 读取 `installedPackages` 与 `activeFeatures`，东京 `APP_PLATFORM_STATE_FILE=/data/platform-state.json` 位于 `evo-data` 持久卷，**不是 PostgreSQL**。PostgreSQL 用于本部署的会话/对话等指定 authority。不要手改持久记录。
- P1 已读 [apps/counterparty/package.ts](../../apps/counterparty/package.ts)：Counterparty Feature `activationScope: INSTALLATION`；[manager/server.ts](../../manager/server.ts) 业务页面在每次请求里用当前已选择的 Enterprise Context 解析 `contextId`，缺上下文返回 409，不将企业写死在插件安装记录中。
- P1 已读 [manager/desktop-workbench-runtime.ts](../../manager/desktop-workbench-runtime.ts)：顶部企业选择器从 `/v1/contexts/effective` 查询当前 Principal 可访问企业，后来创建的企业可通过刷新选择器进入。未授权企业不会被自动加入。
- P1 已读 [apps/enterprise-context-governance/README.md](../../apps/enterprise-context-governance/README.md) 与 [治理插件架构](../architecture/ENTERPRISE-CONTEXT-GOVERNANCE-EXPERIENCE-PLUGIN-v0.1.md)：Enterprise Context Governance 是可以从插件商店安装的管理 Experience，需 enterprise.directory、authorization.check 能力，创建 Context 后可在目录进入企业。企业事实独立于管理插件存储，不受该 UI 卸载影响。

## 本次修复与选择

1. Host 无 `APP_PLATFORM_STARTUP_PROFILE` 时默认选择 `clean`，不自动安装可选业务插件；旧 compatible profile 只有明确配置时才自动安装，保留遗留兼容行为；minimal 仍须 managed session，避免意外改变认证/PA05 治理边界。
2. 东京 Compose 明确写入 `APP_PLATFORM_STARTUP_PROFILE: clean`，使部署意图可见和长期可核验。
3. 用户明确配置的 Host Provider/能力（explicit=true）仍可按政策启用，不等价于自动安装业务菜单；不得关闭 Host 运行必要基础能力。
4. **已有的东京安装记录不会因换 profile 自动停用/删除**。上线前后要单独核验 `platform-state.json` 的 installed/active 来源，只允许通过受控 Plugin Lifecycle disable（可恢复）清理已证实的历史“自动安装”业务插件；绝不删除卷、直接修改 JSON 或重置默认日志。
5. 先安装业务插件后创建企业：插件属于平台安装层，Enterprise Context 属于业务授权/数据层。用户在企业管理界面创建或关联企业，选择顶部当前企业后，同一个 Counterparty 客户管理插件按当前企业上下文读取本企业资源。**不需要重复安装**、也不自动混合 A/B 企业的数据。
6. 需要专属外部后端 Provider 或 Enterprise Application Runtime Binding 的插件，须单独显示“该企业尚未配置服务/连接”，由授权管理员配置；**不要把当前企业选择等同于所有业务后端已就绪**。

## 验收（不同里程碑）

| 门禁 | 本 PR 提交时状态 |
| --- | --- |
| 源码修复及 targeted tests | 已提交，CI 待验证 |
| 无插件新卷启动，应用导航为空 | 待运行真实 clean Host |
| 人工安装业务插件后出现贡献 | 待 Human + 运行验证 |
| 后创建企业、选中后原插件可用、两个企业数据隔离 | 源码逻辑已核实；实际端到端仍待验收 |
| 东京已有卷自动业务插件安全停用 | **未执行**，需审计及可逆计划 |
| 合并 main、东京 SHA 发布、公网/Human | **未进行** |
| 旧 Railway、PA05/BEX/Eidos/EC | 不修改 |

回滚要求：恢复原启动配置仅影响未来自动安装策略，不能自动清理历史包；已安装业务插件独立保留。不要将 PR 的 CI PASS 冒充线上无菜单验收。

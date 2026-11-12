# CV-03 / N1-05c-12 — 运行中 Provider 候选和绑定 GET 只读验证（不认证）

> 2026-11-12，开发基线 `main@e500bfef3415c8fea8c456e91b7d59ae254b6f29`。继承 [生产切换 Owner 契约](CV03-N105C10-PRODUCTION-AUTHORITY-CUTOVER-OWNER-CONTRACT-20261112.md)、[运行中 Host + SQL 原库目录证据](CV03-N105C11-TOKYO-LIVE-HOST-AUTHORITY-AND-ORIGINAL-DB-READONLY-20261112.md) 和 [N1-05c-09 拒绝发布门禁](CV03-N105C-09-OWNER-RELEASE-EVIDENCE-GATE-20261111.md)。这是尚未执行的目标证据及可复现方法；**不能因 PR 通过就标注物理 PASS**。主线实际 Actions 和原始日志取得后，另记录准确 run/job/终端 marker。
>
> 方案 A 不变：单 Saved View Feature 的 PA05 Lifecycle + AuthorizationProvider + `authority_epoch` / `source_generation` / immutable Outbox 必须共享**真正 PG ACID T0**。`N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、Saved View POST 403、未注册 GET 404 不变。

## G / 已从 main 原始源码直接验证（2026-11-12）

- [`manager/server.ts`](../../../manager/server.ts) 路由 `GET /v1/providers/effective?capability=authorization.check` 使用**运行中的** `manager.listEffectiveServiceProviders(capability)`，而 `GET /v1/providers/bindings?capability=authorization.check` 读取**当前进程**的 `providerBindings.list(capability)`。都不是 POST 或授权写操作。运行进程内响应比 N1-05c-11 的离线 snapshot/binding 文件计数更直接，但**仍不是一次 `AuthorizationProvider.check()` 决策证据**。
- [`manager/service.ts`](../../../manager/service.ts) 的有效 Service Provider 列表由真正的活跃 Feature 与 Catalog contribution 推导；[`providers/authorization/package.ts`](../../../providers/authorization/package.ts) 内建静态候选 `host.static-authorization`，Feature `host-static-authorization-provider.default`，Capability `authorization.check`。
- [`manager/provider-resolution.ts`](../../../manager/provider-resolution.ts) 还会考虑 Provider Runtime Registry、health、具体 binding scope 和唯一候选。**本 GET 检查没有执行这一完整 resolver 的 Host request-path**；一个静态候选只说明可见 topology，不能证实真实持久 PG 授权源或 signature。
- 上一 [N1-05c-11 Tokyo protected-main #43141987143](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43141987143) 已在原始日志中读取运行中**文件**：Static Feature 活跃、Authorization binding count 0、Saved View Feature 不活跃；当前测试补充**实时 Host GET 的交叉证据**，不重做 QA PG、SCRAM、HBA、Outbox 或原库 ACL。
- [`cv03-n105c11-tokyo-live-authority-readonly.yml`](../../../.github/workflows/cv03-n105c11-tokyo-live-authority-readonly.yml) 仅新增这一**同一 main-only live Job** 的非写 GET 片段，并加入 PR 期 Node/Bash 语法约束；沿用现有 Tokyo Environment 固定 SSH 和真实运行容器。脚本只输出已知候选计数和 PASS/UNVERIFIABLE 标记，**不打印原始 Provider JSON、策略、subject、enterprise、凭据**。若运行环境 Provider identity 或绑定数量发生改变，**FAIL** 交给真实 Owner 复核，不自行替换允许名单。

## 验收必须区分三层

| 层级 | 可判定的最窄事实 | 仍未证明 |
| --- | --- | --- |
| PR 语法 / exact HEAD CI | GET 探针是源代码上受约束的只读 Shell/Node；原有 Host/PG job 不变 | 运行的 Tokyo Host 实际是否提供两个 GET |
| protected-main physical Job terminal + 原始日志 | 本次实际运行 Host 同时报告一名已知静态 Authorization Provider **有效候选**和 0 个特定 Capability binding；若不一致红灯 | 动态 Provider Resolver **真实返回结果、用户/Agent 最终授权判定、完整 Scope / epoch / signed Host** |
| 独立 Owner 签收 + 正式授权 T0 / 多物理 Host | 才可能继续上线单 Saved View Feature 的最小接线 | 不能由本工具替代审批或开放 SAVE |

## 风险 / 故障关闭与后续

1. 正式运行中预览实例可能滞后最新 main；`.last-health-pass-sha` 需和源提交分别报告，不把 protected-main workflow 源视作已经部署新镜像。
2. 本探针不使用业务数据、SQL DML/DDL、Host 插件 activation、Policy check、更不调用 SAVE；不应解释为新生产 Provider、授权迁移或正式登录测试。
3. [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 仍等待 PA05、AuthorizationProvider、DB、Security/Ops、Domain Owner 的**真实独立批准**、PG schema/SQL Producer/KMS 和完整 Scope snapshot/rollback。并行 [PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) Owner 受管文件不变。
4. 若本探针真实成功，下一任务不是再造 synthetic QA，而是由真实 Owner 选定正式 Provider ID、policy persistence、source generation、DB role/schema 及最小接线和两物理 Host 故障矩阵。未签署时所有生产运行时变更仍阻塞。

### 来源访问等级

- **G 本轮已读正式源码**：`manager/server.ts` GET routes / resolveAuthorizationProvider 相关段，`manager/service.ts` listEffectiveServiceProviders，`manager/provider-resolution.ts`、`providers/authorization/package.ts`、N1-05c-11 已归档文件原文及原只读 workflow，2026-11-12。
- **历史已有 G，本轮未重读物理日志**：N1-05c-11 Tokyo #43141987143 的原始日志已由上一 PR 文档归档；本次不升级其证据等级。
- **P 尚未取得**：此次修改后的真实 main-only GET job 日志、独立 Owner 批准、持久生产 Provider 和真实 SQL Producer/KMS。没有新增外部网页；历史参考 URLs 不重新标为“已读原文”。

## G / 2026-11-12 受保护 main 实际 Host GET 验收和清理（非生产认证）

- [PR #1256](https://github.com/jiangxng/EVO-App-Platform/pull/1256) 精确最终 HEAD `fde27035b868c52112e3445052552c6cd6d30d00`，PR 阶段 **5 SUCCESS**（source syntax、Human UI、Lightweight Host、两次 Continuity）和 **1 SKIPPED**（main-only physical）。首次源语法检查曾 FAIL（[`#43144000676`](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43144000676)），原始日志表明检查脚本定位 `HOST_RUNTIME` 时误命中自身 Python 源字符串；同一 PR 的第二提交改为匹配真实 heredoc 的独立行，修复后才通过。失败历史不抹除、不给它物理证明。
- 源码经正常 Ready→Merge 合入 `main@5a0eedf634a9c997676e97a684528f45bd336d8b`。受保护 main 上新增 [Tokyo physical #43144446590](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43144446590) job `130938859928` **SUCCESS**。2026-11-12 02:53 UTC 已**读取 Job 原始日志**：既有 `CV03_N105C11_HOST_METADATA_READONLY_PASS`、`CV03_N105C11_REAL_ORIGINAL_PG_METADATA_READONLY_PASS`、`CV03_N105C11_PROTECTED_MAIN_PHYSICAL_READONLY_TERMINAL_PASS`，及新增的实际运行时输出：
  - `CV03_N105C12_LIVE_EFFECTIVE_AUTH_PROVIDER_COUNT=1`
  - `CV03_N105C12_LIVE_AUTH_BINDING_COUNT=0`
  - `CV03_N105C12_STATIC_PROVIDER_CANDIDATE_PROVEN_PASS`
  - `CV03_N105C12_RESOLVED_POLICY_AND_PG_T0_NOT_PROVEN`
  - `CV03_N105C12_PROTECTED_MAIN_LIVE_PROVIDER_GET_READONLY_TERMINAL_PASS`
- **最窄 G 结论**：当次真正运行的东京 Host 提供 exactly one 已知 `host.static-authorization` 有效候选、该 Capability 绑定数 0。**不代表实际 `resolveAuthorizationProvider` 处理一次业务请求时的选择、每条规则决策已获验证，更不代表真实持久 Pg 授权事实源**。使用真实 running deployment，但当前预览 `CV03_N105C11_PREVIEW_LAST_HEALTHY_SHA=0ab405611539881f8024b708e2f0b220db521326`，**不是**此次合并的 main。请勿把工作流 SHA 当已发布镜像 SHA。
- [Branch Hygiene #43144447981](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43144447981) job `130938863504` **SUCCESS**；原始日志验证 `DELETED_VERIFIED_MERGED_PR_BRANCH ci/cv03-n105c12-tokyo-live-provider-candidates-20261112 @ fde27035b868c52112e3445052552c6cd6d30d00`。GitHub 分支 ref 也已不存在。[protected main Continuity #43144446695](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43144446695) SUCCESS；[东京 preview preflight #43144475327](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43144475327) SUCCESS、实际 deploy **SKIPPED**（workflow/docs-only 无镜像变更），不宣称发布。
- 固定状态仍是 `N1=NOT_CERTIFIED`、SAVE OFF、正式 POST 403、未注册 GET 404；[`#1212`](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 的真实 PA05、AuthorizationProvider、DB、Security/Operations、Domain Owner 批准和正式 Schema/SQL Producer/KMS/跨物理 Host/完整 Scope 恢复合同仍缺失，[`#1184`](https://github.com/jiangxng/EVO-App-Platform/pull/1184) Owner 受管文档没有修改。
- **来源分级更新**：以上标记现为本次**原始 protected-main Action 日志已读 G**，不是 PR 物理 SKIP 推断；此前文件的“P 尚未取得这次 main-only GET 日志”仅指合并前预期，此节取代该部分状态。未新增第三方原文资料或外部产品比较。

### 实际接续

真正的下一关是独立 Owner 在 #1212 签署**正式单一持久授权权威和 SQL Owner/Producer、签名密钥轮换、完整 Scope/tombstone/generation watermark、失败关闭和跨物理 Host 回滚合同**。静态 Provider 候选已可见，但继续开发另一套 QA Owner/绑定计数不会解决跨源 T0；尚未获批前不得挂载生产 Saved View/改 SAVE。

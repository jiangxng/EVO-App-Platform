# 数据导入主线 → TR-01 B2D3 扩张 → 六插件只读壳：研究与用户验收审计

> **2026-10-11 用户确认：本审计发现的两项核心偏移（B2D3 平行财务事实解释风险；六个业务插件未继承真实 EVO 运行时调用链）已正式上升为本轮治理目标。** 以 [《EVO 账本运行时事实解释主权与 TR-01 / B2D3 治理目标》](../governance/EVO-LEDGER-RUNTIME-AUTHORITY-AND-TR01-CORRECTION-GOAL-20261011.md) 的 G0–G5 验收门槛为准。此处的风险判断不是指当前已发生生产错账，也不代表治理已经完成。

**核查日期 2026-10-11，非业务验收。** 对比当前检查时 EVO-App-Platform main `ce9551183287c5432b14cf597937d7a7991f6594`、未合并 Draft [#594](https://github.com/jiangxng/EVO-App-Platform/pull/594) head `1d6149bd05136d642e49aab5196d12ab243cbe4e`。只记录研究，不修改 main、Railway、project.status.json、Agent/2D。

## 1. 主线与范围偏移

用户最初的价值主线：基础对象 Counterparty / Item / Warehouse、Object Extension、Data Import、Excel 自动字段映射/Recipe 复用、导入历史与业务人员可读 UI。TR-01 是用采购→收货→冲回和销售→发货→应收→收款**检验基础对象与 EVO 权威数据的参考闭环**；TR-01 B2D3 演变为受签名保护的 Host→Finance Owner 只读委托**技术子主线**，不是原导入任务。10 月 10–11 日又把未来六个业务独立 Application 方向快速落成合成预览壳。4 天没有用户可验收交付，CI 数量不应替代用户签收。

来源：[TR-01 研究决策](https://github.com/jiangxng/EVO-App-Platform/blob/ce9551183287c5432b14cf597937d7a7991f6594/docs/roadmap/TR01-RESEARCH-DECISIONS-AND-GAPS-20261010.md)、[插件边界纠偏](https://github.com/jiangxng/EVO-App-Platform/blob/ce9551183287c5432b14cf597937d7a7991f6594/docs/architecture/TR01-PLUGIN-EXTRACTION-NO-PLATFORM-POLLUTION-20261011.md)。

## 2. 六个应用的真实交付深度

[PR #703](https://github.com/jiangxng/EVO-App-Platform/pull/703) 完成六个不同 `APPLICATION` Package/Feature/Capability 和 Eidos 页面声明；[PR #731](https://github.com/jiangxng/EVO-App-Platform/pull/731) 才以两个 opt-in 开关把它们加入 Host Catalog，并添加 `manager/server.ts` 的专用注册。Railway 版本 `89320e118b97f358b4fdab0ec4c198d1cf8a57c7` 部署 SUCCESS，但用户浏览器只见单条 List，这与源码一致：`apps/trading-stage/demo-kit.ts` 输出 `catalog-browser`，六个 `apps/trading-stage-*/package.ts` 分别写死单条 `DEMO-*` 数据与下一环节链接。没有真实业务单据数据库 CRUD、正式订单目录、财务写入或真正跨插件事件流程。

**安装状态**独立于**业务状态**：Host `manager/store.ts` 持久化 installedPackages/activeFeatures，不是六个业务的数据表。可打开的 Workbench 路由为 `/#/store` 和 `/#/trading-stage/{sales,shipment,receivable,cash,purchasing,receiving}`；直接 GET `/store`、`/trading-stage/*` 不是 Host HTML shell 路由。安装后页面依然只是模拟 List。不得声称已上线六个 ERP 业务模块。

## 3. 可继承且已在 main 的资产

1. **原导入主线**：`apps/data-import/`（XLSX、Recipe、导入、权限、页面）、`apps/counterparty/`、`apps/item/`、`apps/warehouse/`、`apps/object-extension/`（业务对象与扩展）；应回到供应商 172 行真实 XLSX 导入、AI 映射、第二次配方复用、列表核查、历史追溯和错误权限的用户验收。既往日志记录不等于当前 Railway 上再验证。
2. **真实业务参考流程**：`apps/trading-reference/purchase-loop.ts`、`sales-loop.ts` 及其 EVO PostgreSQL/HTTP CI。见 [TR01A6 Chrome+Human+AI+EVO proof](https://github.com/jiangxng/EVO-App-Platform/blob/ce9551183287c5432b14cf597937d7a7991f6594/docs/roadmap/TR01A6-INSTALLED-HUMAN-AGENT-WORKBENCH-EVIDENCE-20261010.md)、[销售参考闭环](https://github.com/jiangxng/EVO-App-Platform/blob/ce9551183287c5432b14cf597937d7a7991f6594/docs/roadmap/TR01B1-SALES-SHIPMENT-CASH-REFERENCE-20261010.md)。真实参考服务仍未迁移为六个独立业务应用的自有写入。
3. **基础平台**：Host Store、Capability/Contribution、安装启停与授权，Eidos 原生 UI，历史证明与 CI harness；六个 package shell 可留作未来接口载体，但本身业务价值较浅。
4. **EVO Ledger Runtime**：已存在 BusinessData→Posting/Ledger/Balance、FIFO/Cost/Allocation/Replay 权威引擎。Platform 不得复制影子财务/库存账。财务独立 Owner 的 read-only 安全预检是安全资产，不能替代用户财务应用。

**架构债务**：六包注册目前在 Host `manager/server.ts` 有专门 import/catalog/assets wiring；虽然是小规模 gated 接入，但与此前“业务插件不得继续侵入 Host Core”的架构要求存在张力。下一次新增插件应先解决通用发现机制，不能无限追加业务硬编码。详见 [已确立插件归属护栏](https://github.com/jiangxng/EVO-App-Platform/blob/ce9551183287c5432b14cf597937d7a7991f6594/docs/architecture/TR01-BUSINESS-PLUGIN-OWNERSHIP-GUARD-20261010.md)。

## 4. TR-01 B2D3 #594 尚未合入 main 的真实内容（按文件 blob SHA，而非提交数量）

[#594](https://github.com/jiangxng/EVO-App-Platform/pull/594) 仍为 open/draft，历史统计 132 commits / 64 changed paths / +5749 lines。按 PR changed-path 与两端当前原文件 SHA 核对：
- **39/64 原路径完全相同**：包括六业务 package、`apps/trading-reference/finance-owner-remote.ts` 和 `providers/trading-finance-owner/package.ts`。相同只说明源码已继承，不能推定 runtime 已启用。
- **18/64 原路径 main 没有**：5 个专项 GitHub workflows、1 个原四插件阶段测试、12 个 TR01B2D3 CI/测试运行工具（独立 PostgreSQL 登录与角色、OIDC、TLS、签名 key 轮换、安装式 Host、并发 nonce/revoke 等）。它们是重要**复验证据资产**，不能因为源码文件多数已继承就直接删掉 #594。
- **7/64 与 main 不同**：`manager/server.ts`（Draft 有受管 Session+企业边界+签名 Secret 的 `POST /api/v1/trading-finance/readonly-owner-verify` runtime 路由，main 没有，属于关键未整合执行接线）；`catalog/seed.ts`（旧 Draft/core preview wiring，禁止覆盖新 main）；`.github/workflows/cross-project-tr01b-sales-evo-postgres.yml`（Draft 还加入更多真正的受控 Finance Owner CI）；`apps/trading-reference/finance-owner-key-pointer.ts` + `tests/protocol/tr01b2d3-signing-pointer.test.mjs`（main 经 #736 对 fd/O_NOFOLLOW/fstat 加固，属于 main 更新更安全）；两份 `TR01-RESEARCH-DECISIONS-AND-GAPS` / `TR01-RESEARCH-SOURCE-INDEX` 研究文档（有双边增量，不能替换丢失）。

关联的 EVO [Draft #108](https://github.com/jiangxng/EVO/pull/108) 也仍是 open/draft；“本地合成 IdP、本地 TLS、跨进程共享 DB CI”不等于用户部署的外部认证、生产签名密钥授权或真实财务写入签收。B2D3 生产 gate 与 B2D4/B2E 执行/工作台仍 OPEN。

## 5. 验收优先顺序

- **P0**：恢复原供应商数据导入真实用户旅程：上传 XLSX→自动映射和 dry-run→错误修正→172 行提交→名单真实核查→第二次导入自动 recipe 复用→历史/权限。要真实可见 UI、真实状态/数据变化、用户签收。
- **P1**：六插件保持独立 package skeleton，先纠正安装入口/产品发现，再逐个接入真实拥有者的数据查询与有权限的业务操作；不要用新增静态卡片冒充产品推进。
- **P2**：#594 和 EVO #108 继续 Draft 保存，安全证明和 CI 脚本要带源 SHA/证据；不再扩充与当期产品验收无关的复杂度，不整支向 main 回滚 Host、不启用财务写入。

**结论**：工程资产大量存在且可继承；当前不可接受的是“研究/CI 很多，四天没有用户能检验的实际业务结果”的交付方式。请以用户验收为业务主线恢复控制。

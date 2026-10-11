# EVO 账本运行时事实解释主权与 TR-01 / B2D3 治理目标

> **2026-10-11 用户明确确认的本轮治理目标（已决定的架构原则；实施与验收仍待进行）。**
> 本文件是 **EVO-App-Platform 非 Agent、非 2D / EOG 分支功能收敛专项的治理验收基线**，不是实现完成证明，也不代替 `project.status.json`、已 ACCEPTED 的 EVO 架构 ADR。不得因为 CI 绿灯、模拟页面可见或某代码位于 EVO 仓库，就认定业务已通过账本运行时解释。
>
> 研究背景：[导入主线 / TR-01 B2D3 / 六插件四天验收缺口审计](../research/IMPORT-TR01B2D3-USER-ACCEPTANCE-AUDIT-20261011.md)。

## 一、用户确认的治理问题与不可再重复的错误

> **错误的风险出现在 B2D3 的演进方式：安全核验逐渐成为一个能直接理解数据库财务语义的独立体系，同时六个新插件没有继承前面真实的运行时调用链。此类情况不得再次出现。**

- **问题 A — B2D3 核验主权偏移：** `EVO/modules/valuation/infrastructure/postgres-trading-finance-fact-verifier.ts` 内的 `PostgresTradingFinanceFactVerifierV010` 直接读 `business_data`、`posting_input`、企业运行状态及政策/规则表，独立组合并判断一组财务事实、过账和核销前提，返回 `OWNER_DATABASE_READ_ONLY`。它目前只是只读/候选，且位于 EVO 仓库内；**但“位于 EVO 仓库内 / 数据库源是真实的”不等于“正式通过 EVO Ledger Runtime 的语义解释契约”**。尤其不能让独立 Host/Finance Owner 或业务模块把此核验器演化为第二个财务事实权威。
- **问题 B — 六插件名实不符：** `apps/trading-stage-*/package.ts` 与 `apps/trading-stage/demo-kit.ts` 只定义六个独立 Application 和 `DEMO-*` 单行 Eidos `catalog-browser` 演示；它们没有继承 `apps/trading-reference/purchase-loop.ts`、`sales-loop.ts` 的真实 `EvoBusinessDataAdapter.submit` 提交和 EVO Ledger/Work/Position 读取链。安装和独立身份虽成立，但不等于真实业务能力。
- **问题 C — 验收偏离：** 连续数日侧重多分支、CI、委托安全与演示壳，缺乏供用户实际验证的基础对象/Excel 导入、订单到运行时结果的真实浏览器操作。用户签收不能由绿灯替代。

以上是**根据已审查代码形成的工程风险与修正决定**，并非宣称所有 PostgreSQL 查询都是非法，亦非宣称当前生产环境已出现财务错账。应以差异化的内外边界审计和负例测试为准。

## 二、权威关系（不得逆转）

```text
Human / Agent / integration
   ↓ 业务意图（无自行授权）
App Platform Host
   ↓ 可信身份、企业上下文、权限、插件生命周期、授权的公开 Capability
安装式 Application 插件（采购/收货/销售/出库/应收/收款）
   ↓ 企业业务事实 + 不可变引用 + applicationId + idempotency
EVO Ledger Runtime：BusinessData → versioned PostingRule → Posting
   ↓ LedgerEntry / LedgerBalance / Position / Work / Replay + 可追溯版本结果
业务应用、Eidos、Agent、报表 **读取并呈现运行时结果**
```

- **Host** 决定“身份/企业上下文/哪些操作被准许提交”，且必须遵循可信合同，**不解释或计算财务经济事实**。运行时执行必要的数据/隔离/幂等完整性检查，不能让外部未授权请求直达。
- **Business Application** 拥有业务事件语义、输入校验、源数据/单据的业务态以及与基础对象身份的引用；可以存储非经济权威的业务操作草稿或展示数据，但**不能新建影子库存数量金额、应收余额、现金余额、成本、已核销金额等另一套经济账**。
- **EVO Ledger Runtime** 是确定性解释 BusinessData / 执行被提供的 PostingRules / 形成 Ledger、Balance、可回放运行结果的唯一权威。**EVO 仓库 ≠ EVO Ledger Runtime**。
- **Cost / Valuation / Allocation 扩展 Owner**：可保留既有 EVO 项目实现、受控算法与独立插件归属，**不要求把所有高阶领域算法强行塞进最小 Runtime Core**；其输入、经济效果、生命周期及对外权威查询必须依托**版本化、受管、可回放的运行时接口/产物**，不许悄然形成第二套财务账。
- **数据库访问边界**：运行时实现自身及其受控内部扩展可以在已界定权限内读取内部持久化状态，但对外的 Host、独立业务插件、Finance Owner 不得直接 SQL 判断/写入 EVO 内部经济真相。仅把数据库查询改名 `FinanceFactVerifier` 或封装一个签名 HTTP API **不等于**已通过运行时解释。需要有明确的运行时语义输入、结果类型、发布版本、posting boundary、replay provenance 和 owner 审计；不能假定现有内部只读核验自动满足这些条件。

权威依据：
- [EVO ACCEPTED：Minimal Runtime Plugin Boundary](https://github.com/jiangxng/EVO/blob/main/docs/architecture/decisions/2026-09-24-evo-minimal-runtime-plugin-boundary-v0.1.md)；
- [EVO ACCEPTED：Repository vs Ledger Runtime](https://github.com/jiangxng/EVO/blob/main/docs/architecture/decisions/2026-09-24-evo-repository-vs-ledger-runtime-scope-v0.1.md)；
- [TR-01 插件归属守则](../architecture/TR01-BUSINESS-PLUGIN-OWNERSHIP-GUARD-20261010.md)；
- [TR-01 插件化与 Core 零污染纠偏](../architecture/TR01-PLUGIN-EXTRACTION-NO-PLATFORM-POLLUTION-20261011.md)。

## 三、本轮禁止事项（阻断合并与验收）

1. **禁止** 在 Host、Agent、Eidos、业务应用或独立 Finance Owner 内解释 `business_data`、`posting_input`、`allocation_*` 等内部表来生成最终经济判定；也不能直接改 `ledger_*`、`cost_*` 或核销记录。
2. **禁止** 基于 `ORDER=confirmed`、`cash.received` 原始字段、Ledger 单一余额或存在 `REFERENCES`，自行推出“已完成正式核销”“成本已正确结转”等结果；必须有运行时权威的版本化输出/正式 Allocation 关系与必要 Replay 证据。
3. **禁止** 将 B2D3 的签名、Session、nonce、PostgreSQL 只读核验 PASS 当作“运行时经济解释已完成”；签名证明主体，**不证明业务经济含义**。
4. **禁止** 把只读 `catalog-browser`、`DEMO-*` 单据、六个 Package/路由或部署 SUCCESS 报告为真实采购/销售/财务业务验收。
5. **禁止** 因恢复旧 Draft 而整文件替换现代 `manager/server.ts`、`catalog/seed.ts` 或削弱当前安全护栏；独立业务插件不得继续产生 Host Core 中的专用硬编码注册。
6. **禁止** 在跨项目权限、运行时契约、用户验收证据缺失时打开 B2D4 财务生产写入，或合并整个 [App Platform Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) / [EVO Draft #108](https://github.com/jiangxng/EVO/pull/108)。

## 四、按优先顺序开展的治理工作和退出门槛

| Gate | 目标 | 必须提供的证据 | 不得冒充 |
| --- | --- | --- | --- |
| **G0：语义归属清册** | 对 TR-01 A/B 各业务事实、余额、应收、现金、成本、核销、Work/Position 列出唯一权威 Owner，标出提交/解释/查询实际接口；把 B2D3 的逐项 SQL 语义映射至运行时原生结果与受控扩展 | 当前源码路径、权威 ADR、调用图、缺口与同一笔业务引用 | “数据在 EVO PostgreSQL” ≠ “解释来自 Runtime” |
| **G1：B2D3 去平行事实权威** | Finance Owner 收敛为身份/范围/策略准入与安全委托；经济真实性改为受管的 Runtime / 正式经济扩展 Owner **语义结果契约**。如需 DB 内部检查，须受运行时 Owner 管控，不可成为独立可替代的经济口径 | 运行时 API/契约及边界 review、同事实正负例（跨租户、错 Posting、旧版规则、错源/消费者、Replay mismatch）、无外部直接 SQL/无影子余额证明 | 仅 HTTPS+签名+DB read 通过 |
| **G2：六插件继承真实调用链** | 保留六包独立发布身份，从 `trading-reference` 参考服务**逐一迁移**可验证的真实 Submit/Read Capability；业务单据/事实归属按领域分开，EVO 仍是唯一经济输出 | 每包明确的 BusinessData 类型、runtime application binding、同一业务 ID 的提交→EVO Posting/Position/Work 查询、安装/禁用负例；不得把参考服务自动等同生产插件 | `DEMO` 列表、静态下一环节链接 |
| **G3：业务与财务反例 / Replay CI** | 增加阻止绕过 EVO 事实解释的静态 + HTTP/PostgreSQL 证据；先证明安全拒绝，再准入可写功能 | 最低要求：unauthorized/absent binding、错误 scope、历史规则 version、冲回/重复提交、客户错配、无对应核销事实均被拒；正例须有 EVO Runtime 追溯 ID 和 canonical Replay MATCH | 现有静态 `tr01-evo-runtime-single-owner-guard.mjs` PASS 已足够 |
| **G4：用户实际可见** | 在现有 Railway 集成测试环境、明确部署 SHA 下演示至少一个真实业务端到端：业务数据变化、EVO Runtime 解释结果、原生 Eidos 可读呈现 | 用户可操作的入口、记录 ID、Runtime response/Posting/Balance 或正式经济视图、浏览器及异常处理证据、用户签收 | CI SUCCESS / Railway SUCCESS |
| **G5：恢复导入原始价值主线** | 独立核查 Counterparty XLSX→自动映射→dry-run→提交→列表/历史→二次 recipe 自动复用；不把 Finance B2D3 成为数据导入交付前提 | 实际文件/作业 ID/成功失败行数、真实仓储结果、用户界面二次操作及用户签收 | 采购/销售安全分支数量、测试数量 |

**每一 Gate 未满足之前不得标记 PASS。** 可以按模块分离验证与合并；不得让 G1 的金融安全工程阻塞 P0 导入/页面验收，也不得用 P0 的用户 UI 来证明 G1 安全。

## 五、执行分工与追踪位置

- `apps/trading-reference/{purchase-loop,sales-loop}.ts`、`manager/evo-business-data-http-adapter.ts`、`apps/trading-reference/{operational-http-reader,sales-operational-http-reader}.ts`：保留并复用真实 EVO 事实调用链。
- `apps/trading-stage*/` + `apps/trading-stage/host-preview.ts`：保留独立插件壳，但标记 `SYNTHETIC / READ-ONLY / NOT_CERTIFIED`，直到按 G2/G4 完整迁移与验收。
- `apps/trading-reference/finance-intent-admission.ts`、`finance-owner-remote.ts`，EVO `modules/valuation/infrastructure/postgres-trading-finance-fact-verifier.ts`：G0/G1 审查重点；不能仅将 verifier 的 SQL 换成另一个直读 API 就称治理成功。
- `tools/tr01-evo-runtime-single-owner-guard.mjs`、`tools/tr01-business-plugin-ownership-guard.mjs`：已存在但范围为**受限静态保护**，只查少量私有导入/重复计算/写库模式，**不能证明所有财务判定已通过运行时的正式语义契约**。G3 需要扩展覆盖并加入可靠运行负例。
- App Platform [Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) / EVO [Draft #108](https://github.com/jiangxng/EVO/pull/108)：保留原源码、CI、密钥/跨实例等证据，**维持 Draft/未认证**，只接受经本治理边界单独审查的必要功能，不整分支回灌。
- 本次专项基准文档：[研究/验收审计](../research/IMPORT-TR01B2D3-USER-ACCEPTANCE-AUDIT-20261011.md) · [分支交接入口](../roadmap/PLATFORM-CONVERGENCE-WINDOW-HANDOFF-ENTRY-20261011.md) · [决策与缺口](../roadmap/PLATFORM-CONVERGENCE-DECISIONS-GAPS-20261011.md)。
- **并行边界**：不编辑 Agent、2D/EOG、Eidos 设计器源码，不重写 `project.status.json`、自动生成型 HANDOFF，不触发 Railway 重部署；先将此文档作为评审基线，随后各项代码门禁需另行 PR 与实际验证。

## 六、完成定义与报告口径

这次治理只有在 **「没有平行财务事实解释 → 业务插件真实使用 EVO Runtime → 可追溯经济产物与 Replay → 浏览器可用 → 用户签收」** 的组合成立后，才能称产品方向已经收敛。**文档被记录不等于治理已实现。**

每次后续报告必须分别标注：`DECIDED`（用户确认）/ `CODE_PRESENT`（存在代码）/ `CI_PROVEN`（受控测试通过）/ `RUNTIME_DEPLOYED`（线上运行）/ `USER_ACCEPTED`（用户验收），不得相互升级。


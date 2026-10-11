# Platform 窗口研究资料 / 网络来源 / GitHub 证据索引 — 2026-10-11

> 只记录**本窗口实际请求过的 GitHub 仓库源码/文档、REST 分支/PR/CI 元数据、Railway service/deployment 元数据，以及本窗口所依据的既有交接材料**。没有在本窗口抓取外部行业教程、第三方企业产品网站全文或截图；**搜索摘要级来源 = 0**。旧窗口若曾引用外部文章，本包不会冒称在本窗口重读过。
>
> 日期：本表直接检查日均为 **2026-10-11**；原文创建日期（例如 ADR 2026-09-24）与查阅日不同。GitHub URL 固定到实际读过时的 SHA，避免新窗口误拿后来 main 内容当被审查版本。阅读级别：**A 完整文件/原文**；**B 局部正文或已读核心函数**；**C GitHub/Railway API 元数据与 Git tree/blob 比对，不是源代码功能全审**；**D 待验证**。这与 [简短入口](../roadmap/PLATFORM-20261011-WINDOW-HANDOFF-ENTRY.md) 和 [决策缺口](../roadmap/PLATFORM-20261011-WINDOW-DECISIONS-GAPS.md) 分开维护。

## 1. 直接查阅过的技术原文和设计依据

| ID / 查阅级别 | 标题 / 2026-10-11 原始网址 | 研究主题 | 来源关键发现（事实） | 项目实际用途 |
| --- | --- | --- | --- | --- |
| S01 / **A 原文** | [EVO Minimal Runtime Plugin Boundary (ACCEPTED，2026-09-24)](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/docs/architecture/decisions/2026-09-24-evo-minimal-runtime-plugin-boundary-v0.1.md) | 最小 Runtime 架构 | EVO 是可安装、确定性 BusinessData→PostingRule→Ledger/Balance 的小插件；Host 管权限/生命周期；Cost/Allocation/Valuation 属受管扩展候选 | 冻结边界；防 Host 平行账本 |
| S02 / **B 文档内容与后续审计原文** | [Economic Runtime Architecture Freeze (ACCEPTED，2026-09-18)](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/docs/architecture/decisions/2026-09-18-economic-runtime-architecture-freeze-v0.1.md) | 近封版认知 | 不可变经济事实→确定性解释→投影→可重建物化；Replay / Position/Allocation 受不变量约束 | 检验新变更是否越过冻结语义，不等于所有代码零变化 |
| S03 / **B 本窗口经主线审计引用，需复查独立 ADR 全文** | [EVO Repository vs Ledger Runtime Scope (ACCEPTED)](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/docs/architecture/decisions/2026-09-24-evo-repository-vs-ledger-runtime-scope-v0.1.md) | 资产与权威划分 | EVO 仓库里的模块不自动属于最小 Ledger Runtime 权威；不能按代码仓库名鉴定金融解释合法性 | B2D3 verifier 的归属判断 |
| S04 / **B 主线审计摘要、路线图链接** | [EVO Project Goals Stage Roadmap](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/docs/architecture/status/EVO-PROJECT-GOALS-STAGE-ROADMAP-v0.1.md) | Replay/FIFO 阶段口径 | 架构封版、历史 Replay 认证有界；不宜泛化为全场景正式投产 | 避免过度认证 |
| S05 / **B 章节原文（§Automatic Posting、§Business Data、§Ledger read）** | [EVO Public API Contract 1.0-alpha.2](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/PUBLIC-API.md) | 真实对外接口 | POST /api/v1/business-data HTTP 202；应用 Anchor 先注册；自动承担 Posting；QUEUED 非结账完成；GET /api/v1/ledgers/:ledgerCode/balances 精确维度、无跨币种任意聚合；见文档约 220–325 行 | 六应用的 Submit/Read 唯一基线 |
| S06 / **A 文件原文** | [EVO BusinessData Submission HTTP Route](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/apps/api/src/business-data-submission-route.ts) | 请求实际约束 | required scopeKey/applicationId/businessDataType/businessObjectKey/effectiveAt/payload/correlationId/idempotencyKey；relation 仅规定合法枚举；有效申请 HTTP 202 | 对齐 Host 请求数据结构和幂等/来源关系 |
| S07 / **B 相关代码摘录** | [EVO Fastify Runtime HTTP wiring](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/apps/api/src/build-app.ts) | 运行时可见性 | 源代码注册 /api/v1/ledgers/:ledgerCode/balances 与 /api/v1/work-items；区分 demo replay 路线 | 确认应用只走正式 public read，不走 demo 隐式计算 |
| S08 / **A 原文** | [TR01B2B Cost/Valuation/Settlement boundary review (REVIEW PROPOSAL)](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/docs/architecture/reviews/TR01B2B-COST-ALLOCATION-PUBLIC-BOUNDARY-REVIEW-20261010.md) | 成本/核销接口尚未认证 | 真实 Sales→Production→Shipment→Cash 数据及特定 PostgreSQL CI 的 pinned FIFO/Replay 证明；建议 cost/Allocation plugin-owned versioned capability；文中明确「非 shipped API」 | 分离现有可复用引擎与未发布的经济扩展公开契约 |
| S09 / **A 原文** | [TR01B2D2 Readonly Finance Owner Verifier review](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/docs/architecture/reviews/TR01B2D2-READONLY-FINANCE-OWNER-VERIFIER-20261010.md) | B2D3 风险边界 | DB verifier 检查原始 sales/order/shipment/cash、posting 和政策 pin，仅只读且 executionAllowed=false；不具公网认证财务 API | 阻断将只读 SQL 审计提升为财务权威 |
| S10 / **B 关键源码/差异（已用于先前封版审计）** | [Postgres Trading Finance Fact Verifier](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/modules/valuation/infrastructure/postgres-trading-finance-fact-verifier.ts) | EVO 内部经济 SQL | 针对 business_data/posting_input/状态/政策表做领域判断；实现位置是 EVO 仓库不等于通过统一正式结果合同 | 下一轮需语义 Owner/API 正式审查而非仅测试签名 |
| S11 / **A 原文** | [Six stage package common demo kit](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-stage/demo-kit.ts) | 六插件的现状 | Stage Preview 需 isolated-preview + enabled；单行 DEMO/SYNTHETIC/READ-ONLY/NOT_CERTIFIED；仅 catalog-browser，绝不实做库存和应收 | F0 历史壳 vs 真业务验收 |
| S12 / **A 原文（六文件）** | [Six independent trading-stage Application package manifests](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-stage-purchasing/package.ts) | 六插件演示字段 | 采购供应商/物料/数量/金额；收货来源/仓库/数量；销售客户/金额/数量；发货来源/仓库/数量；应收金额来源；收款金额应收来源 | 各插件必须逐一迁移，不整体模拟宣称产品功能 |
| S13 / **A 原文** | [Receiving, Sales, Shipment, Receivable, Cash manifests](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-stage-receiving/package.ts) | 演示事件不一致 | 原 demo 发货 sales_order.shipped、收款 customer_cash_receipt.recorded；真实参考提交 sales_shipment.created、cash.received；其它四源码链接见 §2 | P0 核对规范事件，不将演示事件误认发布合同 |
| S14 / **A 原文** | [Trading Reference Purchase Loop](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-reference/purchase-loop.ts) | 采购已验证调用 | approvePurchaseOrder、receivePurchaseOrder、reversePurchaseReceipt 生成 purchase_order.approved / goods_receipt.received / goods_receipt.reversed；FULFILLS、REVERSES 关联 | 采购订单首个用户验收的代码起点 |
| S15 / **B 关键函数原文（部分输出经截断，核心各方法读取）** | [Trading Reference Sales Loop](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-reference/sales-loop.ts) | 销售到收款 | sales_order.approved、production.completed、sales_shipment.created、cash.received；生产 MAKE；cash REFERENCES 非正式 Allocation | 对后四应用的真实事实类型与边界校验 |
| S16 / **A 原文** | [Evo BusinessData public adapter types](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/contracts/evo-business-data.ts) | 受管契约 | submit 接口参数含业务对象键、scope、idempotency、relation、expectedBusinessVersion；返回 businessDataId/postingInputId/postingSequence/QUEUED 或 replay required | 插件与 Host 之间可复用的稳定 type |
| S17 / **A 原文** | [Evo BusinessData HTTP Adapter](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/manager/evo-business-data-http-adapter.ts) | 实际提交实现 | POST /api/v1/business-data；验证响应契约和 Posting status；不自行完成 Ledger 或 Posting | 受管 Host adapter 复用起点 |
| S18 / **A 原文** | [Purchase and Sales Operational HTTP Readers](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-reference/operational-http-reader.ts) | Ledger/Work 读取 | GET /api/v1/work-items + /ledgers/:ledgerCode/balances，enterprise_id/limit/精确 dimension.*；最多 100 行且不完整则 fail closed | 不能自行去重或算影子余额；销售同类源文件见 §2 |
| S19 / **A 原文** | [Purchase and Sales Operational Projection](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-reference/operational-projection.ts) | 应用展示语义 | Host Enterprise Context 和授权先通过；读取 pending_purchase/payable/inventory/Work；不完整/歧义拒绝，不能伪造关闭状态 | 逐业务显示真实 runtime 解释；Sales 源文件见 §2 |
| S20 / **B 文件部分原文** | [Foundation Object Platform Architecture v0.1](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/docs/architecture/FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md) | 字段扩展/主数据所有权 | Counterparty、Item、Warehouse 领域插件拥有语义；Enterprise Context 资源容器拥有持久化边界；应用引用主数据 | 六插件不克隆主数据，扩展字段可由有效 Schema 驱动 |
| S21 / **A 原文** | [Plugin Title Localization resolvePackageDisplayNameV010](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/manager/package-display-name.ts) | 四语言插件名 | Eidos localization runtime、语言脚本选择、英文 fallback，兼容旧 Manifest 未提供翻译 | 多语言 PR #757 功能审查依据 |
| S22 / **A 原文** | [Plugin title localization protocol regressions](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/tests/protocol/plugin-title-localization.test.mjs) | i18n 覆盖证明 | 枚举内置约 48 个包、四语言、未安装/停用/启用；不加载未启用插件翻译资源 | #757 绿灯依据；不等于所有插件页面文字完成国际化 |
| S23 / **B 已读局部原文** | [Plugin Store & server locale wiring](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/manager/plugin-store-page.ts) | 插件标题生效界面 | 插件商店 title 使用 resolvePackageDisplayName，server 部分路由传 locale；其余状态字符串依然可能英文 | 后续多语言完整化仍需用户界面实测 |
| S24 / **A 原文** | [Branch convergence inventory at merge #764](https://github.com/jiangxng/EVO-App-Platform/blob/ca794e9ee3bfdd7197418dfff197a70ca805e7aa/docs/roadmap/PLATFORM-REMAINING-BRANCH-LEDGER-20261011.md) | 分支归属 | 14 个 B2D3 精确 SHA 和 F0–F4；Git tree 查出 24 个 main 不存在的路径、23 个一版、1 个三版；用户决定逐个应用验收 | 下一窗口优先读并确认差异，不再翻 173 条考古 |
| S25 / **A 原文（局部已有主线核查）** | [Runtime authority and TR01 correction goal](https://github.com/jiangxng/EVO-App-Platform/blob/ca794e9ee3bfdd7197418dfff197a70ca805e7aa/docs/governance/EVO-LEDGER-RUNTIME-AUTHORITY-AND-TR01-CORRECTION-GOAL-20261011.md) | 冻结/纠偏 | G0–G5 明确了财务语义唯一 Owner、六插件必须真 Submit/Read、真实 Postgres/Replay/Human 验收及 XLSX 导入 | 治理北极星，不把 Gate 文档本身当通过 |
| S26 / **A 原文** | [EVO freeze impact audit](https://github.com/jiangxng/EVO-App-Platform/blob/ca794e9ee3bfdd7197418dfff197a70ca805e7aa/docs/roadmap/TR01-EVO-LEDGER-RUNTIME-FREEZE-IMPACT-20261011.md) | 源码影响 | EVO 40 commits/21 paths 的历史检查；Host 静态 guard 能拒绝直接 SQL 表访问但非完整安全分析 | 下一轮不得把 PR #759 当金融语义整改完成 |
| S27 / **B 重点段落** | [Prior Platform convergence source index](https://github.com/jiangxng/EVO-App-Platform/blob/ca794e9ee3bfdd7197418dfff197a70ca805e7aa/docs/research/PLATFORM-CONVERGENCE-SOURCE-INDEX-20261011.md) | 早期研究遗产 | 包含模板、CP03 XLSX、TUGE 登录、Eidos、认证、历史 CI 链接，含既有 A/B/C/D 等级；只对本窗口直接复核的部分承担本次原文阅读声明 | 从旧窗口延续时不要丢失早期参考 |
| S28 / **B 重点原文** | [Earlier convergence decisions/gaps](https://github.com/jiangxng/EVO-App-Platform/blob/ca794e9ee3bfdd7197418dfff197a70ca805e7aa/docs/roadmap/PLATFORM-CONVERGENCE-DECISIONS-GAPS-20261011.md) | 历史比较 | 拒绝旧 Host/Catalog 整文件合并；实际用户导入和视觉人验不能被 CI 替代；旧 Railway SHA 是历史快照 | 旧决策可溯源但不能照抄为今日在线状态 |

## 2. 同批实际读过的关联源码原始链接（与表内记录互参）

这些链接为**直接源码读取的配套文件**，不是想当然的推测或“已浏览网页的外链”。

- 六插件的另外四个独立 Manifest：
  - [销售订单](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-stage-sales/package.ts) — A
  - [出库发货](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-stage-shipment/package.ts) — A
  - [应收](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-stage-receivable/package.ts) — A
  - [客户收款](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-stage-cash/package.ts) — A
- [销售 Operational HTTP Reader](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-reference/sales-operational-http-reader.ts) — A；[销售 Operational Projection](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-reference/sales-operational-projection.ts) — A。销售库存金额字段特意标注 **costValuationCertified:false**；不可将原始余额显示成经认证 COGS。
- [Item repository](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/item/repository.ts)、[Warehouse repository](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/warehouse/repository.ts)、[Counterparty repository](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/counterparty/repository.ts) — B（重点是身份/代码/名称等关键字段，不称已经完整审计所有 repository）。
- [TR-01 真实参考插件](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/apps/trading-reference/package.ts) — A：实际是可安装、授权的只读参考视图 / Capability，不能把它简单等同六个合成 Stage Package。
- [Plugin Store 页面完整入口](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/manager/plugin-store-page.ts) — B；[Manager Server](https://github.com/jiangxng/EVO-App-Platform/blob/a35d68ddef5abbf1adfa3290317e9a069ddc449f/manager/server.ts) — B，仅阅读多语言相关定位/路由截取，不是全 9000 行级代码审计。
- [EVO Public API 实际源码路由](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/apps/api/src/business-data-submission-route.ts) 与 [Public API 文档](https://github.com/jiangxng/EVO/blob/d5ce051325c4572c7a5fd713560d7d7d06e4b401/PUBLIC-API.md) 必须配套复查。

## 3. GitHub PR、CI、Branch 和执行证据（直接 API 读取；级别 C，部分日志原文级别 B）

| ID / 类型 | 标题 / 原始网址 | 查阅日期 | 实际观察（不含推断） | 用途 |
| --- | --- | --- | --- | --- |
| G01 / C | [i18n PR #757](https://github.com/jiangxng/EVO-App-Platform/pull/757)；[Plugin Title Localization run 38146840219](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38146840219) | 2026-10-11 | 原 head 5933fe64... 全 **47 项重新跑的 CI 成功**，squash main SHA a35d68dd... | 已完成；不要下轮重复修复标题 |
| G02 / C | [Runtime authority guard PR #759](https://github.com/jiangxng/EVO-App-Platform/pull/759) | 2026-10-11 | 经当前 main 兼容性 CI 合并，merge f29a5e22...；在 apps/providers/manager/catalog 加静态经济表直接读防线 | G0/G1 的基础护栏，**不能替代 Finance Owner 语义合同** |
| G03 / C | [Governance handoff PR #723](https://github.com/jiangxng/EVO-App-Platform/pull/723) | 2026-10-11 | 旧文档经更新后合并，merge a53edbc2...，G0–G5 正式治理材料进入 main | 防止新窗口再做架构决策 |
| G04 / C+B | [Branch inventory and five-tail retirement PR #764](https://github.com/jiangxng/EVO-App-Platform/pull/764)；[audit 38148732389](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38148732389)；[execute 38148807773](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38148807773) | 2026-10-11 | PR 合并 ca794e9e...；审计 job 日志含 5 项 TAIL_REF_VERIFIED + AUDIT_ONLY；main-push 清理 SUCCESS；后重新 enumerated 确认 5 refs ABSENT | 不是单纯“建议删”，确实删除并验证 |
| G05 / C | [Open Finance Host delegation Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594)；[EVO Draft #108](https://github.com/jiangxng/EVO/pull/108) | 2026-10-11 | 两个 PR 均 **open + draft**，未与本次 main 一起合并 | F1 延续，不能以 CI 绿灯越权上线 |
| G06 / C | [六插件独立 Package PR #703](https://github.com/jiangxng/EVO-App-Platform/pull/703)；[预览安装发现 PR #731](https://github.com/jiangxng/EVO-App-Platform/pull/731) | 2026-10-11 | 六包合成演示壳已入 main；#731 把 package-owned opt-in preview 插入 Host store | F0 判断旧分支代码是否真的还有产品差异 |
| G07 / C | [GitHub branches API 当前快照](https://api.github.com/repos/jiangxng/EVO-App-Platform/branches?per_page=100)；[open PRs API](https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls?state=open&per_page=100)；[main API](https://api.github.com/repos/jiangxng/EVO-App-Platform/branches/main) | 2026-10-11 | 当前读取前 main 92b37127...、73 refs = main1/TR14/Agent11/Diagram46/old audit ref1；11 open PR。此后新建的本交接分支**不在这 73 中** | 首轮操作必须刷新数值 |
| G08 / C | [Git trees on 14 named TR-01 branches](https://github.com/jiangxng/EVO-App-Platform/branches)；[固定版本 14 分支矩阵](https://github.com/jiangxng/EVO-App-Platform/blob/ca794e9ee3bfdd7197418dfff197a70ca805e7aa/docs/roadmap/PLATFORM-REMAINING-BRANCH-LEDGER-20261011.md) | 2026-10-11 | 逐个 source tree 与 main recursive tree 的文件名 + blob SHA 比对，24 个主线不存在的路径，23 个重复同 SHA，1 个工具三版本；没有自动证明全部同名路径语义已吸收 | F0–F4 去重研究的原始依据 |
| G09 / C | [TR-01 Reference purchase reversal #722](https://github.com/jiangxng/EVO-App-Platform/pull/722)；[旧分支 retired #740](https://github.com/jiangxng/EVO-App-Platform/pull/740)；[squash heads retired #743](https://github.com/jiangxng/EVO-App-Platform/pull/743) | 2026-10-11 | 前轮已将较旧 CP03/Template/Login/Ledger、16 ancestor + 5 squash ref 清理；本轮在此基础上又退役 5 refs | 不要重演历史大批次清理 |

## 4. Railway 实际线上元数据（级别 C，构建日志局部为 B）

- 名称：Ledger Configurator，Railway project ID aee4643e-912b-4ca1-ae95-fe4ec64f5601，service ID a8622238-480e-4da3-be6f-60fd0f3e18db，environment ID 98b8b20c-d791-4073-a11d-bb1f7f0a1cb3，环境名 production **只是服务配置命名**；用户性质定义是公网集成测试。
- 当日原始可访问服务域名：[https://ledger-configurator-production.up.railway.app](https://ledger-configurator-production.up.railway.app)，不是“已实测多语言的浏览器录屏链接”。
- 通过 Railway connector **describe_service、list_deployments、environment_status、get_logs** 直接观察：固定 repo main SHA a35d68ddef5abbf1adfa3290317e9a069ddc449f；deployment ded25373-a791-498c-a6c4-15cd1309d62a，SUCCESS，2026-10-11 14:23:45Z 创建，约 14:24:25Z 上线；build 日志 /health success；服务 1/1 running、无 warning/critical。
- **当前 main 92b371... 晚于公网固定 SHA**；新建交接 docs 分支不触发用户验收部署；没有运行原生浏览器真实多语言/业务录单人工签收，不可写 USER_ACCEPTED。

## 5. 明确不是本窗口“已读原文”的来源（D 待核查）

- [Eidos 独立仓库](https://github.com/jiangxng/eidos)：本窗口查阅的是 Platform vendored Eidos localization 使用/结果，**并未在本次研究完整逐文件查阅 Eidos 独立仓库**；UI 规范或新版 Designer 结论必须由 2D/Eidos owner 核对。
- [Experience Compiler 独立仓库](https://github.com/jiangxng/Experience-Compiler)：此次未访问；Agent/学习引擎决定留给独立窗口。
- [ChatGPT 官方说明](https://help.openai.com/)：在本窗口关于“上下文超长”的早期回复曾出现不可复原的引用标记，但当前没有可确认的具体文章原始 URL/章节及实际正文浏览记录。**不能将 help.openai.com 泛域名伪作已读资料**；若新窗口要专门研究 token 机制，应重新定位官方原文再建立索引。
- 第三方 2D 商业交互、图形渲染参考：本窗口没有新读外网原文；历史 2D 研究资料在其独立 [交接 PR #762](https://github.com/jiangxng/EVO-App-Platform/pull/762)，不可本窗口冒充已读。
- 原用户 172 行 SUPPLIER XLSX：本窗口引用前序工作和治理文档，**没有重新拿原始 Excel 文件做浏览器人验**。待实际回归用原文件/ImportJob/Recipe，注意不要在公开研究资料暴露真实供应商敏感信息。

## 6. 原文、截图、易变化资料保存策略

- **可重读原文**：上面全部 GitHub blob URL 固定提交 SHA；正文较长时以文档章节定位（EVO Public API 的 Automatic Posting / BusinessData Submission / Ledger Balance；业务参考服务的 approve/receive/reverse/ship/cash 方法）而非复制整份源代码。
- **易变化元数据**：保留原始 PR、Actions run ID、Railway deployment ID、14 个 head exact SHA（详见证据文件），后续用新 API 查最新状态，不能覆盖历史快照。
- **网页截图 / PDF / 附件**：本窗口没有生成、保存或读取本轮截图，也没有外部 PDF。**截图/附件位置：无**，不得虚构文件名。
- **网络查阅分类统计**：Github/EVO 源码及文档 A/B；GitHub/Railway 原始服务元数据 C；“仅搜索摘要” 0；未重新访问的外部参照 D。


## 6. 接续窗口新增直接来源（2026-10-11，独立增量）

| 新 ID / 级别 | 源标题与固定原始地址 | 核查结果与用途 |
| --- | --- | --- |
| S29 / **A 原文** | [旧 F0 四 peer 协议测试（fixed source）](https://github.com/jiangxng/EVO-App-Platform/blob/fb3db99272ef047aa7686715fd495545f9342ccf/tests/protocol/tr01b2d3-four-peer-stage-plugins.test.mjs)；[现代六 Stage smoke](https://github.com/jiangxng/EVO-App-Platform/blob/db3fd2d53c7a28fcc2ba438e67ac54ceae0f3438/tests/protocol/tr01-six-stage-host-preview.test.mjs)；[现代购买/收货以及六包协议](https://github.com/jiangxng/EVO-App-Platform/blob/db3fd2d53c7a28fcc2ba438e67ac54ceae0f3438/tests/protocol/tr01-trading-peer-purchasing-receiving.test.mjs) | 旧测试中独立停用后的四 peer 存活和 Eidos 全部渲染值得复用，其余重复断言不原样搬；用于 F0 代码级采纳决策 |
| S30 / **A 原文** | [旧 V1 separate login script](https://github.com/jiangxng/EVO-App-Platform/blob/1d6149bd05136d642e49aab5196d12ab243cbe4e/tools/certify-tr01b2d3-distinct-db-logins.mjs)；[旧 V2 script](https://github.com/jiangxng/EVO-App-Platform/blob/3e7d5182bc5f4ae03ca638c76524872086a0cbec/tools/certify-tr01b2d3-distinct-db-logins.mjs)；[旧 V3](https://github.com/jiangxng/EVO-App-Platform/blob/ff2fd23e83ebf72a5fc0c21757f729fd800594ac/tools/certify-tr01b2d3-distinct-db-logins.mjs) | 实际读取 3 个完整源码并比较具体断言；V1 owner catalog + V2 readonly listener 不应简化为 V3 full EVO main；本轮没运行现代 PostgreSQL |
| S31 / **A 原文 + C 执行元数据** | [F0 新测试与证据 #775](https://github.com/jiangxng/EVO-App-Platform/pull/775)；[Platform CI 38153528258](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38153528258)；[Continuity 38153528267](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38153528267) | F0 小项 merge `014196f7`、CI SUCCESS；只证明测试和源码集成，不证明业务写入、人验或整套旧源可删 |
| S32 / **A 原文/部分文件** | [F1 Finance Owner Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) 以及两版本 `apps/trading-reference/{finance-intent-admission,finance-owner-remote}.ts`、`providers/trading-finance-owner/package.ts`；[F4 6 个旧 workflow 源头索引](https://github.com/jiangxng/EVO-App-Platform/blob/014196f7a52f7051ef9a0fa8ea524e14b23169de/docs/archive/PLATFORM-20261011-F0-FOUR-PEER-SOURCE-RECOVERY.md) | 两个 finance admission/remote 文件相同 blob；Provider Manifest 旧/新主要为四语标题差异，不是新的经济语义执行合同。六份 workflow 已逐个读取，主要调度历史脚本/合成准入，不等于外部部署认证 |

上述资料不改变原 S01–S28 的阅读分级，不声称已完成独立真实 Railway 浏览器业务验收。


### S33 / A 原文：F4 六份旧 GitHub Actions 工作流原文（2026-10-11）

每条均按源分支固定 commit 读取完整 YAML；这是**旧 CI 调度定义的源码审查**，不等于本轮执行该 workflow：

| 旧工作流 | 固定原文网址 | 当前判断 |
| --- | --- | --- |
| TR01 Peer Purchase/Receiving | [source 7e231732](https://github.com/jiangxng/EVO-App-Platform/blob/7e23173250a23aa396555fed77a1470ebd099708/.github/workflows/tr01-peer-purchasing-receiving.yml) | 执行 stage 包协议与 static scope gate，主线已有对应测试 |
| Four Peer Eidos Stage | [source fb3db992](https://github.com/jiangxng/EVO-App-Platform/blob/fb3db99272ef047aa7686715fd495545f9342ccf/.github/workflows/tr01b2d3-four-peer-stage.yml) | 调度旧四包 Eidos install/render；F0 独特断言已由 #775 提取 |
| Isolated Browser Stage | [source bd67f320](https://github.com/jiangxng/EVO-App-Platform/blob/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/.github/workflows/tr01b2d3-online-stage-preview.yml) | 静态模拟 CDN Probe 和内容防泄漏，不是真实财务在线服务 |
| Six Lane Admission | [source 8a0a27dc](https://github.com/jiangxng/EVO-App-Platform/blob/8a0a27dca96ac69cb1fcef2eaffca6a43bc75dc4/.github/workflows/tr01b2d3-six-lane-admission.yml) | 六种候选缺失条件负例；不构成实际生产授予 |
| Twelve Lane Pre-admission | [source 75e85657](https://github.com/jiangxng/EVO-App-Platform/blob/75e8565708433c3ed046016bc76bf45e054a03c0/.github/workflows/tr01b2d3-twelve-lane-admission.yml) | 12 个合成配置条件与聚合，非真实生产多节点认证 |
| Finance Owner Deployment Preflight | [source 71821513](https://github.com/jiangxng/EVO-App-Platform/blob/718215136f79efd79d7e755954d686d77cf73356/.github/workflows/tr01b2d3-finance-owner-deployment-preflight.yml) | 仅候选 descriptor 的 fail-closed 静态矩阵 |

**复用原则**：实际有功能增益才选择小 CI 迁移；现有 `tests/protocol/tr01b2d3-{six,twelve}-lane-admission.test.mjs` 的受控测试不能凭旧 YAML 自行升级成生产安全认证。


## 2026-10-12 新增已读原文 / GitHub CI 证据

| ID / 级别 | 固定原文/证据 | 实际发现及用途 |
| --- | --- | --- |
| S34 / A 原文 | [F2 工具](https://github.com/jiangxng/EVO-App-Platform/blob/aa6432f0d525b2ef3ad02c358c9ab83e093238f3/tools/platform-f2-distinct-db-login-ci.mjs)、[Guard tests](https://github.com/jiangxng/EVO-App-Platform/blob/aa6432f0d525b2ef3ad02c358c9ab83e093238f3/tests/protocol/platform-f2-distinct-db-login-guard.test.mjs)、[CI YAML](https://github.com/jiangxng/EVO-App-Platform/blob/aa6432f0d525b2ef3ad02c358c9ab83e093238f3/.github/workflows/platform-f2-disposable-db-logins.yml) | 只在显式 opt-in 的 loopback disposable f2_ci_* 数据库创建真实、随机独立 LOGIN，验证 42501 与原会话撤权；不读取真实 EVO 经济表 |
| S35 / C 元数据 + B 日志 | [PR #777](https://github.com/jiangxng/EVO-App-Platform/pull/777)、[PG 38154708390](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38154708390)、[Platform 38154708378](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38154708378)、[Continuity 38154708397](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38154708397) | 三项 SUCCESS；日志显示 16 checks、两个实际 LOGIN、撤权成功、financeTablesTouched=false、NOT_CERTIFIED；merge aa6432f0 |
| S36 / A 原文 | [EVO Draft #108 的 Finance-only Fastify app](https://github.com/jiangxng/EVO/blob/a8c3b0dfca56ec207c095efb743e1f6e9493d6a0/apps/api/src/finance-owner-readonly-app.ts)、[独立启动入口](https://github.com/jiangxng/EVO/blob/a8c3b0dfca56ec207c095efb743e1f6e9493d6a0/apps/api/src/finance-owner-readonly-main.ts) | 专用 Listener 只挂 health 与 finance read；两个文件不存在于现行 EVO main，仍为 Draft 非正式发布接口，真实 HTTP 路由隔离留待 owner 审批 |


## 2026-10-12 F3 合成 Preview 原文补充

| ID / 深度 | 固定原始源码与说明 | 直接确认事实 |
| --- | --- | --- |
| S37 / **A 完整原文** | [静态 HTML](https://github.com/jiangxng/EVO-App-Platform/blob/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/demos/tr01b2d3-isolated-stage/index.html)、[浏览器 WebCrypto 脚本](https://github.com/jiangxng/EVO-App-Platform/blob/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/demos/tr01b2d3-isolated-stage/static-demo.mjs)、[可选 Railway Function 源码](https://github.com/jiangxng/EVO-App-Platform/blob/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/demos/tr01b2d3-isolated-stage/railway-function.ts)、[原阶段验证测试](https://github.com/jiangxng/EVO-App-Platform/blob/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/tests/protocol/tr01b2d3-online-stage-preview.test.mjs) | 页面显式标 BROWSER SIMULATION、SYNTHETIC、NOT_CERTIFIED；WebCrypto 和流程测试是真实本地模拟，但数据、nonce、密钥都是临时测试对象。Railway Function 也仅是 demo，含 process-local nonce，不应恢复正式 Host/Finance Owner |
| S38 / **A 原文（历史说明，当前状态另验）** | [TR01B2D3 stage demo online record](https://github.com/jiangxng/EVO-App-Platform/blob/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/docs/roadmap/TR01B2D3-STAGE-DEMO-ONLINE-20261011.md) | 历史原文记录 Preview 独立 Railway Function 创建因额度而失败，无公网服务端链接；RawGitHack 仅被建议作为静态浏览器加载方式。本轮未访问 RawGitHack，也未声称最新 CDN 可用或已部署 |

F3 决定：上述原始 SHA 作为演示/研究遗产保存，**不将缺失的 3 个 demo 文件、1 个 demo 研究文档及旧 workflow 原样吸收进 main**。真正业务安装、授权、EVO Ledger 调用必须由后续 Purchasing 独立验收，不能由该 demo 替代。


## 2026-10-12 新增来源：F1 Host 传输守卫

| 新 ID / 原文阅读深度 | 固定源码、CI、参考说明 | 事实、限制与工程用途 |
| --- | --- | --- |
| S39 / A 源码原文 | [main 对应旧 Client 代码](https://github.com/jiangxng/EVO-App-Platform/blob/34f332ba96feaa9d19a6fd8615fb2e5de9b98e8d/apps/trading-reference/finance-owner-remote.ts)，blob 85ebfd580143b9beaf72726050ca4c8a8c7fb0cb；[F1 新测试](https://github.com/jiangxng/EVO-App-Platform/blob/09fee6f8f327871b71e0b37a9e19a7f16161db57/tests/protocol/platform-f1-signed-owner-loopback-boundary.test.mjs) | main 和旧 #594 的签名 Client 同 blob，不整支回灌。新增真正的 loopback HTTP / Ed25519 消息签名协议负例，但接收端不具备真实 EVO/Postgres |
| S40 / C CI 元数据 + B 失败日志 | [PR #779](https://github.com/jiangxng/EVO-App-Platform/pull/779)、[成功 Platform CI #38155748502](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155748502)、[成功 Continuity #38155748491](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155748491)；[初次失败 38155514269](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155514269)、[二次失败 38155633156](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155633156) | 两次红 CI 是测试错误码断言的预期错误，不是安全守卫被绕过。第三次通过后合并 SHA 09fee6f；这些不能升级成正式 Owner/真实经济合同/人验 |
| S41 / A 直接读取 | [EVO #108 finance-only app](https://github.com/jiangxng/EVO/blob/a8c3b0dfca56ec207c095efb743e1f6e9493d6a0/apps/api/src/finance-owner-readonly-app.ts)、[独立 main](https://github.com/jiangxng/EVO/blob/a8c3b0dfca56ec207c095efb743e1f6e9493d6a0/apps/api/src/finance-owner-readonly-main.ts)、[旧 Host session CI 说明](https://github.com/jiangxng/EVO-App-Platform/blob/34f332ba96feaa9d19a6fd8615fb2e5de9b98e8d/docs/roadmap/TR01B2D3-INSTALLED-HOST-MANAGED-SESSION-CI-20261010.md) | 专用 Finance Listener 在 EVO Draft #108，但不在 EVO main；旧端到端历史证据须保持历史语义，不可拿独立 Host mock 测试替代发布合同 |

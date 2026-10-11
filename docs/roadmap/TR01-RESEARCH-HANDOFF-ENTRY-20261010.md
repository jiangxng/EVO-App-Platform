# TR-01 主线研究与决策交接入口 — 2026-10-10

> **用途：**聊天窗口达到长度上限后的短入口，供新 ChatGPT 窗口阅读。**不是项目状态的第二份权威文件**：仓库当前 `project.status.json` / 自动生成的 `docs/roadmap/HANDOFF-LATEST.md` 始终高于本文件。请先按 `AI-BOOTSTRAP.md` 的规定顺序读取权威文件，再看本交接。
>
> **研究范围：**本窗口 EVO-App-Platform 主线的 TR-01 Trading Reference Loop（特别是 TR-01B1→B2D2），不包含平行的 2D Designer 商业化升级和 Agent 长期架构专项。
>
> **检索基线（2026-10-10，经 GitHub 核实）：**[App Platform `main`](https://github.com/jiangxng/EVO-App-Platform/tree/da8151d17726a0f08b3fd10fde67b02e127ff10c) = `da8151d17726a0f08b3fd10fde67b02e127ff10c`；[EVO `main`](https://github.com/jiangxng/EVO/tree/d5ce051325c4572c7a5fd713560d7d7d06e4b401) = `d5ce051325c4572c7a5fd713560d7d7d06e4b401`。这是交接时刻的证据固定点，不保证后续 `main` 不变。

## 交接包位置

1. **当前入口（本文件）：**`docs/roadmap/TR01-RESEARCH-HANDOFF-ENTRY-20261010.md`。仅保留目标、决策、进度、风险和必读顺序。
2. **已用资料逐项索引：**`docs/roadmap/TR01-RESEARCH-SOURCE-INDEX-20261010.md`。含原始可访问网址、查阅日期、文件/章节锚点、查阅级别、关键发现、用途和需要再验证的限制。
3. **方案比较、证据与未决研究：**`docs/roadmap/TR01-RESEARCH-DECISIONS-AND-GAPS-20261010.md`。保留采用/排除方案及适用条件、来源事实 vs 工程判断、真实 CI 证据、冲突、后续查阅优先级、截图/附件清单。

**资料真实性声明：**本窗口真正使用的资料主要是经 GitHub 连接器**读取的仓库代码、文档和 CI 运行状态/日志**。本窗口**没有进行独立的外部网站搜索/网页原文阅读，也没有取得外部图片或 PDF 截图**；不要将既有文档中的“网络参考链接”写成此窗口已读原文。源码部分往往只读取与问题有关的段落，索引如实标记“相关段落/全文”。

## 用户的明确要求和任务边界

- **以仓库实际状态为最高权威**，而非旧聊天或 ChatGPT 记忆；交接资料、增量决策和开发进度要持续写入 GitHub，便于换窗口。
- 主线应从已经导入/验证的 **Counterparty（往来对象）、Item（存货对象）、Warehouse/Location（仓库/库位）**出发，以采购和销售的**真实业务闭环反向推演**通用能力，不能单纯按对象清单扩建。
- Human/Agent 应共用**被授权的 Host 操作契约**；EVO owns immutable BusinessData、Ledger/Work、成本/估值、正式 AllocationInstruction/Relation、回放；不可让 Agent、App Host 直接篡改 Ledger。
- 一直“继续”的授权意味着在无需用户验收时自主推进独立小 PR、真实 PostgreSQL/浏览器 CI、受保护合并、部署核验、权威交接；**不得影响并行 2D Designer 和独立 Agent 专项，不直接推 main**。业务向汇报，不堆不必要技术细节。
- **资金账户基础对象暂缓**：现金 Ledger ≠ 银行/支付渠道主数据；必须有银行账户归属、币种、结算、对账等真实需求才重启。

## 已确认的实施和业务决策（仅概括）

| 阶段 | 交接时权威结论 | 验证边界 |
| --- | --- | --- |
| TR-01A | 采购→收货→不可变冲销，含已安装 Human/AI/Workbench 参考验证 | [#567](https://github.com/jiangxng/EVO-App-Platform/pull/567) + 真实 CI，不代表完整 ERP |
| TR-01B1/B2A | 销售→生产→发货→收款的公开 BusinessData/PostgreSQL；Human/AI 的 Work/Position **服务级读取** | [#571](https://github.com/jiangxng/EVO-App-Platform/pull/571)、[#574](https://github.com/jiangxng/EVO-App-Platform/pull/574)，销售界面未正式安装 |
| TR-01B2B | EVO FIFO 固定策略/规则版本：发货后原始 Inventory 数量 0、金额 125 → EVO 正式估值后库存金额 0、COGS 125；canonical Replay MATCH | [#578](https://github.com/jiangxng/EVO-App-Platform/pull/578)，**CI 隔离环境 EVO owner 内部调用**，非公开生产成本命令 |
| TR-01B2C | 原 App Platform 订单 + 原客户收款产生 1000 CNY 的正式 AllocationInstruction → AllocationRelation，第二次 canonical Replay MATCH | [#582](https://github.com/jiangxng/EVO-App-Platform/pull/582)，**仅单订单/单笔/同币种/全额**；正式核销写入接口未开放 |
| TR-01B2D1 | Host 对订单、客户、存货、仓库及原始 BusinessData **逐资源授权**，所有 policy pins 必须显式；没有 owner 插件**默认拒绝**，即使只读证明通过 `executionAllowed:false` | [#585](https://github.com/jiangxng/EVO-App-Platform/pull/585)，只读准入/预检，不注册财务写入能力 |
| **TR-01B2D2（最新已关闭）** | EVO owner 只读核验真实 Sales/Shipment/Receipt、过账序列、策略版本，与 Host 准入**在同一个 CI 流程内联测**；错误租户/对象/金额/版本拒绝；经济和输入摘要不变 | [EVO #107](https://github.com/jiangxng/EVO/pull/107)，[App #588](https://github.com/jiangxng/EVO-App-Platform/pull/588)，[交接 #589](https://github.com/jiangxng/EVO-App-Platform/pull/589)；**CI 中进程内适配，不是可信生产通讯** |

最后权威 snapshot：`tr01b2d2-evo-readonly-owner-fact-pin-postgresql-pass-trusted-host-delegation-open-20261010`。核对 [project.status.json](https://github.com/jiangxng/EVO-App-Platform/blob/da8151d17726a0f08b3fd10fde67b02e127ff10c/project.status.json) 的 `projectContinuity.current.openGate`。

## 下一步唯一主线任务：TR-01B2D3（OPEN）

**解决生产级可信 Host→EVO 插件委托**，而不是重复证明已有订单的正确性。

1. 在**EVO/plugin owner**边界验证来自真实 Host 的可信身份/租户上下文（不能接受请求自己写的 `actor`、Enterprise ID），明确 Host→EVO 映射、安装与 provider 信任、签名/时效/重放防护；比较可行信任机制后定稿。
2. 接入**只读**核验器的正式版本化 Host↔owner 契约，保持 `executionAllowed:false`；拒绝伪造主体、跨租户、过期/重放委托与未安装插件/无权限请求。
3. 用原有 App Platform immutable Sales/Shipment/Receipt 与真实 EVO PostgreSQL 完成**通讯边界级**正反向 CI；不依赖仅限 CI 的直接进程内连接。
4. **后续独立阶段 B2D4**才做受控成本/核销写入、幂等、审计、执行时重新验权、回放；**B2E**才做销售 Human/Agent/Workbench 的真实浏览器安装验收。

**禁止把 B2D2 的内部只读类挂到匿名 HTTP 或 Agent tool；禁止调用 EVO `/api/v1/demo/*`、把 `/api/v1/commands` 请求自填 `actor` 当可信权限、私有 CostEngine 或直接写 Ledger/Allocation。**

## 新窗口必读顺序

1. [`AI-BOOTSTRAP.md`](https://github.com/jiangxng/EVO-App-Platform/blob/da8151d17726a0f08b3fd10fde67b02e127ff10c/AI-BOOTSTRAP.md) → `project.status.json` → 其指向的 `docs/roadmap/HANDOFF-LATEST.md` → `LLM.md` → `llm.foundation-map.json`。
2. 本入口 → [详细资料索引](TR01-RESEARCH-SOURCE-INDEX-20261010.md) → [决策及证据缺口](TR01-RESEARCH-DECISIONS-AND-GAPS-20261010.md)。
3. 与下一步直接相关：`docs/roadmap/TR01B2D1-HOST-FINANCE-INTENT-ADMISSION-GATE-20261010.md`、`docs/roadmap/TR01B2D2-EVO-OWNER-FACT-PIN-VERIFICATION-20261010.md`、EVO `docs/architecture/reviews/TR01B2D2-READONLY-FINANCE-OWNER-VERIFIER-20261010.md`。
4. **打开下一轮之前再核对两个仓库最新 main/未合并 PR/CI/Railway**。本交接保留的是参考遗产，不替代最新动态。

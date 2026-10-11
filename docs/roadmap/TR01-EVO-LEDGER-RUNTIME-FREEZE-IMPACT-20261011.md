# TR-01：EVO Ledger Runtime 近封版保护审计及 Platform 分支收敛增量（2026-10-11）

> **状态：源码影响审计 + Platform 静态防线增量；非实际运行时生产签收、非经济语义接口治理全部完成。**
> 独立分支 `fix/tr01-runtime-authority-guard-20261011`，不改 EVO、Agent、EOG/2D、全局权威 status、Railway。治理总纲位于现有资料 [PR #723](https://github.com/jiangxng/EVO-App-Platform/pull/723) 的 `docs/governance/EVO-LEDGER-RUNTIME-AUTHORITY-AND-TR01-CORRECTION-GOAL-20261011.md`。

## 用户要求与判断

**EVO Ledger Runtime 已处于经济架构近似封版的阶段，TR-01 不能因为新需求破坏固定的解释/过账/账本/回放主权，更不能借 Finance Owner 安全核验构造平行经济解释。** 平台的六个交易插件必须逐步复用原 Trading Reference → EVO BusinessData → PostingRule → Ledger/Work 的真实路径，不得把合成 List 当做产品验收。

### 封版的确切含义（直接阅读 EVO 原始文档）

1. [2026-09-18 Economic Runtime Architecture Freeze：ACCEPTED / ARCHITECTURE FREEZE](https://github.com/jiangxng/EVO/blob/main/docs/architecture/decisions/2026-09-18-economic-runtime-architecture-freeze-v0.1.md) 冻结了 **Canonical Business/Economic Evidence → Deterministic Interpretation → Projection → Rebuildable Materialization** 及 Position、Allocation、Cost、Valuation、Replay 的分类与不变量。
2. [2026-09-24 Minimal Runtime Plugin Boundary：ACCEPTED](https://github.com/jiangxng/EVO/blob/main/docs/architecture/decisions/2026-09-24-evo-minimal-runtime-plugin-boundary-v0.1.md) 将 EVO Ledger Runtime 界定为轻量 BusinessData→PostingRule→Ledger/Balance 可重算插件。身份、业务领域语义、权限、Eidos、Host 归其他组件；Cost/Valuation/Allocation 高阶算法可由明确归属的扩展插件承担，不意味允许副本/影子账本。
3. [EVO repository vs Ledger Runtime scope：ACCEPTED](https://github.com/jiangxng/EVO/blob/main/docs/architecture/decisions/2026-09-24-evo-repository-vs-ledger-runtime-scope-v0.1.md)：**EVO 仓库不等于最小 EVO Ledger Runtime 组件**。不能因为某段核验 SQL 位于 EVO 仓库就认定它已通过运行时的正式经济语义输出。
4. [EVO 大阶段路线图](https://github.com/jiangxng/EVO/blob/main/docs/architecture/status/EVO-PROJECT-GOALS-STAGE-ROADMAP-v0.1.md)：Economic Architecture Frozen、Full Replay Correctness Certified；Production-Safe Incremental Replay 的 **参考 FIFO 边界**阶段性关闭并转向业务闭环，不得泛化为所有多企业、多币种及多源经济路径均完成生产认证。

**结论：已冻结的是架构与计算主权，不是所有 TypeScript 文件禁止扩展；现有 Runtime 不应重构为传统 ERP 财务服务。**

### 精确 Git 差异（固定提交）

EVO `main = d5ce051325c4572c7a5fd713560d7d7d06e4b401`（截至本次核查，最新 CI [38019513707](https://github.com/jiangxng/EVO/actions/runs/38019513707) SUCCESS）。

- 从 2026-10-05 `5121d6bf5a8e946fa668310b50f8960d4f1f8de5` 到 main，GitHub compare 返回 **40 commits / 21 changed paths**：
  - `business-data` / API 提交新增原子 direct relation / `REVERSES`；Postgres 新 migration `202610100010_business_object_link_reverses.sql`；源事实与确定性冲回相关（实际触及实现/协议，**并非代码字节不变**）。
  - 公开 Ledger Balance dimension filter、测试与文档增加，供业务 App 读取运行时结果。
  - EVO `modules/valuation/infrastructure/postgres-trading-finance-fact-verifier.ts` 新增 214 行，只读从内部 `business_data` / `posting_input` / policy/valuation 表核验，存在**平行解释授权边界风险**。
  - 未发现 Ledger/FIFO/Replay 引擎被复制或重写的文件变更；通过 CI 只证明受控覆盖，不能保证任何未测试客户数据的零回归。
- 从 2026-10-09 `2311022640aa108a6baf3db44d9b26bd3e3ad623` 到 main，仅 **8 commits / 4 changed paths**：2 个评审文档 + 上述只读 verifier + verifier 单元测试。
- EVO [Draft #108](https://github.com/jiangxng/EVO/pull/108) 仍 open/draft，Host signed delegation / Postgres trust / isolated finance HTTP 等**并未合入 EVO main**；Platform [Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) 也不能整支合并。
- 该 git 原文对比证明**没有证据显示冻结计算内核被替换**，不等于没有数据库/schema 变化，不等于已经完成正式 Finance Owner 可信运行时语义契约或用户验收。

### 这轮实际补充的可执行保护

在既有 `tools/tr01-evo-runtime-single-owner-guard.mjs` 的扫描内增设 **EVO_RUNTIME_SEMANTIC_AUTHORITY_VIOLATION**：

- 对 Platform 的 `apps/`、`providers/`、`manager/`、`catalog/` JS/TS 源码，阻止直接用 SQL `FROM/JOIN` 或 query builder `selectFrom` 读 EVO 的 `business_data`、`posting_input`、`ledger_entry`、`ledger_balance`、`allocation_*`、`cost_*`、`valuation_*`、runtime state 和 position definition 等内部经济表来解释财务语义。
- 原有对重复引擎、私有 EVO 计算 import、直接财务表写操作的禁令保持不变。现有 `tools/architecture-boundary-validate.mjs` 已在 `npm run test:platform` 测试链中调用 guard，因此无需引入另一套扫描器。
- `tests/protocol/tr01-evo-runtime-single-owner.test.mjs` 新增三组负/正例：`selectFrom('public.business_data')`、原始 SQL `allocation_relation`、`posting_input`、`ledger_balance` 拒绝；公开 BusinessData/HTTP Ledger 读取和 Counterparty 本地表读取允许。
- **边界局限**：这是 Platform 内基于源码文本的静态 tripwire，防常见绕过，不是全语言静态分析或跨仓库 runtime contract 验证。它并不扫描 EVO 私有 verifier，也没有把该 verifier 自动整改为 runtime 官方语义接口。不能因本检查 PASS 就提升 Finance Owner 的准入状态。

### 主线收敛处置表（不越过并行线）

| 资产/分支 | 处置 | 可验收条件 |
| --- | --- | --- |
| EVO 冻结运行时核心 `main` | **保留、不重构、不从 Platform 修改** | 保留 ADR；正式协议升级要逐项回归事实幂等、历史冲回、Policy pin、完整 Replay |
| EVO B2D3 Draft #108 / Platform B2D3 Draft #594 | **保留 Draft，不整支合并/删除** | 先把 finance 的 SQL 核验转为 EVO Runtime / 受管经济扩展语义合同；签名/防重放再作为安全前置 |
| 6 `apps/trading-stage-*` | **保留独立 Package 壳，禁止宣称已产品化** | 逐一接原 Trading Reference 真实 Submit/Read；真实 runtime observation + 人类浏览器用例 |
| Platform existing `tr01-evo-runtime-single-owner-guard` | **增强并通过独立 PR 评审** | 直接经济库读取违规用例必须红灯；原合法 EVO public port 绿灯；Platform CI 绿灯 |
| Data Import / Counterparty / Item / Warehouse | **作为近期用户价值主线继续交付** | 真 XLSX 自动映射→dry-run→提交→实际列表→第二次 recipe→导入历史/权限 |
| Agent/2D/EOG 及其他未合并功能 | **独立窗口管理** | 不碰其分支/PR 和全局状态；已有安全引用不能以“减分支数量”取代功能验收 |

**治理退出条件**：没有平行经济事实解释，六插件经公共 runtime 合约获得可追溯的真事实结果，运行时 Replay 和浏览器用户操作均有独立证据，用户实际签收。当前这份提交只关闭 **Platform 静态防线这一小项**，不宣称整个 G0–G5 治理完成。

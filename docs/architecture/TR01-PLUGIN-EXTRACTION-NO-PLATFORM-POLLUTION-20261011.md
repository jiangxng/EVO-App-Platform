# TR-01 插件边界纠偏与 Platform 零污染要求（2026-10-11）

**状态：用户已明确修订方案；禁止把旧的 13–15 个插件猜测当作计划或验收标准。此文件仅校正架构与归属，不授权财务生产写入。**

## 原始批准的基础原则

- [EVO 2026-09-24 ACCEPTED ADR：Minimal Runtime Plugin Boundary](https://github.com/jiangxng/EVO/blob/main/docs/architecture/decisions/2026-09-24-evo-minimal-runtime-plugin-boundary-v0.1.md)：**EVO Ledger Runtime 已经是轻量核心运行时插件**。BusinessData → Posting → Ledger / Balance / Replay 是它的能力，不是需要在 Platform 重建的服务或拆成多个业务插件。
- [EVO 2026-09-24 ACCEPTED ADR：Repository vs Ledger Runtime](https://github.com/jiangxng/EVO/blob/main/docs/architecture/decisions/2026-09-24-evo-repository-vs-ledger-runtime-scope-v0.1.md)：EVO 仓库与 Ledger Runtime 范围不同；复用既有 EVO 实现。除非用户明确授权，**不得在 App Platform 复刻 EVO 的 Ledger Runtime 或其业务计算实现**。
- [Foundation Object Architecture](FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md) 与 [Plugin Platform Mainline](PLUGIN-PLATFORM-MAINLINE-v0.1.md)：通用 Host 负责包管理、Capability 解析、生命周期、权限和公共接入；Eidos 负责统一 UI；企业对象、业务应用属于自己的插件。Enterprise Context 为跨插件资源持久容器。
- Counterparty、Item、Warehouse、Data Import、Object Extension 早已有各自独立的 APPLICATION Manifest，**不得为了“拆插件”再复制一套**。

## 本次用户明确的纠偏决定

1. **采购订单、采购收货、销售订单、出库发货、应收、客户收款都是独立 Application 插件，不准合成单体 Trading Application**。采购冲销可作为收货插件的受控业务动作，不另建一包。
2. **Inventory 与 Cost 首先是报表/查询视图**：消费者使用 EVO Ledger Runtime 已计算出的 Position / Balance / Cost 结果；不为显示这些报表再创造库存台账或成本计算引擎。
3. **FIFO 算法已经位于现有 EVO Ledger Runtime**，保留并复用，不另立 Platform 算法或重复的 Cost Owner。财务 Allocation 的现有工程资产也暂时保留，不自动创建新的强制插件、不自动开启写入。
4. 四个 `apps/trading-stage-{sales,shipment,receivable,cash}` 只读合成插件已在 TR01B2D3 功能分支，不等于真实业务处理全部迁移。接着独立添加采购订单/收货 Package；原 `apps/trading-reference` 保持兼容与 CI，待另行验证迁移。
5. **所有交易插件均为多个独立 Package、Feature 与 Eidos Experience**，而不是将多步骤放入一个业务插件的不同按钮。Package 之间经由公开 Capability/事实引用组成链路。

## 已有与本次拆分范围

| 功能 | 现状 | 本次处理 |
| --- | --- | --- |
| Counterparty | 独立 Application 已有 | 复用 |
| Item | 独立 Application 已有 | 复用 |
| Warehouse | 独立 Application 已有 | 复用 |
| Data Import | 独立 Application 已有 | 复用 |
| Object Extension | 独立 Application 已有 | 复用 |
| Purchasing | 先前仅存在于 Trading Reference service | 独立 Package，不复制主数据或 Ledger |
| Receiving + reversal | 先前仅存在于 Trading Reference service | 独立 Package，冲销为 Feature/Operation 而非新插件 |
| Sales、Shipment、Receivable、Cash | 4 个演示独立 Package 已有 | 保留独立性；后续把真实业务操作逐项迁入各自插件 |
| Inventory / Cost | EVO 帐本导出和查询/派生读结果 | 在已有 BI/报表能力下组织 **Report/View**，不增建交易 Application 或写入引擎 |
| FIFO、Posting、Replay | 现有 EVO Ledger Runtime | 复用核心插件、不得复制 |
| Finance Owner/Allocation 信任工程 | 已有隔离只读演进 | 保留代码；非本次强制新增包，财务生产准入继续 OPEN |

## 不污染 Platform 的工程强制要求

1. 本次拆分新提交的业务代码**不得修改** `manager/server.ts`、`catalog/seed.ts` 或通用 Host 路由等核心文件。现有四插件 Preview 依赖的专用接线作为遗留债务登记，但不得追加。
2. `apps/trading-reference` 可以暂留兼容入口；业务操作最终由各个真实业务插件通过公共 Capability 驱动，禁止永久把单体入口作为产品总包。
3. 应用的 Package 不能通过 import 其他业务插件的私有服务连接；使用独立契约、稳定单据/事实 ID 和明确授权。
4. 不复制 EVO Ledger Runtime；Eidos Experience 原生声明和 Eidos 组件渲染，禁止业务插件自带 HTML/CSS/Shell。
5. 不因拆包而启用任何未被批准的写入：合成页面一律 SYNTHETIC/READ-ONLY/NOT_CERTIFIED；真实业务写入迁移需要分离授权的增量 PR、回归和用户验收。
6. 对现存参考流程、Agent/2D Designer 独立线、`project.status.json` 和自动生成 HANDOFF 零侵入。
7. 提交应包含 **按 PR base 对比的 Core 变更为零** 门禁和明确说明：代码可安装/渲染的证据不等于已有生产执行链路。

## 阶段收敛验收

A. 现有五个基础插件仍各自安装/启停，来源单一；B. 六个采购、收货、销售、发货、应收、收款包均明确独立，具有自己的 Feature 和 Eidos 表达；C. Inventory/Cost 通过报表读取 EVO 结果，FIFO 不迁移；D. 新 PR 不修改 Host Core；E. 真实采购/销售写入从 Legacy Reference 迁移之前不宣称生产已完成；F. B2D3 财务准入仍开放。

**禁止回填旧文档的“Cost/Valuation Owner 另建强制插件”“Inventory 独立交易插件”“企业账本不是插件”等已被用户纠正的推断。**

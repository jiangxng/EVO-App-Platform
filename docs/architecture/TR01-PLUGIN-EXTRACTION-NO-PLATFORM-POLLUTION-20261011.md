# TR-01 插件化收敛边界与平台零污染审查（2026-10-11）

**性质**：明确已批准的架构边界与可拆包候选；不变更 Platform Core / EVO runtime / 生产权限；不等于所有候选已实现。所有旧代码保留，禁止直接按此清单删除或大规模搬迁。

## 唯一最高架构权威（必须先读）

- EVO 2026-09-24 **ACCEPTED** [Minimal Runtime Plugin Boundary](https://github.com/jiangxng/EVO/blob/main/docs/architecture/decisions/2026-09-24-evo-minimal-runtime-plugin-boundary-v0.1.md)：EVO Ledger Runtime 是**轻量可安装核心运行时插件**，具备 BusinessData、Posting、Ledger、Balance、recalculate/clear/export。不是 App Platform 内部库。
- EVO **ACCEPTED** [Repository vs Runtime Scope](https://github.com/jiangxng/EVO/blob/main/docs/architecture/decisions/2026-09-24-evo-repository-vs-ledger-runtime-scope-v0.1.md)：EVO 仓库存放更广泛工程资产，但这些不是 Ledger Runtime Core；禁止为“满足平台接入”在 Platform 重写 Ledger Runtime。EVO 代码只可通过公开版本化契约和独立插件接入。
- [Foundation Object Architecture](../architecture/FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md)：基础对象三个域独立、Data Import 和 Object Extension 独立通用 Application；Enterprise Context 是持久资源容器，不应吸收业务解释。
- [Extension Boundary Constitution](../architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md)：Platform 负责通用安装、生命周期、授权、Capability、路由；Eidos 负责 UI；插件拥有业务语义。
- [TR01 Business Plugin Guard](../architecture/TR01-BUSINESS-PLUGIN-OWNERSHIP-GUARD-20261010.md)：2026-10-10 针对业务插件的静态局部 guard，不应替代 2026-09-24 Ledger 插件 ADR。

## 盘点口径：最多可形成多少个“有意义的插件”？

**现有的业务/基础对象分类**：Counterparty、Item、Warehouse/Location（3）；Data Import、Object Extension（2）；Trading Reference（1，保留为只读历史/跨插件验收编排样本）。已有 Ledger Manager Application、Runtime Configurator 配置资产；它们不是第二个 Ledger Runtime。

**从 TR-01 参考实现和阶段 Demo 识别的候选**（只计算语义边界，不假设已经生产化）：

| ID | 候选 Package 所有者 | 起始代码或证据 | 当前状态与处理 |
| --- | --- | --- | --- |
| P1 | Purchasing（采购订单） | `apps/trading-reference/purchase-loop.ts` | 候选正式 APPLICATION；原文件保留，未来再做可安装 Manifest/独立操作 |
| P2 | Receiving（采购收货） | 同上 | **可选**独立 Application；现阶段也可作为采购插件 Feature，不为数量硬拆 |
| P3 | Sales（销售） | `apps/trading-reference/sales-loop.ts`; B2D3 feature 的 `apps/trading-stage-sales/package.ts` | 已有独立合成只读演示 Package；生产写入未独立化 |
| P4 | Shipment（发货） | 同上; `apps/trading-stage-shipment/package.ts` | 已有独立只读演示 Package；生产写入未独立化 |
| P5 | Inventory（库存移动/Position 业务） | TR01 ledger-derived inventory | 可选独立 Application；不能复制 Warehouse 主数据或 EVO LedgerBalance |
| P6 | Receivable（应收） | `apps/trading-stage-receivable/package.ts` | 已有独立只读演示 Package；余额由 EVO 权威投影，不准另存影子应收账 |
| P7 | Cash Receipt（收款） | `apps/trading-stage-cash/package.ts` | 已有独立只读演示 Package；生产写入未独立化 |
| O1 | Cost/Valuation Engine | EVO `modules/cost`, `modules/valuation` | **EVO 侧候选插件**，不得直接并入 Ledger 最小 Core，也不得移入 Platform Core |
| O2 | Financial Allocation | EVO `modules/allocation` | **EVO 侧候选插件**；受限执行与现有只读 Finance Owner 协作，但不默认增加公开写端点 |
| O3 | Finance Owner Trust/Admission | EVO 独立只读 Owner + Platform Provider | 已有独立 Provider/受控边界；**不按一个技术功能强行造新的业务 Application** |

**明确不是新业务插件**：撤销/冲销（所属业务插件的不可变纠错命令）、FIFO 算法（估值 Owner 内策略）、Host 签名/TLS/nonce/key rotation/DB grants（安全基础设施）、Posting/Ledger/Balance/Replay（**一个 EVO Ledger Runtime 核心插件的一组 Capability**）、Eidos 页面适配器（Eidos 契约消费）。

**数量口径**：基于已实现/有代码候选，约 **3 个基础对象 + 2 个通用基础应用 + 7 个可分离交易 Application + 2 个 EVO 财务 Owner + 1 个 EVO Ledger Runtime 核心插件 = 15 个**可讨论的目标插件单元，其中 Receiving/Inventory 未必应单独安装，真实合理范围是 **13–15**。它是**整个目标集合**，并非“还需新建 15 个”。Ledger Manager、Template Store、Responsibility 等既有生态插件不计入该 TR-01 专项目标数量；Finance Owner Provider 可单独计入技术插件，但不可冒充业务模块。四个 stage 演示 Package 已实现在 B2D3 功能分支、不是 main。

## Platform 零污染硬门槛（适用于后续实现 PR）

1. **禁止新增任何账本计算**到 `manager/`、`catalog/`、`providers/` 或 Platform 通用 `contracts/`：不得复制 EVO Ledger/Posting/Replay、成本或核销业务实现。
2. **禁止为一个插件增加硬编码业务分支**：应用特性通过自己的 Package/Feature/Capability/Contribution 声明；Host 仅有必要的通用发现/绑定，现存 `manager/server.ts` 和 `catalog/seed.ts` 中 TR-01 专门接线是需审计的技术债（只审计、不盲删）。
3. 应用包可独立安装、启用、停用、版本化、测试；不可跨包直接 import 别的应用私有代码；共享只允许版本化公共契约与无业务语义 adapter。
4. 所有 UI 使用 Eidos 公共标准模板；不得为此增建业务 HTTP 服务、自定义 shell/CSS。
5. EVO Ledger Runtime 必须以 EVO repo 的既有实现为唯一权威：Platform 只能消费 `evo.business-data.submit`、`evo.posting`、`evo.ledger` 等公开版本化 Capability。不得在 Platform 重写任何一层、也不得默许 EVO 内高级 Owner 成为最小 runtime 的强制组件。
6. **兼容现有证据**：不删除 Trading Reference、原 Finance Owner、四个合成 demo Package 或历史 CI。先抽出合法所有权/可独立包，再迁移，验证后才有资格移除旧路径。
7. 业务插件 PR 必须给出“Platform Core 文件改动计数 = 0”；若不为零，原则上拒绝，只有公共协议确实缺能力的**单独 Platform PR**（独立审查、用户许可）可以改通用 Host。
8. 不修改 `project.status.json` / 生成 HANDOFF、Agent/2D 分支、不合并财务 Draft 到 main，不默许新增生产写入权限。

## 分阶段验收

- **P0 已有边界冻结**：架构文档和 CI 负控防止在 Platform Core 重新实现 Ledger；核实 EVO Ledger Runtime 核心插件的 Manifest/独立生命周期，不以 Configurator/Manager 代替。
- **P1 无 Core 改动收敛**：在 B2D3 feature 上逐一验证现有四个 Demo Application 的独立生命周期和无私有依赖；建立业务分包和 legacy reference 的迁移契约。发布生产真实写入另行 gate。
- **P2 采购链**：基于原采购事实形成 Purchasing（Receiving 是否独立，以部署/职责/权限差异决定），保持现有 PostgreSQL 业务回归。
- **P3 EVO-side Owner**：只在 EVO repo 精确增量拆分 Cost/Valuation 与 Allocation；最小 Runtime 不变；继续保持 `executionAllowed:false`，直到独立财务正式授权。
- **P4 Platform 核验**：检查业务插件更改对 `manager/server.ts` 和 `catalog/seed.ts` 是否为零；分别在插件 CI 与跨插件闭环 CI 验证安装、依赖、停用、重新启用、权限、重放及 Eidos 体验。

**不得把候选表写成“用户已批准每项独立新插件”或“这些插件已经开发完成”。**

# TR-01：采购与收货独立插件收敛（2026-10-11）

**目标**：承接用户已批准的“采购订单 / 采购收货是两个独立 Application 插件”，与现存 Sales / Shipment / Receivable / Cash 四个 Package 平级，保持 Ledger Runtime / FIFO 唯一归属 EVO。**本阶段是可安装的只读插件包和 Eidos 表现验收，不能冒充真实业务写入迁移。**

## 已确认的完整边界

- 已存在并复用：`apps/counterparty`、`apps/item`、`apps/warehouse`、`apps/data-import`、`apps/object-extension` 的 APPLICATION Manifest；不复制这些对象和导入平台。
- 已存在并复用：EVO 仓库内的 **EVO Ledger Runtime 核心可安装插件**；Posting、Ledger、Balance、Replay、FIFO 不在 App Platform 实施第二套。
- 保留 B2D3 feature 内四个独立只读 Package：`evo-trading-stage-sales`、`-shipment`、`-receivable`、`-cash`。
- **新增**：`apps/trading-stage-purchasing/package.ts` → `evo-trading-stage-purchasing`；`apps/trading-stage-receiving/package.ts` → `evo-trading-stage-receiving`。二者各有自己 Manifest、Feature、Capability、Eidos route/页面源、双语资源、合成业务对象，并可单独启停。
- 收货冲销（REVERSES）是收货应用自己的业务动作，不新增 `Reversal` 插件。真实业务写入与冲销沿用 `apps/trading-reference/purchase-loop.ts` 现有 CI 证据，不以只读演示页面取代。
- Inventory Position、Cost/COGS 是通过 EVO 公开账本/结果查询表达的**报表**，适合已有 BI Workbench/投影视图，不新建“Inventory 记账引擎”或“Cost FIFO 引擎”。
- 财务 Allocation、Finance Owner 等既有工程成果暂存，不自动变更财务写入门禁。

## 工程性质与限制

此 PR **仅修改插件/应用文件、插件专项 CI 与文档**，不改 `manager/server.ts`、`catalog/seed.ts`、`contracts/package.ts`、任何 Platform Core 业务分支，也不修改 EVO、Eidos、Agent/2D、`project.status.json` 或自动生成的 HANDOFF。

新增两个 Package 通过既有通用 `createPackageCatalog` / `createAppManagerService` 注入测试，真实安装、停用、启用、卸载与 Eidos 原生渲染均有测试。**当前通用 Host 正式 Catalog 尚未通过中立包加载方式发现新增两个包**，所以不能声称它们已经在线上 /store 出现；不能用“为了演示”作为改 Host 核心的理由。四个既有演示插件目前仍存在 PR #694 的特殊 Host 接线，**是遗留技术债**，后续另立插件发现机制 PR 收敛并保持兼容。

六个包目前 `demo.tr01b.*.read` 且没有声明不存在的业务写操作。真实采购 / 收货 / 销售 / 发货 / 应收 / 收款操作从 `trading-reference` 向独立插件迁移须以公开业务事实契约、有效授权、幂等/因果/回放、现有 PostgreSQL CI 为入场条件，完成前保留参考实现。

## 验收事实分级

| 检验 | 本 PR 能验证 | 本 PR 不能验证 |
| --- | --- | --- |
| 六个不同 Application Package、独立 Feature/双语 | 是（含原四个） | 生产写路径 |
| 新增采购/收货独立安装、启停、卸载、Eidos 展示 | CI 中的真实 AppManager/Eidos | 正式 Host /store 在线动态发现 |
| 采购事实/收货冲销/CNY125 ledger 结果 | 仅复用既有参考 CI；本 PR 不改 | 新包执行的真实账本变动 |
| 库存、成本报表 | 设计定位确定 | 新报表 UI/实时源验收 |
| Host Core 无新业务接线 | PR 对比和 CI | 历史四包已有接线已被清除 |
| 财务安全 | 原有 `executionAllowed:false` | B2D3 生产认证和 B2D4 财务执行 |

**下一步**：先通过 PR 专项 CI，再以合法插件包发现/加载契约接入 Host（这一步可能需要独立、经过架构批准的通用 Plugin Loader 改造）；业务真实操作分包另列独立 PR，严禁逆向吸收进 Host。
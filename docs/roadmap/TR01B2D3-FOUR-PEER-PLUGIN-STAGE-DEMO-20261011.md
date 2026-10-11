# TR-01B2D3｜四个独立业务插件收敛与 eidos 原生阶段演示

**阶段：工程预备（2026-10-11）。目标不是分离四块 HTML 卡片，而是四个可独立安装、启用、停用、卸载的 APPLICATION 插件。没有生产财务写入、没有部署至 main 或 Railway，B2D3 保持 OPEN / NOT_CERTIFIED。**

## 已确认的项目架构证据

1. [插件平台主线](../../docs/architecture/PLUGIN-PLATFORM-MAINLINE-v0.1.md)：EVO App Platform owns Package → Feature → Capability → Contribution / 生命周期。Eidos owns Workbench、Extension Manager、渲染和标准控件；`/store` 是正式插件平台入口。
2. [原生插件和外部集成边界](../../docs/architecture/INTERNAL-PLUGIN-AND-EXTERNAL-INTEGRATION-v0.1.md)：内部插件不能因为演示就变成独立网页/公共 HTTP 业务执行入口。
3. [真实现有实现](../../manager/plugin-store-page.ts) 和 [Eidos 平台集成测试](../../tests/integration/app-platform-eidos-plugin-platform.test.mjs)：Eidos `extension-manager` 有 install/enable/disable/uninstall，打开页面只通过已安装有效 Feature 加载。
4. [eidos 设计语言](https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md)：禁止插件重复创建 Shell、CSS、颜色体系、图标和自定义响应式断点。这里直接产出 Eidos `catalog-browser` contract，由 Eidos 自己渲染。
5. [既有内部 Finance Owner Provider](../../providers/trading-finance-owner/package.ts)：仅 `platform.service-provider` 只读验证能力；**不**向 Human/Agent 开放新的财务执行操作。这次不改 Finance Owner，也不把它硬连到演示假数据。

## 四个真实独立 Package

| 流程 | 独立 Package ID | 自有业务实例 / 接口 | 默认展示 |
| --- | --- | --- | --- |
| SALES / 销售订单 | `evo-trading-stage-sales` | `demo.tr01b.sales.read` / `/trading-stage/sales` | `DEMO-SO-1001`、USD 188.00 |
| SHIPMENT / 出库发货 | `evo-trading-stage-shipment` | `demo.tr01b.shipment.read` / `/trading-stage/shipment` | `DEMO-SHIP-1001`、关联订单 |
| RECEIVABLE / 应收 | `evo-trading-stage-receivable` | `demo.tr01b.receivable.read` / `/trading-stage/receivable` | `DEMO-AR-1001`、应收金额 |
| CASH / 收款 | `evo-trading-stage-cash` | `demo.tr01b.cash.read` / `/trading-stage/cash` | `DEMO-REC-1001`、USD 188.00 |

每个 Package 各自有第一方 Manifest、Feature ID、Capability、`eidos.experience`（独立 route/page source）、`eidos.localization-bundle`（zh-CN/en）。四个 Package **互不要求对方作为安装依赖**，独立操作生命周期；只有共同的只读业务关联 `DEMO-SO-1001`，不是重复复制 ERP/账本业务语义。

**收敛原则：** 各环节自己的合成样例/对象标识保留在自己的 `apps/trading-stage-<domain>/package.ts` 中，`apps/trading-stage/demo-kit.ts` 只复用 Presentation Adapter（标准 Eidos 页 + package manifest 的通用模板）和 Preview 环境门禁，不跨插件借用私有数据表、不抽出一个巨型“销售到收款”应用、不复制一整套 CSS。

## 在线演示应当怎样进行

1. 部署 **独立预览 App Platform Host**，复用已有 Eidos Workbench；需要有单独的预览访问地址，**不得覆盖**正式 `ledger-configurator-production.up.railway.app`。
2. 对独立 Preview Host 设置两个显式环境开关：`APP_PLATFORM_STAGE_MODE=isolated-preview` **且** `APP_PLATFORM_TR01B_STAGE_DEMO=enabled`。只有两个都成立时，四个演示插件才进入真实 Host Catalog 和 Eidos Page Assets；没有开关时，正式 Host 目录/页面均不暴露它们。
3. 由该 Host 的 `/store` 进入真实插件管理页面，依次安装 **销售订单**、**出库发货**、**应收**、**收款**。在每个插件内部打开由 Eidos 渲染的独立 read-only Experience。
4. 按共用业务订单号在四个页面观察对应独立对象，在 `/store` 停用 SHIPMENT 再尝试其原有页面，必须得到 `PAGE_NOT_EFFECTIVE_OR_NOT_FOUND`；其余三个仍可独立打开。重新启用 SHIPMENT，恢复可打开。
5. 最后展示 Finance Owner Provider 作为**单独内部插件**的治理状态和 B2D3 `NOT_CERTIFIED`；目前不能伪造真实 Host↔Owner 的验收记录。

页面只呈现明示 `SYNTHETIC`、`READ-ONLY`、`NOT_CERTIFIED` 的静态测试数据。此阶段**没有**真实订单创建、出库记账、自动派生应收、客户收款记账、真实 OAuth/Operator/EVO 只读事实核对；不可以称已经演示这些功能。

## 实现/验收

- `apps/trading-stage/demo-kit.ts`：统一 Manifest 与 Eidos Catalog Browser 的 presentation contract，Eidos 不变。
- 四个 `apps/trading-stage-<domain>/package.ts`：四个独立发行/生命周期单元。
- `catalog/seed.ts`：四个独立 page assets 在预览模式登记，由原生 `manager.loadExperiencePage` 在已安装/激活时返回。
- `manager/server.ts`：只有预览模式才把四个 Package 放入真实 Host Catalog；不新增自定义路由服务器或业务写入端点。
- `tests/protocol/tr01b2d3-four-peer-stage-plugins.test.mjs`：检验四包唯一性、互无硬依赖、Eidos manifest、中文/英文资源、可安装/停用/恢复/卸载、Eidos HTML 真渲染、对象引用和导航、off-by-default gate。
- `.github/workflows/tr01b2d3-four-peer-stage.yml`：真实编译、四插件生命周期、eidos 集成/体验规范、禁止财务执行。

## 重要的后续架构债务

原来 `apps/trading-reference/sales-loop.ts` 的 `SalesReferenceServiceV010` 仍将 **approveSalesOrder / shipSalesOrder / receiveCustomerCash** 放在一个 Legacy Reference service，真实 EVO BusinessData 的写入实现由既有受控 Adapter/账本规则处理。本 PR 不改变其真实写入语义，也不通过玩具数据“假装”已经解耦。将来产品化领域实现应把各插件的写入命令和存储边界分别明确，同时保留 EVO Ledger/Work 作为经济权威；需要独立研究、契约迁移与原有回归，不在本阶段演示中强拆原业务主线。

## 本阶段发布硬约束

- [已关闭错误 RawGitHack 演示 PR #690](https://github.com/jiangxng/EVO-App-Platform/pull/690)：独立 HTML 和 Railway Function 非产品插件，已撤回，**不要复活**。
- Railway 当前 Free plan 提示新资源额度满；**未创建新的线上 Preview Host**，这里交付的是正确原生插件代码和可回归演示准备，不能声称已有线上地址。
- 不合并 main、不改正式 Railway、数据库迁移、财务写和权限；不修改 `project.status.json`、生成型交接、不干预 Agent/Eidos/2D 其他线。

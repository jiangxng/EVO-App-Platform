# Plugin Lazy Resource Loading v0.1

**Status:** Active architecture authority  
**Date:** 2026-10-09; enforcement clarification 2026-10-15
**Scope:** Package/Feature discovery, activation, runtime initialization and browser resource loading

## 1. Purpose

EVO App Platform must remain small as the plugin portfolio grows.

The platform may discover lightweight package metadata broadly, but a user who has not installed or activated a plugin must not pay the runtime cost of that plugin merely because the plugin exists in the catalog.

Canonical principle:

> Discover metadata cheaply. Load implementation only when lifecycle and use require it.

This rule applies to first-party and third-party Packages alike.

## 2. Loading stages

```text
Catalog metadata discovery
        ↓ lightweight only
Package installed?
        ↓ no → no effective Experience / no runtime / no plugin state initialization
Feature active?
        ↓ no → no runtime / no plugin state initialization
Capability requires background execution?
        ↓ yes → initialize only the declared background runtime
Human/Agent opens or invokes an interactive capability?
        ↓ yes → lazy-load the corresponding implementation/runtime/surface
```

Installation and activation are authority gates. Usage is a resource-loading gate.

## 3. Host boundary

App Platform Host MAY eagerly own only generic mechanisms needed to discover and govern plugins:

- Package/Feature lifecycle state;
- lightweight manifest/Contribution metadata;
- authorization and request Context plumbing;
- generic Contribution aggregation;
- generic route/Capability resolution;
- generic runtime dispatch/loading mechanism.

Host MUST NOT eagerly initialize plugin-specific:

- PostgreSQL/database connections;
- durable plugin stores;
- business repositories;
- background timers/schedulers;
- network clients;
- large in-memory indexes;
- plugin page/query data;
- plugin-specific browser bundles;
- model/provider clients;

unless an active Feature explicitly declares a required background runtime.

## 4. Optional application rule

For an optional interactive APPLICATION Package:

```text
not installed
→ catalog metadata may exist
→ no effective navigation/route
→ no plugin runtime initialization
→ no plugin persistence initialization
→ no plugin-specific browser resource loading

installed + active but unopened
→ effective navigation/route may exist
→ implementation remains lazy where feasible
→ no heavy query/data materialization merely for discovery

opened / capability invoked
→ load only the implementation needed for that surface/operation
```

A plugin being first-party does not exempt it from this rule.

## 5. BI Workbench reference proof

`evo-bi-workbench` is the first normative reference:

- Workspace is an optional APPLICATION plugin in the BI / Insight Experience Layer.
- App Platform Host does not publish `/workspace`.
- If the plugin is not installed/active, `/workspace` is absent from effective Experiences.
- Browser bootstrap chooses from effective Experiences rather than assuming Workspace exists.
- Workbench runtime is dynamically imported only after the plugin is active and its page/action is used.
- PostgreSQL personal Workbench state is initialized by the plugin runtime, not Host startup.
- disabling/uninstalling the plugin disposes the runtime.
- Counterparty, Data Import, Personal Agent and future plugins contribute lightweight Workbench items without owning Workspace.

## 6. Contribution rule

A Contribution is metadata, not permission to load every implementation behind it.

Package contributions SHOULD remain declarative and cheap enough for lifecycle/navigation/capability discovery.

Consumers MUST NOT infer that because a contribution is discoverable, its owner runtime must be initialized.

## 7. Browser rule

Browser delivery follows the same principle:

- bootstrap only the generic App Host/Surface resolver needed for the selected surface;
- do not hard-code optional plugin routes as default startup destinations;
- load plugin/surface-specific modules only for the selected effective Experience;
- inactive/uninstalled plugins must not add browser route modules or UI bundles to the active dependency graph;
- mobile/read/task surfaces remain independently loadable where declared.

## 8. Background capability exception

Some active plugins legitimately require background work.

Such work MUST be explicit in Feature/runtime contracts and lifecycle-managed.

```text
interactive plugin
→ lazy by use

declared background provider/worker
→ may initialize on Feature activation
→ stops on disable/uninstall
→ resource budget/health/observability still apply
```

Do not convert ordinary interactive plugins into eager background services merely for implementation convenience.

## 9. Performance acceptance

For new optional interactive plugins, and changes to an existing plugin’s loading/resource boundary, architecture acceptance MUST prove the applicable items below. Existing violations remain tracked debt, not permission to copy them:

1. route/Experience absent when not installed or inactive;
2. plugin durable store/database is not initialized on Host startup;
3. heavy implementation modules are dynamically loaded or otherwise excluded from the cold path;
4. disabling/uninstalling releases runtime resources;
5. default browser routing still works without the plugin;
6. installing/activating restores the plugin Experience without Host-specific branching.

For high-cost plugins, future performance tests may additionally record cold-start bytes, module counts, memory, connections and initialization latency.

## 10. Permanent placement rule

```text
generic lifecycle + discovery + lazy dispatch
→ App Platform Host

plugin runtime + state + business/BI behavior
→ owning plugin

human rendering primitives
→ Eidos

plugin-specific browser surface
→ owning Experience/plugin, loaded on demand
```

The long-term target is not “zero metadata at startup.” The target is:

> The cost of adding installed-but-unused or uninstalled plugins grows primarily in cheap metadata, not in active runtime resources.


## 11. 项目根本约束：新增能力不能默认增加常驻业务负担

2026-10-15 用户再次确认：当前仍在建设初期，优先把原则落实到后续开发准入，而不是发现一个插件再修一个插件。本节补强既有权威，不建立第二套插件框架，也不把“规范已存在”当作“实现已合格”。

**平台负责管理和组合能力；业务插件负责业务实现。安装决定可用资格，启用决定有效能力，使用或明确后台触发决定资源创建。** Human、Personal Agent、外部 Agent、自动化和直接 API 均不得绕过这些边界。LLM 可以发现、建议和受控调用；安装状态判断、权限、加载、停止、事务和回执由确定性代码负责。

### 11.1 先区分四类成本

| 成本 | 允许条件与禁止事项 |
|---|---|
| 目录、清单、能力描述 | 可廉价发现；不得因 import manifest 或 barrel 间接创建服务、查询数据、连接数据库或启动任务 |
| 业务实现模块与实例 | 可选交互功能在合法首次调用后创建；不能把立即调用的工厂、立即执行函数或启动时 Promise 伪装成懒加载 |
| 连接、任务、订阅、缓存 | 必须有归属、作用域、创建触发和停止策略；停止失败要显式阻塞/重试，不能只隐藏入口 |
| 分发包与浏览器资源 | 同一部署中存在插件文件不代表插件已运行；浏览器按当前有效页面加载。宿主全量资源归档另行计量，不以删旧资源破坏已打开页面 |

安装 7/16 包都观察到 362 个项目模块，是定位耦合的线索，不是“362 个均违规”的判据。核心机制和轻量清单可共享；必须结合模块职责、构造调用和实际资源判断。计数不变可能掩盖新副作用，计数增加也可能只是廉价清单。禁止以减少数字代替正确行为。

### 11.2 职责放置与依赖

- Host 常驻部分限于必要的通用治理机制：可信身份/上下文、授权、目录与生命周期、路由/能力分派、受管资源入口。业务仓库、默认业务规则和某个应用的工作流不能以“大家可能会用”为由放入 Host 启动链。
- 包粒度依独立替换、可选依赖、配置/权限或生命周期价值决定；没有 UI 的后台插件合理，普通内部算法无需另建可安装包。
- 清单与运行时分离；通过既有公开契约、Capability/Provider 和作用域资源容器取得依赖。不直接 import 其他插件私有实现；不得为解决初始化顺序另建影子存储、第二套加载器或第二套授权。
- 通用安全服务不能为了降低启动数字而移除。保护服务不可用时拒绝受保护调用，不回退为演示身份或放宽权限。
- 声明的后台插件可以在启用后启动；配置了 interval 并不足以自动取得后台运行资格。Host 独立治理任务必须说明为何属于必要宿主机制、配置范围、资源预算和停止责任；未知归属先核对，不能擅停合规/保留任务。

### 11.3 每次资源相关变更的准入材料

在该插件已有说明、测试和 PR 中提供以下最小事实，不要求每个函数新建文档：

| 必答项 | 必须提供的内容 |
|---|---|
| 归属与依赖 | package/feature/capability、调用者、公开契约；属于 Host 时说明为何不能留在插件 |
| 装载触发 | 未安装、停用、启用未使用、首次使用分别发生什么；后台模式的明确启用条件 |
| 资源与隔离 | 实例、连接、定时器、订阅、缓存、持久化；process/package/enterprise/person 等实际作用域，禁止无意全局单例 |
| 并发与恢复 | 并发首次调用只创建预期数量；加载失败可安全重试；停用期间禁止新调用，迟到初始化必须处置 |
| 停止与数据 | drain/cancel/拒绝停用策略、有限期限、失败状态、重启恢复；卸载不自动删除业务数据 |
| 验证与预算 | 实际测试入口、资源计数或 spy 证据、适用预算；不可测部分明确列出，不能填“CI 全绿所以满足” |

这些是新增代码的交付义务。历史债务不能充当新代码模板；修复按 owner 分批进行，不能把一次性全仓重写变成所有业务开发的前置。任何例外必须记录归属、原因、范围、验证和退出条件，不能仅扩大基线使 CI 通过。

### 11.4 必须验证的行为矩阵

新插件及受影响的资源边界复用现有契约和测试设施，补充对应实例/资源的断言：

| 场景 | 验收结果 |
|---|---|
| 未安装 / 已停用，启动及请求 | 不创建该业务资源；入口拒绝；授权失败不得触发运行时初始化 |
| 已启用但未使用 | 交互插件不创建重型资源；后台插件只启动已声明且允许的任务 |
| 首次调用 / 并发调用 | 使用正确作用域实例；不重复连接/订阅；原业务结果保持 |
| 停用与调用/加载竞态 | 新调用拒绝；在途操作按明确策略结束；迟到实例释放；不得悄悄继续后台工作 |
| 停止失败 / 重新启用 / 重启 | 状态可解释和可恢复，不静默假装停止；保留需要的数据与正确隔离 |

这是验收要求，不表示这些断言已经覆盖全部插件。业务 WRITE 涉及在途或未知结果时，应复用对应 owner 的持久执行/冻结合同；不能由本专项的内存 dispose 替代跨进程事务保证。

### 11.5 CI 当前覆盖与剩余缺口

| 防线 | 当前可证明 | 不能据此宣称 |
|---|---|---|
| `tools/lightweight-host-validate.mjs` 与既有基线 | 从 server/catalog 沿已识别的静态、require、顶层动态 import 和直接 IIFE 追踪业务依赖；基线只缩不增，转导出不能隐藏新增依赖 | 不做完整跨函数调用图分析；已加载文件里新增构造、I/O、定时器不一定增加依赖边 |
| `tools/plugin-loading-audit.mjs` | 四种隔离启动组合的 dist ESM、global interval 和文件证据；启动退出、零捕获 TCP 出站、指定停用 Feature 保持属于阻断断言 | 模块数/文件数/定时器数目前主要是观察指标；不是逐插件资源白名单、全副作用拦截或长时间后台验证 |
| 工作流内已有 lazy/lifecycle 测试 | 对已接入模块验证首次调用、并发、停止、重试等具体行为 | 单 Provider 通过不代表全部应用/Provider 已接入；不证明生产效果 |
| 变更 owner 的资源回归 | 新增/迁移资源必须按上表提供可执行断言，在对应 CI 运行 | 目前没有自动验证所有 PR 资料真实性或所有资源覆盖的通用认证器 |

本次补上直接 IIFE 的静态识别与回归，继续使用既有 Lightweight Host CI，不新增测试平台。对于命名工厂调用、回调触发、既有模块内副作用，不能用“静态检查绿”免除 owner 的行为测试。后续动态门禁应按已核对的模块职责和资源归属逐项加入明确断言，先防新增、再收缩债务；不把当前 362/612 或 RSS 设为永远允许的总量阈值。

### 11.6 既有债务与执行顺序

[2026-10-15 审计](../plans/platform-governance/PLUGIN-LOADING-AUDIT-20261015.md)保留实际证据。A01 仍为部分完成：

1. 本批先落实根本原则、开发入口与 CI 覆盖说明，阻止把不合规方式继续复制。
2. 下一批迁移既有账本兼容服务，按上述矩阵证明未用不创建、首次使用等价、配置状态保持；复用原算法和入口，不增新 Provider。
3. 基础对象构造由基础对象/BEX owner 协作；记忆调度由 Host/Agent owner 明确归属；资源归档独立处理版本兼容。不抢占其他专项或因原则文件扩大本轮产品范围。

本批基线：main `c2558c5077e10a4985c79a190cd7e65958771a02`，已合并审计 PR #914。来源为本仓架构/治理文档及工具原文；本节工程要求是针对用户目标的项目决定，不冒充新增外部研究或全部实现完成。

# A01 基础对象装载：消费者、存储归属与整改边界

日期：2026-10-16。核对 main：`5d06b0a45f3cfcd6a1ae252e8e3db03217a65db7`（#954）。
状态：初批代码审查与实施边界已记录；随后实施增量见第 7 节。不代表基础对象已全部按需装载。
入口：[固定任务状态表](CLOSEOUT-COUNTDOWN.md)。沿用 A01，不新增治理任务，不接管 BEX/Agent。

## 1. 结论和证据级别

**需要修的是 Host 对业务实现的提前装配及跨能力过度装载，不是另建基础对象存储，也不是把共享功能合成一个必装大插件。**

本批源代码确认：

- `manager/server.ts` 在创建 manager 前构造 Counterparty 的五个仓库、投影服务，以及 Responsibility、Object Extension 定义/值、Data Import Job/Recipe 仓库。对应实现仍被静态导入。
- 检查这些工厂的构造部分，主要返回捕获共享资源仓库的方法；投影在 `read` 时查询。不能把这些构造描述成已经建立十个数据库连接或执行十次数据加载。
- 通用 `providers/enterprise-context/resources.ts` 的文件仓库构造创建 read/write 闭包；读取、mkdir、临时文件写入及 rename 位于调用路径，不是构造即创建全部业务数据。内存实现保存自身 snapshot。
- Object Extension 四个命令共用的 lazy handler `load` 无条件调用 `resolveEffectiveDataImportTargetsV010` 并构造导入服务。因此普通扩展定义 list/upsert/archive 的首次装载，也会装配所有当前有效导入目标，不仅是批量导入建字段命令。这是有代码依据的过度装载路径，不是重复插件的证据。
- `resolveEffectiveDataImportTargetsV010` 会解析所有有效 contribution；它按 ref 缓存 Promise、清除已失效 ref，但没有在 rejection 时删除仍有效 ref，也没有等待完成后的生命周期复核。现有 Item/Warehouse resolver 同样不能直接当作完整竞态处理模板。

以上是源码事实。本批未重跑启动审计、未测 RSS/耗时、未操作真实企业数据。历史 362 和 #922 的 356 模块是各自基线的测量值，不是本次 #954 实测，更不能直接算成同基线性能提升。

## 2. 实际消费者与归属

以下路径均相对仓库根；server 位置以函数/命令为锚点，避免行号随并行开发失效。

| 实例/语义 owner | 真实消费者（本次核对） | 存储与整改约束 |
|---|---|---|
| Counterparty subject/role/contact/address/profile，`apps/counterparty/{repository,roles,facets}.ts` | server 的 Counterparty 动作和目录/详情/编辑页面；投影；`resolveEffectiveDataImportTargetsV010` 的 Counterparty adapter | `evo.counterparty`，所有 adapter 继续使用同一 EnterpriseResourceRepository；不把客户/供应商规则移入 Host |
| Counterparty projection，`apps/counterparty/projection-service.ts` | My Customers/My Suppliers 动作及投影页面 | 派生读模型；依赖对象、角色、职责及授权；不能用缓存替代当前权限 |
| Responsibility，`apps/responsibility/repository.ts` | 职责动作；Counterparty 页面/投影；Item、Warehouse 投影运行时 | `evo.responsibility/assignments`；跨对象复用，不能挂在 Counterparty 独有生命周期上 |
| Object Extension 定义，`apps/object-extension/repository.ts` | 扩展动作、导入建字段页、Counterparty 字段展示；Counterparty/Item import target | `evo.object-extension/definitions`；定义语义属于扩展应用，不属于 Data Import |
| Object Extension 值，`apps/object-extension/values.ts` | Counterparty 详情和 import target；Item/Warehouse projection；Item import target | `evo.object-extension/values`；保留 object/slot/namespace 寻址，停用管理入口不等于删除对象侧已有值 |
| Data Import Job/Recipe，`apps/data-import/{repository,recipe}.ts` | 导入动作与目录/映射/纠错/审核页面；Object Extension 批量建字段的 job 查询与 mapping 更新 | `evo.data-import`；Job/Recipe 不复制进扩展插件；导入 owner 负责提交、恢复和映射行为 |
| Data Import service/target resolver | 导入动作；目前所有扩展动作的 loader | service 是编排，目标由有效 contribution 提供；普通定义读取不应启动导入编排 |
| EC advisor，`apps/data-import/experience-advisor.ts` | 配置存在时注入 Data Import action handlers | 构造保存 URL/fetch；真正 post 内才创建请求计时器并 fetch。应随合法 advisory 调用装配，不声称启动即发请求 |
| EnterpriseResourceRepository，`providers/enterprise-context/resources.ts` | 上述适配器及其他企业资源能力；Agent sandbox 的文件权威冲突检查 | 通用企业资源容器可共享；不是 Counterparty 的私有仓库。不得为懒加载每个插件各建内存副本或并行文件写者 |

### Agent 的额外消费者不能遗漏

`manager/server.ts` 的 `optionalPa02ObjectExtensionOwner` 在明确 `OWNER_SANDBOX` 模式下调用 `manager/agent-pa02-sandbox-object-extension.ts`。后者：

1. 拒绝 production，要求隔离确认、指定 context/enterprise/schema；
2. 用共享资源仓库检查该 context 已有 Object Extension 文件权威，避免覆盖；
3. 创建独立 PostgreSQL atomic owner 并验证预建 schema；不在普通启动自动建表；
4. 后续授权/发现再次执行文件权威冲突检查。

这是显式 opt-in 沙箱路径，不是 Human 文件仓库已经切换为 PostgreSQL。#954 的物理 SQL fence 属于 Agent owner；本批只定位关联，不重新认证其 SQL 实现。后续懒加载不得删除冲突检查、替换 owner、绕过 PA05 写入门禁，或把隔离沙箱当作通用存储迁移。

## 3. 采用的方案与排除理由（工程决定）

| 方案 | 决定及理由 | 限制 |
|---|---|---|
| 保留共享资源容器，业务 adapter 按合法使用解析 | 采用；符合既有 Resource Container 与 Foundation Object 权威，保留寻址/事务/数据恢复 | 同进程可复用无用户状态的 adapter；所有方法仍显式传 context，不缓存某个人的授权结果 |
| 按能力拆开 loader，扩展管理仅在 import-create 时取得导入依赖 | 作为下一代码批次；最小可核验切口，先消除真实跨能力过度装载 | 保持 action metadata、权限与 handler 结果；不顺手重写 UI 或映射算法 |
| 一次性把全部基础对象做成大 runtime | 排除；读取一个能力仍可能创建全部，掩盖独立 owner/生命周期 | 只有同 owner、同依赖和生命周期的内部实现适合组合 |
| 每个插件各建 EnterpriseResourceRepository | 排除；内存实例会形成独立真相，文件多写者/事务边界风险不能用懒加载掩盖 | 存储替换是另一个有明确迁移/单写者合同的任务 |
| 停用扩展管理即清掉定义/值或让所有对象读取失败 | 排除；管理能力资格与既有企业数据存在不同 | 哪些运行时读能力必须依赖 active feature，需按现有公开合同核对，不能自行扩大或削弱访问 |
| 只减少模块数或静态基线 | 排除；已经加载的模块内仍可能新增副作用 | 模块禁入断言配合实例/资源 spy；同时验证业务行为 |

## 4. 有界实施顺序与验收

这是 A01 内部执行顺序，不承诺三个 PR 就关闭整个 A01。

### 下一批：扩展管理不连带装配导入引擎

修改范围限于 Object Extension handler 的依赖装配与对应测试。先读 `apps/object-extension/actions.ts` 中每个命令实际用到的 callback，将导入依赖延迟到 import-create 的合法调用路径；复用已有 service/target contracts。不得全局修改 action router 来绕过检查。

验收：

- list/upsert/archive 与 import-create 分别调用：前三者不加载 Data Import service/目标实现，后者仍使用原 Job/Recipe 和 mapping 更新。
- 未安装、停用、未授权请求不触发这组新增依赖；检查实际鉴权顺序，不能仅因用了 lazy handler 就声称授权前零初始化。
- 正常批量建字段与应用 mapping 的业务结果保持；保留 Human 审批、数据 scope、回滚和已有幂等约束。
- 导入依赖加载失败可重试；等候期间停用后不得开始业务写入。缓存不能把旧有效目标永久带入后续执行。
- 不改变前端交互、公共命令/错误合同和 Agent SQL owner；若必须改变共同合同，先在同一 PR 明确影响再实施。

### 随后：迁移业务 adapter 和投影构造

从 Counterparty 独有装配开始，复用其原仓库/投影算法；共享 Responsibility、Extension 的作用域与读/管理生命周期分别处理，不挂靠某一个对象。并发首次使用共享 pending；失败清除；重新启用可恢复；保存的企业数据不随实例销毁。真实连接/订阅出现时必须增加 disposer，不能因当前只是闭包而永久省略停止策略。

保留 `EnterpriseResourceRepository.transaction/putMany` 的原边界；不要在同步 transaction 回调里引入跨 await 写入。Item/Warehouse 与导入适配器必须取得同一存储权威。

### 验证入口和防回归

| 验证层 | 复用入口 | 新增的必要断言 |
|---|---|---|
| 命令/导入回归 | `tests/protocol/object-extension-capability.test.mjs`、`data-import-counterparty.test.mjs`、`data-import-recipe.test.mjs` | 命令结果等价、导入回调只在需要时解析 |
| 目标生命周期 | `tests/protocol/data-import-target-lifecycle.test.mjs` | 拒绝缓存可重试，停用竞态不执行旧目标 |
| 对象/跨对象 | `tests/integration/counterparty-plugin.test.mjs`、`tests/protocol/cp04-responsibility-projections.test.mjs`、`it01-item-data-import.test.mjs` | 重启/重装数据保留，隔离和权限不退化 |
| Host 冷启动 | `tools/plugin-loading-audit.mjs` 与现有 Lightweight Host CI | 迁移后逐个添加已确认业务实现的禁入断言；保留廉价清单，不盲禁共享安全契约 |
| 新增装配行为 | 在对应 owner 测试中 spy factory/资源调用 | 未用零构造，并发只构造一次，失败恢复；不能仅测源代码含有 import 字符串 |
| Agent 兼容（触及相应 glue 时） | `tests/agent-line/pa02-host-server-sandbox-object-owner.test.mjs` 及 PA05 owner 回归 | opt-in、文件冲突拒绝、现有 fence 不被绕过；不冒充生产认证 |

本批仅记录这些测试入口，没有执行它们；后续按真实改动选择运行，不以完整测试清单扩大工作范围。

## 5. 并行工作及未决问题

本次查询开放 PR 为 #909（BEX 设计 Draft）、#878（批量扩展审查）、#846（BEX 交接 Draft）。读取时 main 已含 #954。代码批次开始前必须重新检查，尤其 `manager/server.ts`、`apps/object-extension/actions.ts` 和导入页；本批只编辑本专项文档，不替其他窗口合并或覆盖。

仍待实施验证：共享扩展/职责能力在消费者停用后的精确运行策略；所有入口的鉴权与装配顺序；目标 resolver 的失败/停用竞态。文件存储并发能力和全量资源归档成本不在本批改写。记忆调度归属仍交 Host/Agent 核对，不为了数字擅停任务。

## 6. 阅读范围与保存

- 完整读取：本仓 AGENTS、交付/整体理解规则、开发交付规范、治理 README/固定表/审查入口、`PLUGIN-LAZY-RESOURCE-LOADING-v0.1.md`、`ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md`、`FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md`。
- 定向读取：server 的上述构造、消费与 Agent sandbox 入口；仓库工厂构造及资源操作；lazy handler；资源持久化；`LLM.md` 的基础对象/装载章节。没有声称通读整个 server 或全部 Agent 实现。
- 连续性核对：project.status 与 foundation-map 的当前里程碑/基础对象字段、生成 handoff 的当前里程碑及已闭环入口。它们仍含早期 TR 快照；本专项不覆盖其他 owner 的全局状态。
- 未新增外部网络研究；资源容器文档引用的外部产品网址只是继承引用，本批没有访问原文，不算新研究证据。
- 本文与 README/固定表一起保存。代码核对基线见页首；最终 PR、提交、CI 和过程分支清理状态由本 PR 记录。未部署。


## 7. 实施增量：扩展管理与导入装配分离

实施基线 main `fbe367794445fab8a9eff08de9913f9b1d68b5f9`（#956）；前六节保留首次审查证据与当时未执行事项。

- `apps/object-extension/actions.ts` 增加可选 `resolveImportServices`，原同步 callback 输入继续兼容。普通 list/upsert/archive 不调用 resolver。import-create 先验证上下文、管理权限、jobId 和目标；随后每次请求解析依赖，等待后重新检查管理权限、可用性并重新读取 Job。单字段 crypto await 后再次检查，再沿用原字段创建和映射算法。
- `manager/server.ts` 的 handler loader 不再直接创建导入服务/装配 targets；通过上述回调在合法导入请求内装配。回调在等待前后检查扩展 Feature 和目标是否有效，应用 mapping 前再检查。服务是请求级无连接编排对象，不缓存用户权限；已有 target factory Promise 继续共享，失败时移除对应 Promise，避免一次加载失败永久阻断后续调用。
- 未改企业资源仓库、namespace、公开命令、UI、PA05 SQL owner、全局 action router 或写入授权流程；原批量回滚/单字段重试合同由原算法维持。

### 验证与限制

新增 `tests/protocol/object-extension-import-lazy.test.mjs` 8 项行为测试：普通 CRUD 零解析；停用/未授权/无上下文/无效 Job 零解析；单字段和批量成功；等待期间权限撤销/停用拒绝且可恢复；依赖失败可重试；等待期间 Job 已提交则零字段/映射写入。使用真实 action/router 与内存企业资源仓库，resolver 和生命周期状态为可控测试依赖，不冒充真实 Host HTTP 或生产数据验收。

本地 build、43 项相关回归、静态轻量门禁、连续性检查通过。新增 8 项进入既有 Lightweight Host CI；静态依赖边仍为 288，没有通过扩基线换取通过。最终 CI/合并提交以本 PR 记录为准，未部署。

本次没有把 Data Import service 从 Host 静态依赖图彻底移除，也没有迁移此前的基础对象仓库构造。有效 import-create 仍复用现有“解析所有有效目标”的合同；更细的目标按需解析及完整生命周期代际隔离未在本批声称完成。组件测试证明 resolver 失败重试；底层 factory 缓存失败清除同时有代码修正，未用故障注入覆盖所有真实模块加载错误。数据持久化和跨进程在途 WRITE 安全继续属于原 owner。

下一步仍是第 4 节的业务 adapter 迁移：先 Counterparty 独有装配，复用共享存储并验证跨对象消费者；资源归档、记忆调度归属未关闭。A01 保持部分完成，固定 7 项仍为 4 闭环、3 部分完成。


CI 集成修正：首轮 `Agent PA-02 Host Async READ Execution`（run `38831809969`）两项测试返回 BLOCKED：`pa02-host-async-read-execution.test.mjs:101` 预期 SUCCEEDED、`pa02-worker-cooperative-release.test.mjs:72` 预期 PAUSED。二者都把新 Run 的创建时间写死为 2026-10-13，Worker 使用真实当前时间和既有 72 小时期限；2026-10-16 已跨期限。仅将这两个新运行/租约测试的夹具时间改为本次测试时间；生产 deadline、权限和 Agent 代码不变，不通过放宽预算或跳过测试解决。最终 PostgreSQL CI 结果以 PR 记录为准。


## 8. 实施增量：Counterparty 独有业务运行时按需创建

基线 main `c85ecb643ff89d0b1ed32d953bb5a1902f342cef`（#958）。本节继续 A01，不新增 Provider 产品或第二套生命周期框架。

### 归属、触发及兼容

- `apps/counterparty/runtime.ts` 装配原 subject/role/contact/address/profile 仓库和原 projection service；注入原 EnterpriseResourceRepository、共享 Responsibility 和授权解析器，不另建文件/内存存储。
- `manager/counterparty-runtime.ts` 复用既有 `createLazyProviderRuntimeV010` 的首次并发共享、失败重试与停止机制，仅提供 Counterparty 的装配入口；动态 import 完成后检查启用/停止状态才构造业务实例。
- Host 的普通对象动作、投影动作、对象页面及导入 target 改用同一运行时。管理动作先验证企业上下文和管理资格，再解析仓库，等待后重新验证管理资格及可用性。Host 原 Capability/Feature preExecute 保持；原直接注入仓库/投影 service 的调用兼容。
- 资源标识常量移至现有 `constants.ts`，`repository.ts` 继续兼容转导出。`foundation-object.ts` 读取轻量标识，不再为获取 schema/resourceType 导入整个 repository。
- 未安装、停用、启用未用不创建业务实例；首次合法使用创建。停用/卸载清理运行时引用及 Counterparty import-target 缓存，重启和重新安装继续使用同一企业资源寻址。

### 作用域与停止限制

实例为进程级无用户状态 adapter，数据访问仍逐次带 contextId；没有新增数据库连接、定时器、订阅或业务缓存。共享资源容器和 Responsibility/Extension/Import 的既有实例不在本批销毁。

既有 lease 在本适配器中保护初始化与获取实例，不是业务事务锁。实例交出后的业务操作、原投影授权和跨进程 WRITE 仍走原合同；Node 模块缓存不会卸载。禁止据此宣称已证明所有入口停用时的在途业务取消，或以 adapter stop 替代 PA05 的冻结/回执机制。旧引用不是私有数据副本；此批没有添加后台资源，后续若引入连接/任务必须重新审查整个操作生命周期。

### 验证及防回归

- `tests/protocol/counterparty-runtime-lazy.test.mjs` 新增 6 项：停用/启用未用/管理拒绝零构造；并发首次调用共用仓库；原命名空间与企业隔离；停用恢复和文件仓库重启保留数据；装载期间停用并立即重启仍拒绝迟到构造；加载失败重试；等待期间撤销管理资格零写入（相关场景合并在六项测试内）。
- build 与 48 项定向回归通过，包含原 Counterparty、facet、投影、Data Import、Item 导入和共享 lease 回归；没有仅用源码字符串冒充业务验证。
- 静态依赖边从 288 缩至 279，移除 9 条，无新增边。保留原轻量清单与安全契约。
- `tools/plugin-loading-audit.mjs` 在四种未用启动组合新增 `runtime/repository/roles/facets/projection-service` 明确禁入断言，接入现有 Lightweight Host CI。不是把当前模块总量设为永久上限。
- [本地四组合原始证据](evidence/counterparty-lazy-audit-20261016.json)：7/16 包组合均为 353 个 dist ESM 模块、628 个归档文件；五个目标业务模块均未加载，捕获出站为零、退出码为零。记录源码哈希和 Node 版本。这是带探针的隔离冷启动证据，不是生产性能结论；不得把此前不同 main 的 362/356 直接减成优化收益。
- 六项新测试和冷启动断言进入现有 CI。真实浏览器/跨项目验证及最终 head/合并状态见本 PR，未执行部署。

### 余项

本批关闭的是 Counterparty 独有构造债务。共享 Responsibility、Object Extension、Data Import 构造，全部有效导入目标的过度解析、资源归档策略及记忆调度归属仍未全闭环。下一有界动作优先核对共享扩展/职责的按需装载及消费者生命周期，不扩大到新 Provider 试点。A01 仍部分完成；固定总数 7，4 闭环、3 部分完成。

## 9. 实施增量：共享职责按需装配与消费者停止边界

日期：2026-10-17（香港）；基线 main `2532f537f229936cf9275aeafc9c7dbb66e71707`，接续 #975。本批仅迁移 Responsibility，不改 BEX 导入草稿或 Agent 契约。

### 决定与真实依赖

Counterparty、Item、Warehouse 的真实 package manifest 都 requires `enterprise.responsibility`（实际常量以 constants 为准）。职责不是其中任一对象的私有实例。采用职责自身 Feature 控制的共享按需适配器；不能在停用某个对象时把共享职责仓库一起停止。既有 manager 会阻止在任一消费者仍活跃时停用所需 capability provider；新增测试使用三个真实对象 manifest 验证此行为，只有无关的通用资源/目录 provider 使用夹具。

Object Extension 与之不同：定义管理入口和对象既有值的读取不等同；此批不把其生命周期硬挂到职责上。开放 #999 正在做 BEX 草稿，不编辑其页面、batch action、导入 Job 数据模型。扩展/导入其余构造债务保留，不将延期说成完成。

### 实施与资源边界

- `manager/responsibility-runtime.ts` 复用既有 lazy lease；只在首次合法管理或有效对象消费者调用时 import 原 repository 并用同一 EnterpriseResourceRepository 构造。未用不创建，首次并发共享，失败可重试。没有新 Provider 包、新加载框架或新存储。
- 仓库方法仍同步执行。包装后的每个 list/get/assign/archive 在使用前检查 Feature、停止状态及实例代际；停止立即使旧引用失效，恢复后旧引用也不能复活。数据继续以 contextId 隔离，原算法、namespace、archive 和持久化保持。
- 职责动作先检查企业上下文/管理资格，再等待仓库，等待后复核资格；旧直接注入仓库的 API 兼容。
- Counterparty 接受异步依赖解析并在等待后复核自身状态；Item/Warehouse 先解析职责再创建各自运行时，避免职责加载失败污染它们的原 Promise 缓存。页面在原企业上下文和授权链内获取职责。各对象自身的生命周期及原安全判断保留。
- 职责停用/卸载和 Host 正常停止清理职责实例；各对象停止不清理共享实例。adapter 不持有连接、后台任务、用户权限缓存；停止不是模块卸载、数据删除或 PA05 跨进程写事务取消。将来引入异步资源时必须扩展操作级 drain/dispose 证明。

### 验证与限制

新增 `tests/protocol/responsibility-runtime-lazy.test.mjs` 8 项行为测试，覆盖未用零创建、并发共享、企业隔离、文件恢复、旧引用永久失效、停用/恢复与加载竞态、失败重试、权限撤销零写入、合法 assign/archive、对象停止不影响其他消费者、真实 manifest 依赖阻断，以及 Counterparty 等待共享依赖时停止不得迟到构造。不是全平台生命周期认证。

上述测试加入既有 Lightweight Host CI。静态基线从 279 缩至 277，只删除两条职责实现依赖，无扩基线。冷启动审计新增职责 repository 禁入断言；原 Counterparty/账本断言保留。四组合原始证据保存在 [职责装载审计](evidence/responsibility-lazy-audit-20261017.json)，文件哈希标识实测工作树；相同模块总数不能否定目标实现已移出冷路径，也不能拿总数宣称性能收益。最终构建、回归数量、CI 与合并状态以本批 PR 记录为准；未部署。

阅读：本批完整复核整体理解规则、按需装载权威、本文；复用此前完整阅读的资源容器/基础对象权威和开发交付规则。定向读取 server 所有职责消费者、职责 repository/actions、三个真实对象 manifest 和 manager 依赖阻断实现；未声称重读整个 server 或 Agent 实现。无新增外部网络研究。

A01 仍部分完成，固定 7 项仍为 4 闭环、3 部分完成。下一步核对 Object Extension 的管理与对象读取依赖，再推进其按需构造；Data Import、归档和记忆调度缺口保持原归属。

## 10. 对象扩展：管理生命周期与业务数据访问合同

日期：2026-10-17（香港）。基线 main `ee73be8d8d4e1beb8986d326bd2133d244670f41`（#1000）。本批完成边界核对、消费者接口收窄和可执行兼容回归；**未迁移扩展仓库启动构造，不申报装载/性能收益**。

### 代码事实及架构判断

1. 三个对象 manifest 要求 Responsibility，但不要求 Object Extension 管理 Feature。扩展管理停用或卸载并不会通过现有 dependency manager 停掉这些对象。
2. `manager/server.ts` 仍提前创建定义和值两个 adapter。Counterparty 页面读取定义和值；Item/Warehouse 投影读取值；Counterparty/Item import target 读取定义并写入已有字段值。**不只是“只读共享数据”问题，也有已有 schema 下的业务值写入。**
3. 当前 target 没有创建/归档定义的需要，却要求完整的 `ObjectExtensionRepositoryV010`；两个投影只读值，却要求含 save/saveMany/archive 的完整仓库。它们还从其他应用的实现文件导入类型。这是不必要的接口耦合，不等于已发生越权利用。
4. 资源容器权威 §5/7/11 将语义 owner、授权访问和管理插件安装/卸载分开；基础对象权威 §8/9/19 要求扩展语义仍由 Object Extension 所有，跨应用按公共合同组合。由此决定：保留独立扩展管理应用，不强制所有对象依赖其管理入口，不把停用管理解释为清除数据或全面停止已有对象业务。**这是本项目的兼容决定，不是授权所有插件任意读写扩展 namespace。**

### 操作和生命周期矩阵

| 操作 | 当前入口/责任 | 后续装载与停止条件 |
|---|---|---|
| 创建、修改、归档字段定义 | Object Extension action；企业上下文及管理权限，Host Feature/Capability gate | 管理 Feature 有效且请求授权后创建管理 adapter；停用拒绝新管理操作 |
| 业务 schema 读取既有定义 | Counterparty/Item target、对象详情 | 按有效消费者及其上下文/权限获取只读合同；不因管理入口停用隐藏已有字段 |
| 读取已有扩展值 | Counterparty 页面、Item/Warehouse projection | 消费者有效、对象/字段授权仍有效；消费者停止不得影响其他消费者，保留数据 |
| 导入写入已有定义的值 | 原 Data Import action + 有效对象 target + 原校验/事务 | 资格属于原导入/业务入口，不给它字段定义 save/archive；不因管理停用自动删除原 mapping 或改写 schema |
| 卸载扩展管理 | lifecycle manager | 定义/值保留；重新安装继续附着原企业资源，删除必须另走显式数据治理 |
| Agent PostgreSQL opt-in owner | Agent/PA05 原 owner | 独立权威冲突、授权和 SQL gate 不变；本批不替其认证 |

表中“后续装载”是下一代码批次的验收要求，不代表所有入口已迁移或现场验证。对象自身停用、导入入口权限撤销及在途 WRITE 继续遵循原 owner 合同，不能用本批类型接口替代运行时权限检查。

### 已实现的最小修正

- 在已有公共合同 `contracts/foundation-object/extension.ts`、`extension-value.ts` 中增加 definition reader 和 value reader；不另建通用框架、Provider 或存储。
- 原定义仓库和值仓库继承相应 reader，完整管理/写值 API 保持兼容，读方法签名单一来源。
- Counterparty/Item import target 改为依赖公共 definition reader；Item/Warehouse projection 改为依赖公共 value reader。业务算法、事务、UI、Host 启动、namespace 均未改。
- **接口收窄是编译期依赖约束，不是 JavaScript 沙箱或撤销原对象上的方法。** Host 当前仍可注入原完整仓库；下一批运行时装配应只交付所需接口。不得以此声称已经隔离恶意插件。

### 选择与排除

采用“定义管理、定义读取、业务值访问分别约束”的方案，因为当前已有真实跨对象消费者与稳定数据，无需另造产品。排除：直接复用职责的单一 Feature 关闭开关（会破坏已有字段读写）；给每个对象强制依赖管理插件（改变安装/停用语义）；各对象各建存储（破坏企业权威）；全量搬迁并顺手改 BEX 草稿（与开放 #999 重叠且扩大范围）。未来若需要禁止一切扩展业务，应另有明确的数据访问政策，不能借装载重构悄悄实现。

### 验证、读取和接续

新增 `tests/protocol/object-extension-consumer-boundary.test.mjs`，两个真实生命周期组合（停用、卸载）验证：Item 保持有效；管理 action 被真实 router 拒绝；target 只拿 list/get 的对象仍能描述 schema 并完成已有字段导入；定义资源完全不变；值按企业隔离；恢复管理后仍需管理权限，原值保持。复用真实 manager、仓库、target 和 Data Import service；只为通用资源/目录 provider 使用夹具。**这是组件组合回归，不是实际 Host HTTP、浏览器、生产权限或真实客户导入验收。** 测试进入既有 Lightweight Host CI，原跨对象导入/投影/权限测试继续执行。最终数量与 CI/提交见本 PR。

已完整复核基础对象权威；资源容器权威沿用第6节既有完整读取记录，本批重点复核 §5–11；定向读取 server 全部扩展实例消费者、两个 import target、两个 projection service、扩展 repository/values/actions 与三个 package manifest。规则与装载权威复用此前完整读取；没有把搜索命中当作全仓阅读。未新增外部网页研究。未触及 #999 的 BEX 页面/草稿/Job 模型、Agent 状态或生产部署。

下一批实施：管理入口按 active Feature/授权懒加载；消费者按自己的有效运行时取得只读定义或值访问接口，复用原资源容器；先验证加载失败、停用竞态、共享消费者独立停止和恢复，再去掉 Host 提前构造并添加冷启动禁入断言。当前静态债务仍为 277 条，不以本批合同整理减少数量。A01 仍部分完成，固定 7 项仍 4 闭环、3 部分完成。

## 11. 实施增量：对象扩展管理与消费者分别按需装配

日期：2026-10-17（香港）；基线 main `dff66ab2c12688b722f80f78fce638e82c67c46d`（#1001）。本批实现第10节确定的生命周期决定。

### 所有权、触发与接口

- `manager/object-extension-runtime.ts` 分别封装定义和值的按需访问，继续使用 `createLazyProviderRuntimeV010`；动态导入原工厂。定义访问不附带值仓库，值访问也不附带定义管理。
- Host 启动只创建廉价 lease。定义有管理、Counterparty、Item 三个使用作用域；值有 Counterparty、Item、Warehouse 三个使用作用域。每个 scope 按对应 Feature 的实际使用创建 adapter。**六个 access lease 不等于六个存储实例或连接**：它们复用同一 EnterpriseResourceRepository，原 namespace/contextId/事务不变，不复制业务数据。
- 管理 action 使用 `resolveRepository`，先验证上下文/管理资格及必要输入，再等待；等待后复核资格，旧直接注入 API 兼容。已有 import-create 在等候 import services 或 crypto 后继续原检查和算法；仓库每次方法调用还检查 scope 状态。
- 管理页批量读取取得管理 scope 的 reader；Counterparty 页面/target 使用自己的 definition reader；详情在原对象授权成功且需要展示字段值时取得 value reader。Item/Warehouse projection 只拿 value reader；Counterparty/Item target 在原受管导入路径取得 value writer 和 definition reader。公开 reader **实际不含** save/archive/saveMany，不只是类型裁剪。
- 只有对应合法运行路径会解析这些接口。reader/writer 仍是可信 Host 装配，不是新的远端授权 API 或恶意插件沙箱。原 Capability、企业关系、对象/字段授权仍由原 owner 执行；需要 schema/对象数据才能做 read authorization 的路径不声称“任何授权失败都零初始化”。

### 并发、停止、恢复与限制

同 scope 首次并发共享，加载失败清空 pending 可重试；工厂在 import 后再次检查有效/停止/代际，停用期间迟到工厂不创建 adapter。所有 list/get/save/saveMany/archive 仍同步执行，调用时检查代际；原同步 transaction 回调不引入 await。

管理停用只停止管理 scope；对象停用停止自身定义/值 scope，不影响其他消费者。停止递增代际，旧引用在重新启用后也不能复活；重新解析附着原数据。Item/Warehouse 停用同步删除自身 import-target Promise 缓存，Counterparty 原缓存清理保留，避免恢复后拿到失效接口。各对象原 runtime 缓存仍按既有 owner 行为管理。

adapter 无连接、任务、订阅和用户权限缓存；停止释放 lease 引用，不删除数据、不卸载 Node 模块。不声称它取消了跨进程事务/在途网络 WRITE；PA05 持久执行/冻结仍属于原 owner。Host shutdown 沿原错误处理路径调用 stop，若前序停止失败则原 shutdown 失败语义保留，不把局部正常退出测试冒充所有失败组合覆盖。

### 证据与CI

`tests/protocol/object-extension-runtime-lazy.test.mjs` 新增9项行为测试：定义/值未用零构造与并发共享；reader 实际无写方法；管理/多个消费者独立停止且共享数据；迟到构造拒绝、失败重试；文件重启与旧写引用永久失效；授权前零管理仓库构造、等待期间撤权零写入；CRUD 与 import-create/mapping 保持；import services 等待中停用拒绝旧接口写入。使用真实仓库/资源/router，状态及加载等待为受控依赖，不冒充真实 Host HTTP。与原消费者生命周期、跨对象导入/回滚/投影/权限等合计57项组件回归通过。另新增下述1项真实Host HTTP回归，本批合计58项。

静态启动边由277减至275，无新增/扩基线。`tools/plugin-loading-audit.mjs` 在原四组合审计增加 Object Extension repository/values 的冷启动禁止断言，原账本/Counterparty/职责断言保持。新9项及下述真实Host回归加入既有 Lightweight Host CI。

兼容复核发现：Data Import 的 lazy handler 原先在首次装载时捕获 targets/service，scope 停止后这些旧接口会永久失效。现将轻量 service/handlers 的装配移到每次请求，模块发现仍缓存，target factory 仍复用既有按ref缓存；不新建导入引擎。对象恢复后重新取得当前目标，保留原 Job/Recipe 和提交算法。未用此修正宣称已解决“所有有效目标同时解析”的过度装配。

`tests/integration/object-extension-lazy-host.test.mjs` 在独立临时文件、专用开发身份/授权配置、动态loopback端口和阻断出站探针下启动真实Host。通过HTTP创建企业上下文、字段、上传/审核/提交首批数据，关闭字段管理，再停用/恢复Counterparty，以同一组已缓存action上传/审核/提交第二批。验证管理命令拒绝、恢复后导入成功、正常退出后原文件中两批对象/扩展值齐全。没有使用生产账号/数据或放宽生产策略；这项HTTP证明不等于生产部署/人工验收或所有Item/Warehouse路径已实测。

原始冷启动证据：[extension-lazy-audit-20261017.json](evidence/extension-lazy-audit-20261017.json)，含源码哈希与环境。四组合均为351个dist ESM模块、634个归档文件，捕获出站0、退出0，定时器仍为0/0/0/1；不是生产性能结论，也未证明整个安装组合成本已随包数变化。最终head、CI与合并状态由本PR记录，未部署。

本批复用第6/10节已读架构与决定；定向完整核对扩展 action 与仓库，核对 server 的全部扩展实例、页面、导入目标、生命周期和正常 shutdown 消费点。开放 #999 的 BEX 页面/草稿/Job 数据模型与 Agent owner 未接管；shared server 只改装配点，合并前仍要复核主线。无新增外部网页研究。

### 尚余事项

A01仍部分完成，固定7项仍4闭环、3部分完成。此批完成扩展定义/值的提前构造迁移；Data Import Job/Recipe/service 的提前构造与目标过度解析、宿主全量资源归档、记忆调度归属仍保留。下一批仅核对 Data Import 的装配与调用资格，保持原 Job/Recipe/提交回执和其他窗口的草稿实现，不另建导入引擎。

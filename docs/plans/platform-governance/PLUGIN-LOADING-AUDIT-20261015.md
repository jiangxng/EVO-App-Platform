# A01 未安装/停用插件的装载与资源核对

日期：2026-10-15（香港）。平台源码基线 `ed36c2af8dadba207939f65b9379e637739e69dc`。本批只增加隔离审计工具、CI 证据与治理记录，不修改宿主或业务运行逻辑，不增加 Provider 试点。

## 结论

**最小安装已实现，但最小装载尚未实现。** 7 包与 16 包安装组合的启动模块集合完全相同；七个业务包停用后重启，模块集合也未减少。静态 CI 的 297 条历史依赖是防新增门禁，不代表这些债务已经迁移。

不能把“模块已加载”表述成“有业务请求执行”“建立了数据库连接”或“所有服务都创建了”。下面分别保存模块、构造调用、定时器及文件证据。

## 隔离实测

命令：先在干净 dist 上 `npm run build`，再 `node tools/plugin-loading-audit.mjs docs/plans/platform-governance/evidence/plugin-loading-audit-20261015.json`。

[原始报告](evidence/plugin-loading-audit-20261015.json)含源码与构建哈希、Node/系统、完整项目模块集合、安装包/激活 Feature、定时器来源、非资源归档文件名称/大小、归档分类及正常退出证据。各样本引用同一内容哈希的模块集合，避免重复清单。

| 组合 | 安装包数 | 启动加载项目模块数 | 注册 interval | 非资源归档文件数 | 资源归档文件数 |
|---|---:|---:|---:|---:|---:|
| minimal，业务未安装 | 7 | 362 | 0 | 2 | 612 |
| compatible，默认安装但未使用 | 16 | 362 | 0 | 3 | 612 |
| compatible，七个业务包停用后重启 | 16 | 362 | 0 | 3 | 612 |
| minimal，显式配置记忆调度 60 秒 | 7 | 362 | 1，unref | 2 | 612 |

四组均为真实独立 Host 进程、受控临时状态、loopback 监听、禁止 TCP 出站；无业务请求、无生产配置、捕获的出站尝试为 0、SIGTERM 退出码为 0。第三组沿用第二组的状态目录，并修改持久化 Feature 状态模拟停用，不冒充管理 UI 测试。其余组空白目录。

七个停用包：`evo-counterparty`、`evo-object-extension`、`evo-data-import`、`evo-eog-2d`、`evo-eog-3d`、`evo-enterprise-observatory`、`eog-bottleneck-analysis-provider`。审计断言重启后没有恢复这些 Feature。

每组仅约 500ms 观察窗，注册的 60 秒调度器未到执行时间；不能证明 tick 执行、长时后台行为或业务负载。加载 hook 和 interval 记录用于归因，不作性能比较。interval 记录覆盖 global setInterval，不声称覆盖所有原生/第三方资源。项目模块数只统计 dist 内经 Node load hook 观察到的模块，不含 node_modules，也不同于静态扫描的 visitedModules/依赖边数量。

## 源码与实测对应的缺口

| 优先级 / 归属 | 证据 | 判断与后续验收 |
|---|---|---|
| 首批可收敛：账本兼容服务，平台账本 owner | server.ts 的 `const ledgerConfigurator = createLedgerRuntimeConfiguratorService()` 无安装门禁；service.ts 构造时 clone 默认配置。minimal 未安装兼容包却加载 service、compiler、default-library 及默认规则 | 静态调用与模块观测相互支持，不是两套编译算法。下一批优先把这个已有兼容服务改为实际调用时创建，复用原服务；维持旧动作/接口/状态语义，不删除兼容包。验收未用时不实例化，首次用时相同行为，重复用保留原配置状态 |
| 后续分批：往来对象/扩展/导入，BEX/基础对象 owner 协作 | server.ts 在 manager 创建前直接创建 repository 与 projection；对应模块在四组均加载 | 构造开销没有随安装减少。不是重复实现，不直接改正在并行开发的 BEX 服务；用既有资源容器，先整理实际消费者再延迟构造，不能私建存储或改变授权 |
| 独立宿主债务：浏览器资源归档 | web-asset-archive.ts 的 copyJavaScriptTree 遍历 sourceRoot 全部 JS；server.ts 指向 dist 根且监听前 ensureCurrent | 四组都归档 612 文件，共 6,294,754 字节（含 .ready 与 CSS），包括 apps/agents/manager。是文件复制，不能据此称全部插件运行或浏览器已下载。优化需保持旧页面版本兼容及依赖完整性，不能简单按“未安装”删文件 |
| 协作核对：记忆调度，Host/Agent 原 owner | server.ts 的 contextMemoryScheduleMs > 0 直接注册 interval，未查相应插件激活状态；minimal 显式配置后观察到 unref interval | 已证实配置驱动常驻定时器，未证实业务执行。需明确这是 Host 独立治理服务还是插件资源，再决定启停条件；不因包未安装就擅自关闭可能有独立职责的任务 |

没有修改 Agent 的持久执行或记忆实现，也未读取生产秘密。本批非资源归档文件仅有本地临时 `state.json`、自动生成密钥文件（只记名称/大小）、compatible 的 startup-defaults.json。不存在业务文件不代表没有内存仓库，也不代表首次业务写时不会创建文件。

## 已有机制应复用

本次四组未加载 `apps/item/repository.js`、`apps/warehouse/repository.js`、`apps/template-store/repository.js`、`providers/eog-bottleneck-analysis/runtime.js`、`apps/bi-workbench/runtime.js`。对应代码已有函数内动态 import/惰性运行时。结论限于这些具体模块和无请求启动阶段；它们的 package/constants 仍可能加载，不称整个插件已从内存清除。

不重建通用懒加载框架，不接入第二个资源 Provider，不在此批移动业务数据。ESM 模块即使停用也不保证可从同一进程卸载；当前审计是独立进程重启场景，资源 dispose 与模块缓存是两回事。

## 资料索引与方案比较

本批无新增外网检索。以下为固定基线仓库原文，不是搜索摘要或生产观察。

| 原始资料 | 实际阅读范围 / 用途 |
|---|---|
| [server.ts](https://github.com/jiangxng/EVO-App-Platform/blob/ed36c2af8dadba207939f65b9379e637739e69dc/manager/server.ts) | 资源仓库/Counterparty 等构造、ledgerConfigurator、resolveItem/resolveWarehouse、bottleneckRuntime、记忆调度注册、webAssetArchive 与启动/退出段；用于定位提前创建与生命周期边界，未声称通读整个文件 |
| [账本 service.ts](https://github.com/jiangxng/EVO-App-Platform/blob/ed36c2af8dadba207939f65b9379e637739e69dc/apps/ledger-runtime-configurator/service.ts) | 接口与构造初始化段：默认配置 structuredClone；用于首批改造范围 |
| [web-asset-archive.ts](https://github.com/jiangxng/EVO-App-Platform/blob/ed36c2af8dadba207939f65b9379e637739e69dc/manager/web-asset-archive.ts) | copyJavaScriptTree、ensureCurrent、保留旧版本策略；解释磁盘证据 |
| [现有探针](https://github.com/jiangxng/EVO-App-Platform/blob/ed36c2af8dadba207939f65b9379e637739e69dc/tools/lightweight-host-probe.mjs)与[静态门禁](https://github.com/jiangxng/EVO-App-Platform/blob/ed36c2af8dadba207939f65b9379e637739e69dc/tools/lightweight-host-validate.mjs) | 已读原文，复用网络隔离/启动观察与静态依赖判断；新审计不替代既有门禁 |

采用“静态调用定位 + 隔离实际模块/interval/文件观察”，因为单看包数量或 RSS 无法区分责任。排除按源码行数推断内存收益、把全目录文件归档算作插件执行，以及在没有资源证据前扩大 Provider 试点。缺口优先级是工程判断；表中观测与源函数行为是事实。

## CI 与进度

沿用 Lightweight Host 工作流，增加一次四组合审计并把报告放进现有 artifact；不新建工作流。审计会检查正常启动/退出、零捕获 TCP 出站和指定业务 Feature 停用保持。模块数与文件体积是报告指标，**没有把当前 362/612 固化成允许债务永存的断言，也没有新设未经校准的性能阈值**。既有静态门禁仍禁止新增提前依赖。

本地干净构建、四组审计与 2 项静态门禁测试通过；静态边保持 297。准确 CI 和提交见本批 PR。首次复测前保留旧 dist 并干净构建，两个观察结果一致；归档数没有混用其他窗口的工作目录。

**总进度仍为 7 项 / 4 项闭环 / 3 项部分完成。** A01 本次完成“当前提前装载与资源缺口证据”，未完成全平台按需装载；下一批只收敛账本兼容服务的提前构造。后续按具体合同逐批验收，不将上述四行拆成新的整体任务分母，也不承诺固定还需几个 PR。

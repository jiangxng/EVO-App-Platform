# A01 账本兼容服务按需创建

日期：2026-10-15。源码基线：`428294104ec1c007f0a40a01b750c7c4d52c80a2`。
约束：[装载架构权威第 11 节](../../architecture/PLUGIN-LAZY-RESOURCE-LOADING-v0.1.md)。这是 A01 的一次迁移，不新增治理任务，也不宣告 A01 或 A03 全部完成。

## 1. 具体整改

Host 以前静态导入并创建账本兼容服务，服务构造会复制整份默认配置；即使兼容包未安装，也会加载默认规则库与编译实现。

现在保留轻量动作/能力注册，首次有效调用才动态导入原 service 并创建共享实例。HTTP 与三个旧 Action 使用同一个 resolver。原有实例注入方式仍支持，编译算法和账本管理的独立发布编译没有修改。

- `apps/ledger-runtime-configurator/action-handler.ts`：插件自有轻量绑定；安装/启用检查、共享加载 Promise、失败清除与重试、加载完成后再检查启用状态。测试可注入 factory，但生产使用原 service。
- `capability-action-handlers.ts`：支持原 service 或 resolver；请求参数的既有前置校验先于服务解析。
- `manager/server.ts`：移除原 service 与默认库的启动导入；兼容 HTTP 及 Action 共享解析入口。reference-rule-sets 只在该路由使用时读默认库，等待导入后重新检查 Feature。
- `tools/lightweight-host-baseline.json`：删除 9 条已退出启动链的历史边，297 → 288，未扩大白名单。
- `tools/plugin-loading-audit.mjs`：新增明确禁止 service/default-library/expression-compiler 在四组无使用启动中出现的断言。以后把这些实现接回启动链，会导致 CI 失败；模块总数继续作为观察值。

## 2. 资源与兼容边界

| 项目 | 决定及限制 |
|---|---|
| 归属 | 旧 `evo-ledger-runtime-configurator` 插件的兼容服务；Host 只绑定，不拥有默认规则语义 |
| 初始化 | 未安装/停用拒绝解析；已启用未使用不创建；并发首次调用共用一个实例；加载期间停用不创建迟到实例 |
| 状态作用域 | 保留既有进程内共享配置；本批不将其冒充新的企业隔离或持久化方案 |
| 停用 | 禁止后续解析/调用；服务无连接、定时器、订阅或独立数据库需要关闭。保留已编辑配置，重新启用继续使用同一实例 |
| 卸载/重启 | 本批不新设删除数据动作，不保证进程内 ESM 缓存卸载；进程重启仍按原默认配置行为，不提供新增跨重启草稿持久化 |
| 授权 | 保留现有 Action Router 和 HTTP 入口规则；测试证明 Action 授权拒绝不触发加载，不宣称完成旧 HTTP 接口的全面授权认证 |
| 外部写入 | 未调用真实 burn 或业务数据接口，不改变远端写入协议，不证明跨进程停用冻结或未知发布恢复；这些属于 A03 / 原执行 owner |

选择共享 resolver 的原因：每个路由重新创建服务会丢失用户刚导入的配置；停用时直接丢弃实例也会改变旧行为。现有纯计算/内存配置没有需要新增 Provider 停止框架的资源。这个保留决定仅适用于该兼容服务，不能复制成所有插件都永久持有实例的规则。是否退役旧共享配置，仍需消费者与迁移证据。

## 3. 验证与永久门禁

| 验收项目 | 当前验证方式 | 证明范围 |
|---|---|---|
| 无使用成本 | `tests/integration/ledger-lazy-host.test.mjs` 真实子进程，未安装、已停用、已启用未使用三种持久化状态 | 采样时 service/default-library/expression-compiler 均未加载；前两组请求返回 FEATURE_NOT_ACTIVE |
| 首次调用与旧结果 | 同一真实 Host 的并发 summary/configuration、import、compile、template 往返和 reference rules | 912 条活动规则、587 条参考规则及配置标识保持，进程正常退出；不是真实远端发布测试 |
| 首次并发 / 失败 / 停用 | `tests/configurator/lazy-runtime.test.mjs`，真实服务加可计数 factory | 单实例、授权拒绝零加载、加载期间停用零创建、导入/构造失败可重试、重新启用保留配置、无效能力参数不加载 |
| 原有兼容与发布隔离 | 既有 configurator、compiler、publication-boundary/runtime 测试 | 原算法/输入输出与发布独立性回归 |
| 全局防退化 | 既有 Lightweight Host CI 的静态基线与四组合动态审计 | 静态边只减不增；本批退休的三个实现模块禁止回到无使用启动路径 |

新增两组测试接入现有 Lightweight Host 与 Ledger Manager 工作流。原审计仅记录模块观察值，本批在明确模块归属后添加行为断言；没有用一个固定总数替代资源治理。

[本批原始审计](evidence/ledger-lazy-audit-20261015.json)保留当前源码/工具哈希与加载清单；[首批历史审计](PLUGIN-LOADING-AUDIT-20261015.md)不覆盖。当前 main 已含其他专项增量，因此历史 362 与本批 356 不能直接作为同基线性能提升数字。本批可直接归因的是上述 9 条启动依赖退出和目标模块不加载；文件归档仍为全量，未在此批优化。未测 RSS/吞吐收益。

## 4. 接续

固定治理进度仍为 7 项：4 项闭环、3 项部分完成。账本这一处提前创建缺口已按矩阵实施；A01 尚有基础对象提前构造、资源归档、记忆后台归属及其他未迁移资源。

下一步限定为梳理基础对象提前构造的实际消费者和可复用资源入口，与 BEX/基础对象 owner 对齐迁移边界；不得复制一套仓库、抢改其业务流程或增加 Provider 试点。A03 发布结果查询及 A05 正式会话策略继续保留原状态。

阅读范围：已读本批相关 action-handler、capability-action-handlers、lazy handler/router 原文；server 按 import、构造、Action 绑定、兼容 HTTP 路由分段核对；service 构造/接口与原测试核对。未声称通读全部 Host，也未访问生产。准确测试结果、CI、提交和分支清理状态记录在本批 PR。

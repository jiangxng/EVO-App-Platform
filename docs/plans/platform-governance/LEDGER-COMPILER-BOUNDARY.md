# 账本编译边界整改与兼容清单

日期：2026-10-14。对应审查 A03。基线：`cb4594c4b1ab45b786eb49303a858034ce7b09df`。

## 决定和本批成果

账本管理是新业务的统一入口，负责选择企业账本定义及版本、授权后发布。编译是确定性的内部步骤，不是需要用户另装的业务应用，也不交给 LLM。执行记账及成本算法仍属于账本运行时。

本批将发布编译封装在 `apps/ledger-manager/internal/publication-compiler.ts`，发布动作在权限检查之后按需导入。每次创建隔离编译状态，复用原引擎，不增加第二套算法；非法合同、摘要不一致或校验失败不能退回默认配置后发布。版本、企业范围、授权、确认及运行时调用沿用原发布动作。

兼容包的中英日繁中标题改为“账本编译兼容接口”，卡片说明明确：新账本在账本管理中发布，无需另装此包。未隐藏已安装兼容包，用户仍可管理其生命周期。

这是发布侧内部化及兼容定位的第一批闭环，**不是兼容包删除或全 Host 按需装载完成**。原先账本管理已经能不依赖此包激活而发布；本批显式建立模块边界及回归约束，并非新创造此能力。

## 已核对的调用与兼容矩阵

| 调用/状态 | 源文件及定位 | 本批处理与后续条件 |
|---|---|---|
| 新账本发布 | `apps/ledger-manager/actions.ts`，发布命令分支 | 经内部 publication-compiler 编译，保持授权在编译之前；没有兼容插件安装依赖 |
| 编译算法及默认库 | `apps/ledger-runtime-configurator/service.ts`、`expression-compiler.ts`、`default-library.ts` | 复用原引擎；暂不搬迁文件，避免破坏旧导入 |
| 旧 HTTP 接口 | `manager/server.ts`，`/v1/ledger-runtime-configurator/*` | 保留原路径、独立可变草稿及 feature 激活门禁，包含 import/reset/compile/burn 等；未把这些写接口移交新入口 |
| 旧 Action | `action-handler.ts`、`capability-action-handlers.ts` | 保留 packageId、featureId、commandCode |
| Agent/自动化只读能力 | `capability-manifest.ts`，`ledger.runtime.configuration.describe` 和 `.section.read` | 保留 INSTALLATION 范围、授权及分页；不能把旧全局草稿冒充当前企业的已发布账本 |
| 旧安装及启动迁移 | `manager/server.ts` 的 installedAtStartup 及旧包至 ledger-manager 迁移 | 不删除安装记录、不自动启用用户禁用的包；沿用既有一次性迁移逻辑 |
| 模板来源 | `apps/template-store/templates.ts`、`seeds/evo-ledger-runtime-production.snapshot.ts` | 保留来源标识与快照，不修改历史模板摘要 |
| 设置和外部使用者 | 仓库内未发现独立配置 schema；未读取线上持久状态、客户端配置或外部消费者清单 | 尚未证明无人调用，不能据此删除 API/包/旧 ID |

路径未写前缀的编译器文件位于 `apps/ledger-runtime-configurator/`。证据来自本仓库源文件与本地测试，未新增网络研究，也没有线上验证结论。

## 验证及限制

- 构建通过；编译器、旧能力门禁、UI、账本管理及新增发布边界测试共 33 项通过。
- 新增测试覆盖：与旧引擎输出一致且输入不变、摘要损坏被拒绝且不污染后续发布、兼容草稿与新发布双向隔离、旧能力 ID 保留。
- 新测试加入 `test:plugin:ledger-configurator` 及现有插件 CI 的路径触发范围。
- 轻量 Host 门禁通过，仍为 297 条历史静态依赖。旧 HTTP 兼容服务仍由 Host 创建；不声称此次减少启动内存或静态依赖。
- 未改变用户数据、线上安装、运行时服务或 Agent 实现。

## 兼容层退出门槛与回滚

只有查清实际安装、独立 HTTP/Action 调用者及 Agent 能力消费者，并提供企业范围的替代读取协议、迁移映射与回滚演练后，才考虑移出默认目录或删除旧包。账本新发布成功不是删除兼容层的充分证据。

本批回滚只需还原发布动作、内部模块、卡片文案及对应测试/CI改动，无数据格式或持久状态迁移。若发现输出、摘要或权限行为变化，应停止后续迁移并恢复原发布路径。

下一项有界任务：核实 A02 evo.core 的“已安装/已激活”与实际运行时可执行状态，定位现有门禁后只修正错误的就绪表述或缺口。成员两包不凭静态审查强行合并；会话用途政策另项处理。

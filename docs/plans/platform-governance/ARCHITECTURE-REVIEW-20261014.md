# 架构边界与缺陷决策（2026-10-14）

基线与逐包事实见[插件清单](PLUGIN-REVIEW-20261014.md)。本文件分开记录代码事实、架构判断与待验证条件；本轮没有修改运行代码。

## 一、用户最关心的几组关系

### 1. 账本管理与编译器

**已读事实**：`apps/ledger-manager/actions.ts`的发布处理创建`createLedgerRuntimeConfiguratorService()`，依次执行`importTemplate`、`compileCurrent`、`publishToLedgerRuntime`；返回定义ID、版本、semanticDigest和运行时结果。编译服务来自`apps/ledger-runtime-configurator/service.ts`，并使用同目录表达式编译器；保留`bookkeeping-aviator-v1`等旧格式约束。账本管理清单依赖定义仓库、授权和evo.posting/evo.ledger，没有声明对编译器安装包能力的依赖。

**判断**：这是一套编译服务被账本管理复用，不是已证明的两套重复算法；但“可独立卸载的编译器包”和“宿主直接调用编译器源码”含义不一致。账本管理应拥有草稿/版本/发布体验，编译器是确定性的校验和转换步骤，不制定业务规则、不负责实际记账。建议将默认编译实现归为内部发布依赖，保留稳定接口及兼容适配。

**限制**：独立`ledger.runtime.configuration`操作可能仍有调用者；没有盘点实际持久配置和外部调用，不能立刻删除旧packageId。已有版本/摘要回执应复用，不能重新开发第二套；发布结果未知时如何查询确认还需专门核实，不在这里断言已具备完整幂等发布。

### 2. 三种会话服务与个人/企业Agent上下文

**事实**：静态会话提供`identity.session`；预配置Bearer与托管会话都提供`identity.session.request`。托管会话实现同时接受sessionToken和bearerToken。同能力的候选由`manager/provider-resolution.ts`按绑定解析，无明确选择且多个候选时会报歧义。

**决定**：正式用户以托管会话为默认方向；静态身份限定开发/受控演示；预配置Bearer限定已有受控集成/兼容。不是三种个人/企业Agent，不应按会话服务数量划分Agent上下文。未读取线上绑定，限制用途是治理决定，环境迁移尚未执行。

### 3. 企业上下文、成员授权与企业记忆

**事实**：企业上下文Provider一个包提供directory、business-definition.repository、template-transfer和resource.repository四项服务；管理应用依赖directory及authorization。Grant适配读取静态配置与`enterpriseGovernanceStore.snapshot().grants`，Relationship适配读取同一store的relationships。上下文记忆Provider另有read/inventory/write/governance契约。

**决定**：企业上下文资源服务对应用户理解的共享数据容器及访问接口；其管理页面是管理入口，二者应分层。业务对象和定义不能迁到聊天记忆中。企业成员“是什么关系”和“是否获准访问”是两种语义，必须保留两个接口；当前两个默认薄适配可考虑同一安装/配置包，不能合并成一条无差别权限规则。

**企业整体视角**来自授权的企业对象、运行事实及经过治理的知识，不要求把所有员工私人聊天汇入一个上下文。个人Agent可引用允许范围内的企业知识，但不因此取得全企业数据权限。企业授权、个人记忆、当前任务、企业学习各有owner；此处不改写Agent窗口的PA实现状态。

### 4. 本地记忆接入与Experience Compiler接入

**事实**：两个包都提供intake-source和evidence-source；本地实现接收预配置source/records，EC实现是外部服务适配。语义检索和DLP又是不同契约。

**决定**：同接口不同来源不是重复实现，保留独立。来源接入、记忆读写、检索与敏感信息检查不能混称“企业大脑”。EC接入包不等于完整企业学习引擎，更不能与账本规则编译器合并。

### 5. 二维/三维图与企业运营观测

**事实**：2D一个包内有viewer/designer两个Feature；旧designer/viewer目录重导出同一包。3D同样有旧viewer别名。企业观测自身有2D/3D Feature，事实采集与瓶颈分析是独立Provider。

**决定**：按职责区分“编辑/查看定义结构”“呈现实际运行”“读取事实”“分析事实”，共用Eidos图形组件。保留二维、可选三维、观测、事实适配、分析能力；不因为都出现图形而粗暴合并，也不允许各自复制正式业务事实库。当前证据不能证明没有任何重复前端代码，只能排除把兼容导出误当第二个安装包的判断。

## 二、架构缺陷清单与处理边界

优先级：P1为下一次相关实现前必须明确；P2为可排期治理；“已改善”不等于全平台完成。

| 编号 | 已核实事实 | 缺陷或风险判断 | 状态／必要下一步 |
| --- | --- | --- | --- |
| A01 | server.ts仍集中创建多项业务仓库/服务，静态基线保留297条业务提前加载边 | 安装数量、实现装载、后台资源并未完全一一对应；宿主业务组合职责偏重 | P1，部分改善。后续新增业务不得继续内嵌默认启动；本轮不扩大Provider迁移试点。297是依赖边数，不是插件数或漏洞数 |
| A02 | evo.core只有能力声明链，无platform.service-provider绑定；上层安装依赖它 | “能力已声明/依赖已满足”可能被误读为外部执行服务已可用 | P1，待界定。分别表达声明、已安装、已绑定、连接健康、可以执行业务；需要查明现有调用门禁，不能直接判定已发生越权执行 |
| A03 | 账本管理直接使用编译源码，编译器又作为独立可安装包暴露 | 安装/卸载边界与实际调用边界不一致，用户容易认为有两套账本管理 | P1，建议内部化；先确认独立能力消费者与旧状态兼容，复用现有编译代码及发布回执 |
| A04 | 默认Grant与Relationship为同store的薄读取适配，却分为两个安装包 | 包的管理成本可能高于独立替换收益；两种安全语义本身并不重复 | P2，默认打包收敛候选；核对外部替换需求后决定同包双接口或继续分包 |
| A05 | 三种身份会话适用于不同场景，托管/Bearer在能力上重叠 | 不明确环境用途时会让管理员误选和混淆上下文 | P1，已形成用途规则；迁移前核对实际绑定与消费者，不直接禁用旧认证 |
| A06 | 最小模式、一次性业务默认安装、停用状态、请求释放及管理UI已合入；资源状态注册目前只含瓶颈分析Provider | 不能将局部治理展示为全平台资源已可观测/可回收 | 已明确限制，保持现有提示。无需为本次合理性审查继续迁移第二个Provider |
| A07 | 企业资源仓库、企业治理store、记忆和Agent状态为不同数据体系 | 若以“企业要全面了解”为由汇总所有私人聊天，会破坏数据owner与授权边界 | 预防性边界决定，不是本轮发现的数据泄漏事件。继续由Agent/EC专项落实既有契约，本窗口不重复开发 |

## 三、不要改的部分

- 不把所有后台服务合成一个巨型插件：模型、身份认证、凭据、权限、远程资料/事实适配都有独立替换或安全价值。
- 不给每项服务再建一套业务UI；普通用户按产品任务进入，管理员才查看底层依赖。
- 不把不同能力接口数量当作安装包数量；context-memory同包四接口、2D同包双Feature都是合理组合。
- 不将编译器与EC合并，不将成员关系与个人记忆合并，不将模板复制与企业正式版本管理合并。
- 不以这份文档授权删除旧数据、强行卸载认证插件或覆盖其他窗口的Agent变更。

## 四、证据索引与已读范围

所有资料均来自本仓库基线源码或已入库文档；本轮没有新增网络研究，不引用未访问的网页。

| 已查阅资料 | 定位 | 具体用途／阅读状态 |
| --- | --- | --- |
| manager/server.ts | createPackageCatalog；createHostEnterpriseContextGrantProviderV010/Relationship；bottleneckRuntime；业务仓库初始化 | 已读重点原文；目录边界、共享store、按需试点和宿主职责 |
| catalog/seed.ts及各包清单 | PackageManifest/Feature/provides/requires/contributions | 全量默认清单已从本次构建产物提取；重点包已读源文；机器证据含对应路径 |
| catalog/catalog.ts、manager/provider-resolution.ts | CATALOG_DUPLICATE_PACKAGE、PROVIDER_RESOLUTION_AMBIGUOUS | 已读相关原文；区分ID重复与可替代实现 |
| apps/ledger-manager/actions.ts；ledger-runtime-configurator/service.ts | 发布处理；compileCurrent；旧表达式语言 | 已读重点原文；确认复用而非第二套编译算法 |
| providers/managed-session/runtime.ts；session/request-session包清单 | token解析；能力声明 | 已读相关原文；限定三种会话定位 |
| providers/enterprise-context-grant/runtime.ts、enterprise-relationship/runtime.ts | 两个factory及source回调 | 已读原文重点；默认打包收敛的证据 |
| providers/memory-intake/runtime.ts、remote-credential/runtime.ts、application-runtime-binding/runtime.ts | 配置/工厂/resolve | 已读相关原文；区分接入来源、秘密存储与运行时绑定 |
| apps/eog-2d-designer/package.ts、eog-2d-viewer/package.ts、eog-3d-viewer/package.ts | 重导出 | 已读完整短文件；排除兼容名称误算 |
| apps/trading-stage/host-preview.ts、demo-kit.ts；providers/trading-finance-owner/package.ts | 条件目录及包声明 | 已读相关原文；说明默认目录之外的范围 |
| 本目录PLAN、BASELINE、CI及已合并批次文档 | GOV-00/02、#794/#796/#817 | 已有研究复用；不重新做资源实验 |
| docs/governance/BRANCH-HYGIENE.md；docs/agent-line/AGENT-DELIVERY-AND-BRANCH-GOVERNANCE.md | 单活动主线、及时合并/清理 | 已读相关原文；本轮只有一条文档分支 |

限制：没有读取线上秘密/安装快照、没有对所有运行算法逐行审计、没有重新验证EVO/EC远端仓库。对这类未知项只写核实条件，不把它们编造成事实。

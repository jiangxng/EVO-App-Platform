# 插件逐项合理性审查（2026-10-14）

**本轮结论：大多数拆分具有领域、供应商或安全边界依据；重点问题是少数默认包粒度和声明与实际执行边界，不是把后台插件全部合并。**

固定基线：`11a4355316051f3f0d4b31e0aca86807f054734f`。审查对象为`manager/server.ts`默认catalog的41个packageId；其中38个给出处置判断，3个示例按用户要求排除。不是线上已安装插件清单，不是代码克隆扫描，不证明每个实现完整或无缺陷。

已执行：从该提交构建产物提取清单（描述、Feature、依赖、提供能力、Provider绑定），核查疑似重复的源文件及重点消费者。事实记录见[原始清单](evidence/plugin-catalog-20261014.json)。下表“用途”为清单声明事实；“建议及理由”为本轮架构判断。保留独立只表示边界合理，不代表运行时已完全按需装载。所有调整建议本轮均未实施。

## 判定口径

独立领域、可替换实现、配置/凭据/权限、可选依赖、生命周期至少有明确价值之一，才保留独立安装单元；无需每包都有页面。固定内部步骤优先内部模块。同一包可提供多项契约；同一契约可由多个候选实现，但选择必须明确。不得凭名称或目录重复直接删包。

## 全量逐项结论

| 包（准确ID） | 声明用途 | 处置建议及理由 | 源码依据 |
| --- | --- | --- | --- |
| EVO 个人工作台 · `evo-bi-workbench` | 按个人职责组织业务任务与视图，提供日常工作的统一入口。 | **保留独立**：个人职责与任务入口，可选的个人工作产品；与Agent的对话执行互补，不因都叫工作台而合并。历史bi包名不代表已具备完整BI分析。 | [apps/bi-workbench/package.ts](../../../apps/bi-workbench/package.ts) |
| 企业笔记 · `company-notes` | 提供企业笔记示例页面，演示插件安装、启用与内容展示。 | **排除本轮**：企业笔记示例，不评价业务完整性，不调整展示。 | [catalog/seed.ts](../../../catalog/seed.ts) |
| EVO 往来对象 · `evo-counterparty` | 统一管理客户、供应商等往来对象资料，供业务流程引用。 | **保留独立**：客户/供应商等往来对象领域；与物料、仓库共用基础设施不等于数据和业务语义相同。 | [apps/counterparty/package.ts](../../../apps/counterparty/package.ts) |
| EVO 物料 · `evo-item` | 管理物料基础资料，为采购、销售等业务提供统一物料引用。 | **保留独立**：物料领域可独立使用和演进，保留统一导入及资源接口。 | [apps/item/package.ts](../../../apps/item/package.ts) |
| EVO 仓库与库位 · `evo-warehouse` | 管理仓库与库位基础资料，供业务单据引用存放位置。 | **保留独立**：仓库/库位领域与物料资料不同；不要将仓库目录等同库存记账。 | [apps/warehouse/package.ts](../../../apps/warehouse/package.ts) |
| EVO 交易参考流程 · `evo-trading-reference` | 提供采购等交易参考流程，验证基础对象与业务插件的协作。 | **排除本轮**：交易参考流程，按用户要求不处理展示和业务补完。 | [apps/trading-reference/package.ts](../../../apps/trading-reference/package.ts) |
| EVO 数据导入 · `evo-data-import` | 导入表格数据，匹配字段并预览校验结果，再确认写入。 | **保留独立**：跨对象共享导入流程；字段匹配、预校验与确认写入不应在每个对象插件重复开发。 | [apps/data-import/package.ts](../../../apps/data-import/package.ts) |
| 个人代理 · `enterprise-agent` | 在授权范围内协助处理个人任务、检索资料并调用插件能力。 | **保留独立**：个人任务/对话与工具调用产品；同包同时提供personal/enterprise能力不是两个Agent包。企业数据授权和组织学习须保持独立边界。 | [agents/enterprise-agent/package.ts](../../../agents/enterprise-agent/package.ts) |
| 企业上下文 · `evo-enterprise-context-governance` | 管理企业上下文、成员关系与共享资源，组织企业协作空间。 | **保留独立**：企业空间与成员管理的人机界面；资源Provider是后台数据访问契约，不是重复页面。关闭管理入口不应删除企业数据。 | [apps/enterprise-context-governance/package.ts](../../../apps/enterprise-context-governance/package.ts) |
| 企业运营观测 · `evo-enterprise-observatory` | 汇总企业运行事实与分析结果，辅助观察业务运行情况。 | **保留独立**：展示实际业务运行事实及分析结果；区别于定义图的查看编辑。与2D/3D共用画布合理，不能重复建立事实权威。 | [apps/enterprise-observatory/package.ts](../../../apps/enterprise-observatory/package.ts) |
| EOG 二维运行图 · `evo-eog-2d` | 以二维视图设计和查看企业运行图，编辑业务结构与关联。 | **保留独立**：一个包含viewer/designer两个Feature，旧目录只是重导出。保持二维设计/查看同包，权限仍可区分。 | [apps/eog-2d/package.ts](../../../apps/eog-2d/package.ts) |
| EOG 三维运行图 · `evo-eog-3d` | 以三维视图查看企业运行图及关联信息，辅助理解业务结构。 | **保留独立**：三维展示可选，少装时无需付出其渲染负担；不是第二套业务图数据模型。 | [apps/eog-3d/package.ts](../../../apps/eog-3d/package.ts) |
| EVO 基础运行时 · `evo.core` | 提供基础运行时能力，支撑依赖它的业务插件。 | **需澄清边界**：清单仅声明business-data/posting/ledger/balance能力依赖链，没有服务绑定；不能把安装该标记包解释为实际账本运行时已就绪。保留ID，先核实可执行性来源。 | [catalog/seed.ts](../../../catalog/seed.ts) |
| EVO 外部代理授权管理 · `evo.external-agent-governance` | 管理外部代理的接入授权与访问范围，支持审计和撤销。 | **保留独立**：外部Agent访问授权/撤销是独立安全边界，不与个人聊天Agent合包；基础安全职责可强制依赖，不能宣称任意卸载。 | [manager/external-agent-governance-package.ts](../../../manager/external-agent-governance-package.ts) |
| EVO 账本管理 · `evo-ledger-manager` | 管理账本定义、版本与相关投影，组织企业账本配置。 | **保留独立**：账本定义、版本及发布的用户入口；确定性转换应在内部发布链中被调用。 | [apps/ledger-manager/package.ts](../../../apps/ledger-manager/package.ts) |
| EVO 账本运行时编译器 · `evo-ledger-runtime-configurator` | 将业务定义编译为账本运行时配置，支持校验与导入导出。 | **建议内部化**：账本管理已直接调用同一编译服务。保留编译能力接口，目标为内部发布依赖；旧能力调用者与配置迁移核清之前保留兼容packageId，不直接删包。 | [catalog/seed.ts](../../../catalog/seed.ts) |
| EVO 对象扩展 · `evo-object-extension` | 为基础对象配置企业自定义字段，满足不同业务的信息需求。 | **保留独立**：跨对象的企业字段扩展服务，供对象和导入共享；无独立页面不是拆分不合理的证据，不再复制一套对象CRUD。 | [apps/object-extension/package.ts](../../../apps/object-extension/package.ts) |
| EVO 职责管理 · `evo-responsibility` | 定义职责及其业务范围，为个人工作视图提供职责依据。 | **保留独立**：跨对象职责与业务范围，多个对象显式依赖；不能与企业成员身份/访问授权混为一个概念。作为共享业务依赖，不强迫普通用户手动组装。 | [apps/responsibility/package.ts](../../../apps/responsibility/package.ts) |
| OpenAI 模型服务 · `openai-llm-provider` | 连接 OpenAI 模型，为已授权的代理任务提供模型推理能力。 | **保留独立**：模型供应商替代实现；配置/凭据及接口差异明确，应通过绑定选择。 | [providers/openai/package.ts](../../../providers/openai/package.ts) |
| DeepSeek 模型服务 · `deepseek-llm-provider` | 连接 DeepSeek 模型，为已授权的代理任务提供模型推理能力。 | **保留独立**：与OpenAI同能力、不同供应商实现；不是应去重的两个插件。 | [providers/deepseek/package.ts](../../../providers/deepseek/package.ts) |
| 远程连接凭据服务 · `host-remote-credential-provider` | 为远程插件连接解析受管凭据，避免在插件清单中保存密钥。 | **保留独立**：按包/受众为远程插件选择凭据，是连接适配；不同于通用秘密存储。长期应统一秘密来源，不能仅凭两者有token就合并。 | [providers/remote-credential/package.ts](../../../providers/remote-credential/package.ts) |
| 静态权限策略服务 · `host-static-authorization-provider` | 按静态权限策略检查操作请求，为宿主提供授权判断。 | **保留独立**：授权判断是可替换安全策略接口；安全检查由宿主强制执行，策略缺失应拒绝，不允许卸载成为绕过。 | [providers/authorization/package.ts](../../../providers/authorization/package.ts) |
| 加密凭据管理服务 · `host-encrypted-secrets-provider` | 加密保管模型密钥等敏感凭据，向获授权插件提供凭据解析。 | **保留独立**：秘密的存储与解析有独立安全/替换边界；用户不需理解其内部密钥管理。 | [providers/secrets/package.ts](../../../providers/secrets/package.ts) |
| 企业上下文资源服务 · `host-enterprise-context-provider` | 提供企业上下文资源查询，支持插件访问当前授权企业信息。 | **保留独立**：企业目录、定义、资源和模板转移的后台服务组合；可作为默认资源服务包，契约仍分开。不是聊天记忆或企业Agent。 | [providers/enterprise-context/package.ts](../../../providers/enterprise-context/package.ts) |
| 静态会话服务 · `host-static-session-provider` | 提供静态会话身份，供开发与受控参考环境使用。 | **限制用途**：静态身份适合测试和受控演示，不应作为正式用户默认登录。保留开发适配，实际旧绑定清点后再限制安装环境。 | [providers/session/package.ts](../../../providers/session/package.ts) |
| Bearer 令牌会话服务 · `host-bearer-session-provider` | 验证请求中的 Bearer 令牌，将请求关联到可信用户会话。 | **限制用途**：预配置令牌身份适配；托管会话本身也接受Bearer。限定受控集成/兼容，不作为第三种用户画像或Agent上下文。 | [providers/request-session/package.ts](../../../providers/request-session/package.ts) |
| 托管登录会话服务 · `host-managed-session-provider` | 管理登录会话及其有效状态，为请求提供可信用户身份。 | **保留独立**：正式托管登录会话默认方向；与OIDC外部身份认证及用户目录各司其职。 | [providers/managed-session/package.ts](../../../providers/managed-session/package.ts) |
| 用户身份目录服务 · `host-identity-user-directory-provider` | 提供用户身份目录查询，供成员管理等功能查找用户。 | **保留独立**：用户身份目录与企业成员关系并不相同，可对接不同身份后端；不因同属账号体系合成巨型插件。 | [providers/identity-directory/package.ts](../../../providers/identity-directory/package.ts) |
| OIDC 身份认证服务 · `generic-oidc-identity-provider` | 通过 OIDC 对接身份服务，支持用户登录与身份认证。 | **保留独立**：外部身份服务认证适配，具备供应商配置/密钥边界；登录成功后由托管会话承接。 | [providers/oidc/package.ts](../../../providers/oidc/package.ts) |
| 企业上下文访问授权服务 · `host-enterprise-context-grant-provider` | 提供企业上下文访问授权查询，确定用户可访问的企业空间。 | **默认打包收敛候选**：访问授权读取适配与成员关系适配均取自enterpriseGovernanceStore，当前默认实现很薄。建议统一默认安装/配置单元，但保留membership接口和独立策略语义。 | [providers/enterprise-context-grant/package.ts](../../../providers/enterprise-context-grant/package.ts) |
| 企业成员关系服务 · `host-enterprise-relationship-provider` | 管理企业成员关系与邀请状态，支持成员加入、退出和角色治理。 | **默认打包收敛候选**：提供成员关系读取；与grant并非重复算法。可同包不同服务，迁移旧packageId与外部替换需求核实之前不删除。 | [providers/enterprise-relationship/package.ts](../../../providers/enterprise-relationship/package.ts) |
| 上下文记忆服务 · `host-context-memory-provider` | 管理个人与企业上下文记忆，支持授权读写及来源追溯。 | **保留独立**：记忆读/写/目录/治理同包多接口合理；记录个人与企业范围，不替代业务对象仓库或正式业务事实。 | [providers/context-memory/package.ts](../../../providers/context-memory/package.ts) |
| 记忆资料接入服务 · `host-memory-intake-provider` | 接收记忆来源资料并保留证据，支持后续提案与人工审核。 | **保留独立**：预配置资料/证据接入适配，与记忆仓库及EC远程接入不同；适合默认/受控来源，不能宣称它就是企业学习引擎。 | [providers/memory-intake/package.ts](../../../providers/memory-intake/package.ts) |
| 远程记忆语义检索服务 · `remote-context-memory-semantic-provider` | 连接远程语义检索服务，辅助查找当前上下文中的相关记忆。 | **保留独立**：可选远程语义检索有外部服务和凭据边界；缺省不启用仍应可用基本记忆查询。 | [providers/context-memory-semantic/package.ts](../../../providers/context-memory-semantic/package.ts) |
| 远程记忆数据防泄漏服务 · `remote-context-memory-dlp-provider` | 连接远程数据防泄漏服务，辅助检查记忆内容中的敏感信息。 | **保留独立**：可选远程敏感信息分类，安全失败策略须由治理明确；独立服务有合理性，不把模型分类当唯一授权检查。 | [providers/context-memory-dlp/package.ts](../../../providers/context-memory-dlp/package.ts) |
| Experience Compiler 记忆接入服务 · `experience-compiler-memory-intake-provider` | 接入经验编译器的记忆资料与证据，供审核后纳入上下文记忆。 | **保留独立**：EC资料/证据适配，与本地intake同契约不同来源；不拥有账本规则编译，也不等于整个EC服务。 | [providers/experience-compiler-memory/package.ts](../../../providers/experience-compiler-memory/package.ts) |
| EVO 运行时事实观测服务 · `evo-runtime-observatory-provider` | 读取运行时事实与观测数据，为企业运行分析提供依据。 | **保留独立**：从EVO读取运行事实的外部运行时适配；区别于观测页面和分析算法，允许替换实际事实来源。 | [providers/evo-runtime-observatory/package.ts](../../../providers/evo-runtime-observatory/package.ts) |
| EOG 运行瓶颈分析服务 · `eog-bottleneck-analysis-provider` | 分析企业运行图与运行事实，辅助识别业务瓶颈。 | **保留独立**：只读分析算法能力可替换、可选；独立有价值，当前已做按需试点。无需为证明合理性再接更多运行试点。 | [providers/eog-bottleneck-analysis/package.ts](../../../providers/eog-bottleneck-analysis/package.ts) |
| 企业应用运行时绑定服务 · `evo-application-runtime-binding-provider` | 解析企业应用与运行时的绑定，确定应用使用的执行环境。 | **保留独立**：按企业/应用解析执行环境，独立配置与路由契约合理；不执行记账，也不是账本编译器。 | [providers/application-runtime-binding/package.ts](../../../providers/application-runtime-binding/package.ts) |
| EVO 模板商店 · `evo-template-store` | 浏览可复用业务模板，将模板复制为企业独立定义草稿。 | **保留独立**：模板分发与复制草稿入口；不是企业正式版本库，复制后的定义由企业自己管理。 | [apps/template-store/package.ts](../../../apps/template-store/package.ts) |
| 轻量交易示例 · `trading-lite` | 展示轻量交易示例及其运行时依赖，验证插件协作流程。 | **排除本轮**：交易示例，保留现状，不借治理扩展交易功能。 | [catalog/seed.ts](../../../catalog/seed.ts) |

## 汇总

- 保留独立：32 个。
- 排除本轮：3 个。
- 需澄清边界：1 个。
- 建议内部化：1 个。
- 限制用途：2 个。
- 默认打包收敛候选：2 个。

这不是“要删除几个插件”的列表。内部化1个与默认打包收敛2个均需要兼容迁移；本轮不卸载、不删代码、不改变已安装环境。限制用途2个仍保留受控场景。需澄清边界1个须先确定能力就绪含义。

## 目录之外及兼容名称

- `apps/eog-2d-designer/package.ts`、`apps/eog-2d-viewer/package.ts`重导出同一个`evo-eog-2d`包；不是两个额外安装包。Viewer文件还保留旧观测页面常量转出，不代表这些页面仍归它所有。
- `apps/eog-3d-viewer/package.ts`重导出`evo-eog-3d`。不把兼容入口计为第二套三维实现。
- `apps/trading-stage/host-preview.ts`在两个预览开关同时满足时加入6个阶段包；默认不加入。根据用户范围排除其展示及业务完善，不将41误称为所有配置下的包数。
- `providers/trading-finance-owner/package.ts`存在只读财务核验包声明，但不在当前默认Host catalog数组中；记录为非默认目录项，本轮不接管交易专项。
- 外部运行时和EC部署并非这个仓库中“多出的一张同名插件卡片”，其完整实现未在本轮重审。

## 如何使用本清单

先读[关键边界与缺陷决策](ARCHITECTURE-REVIEW-20261014.md)，再按[接续入口](REVIEW-ENTRY-20261014.md)执行。对单包有异议时引用准确packageId和原始清单，不从标题推断内部实现。本轮成果为包边界审查完成；迁移实施、生产配置核对和全平台性能优化均不在完成声明内。

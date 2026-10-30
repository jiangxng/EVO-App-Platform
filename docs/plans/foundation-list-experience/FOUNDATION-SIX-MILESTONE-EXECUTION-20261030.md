# 字典 → 组织人员 → 建模 → 导入：固定六步里程碑状态表

日期：2026-10-30  
工作线：Foundation Reference & Migration；不替换全项目 TR-01 状态，不更改 PA/BEX/IAM 的 owner。  
执行基线：main \`fe0106610934cefc676389ea71986af1abf5105c\`；继续前每次核对最新 HEAD。  
源计划：[12 项原任务及 T01–T10 技术验收](FOUNDATION-MODELING-REFERENCE-IMPORT-TASKS-20261030.md)。本表是原计划的 **六个固定交付关口**，不复制或拓展原任务清单。

## 固定里程碑状态（不得用 PR 数、文档数冒充完成）

| 序号 | 固定范围 / 原计划 ID | 当前状态 | 完成的实际证据 | 尚未关闭的验收关口 |
| --- | --- | --- | --- | --- |
| #01/06 | 业务样例与增量基线（FM-00） | **IN_REVIEW** | Counterparty 的真实核心字段和共享插件边界已核对；本 PR 提交可复现合成迁移文件、来源列映射和差距表 | 确认第一条真实业务场景字段语义；此样例非客户生产数据；合并后更新准确状态 |
| #02/06 | 业务字典（RD-01、RD-02） | **IN_PROGRESS — RD-01 局部** | 本 PR 建立企业作用域、稳定编码、显式别名、状态/版本的只读公共契约及确定性解析回归 | RD-02 真正可选装插件、Enterprise Context 持久化、草稿/发布、授权、批量导入、真实 Host |
| #03/06 | 组织（OR-01、OR-02） | **PLANNED** | 已发现 Enterprise Context 资源与 Responsibility 公共边界可复用 | 组织稳定引用/层级、失效与跨企业拒绝，批量初始化及真实 Host |
| #04/06 | 业务人员（PE-01、PE-02） | **PLANNED** | 已确认 Host 登录身份不能代替业务人员主数据 | 同名人员稳定引用、组织任职、离职、源编码映射及权限测试 |
| #05/06 | 有效模型发布（MD-01、MD-02；HX-01 设计前置） | **PLANNED** | 复用现有 Foundation Object Schema 编译与 Object Extension | 引用字段及版本、模型草稿/发布、依赖防悬空、Eidos 业务旅程设计前置 |
| #06/06 | 导入与整体验收（IM-01、HX-01、EV-01） | **PLANNED** | 复用现有 Data Import Job/Mapping/Precheck/Receipt | 引用批量解析、版本重预检、幂等恢复、真实 Host/桌面/手机/Human 分级签收 |

**状态口径：** \`PLANNED\` 尚未实现；\`IN_PROGRESS\` 实现中；\`IN_REVIEW\` 有变更尚未完成目标门禁；\`DEV_COMPLETE\` 仅在本里程碑实际功能、定向测试、准确 HEAD CI 和合并核验后使用；\`HUMAN_PASS\`、\`DEPLOYED\` 另列，绝不从 CI 自动推定。

## #01/06：固定第一条可复现业务样例（合成数据，不冒充客户验收）

源文件：\`tests/fixtures/foundation-reference-migration-20261030.csv\`。业务场景为导入往来对象（客户）；源列必须映射到 **正确 owner** 的语义。

| 源列 | 目标与语义 owner | 当前可复用能力 | 必须新增/补足 |
| --- | --- | --- | --- |
| 往来编码 | Counterparty 核心字段 \`code\`（稳定业务编码） | 已有，Core Schema / import-target | 复用，不造新字段 |
| 往来名称 | Counterparty 核心字段 \`displayName\` | 已有，Core Schema / import-target | 复用，不造新字段 |
| 客户等级 | 待创建企业扩展字段，管理字典引用 \`counterparty.customer-level\` | Object Extension 字段框架；固定 ENUM 不等于可管理字典 | 字典插件、发布版本、扩展字段引用、源值→稳定字典编码 |
| 负责部门 | 企业扩展引用，目标组织稳定标识 | 已有企业资源持久化框架 | 组织插件、层级/停用/版本、引用校验 |
| 负责人 | 企业扩展引用，目标**业务人员**稳定标识 | Responsibility 可以消费人员引用；Host 登录身份存在但不是业务人员主数据 | 业务人员插件、任职、同名分辨、可选登录关联 |
| 负责人源编码 | 来源辅助匹配键，属于 Import Job 的转换决定，不是另一个人员主数据字段 | Data Import 的源列/映射机制 | 对照源系统→目标人员身份；保留原始值及行号 |

样例含确定性成功/失败分流：CP-0001/2 为预期成功候选；CP-0003 缺人员源编码且字典值不存在；CP-0004 字典选项已停用、部门失效、人员码不存在。**现在尚无字典/组织/人员三类数据实际发布，也尚不能把这些行写入真实 Host**，因此以上是目标场景而非测试 PASS。

固定第一版受管字典语义：选项 A（显示“重点客户”，别名“重点”）、B（显示“普通客户”，别名“普通”）、C（停用，别名“旧客户”）；别名冲突必须人工裁定。组织部门采用稳定标识（例如 \`DEPT-01\`）；业务人员采用企业作用域稳定编码（例如 \`EMP-101\`），同名不可按显示名自动合并。编码是合成样例约定，不得强推成真实客户的字段格式。

## 复用核查与不可重复开发的边界

| 能力与文件 | 当前事实 | 本工作线的做法 |
| --- | --- | --- |
| \`contracts/foundation-object/schema.ts\` | 已有 STRING/NUMBER/BOOLEAN/DATE/ENUM，没有跨插件引用类型 | 未来 MD-01 扩展同一有效 Schema，不造第二套导入字段模型 |
| \`apps/counterparty/foundation-object.ts\` | 已有业务核心字段、扩展槽和 import target | 不移动核心字段所有权，不把字典逻辑塞进 Counterparty |
| \`apps/object-extension/\` | 已有企业扩展和批量新增字段流程 | RD/OR/PE 发布后才连接引用语义，复用现有发布/授权能力 |
| \`apps/data-import/\` | 已有源文件、映射、预检、提交、任务回执 | IM-01 在原任务追加版本锁定与批量引用解析，不建设第二导入框架 |
| \`apps/responsibility/\` | 已有责任归属领域插件 | 人员名录由新人员插件拥有，不混同 Host principal |
| \`providers/enterprise-context/\` | 已有企业 Resource Library 与 Business Definition 版本治理 | 新插件通过公共接口存储、授权、发布，禁止 Host 核心承载业务字典数据 |
| \`vendor/eidos/\` 和批准 V3 原型 | 已有共享交互模式与可核对 V3 来源 | HX-01 在写 UI 前对齐现有页面模式，不能用新业务反向修改 Eidos 基础交互 |

当前 GitHub 开放 PR 均属 IAM、Tokyo 或 BEX 既有 owner；未发现本工作线的竞争开发 PR。这里的“未发现”仅限核查到的开放 PR 和上述现有源码，不代表全仓逐行已审计。

## 本轮 #02/06 局部实现的准确范围

- 公共接口：\`contracts/reference-data/dictionary.ts\`，只定义受管字典快照、版本、显式别名与只读批量解析操作。
- 纯函数：\`foundation/reference-resolution/dictionary.ts\`，在 **owner 已授权** 的快照上拒绝跨企业、错字典、过期版本、未发布、停用、歧义和未知值；不使用 LLM 猜测或暗中写数据。
- 测试：\`tests/protocol/business-dictionary-resolution.test.mjs\`，覆盖字典编码不随显示标签变化、别名冲突和作用域/版本拒绝。
- **不具备**：插件包安装、真实企业数据库、操作权限授权、管理 UI、模型字段引用或数据导入提交。不得把上述契约与纯函数说成 RD-02 已完成。

## 固定执行与合并规则

1. 严格按 #01→#06 顺序收口；业务字典先于依赖它的模型，组织先于人员，模型发布先于真正写入。已有无依赖的基础类型导入保留。
2. 功能闭环一条活动分支/PR、同 PR 累计提交；使用最新 main、已存在 owner 契约和最小测试；**不为每次小修建新 PR**。确有外部 owner 依赖则声明并串行合并。
3. 达到最小安全闭环后核对最终 HEAD 全部相关 required CI，合并 main，确认 main 含目标变更，再使用现有 \`.github/workflows/branch-hygiene.yml\` 或 GitHub 合并后清理机制 **仅删除已合并且无独有提交、无活动 PR 引用的过程分支**。禁止删除仍属他人活动 PR 的分支。
4. 失败两轮不改善先定位根因/换路线。全量定时测试如有既有失败，区分基线问题与本 PR 回归，不以不相关失败掩盖实际风险。
5. 本次未获真实业务数据、正式发布或 Human 签收；每次回报固定“里程碑状态表 + 精确 PR/CI + 本轮关闭的真实差距 + 下一最小门禁”。不得新增第七个范围或擅自跳跃任务。

## 下次继续的最小入口

完成本 PR 的准确 HEAD CI/合并后，以最新 \`main\` 进入 **#02/06 的 RD-02**：沿用 \`BusinessDictionaryReadCapabilityV010\`，增加可安装应用、Enterprise Resource 版本化持久化和授权的发布/初始化操作；先验证两个不同企业及失败重试。没有这些真实 Host 证据，第 #02/06 步保持 IN_PROGRESS。

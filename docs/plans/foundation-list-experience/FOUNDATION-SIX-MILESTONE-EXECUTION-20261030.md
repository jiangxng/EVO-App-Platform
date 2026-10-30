# 字典 → 组织人员 → 建模 → 导入：固定六步里程碑状态表

日期：2026-10-30  
工作线：Foundation Reference & Migration；不替换全项目 TR-01 状态，不更改 PA/BEX/IAM 的 owner。  
执行基线：main \`fe0106610934cefc676389ea71986af1abf5105c\`；继续前每次核对最新 HEAD。  
源计划：[12 项原任务及 T01–T10 技术验收](FOUNDATION-MODELING-REFERENCE-IMPORT-TASKS-20261030.md)。本表是原计划的 **六个固定交付关口**，不复制或拓展原任务清单。

## 固定里程碑状态（不得用 PR 数、文档数冒充完成）

| 序号 | 固定范围 / 原计划 ID | 当前状态 | 完成的实际证据 | 尚未关闭的验收关口 |
| --- | --- | --- | --- | --- |
| #01/06 | 业务样例与增量基线（FM-00） | **DEV_COMPLETE；Human 待签** | PR #1149 已合入 main `f1199096`，真实 Counterparty 核心字段、共享插件边界与合成迁移样例已核对；相关 Platform CI 通过 | 客户真实字段及桌面/手机 Human 验收不在本轮代码结论内 |
| #02/06 | 业务字典（RD-01、RD-02） | **IN_REVIEW — RD-02** | RD-01 已通过 #1149；PR #1150 实现可选装包、企业资源持久化/草稿/历史/Human 发布、批量解析、ActionHost 按需加载及安全/恢复测试 | #1150 精确最终 HEAD CI、main 合并、受权真实 Host 及 Human 界面签收分别核对；字典管理 UI 仍属于 HX 交付 |
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

## #02/06 RD-02 实际实现及尚待证据

- **已合并复用：** PR #1149 的 `contracts/reference-data/dictionary.ts` 和 `foundation/reference-resolution/dictionary.ts`（稳定字典键、显式别名、版本、拒绝歧义与跨企业）。
- **本次 PR #1150：** `catalog/seed.ts` 声明纯元数据的可选业务字典包；`apps/business-dictionary/repository.ts` 通过 Enterprise Resource Library 原子事务保存草稿、发布版本与历史；`apps/business-dictionary/actions.ts` 允许授权的 Human 草稿/发布和成员读取；`manager/business-dictionary-runtime.ts` 在操作时才按需加载业务模块。Host 动作通过公开声明和生命周期保护连接，不默认安装。
- **测试：** `tests/integration/business-dictionary-plugin.test.mjs` 覆盖企业隔离、Human 权限、重复请求与版本冲突、别名歧义、文件重开恢复、Feature 停用及真实 ActionRouter 的懒加载路径，并由 `npm run test:platform` 执行。
- **架构止损：** 初次实现增加了 Host 对插件代码的静态依赖，被 Lightweight Host Architecture CI 正确拒绝；已在原 PR 内将元数据移至目录、操作 ID 移至公开契约、运行时改为按需导入，未修改放宽 CI 门禁。
- **仍未签收：** 发布到 Tokyo 或生产、客户真实字典数据、完整 Eidos 字典管理 UI、手机体验与 Human 签收均未据此声称完成。归属 #05/#06 对应 UI/完整旅程验收，不额外设第七里程碑。

## 固定执行与合并规则

1. 严格按 #01→#06 顺序收口；业务字典先于依赖它的模型，组织先于人员，模型发布先于真正写入。已有无依赖的基础类型导入保留。
2. 功能闭环一条活动分支/PR、同 PR 累计提交；使用最新 main、已存在 owner 契约和最小测试；**不为每次小修建新 PR**。确有外部 owner 依赖则声明并串行合并。
3. 达到最小安全闭环后核对最终 HEAD 全部相关 required CI，合并 main，确认 main 含目标变更，再使用现有 \`.github/workflows/branch-hygiene.yml\` 或 GitHub 合并后清理机制 **仅删除已合并且无独有提交、无活动 PR 引用的过程分支**。禁止删除仍属他人活动 PR 的分支。
4. 失败两轮不改善先定位根因/换路线。全量定时测试如有既有失败，区分基线问题与本 PR 回归，不以不相关失败掩盖实际风险。
5. 本次未获真实业务数据、正式发布或 Human 签收；每次回报固定“里程碑状态表 + 精确 PR/CI + 本轮关闭的真实差距 + 下一最小门禁”。不得新增第七个范围或擅自跳跃任务。

## 下次继续的最小入口

先以 #1150 最终 HEAD 证明 Platform CI、Lightweight Host、Continuity、权限/恢复受影响检查全部通过，再合并 main 并通过 Branch Hygiene 自动安全删除过程分支。合并后从最新 main 直接进入 **#03/06 组织插件 OR-01/OR-02**，明确稳定组织身份、部门层级与跨企业/循环/失效引用；复用企业资源与字典的版本/发布经验，不复制其业务语义。不得跳过 Human 及真实部署的分级门禁。

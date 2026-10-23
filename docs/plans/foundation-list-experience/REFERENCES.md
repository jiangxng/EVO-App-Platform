# 研究资料、代码证据与决策索引

查阅日期统一为 **2026-10-12（Asia/Hong_Kong）**。仅记录本轮实际打开或检索到的来源；没有把旧文档的外链自动算作本轮已读。本文摘要用于持续研究，不是第三方完整网页存档。

## 1. 仓库证据

仓库：[jiangxng/EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform)。基线 main `ccb5820b99d854e1e78f6c35bfb77e01e7d084f1`。以下均实际读取了文件或相关代码段；没有运行生产验收，代码存在不等于线上已验证。

| ID | 路径/标题 | 查阅范围与关键发现 | 当前用途 |
|---|---|---|---|
| R01 | `AI-BOOTSTRAP.md`、`project.status.json`、`docs/roadmap/HANDOFF-LATEST.md`、`LLM.md`、`llm.foundation-map.json` | 启动入口、里程碑/交接及相关规则；TR-01 主线；基础对象进度字段与路线图有不同步 | 本计划不改全局状态；正式实施先对账 |
| R02 | `docs/architecture/FOUNDATION-OBJECT-EXPERIENCE-IMPORT-WORKBENCH-v0.1.md` | 对象权威、多角色/面、导入优先、工作台投影、个人偏好与权限分离 | 延续设计，不重建万能主数据表单 |
| R03 | `docs/architecture/FOUNDATION-OBJECT-PLATFORM-ARCHITECTURE-v0.1.md`；`docs/roadmap/FOUNDATION-OBJECT-PROGRAM-v0.1.md` | 相关架构段落/索引及路线图前段；共享契约、企业资源持久化、通过三个对象证明复用 | 对象独立语义与分批实施 |
| R04 | `contracts/foundation-object/descriptor.ts`、`schema.ts`、`import.ts` | descriptor 完整；schema/import 相关定义；稳定字段、surface、语义目标、扩展槽、导入适配器 | 列/筛选/AI共用有效Schema，禁止把字段槽冒充页面槽 |
| R05 | `apps/counterparty/page.ts`、`apps/item/page.ts`、`apps/warehouse/page.ts` | 页面定义相关段及 kind/layout 检索；已有列表页和详情/动作路径；未据此认定完整表格已存在 | 迁移对象、兼容路由和第一条供应商旅程 |
| R06 | `vendor/eidos/src/catalog-browser/contracts.ts` | 完整契约；grid/list分别是卡片发现与管理列表，items输入；缺少完整列和远程分页契约 | 明确数据表格缺口；新能力由Eidos拥有 |
| R07 | `apps/data-import/page.ts`（ai-auto-map）；`recipe.ts`；`service.ts`、`experience-advisor.ts` 相关检索 | 已有 Agent 快捷任务和完成刷新；Recipe 包含确认、fingerprint及schema digest；检索发现经验建议适配路径 | 改善现有流程，不宣称AI匹配是待新建功能；EC接口不等于线上接通 |
| R08 | `apps/bi-workbench/composition.ts`、`package.ts` | 组合器相关实现及包贡献检索；授权项之上叠加企业角色默认和个人偏好 | 个人工作台不是完整BI引擎，不吸收分析业务 |
| R09 | `docs/architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md` | 分类规则和owner边界 | Eidos做通用交互，插件做业务，宿主做发现和授权 |
| R10 | `docs/architecture/DOCUMENTATION-LIFECYCLE-GOVERNANCE-v0.1.md` | 当前权威/历史/决策文档分类 | 本目录标记为提案，不覆盖正式协议或历史证据 |

代码定位方法：在固定提交下按上述路径读取；关键符号为 `FoundationObjectDescriptorV010`、`EffectiveObjectSchemaV010`、`FoundationObjectImportTargetV010`、`CatalogBrowserV010`、`composeWorkbenchHomeV010`、`dataImportSourceFingerprintV010`。路径比临时行号更适合下一窗口检索。

## 2. 外部资料索引

### S01 — SAP：List Report and Object Page

- 原始网址：https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html
- 状态：**仅读搜索摘要；打开原页返回无正文。**
- 摘要事实：List Report用于筛选和处理对象集合，Object Page用于查看/编辑/创建对象。
- 用途：支持列表→详情的页面家族方向，不用于断言最新 SAP 控件API或精确按钮规则。
- 未决：若未来需严格对标SAP，需要重新取得对应版本正文。

### S02 — Microsoft：Power Apps grid control

- 原始网址：https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/the-power-apps-grid-control
- 状态：**已读原文相关章节**；工具正文虽带站点统一登录提示，实际网格章节可读取。
- 章节：开篇能力说明；Configure the Power Apps grid control；Known issues and limitations。
- 来源事实：同一控件支持只读/编辑、分组、聚合、嵌套网格；Reflow可按宽度切为列表；各能力可配置。文档也记载分页与分组等组合限制及窄屏局限。
- 项目用途：列表和表格共享数据契约，复杂能力逐步开；手机有专门呈现。EVO不照搬产品限制，也不承诺全部能力首批实现。
- 易变信息：产品正在替代旧网格；不要把搜索得到的旧 Editable Grid 文档当当前选型依据。

### S03 — Microsoft：Import data in model-driven apps

- 原始网址：https://learn.microsoft.com/en-us/power-apps/user/import-data
- 状态：**已读原文相关章节**。
- 章节：导入步骤、Review mapping、Map lookup columns、Save mapping settings。
- 来源事实：支持列匹配、人工复核、关联字段映射、保存映射和查看导入进度。
- 项目用途：导入应有独立作业/错误体验；EVO现有Recipe应被继续利用；关系字段不能只当普通文本。
- 限制：其具体格式支持与导入行为属于Power Apps，不构成EVO当前实现证明。

### S04 — Microsoft：FAQ for Excel to table and app

- 原始网址：https://learn.microsoft.com/en-us/power-apps/maker/common/faqs-excel-to-table-app
- 状态：**已读原文**，重点能力、限制和用户可配置项。
- 章节：What can…do；limitations；operational factors and settings。
- 来源事实：Copilot可建议表/列名称、描述和类型；文档明确生成元数据可能不准确，用户可在创建前审核；地区/语言有条件。
- 项目用途：LLM做字段语义建议，确定性Schema和人工审核控制落地。模型失败时仍能手工操作。
- 限制：不能据该资料宣称中文识别质量或所有区域可用；EVO的中文评测和模型供应商能力需独立验证。

### S05 — AG Grid：JavaScript Data Grid SSRM Pagination

- 原始网址：https://www.ag-grid.com/javascript-data-grid/server-side-model-pagination/
- 状态：**已读原文相关章节**。
- 章节：Enabling Pagination；Server-Side Pagination（本轮页面标识v36.2.0，Enterprise）。
- 来源事实：服务端行模型按请求范围取数据，服务端执行分页，结果末尾需要正确信息。
- 项目用途：设计按需查询与真实范围；不能在全量数组上做假分页来应付大数据。
- 限制：没有评估许可证/成本，也未选择AG Grid依赖；EVO的cursor/offset选择由存储与查询语义决定。

### S06 — W3C WAI-ARIA APG：Grid Pattern

- 原始网址：https://www.w3.org/WAI/ARIA/apg/patterns/grid/
- 状态：**已读原文相关章节**。
- 章节：Data Grids For Presenting Tabular Information；Keyboard Interaction For Data Grids；编辑与焦点说明。
- 来源事实：交互网格需要管理单元格焦点和键盘导航；编辑键与导航键需协调；虚拟/动态加载可能影响首尾导航行为。
- 项目用途：Eidos统一键盘/读屏模型，避免只贴ARIA角色；普通表格与交互网格分阶段。
- 限制：APG是设计模式指导，不等于实现已通过可访问性认证；仍需真实键盘/读屏测试。

### S07 — Microsoft Power BI：Embed a report with RLS

- 原始网址：https://learn.microsoft.com/en-us/power-bi/developer/embedded/cloud-rls
- 状态：**已读原文相关章节**。
- 章节：适用场景；static/dynamic security；Generate an embed token。
- 来源事实：App-owns-data嵌入涉及有效身份/角色与令牌，行级访问由安全模型约束。
- 项目用途：BI链接参数只表达查询意图，不能作为授权；第三方嵌入需独立适配器及身份映射。
- 限制：尚未选择Power BI，也未研究当前采购/许可证条件；平台本地声明式部件并不因此需要Power BI令牌。

### S08 — SAP Analytical List Page（未作为关键依据）

- 原始网址：https://experience.sap.com/fiori-design-web/analytical-list-page/
- 状态：**仅搜索摘要；打开失败。**
- 摘要线索：图表与表格的分析页面模式及与普通List Report的场景区分。
- 用途：作为后续继续阅读方向。本计划的BI双路径和插槽规范是EVO设计建议，不声称从此正文得出。

## 3. 事实与判断的分界

外部事实只限上文短摘要。PLAN中的插槽ID、默认列数、pageSize、性能目标、批次安排、AI候选结构、插件超时/缓存策略，均为结合现有项目提出的**工程建议**，不是行业统一标准或已存在接口。

## 4. 冲突、限制与后续研究

1. 旧网格与新网格资料并存：以S02为本轮能力参考，不以旧页面决定新系统选型。
2. 无限滚动便于浏览；分页有利于稳定位置、选择范围与任务恢复。EVO首期建议分页，后续按场景启用无限滚动，不宣称一个方案适合所有任务。
3. 行内编辑提高效率，但带来字段权限、并发、局部失败与键盘成本。首期只读表格优先，后续限字段引入。
4. 同页BI减少跳转，却增加加载/权限耦合。先链接、后一个有隔离的只读部件；不是无限制页面注入。
5. SAP正文不可得；不补造最新规范。需要时继续查可访问的官方版本。
6. 当前Eidos大数据表格能力需在实施L0核对最新owner分支；本轮仅审查平台所固定的catalog-browser，不对整个Eidos仓库做“绝无任何表格”的断言。
7. 已有Schema并不证明查询端支持所有FILTER/EXPORT语义；L0需核对实际操作与性能，不先承诺全部能力。
8. 下一步最有价值的是用供应商真实任务验证第一版布局和数据协议，再确定表格实现库；不继续堆积泛泛的ERP产品资料。

## 5. 附件与复查方式

本轮没有视觉截图或付费/登录内容附件。公开网页在本文保存标题、原始URL、章节及足够的关键摘要；不伪称做了完整网页归档。代码通过固定Git提交重取。本目录与计划共同入库，是后续窗口的研究入口。

## 6. 通用业务体验框架补充资料（同日追加）

本补充未新增外部行业检索，不把上轮资料摘要扩大成所有业务均获验证。新增依据为实际读取的项目设计规则：

- 平台 `vendor/eidos/src/experience-architecture/contracts.ts`：读取页面archetype、journey、action、agent和quality契约，证明已有通用体验架构字段，不证明所有业务页面已实现。
- 平台 `vendor/eidos/src/design-language/mobile.ts`：读取手机策略；统一断点、安全区、触摸目标、单列、动作层级、字体缩放和禁止私有移动壳。用于框架§8。
- 平台 `docs/architecture/EIDOS-NAVIGATION-INFORMATION-ARCHITECTURE-ADOPTION-v0.1.md`：读取前段导航层级和单一归位规则。
- Eidos `docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md`：读取设计权威分层及Human Directness原则。原始代码地址：https://github.com/jiangxng/eidos/blob/36527256431ccafb71b759d70f2b72d8d83ea0c6/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md
- Eidos `MOBILE-DESIGN-LANGUAGE.md`：读取手机信息架构、字体、触摸、集合/表单和插件一致性段落。原始代码地址：https://github.com/jiangxng/eidos/blob/36527256431ccafb71b759d70f2b72d8d83ea0c6/MOBILE-DESIGN-LANGUAGE.md

Eidos资料使用本地已取得的固定提交，未声称是当前最新main。平台固定策略与owner文档一致；实施L0仍要对账最新版本。框架中七类应用的映射、状态维度、手机转换表与验收矩阵是本次设计建议，不是已有业务的运行证据。


## 7. BEX-01 Excel 驱动字段体验参考（2026-10-14 现场反馈追加）

**触发证据**：用户在当前 Railway 供应商 Excel 字段映射页打开“系统编码”列的目标字段下拉框，截图显示“忽略此列”和大量已有字段，但没有“创建企业扩展字段”选项。该截图仅说明**该下拉框没有入口**，不能单凭截图断定页面别处的上下文导航不存在。已核实 #843 的实际实现把创建入口放在映射页 `contextNavigation`，需要企业 OWNER/ADMIN、Object Extension 生效和未映射列同时成立。属于已上线功能的可发现性体验问题，尚非代码功能缺失的证据。

以下均为 **2026-10-14 实际打开原始官方资料并阅读相关正文**，不是只抄外链或旧窗口推断：

- **S10 勤哲 Excel 服务器官方教程《定义数据项》**：https://www.qinzhe.com/cn/tutorial-2015/t-05-03.html 。阅读教程中 5.3.1、5.3.2：在模板/选定单元格区域上定义字段名称、数据类型、必填、数据规范、主键；可由单元格标题产生字段名称候选，接着人选类型与数据表，保存模板。**启发**：字段创建紧贴用户正在处理的来源列、以实际业务语义命名、在人类确认后持久化。**边界**：其表单模板/数据表机制不等于 EVO 供应商基础对象 Schema，不能据此主张自动建核心对象。
- **S11 勤哲 Excel 服务器官方教程《模板的概念》**：https://www8.qinzhe.com/cn/tutorial-2015/t-03-02.html 。阅读“模板=表样+填表规定”“三种类型的模板”，区分基础数据、业务单据、台账报表及设计者/使用者权限。**启发**：从业务表格逐步形成可用系统，并保留字段含义与业务规则；不把每个文件都等同于一个独立对象。
- **S12 Microsoft 支持《基于电子表格创建列表》**：https://support.microsoft.com/zh-cn/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet 。阅读 modern Excel 创建列表步骤：选择 Excel 表、使用表头形成列表列、行变记录，创建前指定列表标题与存放位置；原文件上传后保存至 Site Assets 的可见性有安全提示。**启发**：从 Excel 数据预览直达结构草案，再由人确认。**边界**：此官方功能是建立 Microsoft List（列表），不能直接等同于 EVO 中由对象 Owner 管理的 Counterparty 主体/供应商关系。
- **S13 Microsoft 支持《列表和库的列的类型和选项》**：https://support.microsoft.com/zh-cn/sharepoint/lists/data-and-lists/list-and-library-column-types-and-options 。阅读列类型与列表表单、排序/筛选的关系；显示列不是权限的替代。**启发**：保存字段后立刻可供表单/列表使用，类型需先复核。**边界**：EVO 当前 CP-03 已有独立授权与字段定义，不能直接复制 SharePoint 列管理平台。

**形成的 BEX 局部设计候选（尚待用户确认，不算已实施）**：

1. 在每条未映射的 Excel 来源列对应的映射行内提供 **“+ 创建企业字段”** 明确动作（或等价相邻操作），而不是要求到远处的上下文导航寻找入口；现有导航可作为辅助入口。普通下拉继续仅列出有效目标字段，避免混淆“选择字段”和“执行创建”。
2. 点击时将当前来源列带入既有 CP-03 创建页，显示少量经过安全裁剪的行值样例；建议业务名称和类型，但以 Human 决定为准。优先提示映射已有字段；“忽略/保留来源证据”仍是合法选择。不得因未经确认的系统元数据列自动新增字段。
3. 保存之后回原作业/原映射位置，并使新字段立即出现在可选择目标字段中；对用户发出清楚提示“字段已创建，尚未导入任何数据”；后续仍执行预检查与显式提交。
4. `subjectType` 是核心必填身份字段，原 Excel 3 行缺失不得由创建扩展字段处理，也不得把“往来类型”自动转成“主体类型”。来源列“系统编码”语义待用户确定，不能仅据列名判定是 `code`、应忽略还是扩展属性。
5. **“从 Excel 新建完整业务对象/表单/列表”**属于更广的未来能力研究：与本轮“在已有供应商对象上补企业扩展字段”严格分离，不在 BEX-01/CP-03 收尾中增加通用自由建表、物理迁移、Agent、EC 或新权限模型；若另行启动，需独立讨论业务对象语义与 Owner。

**状态**：研究资料原文已读；用户下拉截图已看到；页面导航是否真实显示、权限/安装状态、原 XLSX Human 操作结果仍待用户现场反馈。当前仅方案建议和文档沉淀，未经用户确认不修改页面或将 `HUMAN_ACCEPTANCE_PENDING` 改为 PASS。

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

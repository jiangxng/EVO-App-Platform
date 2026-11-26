# CV07 · 业务字典导入映射闭环与父子字典项编辑 — 2026-11-26

## 目标与完成条件

用户提供四张东京在线截图（2026-11-26），实际导入 `dictionary_业务字典.csv` 共 193 行、7 列；阶段 2 的 Eidos 工作台顶部显示“选择文件 ✓ / 2 核对并导入”，底部唯一 primary 为“保存映射并预检查”，但实际尚未导入，导致“第二步没有导入”的可理解性问题。业务字典界面为空，系统默认字段是否缺少也待确认。完成条件：用户准确看见**上传 → 映射/预检查 → 明确确认导入 → 字典草稿 → 人工发布**，未处理的来源列不得静默丢弃；可用字典与字典项两层及项内任意深度父子关系进行实际保存、编辑、查询与发布；拒绝错误 parent、自我循环与跨字典引用。

## 流程与步骤

- 原：文件上传成功 → “核对并导入”貌似第二步是最后一步 → 3 个待决定的来源列 → 用户误以为“保存映射并预检查”就是导入。
- 新：文件上传 → 第 2/3 步“字段映射与预检查”（保留所有未处理来源列、每个都必须明确映射/忽略）→ 第 3/3 步“确认导入”（预检查通过才提供真实 Host COMMIT）→ 原有 Draft 出现 → 人工发布。没有自动写业务数据的浏览器快捷按钮。现有流程结果页面和安全门禁原样运行。
- 字典管理：业务字典列表 → 字典详情 → “编辑字典”改名称或“新增字典项” → 行内“新增子项”直接带父编码 → 编辑项可变更上级（根/非根）、标签、中文名、别名和状态。选择父节点属于显式 Human 决策；存储仍是同企业内 `option.parentCode`，编码本身稳定且不可重命名。

## 导航与信息架构

同一业务插件列表/详情/表单，不新增全局“字典管理树”菜单。字典本身是定义，字典项是可层级管理的选项，只有选项才有 `parentCode`。上下层始终由 `dictionaryId` 划定企业作用域；表单返回原字典详情。沿用 Eidos `catalog-browser` 和 `form`，不制造另一套表单系统。保留字典详情行内“编辑”“新增子项”近距操作和已有导航。没有跨字典 parents，也不以名称建立关系。

## 视觉与颜色

- 现有 Eidos Business Office 颜色/token/按钮层级不变。父子项以 `↳` 引导的文字层级及“上级选项”元数据显示，不用悬浮菜单假树或新图标。
- 编辑字典使用现有 form 页面，字典编码隐藏为不可编辑稳定键；修改名称产生新的 DRAFT，只有 Human 发布才生效。新增子项的父编码在表单里可检查和显式修改。
- 第二步顶部真实 Eidos reviewTask steps 改为三个状态（complete/current/upcoming），避免“核对并导入”的错误终点暗示。原有 footer CTA 的 save/dryRun 安全边界不变。

## 记忆与注意力

- 用户截图 7 列原始字段：`选项主键`、`字典编码`、`字典名称`、`选项编码`、`选项名称`、`来源别名`、`状态`。正式 Owner 有 7 个默认可写字段：dictionaryId、displayName、optionCode、optionLabel、optionStatus、optionLabelZh、optionAliases。源 `来源别名`、`状态`与现有目标只有表头别名差异，此次增加 Owner-governed `importHeaderAliases`，通用 Data Import 唯一匹配器按同样去重/歧义拒绝规则使用这两项，并增加第 8 个可选字段 `parentCode`。旧数据不需迁移。
- `选项主键`看似 `payment_method/TT_BANK` 组合键，但从**截图不足以证明**该列是可靠的业务字段；不能暗中映射、拼拆或保存到其他 code。它仍在原始 Job 中保留且需 Human 显式选择不导入或未来业务 Owner 定义独立字段。如未来确有真正的外部主键，需单独扩展有审计的 externalId，不冒充 parent 或 optionCode。
- 同一批次新增的父与子允许父在 CSV 前或后；Data Import 现在调用可选的 Owner `validateBatch` 对整批父级不存在/环路提供行级预检查问题，最终 Domain repository 在原子事务中再次校验完整选项图。旧无父级的字典项仍是根项。保存新 DRAFT 不改已发布的引用真相，重复恢复保留文件源和映射状态。

## 无障碍与跨年龄

Eidos 标准语义 form/select、按钮、上下文导航继续承载操作；新增父级字段用可读中文选择框，不靠颜色表达层级。触控间距和焦点继承 Eidos，宽屏表单仍保持 productive density、390px 独立排列。层级文本的 `↳` 是视觉辅助，元数据明确标注父编码供屏幕阅读器读出。真实中文、zoom、键盘/手机的授权会话依旧要 Human 验证，不能拿 JS DOM 测试充当签收。

## 安全与数据修复

- Owner repository 保存前先标准化 options，再校验 parentCode 必须是**同一快照同一字典**中稳定且实际存在的选项编码；不能自指、不能成为子孙、不能形成任意长度环。缺父报 `BUSINESS_DICTIONARY_PARENT_NOT_FOUND`；循环 `BUSINESS_DICTIONARY_PARENT_CYCLE`，事务原子回滚。
- Option Save 仍由 Host Principal/企业 OWNER/ADMIN + Feature/ActionRouter 再授权。Definition-only 编辑通过现有写 Operation 的固定 `definitionOnly="definition"` 字段进行分支，必须有已存在的字典；不允许借此绕过版本冲突、更新其他企业或隐式发布。
- 导入数据仍经通用 CSV/XLSX staging→mapping→dryRun→transactional Owner commit。新增 `parentCode`是可选列，先前没有层级的行原样兼容；批次内父存在性先由 Owner `validateBatch` 于 dry-run 校验，再由最终原子事务复核；只查询当前企业，不读取其他企业。预检查发现 3 列待决时必须先决定，否则拒绝继续。
- 不改变 Agent READ/Writes、发布行为和 CV03/04 正式能力，不写生产数据。

## 证据与剩余问题

实查 `apps/business-dictionary/import-target.ts` Owner schema 7 列；`apps/business-dictionary/page.ts` 原有显示/编辑项但无 parent；`contracts/reference-data/dictionary.ts` 原 option 仅 code/label/aliases/status；`apps/business-dictionary/repository.ts` 原子 DRAFT/PUBLISHED revision，`apps/data-import/page.ts` 确认原 2 步 stepper 且仅底部 save+validate，`apps/data-import/actions.ts` 明确先预检查且成功后才在 review 提交。截图里 `4 已匹配 / 3 需核对`并不等于提交成功。

精确新增/修改源码索引：
- `contracts/reference-data/dictionary.ts`
- `contracts/foundation-object/schema.ts`
- `apps/business-dictionary/repository.ts`
- `apps/business-dictionary/actions.ts`
- `apps/business-dictionary/import-target.ts`
- `apps/business-dictionary/page.ts`
- `contracts/foundation-object/import.ts`（可选 Owner 批次级预检查）
- `apps/data-import/service.ts`
- `apps/data-import/page.ts`
- `catalog/seed.ts`
- `manager/server.ts`
- `tests/protocol/cv07-dictionary-hierarchy-edit.test.mjs`
- `tests/protocol/data-import-human-experience.test.mjs`
- `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`

自动化目标：真实 repository parent orphan/self/cycle/fail-closed，definition rename/permission，编辑 parent + return route，规范化别名，真实 CSV 两行父子 stage/dryRun/commit。CI 未通过前不得标已部署。东京 Human 未签收，特别是 193 行文件未由开发环境访问/写入；用户需要自己的合法企业会话确认正式批次、字段匹配及发布。父子层级之外的“跨字典依赖”“整棵树批量拖拽排序”“删除父节点级联”本次没有未经 Owner 授权实现。

## 页面模式与导航归属

业务字典目录和详情采用 Eidos Catalog Browser，字典/选项编辑采用 Eidos Form，导入中心采用 Data Import Eidos Review Workbench；都属于当前领域业务页面，不新增全局 Settings 导航。Host 只管理企业关系、权限与生命周期，Domain Owner 保存正确性，Eidos 只做语义呈现。普通用户可读详情但不能看编辑/子项写入动作。

## 功能、布局、颜色对照

功能：原有字典无父级字段、单项标签编辑、导入 stepper 2 步；修改为多级父子保存/编辑、字典单独改名、显式 3 步导入语义与 Owner 安全别名。
布局：保留既有 PC 业务详情和单一表单；字典子项按根到叶的顺序排列，显示父级。原截图是导入工作台长页而非单独移动布局，不降低 PC 工作空间。
颜色：Eidos Business Office neutral/white/primary-blue 原样，发布危险确认/状态语义不变。
桌面：待 CI 浏览器验证高密度层级列表、字典改名、导入 CTA。
移动：待 390px/zoom/真实触控验证上级字段选择与三阶段 stepper。
Human：NOT SIGNED；不宣称 193 行已经写入。

## 入口、退出与恢复矩阵

入口：业务字典列表→字典详情→编辑字典/新增字典项/新增子项；或业务字典→导入 CSV/Excel→映射第二步。
退出：保存仅产生 DRAFT 并返回字典详情；完成导入必须预检查通过后明确确认→新增 DRAFT；单独发布才生效。
异常恢复：非法 parent/self/cycle/旧版本/权限拒绝均不写资源；来源列待决时阻断预检查，用户可回到映射选择忽略/真实目标，保留原 CSV/Excel Source 与纠错证据。

## 浏览器与 Human 证据

新真实浏览器/CI 证据待 PR 精确 HEAD 生成。功能测试不能充当 Tokyo 登录会话中的 193 行批次导入验收；用户截图保留在本轮对话，未复制企业文件或私有实际数据。

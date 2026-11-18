# List Foundation MVP #03/06 — 从筛选列表进入导入，并返回原业务上下文（2026-11-18）

> 范围：原 Counterparty + Data Import V3/Eidos + Platform Host，绝不重建导入引擎。本次 UI 源：`apps/data-import/page.ts`、`manager/server.ts`；原 target 实现：`apps/counterparty/import-target.ts`；后端已有 `service.stage / dryRun / commit` + Receipt 不变。此文为机器可审查的设计和安全证据，不是实际用户/物理设备已签收。

## 目标与完成条件

用户在「供应商」或「客户」列表完成搜索、状态、主体类型、排序、分页和显示列设置后，点击**原有导入**。导入中心既有 CSV/XLSX 上传、字段映射、预检查、行纠错、确认提交、回执仍照常工作；无论成功或校验失败，用户都可点「返回供应商列表/返回客户列表」回到最初的**精确合法列表路由**，而不是被丢回未筛选首页。列表 Host 每次重新校验当前企业/责任范围/字段 READ；浏览器参数不是读写权限。

## 流程与步骤

1. 从已授权的供应商列表使用 `status=ACTIVE AND subjectType=ORGANIZATION AND search=Hong`，选择列顺序 `displayName,status,subjectType`、排序 desc、第 2 页、每页 15 条。仅当当前账号真实具备业务管理权限且 Import Target 已安装时，Eidos 原主动作区显示「导入」。
2. Platform Host 根据**正在展示的已验证** `CounterpartyProjectionRouteSelection` 生成 `counterpartyProjectionQueryRouteV010`，作为 Data Import 上传链接的可选 `returnTo`；保留 `relationshipMode=SUPPLIER`，原 Upload route parser 仍严格拒绝多余/重复参数、外站和非法 query。
3. 只有当前已安装的业务 Target `completionNavigation` 同意**同角色、同路径、同 allowlist 查询、逐字 canonical** 的 originRoute，上传页面才回显「返回供应商列表」和隐藏的来源路由；该隐藏字段永远不能授权。
4. `data-import.stage-file` 在任何资源写入/文件解析前重新验证角色与 originRoute，跨角色、伪造外站、重复/非法筛选须拒绝；仅安全的 600 字符以内内部路由作为非授权提示加入企业 Import Job。
5. 原 Mapping、Dry Run、Row Correction、Review、Commit、Receipt 全由既有 Host、Target、Eidos 和 Data Import Domain Owner 完成；在每一步可按原上下文导航退出。Job 中保留 returnTo，导入成功、失败或再次打开历史 Job 时仍能回到原列表。
6. 点击结果页「返回」后重新进入 Counterparty Host，绝不重用导入权限或旧的 Owner 缓存；过滤范围内没有新记录时原合法查询仍保留，不能误称导入失败。

## 导航与信息架构

原「供应商/客户」目录的上下文操作，导航到「数据导入」工作台子流程；导入页仍使用既有 `UidlFormV011` 上传/映射和 `CatalogBrowserV010` 核对/回执。没有新导航主栏目、伪列表或额外插件框架。已有 Target `completionNavigation` 是目标页面 Exit 的唯一权威；传入可选 originRoute，保留未带来源路由的旧行为（仍回到该目标的普通列表）。不在工作台顶栏重复创建「返回」卡片。

## 视觉与颜色

沿用 Eidos 现有上传表单、映射四列决策工作台、核对页原操作区和导航。原中文「返回供应商列表/返回客户列表」不变，唯一路由比此前更精确；隐藏来源 Hint 不会给用户增加一行技术参数。无自定义 CSS、硬编码颜色、桌面浮层或移动端额外控制。既有 1280px 与 390px 样式按 Eidos token 保持。

## 记忆与注意力

系统替用户保存合法的临时筛选、列显隐及顺序、排序、页码、每页数量；不能要求用户导入完成后重新搜索或逐个恢复列。导入 Job 仅额外保存**只读返回路由字符串**，不保存行快照、账号、Cookie、Token、企业账号授权或 Saved View WRITE。正式提交失败、用户取消、调整映射和行纠错后仍有相同退出位置。历史未携带 returnTo 的 Job 向下兼容。

## 无障碍与跨年龄

复用 Eidos 原生可聚焦「导入」「返回」动作，按钮和文字清楚，不仅靠颜色或图标表示原页面；390px 不增加新组件和横向滚动。实际实体键盘、手机与 NVDA/VoiceOver 并未因为新的协议测试自动签收；#1343 为上线前 0/12 NOT_SIGNED，当前内部 MVP 普通开发可继续。

## 安全与数据修复

- **入口**：无 `canManage`、无 Target，不生成导入动作；旧查询仍按 Host 的 `ProjectionService.read` 检查企业、责任和字段权限。
- **回路由**：目标导入插件的 Host 输入只有 600 字符以内、非绝对、无 `//`、无反斜杠、无 `#`、无控制字符的内部路由；Counterparty Target 严格按当前 `relationshipMode` 要求恰好 `/counterparties/suppliers` 或 `/counterparties/customers`，禁止跨范围、重复/未知字段、非 canonical 路由；不存在自由重定向。
- **写入**：只在授权的 `stage-file` 存储 navigation hint；它不进入 Import Target `schema`、Prepared Row、CSV/XLSX 解析、Import Recipe、Commit、Receipt 或字段权限。校验失败不会创建 Job。
- **退出**：不因为持有 Import Job 就授予列表 READ。原 Counterparty 路由在返回时由 Host 原有 Domain Owner 再查询，撤权/切企业/Feature 停用仍 fail-closed。
- 不能把本回路由当作 CV03 正式 Saved View SAVE；CV03 N1 NOT_CERTIFIED/Human SAVE OFF、CV04 正式后台 EXPORT OFF、Google OIDC 门禁、#1212/#1092/#1343 均保持不变。

## 证据与剩余问题

- 同 PR 更新 `tests/protocol/bex01-supplier-import-journey.test.mjs`：真实 Counterparty Target + 资源仓库 + Data Import Service `stage → mapping → dryRun → commit → reload → review → return`，核对搜索、状态、主体类型、排序、分页、显示列，及跨角色/外站/重复参数拒绝；这属于工程集成级测试，非实际浏览器录像。
- 更新 `tests/protocol/data-import-human-experience.test.mjs`：真实 `stage-file` Handler 先拒绝跨角色和不安全路径且零 Job 写入，再成功携带合法来源路由保存到现有 Job；沿用原 XLSX 文件解析测试，不新建导入引擎。
- 现有 V3 真 Host + Chromium 工作流负责对旧工作台导入、行纠错/回执做防回退；**若本 PR 未直接新增完整浏览器点击原路由的专项，不得虚称真实 1280px/390px 新回跳已获自动端到端证明**。
- 精确 PR HEAD Protocol/Core、Lightweight Host、UI Review、现有 V3 Chromium 和合并后 Tokyo 的结果只能从实际 GitHub Jobs 判断；未通过前不宣称发布。
- MVP 后续可按本 Owner opt-in 契约适配 Item/Warehouse；不得将 Counterparty 角色规则硬编码进公共 Data Import 基类。

## 页面模式与导航归属

唯一 Page Archetype 为原 Eidos Catalog（供应商/客户）→ Data Import Upload Form → Mapping Workbench → Review Catalog；返回是导入工作台内已有的辅助上下文操作，不新增全局工作台入口。Host 负责 Principal/Active Enterprise/Feature，Counterparty Target 只决定合法目标路由，Data Import 保存 navigation hint，不承担业务 SELECT 权限。

## 功能、布局、颜色对照

| 维度 | 已有能力 | 本轮变化 |
| --- | --- | --- |
| 功能 | 导入流程及 Recipe/Receipt、默认返回客户/供应商列表 | 返回当前有权原筛选、排序、分页和列设置；跨范围/非法路由拒绝 |
| 布局 | 1280px/390px Eidos 原有目录、导入决策工作台、核对页操作区 | 无新页面，复用原操作和 breadcrumbs |
| 颜色 | 原 Eidos Business Office Token/selected/focus | 不增加新 token、私有样式或误导性已认证提示 |

## 入口、退出与恢复矩阵

| 入口和权限 | 动作/目标 | 返回父级 | 异常恢复 |
| --- | --- | --- | --- |
| 供应商，manager + Target | 原筛选列表 → 上传 XLSX/CSV → 映射/行纠错 → 预检查 → 明确确认 | 已提交 Import Job 的 Review 显示「返回供应商列表」到精确筛选 route | 校验失败可退出；已有导入 Job 与源数据不丢失 |
| 客户，manager + Target | 客户列表 → 对应角色导入 | 回原客户页面及原 query | 错误关系角色或供应商 route 直接拒绝 |
| 历史导入任务 | 从 Data Import Directory 重开 Job | 原任务已保存的合法 returnTo，或旧版默认列表 | 若取消/未完成不改业务对象；原 Job 仍可恢复 |
| 失权/跨企业 | 页面/导入入口被撤销 | 回到 Host 重新鉴权的列表，不能靠 URL 访问隐藏记录 | 新管理操作拒绝；权限更新后手动返回原列表重试 |
| 无 Import Target | 原列表无 import action | 不构造来源回路由 | 不显示不可用的创建/导入假动作 |

## 浏览器与 Human 证据

桌面：本轮同 PR Protocol 真实 Owner Service 验证源路径/Job 持久、按钮结构；原 V3 Chromium 全流程以真实 CI 结果为准，**不预填新的原列表回跳点击 PASS**。
移动：390px 使用原 Eidos 布局；本轮专项实物触控未取得，旧工作流回归不替代新回跳点击。
Human：0/12 NOT_SIGNED，正式上线前独立审阅；本轮不变更身份或权限。

功能：保存最初列表显示条件并在导入提交和失败后使用，同时保留旧默认返回。
布局：原 Catalog、Upload、Mapping、Review 页面，无自定义工作台。
颜色：使用 Eidos 原 tokens，未改 CSS 或状态色。
入口：有权 Supplier/Customer Catalog 原 import action，必须 Target 有效。
退出：已有 Return action 导航到当前企业下原筛选路由，Host 再鉴权。
异常恢复：无效、跨角色、外站、重复参数和撤权条件均拒绝或回默认合法主页，绝不暴露隐藏数据。
桌面：需以当前 PR 真实 Chromium/Protocol 状态为准。
移动：需以当前 PR 390px 证据为准，不冒称实体机测试。
Human：仍为 0/12，待上线前；与内部 MVP 开发分离。

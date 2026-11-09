# CV-03 / C3-02：业务字典个人视图路由恢复与生产默认关闭审查（2026-11-09）

> **范围：工程代码/自动测试，未启用生产、未获得实际桌面或 390px Human 签收。** 本批基于已合并 #1180、#1182、#1183、#1185、#1186，修改 `apps/business-dictionary/directory-query.ts`、`apps/business-dictionary/page.ts` 和 `manager/server.ts`，不修改 Eidos 原组件、不引入第二套保存视图/表格框架。原权威计划：`docs/plans/foundation-list-experience/COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md`。

## 目标与完成条件

解决 Eidos 个人视图 Tab 显示后，点击其安全路由无法保留个人视图选择状态的问题。用户点击个人视图后，可以继续搜索、排序、分页、进入详情及返回原列表；系统视图可退出。选择 ID 只是**不可信 UI 提示**，不会使用户跨越原 Dictionary Collection READ、Host 当前主体/企业权限或 Saved View READ。默认 Host 走旧页面，未经生产 Provider/Receipt 准入不启用 WRITE。

## 流程与步骤

1. 只在原 Dictionary Owner 允许的 `/business-dictionaries` 路由中新增可选 `personalViewId`，严格限制为最多 80 字符的标识符，重复、空值、非法路径、外部 URL 一律拒绝。
2. Eidos 个人 Tab 由**当前 Host 已授权**的 Saved View 候选生成，URL 是 Dictionary Owner 的 `businessDictionaryDirectoryQueryRouteV010` 构造；来源候选先经过当前 Collection Schema/字段检查，再依据路由提示标记当前 Tab。
3. 搜索、列排序、分页与详情 `returnTo` 保留当前受认证的 ID；点击原系统 Tab 时明确删除个人 ID。旧标签撤权/过期时，页面只保留系统 Tab，后续链接均清除无效提示。
4. 在原 `GET /v1/experience-pages` 字典目录 Host 路由内加入 `APP_PLATFORM_CV03_PERSONAL_VIEW_PAGE_MODE`，仅 `OFF`（默认）或 `READ_ONLY`。后者同样先通过原登录/企业成员资格/业务目录读取，再调用原 ActionRouter 上的 Saved View READ 桥接；不是新权限路径。当前生产 Host **仍未注册新的 Saved View Feature**，因此即使配置 READ_ONLY，也不会凭空出现个人视图或授权 WRITE。

## 导航与信息架构

页面仍是原 `CatalogBrowser` 单列表、原 Eidos `table.views`。个人标签被选中时，不重复选中“全部/草稿/已发布”。搜索/翻页/详情返回只传一个有界 ID，真正数据行与可读字段每次由 Dictionary Owner 和 Host 重算；存在旧 ID 但无有权候选时，选中状态恢复到当前系统视图。保留“新建字典”原按钮及详情向上的返回路径，不另设私有导航系统。

## 视觉与颜色

未增加 CSS、皮肤、主题色、第二条工具栏或不一致按钮。个人 Tab 继续沿用 Eidos 原有可访问导航和紧凑表格样式。长标签仍按上游有界名称处理。不能由代码编译推定 390px 真机视觉、横向滚动、颜色或触摸体验完成。

## 记忆与注意力

用户无需重新记住复杂筛选：选择的**有权个人视图**可在一次列表任务中的搜索、排序和详情往返中保留。撤权/换企业/插件关闭后不显示陈旧 Tab，也不从 LocalStorage 或输入参数猜回上一次个人状态。用户点击原系统 Tab 即退出个人视图，无额外关闭按钮或混淆状态。

## 无障碍与跨年龄

沿用 Eidos `aria-current=page`，只允许一个选中项；保留原导航语义、查询表单及默认键盘访问顺序。页面与按钮文本来自原业务语言包及经过有界验证的 View 标签；实际读屏、焦点、手机 390px 与老年用户字体布局需单独浏览器/人工签收。

## 安全与数据修复

- `personalViewId` 不与 Principal、授权策略、资源地址或数据库命令关联，只是供 Host 以实时有权 View 集合**再校验**的提示。
- 字典 route parser 拒绝 URL 逃逸、额外参数、非法 ID、重复字段；原 schema 可读列校验和 Domain Owner 查询仍是最终依据。重复/撤权/过期提示不能进入下次搜索、分页、详情的路由。
- Host 新入口默认 OFF；READ_ONLY 不注册 Saved View Feature，也不增加 action handler/PG secret/签名密钥/用户权限，只在原字典目录权限检查通过后使用现有 ActionRouter；失败回退系统视图。生产依赖 Railway/Tokyo 存储拓扑和认证签收仍是阻塞项。
- 业务行、Options、隐藏字段、保存视图 Payload 均不存放在 URL 中；浏览器缓存不得据此恢复已撤销权限的数据。

## 证据与剩余问题

`tests/protocol/cv03-eidos-private-view-tabs.test.mjs` 覆盖 Eidos 实际 HTML、合法选中、系统退出、搜索排序分页及详情 `returnTo`、伪造/失效 ID 与旧页面兼容；`tests/agent-line/cv03-personal-saved-view-postgres.test.mjs` 的真实 PG18 Host→Eidos 回归更新为路由选中提示，验证当前有权主体读取。最终证据以本 PR 的最终 HEAD、平台核心、轻量宿主及 PG CI 结果为准。**缺少**正式 Host 配置激活、线上 PostgreSQL authority 的迁移和角色密钥验证、实际用户操作真实浏览器、390px 和自然语言 LLM Run；不声明这些事项通过。

## 页面模式与导航归属

使用原业务字典 `apps/business-dictionary/page.ts` / `directory-query.ts` 作为路由、表格数据和导航 Owner；`manager/server.ts` 作为真实身份/企业边界；`manager/cv03-personal-saved-view-dictionary-presentation.ts` 只调用有权 Saved View READ；Eidos 原浏览器负责视觉呈现。没有独立 `SavedViewFramework`。

## 功能、布局、颜色对照

功能：个人 Tab 的选择/查询/分页/详情返回恢复；系统视图及业务按钮保持。尚无新保存按钮和正式 WRITE。
布局：Eidos 既有标题、导航、表格、搜索及分页控件原位。
颜色：未改设计 Token、CSS 或局部主题色，颜色实际效果仍待浏览器核对。

## 入口、退出与恢复矩阵

入口：Host 当前有权字典页及个人 Saved View READ 返回有效配置，个人 Tab 中的安全 URL 含可选 ID。
退出：选择原“全部/草稿/已发布”，产生不含个人 ID 的原有 URL；详情内通过 `returnTo` 返回个人列表。
异常恢复：伪造或被撤权的 ID、失效 Schema、插件停用、缺企业/身份时，不显示私人 Tab；保留或返回原合法企业页面和系统视图。

## 浏览器与 Human 证据

桌面：仅机器 CI 的 Eidos HTML、路由和 Domain Owner 测试；无真实生产页面截图或 Human 验收。
移动：390px 实际触摸/焦点/换行/横向导航没有真实签收。
Human：尚未签收，不升级 CV-03 阶段为 HUMAN_PASS。

**回滚条件**：移除可选 query hint 与 Server 的 OFF/READ_ONLY 门禁，原安全 Dictionary URL 和 Eidos 系统 Tabs 继续工作；本批无数据迁移、数据库读写或生产发布。
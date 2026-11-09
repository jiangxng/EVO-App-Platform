# CV-03 / C3-02：可信 Host Saved View READ 接入 Eidos Dictionary 列表（2026-11-09）

> **工程阶段：TEST_WIRED_ISOLATED / PRODUCTION_NOT_REGISTERED / HUMAN_NOT_SIGNED。** 依托已合并的 #1180/#1182/#1183 受限个人配置 Owner 和 #1185 Eidos 可选个人视图 Tab，新增 Host 级读取桥接 `manager/cv03-personal-saved-view-dictionary-presentation.ts`。不启用生产功能、不修改 Eidos vendor、不引入第二套 List、授权或数据库框架。

## 目标与完成条件

以前一阶段静态“Host 已授权候选”输入为基础，进一步验证真实页面装配中候选必须来自**当前 Host ActionRouter** 所执行的 `collection.saved-view.personal.list` Capability Operation，使用本次请求的 Principal/Enterprise Context，原 Dictionary 页面仍负责当前业务行授权和 Eidos 视图渲染。没有通过 Host 认证的个人标签不显示。

## 流程与步骤

1. Host 已验证用户及所属企业并取得当前业务字典 Domain Owner 有权的 Dictionary Snapshots（此步骤属于生产 Host，独立测试保留其当前仓库实现）。
2. 新桥接发起同请求 Context 下的原 Saved View READ Action；若 Feature 未安装、失效、没有权限、返回非法格式、异常，则**回退到原系统视图页面**而非恢复缓存。
3. READ 结果再次检查 visibility/owner/enterprise/source query operation/collectionId/schemaRef/title/query/columns 后交给 #1185 的原 Dictionary Page；其余字段来源不可信，不用于计算权限。
4. Dictionary 通过原有 route builder/parser 构造 Eidos `table.views`，不新增外部路由或保存接口。

## 导航与信息架构

原全部、草稿、已发布为业务主视图。经 Host 验证的个人配置可在同一个 Eidos Table 视图导航中出现；无保存权限时也不会自动获得写入能力。进入/退出仍是原 Dictionary 列表/详情/返回路径，没有新侧边栏、重复新建按钮或第二 Page Shell。

## 视觉与颜色

不修改主题、CSS、色板、字体、密度或桌面布局；仅使用既有 Eidos `table.views` 候选。完整人机尺寸/颜色实际效果尚未经真实桌面及移动端审查，不能仅从接口测试判定 100% V3/Eidos 还原。

## 记忆与注意力

个人视图名称只在当前 Host 有权 READ 后显示，降低重复筛选操作；撤权/切企业/源 Schema 变化无需用户手动清除旧 LocalStorage，默认无缓存且每次由服务器重新授权。未能授权时系统视图仍存在，用户可从原路径继续操作。

## 无障碍与跨年龄

继续沿用 Eidos 原来的 `aria-current` 与视图 Tab 语义；有且只有一个选中视图。无复制的私有 HTML 按钮或内联焦点脚本。屏幕阅读器、键盘流程、390px 触控目标和实际换行尚未通过真机/浏览器 Human 验收。

## 安全与数据修复

- Principal 的 subjectId、Personal Context owner、activeContext enterpriseId 和 scope.userId 必须一致且有效，拒绝外部 delegatedActor。Context 不合规则显示选择企业页。
- 强制 Saved View READ 为原 ActionRouter，任何授权失败/失效默认**无个人 Tab**；显示配置不等于业务 Data READ 提权。
- 来源限定为真实 Dictionary `dictionary.collection.query`，页面只接受当前 Collection Schema，重新检查列白名单和安全路由。伪造 visibility/owner/enterprise/SQL/隐藏列/旧 Schema 不出现。
- 不允许从用户/LLM 提供 arbitrary Host authorized view 数组给桥接，不持久化业务记录；生产未接线，回滚不影响个人资源存储。

## 证据与剩余问题

- 真实 PostgreSQL 18 / Host/Agent 隔离协议测试 `tests/agent-line/cv03-personal-saved-view-postgres.test.mjs` 延伸原 #1180 的可信 Host signed atomic receipt/Domain Owner，覆盖保存后的 Host READ → Eidos HTML、跨用户/企业、撤销业务源权限、Feature 停用、缺失 Context。
- 原 `tests/protocol/cv03-eidos-private-view-tabs.test.mjs` 继续验证旧页面和伪造候选保护。
- **不能宣称已交付**：production Host `manager/server.ts` 页面装配、正式数据库切换、实际身份登录、Eidos 浏览器/390px Human 签收、外部 LLM 和多主机密钥/SQL 权限认证。项目目前仍保留相关 C3-02/C3-04 OPEN 门禁；以最终 PR HEAD/CI 精确事实为准。

## 页面模式与导航归属

采用 Eidos CatalogBrowser list/table，Dictionary domain 页面拥有安全路由和列配置；Host 只负责取回现有 Capability Operation 的授权个人候选。这不是独立 Saved View UI 或第二套 Host 运行时。

## 功能、布局、颜色对照

功能：只读个人候选复用旧 Dictionary 视图菜单；本 PR 不增加 Save Action 或共享配置管理。
布局：原 Eidos 导航、数据表和分页不移动；用授权候选扩展同一区域。
颜色：不新增 CSS、主题色或自行模拟 V3 颜色。

## 入口、退出与恢复矩阵

入口：宿主有权 Dictionary READ + Saved View READ，当前 Principal/Enterprise 可见其合法私有 Tab。
退出：继续由原 Tab、详情返回与 Host 路由执行，视图 ID 不作为权限凭据。
异常恢复：拒绝/撤权/停用/跨企业/异常响应恢复为原系统 Tab，不显示过时个人候选；无合法企业则展示原选择企业页。

## 浏览器与 Human 证据

桌面：未获得真实登录/截图与人工验收，只有 Eidos HTML 输出及 CI 协议回归。
移动：390px 浏览器/触摸/焦点与视觉层级尚未实际签收。
Human：没有真实用户签收记录；不应从机器 CI 自动升级为 HUMAN_PASS。

**实现边界：** 只新增隔离的可调用 Host 桥接和测试，正式生产何时接线需统一的 Provider/Authorization/Receipt/部署 owner 决策。旧功能默认无变化。

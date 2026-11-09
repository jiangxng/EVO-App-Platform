# CV-03 / C3-02：Eidos Human「将当前筛选保存为我的视图」隔离表单（2026-11-09）

> **状态：ISOLATED_FORM_AND_HOST_NORMALIZATION / REAL_PG_TEST / NOT_PRODUCTION_REGISTERED / HUMAN_NOT_SIGNED。** 本批只实现既有 Eidos UidlForm 与 Host 到原 Capability Operation 的可信桥接。**不在 `manager/server.ts` 注册页面或开放正式 WRITE、不向 `catalog/seed.ts` 注入额外业务应用、不添加独立视图框架**。依据：#1180/#1182/#1183 真实签名 PostgreSQL Owner，#1185～#1188 只读 Eidos Tab、路由和列恢复。

**被审查的 Human UI 源码路径：** `manager/cv03-personal-saved-view-human-form.ts`。表单使用 Eidos 现有 UidlForm；真实浏览器与生产路由仍未认证。

## 目标与完成条件

Human 从一个**当前有权业务字典列表**发起“保存我的视图”：输入有语义的名称，确认后保存当前筛选/排序，读取回当前个人 Tab，能继续查看现有 Eidos 表格。此阶段严格区分**可部署前的隔离 UI 纵切**与正式生产页面发布：当前仅后者的前置材料，不能宣称线上已出现按钮。

## 流程与步骤

1. **显示表单**：Host 未来必须先验证登录、当前企业、字典 Domain Owner READ、PG 存储以及已激活的个人 Saved View Feature；然后可使用 `createCv03PersonalSavedViewHumanFormV010` 生成现有 UidlFormV011。由 Host 生成新的 bounded `viewId`；普通用户只需填写名称。返回路径来自 Dictionary Owner 的白名单路由。
2. **Human 显式确认**：表单按现有 Eidos `execute-command` 操作显示提交确认，不隐藏自动 WRITE。用户输入只含 `title`、`viewId`、`returnTo`；所有权限、企业、Schema、字段及版本均不信任这些表单字段。
3. **Host 规范化**：`executeCv03HumanSavedViewFormV010` 只接受已确认 Human、活跃 Enterprise Context、与主体匹配的个人上下文；使用原 Dictionary `parseBusinessDictionaryDirectoryRouteV010` 解析有界筛选，重新执行实际 `dictionary.collection.query`，读取当前 `readableFieldIds`，只选择 Owner 支持的表格列。
4. **真实受管写入**：构造唯一已有 `collection.saved-view.personal.save` Capability Operation 的标准请求，`expectedRevision:null` 表示新建；由原 ActionRouter 做权限/Feature 检查、Host 可信签名回执和 PostgreSQL 事务原子 CAS。**未接入 Host issuer/Feature 的环境必须被原 Router 拒绝**；这不是独立可绕过认证的保存接口。
5. **保存后恢复**：只有原标准 WRITE 成功且响应确认 PERSONAL/viewId，才返回现有 Eidos ActionHost 支持的 `navigateTo`。目标仍是原 Dictionary route，携带只作为 UI 提示的 `personalViewId`；后续页面每次重新通过 Host Saved View READ 授权。若来源权限已撤销，旧视图不得出现。

## 导航与信息架构

原业务字典 Eidos 列表 → 保存表单 → 确认 → 原列表 personal Tab，不新增第二张业务表或第二套详情。导航保留原搜索、排序和安全返回路径；不能将企业 ID 或所有者信息写进表单提交/URL。当前表单仅提供**新建个人视图**，不提供共享、覆盖已有版本、批量编辑或删除，避免误导用户其具有这些能力。

## 视觉与颜色

完整复用原 Eidos Form 表单、标题、名称文本框、原有确认与状态反馈；不引入任何 CSS、按钮自定义脚本或手工模拟 V3 颜色。只有一个可编辑字段，目标是企业软件低认知负担。实际桌面视觉和 390px 触摸流程尚无真实浏览器证据，不能标 100% 还原。

## 记忆与注意力

表单仅要求可读名称；ID 是由可信 Host 生成的不可编辑隐藏值，筛选回退从原 Dictionary 路由受约束地获得，字段按原 Owner 当前有权列得到。无需用户复制 SQL、JSON 或记住排序字符串。重复操作碰到原子冲突时交由原 Host/Owner 返回真实错误；不靠随机猜测覆盖。

## 无障碍与跨年龄

沿用 Eidos 的 label/required/confirmation/可访问 form/navigation 语义，不新建自制弹窗。键盘、读屏与移动端触控目标依赖已存在的 Eidos runtime；该新表单对实际 390px 设备、弹窗确认、焦点恢复与多语言溢出尚未进行 Human 签收。

## 安全与数据修复

- 拒绝非 Human、外部委托、错企业、错个人所有者、未确认、额外表单字段、伪造 SQL/owner/enterprise、坏路由和越界标题/ID，且**不得先调用任何业务 Action**。
- 筛选中仅保留原 Owner 允许的 `view/search/sort/direction`，不存页号、数据行、Draft options 或原 personal ID；数据库保存配置仅由既有有权 Dictionary Collection READ 派生。
- 新视图严格 `expectedRevision:null` + 原 Signed Host Receipt + PostgreSQL CAS；过期/重放、回执丢失与撤权处理继续由原 Resource Owner 及已有协议证明承担，不添加假客户端幂等数据库。
- 无 PG、未激活 Feature、无真实 Host receipt 时不能启动生产 SAVE；隔离样例仅使用测试密钥/真实 PostgreSQL CI，不能作为 Railway/Tokyo 正式数据库验收。
- 写入成功后的 `navigateTo` 只是导航，不是权限证明；下一个 GET 必须重新 READ 授权。

## 证据与剩余问题

1. `tests/protocol/cv03-human-saved-view-form.test.mjs`：Eidos `renderToHtml`、表单的确认和字段、Owner 规范化、数据权限/非法输入失败关闭及 GET 导航构建。
2. `tests/agent-line/cv03-personal-saved-view-postgres.test.mjs`：真实业务字典 Owner、现有 ActionRouter、真实 Host 签名、真实 PostgreSQL 18 及 Eidos 授权展示的隔离保存到恢复纵切。
3. 正式 Host UidlForm page manifest、`/v1/experience-pages` 的实际可点击入口和 `/v1/actions` 规范化接线、生产 PG/凭据/Host receipt admission、真实登录/LLM、桌面/390px Human 均 **OPEN**。隔离 UI 测试成功不等于用户现已能在生产界面保存视图。

## 页面模式与导航归属

原 Eidos `form`，原 Dictionary `directory-query`，原 Host `AppActionRouter`，原 `enterprise.collection.saved-view`。新增 Host-only 辅助函数不注册新 Page Shell、ActionOwner 或第二个授权服务。

## 功能、布局、颜色对照

功能：单字段 Human 命名保存，显式确认，既有 Capability 受控存储和安全恢复；不是企业共享或可见列编辑器。
布局：使用原有 Eidos Form 和 Dictionary Tab，无重复创建按钮、无新的左侧导航。
颜色：继承系统原主题，无独立 CSS。

## 入口、退出与恢复矩阵

入口：未来在**正式已经取得 PG/Feature/签名与 Human 认证**的字典页面显示 Save as；本批未接入生产。
退出：表单 Context Navigation 返回原 Dictionary 筛选，保存成功可 navigateTo 原 personal Tab。
失败恢复：业务源撤权/错企业/插件停用时不写入、不宣称成功；原业务字典列表仍可正常读取，数据库事务冲突不能通过直接重试盲写。

## 浏览器与 Human 证据

桌面：仅机器生成的 Eidos HTML 与授权路由、真实 PG 隔离测试；没有真实登录浏览器截图或 Human 签收。
移动：390px 真实触摸、确认框、键盘焦点和表单滚动尚未验收。
Human：未签收，禁止将 C3-02 标注为生产已交付。

**回滚**：删除这一未注册的 Host-only form/normalizer 不影响任何原有字典页面、保存视图资源和生产数据库。
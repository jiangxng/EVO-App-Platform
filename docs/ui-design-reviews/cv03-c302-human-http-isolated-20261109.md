# CV-03 / C3-02：隔离真实 HTTP Human 保存视图与 Eidos 回读（2026-11-09）

> 状态：**ISOLATED_HTTP_CODE_AND_REAL_POSTGRES_CI / PRODUCTION_HOST_UNREGISTERED / HUMAN_NOT_SIGNED**。本次提交的 Human UI 源码路径：`manager/cv03-personal-saved-view-human-http.ts`、`manager/cv03-personal-saved-view-human-form.ts`。基于已合并 #1189 的 Eidos 表单及 Signed Host WRITE 纵切，明确**不修改正式 `manager/server.ts`、`catalog/seed.ts`、Railway、正式签名密钥、正式 PG schema 或用户登录**。

## 目标与完成条件

通过一次实际 Node HTTP 会话模拟用户从可信 Host 打开保存视图表单（`GET /v1/experience-pages`）、明确确认提交（`POST /v1/actions`）并由同一个当前授权 Principal/Enterprise 的真实业务字典 Owner、原 Platform ActionRouter、签名 Host 回执与 PostgreSQL 18 事务完成保存；随后按授权返回 Eidos 个人视图 Tab。此 HTTP 适配器属于**未接到正式 server 路由的隔离可复用组件**，不能声称已上线。

## 流程与步骤

1. 隔离宿主必须显式注入 `isEnabled()` 和每个请求重新执行的可信 `resolveContext(request)`，并提供 Host `newViewId()`。适配器**不从请求体/Header 自动推导身份**，也不允许客户端传入 Enterprise Context 作为授权。
2. 仅在启用时处理限定的 Eidos 表单 Page Source 和 POST actions。GET 中重新验证 Human/企业主体、业务字典 Owner Collection READ、`collectionId/schemaRef`，读取成功后才返回经 Eidos 解析的表单 UIDL。
3. POST 仅接受 `application/json` 且上限 16 KiB，执行 #1189 的 Host 表单归一化，重新 READ 当前业务字典，再调用**原** `collection.saved-view.personal.save`，由已合并的签名 issuer 和 PostgreSQL Owner 的单事务资源+回执证明保证条件写入。
4. 写成功后返回当前 Eidos 支持的 `navigateTo` 原 Dictionary 安全 URL；下一个 GET 经原 Host Saved View READ 再次验证个人归属、字段版本和权限。
5. OFF/匿名/错上下文/撤权/坏 URL/重复参数/伪造 SQL/超大或不合法 body 按真实 HTTP 状态或原受管 Action 错误拒绝，禁止推断旧个人缓存或向浏览器暴露内部业务行。

## 导航与信息架构

原 Eidos UidlForm 标签、姓名输入、确认、状态信息、Dictionary 页面和个人 Tab 路径均不变。新适配器只将已有 UI 和受管 Capability Operation 放到一个可真实收发 HTTP 的测试边界；不是新的业务列表、个人表单框架或第二个 Agent WRITE Authority。没有新增企业导航、注册路由或新版本 Dashboard。

## 视觉与颜色

不加入任何 CSS、主题 Token、按钮样式、人工拼装 HTML 或浏览器私有脚本。GET 返回原 Eidos Form JSON，由既有 Eidos render 与确认 UI 处理。该真实 HTTP 测试只验证合同、确认字段与源权限，不替代真实 1280px/390px 截图或触摸视觉检查。

## 记忆与注意力

用户只输入视图名称；筛选/排序来自原有可解释的业务字典安全路由。成功后用原有 `navigateTo` 带回可重复打开的个人标签，用户无需复制筛选条件；撤权后状态立即重新核对，不依赖 LocalStorage 旧快照。

## 无障碍与跨年龄

保留 Eidos Form 的 label、required、confirmation 和业务导航；适配器不修改 DOM 事件或焦点处理。桌面键盘连续性、VoiceOver/读屏、不同字号和 390px 触控目标**尚无真实浏览器 Human 验收**。

## 安全与数据修复

- **OFF** 时 HTTP 404 且不调用身份回调或业务仓库；只有显式开启的**隔离**调用环境才有入口。此逻辑本身未绑定正式 Host，不会因合并自动开启。
- 真实 Host 身份与企业权限由上游可信 `resolveContext` 提供，每个 HTTP 请求新鲜校验；跨用户/企业在原 PG 私有命名空间及 Domain Owner 再次核对。未授权直接 403，坏源域名/SQL/字段或未知 PageSource 不成功。
- GET 无缓存：`cache-control: private, no-store` + `vary: authorization`。POST 为受控 JSON，最大 16KiB。响应不包含业务选项/原始 SQL，也不允许提交任意 owner/enterprise/列组合。
- 原 WRITE 使用 Host-issued HMAC、同 PostgreSQL 事务 receipt/CAS、当前 Operation 权限与下一次 READ 的 Schema 权限。未签发真实 Host 票据或未安装 Feature 时必须拒绝；此测试使用隔离 PostgreSQL 与明确测试签名密钥。
- 尚未证明正式入口启用、实际生产 Postgres 主库写权/备份/迁移/回滚、密钥轮换、真实多用户登录/LLM。不要以该隔离 HTTP 测试通过冒充生产许可。

## 证据与剩余问题

- `tests/protocol/cv03-human-http-form.test.mjs`：真实回环 HTTP GET/POST、正文限制、启停/匿名/非法路由/额外字段/当前字典授权失败，且未受权时不调用 Action Host。
- `tests/agent-line/cv03-personal-saved-view-postgres.test.mjs` 新增真实 PostgreSQL 18 HTTP→Eidos 端到端回归：GET 可用 Eidos Form、POST 由原 Host HMAC 签名写入、READ 与个人 Tab 恢复、伪造认证 403、撤权后 403/个人标签消失。以最终 PR SHA/CI 为准。
- **仍 OPEN：** 正式 `manager/server.ts` 的 HTTP route/App Manager 页面 manifest 及 UI 实际保存入口、真实生产数据库权威认证、实际登录/企业权限模型接线、正式浏览器/390px Human、真实 LLM Run。下一窗口需在已有原 Host 路由集成而非另开数据通道。

## 页面模式与导航归属

Eidos 原 `form` + Dictionary 原 route + 原 `AppActionRouter`/当前 Principal 是唯一权威。隔离 HTTP 适配器没有定义独立页面模式或持久化任何额外状态；它只说明未来正式 Host 应如何接线，不能替代原 Host 的认证中间件或 Cookie/CSRF 保护。

## 功能、布局、颜色对照

功能：隔离 HTTP 页面读取、Human 确认提交、签名 PG 资源+回执、下一次授权的个人 Tab 恢复，未进行生产 Page 注册。
布局：保留现有 Eidos Form、字典列表/表格与详情，不增加重复创建入口。
颜色：未改变原 Eidos 主题或局部色彩。

## 入口、退出与恢复矩阵

入口：受管测试 Host 仅在显式启用及当前有权 Human Enterprise Context 下执行 GET Form。
退出：原 Eidos Context Navigation 返回业务字典；确认保存成功返回 `navigateTo` 个人视图安全路由。
异常恢复：Off/跨人/无企业/撤销 Source READ/非法 body/签名失败会拒绝请求；上一步成功的个人视图不会因路由 ID 提权，下一次读取仍需 Host 和 Owner 认证。

## 浏览器与 Human 证据

桌面：已覆盖真实 Node HTTP 交互与 Eidos Form JSON/HTML 协议，但不是实际带鼠标/键盘的浏览器用户签收。
移动：390px 设备布局、真实触控、屏幕阅读器未签收。
Human：无人工验收证据；保留 `HUMAN_NOT_SIGNED`。

**回滚：** 由于没有实际生产 Host 注册，只撤销该隔离适配器/测试即可恢复；不涉及正式存储/页面或安装生命周期变更。
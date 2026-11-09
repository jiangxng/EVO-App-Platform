# CV-03 / C3-02 正式 Host Human Save 入口负向准入（2026-11-09）

> **状态：REAL_HOST_OFF_VERIFIED / HUMAN_NOT_SIGNED / PRODUCTION_WRITE_NOT_ADMITTED。** 本次真实 Human UI/Host 审查覆盖源码 `manager/cv03-personal-saved-view-host-admission.ts` 和 `manager/server.ts`，沿用既有 Eidos Form、业务字典 Collection、原 Host Capability ActionRouter 与 #1189/#1190 的隔离 HTTP 正向验收结果。**没有启用正式保存入口或生产数据库**。这里专门堵住两个危险绕行：仅凭环境开关冒充已认证生产签名存储，以及未来把隔离 HTTP 适配器误挂到通用 Action 路由导致所有插件 POST 被截获。

## 目标与完成条件

只有真正完成 PostgreSQL SQL 权限/签名回执/企业身份授权/正式 Feature 生命周期与 Human/390px 验收时才能开放个人 Saved View WRITE。当前没有这套生产准入证据，因此正式 Host 的任何 `collection.saved-view.personal.save`（Human/Agent 皆然）在到达通用 ActionRouter 前一律拒绝，而现有全部其他业务动作必须继续按原路由运行。新的个人视图表单 PageSource 在正式 Host 上始终 404，不能让用户看到尚无法保存的 UI。

## 流程与步骤

1. 启动时只接受 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE` 缺失或 `OFF`（大小写/空格规范化）。`ON`、`SIGNED`、`STAGING`、`READ_ONLY` 等未认证字符串立即拒绝启动，不得伪装为数据库、密钥和操作员准入。
2. 真实 Host GET `/v1/experience-pages?source=app://evo-business-dictionary/pages/personal-view-new` 明确返回 404，不调用未注册的隔离生成器；业务字典现有页面仍按 #1187 READ_ONLY 规则运行。
3. 真实 Host POST `/v1/actions` 在完成原 Action envelope 基本类型校验后，识别原保存 Capability Command 并返回 403 `CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED`；对其他所有命令返回 `undefined`，完全交由当前 Host 调度。
4. 对照 #1190 真实回环 HTTP 的**仅隔离测试用途**保存正例，加入真实 `manager/server.ts` 子进程负例：新表单 GET 不可达、任何伪装 Save POST 拒绝、其他 POST 未被劫持、原 Host Catalog 不受影响。

## 导航与信息架构

不新增正式 Eidos 导航/Route/保存按钮，避免 UI 有按钮但 WRITE 无真实签名后端。原系统、个人只读视图 Tab 和字典列表路径继续保留；已完成的隔离 Human 保存表单仅供下一阶段有物理数据库准入的测试/审查。此次不创建第二套 Collection UI、ActionRoute 或授权系统。

## 视觉与颜色

正式用户看到的业务字典表格、操作按钮、Eidos 紧凑密度、原 V3 样式和主题色均未改变。不存在因这次保护加入的新按钮、弹框或颜色。桌面和 390px 浏览器真实视觉仍未验收；默认 OFF 不是 Human PASS。

## 记忆与注意力

用户不会被一个未经生产准入的“保存成功”假按钮误导。系统原有业务动作继续按原路径运行。未来保存功能交付时，已合并的个人列选择、路由恢复、Context 重新授权和表单路径将可复用，不需要让用户手工导入设置或复制 JSON。

## 无障碍与跨年龄

无新增 DOM/CSS/键盘动作；原 Eidos Navigation、列表与业务表单可访问性不受该负向 Host Gate 影响。新 Human 保存表单的桌面、390px、触控和读屏签收仍待正式端到端验收。

## 安全与数据修复

- 明确分隔**正式 Host**与 #1190 的隔离测试 HTTP。禁止因 `NODE_ENV=test` 等单一开关改变生产认证结论，禁止无生产 SQL/签名密钥签发权限就注册 WRITE Feature。
- 拒绝全部 Saved View WRITE Command，不检查 actionId 是否看起来来自 Eidos；因此伪造 Human/Agent 不能绕过。原 Dictionary READ/业务 Save/其他插件命令完全不进入本门禁。
- 返回 403 正式未准入、404 表单未发布；无数据库操作、无密钥、无迁移、无潜在生产数据变更。
- 切换 `APP_PLATFORM_CV03_PERSONAL_VIEW_PAGE_MODE=READ_ONLY` 只影响先前隔离的只读 Eidos 组合，绝不打开此 WRITE Gate。
- 正式生产开放条件：物理 Postgres 主库 CAS+Receipt、独立 Host signer/verifier 密钥与轮换、SQL 最小权限、PA05 源生命周期与 Human+Agent 授权、真实 HTTP Cookie CSRF、可操作的正式 Eidos 注册及桌面/390px Human 签收。缺任何一项继续关闭。

## 证据与剩余问题

- `tests/protocol/cv03-real-host-save-admission.test.mjs`：纯门禁枚举/精确命令隔离 + **真正启动的 `dist/manager/server.js`** HTTP 子进程，GET 表单 404、POST WRITE 403、无关 POST 原路径、Catalog 可用。是否 PASS 以本 PR 最终 HEAD 的 CI 结果为准。
- #1190 已有 PG18 真实回环 HTTP Human→Host 签名→Eidos 正例，只证明**隔离可行**，不等于此正式 Host 具备生产物理授权。
- 正式保存按钮/生产 Host 动态 Feature/SQL 和密钥部署、真实 Human 浏览器体验/390px 与外部 LLM 仍均未签收。

## 页面模式与导航归属

本批正式 Host 仍只承担 Eidos CatalogBrowser 列表和此前只读个人视图展示。未将新的 Eidos Form `app://evo-business-dictionary/pages/personal-view-new` 加入正式 Experience manifest，未在 `/v1/actions` 注册备用写 Handler；原业务 Dictionary 和 Enterprise Resource Owner 的职责边界保持。

## 功能、布局、颜色对照

功能：新增**拒绝非认证的 SAVE**及未发布表单，不添加可以失败的上线功能；其他业务命令仍可调用。
布局：原列表/表格/详情/导航/搜索/排序/分页不发生 UI 变化。
颜色：只用已有 Eidos UI token；本 PR 没有新的组件/样式。

## 入口、退出与恢复矩阵

入口：真实用户默认只能打开已授权 Dictionary 列表/已授权个人 Tab，不能进入未认证保存表单；该新 Source 的 Host GET 返回 404。
退出：任何原页面路由不变；不生成未授权的保存状态或假视图标签。
异常恢复：如果操作员误将环境开关改为 `ON`，服务启动拒绝而不是暴露不受管 WRITE；非法 Save POST 403，不修改用户或业务资源；其他 ActionHost 功能不受此次规则影响。

## 浏览器与 Human 证据

桌面：仅真实 HTTP Host 负向回归，不是实际浏览器 Human 验收。
移动：390px 触摸/横向列表/确认保存操作仍未验收。
Human：`HUMAN_NOT_SIGNED`；实际可用保存功能不可以因隔离 CI 而标记已上线。

**未来替换条件：** 必须由单独受审查 PR 提交真实生产迁移、密钥、SQL/PA05 授权、HTTP 源/动作安全、实际可用 UI 和 390px Human 流程，之后才可能移除此显式 deny-by-default 规则。
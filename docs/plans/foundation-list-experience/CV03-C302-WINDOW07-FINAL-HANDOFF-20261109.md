# CV-03 / C3-02 — 2026-11-09 七次续跑最终交接入口

> **唯一新鲜基线：Platform `main` = `8095f8c0709af58f661d3ed4d0ee1c1f67ed7cea`，由 [PR #1191](https://github.com/jiangxng/EVO-App-Platform/pull/1191) 45/45 CI 全绿合并。** 
> 状态：**ENGINEERING_ISOLATED_PASS / REAL_HOST_PRODUCTION_WRITE_DENIED / HUMAN_NOT_SIGNED / RAILWAY_NOT_DEPLOYED_BY_THIS_WINDOW**。本文件记录的是截至该 main 的源码、CI、授权边界与下一轮可验收任务。不是主线计划的新替代品；原 CV-00～07 八步计划、外部资料来源和更早交接全部保留。

## 一句话结论

现有 **Eidos + Platform + Dictionary Owner + Host Capability Operation + Personal Agent** 上，个人 Saved View 的 **PostgreSQL 条件保存、Host 签名原子回执、授权读取、个人 Tab、搜索/排序/分页/详情返回、列显示顺序、Eidos Human 表单、隔离真实 HTTP 保存并回读** 均有可重复执行的工程证据。**没有**在正式 Host 启用生产 WRITE/页面入口、配置生产数据库与签名密钥，也**没有**真实浏览器/390px/Human/外部 LLM 签收。最后一项 #1191 特意在正式 `manager/server.ts` 增加**默认拒绝**门禁，防止把隔离正例错当上线许可。

## 逐项 PR / 代码 / 实证对照

| 工作包 | PR / 合并 | 真实完成物 | 不能宣称 |
|---|---|---|---|
| C3-01 原子资源 | [#1177](https://github.com/jiangxng/EVO-App-Platform/pull/1177)、[#1179](https://github.com/jiangxng/EVO-App-Platform/pull/1179) | 原 `EnterpriseResource` 有界条件写入与 PG18 共享事务/冲突和独立进程验证 | 文件锁不等于多 Host 的正式共享 PG |
| C3-02 私有 Owner | [#1180](https://github.com/jiangxng/EVO-App-Platform/pull/1180) | `providers/enterprise-context/personal-saved-views.ts`：PERSONAL 唯一主体/企业命名空间、源 Collection/schema/fields 再授权 | 正式 Host 尚无 Feature 注册 |
| C3-02 回执与签发 | [#1182](https://github.com/jiangxng/EVO-App-Platform/pull/1182)、[#1183](https://github.com/jiangxng/EVO-App-Platform/pull/1183) | 现有 ActionRouter + Host Issuer HMAC 对 exact inputDigest 授权，PG Resource/Receipt 同事务 CAS；无签名拒绝 | TEST_SIGNER 不是生产密钥；物理 SQL 最小权限、轮换、实际运维尚未签收 |
| Eidos 视图阅读 | [#1185](https://github.com/jiangxng/EVO-App-Platform/pull/1185)、[#1186](https://github.com/jiangxng/EVO-App-Platform/pull/1186) | Dictionary `table.views` 显示 Host 当前有权个人配置；Host READ Action 实时获取、撤权/跨用户/企业默认隐藏 | 页面测试不是点击式 Human 体验 |
| 路由与列恢复 | [#1187](https://github.com/jiangxng/EVO-App-Platform/pull/1187)、[#1188](https://github.com/jiangxng/EVO-App-Platform/pull/1188) | 个人 viewId 是非权限提示；搜索/排序/分页/详情 `returnTo` 保持；按保存顺序仅展示源 Owner 当前可读列 | 真实 390px/Eidos 界面视觉、浏览器焦点和导航尚未签收 |
| Human 隔离提交 | [#1189](https://github.com/jiangxng/EVO-App-Platform/pull/1189) | `manager/cv03-personal-saved-view-human-form.ts` 标准 Eidos UidlForm；经当前 Human Context + Dictionary READ 生成 canonical Capability WRITE，signed PG 保存，返回 `navigateTo` | 未注册正式 Page/Save 按钮 |
| 隔离 HTTP 正例 | [#1190](https://github.com/jiangxng/EVO-App-Platform/pull/1190) | `manager/cv03-personal-saved-view-human-http.ts` 实际回环 HTTP GET form→POST canonical WRITE→PG18 签名→授权 Eidos 恢复；PG18 **10/10**，0 跳过 | 独立 HTTP harness **不是**正式 Host 身份、CSRF、中间件或路由注册 |
| 正式 Host 负向准入 | [#1191](https://github.com/jiangxng/EVO-App-Platform/pull/1191) | 正式 `manager/server.ts` 的 Human Save PageSource **404**、任何 `collection.saved-view.personal.save` **403**、开启未认证 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE` 会拒绝服务启动；其它业务 Action 不被劫持。**45/45 CI** | `real Host` 负向测试通过 **不表示生产 WRITE 已开放** |

**最终 #1191**：PR HEAD `e5a52c7eae5571ad639c3d7646d4fc62b08cd9ea`，merge/main `8095f8c0709af58f661d3ed4d0ee1c1f67ed7cea`，GitHub 45/45 SUCCESS，包含 Platform core protocol、Lightweight Host、UI design review、真实 Host 子进程 HTTP 及各业务回归。#1190 的 PG18 专项为 10/10 PASS（这是隔离 Positive Path）。所有合并核验均按实际最终 HEAD，而不是 PR 初始提交。

## 当前工作状态：严格区分四个层次

| 验收层次 | C3-02 事实 |
|---|---|
| 代码已合 main | **是**：正式 Host 否定门禁，以及所有隔离 Owner、Eidos、Human Form、HTTP 测试 |
| 工程测试已验收 | **是，仅隔离范围**：真实 PostgreSQL 18、签名回执、两企业/两用户撤权和实际 Node HTTP，原 Eidos render HTML；正式 Host 负向访问 |
| 正式 Host 已上线/可保存 | **否**：`APP_PLATFORM_CV03_HUMAN_SAVE_MODE` 只允许 `OFF`；Human Save PageSource 未列入正式 Experience；个人 Saved View Feature 未安装到生产 Host；SQL/签名密钥未正式审批 |
| 真实 Human/移动/LLM | **否**：没有桌面/390px 截图签收、真实登录 Cookie/CSRF 回路、端到端外部 LLM Personal Agent Write Run 或用户验收 |

## 当前必须尊重的运行模式

- `APP_PLATFORM_CV03_PERSONAL_VIEW_PAGE_MODE=OFF|READ_ONLY`（默认 OFF）：只读 Eidos Dictionary Tab 组合开关；**不会**安装 private Saved View Feature、不会提供生产存储或授权 WRITE。READ_ONLY 在无真正授权 READ Handler 时回退原系统 Tab。
- `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`（当前唯一可启动值）：独立的正式 WRITE admission；任何非 OFF 值将拒绝 Host 启动，**不要在 Railway、Tokyo 或其他生产环境设为 ON**。
- `manager/cv03-personal-saved-view-human-http.ts` 是仅由隔离测试装配的 HTTP adapter；切勿直接安装到真实 `/v1/actions` 通用多路复用路由，否则会捕获其他命令。正式 Host 有 `cv03UnadmittedWriteDenialV010` 精确判定保存命令，其他业务动作仍走现有 router。
- `personalViewId` 是可解释 URI 提示，不是资源票据、账号身份、行权限或 Schema 授权。Host 必须每次重新取有权 Saved View READ 和 Dictionary Collection READ。
- 项目 UI 边界仍是**Eidos 渲染 + Domain Owner 查询/路由 + Platform Host 认证/Provider 存储 + 个人 Agent 经相同 Capability Operations**，不新建第二个万能列表/权限/数据库框架。

## 下一执行窗口的可验收工作包（不得跳过安全依赖）

| 顺序 | 工作与交付 | 必验收与失败闭合 |
|---|---|---|
| N1 — 生产物理准入 | 审计真实 PostgreSQL authority/schema/migration、两 Host CAS、最小 SQL GRANT、签名 verifier key 的持有/轮换与不可伪造性；保留 PG/Receipt 单事务 + 未知 ACK 重放、冲突/回滚证据 | 与隔离 `TEST_SIGNER`、本地文件和内存 Provider 显式区分；缺任何数据库/身份/签名/审批凭据不能打开 WRITE |
| N2 — Host Feature 生命周期 | 经现有 PA05 的安装/启用/停机治理注册现有 `personalSavedViewsOptInFeatureV010` 及原 `createPersonalSavedViewActionHandlersV010`；绑定真实 `AppActionRouter`、授权策略、独立签名 issuer 与 PG 资源 owner | disabled/revoked/cross-enterprise/local compatibility identity 均失败关闭，原 Dictionary/List 不受影响，原 HTTP 操作不被 hijack |
| N3 — Human 页面接线 | 经过 N1/N2 后，把原 Eidos Human UidlForm source/route 在既有业务字典 Experience manifest 中受控注册，只有合法当前有权 Principal 看到可点击 “保存我的视图” 入口；动作在原 POST `/v1/actions` 中受控归一化 | 有真实确认、成功回显、冲突/重复/撤权/关闭恢复；GET 表单必须重新 READ 当前 Dictionary；正式日志与 receipt 一致；Host Cookie Origin/CSRF 同现有安全链 |
| N4 — 真实验收 | 使用真实 Enterprise 登录和实际浏览器验证列表→命名保存→原子写→视图 Tab→搜索排序分页→详情→返回；桌面 + 390px + 键盘/读屏 | V3/Eidos 布局/颜色/导航、触摸、焦点和按钮摆放的截图与 Human 明确签收；不可用时保持 OFF |
| N5 — Agent/企业共享 | Personal Agent 真外部 LLM 的 `search/describe/invoke`、Human/AI 相同授权写入与持久 receipt；之后再独立推进 C3-03 企业共享视图/角色和治理 | 不得基于仅本地 deterministic Agent 或测试 PG 宣称真实 AI 原生/共享权限完成；共享视图另建权限验收，不直接复用 PERSONAL 可见范围 |

**N1 是阻断性依赖。** 不能靠单独添加 `NODE_ENV=test` 或无物理 SQL 门禁的 feature flag 解除 #1191 的正式拒绝。正式上线决策需要拥有数据库/密钥/权限/部署职责的窗口核验，不从本窗口替代签收。

## 信息与文档主入口

- [CV-00～CV-07 现有单一权威计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)；该文件与并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 文档 PR 有重叠，**此窗口没有修改它**，避免并行冲突。计划中的部分旧状态是历史快照，以本最终交接的实际 main 和 PR 状态校准。
- [2026-11-06 外部参考与历史取舍](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)、[旧窗口遗产恢复入口](CV-20261109-RECOVERY-HANDOFF-ENTRY.md)、[研究/源码证据索引](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)。保留 SharePoint/Odoo/Power Apps/SAP/明道云/WAI-ARIA 原始来源，无须无故重新研究。
- [C3-01 PG 物理资源证据](CV03-C301-POSTGRES-ATOMIC-RESOURCE-PROOF-20261109.md)、[C3-02 同事务签名回执](CV03-C302-ATOMIC-HOST-RECEIPT-POSTGRES-20261109.md)、[C3-02 私有 Owner 隔离](CV03-C302-PERSONAL-SAVED-VIEW-ISOLATED-HOST-20261109.md)。
- 同 PR 的 Eidos/Human Review：`docs/ui-design-reviews/cv03-c302-human-save-as-form-isolated-20261109.md`、`cv03-c302-human-http-isolated-20261109.md`、`cv03-c302-real-host-save-admission-failclosed-20261109.md`。这些是工程审查，不是 Human 真实签收。

## 项目/多窗口治理

- 多个窗口的最终 PR 均经 Actions 检查后合 `main`；不要再从旧 SHA 新建实现分支。下一窗口启动先 fetch 最新 `main` 和并行 open PR；始终在独立分支完成一项完整可验收纵切。
- 任何新的页面操作必须复用 Eidos 既有 `CatalogBrowser`/`UidlForm`，遵守 UI Design Review Gate；合并的交接文档和相应源码测试一起记录。
- 不直接 push main，不提前标 HUMAN_PASS、不擅自变更 Railway 生产环境或导入用户数据。
- 旧会话完整原始逐字记录在此前恢复工作中未找到；原外部参考链接、阅读状态及决策来源保留在原计划和恢复索引中，不能编造遗漏的个人浏览器验收资料。

**本窗口停机条件：** N1 正式数据库和身份/签名审批是清晰阻塞，#1191 正式生产必须保持 OFF。下一窗口从 N1 物理资源/权限核验接续，而不是重复 #1180～#1190 的隔离代码。

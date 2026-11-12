# CV-04 / List 基础插件 — 业务字典真实 Host + Eidos 当前页 CSV 导出接线

> **2026-11-12，实施阶段：ENGINEERING_SLICE / 未认证完整 List 插件。** 实施基线 `main@b778cf5d2d81f5fc62705f732192ad4e8a3bbf7a`。接续 [CV-04 CSV 底座](CV04-AUTHORIZED-COLLECTION-PAGE-CSV-20261112.md)、[CV-00～07 唯一近期计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md) 和 [Eidos × Platform 架构](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)。按项目负责人的最新明确要求，普通 List 工程自主管理开发 PR / CI / merge，**无需逐项请求其审批**；生产 SAVE 认证不是当前 List 进度的前置阻塞。

## 1. 已核对的源码 G（2026-11-12）

- [Dictionary Collection READ owner](../../../apps/business-dictionary/collection-query.ts) 已经提供受限 `view/search/sort/direction/page/pageSize`，返回 `DataCollectionResultV010` 中有权字段和真实当前页。原 [字典 ActionHost](../../../apps/business-dictionary/actions.ts) 会检查 Enterprise Context、成员权限，并在 resolveRepository 前后重新确认权限；[Manager server](../../../manager/server.ts) 采用 Feature 受管、懒加载 Action Handler。
- [Eidos 现成 Action result 下载器](../../../vendor/eidos/src/app-host/action-download.ts) 和 [page-controller](../../../vendor/eidos/src/app-host/page-controller.ts) 已可消费成功 Action 的顶层 `download: {fileName,mediaType,content}`，浏览器触发用户文件下载，不需要新增第二 UI 框架、外部下载 URL 或 HTTP GET 绕过 Host 授权。
- 上一 [CV-04 当前页序列化器](../../../foundation/collection-query/page-csv.ts) 已提供列白名单、大小限制、CSV 引号及公式注入防护。本轮只对接原字典 Owner 和已存在 Eidos 表格/按钮，不构造新的 repository、CSV 解析器或生产授权系统。

## 2. 本轮增量：一个真实纵切

1. 在 [Dictionary Operation 常量](../../../contracts/reference-data/dictionary-operations.ts) 和 [Catalog contribution](../../../catalog/seed.ts) 新增受管 `dictionary.collection.page.export.csv`：`effect=READ`、`authorization.action=dictionary.read`、`ENTERPRISE`、HUMAN / PERSONAL_AGENT 同权可发现和调用。**其权限范围严格限于原来有权读取的当前页**，不是全量导出授权或后台 Export Job。
2. 在 [Owner ActionHandler](../../../apps/business-dictionary/actions.ts) 每次请求重新获取当前 Enterprise Context、调用 `canRead` 并重新取真实字典；通过同一 `queryBusinessDictionaryCollectionV010` 执行有界查询，调用 CSV 底座处理显式列，返回受限顶层 `download` 回执。反常字段、未知排序、越权列、页数、企业伪造、插件停用全部拒绝，`confirmed:false` 只是 Eidos 浏览器协议附带输入，不能视为授权。
3. 在原 [Dictionary Eidos Directory](../../../apps/business-dictionary/page.ts) 的**真实服务器分页模式**加「导出当前页 CSV」命令动作，传入当前已验证系统视图、搜索排序分页和仅显示的表格列；只读成员也可见，管理者原「新建」按钮保留。未分页老页面不显示假装全量的下载按钮。
4. 在原 [Manager lazy Handler 注册](../../../manager/server.ts) 增加新命令，其它 Plugin 生命周期/安全机制和未认证 Saved View SAVE 门禁均不改。CSV 自带 UTF-8 BOM，中文可读。

## 3. 代码验收、限制与后续

- [新 Protocol 回归](../../../tests/protocol/cv04-dictionary-current-page-export-action.test.mjs) 直接使用真实字典 Repository、ActionRouter、Owner Operation、Eidos 目录 Render 和原 ActionDownload 解析：分页一致性（第二页仅一条，其他页绝不落在 CSV）、字段裁剪、跨企业拒绝、隐藏字段拒绝、Principal 的 Human/Agent 同一 READ 输出、无上下文拒绝、插件停用拒绝；既有 [CV-02 Eidos 视图测试](../../../tests/protocol/cv02-business-collection-views.test.mjs) 回归新按钮与旧版无分页行为。
- **机器与 Human 状态分开**：精确 HEAD CI 绿、合并 main、主线回归绿后只能标 `CV04_DICTIONARY_PAGE_EXPORT_CODE_MERGED`；真正的手机/桌面点击 CSV、实际租户授权/撤权和登录 Agent 仍需部署后的浏览器、人机验收。新文件不是完整系统使用说明。
- **局限**：仅业务字典的原授权 READ 的当前页，不是通用「所有页导出」；没有独立导出 RBAC、审计/下载任务、复杂多字段过滤、XLSX、跨字段业务 Schema 演进；后续对需要批量/敏感数据导出的权限可新增 `exportOperationId` 和独立所有者批准。下一步把同一 CV-04 受控导出模式适配 Counterparty Projection owner，再加入分页外的真正全量数据导出任务和真实 UI/Agent 验收。
- **生产 SAVE 不变**：`N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`，正式 SAVE POST 403、未注册 GET 404；Issue #1212 继续独立管理真正生产 PG/PA05/KMS 风险。PR #1184 Owner 受管三份文档不改。

## 4. 来源评级

- **G 原文已读**：本项目 `main` 中的字典 Owner Action / Page / Repository / Collection、Catalog Operation、Manager lazy registrations、Eidos ActionDownload/PageController，以及 CV-04 CSV 底座；2026-11-12。
- **D 本次设计**：使用 READ 当前授权页导出（既有 `dictionary.read`）；无新增权限即可泄漏不同于 READ 的字段、行和企业数据。拥有 READ 不代表允许全量批量导出。
- **P 待验**：新 PR CI / main 合并与部署、真实浏览器下载、跨企业实际账号、真正生产全量 Export Job、独立 DB Owner/Security 生产 SAVE 认证。本 PR 未访问新增第三方网页，不升级历史资料读原文等级。

## 5. 2026-11-12 受保护 main 正式工程合入、东京预览部署与原始日志证据（G）

> 本节是**合并后真实证据追加**，替换上文“P 仍待合并/部署”的历史预期；不追认缺少真实登录和 390px 的 Human 验收。

- [实现 PR #1259](https://github.com/jiangxng/EVO-App-Platform/pull/1259) 从最新 `main@b778cf5d2d81f5fc62705f732192ad4e8a3bbf7a` 建独立分支 `feat/cv04-dictionary-current-page-export-action-20261112`，最终 HEAD **`542353949a2970fdca18e4ed6fd4930e7901afce`**，全部 **49/49 GitHub PR checks SUCCESS** 后执行 Draft → Ready → expected SHA merge，受保护 `main` 合并提交 **`10bd1ee113771212d53f162ea8ff638b13608580`**。
- UI/Continuity 首版红灯保留真实历史：初版缺少同 PR UI review 文件，第二版缺少治理要求的 Eidos 八章节 + Plugin 四章节和页面入口/退出/异常恢复矩阵。已读取原始 Job 日志并在**同一 PR** 增加 [CV-04 Eidos UI Design Review](../../ui-design-reviews/CV04-DICTIONARY-CURRENT-PAGE-CSV-EXPORT-20261112.md)；最后精确 HEAD 49 检查全绿，**不是**真人浏览器截图。
- 受保护 `main@10bd1ee113771212d53f162ea8ff638b13608580` 的独立 Checks 已再核验 **42/42 SUCCESS**（包含运行时 Protocol、Lightweight Host、Continuity、其他插件 CI 和东京发布 preflight/deploy）。
- **实际东京自动发布 G**：[EVO Tokyo Dev - CI-Gated Preview Release #43150074863](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43150074863)；`preflight` job `130956910154` SUCCESS，`deploy` job `130957650561` SUCCESS。已读取发布 Job **原始日志**（而非只看状态），记录这些正式 terminal markers：
  - `EVO_TOKYO_SSH_SECRET_FORMAT_PASS`；
  - `EVO_TOKYO_REMOTE_PREFLIGHT_PASS`；
  - **`EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=10bd1ee113771212d53f162ea8ff638b13608580`**；
  - **`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`**；
  - **`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`**（公网未授权访问按原流程要求 401）。
- **精确分支清理 G**：[Branch Hygiene #43150015842](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43150015842) job `130956722319` SUCCESS，已读取原始日志 `DELETED_VERIFIED_MERGED_PR_BRANCH feat/cv04-dictionary-current-page-export-action-20261112 @ 542353949a2970fdca18e4ed6fd4930e7901afce`；GitHub 匹配分支 refs 为空，没有过程分支遗留。
- **证据边界**：实际东京镜像已成功发布的是新增正式 Dictionary `dictionary.collection.page.export.csv` + Eidos 按钮的运行时代码，但仅检查 Host local health、独立 runner 公网 HTTPS 和 Basic Auth 401。**当前没有实测某个真实已登录企业成员成功点击 CSV，亦没有真实自然语言 Agent、390px Chrome 视频/截图或用户签收**。该项只标 `CODE_MERGED_AND_TOKYO_DEPLOYED / HUMAN_PENDING`，不得宣称完成 CV-04 或整个 List 基础插件。

## 6. 下一步直接执行（无需项目负责人日常开发审批）

1. **Counterparty 二号真实 Owner**：复用 [已合并的当前页 CSV 底座](../../../foundation/collection-query/page-csv.ts) 与本轮 Eidos Command/下载惯例，为「我的客户 / 我的供应商」的当前权限投影接入受管 CSV Operation。必须保留投影 Owner 的行级/字段级授权、只读/管理者差异和 Eidos 视图；严禁把总量查询假装当前页、拼前端所有页或绕过现有 ProjectionService。
2. 真实 preview 浏览器/Human 桌面中文+390px CSV 下载、按钮触达、下载内容与当前行/列一致性；已认证的登录方式 + Enterprise Context / 两企业撤权负例。拿不到真实用户会话时如实记 `HUMAN_PENDING`，不凭 CI 顶替。
3. 在业务 Owner 明确权限、字段敏感级别与任务预算之后再设计全量服务端受限 Export Job、独立 export privilege、Personal Agent 与 Import Job/Recipe 复用；无需为当前页序列化建立第二套框架。
4. CV-03 生产授权真审批 #1212 继续保持另一条**不可伪造的上线安全边界**；不因普通 List 开发免审批而开启 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE`。本批没有修改 #1184 三份受管文档。

**新增证据评级**：上述 PR、CI、Tokyo deployment、Branch Hygiene 均是本次实际查询 GitHub Actions 与原始 Job logs 的 **G**；浏览器/Human/Persistent Export Job 仍是 **P**。未新增外部网络研究原文。

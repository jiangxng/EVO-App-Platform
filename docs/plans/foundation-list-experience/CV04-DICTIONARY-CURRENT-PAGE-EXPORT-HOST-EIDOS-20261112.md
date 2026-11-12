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

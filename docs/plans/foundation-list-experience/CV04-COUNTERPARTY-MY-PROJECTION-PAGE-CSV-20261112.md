# CV-04 / List 基础插件 — Counterparty「我的客户 / 我的供应商」当前授权页 CSV

> 2026-11-12；**ENGINEERING_SLICE / 非完整 List 基础插件完成**。严格接续 [CV-04 第一版 CSV 底座](CV04-AUTHORIZED-COLLECTION-PAGE-CSV-20261112.md)、[已部署的字典 Owner + Eidos 下载示例](CV04-DICTIONARY-CURRENT-PAGE-EXPORT-HOST-EIDOS-20261112.md) 和 [CV-00～07 近期计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)。用户已免除 List 工程日常逐项审批，标准独立分支 → Draft PR → 精确 HEAD CI → Ready → merge main → Branch Hygiene → CI + 东京预览 发布仍须执行。

## 已阅本项目原始源码 / G

- [Counterparty ProjectionService](../../../apps/counterparty/projection-service.ts) 使用 [CounterpartyReadAccess](../../../apps/counterparty/access.ts) 的实际 Principal / Enterprise / Responsibility DataScope、逐行 `counterparty.read` 与逐字段 `counterparty.field.read` 检查，并且**先授权再筛选/排序/分页**；其 `counterparties` 已按 `readableFieldIds` 裁剪。既有「我的客户 / 我的供应商」表格由 [Counterparty Eidos Page](../../../apps/counterparty/page.ts) 继续生成。
- [Collection Adapter](../../../apps/counterparty/collection-query.ts) 把有界投影规范化为 `DataCollectionResultV010`，本轮修正：仅公共稳定 ID 可作为 `counterpartyId`，不再无条件恢复未经实际 `field.read` 授权的 `displayName`。旧版有权结果保持兼容；撤权结果字段声明严格收紧。
- [Eidos Action Download](../../../vendor/eidos/src/app-host/action-download.ts) 和 [PageController](../../../vendor/eidos/src/app-host/page-controller.ts) 已支持顶层 `download`；复用已合入的 [page-csv 序列化器](../../../foundation/collection-query/page-csv.ts)，绝不重建 CSV、Host ActionRouter、Eidos 或另一份授权 Provider。

## 本 PR 小步的实际实现 / D

1. 在 [Counterparty constants](../../../apps/counterparty/constants.ts) 和 [Capability manifest](../../../apps/counterparty/capability-manifest.ts) 新增两个受管 `READ` Operation：`counterparty.collection.my-customers.page.export.csv` 和 `counterparty.collection.my-suppliers.page.export.csv`。沿用 `counterparty.read` / Enterprise DataScope，HUMAN 与 PERSONAL_AGENT 可访问，限制入参字段只能是 Eidos 当前页可见白名单 `displayName/code/status/subjectType/countryOrRegion`、pageSize 最多 100、字段最多 5、严禁任意 SQL/query/隐藏字段。
2. 在 [Counterparty Owner ActionHandler](../../../apps/counterparty/projection-actions.ts) **重新验证**本次真实企业 Scope、成员关系、Principal、合法 query；通过与现有 My Projection READ 相同的 `CounterpartyProjectionService.read()` 获取**本次**授权投影。仅将该次的当前页、实际 `readableFieldIds` 和 UI 白名单字段交给共享 CSV serializer，返回 Eidos 顶层 `download`，中文兼容 UTF-8 BOM。旧 READ / Collection QUERY 入口继续原样运作。
3. 在原 [Counterparty Eidos Page](../../../apps/counterparty/page.ts) 只为分页的 My Customers/My Suppliers 增加次要「导出当前页 CSV」动作，所需列直接取本次 `table.columns`；有/无管理权限继续区分 Import，其他「客户 / 供应商全部视图」及未分页旧 UI 不出现这一 My-scope 导出动作。搜索、排序、分页、详情返回与工作台入口全部复用原系统。
4. 在 [Manager 懒加载注册](../../../manager/server.ts) 接入两个新命令；停用 Feature 仍直接返回 `ACTION_FEATURE_NOT_ACTIVE`。没有扩张 Provider 权限、没有直接返回私密对象、没有保存 CSV 到原业务库，没有新 HTTP 下载端点或 Background Worker。

## 验收、缺口和下一步

- [真实 Domain Owner / ActionRouter / Eidos Protocol 回归](../../../tests/protocol/cv04-counterparty-my-page-csv-export.test.mjs) 使用真实内存 Enterprise Resources、Counterparty Repository + Role + Responsibility Repository + AuthorizationProvider + ProjectionService，创建本人与其他人的客户/供应商，验证**责任范围不泄漏、只导出第二页一行、当前字段、中文 Eidos Command、HUMAN/AI 一致**。负例包含非法字段、重复字段、伪造 Enterprise、停用 Feature、无授权 Provider、非法搜索/排序/pageSize，及未经授权 `displayName` 不被 Collection 适配器复活。
- **完成判定**：PR 精确 HEAD CI + merged main 及必要预览镜像 CI 全绿后标 `CV04_COUNTERPARTY_MY_PAGE_EXPORT_CODE_MERGED`；“东京发布”要实际日志里观察到 SHA 与 HTTPS + Basic Auth 401 PASS，不能用 GitHub source-only 绿色替代。“真实手机/桌面用户点击导出 + 下载文件核对、390px Chromium 截图、实际 LLM Agent 自然语言访问、跨企业真账号撤权”仍为 P、`HUMAN_PENDING`。
- **后续**：在同一既有 List 方案上补全全量/跨页后端有界导出与独立 EXPORT 权限、计费/审计/长任务预算；再用真实浏览器/Agent 验收 Dictionary 和 Counterparty；与过滤、多视图、看板、导入、图表和移动布局一起关闭完整 List 基础插件。不要因导出当前页已能下载就误报全部 List 完成。
- **固定安全条件**：不修改 #1184 Owner 受管文件，不重新触发 CV03 synthetic Pg QA，`N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、SAVE POST 403、未注册 GET 404 保持。#1212 真实生产 PG/PA05/Security Owner 决议独立存在，但不阻挡普通 List 功能开发。

## 资料评级

G：本轮实际读取 2026-11-12 `main` 中 Counterparty Projection/Access/Collection/Page/Capability/Host/测试、Dictionary CV-04 经验、Eidos Action Download；D：现有 READ 授权当前页导出与 UI 入口的设计判断；P：新 PR 实际 Actions 与 Tokyo Runtime、真实 Human/Agent/390px 验收，待取得后追加归档。本轮无新增第三方网络研究原文，不升级既有竞品资料等级。

## 2026-11-12 实际工程合入、物理 Tokyo 发布和遗留边界（G / 原始 CI 日志已核验）

- 本功能 [PR #1261](https://github.com/jiangxng/EVO-App-Platform/pull/1261) 独立开发分支 `feat/cv04-counterparty-my-projection-page-export-20261112`；首次 PR HEAD 的 Protocol/Core **1 个失败**已保留：撤权后 ProjectionService 优先以 `COUNTERPARTY_QUERY_SORT_FORBIDDEN` 拒绝排序，测试错误预期了较晚的 CSV 字段拒绝。修复测试期望并新增「Adapter 撤权后不得复活 displayName」直接回归后，新精确 HEAD `a3ebb8b0178e2fa5fb2d69da9e05100bae4d6d46` **49/49 SUCCESS**；本轮没有修改正常 Domain Owner 拒绝阶段以迎合测试。
- 经 Draft → Ready → `expected_head_sha=a3ebb8b0178e2fa5fb2d69da9e05100bae4d6d46` 合入 protected `main@73b5875756a41b20d560cd1b2f95523efdf46f93`。变更范围仅 `apps/counterparty/{capability-manifest,collection-query,constants,page,projection-actions}.ts`、`manager/server.ts`、新 Protocol test 和本工作计划/Eidos UI review 两份文档；#1184 三份受管文件不动。
- 受保护 main 的 **41 项独立检查 SUCCESS** 后，[东京 CI-Gated Preview #43152812989](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43152812989) `preflight` job `130965763394` SUCCESS；`deploy` job **`130966773632` SUCCESS**。本轮已读取 Job 原始日志确认下列真实终端标记，**绝非源脚本字符串或 PR SKIP**：
  - `EVO_TOKYO_SSH_SECRET_FORMAT_PASS`；
  - `EVO_TOKYO_REMOTE_PREFLIGHT_PASS`；
  - **`EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=73b5875756a41b20d560cd1b2f95523efdf46f93`**；
  - **`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`**；
  - **`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`**（未经授权访问保持 401）。
- [Branch Hygiene #43152785061](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43152785061) 实际 job `130965672627` SUCCESS。已读取原始 Job 日志 `DELETED_VERIFIED_MERGED_PR_BRANCH feat/cv04-counterparty-my-projection-page-export-20261112 @ a3ebb8b0178e2fa5fb2d69da9e05100bae4d6d46`，重新查询对应 branch refs 为空，**不是仅宣称已清理**。
- **当前可审计状态**：`CV04_COUNTERPARTY_MY_PAGE_EXPORT_CODE_MERGED_AND_TOKYO_DEPLOYED`；真实 Human 390px 登录浏览器点击按钮、下载文件检查、跨两个真实账号撤权、实际自然语言 Agent 流程都尚未采集。本次 PR 跑过既有供应商触控 Chromium/跨项目集成，但这些测试**不是新 CSV 按钮的真用户测试**，仍标 `HUMAN_PENDING`。全量导出、独立敏感字段 EXPORT RBAC、跨页后台任务以及 List 其他基类能力尚未完成。
- 生产 CV-03 仍 `N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、SAVE POST 403 / 未注册 GET 404。普通 List 工程无需项目负责人逐步审批，不代表可绕过真正生产证书/KMS/SQL 和安全控制。

## 接续工作，不重复实现

下一次从最新 main 与本页开始。优先复用已上线 Dictionary 和 Counterparty 两个 Eidos CSV 纵切，实际验证已登录桌面/390px 下载及 Agent/Human 同权限、按钮定位与空状态。随后研究并实现**安全的全量跨页导出**：受业务 Owner 控制的完整快照/任务预算、单独 EXPORT 权限、后台 Job、字段与行数据最小化、结果 TTL 和审计，而不是在前端循环分页或新造 List Framework。每一步仍须真实业务插件验收和独立 PR，不用项目负责人日常审批。

**来源状态更新**：上述 PR、精确 HEAD CI、main CI、Tokyo Deployment 以及 Branch Hygiene 是本次 2026-11-12 直接访问 GitHub 并读取原始 Job 日志的 **G**；用户浏览器/390px、真实企业和 Agent 对话仍为 **P**。没有新访问第三方网页、也未把未读外网来源改写为“已读原文”。

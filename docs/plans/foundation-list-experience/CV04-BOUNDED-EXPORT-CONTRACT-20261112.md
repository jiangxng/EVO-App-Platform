# CV-04 / 2026-11-12 — 原 Collection Query 上的有界跨页 EXPORT 安全执行合同

> **CODE_CONTRACT / NOT_CONNECTED_TO_HOST / NO_DOWNLOAD_ROUTE**。本文件是代码阶段的准确边界说明，不是宣称“批量导出已上线”。继承 [CV04 请求身份与企业关系真实撤权](CV04-REQUEST-BOUND-PRINCIPAL-REVOKE-20261112.md)、[CV04 双企业 Chromium + Agent](CV04-TWO-ENTERPRISE-AGENT-OWNER-CSV-ACCEPTANCE-20261112.md)、[近期八步计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)。目前不修改 #1184 正在管理的计划文件。

## 设计决定与不重复实现

- **采用**：在原有 [`foundation/collection-query`](../../../foundation/collection-query/index.ts) 下新增 [`authorized-cross-page-csv.ts`](../../../foundation/collection-query/authorized-cross-page-csv.ts)。继续使用原 Owner 返回的 `DataCollectionResultV010`、原 [CSV 安全序列化](../../../foundation/collection-query/page-csv.ts)；**不增加新的 ListFramework、业务 Repository、独立 SQL 接口或 Eidos renderer**。
- **独立 EXPORT 语义**：调用方必须注入 `authorizeExport()`，返回**严格布尔 true** 才能进入；仅有当前页的 `dictionary.read` 或 My Projection READ 不构成授权。后续 Owner 的真实 Capability Operation 必须有不同的 `authorization.action=...export`，不得偷偷继承 READ 许可。**此阶段尚未注册新 Operation 或执行导出下载**。
- **审计**：调用方必须注入在真实持久层提交成功才 resolve 的 `audit(event)`；先 STARTED、授权/有界读取后记录 COMPLETED 才返回任何字节。拒绝/错误尽力记录 REJECTED；审计不可写，必须拒绝下载。审计事件只有 auditId、主体/企业/ActorType、快照引用、行数字节数及错误码，**绝不写明文 CSV/私密单元格**。**合同只要求 durable callback，尚未实现产品级 durable audit store**。
- **固定快照**：`openSnapshot()` 必须是原 Domain Owner 在合法 scope 下取得的不可变、已授权视图快照，`readPage(page,pageSize)` 按同一排序/筛选生成各页。执行器检查所有页同 `collectionId/schemaRef`、精确总数、连续 page/pageSize、hasMore、稳定 rowId 不重复、字段不扩大；异常拒绝而非仅导出当前页或偷偷截断。默认不接受估算/未知 total。**当前仅针对可固定小结果集的 Owner；非事务源必须提供真实 Snapshot 机制，不能假装一致性**。
- **预算**：硬上限 10 页、1,000 行、每页 100 行、262,144 bytes、30,000ms，以及严格由调用方设定的更小 policy；任何超限/授权消失/审计失败，必须明确报错且不返回任何 CSV。公式注入仍使用原 page-csv 保护；重复表头被剔除，保留 CSV 多行字段而不按内容换行拆分。
- **授权检查时点**：入口、读取每页之前、生成后审计前与审计后返还字节前重查。严格不称“证明远程流失效时即时撤权”；同进程调用仍有小的 TOCTOU 时窗，后续下载 Job 必须在用户取文件时重新 Host 鉴权。

## 已实施代码与验收矩阵（结果须以精确 HEAD CI 为准）

- [通用安全执行器](../../../foundation/collection-query/authorized-cross-page-csv.ts) **不出现在** `catalog/seed.ts` manifest、`manager/server.ts` Host handlers 或任何 Eidos 下载按钮里。**没有新的真实产品导出接口**，默认对所有线上用户不可达。
- [协议负例测试](../../../tests/protocol/cv04-cross-page-export-budget.test.mjs) 使用单个固定数据源快照与可注入授权/审计，实现：5 行三页/公式编码/只一份表头/metadata-only 审计、无 EXPORT 授权、读取中撤权、错误页/未知总数/错 schema/重复 rowId/禁止字段、行数与字节及时间预算、审计落盘失败、伪快照 ID。凡负例均不得返回任何字节。
- [独立 CI](../../../.github/workflows/cv04-bounded-export-contract.yml) 编译 TypeScript、运行精确协议测试，校验没有意外注册所谓“已上线” export 命令。本目录现有 Eidos/Owner/Protocol/Core、Lightweight Host/Continuity 仍以原主线 gate 为准。

## 下一条真实 Owner 纵切（未完成）

1. 为 **Dictionary** 先做独立 `dictionary.export` AuthorizationProvider Action /受管 Capability Operation（明确与 `dictionary.read` 区分），只在管理员显式启用且真实授权/审计服务可用时开放。Owner 使用一次 `repository.list(contextId)` 固定受限 Snapshot，并调用本执行器，不允许前端循环抓每一页。
2. 实现 Host 驱动的持久审计与 durable Job/状态机、幂等请求 ID、TTL/下载时权限再验、失败恢复/重试、预算累计和速率限制；无其中任一关键能力时**不提供后台导出或无限导出**。小结果同步原型和最终异步 Job 必须分别验收，不能混淆。
3. 真实 Human、Agent、两个 Enterprise 和撤权/插件关闭后的同权、浏览器真实文件、物理手机、东京真实登录账号分别取证；不能用静态测试 Token 代替人工签收。
4. 继续 CV-04 旧 ImportTarget/Recipe/receipt UI 复用和 CV-05～07 List；不触碰 CV-03 N1 生产 SAVE 安全门禁：`N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、SAVE POST 403 / unregistered GET 404，Issue #1212 仍需独立 Owner 签署。

> 无外部新网页查阅；来源为本轮已读的 GitHub 原合同和 [11-06～11-12 研究索引](CV04-WINDOW-20261112-RESEARCH-DECISION-REFERENCE-INDEX.md)。本阶段的代码通过 CI 才可由 CODE_UP_FOR_REVIEW 升级为 CI_PASS，**不得升为 DEPLOYED_EXPORT 或 HUMAN_PASS**。

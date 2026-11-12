# CV-04 / List 基础插件 — 已授权 Collection 当前页 CSV 导出底座（2026-11-12）

> **阶段：ENGINEERING_SLICE，非 CV-04 完成**。接续 [CV-00～07 唯一近期计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md) 和 [Eidos × Platform 采用边界](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)。不另建 List Framework、不修改 Eidos UI、不开放生产 Saved View SAVE，也不把项目级日常开发卡在 N1 Owner 生产审批上。

## 实现范围（2026-11-12 源码 G）

- 复用已有 `contracts/data-collection/query.ts` 的 `DataCollectionResultV010`（当前企业/主体授权 READ 由业务 owner 先完成），新增无副作用 `foundation/collection-query/page-csv.ts` 的 `serializeAuthorizedCollectionPageCsvV010({page,fieldIds})`。
- **仅当前页、最多 100 行、20 列，输出大小受控**；只接受当次 `readableFieldIds` 内的明确字段、拒绝非法/重复字段、未申报业务字段、无效行、过大/非有限 cell。输出保持稳定列顺序和 RFC-style CSV 引号转义；可能被电子表格当成公式执行的前导 `=+-@`（包括前导空格、BOM、零宽空格）会被字面化处理。
- Counterparty/Dictionary owner 的原始有权 Collection Result 都可作为输入；首轮测试实际使用 Dictionary Owner 现有 READ adapter，明确证明隐藏 options/enterprise Context 不会被 CSV 输出。此 helper **不能自行调用 repository、解析全量数据、跳过权限、拼接其它页或写业务对象**。
- CSV 本质是附加的只读序列化手段。单纯持有 READ 权限**不自动授予 EXPORT 权限**：后续页面「导出」按钮必须由对应业务 owner 明确开放 `exportOperationId` 或复用现有获准导出动作；Host 在执行时重新检查当前 Principal、企业、字段、查询语义、行限额及导出权限，实际数据由 owner 提供；Eidos 只提供受控下载交互。当前**没有新 HTTP 路由、Eidos 按钮、Excel/XLSX、全量导出或 Agent WRITE**。

## 测试与验收（以 PR CI 实际结果为准）

- `tests/protocol/cv04-authorized-collection-page-csv.test.mjs`：当前页范围、白名单字段、原始 owner 结果不被变更、逗号/换行/双引号、零和布尔值、公式注入、隐藏字段拒绝、非法页/重复行、巨大字符串和非有限数值拒绝。
- 通过本仓库既有 `npm run build`、Protocol CI、Lightweight Host 和 Continuity 后可判本 **CSV 底座代码 MERGED**；绝不能据此把 CV-04 或整个 List 基础插件标为完成。
- **下一步**：在真实 Dictionary 与 Counterparty owner 中选定实际授权 `EXPORT READ` Operation/字段预算，接上有效 Host action、Eidos 上的可见下载入口、手机/桌面 Human 和 Personal Agent 同权验证；逐页/后台任务的完整数据集导出需要单独的有界服务器任务与安全策略，不得由前端循环访问分页冒充审核过的全量导出。

## 约束和决策

- 用户已明确要求**List 基础插件完成前无需其逐项开发审批**；正常 branch → Draft PR → 准确 HEAD CI → 合并 main → Branch Hygiene 流程自主执行。此要求不等于生产 SQL/KMS 或跨物理 Host 实际安全验收已经通过。
- CV-03 N1 真实授权生产接线仍 `NOT_CERTIFIED`；`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、正式 SAVE POST 403、未注册 GET 404 不动。现有 #1212 Owner 生产门禁作为独立工作线保留，不阻塞此 CV-04 小步开发。
- 资料评级：已读源码及项目计划 **G**；此 helper 的设计与限制 **D**；实际业务 EXPORT 授权、Eidos 可操作按钮、跨企业真实 Agent/Human、完整导出验收 **P**。本次没有新增外部来源、也不升级历史网络资料的查阅等级。

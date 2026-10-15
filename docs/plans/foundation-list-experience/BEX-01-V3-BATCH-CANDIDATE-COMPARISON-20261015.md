# BEX-01 / CP-03 V3｜字段候选用途比较与批量导入核对增量（2026-10-15）

**交接基线**：EVO `main@1e3c3875c35e83157ebfc9311eb6e4ff22f3a99d`（实施起点），Eidos 正式设计语言 `4c2f36040bdca102b67ba65acb7b35998261ab7d`。继续沿用 [V3 原交接](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-HANDOFF-20261015.md) 与 [资料等级索引](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md)。本次**无新增互联网研究**，原飞书、简道云等既有资料只继承相应 A/B/C 等级，不把旧摘要当完整阅读。

## 首先核对的事实

- **已存在实际批量功能**：`apps/object-extension/batch-page.ts` + `batch-action.ts`、`apps/data-import/page.ts` 的批量入口、`manager/server.ts` 按 Host 企业管理权限读取 Job。基于真实隔离 Host 的批量创建 → 自动映射 → 独立 dry-run → 明确提交 → 列表详情验证，既有 `live_supplier_chromium.py` 已涵盖。不得重建第二套批量字段流程。
- #860 OPEN（映射页和单字段创建权威，需避免抢改）；#878 OPEN（历史集中方案文档，而实际业务功能部分已在 main）；#909 Draft 仅研究原型。#921/#925/#929 已合并：继续导入、完整来源列核对、受控行修正均复用。
- **真实交互不足**：此前多个同名目标只有 label + field ID，无法在业务上下文直接核对收款/付款用途；集中批量页仅见非空行数量，不显示来源单元格样本，迫使用户返回前页记忆值。

## 本次独立增量的业务闭环

1. **目标字段用途由有效 Schema 提供**：Host 已计算出的有效 IMPORT 可写字段，额外传递既有 `resolvedDescription` 到 batch UI；不构造第二套 schema、不推断其用途、不变更权限边界或 WRITE 逻辑。
2. **同名字段并列核对**：当同名字段超过一个（或唯一同名字段已经被其他来源占用）时，在当前来源列旁显示每个候选的 label、已定义业务描述、类型、实际 field ID、占用该目标的来源列；用途缺失要明确提示审核，不伪造说明。下拉的同名选项也提示用途（长文本截断，完整内容在核对字段中）。
3. **源数据就地可见**：每列仅显示来自企业授权 Job 的最多三项不同非空原始单元格样本，单个预览截断 48 字符，仍列明非空行数；后台完整 `job.source.rows` 一字未动。不是 HTML 演示数据、不是全部行值浏览。
4. **既有决定继续优先**：有且唯一的现有匹配优先；两个同名目标 **`__REVIEW__`**，必须 Human 选定且一对一，不能静默推断；名称为系统元数据的来源列仍默认审核而不是随意创建扩展字段。已有 `batch-action.ts` 全批预检查、Host 写入权限、部分失败重试与唯一性规则不变。
5. **确认与权限保持原样**：`requiresConfirmation:true` 的集中新增字段确认、映射更新和最终导入明确提交**分开**；此 PR 不添加可绕过 Host 的写入，不改 Eidos 核心、不更改 Recipe、原始行、`subjectType` 或已完成更正。

## 验收项目｜当前状态｜下一步

| 验收项目 | 当前状态 | 下一步 |
| --- | --- | --- |
| 同名候选用途、类型、field ID 并列比较 | 已实现代码，等待 CI | 真实有效 Schema 下核对收款和付款两种“开户银行” |
| 未说明用途 / 目标占用 | 已实现代码，等待 CI | 测试不得偷偷复用或创建 |
| 企业来源样本就地核对 | 已实现代码，等待 CI | 隔离 Host Chromium 验证真实页面 |
| 原批量一键建字段/映射/确认/重试 | 原 main 已存在、原流程保留 | 继续现有 Host/协议回归 |
| 22 列与三处 `subjectType` 缺失 | 本轮不动原值，不根据 SUPPLIER 推断 | 用户授权原始 Excel/Job 后真实逐行确认 |
| 人工 Human、手机可用性及本地 Schema | 未签收 | 真实浏览器/390px/键盘与 Human 评审 |
| 生产 Railway / 真客户 Excel | 未部署、未取得 | 用户独立部署授权，生产不擅自 WRITE |

## 代码和证据

- `apps/object-extension/batch-page.ts`：候选比较 + 真实原始样本，无额外依赖；
- `manager/server.ts`：BEX 现有批量页面授权数据投影，只追加 `resolvedDescription`；
- `tests/protocol/bex01-batch-extension-import.test.mjs`：同名字段两种用途、占用、真实字段 ID 和原值未改；
- `tests/bex01/live_supplier_chromium.py`：既有隔离真实 Host 全流程中检查预览样本；
- `docs/ui-design-reviews/bex01-v3-batch-candidate-comparison-20261015.md`：Eidos Human 评审。
- 本次仅开发增量候选，未得到客户原始 XLSX、授权 Import Job JSON 和同名银行实际字段所有权，不能以合成字段 ID 作事实签收。

**下阶段要注意**：与 #860 的映射页面交互收敛（直接候选选择与批量确认）可能需要单独做 UI 一致性工作，不能为了少一步自动忽略来源数据或隐藏 Host 权限。

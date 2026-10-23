# BEX-01 V3 / M06｜Window 13 简短交接入口（2026-10-22）

> **先读本文，再读** [Window 13 详细研究资料与决策参考索引](BEX-01-V3-M06-WINDOW-13-RESEARCH-DECISION-REFERENCE-INDEX-20261022.md)。本页是本窗口 2026-10-21 实施、2026-10-22 交接核查的**固定快照**，不是自动滚动状态。执行新任务之前按 [AI-BOOTSTRAP](../../../AI-BOOTSTRAP.md) 和 [项目交付工作流 §5](../../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md) 重新确认 GitHub 的 `main`、全部开放 PR、精确 HEAD/CI、Owner 和 Railway；不可把本文快照或 synthetic 测试当作生产事实。

## 1. 工作线、目标、用户已经确认的要求

- **仓库**：`jiangxng/EVO-App-Platform`（[GitHub](https://github.com/jiangxng/EVO-App-Platform)）。业务唯一活动 Owner：[#1086 Draft](https://github.com/jiangxng/EVO-App-Platform/pull/1086)，分支 `feat/bex01-v3-m06-evidence-density-20261021`，本轮核实 HEAD **`6bde0259aab71b28f742f8178366e266ed2fb368`**；上游依赖 [#1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060) → [#1077](https://github.com/jiangxng/EVO-App-Platform/pull/1077) → #1086，三者仍 Draft/未合并。main 快照 `eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff`。
- **本次交接的文档分支**：`docs/bex01-v3-m06-window13-source-research-handoff-20261022`，从上面**精确 BEX HEAD** 开立，**只新增本入口和对应详细索引**；其 Draft PR 的 base 为业务分支 #1086，而非 main。不要在该文档分支实施业务修改；其他窗口继续在 #1086 Owner 分支推进并先做并发 HEAD 检查。
- **设计唯一可编辑源**：[已批准的 #909 V3 原始 HTML/CSS/JS](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)，精确提交 `af58e0abad880439d54230485305bf2b4e05decc`、blob `9f57e9320eb527786ff7b737be27777eba6f8a92`，290 行。源文件在未合并的 #909 Draft；不要假称在 main。
- **用户的三维 100% 要求不变**：**功能 100%、布局 100%、颜色 100%**，全部以原型与真实 Host 的对应体验逐项关闭并由 Human 独立签收；各屏宽允许合理响应式变化，不要求跨分辨率固定行高、统一到每一个像素。**先读源码而非从截图猜 CSS**；修同根因真实差距而非无止境微调。
- **执行约束**：真实源 Excel、Schema/字段身份、Eidos 通用语义、企业授权、人工映射、显式保存、dry-run、最后确认提交均由 Host 契约控制；不能照搬原型 `localStorage` 自动保存、假预检、假提交。Eidos 负责通用可选 UI/交互，Platform 负责供应商业务/数据。保持并行 PA05、2D、治理 Owner 的边界，不更改 `project.status.json`、`HANDOFF-LATEST.md`、Railway，不绕过门禁、不强推/覆盖活跃分支。

## 2. 本窗口已经真实推进并验证的内容（按顺序）

| 闭环 | 精确提交与已证实结果 | 不要再重复做 |
| --- | --- | --- |
| **项目级方法正式生效** | [#1097](https://github.com/jiangxng/EVO-App-Platform/pull/1097) 已正常合并 main 为 [`eef6774`](https://github.com/jiangxng/EVO-App-Platform/commit/eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff)；已从 main 核对五份交付规则文件。 | 重写/重新研究“源码优先”治理文档；其他窗口直接按 main 的入口启动。 |
| **真实字段改选 → 行状态 / 汇总 / 筛选联动** | #1086 [`cdba8f8`](https://github.com/jiangxng/EVO-App-Platform/commit/cdba8f8034c3f1bb0d9b42d31bd3de4a459ba158)；真实选项驱动 `statusByChoice`、初始筛选取实际 Job 状态，隔离 Host Chromium 和 8/8 检查通过。 | 把未保存选择说成已持久化；把全已匹配任务错误打开在空“关注”筛选。 |
| **撤回临时改选 / 保留服务器问题数** | [`c490dd8`](https://github.com/jiangxng/EVO-App-Platform/commit/c490dd890413506b38b5026a3025d1abc84e4671)，16/16 CI；撤回映射恢复原 `attention`，`reviewTask.metrics[].reactive:false` 防止把 3 个真实 Host issues 错误重算为 1 条当前表格注意行。 | 让本地 DOM 选择擅自消灭 Host 的 dry-run 问题；重造全局硬编码统计。 |
| **预检查页真实「重新预检查」** | [`b700526`](https://github.com/jiangxng/EVO-App-Platform/commit/b700526ec6c4f6eb699b582c5f32e96382533b00)，16/16 CI；执行受权限保护的 `data-import.dry-run`，依 Browser Shell 自带的**单次刷新**恢复后续行纠错；失败不出现 commit。 | 重复 `navigateTo` 同一路由导致双重渲染；复制原型假预检。 |
| **补齐原型第三筛选「待处理」** | 当前最终 [`6bde025`](https://github.com/jiangxng/EVO-App-Platform/commit/6bde0259aab71b28f742f8178366e266ed2fb368)，**16/16 CI 全绿**；根据当前 Human select 真实 `__PENDING__` 值过滤，改选 +1、撤回 −1，保留其他筛选和保存安全边界。 | 以警告颜色代替“待处理”的精确选择值；重新造一套 Eidos 表格。 |

**最终测试快照**：#1086 精确 HEAD `6bde025`，GitHub Check 16/16 SUCCESS（PA-01B2 `full-host-chromium (allow)` 初轮偶发 `MOCK_MODEL_CALL_NOT_SEEN`，**仅单独重试失败 Job 后成功**）。[真实供应商 Chromium run 39563551706](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39563551706)、[证据 artifact 12328632650](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39563551706/artifacts/12328632650) 已核对为成功、现时未过期。该测试为**隔离 Host + 合成 22 列/172 行 XLSX**，包括 1280px/390px，**不证明客户生产或 Human 最终验收**。

## 3. 当前仍 OPEN，禁止自动判为完成

- **阶段：M01–M03 工程完成；M04 客户原 Excel/有效授权 Job、M05 客户授权真实导入、M06 功能/布局/颜色三维 100% Human 终验仍 OPEN，整体 3/6。** 当事人的真实两条同名“开户银行” fieldId/用途、3 条客户真实 `subjectType`、客户原 Excel `往来账户2026_10_08_10_15_23.xlsx` 在本窗口**均未读取/更正**。合成行 165/169/172 不能冒充真实客户记录。
- **M06 三维差异账**目前没有得到 Human 完整的逐项签署。当前功能批次 CI 绿 ≠ V3 全部功能/布局/颜色 100%；原型演示筛选 7/22 与真实同态 Job 6/22 等价性仍需 Human 裁决，不能凑数字；原型“自动保存”文案与真实显式保存是安全语义冲突，不能伪装自动保存。
- **生产/部署**本窗口未实施或验证新业务在 Railway 上线；#1060/#1077/#1086 未合并。任何部署 SHA 要下一窗口重新核实，不能从 Actions 全绿推断。

## 4. 下一窗口的最小行动顺序

1. 按入口先检查 #1086 **最新 HEAD**、#1060/#1077 base 与 main，阅读本配套[详细来源索引](BEX-01-V3-M06-WINDOW-13-RESEARCH-DECISION-REFERENCE-INDEX-20261022.md) §1–§7、以及[Window 12 历史接续](BEX-01-V3-M06-WINDOW-12-HANDOFF-ENTRY-20261021.md)，不要重做 10-15 外站研究。
2. 用 #909 原始 DOM/CSS/JS 与 `apps/data-import/page.ts`、`apps/data-import/actions.ts`、`vendor/eidos/src/{runtime,renderers,app-host}` **一次性形成按功能/布局/颜色分开的真实差异表**，注明已等价实现、冲突需 Human 裁决、真实缺口；优先补**可复现、尚未关闭且用户可操作**的差距，不再为跨视口像素值打补丁。
3. 核心真实行为新增/修改一批后，先定向协议/Chromium，后精确 HEAD 全量相关 CI；遵守[快速反馈与路线止损](../../governance/FAST-FEEDBACK-AND-ROUTE-PIVOT-v1.0.md)。#1086 下独立更新交接与实测证据；不要修改本 docs-only PR 作为业务工作线。
4. M04/M05 需另获真实文件、Context/权限、Human 字段身份与写入确认；M06 则需要 Human 对**功能/布局/颜色各 100%** 的独立签收，不能替其签署。

## 5. 资料保存边界

本轮实读 GitHub 源码/CI/PR 和版本化决策都写入配套**详细参考索引**。2026-10-15/19 的 Microsoft、飞书、NN/g、Airtable 等**外站原文没有在本窗口重新打开**，仅引用此前 GitHub 资料索引的历史查阅等级。旧聊天用户原始截图 PNG 和真实 XLSX 二进制**未在本轮重新取得或新增保存**；2026-10-21 Chromium PNG/JSON 在已验证的 Actions artifact 中，保留准确链接、名称与到期提醒，不把临时容器路径冒充持久文件。Draft PR 的 CI/合并结果须以该 docs-only **最终提交**重新查，不借用 #1086 原 HEAD 的 16/16。


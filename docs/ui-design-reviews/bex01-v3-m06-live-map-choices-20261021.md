# BEX-01 V3 M06：真实 /map 字段改选实时反馈（2026-10-21）

Status: UI REVIEW EVIDENCE / Human 100% 待本人签收。Owner PR #1086；原型源 [#909 HTML/CSS/JS](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) 的 `changed()/render()/fillMappings()` 为本轮源依据，非截图推断。

## 1. 目标
修复原型里改变列映射后即时更新状态/筛选/统计的真实 Host 缺口；用已有通用 Eidos #195 契约，不复制原型 demo 的 localStorage 自动保存和假提交。

## 2. 流程
`/data-import/jobs/:id/map` → 依据持久化 Job 初始化状态 → 用户改选真实 select → 浏览器立即更新该行状态、筛选、匹配/待新增/不导入计数 → 用户仍需明确保存、预检查和授权导入。未保存的关联为“待保存匹配”，不是“已导入”。

## 3. 导航
表格、原生 select、真实来源列、四栏布局、issue 行修正路由与 Host context navigation 均不改变。全部字段筛选始终可恢复被临时隐藏的行；页面切换后仍由真实 Host Job 重建。

## 4. 视觉
未添加颜色或其他 layout patch；继续使用 V3 #909 已固定的目标视觉和 Eidos ReviewTable。前/后改动仅在同行状态文案、汇总数、筛选数。已有 issue 待处理数量来自当前 Host Job，**不被未保存的 DOM 改选虚假减少**。

## 5. 记忆与注意力
`statusByChoice` 只枚举真实选项对应的界面状态；当前 Host 已保存目标才显示“已匹配”。新匹配/同名目标仍显示“待保存匹配”，失效 fieldId 与元数据列保持需关注。应用已存在的来源原样保留与排他映射选择功能，不需要记住其他页结果。

## 6. 无障碍与多端
使用原生 select、Eidos 行 `data-tone`、aria-live 筛选计数；不改变 44px 触摸目标、键盘路径。需在真实 Chromium desktop / 390px 回归验证，自动化不能代替 Human 真机和读屏签收。

## 7. 安全
**不修改**授权、原始数据、映射 Job 状态、schema 新增、commit 或任何 Host 写命令；仅客户端展示状态。不可用字段继续需审核，不能因为同名字段候选而自动断定身份。真实供应商文件/生产不触碰。

## 8. 证据与剩余问题
本 PR：`apps/data-import/page.ts`（声明基于真实字段选项的状态映射），`tests/protocol/bex01-v3-decision-first-visual-review.test.mjs`（状态可达性/验证/渲染），`tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`（22 列真实隔离 Host UI 改选、筛选和恢复回归）。证据以最新 HEAD CI/隔离 Host 测试实跑为准；未取得 CI/Human 实证前不写 PASS。功能/布局/颜色各自 100% 最终 Human 签收仍 OPEN，M04 原始客户 Excel、M05 授权实际导入仍 OPEN。


### 2026-10-21 原型源码对照：撤销本地改选的状态恢复

原型 `changed()/render()/updateIssues()` 显示改选后立即按本次选择更新；真实 Host 的原始系统元数据列可在未保存时先临时标注“不导入”，随后又选回 `__CREATE__`。此时必须返回**原始授权 Job 的 `attention`/「需要核对」**，不能因为 `choiceStatusFor` 的一般分支把它误变为 `pending` 或视为已批准。本轮在 `apps/data-import/page.ts` 先判断“所选值与 Host 恢复值相同”并复用已核验的 `reviewStatusFor`；原始同名目标/不可用目标同理。真实桌面 Chromium 增加 ignore → 原选择 → 状态/汇总恢复 → 整页 reload 的验证，并补协议测试。所有数据仍由 Host Job 持久态提供，不自动写入或消除实际 dry-run 问题。此项测试/CI 需按最终 HEAD 另行确认，不自动升级 Human 签收。

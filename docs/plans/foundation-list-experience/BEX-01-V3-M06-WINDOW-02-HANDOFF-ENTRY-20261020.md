# BEX-01 V3｜M06 高保真审核工作台 Window 02 接续入口（2026-10-20）

> **先读本页，再读 [Window 02 详细研究资料与决策索引](BEX-01-V3-M06-WINDOW-02-RESEARCH-DECISION-REFERENCE-INDEX-20261020.md)。** 本页是本聊天的增量接续快照，不替换 [M06 Window 01 入口](https://github.com/jiangxng/EVO-App-Platform/blob/1e03d120770462190818528b657e72c3e9d76a3a/docs/plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-HANDOFF-ENTRY-20261020.md)、[M06 详细索引](https://github.com/jiangxng/EVO-App-Platform/blob/1e03d120770462190818528b657e72c3e9d76a3a/docs/plans/foundation-list-experience/BEX-01-V3-M06-RESEARCH-DECISION-REFERENCE-INDEX-20261020.md)、M04 入口/索引和 V3 总索引。M06 Window 01 文档当前仍在 [PR #1058](https://github.com/jiangxng/EVO-App-Platform/pull/1058)，尚未合并 main，因此从 main 直接读不到这两份文件。要从该 PR 的精确 HEAD 读取。
>
> **证据标记：** R＝本窗口直接读取 GitHub 原始源码、原型、PR、Actions、Railway；RM＝直接读取元数据/CI 结果、但没有逐页或逐图打开附件；H＝从已有 GitHub 文档继承的外站研究，未重新访问外站全文；D＝待验证。R 不等于真实客户验收。此文是 2026-10-20 的时间点快照，不保证 PR、Actions 和 Railway 以后不变。

## 一、目标、已确认决定和不变边界

交付 EVO-App-Platform / BEX-01 **供应商导入 V3 高保真审核工作台**，以 [#909 原型](https://github.com/jiangxng/EVO-App-Platform/pull/909) 的精确 HTML 为视觉与交互基准，目标 100% 还原。先完成真实 Platform Host 页面、1280px/390px 对照和用户 Human 视觉签收；**在此之前禁止启动客户真实 Excel 的业务验收、Schema 写入或供应商 commit**。

- Eidos 仅负责通用表单、工作台、响应式、控件、可逆导航；Platform 负责 Import Job、业务含义、Host 授权、字段 ID、预检/提交/审计。不可将“开户银行”等客户语义硬编码进 Eidos。
- 保留顶部聚焦按钮和 Ctrl/Cmd+B / 活动栏的原导航恢复行为；聚焦不得覆盖侧栏持久化偏好。390px 供应商表格必须转换为可用卡片，不得降低测试标准。
- 两个同名“开户银行”不可按标签/顺序/AI 置信度猜测；首次要 Human 确认真实 fieldId，之后仅可复用 Human 选择且 dry-run 成功的 Recipe。SUPPLIER 是关系角色，不可推断 ORGANIZATION 身份；3 条真实缺失主体类型须逐条有据确认。
- 不修改 `project.status.json`，不直推 main，不盲目 rebase，不切 Railway 到 release，不覆盖 PA05、EOG、插件治理或 Eidos owner PR。本文档专用分支只新增两份 Markdown，不替换旧文档。

## 二、最终核验快照（2026-10-20，本窗口）

| 对象 | 已核验状态与精确标识 | 正确解释 |
|---|---|---|
| Platform main | `eaa5e813b1e86a6460d988c76eb2076512c35127` | GitHub 当前 main；后续必须刷新 |
| Platform 实施 [PR #1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060) | Draft/Open；分支 `feat/bex01-v3-real-fidelity-clean-mainline-20261020`，HEAD `0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23` | 相对当时 main **ahead 44 / behind 0**；无需按旧 51/43 等分叉数字盲目同步；未合并 |
| [Platform CI 39391932575](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932575) | PASS，精确 HEAD `0f5b5b30…` | 仅是工程门禁 |
| [BEX Real Host Chromium 39391932514](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932514) | PASS，V3 六个命名步骤均执行；artifact `12250007262`，约 6.66MB | 真实隔离 Host、合成数据，**不是生产客户验收或 Human 视觉签收** |
| [BEX In-Context Resume 39391932600](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932600) | PASS | 有权限隔离场景测试 |
| [Human UI Gate 39391932610](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932610)、[Lightweight Host 39391932530](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932530) | PASS | 自动化 Gate ≠ 用户 Human 签收 |
| 原始实施 [#1054](https://github.com/jiangxng/EVO-App-Platform/pull/1054) | 仍 Draft；HEAD `3845c9d953943a3f962ad298669fc66c46956758` | 历史，不在上面推进 |
| 原型 [#909](https://github.com/jiangxng/EVO-App-Platform/pull/909) | Draft；HEAD `af58e0abad880439d54230485305bf2b4e05decc` | 独立 HTML 设计参照；未视作生产 |
| M06 历史文档 [#1058](https://github.com/jiangxng/EVO-App-Platform/pull/1058) | Open；文档 HEAD `1e03d120770462190818528b657e72c3e9d76a3a` | 此 PR 已在原 `ca96…` 后追加多轮证据，**不能覆盖** |
| 并行 V3 草稿 [#1066](https://github.com/jiangxng/EVO-App-Platform/pull/1066)、[#1070](https://github.com/jiangxng/EVO-App-Platform/pull/1070) | 均 Draft / Open，较早 HEAD | 下一窗口比较各自最新分支再决定权威实施线；禁止把三份并行 PR 都直接合并 |
| Eidos [#202](https://github.com/jiangxng/eidos/pull/202) / [#203](https://github.com/jiangxng/eidos/pull/203) / [#204](https://github.com/jiangxng/eidos/pull/204) | 分别为路由聚焦、通用 hidden + file-type iconLabel、工作台问题卡样式；均未合并，相关 CI/Human Gate 通过 | Eidos owner 线分别保存，不把 Platform vendored 副本视为 Eidos main |
| Railway production | Ledger Configurator Online，`main` 分支；最新成功部署 `e5c56ed8-aac9-4177-bc83-9f01b07ad9b9`，源 SHA `eaa5e813…` | **没有部署 #1060**；未改 release 或 Railway 配置 |

## 三、本窗口已完成与可继承的实证

1. 修复了老工具栏测试断言，不删除聚焦按钮；定位 390px 表格未隐藏的真正根因为 vendored Eidos CSS 媒体边界，修复后真实 Chromium 验证表格容器 `display:none`、卡片 `display:grid`。
2. 曾连续修复测试中的批次导航重复匹配、隔离 Host 供应商分页总数与断言不一致。中间失败是旧 HEAD 的有效历史；最终 #1060 精确 HEAD Platform CI 与全套 BEX Chromium 均通过。
3. 修复路由聚焦偏好测试前置状态；将步骤条从不符合原型的顶层三阶段对齐为“选择文件 → 核对并导入”两阶段，保留内部 Schema 确认、独立预检、明确提交。
4. 新增**隔离合成**的 22 列 × 172 行视觉审核状态，16 已匹配、4 待新增、0 忽略、3 种问题：同名银行 / 3 条主体类型缺失 / 系统编码未决。三类问题卡按原型顺序、有真实 Host 动作，截图在最近 BEX artifact；不代表客户字段真实性。
5. 已明确仍欠文件卡片中的 XLSX/CSV 类型图标等原型层级、底部 `返回文件` 与 `恢复初始选择` 的真实导航/重置语义、状态一致时的操作流程/四列密度/移动端逐图比较，以及**用户亲自 Human 视觉签收**。此前自动化 Gate 与实际截图不可冒充签收。

## 四、下一窗口唯一执行顺序

1. 先读本入口和配套索引，再从 PR #1058 的最新 HEAD 读取原 M06 两文档、按需 M04 和 V3 总索引；优先使用旧研究，不重复访问外站。确认 #1060/#1066/#1070 与 Eidos #202/#203/#204 当前归属、HEAD、CI 和 main/Railway。
2. **先检查最新 #1060 的完整 1280px/390px 截图**：BEX run `39391932514`、artifact `12250007262`；对照 #909 不可变 HTML 和原型 run `38704093619` 的 artifact `11957646429`。核对所有真实交互，不是只比静态颜色。
3. 专攻残差：源文件卡片 XLSX 类型徽标/工作表/状态层级；问题区三类动作；四列映射标题、行密度、筛选；两阶段步骤；底部返回、恢复、预检查的 Host 真实语义和状态。Eidos #203 已提供通用图标/hidden 契约候选，先审查再同步；禁止 Platform 业务写入 Eidos。
4. 将改动限定在合适 owner PR/隔离实施分支；修复后用**新的精确 HEAD** 跑 Platform CI、BEX Real Host Chromium（每个 V3 step 不得 skipped），保留截图 artifact，再由用户 Human 视觉签收。无签收绝不合并宣称 100%。
5. 视觉签收之后才请求真实 Excel、授权 Import Job、两条银行字段 ID/用途及三条真实身份材料，启动 M04；完成后才继续 M05 真实完整导入。

## 五、M01–M06 五维状态（固定总计 3/6）

| 里程碑 | 源码/工程 | CI/Chromium | 生产部署 | 真实客户业务验收 | Human 视觉 |
|---|---|---|---|---|---|
| M01 四列审核 | 已完成 | 历史 PASS | 既有历史工程部署，不在本轮重新证明 | 不适用 | 最终视觉纳入 M06 |
| M02 集中批次审核 | 已完成 | 历史 PASS | 既有历史工程部署，不在本轮重新证明 | 不适用 | 最终视觉纳入 M06 |
| M03 草稿恢复 | 已完成 | 历史 PASS | 既有历史工程部署，不在本轮重新证明 | 授权真实会话仍独立 | 不适用 |
| M04 客户真实数据 | 工程安全子项已有 | 合成证明非客户验收 | 不作为放行依据 | **OPEN** | 不适用 |
| M05 真实完整导入 | 工程链路基础已有 | 合成证明非客户验收 | 不作为放行依据 | **OPEN** | 不适用 |
| M06 V3 高保真 | **建设中，PR Draft** | #1060 HEAD 工程门禁 PASS | **未部署此 Draft** | 视觉签收前禁止启动 | **OPEN，待用户签收** |

客户 `往来账户2026_10_08_10_15_23.xlsx` 原件、真实授权 Import Job、两条银行真实 fieldId/用途、三条真实主体身份和完整用户原始四图持久二进制仍无本轮新授权证据。不得用 synthetic job、旧文件名、旧 Import Job 字符串冒充客户事实。
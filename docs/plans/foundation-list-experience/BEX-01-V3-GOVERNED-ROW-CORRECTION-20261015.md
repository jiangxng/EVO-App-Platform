# BEX-01 / CP-03 V3｜真实导入异常单元格受控修正（2026-10-15）

**状态：** 开发闭环已合并 main，隔离 Host/Chromium 与协议门禁通过；不代表真实客户 Excel 验收。

## 继承与没有重复的研究

继续沿用 [V3 交接](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-HANDOFF-20261015.md) 与 [详细来源/证据等级索引](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md)；没有新增外网搜索，也没有把 CN08–09 摘要升级为完整阅读。正式设计规范：Eidos #186。已有 #921 继续导入和 #925 全列原始核对直接复用，不重建。

本 PR 起始 `main@9b15e0a392130f5f337e1b90a25023d5318ca14a`。#860 的业务字段映射/单列创建仍 OPEN；#878 的批量设计及其它 Host 改动仍 OPEN；#909 是原型与研究 Draft。只在 **Data Import owner** 内追加导入行级更正契约，Host 共享文件仅追加原模块路由和 lazy command，不涉及其它窗口的认证逻辑或 Eidos 通用运行代码。合并前必须对齐最新 main 和公共文件差异。

## 功能边界与决定

- **保留原件**：`job.source.headers/rows` 保持上传时单元格原值；`rowCorrections` 作为 Job 内、当前企业上下文可持久化的独立更正层，记录行号、来源列、新值、操作者和时间。不是浏览器 `localStorage`。
- **异常直达**：预检查失败行旁提供“修正本行问题”，进入带原值、字段用途和候选枚举的上下文表单；已有更正行优先显示“查看或撤销本行更正”。不声称与原表格同卡嵌入式编辑已完成。
- **不乱改**：仅支持当前已映射的、IMPORT 可写的 `STRING/ENUM` 字段；只能修正被真实 dry-run 标为该字段有问题的行或修改已有更正；同名字段仍依真实 target field ID；转换映射、忽略列、提交后作业拒绝修改。
- **不猜身份**：`subjectType` 只能由 Human 挑选合法枚举值，不能用 `SUPPLIER` 关系角色推断，也不能用任意新枚举代替身份。
- **重新预检**：每次 SET/REVERT 都让旧 dry-run/receipt 失效成 STAGED，保存后以现有目标验证器重新 dry-run；直到所有行通过仍须原明确 commit。若重新预检失败，Job 已保存为 STAGED 可恢复，不得以旧预检许可 commit。
- **回退与保存**：REVERT 删除本次更正，恢复原来源值；新映射若改变目标或变为转换映射，会丢弃不再合法的对应更正，保留其它同一来源及目标未变的更正；`RECIPE` 与其它字段映射保留。
- **权限与并发**：正式能力标注 `HUMAN` + `WRITE` + 企业 Job resource + Host-required idempotency/receipt，服务再次检查 ENTERPRISE 上下文和 ACTIVE OWNER/ADMIN；不存在授权时拒绝。表单带当前特定行/列/映射/已保存修正的 revision token，旧页面提交拒绝，避免静默覆盖。没有客户端自由输入 target field ID。
- **范围限定**：本轮不支持 NUMBER/DATE/BOOLEAN、未经标记的行、同名列合并、批量任意行值静默修补；不改变 Object Extension Schema 或权限 owner。受控修正不是上传 Excel 二进制回写。
- **真实数据未到**：用户原始 `往来账户2026_10_08_10_15_23.xlsx`、授权 Import Job、真实字段业务用途未取得；绝不声称真实 172 行、三缺失记录或同名银行归属已人工签收。

## 验收项目｜当前状态｜下一步

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| 原始值及更正审计持久化 | 已合并，隔离 CI PASS | 验证真实 Host Job 持久重新读取及恢复 |
| 预检查失效/回退 | 已合并，隔离 CI PASS | 定向协议 + Chromium 修正/撤销与禁止旧 commit |
| `subjectType` 合法人工选择 | 已合并，隔离 CI PASS | 原客户三行真实身份逐行验收 |
| WRITE/OWNER/ADMIN/AI 权限边界 | 已合并，权限协议测试 PASS | 现有 Host 权限与隔离安全回归 |
| 390px 手机/中文 | 隔离 Host Chromium 桌面及 390px 手机 PASS | 实际 Host Chromium 及 Human 点按确认 |
| 同名银行 / 批量字段方案 | 未由本 PR 重新实现 | 吸收 #860/#878，真实 field ID 核验 |
| 用户原始 XLSX 与生产写入 | 未取得/未授权 | 私有附件与正式授权后单独验收 |
| Railway | 未部署 | 不擅自上线 |

## 代码与证据入口

- 领域：`apps/data-import/types.ts`、`service.ts`（更正服务及审计辅助）、`repository.ts`（仍复用存储）。
- Host 与 UI：`actions.ts`、`capability-manifest.ts`、`constants.ts`、`package.ts`、`row-correction-page.ts`、`page.ts` review、`manager/server.ts` 定向注册。
- 回归：`tests/protocol/bex01-v3-row-correction.test.mjs`、`tests/bex01/v3_row_correction_chromium.py`，及原供应商/安全/平台工作流。
- Human Review：`docs/ui-design-reviews/bex01-v3-governed-row-correction-20261015.md`。

**后续设计缺口**：避免表单需要看到行号、列名、修正版本等低价值固定输入。未来可在 Eidos 标准上进一步支持上下文动作携带只读 Host-owned 参数，不通过 BEX 私造隐藏 HTML/CSS 或降低请求验证。

## 合并后认证结果（2026-10-15；本节覆盖此前实施候选状态）

- 正式实现 [PR #929](https://github.com/jiangxng/EVO-App-Platform/pull/929) **MERGED**，合并 `main@0eb56f1135b05da535b8faa71d44ee709fa99d89`。
- 与 PA-05 并行窗口最新 `main@ad0b4172eb1cf0086d4836b57203a62107ee1323` 做无冲突合并，再次执行 **43/43 工作流成功**，GitHub required checks 与 `mergeable_state=clean`，正常合并、不绕过保护。
- [Platform CI #38710095220](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38710095220)、[真实 Host Chromium #38710095251](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38710095251)、[专项导入协议 #38710095100](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38710095100)、[Human UI #38710095592](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38710095592)、[Continuity #38710095471](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38710095471)、[Lightweight Host #38710095261](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38710095261) 全部通过。
- 实际隔离 Host / Chromium 141 控制台证明 `BEX01_V3_ROW_CORRECTION_HOST_PASS:DESKTOP` 与 `...:PHONE`，均覆盖本行修正、再预检、撤销恢复；原供应商旅程保持 5/5 PASS。原值已作为业务表单只读字段**当场可见**，而非藏在页面元信息里。
- 行更正权威已经收敛到既有 `apps/data-import/service.ts`，`types.ts` 保存数据契约；**没有独立 `row-correction.ts` 运行模块**。这是轻量 Host 依赖校验发现不合理新边后做出的修正，不能在后续窗口恢复那条静态依赖。
- **开发验收定位：** `DEV_COMPLETE`（真实 Host 行级修正闭环，隔离测试）；**未取得**用户原始 XLSX 二进制、授权 Job JSON 与客户字段身份，真实三行主体类型尚未逐行签收。未执行 Railway，不能称 `DEPLOYED` 或 `PRODUCTION_READY`。

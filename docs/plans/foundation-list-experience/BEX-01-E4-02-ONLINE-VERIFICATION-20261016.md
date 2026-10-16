# BEX-01 E4-02｜真实 /map 紧凑核对界面：合并、部署与剩余验收（2026-10-16）

> 状态：**E4-02 scoped implementation merged + isolated Host Chromium PASS + Railway deployment SUCCESS；真实客户原文件与 Human V3 视觉签收仍待完成。** 本页是追加证据，不覆盖 [E4-01 已恢复截图](BEX-01-E4-01-V3-TO-REAL-MAP-EVIDENCE-20261016.md) 或 [E4 总交接](BEX-01-E4-V3-RECOVERY-AND-EVIDENCE-20261016.md)。没有复制原型 CSS、修改 Host 安全规则或模拟真实用户签收。

## 1. 当前准确事实

- Eidos 共享 owner [#192](https://github.com/jiangxng/eidos/pull/192) 已合并，Eidos `main@14409715a7497e79976dc76e28c845e4b5678e97`（本次 GitHub 核验）；将通用来源明细移到证据单元格内部，避免为已折叠详情保留空白行。
- Platform [#973](https://github.com/jiangxng/EVO-App-Platform/pull/973) 已合并，`main@8f2b86a77fae933c63bcbb8731729f92f12cd6a5`：真实 `/data-import/jobs/:id/map` 精简默认样本、保留展开的原始来源数据；唯一目标字段显示业务名而不附加技术 ID；同名候选仍保留业务用途和稳定字段 ID；“当前文件”显示 XLSX 名称，底层 option value 仍为原 importJobId。
- Railway 已直接通过接入服务核验：项目 `EVO Ledger Runtime MVP` → production → `Ledger Configurator` 最新部署 **SUCCESS**，部署元数据 commit `8f2b86a7`、branch `main`（2026-10-16 11:01 UTC）。这证明部署成功，**不证明用户有权打开的登录页面视觉已签收**。
- 合并 SHA 的 Platform CI / Project Continuity CI / Lightweight Host / Branch retirement 记录为 success。PR 的准确 HEAD `e449cc8cfed28815f82f08cd5e1a0e38305986d2` 中 Human UI Design Review Gate、Platform CI、BEX-01 Real Host Chromium Supplier Journey 等为 success。浏览器运行 [#38890875885](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38890875885)；[artifact #12042081460](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38890875885/artifacts/12042081460) 本次已实际取得并检查，ZIP 含 `v3-e2-actual-map-22-rows-desktop.png`、`v3-e4-task-overview-desktop.png`、对应手机截图、`report.json`、`synthetic-retained-fields.xlsx` 等。
- 这套图来自**受控隔离 Host 的 synthetic 172×22 Excel**，并非用户原始文件；PNG 有表格局部和局部任务概览，但没有覆盖用户登录后的生产页面全局/底部/真实 Job 状态。

## 2. E4 按证据分层的实际进度

| 阶段 | 当前证据 | 状态 |
| --- | --- | --- |
| Eidos 共享 E1–E3、E4 紧凑来源证据 | #187–#192 相关共享能力和 UI 合并 | 代码已交付 |
| Platform `/map` 四列、任务上下文、目标字段业务化、文件名 | #964、#966、#973 合并；专项协议和隔离 Host Chromium 成功 | 代码与自动化已验证 |
| Railway 生产部署 | Railway 真实部署记录：8f2b86a7 / SUCCESS / main | 部署已验证（非 Human） |
| 用户原型视觉签收 | 需真实授权页面 1280 和 390px 全页截图，与 #909 V3 逐段对照 | **待验** |
| 客户原始 Excel / 已认证 Import Job | 原文件 `往来账户2026_10_08_10_15_23.xlsx`、授权 Job 及两个“开户银行” field ID、三行 subjectType 的实际最新证据尚未取得 | **待验** |
| 现场端到端业务签收 | 历史 Recipe 复用、Schema Owner 批准、行修复、dry-run 失效、明确提交、幂等与实际供应商读取 | **待验** |

## 3. 不再重复开发；下一步唯一优先验证事项

1. 对 **已经部署** 的 `8f2b86a7` 真实 `#/data-import/jobs/import-79ce7d97-bbea-442a-b656-0661273b52f8/map`，取得登录后桌面全页、390px 全页和底部操作区的截图（受权用户或拥有受权浏览器会话的执行者）。不尝试绕过登录、猜测企业数据或从静态 HTML 推断实际场景。
2. 对照 [#909 V3 原型](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) 的七项验收表：标题/来源上下文、步骤与四统计、问题就地处理、四列阅读密度、预检/确认操作、中文文案、手机状态。逐项记录“通过/差异/缺图”，用户最终签收不能由 CI 替代。
3. 只对实际仍存在的差异提新的 bounded 实现 PR。Eidos 负责通用呈现，Platform 负责业务事实/命令/文案；避免与 PA05、治理窗口并行变更和未合并 #909/#878/#846 冲突。
4. 获得受权客户文件与 Job 证据后进入 E4-03 真数据闭环；如果尚未取得，只能写明受阻，不能以 synthetic 测试宣布真实客户数据完成。

**结论：E4-02 的本批工程整改已到部署成功，但 E4 整体还未 Human closed。**


## 4. E4 连续滚动的浏览器证据补齐（2026-10-16）

- [Platform PR #978](https://github.com/jiangxng/EVO-App-Platform/pull/978) 针对实际 `/data-import/jobs/:id/map` 的 Eidos **内部滚动层**进行连续截图，而不是以 `page.screenshot(full_page=True)` 错认全页。代码只改 `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`，无 UI/Host 命令/业务数据变更。
- 已实际运行 [BEX-01 Real Host Chromium Supplier Journey run #38895420715](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38895420715)，结果 PASS；[artifact #12044215349](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38895420715/artifacts/12044215349) 含全部原始 PNG 和 JSON manifest，经下载逐一核验。
- **1280×900 桌面**：真实 Eidos 内部滚动层高度 3,981px、可见高度 848px，0–3,133px；**6 张连续截图**，相邻起点最大间距 678px（保证有约 20% 重叠）。
- **390×844 手机模拟**：内部滚动层高度 9,139px、可见高度 706px，0–8,433px；**16 张连续截图**，相邻起点最大间距 564px。同场景全部 22 来源列展开审阅；可用于审查长表格的效率及底部动作是否可达，但不能直接推出客户现场也有同等列数或同样页面长度。
- 另有桌面与手机各四张定点快照（任务概览、第一行、末行、最终按钮）；`v3-e4-map-{desktop,phone}-scroll-manifest.json` 持久化各自滚动几何与定点屏幕坐标。检测只在 synthetic/isolated Host 内运行，不包括正式部署的账号会话。
- **新增待判断的体验风险**：手机上 22 列映射的完整纵向审阅达 9,139px；这支持实际做移动端减少重复信息、分组焦点和动作可达性评估，而**不是**凭屏幕高度直接批准新的固定底栏或改变 Eidos 组件全局样式。真正修改前应先获得用户的 V3 Human 视觉评审与现有触摸/键盘冲突结论。

**验收边界仍然不变：** 登录后的 Railway 真实客户作业截图、原 Excel、两个同名银行字段的真实 ID、缺失主体类型的实际数据及客户书面视觉签收均尚未取得。逐屏隔离 Host 证据只补齐自动化视觉审查的盲区，不将 E4-03/E4-04 标为完成。

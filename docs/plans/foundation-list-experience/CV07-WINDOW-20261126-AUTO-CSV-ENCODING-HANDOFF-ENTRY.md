# CV07 / Foundation List Experience — 2026-11-26 自动 CSV 编码与工程交接入口

**START_HERE / PREVIOUS_CSV_FIX_ENGINEERING_CLOSED / AUTO_ENCODING_HEAD_GREEN_DRAFT / HUMAN_NOT_SIGNED / FULL_CV07_EXIT_NOT_MET**

先读本文件，再读[详细研究、决策与证据索引](CV07-WINDOW-20261126-AUTO-CSV-ENCODING-RESEARCH-DECISION-INDEX.md)。上一阶段固定入口：[真实 CSV 反馈入口](CV07-WINDOW-20261126-CSV-HUMAN-FEEDBACK-HANDOFF-ENTRY.md)、[详细索引](CV07-WINDOW-20261126-CSV-HUMAN-FEEDBACK-RESEARCH-DECISION-INDEX.md)。最新原始证据优先于历史文档；前阶段最终闭环见 [#1391 评论 7183882843](https://github.com/jiangxng/EVO-App-Platform/pull/1391#issuecomment-7183882843)。本窗口没有新增外部研究，不重复旧 SharePoint/Odoo/Power Apps/Eidos 研究。

## 准确状态
- 仓库 https://github.com/jiangxng/EVO-App-Platform；唯一集成分支 protected main，写入前核验 `faebe309dbe76f33f12811c77e5516e4cf17b681`。最后独立实证东京实际运行镜像 `7741f13c63bfcfa3f898a0a2f83fab8e3e188f85`，相对 main 仅两份文档、无运行代码差异。
- #1391 已 5/5 门禁全绿普通合并，合并后 main 4 SUCCESS+1 合规 SKIPPED，0 fail；Branch Hygiene 已精确清理，docs-only release skip 与只读巡检成功；原 PR 评论 7183882843 写入并回读。上一切片工程闭环不等于 Human 签收。
- Human 新截图反馈：CSV 上传页要求选择编码，明确要求“改成自动判断，降低用户的使用难度”。本轮仅修改通用 Data Import，不重做上一修复。
- [功能 Draft PR #1392](https://github.com/jiangxng/EVO-App-Platform/pull/1392)，过程分支 `fix/cv07-csv-auto-encoding-20261126`，准确最新 HEAD `a0b654a31fac1a967c56c42b38df62973d331fc0`；首次实现 `6a04285ec2862a357420e13ac9ed89a3e6b1f686` 的 UI 文档格式导致两项门禁失败，已在同 PR 补齐确切源码路径及九项独立证据行，不修改门禁。最新 HEAD 7/7 SUCCESS（API 刷新），仍 Draft，尚未合并/上线。
- 自动策略：缺省/显式 AUTO 首先严格 UTF-8，只有解码错误才尝试严格 GB18030（兼容 GBK）；UTF-8 BOM 权威，不降级；UTF-16/32 BOM 拒绝并提示另存；双重有效但不同文本优先 UTF-8，保留手动覆盖，不宣称普遍无歧义。真正重复表头/解析错误不触发换编码；XLSX、权限、映射、staged cells、独立预检/确认/发布保持。Eidos 原生 select 默认“自动识别（推荐）”，普通用户无需选择，手动选项仅异常恢复；不是隐藏控件方案。
- [最新协议原日志](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795998138/job/139826661399) 1526 tests/1525 pass/0 fail/1 skip，ok578/579/629；[Chromium](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795998057/job/139826661124) 共用供应商桌面/手机回归成功；[Lightweight](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795998127/job/139826797641) 6+411+6 全通过；[UI gate](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795997833/job/139826660659) 通过（非 Human PASS）。本窗口未重新取得真实原 CSV。
- 独立 docs Draft PR 保存此两份文档；不抢先合并造成 #1392 发布 stale/superseded。准确文档 HEAD、PR、CI 与后续闭环在原 PR 评论补记，不为自引用反复建 PR。

## 下一窗口执行顺序
1. 刷新 protected main、#1392 准确 HEAD、全部 CI 与本交接 docs PR，若 main 移动先核对非重叠、安全同步，不强推。#1392 7/7 全绿且基线一致才解除 Draft，核验 Ready 新增 UI 门禁成功，锁定准确 HEAD 普通 merge。
2. 核验合并 main Continuity、Platform、Lightweight；通过现有 Branch Hygiene 自动精确清理功能过程分支（预期 HEAD a0b654a31fac1a967c56c42b38df62973d331fc0，若变更先核验新 HEAD）。现有 CI-gated Tokyo 自动发布及自动只读 inventory，读取原日志确认实际新运行镜像、healthy、HTTPS、Basic Auth、字典/导入 installed+active、Owner、Item 状态；不重复触发、不代写生产数据。
3. 功能部署和巡检实证完成后，处理 docs PR：若 base 已移动，安全同步 main 到 docs 过程分支并重新核验仅两文档、准确 HEAD 全绿，再解除 Draft、Ready UI 门禁、普通 merge。通过 Branch Hygiene Actions 精确清理文档分支；核验 docs-only main CI、发布 skip、后验镜像不变。证据追加 #1392 与交接 PR 原评论。
4. 通知 Human：合法 OWNER/ADMIN 会话，未经修改的 dictionary_业务字典.csv 保持默认自动识别直接上传，不再要求先手动 GB18030；核对六列自动匹配，显式确认冗余选项主键不单独导入（保留 staged cells），193行39定义与线上冲突、预检零业务写入、独立确认 DRAFT、旧发布隔离、定义编辑/根子节点/父子关系/改名、返回搜索筛选分页、独立 Human 发布、PC1096/1280/1440 与手机390真实视觉键盘触摸、撤权/换企业/停用拒绝。原文件无父级列，不猜关系。
5. 本切片非完整 CV07 退出；Item 真实样本及独立开发者接入仍缺。Eidos PC 优先、轻量 Host、通用能力、protected main，不碰 #1184 或其他窗口，不开启正式 CV03 WRITE/CV04后台EXPORT/OIDC/PA05/Agent WRITE。没有独立工作且必须人工验证才标【续跑状态：人工验证】，全任务完成才标【续跑状态：完成】。

附件：本窗口截图 image(20261126-094927).png（file_00000000c7f08209b936b9e4de20a442）未入 GitHub，显示上传页编码 select 及用户红箭头；不冒充新版截图。旧真实 CSV/错误截图仍未入库，若需原件逐行核验请用户重新提供。现有统计与诊断证据留在 #1390/#1391。

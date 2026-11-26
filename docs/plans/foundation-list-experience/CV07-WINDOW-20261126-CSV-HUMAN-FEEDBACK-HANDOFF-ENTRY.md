# CV07 / Foundation List Experience — 2026-11-26 真实 CSV 反馈与三轮续跑交接入口

**START_HERE / CSV_FIX_MERGED / TOKYO_RELEASE_PENDING_VERIFICATION / HUMAN_NOT_SIGNED / FULL_CV07_EXIT_NOT_MET**

先读本文件，再读[详细研究、决策及证据索引](CV07-WINDOW-20261126-CSV-HUMAN-FEEDBACK-RESEARCH-DECISION-INDEX.md)；最新状态以 [#1390 原交付记录](https://github.com/jiangxng/EVO-App-Platform/pull/1390) 和本交接 PR 的后续评论、Actions 原日志为准。历史索引不覆盖：[六轮续跑入口](CV07-WINDOW-20261126-SIX-RUN-HANDOFF-ENTRY.md)、[详细索引](CV07-WINDOW-20261126-SIX-RUN-RESEARCH-DECISION-INDEX.md)、[恢复索引](CV07-WINDOW-20261126-RECOVERED-RESEARCH-DECISION-INDEX.md)、[11-19 原研究入口](CV07-WINDOW-20261119-RESEARCH-HANDOFF-ENTRY.md)、[11-25 Eidos/字典导入交付](CV07-WINDOW-20261125-EIDOS-DICTIONARY-IMPORT-DELIVERY.md)。#1389 最终工程证据见 [7182049313](https://github.com/jiangxng/EVO-App-Platform/pull/1389#issuecomment-7182049313)。

## 当前准确基线与结果
- 仓库 https://github.com/jiangxng/EVO-App-Platform；唯一集成分支 protected main，写入时准确提交 `7741f13c63bfcfa3f898a0a2f83fab8e3e188f85`。
- 先前 #1389 工程闭环、五条过程分支清理、docs-only skip 和只读巡检均已确认。之后 Human 真实 CSV 上传在第一步报 DATA_IMPORT_CSV_HEADER_DUPLICATE，不能沿用旧 Human 验收结论。
- 原始 CSV 本窗口实际取得并本地读取：11,840 bytes；strict UTF-8 offset2 fail；GBK/GB18030 解码成功；旧 replacement UTF-8 第1和5列表头相同；新严格解码7个不同表头、193数据行、39字典定义。193/193 选项主键=字典编码+"/"+选项编码；源内重复键/同字典异名/必填空值/别名歧义为0，ACTIVE 193。不是线上预检，既有企业数据冲突未知。原文件无需改动，需 Human 明确确认不单独导入衍生主键列，原始 staged cells 保留；原文件没有父级列，不推断父子关系。
- [#1390](https://github.com/jiangxng/EVO-App-Platform/pull/1390) 修复通用上传：默认严格 UTF-8，明确 GB18030/GBK 选择，真实重复仍拒绝且列号提示，XLSX 保持。准确 HEAD `46b5cb08592e93adb18969c24ad6cef861693ec9` 8/8 checks SUCCESS，普通合并到上述 main；Git Tree `d3c4b059992385af56ee386fdb4901f952f5d7cf` 与已验 HEAD 一致。
- [精确分支清理](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45763230019/job/139717911827) 05:41:33Z 已删除 fix/cv07-csv-upload-encoding-20261126 @ 46b5cb08...；查询为空。功能剩余 PR=0、过程分支=0。
- main 工程 CI 3/3 SUCCESS；协议1525 tests / 1524 pass / 0 fail / 1 skip，ok578；Lightweight 05:43:45Z 成功。共享供应商 Chromium 桌面/手机回归通过，不等于真实字典浏览器验收。
- [Tokyo #45763262220](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45763262220) [Preflight 原日志](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45763262220/job/139718020936) 05:44:01.6838464Z EVO_TOKYO_MAIN_CI_VERIFIED sha=7741f13c63bfcfa3f898a0a2f83fab8e3e188f85；[deploy job139718815871](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45763262220/job/139718815871) 写入时 in_progress、SSH/身份/Docker SUCCESS，Required pre-deploy platform validation 正在执行。**尚未证明新镜像实际上线**；最后独立实证运行镜像仍是 9d2ee382b2a607787bfb210cf371fcf6cb919799，healthy 等见旧巡检 [#45751125850](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45751125850/job/139678885049)。
- 此交接仅新增两份 docs；通过独立 docs Draft PR 保存，允许与发布并行 CI，禁止抢先合并导致功能 release stale/superseded。精确 docs HEAD、PR号、最新 CI、最终部署/巡检与文档合并清理证据在对应 PR 评论追记，避免循环提交。勿重复开发或发布。

## 接续任务（顺序）
1. 刷新 protected main、#1390 和本 docs PR 的精确 HEAD；读取现有 release #45763262220/job139718815871 原日志，确认实际运行镜像 SHA、healthy、LOCAL/HTTPS/Basic Auth；等待已配置的自动只读 inventory 工作流，核验字典/导入 installed+active、Owner、Item 状态；不重复触发发布、不绕门禁。若失败读原日志并按现有恢复流程推进，不假定成功。
2. 在功能部署与 inventory 实证、docs 准确 HEAD 全绿后才解除 Draft、验 Ready 新门禁、普通 merge；若 main 变化先核对无重叠并安全同步，不强推。验 docs-only main CI、发布 skip、通过 Branch Hygiene 精确删除 docs 分支，后验运行镜像仍为功能版本；证据补 #1390 与交接 PR 评论。
3. 通知 Human 使用原文件、上传时选 GB18030，明确确认主键冗余列排除（不删除原列），核验六列映射、193行实际预检、既有数据冲突、零业务写入预检→独立确认 DRAFT→旧发布隔离→字典定义/根/子/改名/父子关系及编辑发布返回原搜索/筛选/分页→单独 Human 发布→PC1096/1280/1440 与390、键盘/触摸、撤权/换企业/停用拒绝。不得代写生产业务数据。
4. 本次切片与完整 List Foundation 退出严格区分。Item 真实样本、独立开发者接入仍缺。保持 Eidos PC 优先、轻量 Host、通用导入、protected main、不碰 #1184、不启用正式 CV03 WRITE/CV04后台EXPORT/OIDC/PA05/Agent WRITE。三轮自动续跑已用完不等于部署完成；无独立工作且必须人验才标【续跑状态：人工验证】，全任务完成才标【续跑状态：完成】。

附件未入库：本对话 Human 截图 image(20261126-053555).png 与 dictionary_业务字典.csv，真实业务原件保留在聊天附件，换窗若需逐行复验请重新提供原件；GitHub 仅保存结构/统计、合成回归与证据索引。无外站新研究、无真实业务写入。

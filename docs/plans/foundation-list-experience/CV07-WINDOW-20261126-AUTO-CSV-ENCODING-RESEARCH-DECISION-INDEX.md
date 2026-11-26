# CV07 — 自动 CSV 编码与工程闭环研究、决策及证据索引（2026-11-26）

## 0. 来源等级、范围与时间
G-O = 本窗口实际读取 GitHub 原文/原日志/PR 评论；G-M = 实际读取 GitHub API 元数据，非原日志；P = 用户明确要求/截图；H = 继承历史索引，不代表本窗口重新阅读外部原文；U = 待验证。以下已读资料查阅日均 2026-11-26，Actions 时间 UTC，用户续跑记录 +08:00。本窗口没有外部网站新研究、没有仅阅读搜索摘要的来源，不补造。既有外部资料索引见 [真实 CSV 详细索引](CV07-WINDOW-20261126-CSV-HUMAN-FEEDBACK-RESEARCH-DECISION-INDEX.md) §0/3、[六轮续跑索引](CV07-WINDOW-20261126-SIX-RUN-RESEARCH-DECISION-INDEX.md)、[恢复索引](CV07-WINDOW-20261126-RECOVERED-RESEARCH-DECISION-INDEX.md)；按需沿原阅读等级使用。

## 1. 目标、明确要求、决定与未决
P：完成 #1391 工程收尾；Human 后续截图要求“改成自动判断，降低用户的使用难度”；通用 Data Import 改进，保留 Eidos PC 优先、轻量 Host、既有字典/导入权限、显式预检与 DRAFT/独立发布；唯一集成分支 protected main，准确 HEAD CI 全绿、Ready 门禁、普通 merge、Actions 清理，不强推、不碰 #1184、其他窗口或未经授权写生产数据，不开启正式 CV03 WRITE/CV04 后台 EXPORT/OIDC/PA05/Agent WRITE。
已确认：#1391 工程闭环完成；#1392 自动编码代码及回归已提交，初始 UI 文档格式缺陷已修复，最新 HEAD 7/7 SUCCESS 仍 Draft。待办：Ready 新门禁、普通合并、main CI、分支清理、东京自动发布与独立巡检、docs PR 合并清理及后验、真实 CSV/UI/权限 Human 签收。Item 样本和独立开发者接入仍为完整 CV07 缺口。
原件历史统计 H/G-O（读取 #1390 诊断评论而非本窗口重新取得附件）：11,840 bytes，strict UTF-8 offset2 失败，GBK/GB18030 成功，旧 replacement 第1/5表头重复，原始7唯一列193行39定义，193/193组合主键一致，必填/归一化键/同字典异名/文件内部别名歧义均0，均 ACTIVE。无父级列；线上现有数据冲突未知；Human 显式确认冗余主键不单独导入、保留 staged cells。

## 2. 上一阶段工程闭环：本窗口实际读取的原始证据
| 标题 / 原始网址 | 等级、定位 | 关键发现及用途 |
|---|---|---|
| [#1391 固定入口](https://github.com/jiangxng/EVO-App-Platform/blob/753175f738c807a404b5148ccb8bd6186fee83a0/docs/plans/foundation-list-experience/CV07-WINDOW-20261126-CSV-HUMAN-FEEDBACK-HANDOFF-ENTRY.md)、[详细索引](https://github.com/jiangxng/EVO-App-Platform/blob/753175f738c807a404b5148ccb8bd6186fee83a0/docs/plans/foundation-list-experience/CV07-WINDOW-20261126-CSV-HUMAN-FEEDBACK-RESEARCH-DECISION-INDEX.md) | G-O 全文 | 恢复原诊断、修复、发布顺序及未决；文档 deploy pending 为历史。 |
| [#1391 最终上线补录](https://github.com/jiangxng/EVO-App-Platform/pull/1391#issuecomment-7183800209)、[#1390 发布补录](https://github.com/jiangxng/EVO-App-Platform/pull/1390#issuecomment-7183799632)、[真实文件诊断](https://github.com/jiangxng/EVO-App-Platform/pull/1390#issuecomment-7183695213)、[#1389 最终闭环](https://github.com/jiangxng/EVO-App-Platform/pull/1389#issuecomment-7182049313) | G-O 评论原文 | 上线成功取代文档历史 pending，保留真实附件统计与非 Human PASS 边界。 |
| [#1390 Tokyo deploy](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45763262220/job/139718815871)、[巡检](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45763752665/job/139719600350) | G-O 原日志 | 05:46:02–03Z 7741f13c... LOCAL/HTTPS/Auth PASS；05:46:28–29Z 实际镜像、healthy、字典/导入 installed+active、Owner YES、Item 样本 NO、Human NOT_SIGNED。 |
| [#1390 main 协议](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45763229721/job/139717911268)、[功能分支清理](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45763230019/job/139717911827) | G-O 原日志 | 1525/1524 pass/0 fail/1 skip，ok578；05:41:33Z DELETED_VERIFIED_MERGED_PR_BRANCH fix/cv07-csv-upload-encoding-20261126 @ 46b5cb08...。 |
| [#1391 Draft Lightweight](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45763766186/job/139719643273)、[Ready UI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45764067799/job/139720628771) | G-M 步骤/状态；G-O Ready 原日志 | 4/4 后解除 Draft，05:49:28Z self-test PASS、无 UI 变更，合并前 5/5 SUCCESS。 |
| [#1391 merge](https://github.com/jiangxng/EVO-App-Platform/commit/faebe309dbe76f33f12811c77e5516e4cf17b681)、[compare](https://github.com/jiangxng/EVO-App-Platform/compare/7741f13c63bfcfa3f898a0a2f83fab8e3e188f85...faebe309dbe76f33f12811c77e5516e4cf17b681) | G-M PR/commit/tree/compare；G-O 文档回读 | 05:49:38Z 普通 merge，tree 9481b1fd2ccecd29ccfe915953f8519bc8ffa25f 同已验 HEAD 753175f7...；两 docs 新增23+65行，无运行差异；Blob e5ccf7a208a5832f2ea15a6e90fd6dbe464dd5f0、1ed869a2aa3004ae47bed905919c7ec56efe4e48 保持。 |
| [#1391 Branch Hygiene](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45764108229/job/139720756989) | G-O 原日志、G-M 两分支查询 | 05:49:47.8608109Z DELETED_VERIFIED_MERGED_PR_BRANCH docs/cv07-window-20261126-csv-human-feedback-handoff @ 753175f738c807a404b5148ccb8bd6186fee83a0；#1390/#1391 精确分支均为空。 |
| [main Continuity](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45764107609/job/139720755073)、[Lightweight](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45764107550/job/139720755094) | G-M SUCCESS；G-O Lightweight 原日志 | 05:51:57Z 成功，6+411+6 全通过。运行时日志曾404 BlobNotFound，结束后取得，非测试失败。main 4 SUCCESS+1合规SKIPPED。 |
| [docs skip](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45764131865/job/139720835945)、[后验 inventory](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45764157092/job/139720916762) | G-O 原日志 | 05:50:06.1062404Z EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE sha=faebe309...；05:50:20–21Z 实际运行镜像仍7741f13c... healthy，字典/导入 installed+active、Owner YES、Item installed+active但无样本、HTTPS/Auth PASS、AUTHORIZED_BUSINESS_SESSION=UNVERIFIED、HUMAN_ACCEPTANCE=NOT_SIGNED。 |
| [#1391 最终闭环补录](https://github.com/jiangxng/EVO-App-Platform/pull/1391#issuecomment-7183882843) | G-O 本窗口创建并回读 | 上述全部证据集中入库，功能/文档剩余 PR=0、过程分支=0、工程待办=0；非完整 CV07 退出。 |

## 3. 本窗口新反馈及自动编码实现：已读源码和决策
P：截图 image(20261126-094927).png（聊天附件 file_00000000c7f08209b936b9e4de20a442，容器历史路径 /mnt/data/image(20261126-094927).png，不是永久 URL；未上传 GitHub），显示业务字典上传页目标/文件/编码 select，GB18030 与 UTF-8 选项，红箭头指编码字段。未见新版真实界面，回复中的示意不是截图。
| 标题 / 原始网址 | 等级、定位 | 关键发现及具体用途 |
|---|---|---|
| [旧 csv.ts](https://github.com/jiangxng/EVO-App-Platform/blob/faebe309dbe76f33f12811c77e5516e4cf17b681/apps/data-import/csv.ts) | G-O 全文，decodeCsvUploadV010 / parseCsvSourceV010 | 默认 strict UTF-8，显式 GB18030；BOM错选拒绝；唯一 header、记录解析和列号保护保留。 |
| [旧 actions.ts](https://github.com/jiangxng/EVO-App-Platform/blob/faebe309dbe76f33f12811c77e5516e4cf17b681/apps/data-import/actions.ts) | G-O 301–326、465–479 | 通用 sourceFromUploadedFile 接收 csvEncoding、20MiB和大小校验，鉴权/returnTo先行，XLSX独立路径；不需要修改 actions。 |
| [旧 page.ts](https://github.com/jiangxng/EVO-App-Platform/blob/faebe309dbe76f33f12811c77e5516e4cf17b681/apps/data-import/page.ts)、[capability manifest](https://github.com/jiangxng/EVO-App-Platform/blob/faebe309dbe76f33f12811c77e5516e4cf17b681/apps/data-import/capability-manifest.ts) | G-O 478–548、170–180 | 原生 select 默认 UTF-8，schema 两值；同步 UI 和 capability enum，避免用户手选与契约不一致。 |
| [旧字典协议测试](https://github.com/jiangxng/EVO-App-Platform/blob/faebe309dbe76f33f12811c77e5516e4cf17b681/tests/protocol/cv07-business-dictionary-import-eidos.test.mjs)、[旧 Human 导入测试](https://github.com/jiangxng/EVO-App-Platform/blob/faebe309dbe76f33f12811c77e5516e4cf17b681/tests/protocol/data-import-human-experience.test.mjs) | G-O 245–262、207–223、388–605 | 原合成 GB18030 表头、映射、XLSX 与零 Job/零业务写入断言；更新默认行为与实际 stage action 合成测试。 |
| [上一 UI 评审](https://github.com/jiangxng/EVO-App-Platform/blob/faebe309dbe76f33f12811c77e5516e4cf17b681/docs/ui-design-reviews/CV07-CSV-UPLOAD-ENCODING-20261126.md) | G-O 全文 | 原决策明确不自动猜测；被此次用户明确反馈定向替代，仅编码交互改变，历史文档不改写。 |
| [#1392 初始 commit](https://github.com/jiangxng/EVO-App-Platform/commit/6a04285ec2862a357420e13ac9ed89a3e6b1f686)、[新 csv.ts](https://github.com/jiangxng/EVO-App-Platform/blob/6a04285ec2862a357420e13ac9ed89a3e6b1f686/apps/data-import/csv.ts) | G-M compare，G-O 新 decoder 回读；同窗实际创建6文件 | 缺省及 AUTO strict UTF-8 优先，失败 GB18030，BOM权威，UTF16/32 BOM拒绝，显式 override；parse不重试。3业务模块、2测试、1 UI评审，未改 Host/Owner/权限。 |
| [UI gate 源码](https://github.com/jiangxng/EVO-App-Platform/blob/faebe309dbe76f33f12811c77e5516e4cf17b681/tools/ui-design-review-gate.mjs)、[新评审文档](https://github.com/jiangxng/EVO-App-Platform/blob/a0b654a31fac1a967c56c42b38df62973d331fc0/docs/ui-design-reviews/CV07-CSV-AUTO-ENCODING-20261126.md) | G-O gate 全文、初稿回读，本窗修正内容；G-M commit | 八标题+四插件标题+精确源码路径+九独立证据行。初稿错误：同一行合并多项、缺确切路径和异常恢复标签。只补文档，不改门禁，详见 §5。 |
| [Branch Hygiene](https://github.com/jiangxng/EVO-App-Platform/blob/7741f13c63bfcfa3f898a0a2f83fab8e3e188f85/.github/workflows/branch-hygiene.yml)、[Ready UI workflow](https://github.com/jiangxng/EVO-App-Platform/blob/7741f13c63bfcfa3f898a0a2f83fab8e3e188f85/.github/workflows/human-ui-design-review-gate.yml)、[只读巡检](https://github.com/jiangxng/EVO-App-Platform/blob/faebe309dbe76f33f12811c77e5516e4cf17b681/.github/workflows/cv07-tokyo-preview-readiness.yml) | G-O 清理 job/Ready 触发、巡检前90行 | closed merged 自动清理，SHA/祖先/保护/活动引用验证；ready_for_review 新门禁；成功 main release 后自动非写入巡检。复用既有流程。 |

## 4. 方案比较（来源事实 vs 工程判断）
| 来源事实 | 采用方案与理由（判断） | 排除方案、适用条件及限制 |
|---|---|---|
| 原 CSV GBK/GB18030，旧 lossy UTF-8 伪重复；用户明确不要手工选编码 | AUTO 默认，strict UTF-8 优先，只有字节解码失败才 strict GB18030；普通文件直接下一步 | 排除强制手选及 replacement 容忍，不增加第三方探测库。仅支持现有 UTF-8/GB18030 家族，不宣称所有编码或绝对准确。 |
| 无 BOM 的不同编码可同时有效；BOM 提供明确标记 | UTF-8 有效优先（原常规文件兼容），保留手动覆盖；UTF-8 BOM 不降级，UTF16/32 BOM 拒绝 | 排除无法证实的自动猜测/根据映射结果偷偷换编码；不以 parse 错误做 fallback。双重有效文本可能仍需人工校对，非普适编码检测。 |
| 原 Eidos 上传页已有原生 select，用户关注操作负担 | 复用 select，默认“自动识别（推荐）”，说明 Excel 无需设置；手动作为恢复 | 没有采用完全隐藏/新折叠 UI 或额外页面，避免改 Host/Eidos 与复杂度；正常无需触碰选项。此为实现判断，真实界面仍需验。 |
| header-keyed row、实际主键冗余、原文件无父级列 | 保留真正重复拒绝、原始 staged cells、六列映射及 Human 显式排除主键、无父级推断 | 不静默去重、吞列或新建 ID；不将原件本地统计当线上冲突检查。 |
| release 要求 current main，交接仅 docs | 功能发布和巡检先于 docs 合并，docs 独立 Draft 并行保存 | 不在功能部署前推进 docs main，不另造工作流、不重复发布、不绕 CI。 |

## 5. #1392 CI 与最新证据
准确最新 HEAD `a0b654a31fac1a967c56c42b38df62973d331fc0`，基线 `faebe309dbe76f33f12811c77e5516e4cf17b681`，写入前 protected main 未动，PR open/draft/mergeable/clean，未合并。
| 来源 / URL | 等级及结果 |
|---|---|
| [初始 UI failure](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795826578/job/139826079463)、[初始 Continuity failure](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795827126/job/139826082340) | G-O 09:51:21/25Z gate self-test PASS，但同一 UI review artifact 规则失败，非两种业务代码故障。旧 HEAD 最终 G-M 4 success、2 failure、1 cancelled（Lightweight）；新 HEAD 取代旧结果。 |
| [修正文档提交](https://github.com/jiangxng/EVO-App-Platform/commit/a0b654a31fac1a967c56c42b38df62973d331fc0) | G-M 创建返回准确提交；修正路径 apps/data-import/page.ts、功能/布局/颜色/入口/退出/异常恢复/桌面/移动/Human 各自独立行；未修改业务代码、门禁。 |
| [最新 Continuity push](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795990451/job/139826636850)、[PR Continuity](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795998086/job/139826661625)、[safe resume](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795998018/job/139826660780) | G-M 全部 SUCCESS。 |
| [最新 UI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795997833/job/139826660659) | G-O 09:52:26Z self-test PASS，Reviewed with docs/ui-design-reviews/CV07-CSV-AUTO-ENCODING-20261126.md (plugin experience evidence present; not Human PASS)。 |
| [最新 Platform](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795998138/job/139826661399) | G-O 09:53:07Z ok578 GB18030七列、ok579 UTF8 priority/BOM/真实重复、ok629 Human file action XLSX + 合成 GB18030 stage AUTO/缺省映射/零业务写入；09:53:09Z 1526 tests/1525 pass/0 fail/1 skip。 |
| [最新 Chromium](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795998057/job/139826661124) | G-O 09:53:35–09:54:15Z 供应商 desktop/phone、1280/390源一致、XLSX保留、隔离 Host、真实预检回归、footer/reset/nav PASS；非本次真实字典 Human 验收，未下载 artifacts。 |
| [最新 Lightweight](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45795998127/job/139826797641) | G-O 09:52:48Z 6/6、09:54:17Z 411/411、09:54:41Z 6/6，均0 fail/0 skip；G-M SUCCESS。 |
| [#1392 PR](https://github.com/jiangxng/EVO-App-Platform/pull/1392) | G-M 7/7 completed SUCCESS，Draft；U Ready 新 gate、merge、main、清理、部署/巡检、Human。 |

## 6. 冲突、未保存资料、接续边界
- 旧 #1390 评审“不自动猜测”与新 Human 要求“自动判断”冲突：以新明确指令仅替换默认编码交互，采用严格双候选顺序与人工覆盖，不改真实重复保护。历史原件与统计仍有效。
- 初始 HEAD 两项失败 vs 最新 HEAD 7/7 SUCCESS：不同 SHA；最终以最新准确 HEAD 为准，不称旧红灯通过。实际线上仍 7741f13c...，尚未有自动编码部署证据，截图仍旧界面。
- 用户截图未入 GitHub，旧原 CSV 与错误截图未入 GitHub；无新增真实数据、浏览器录屏/截图或下载 artifacts。本窗口未逐行重新核验原件。真实在线预检、映射/冲突、DRAFT与发布、PC/手机及权限待验；最值得查的是现有 CI/部署/只读 inventory 原日志和 Human 实测，不再重复外站研究。
- 模块：apps/data-import/csv.ts/page.ts/capability-manifest.ts；actions.ts 沿用，测试 tests/protocol/cv07-business-dictionary-import-eidos.test.mjs 与 data-import-human-experience.test.mjs；专项评审 CV07-CSV-AUTO-ENCODING-20261126.md；#1392 功能过程分支与独立 docs 过程分支最终均由 Actions 清理。详见[简短入口](CV07-WINDOW-20261126-AUTO-CSV-ENCODING-HANDOFF-ENTRY.md)。

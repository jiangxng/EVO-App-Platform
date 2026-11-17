# CV-02 Window14｜2026-11-17 #04/04 合并后旧窗口恢复与下一窗口交接

> 状态：RECOVERED / MERGED-MAIN-CHECKED / HUMAN_NOT_SIGNED；仅交接与证据索引，不扩大功能、修改生产门禁或宣布整个 List Foundation 关闭。
> 源头：用户在 2026-11-17 新窗口粘贴的 #04/04 旧聊天收口；GitHub Platform/Eidos PR、main 源码与 Actions 原日志；既有 2026-11-06、11-09 研究与文档索引。**未取得完整旧聊天逐字导出/未归档附件**，不得推测 #01/04～#03/04 每一句讨论或用户 Human 签收。
> 本页是 2026-11-17 增量恢复；[目录 README](README.md) 的旧日期内容是历史快照；不要覆盖自动生成的 docs/roadmap/HANDOFF-LATEST.md、project.status.json 或并行 #1184。

## 一、明确要求与已作决定（区分来源）

| 决定或要求 | 证据级别 | 结论与不可扩大边界 |
| --- | --- | --- |
| 用 Eidos + Platform 的既有列表、业务 Owner、权限和 Agent 契约，不造第二套通用表格/筛选/导出框架 | 用户在当前提供的旧聊天明确要求；2026-11-06 ADR | **继续采用组合式契约与 Owner 查询**；拒绝巨型 BaseList 深继承、前端自行过滤、Agent 私有 SQL/WRITE |
| 此轮只做 Counterparty 服务端状态 ACTIVE/INACTIVE 与原 search 的 AND 筛选，先核验 Owner/CSV/Agent READ | 用户明确要求；Platform #1335 代码已合并 | 不延伸到任意字段筛选、所有插件继承或 Saved Views |
| 先 Principal/Enterprise/Responsibility/Field 授权，再状态+关键词过滤、排序、total 和 page | 用户聊天 + Platform main 实际源码 | 无 status 读取授权时拒绝，不能从 total/空结果反推隐藏字段 |
| Human / Agent / 当前页 CSV 使用同一合法查询；URL 白名单、非法条件与撤权拒绝；桌面/390px 浏览器自动化 | 用户聊天 + 已合并测试/Actions | Chromium 自动化不是已登录客户账号或物理手机 Human 验收 |
| 精确 PR HEAD CI 才合并受保护 main；东京实际部署核对；Actions 按精确已合并分支 HEAD 清理 | 用户明确要求 + 原 Actions 原证 | 不直接推 main、不因 CI 绿越过真实生产 Owner 门禁，不误删并行分支 |
| N1=NOT_CERTIFIED、CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF；Owner #1212、Operator #1092 保留 | PR #1335 与现有 UI 评审、Issues | 不改变生产授权、数据库迁移、后台功能或 #1184 并行 Owner 分工 |

## 二、已研究资料和采用 / 放弃理由（**历史索引的复用，不代表本窗口重新浏览网页**）

原始阅读分级及完整 H01–H10 资料见 [2026-11-09 恢复研究索引](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md) 与 [2026-11-06 原研究索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)。以下只保留当前工作线需要的源链接和决定：

| 来源与网址 | 已采纳的启发 | 明确不采纳 / 暂缓 |
| --- | --- | --- |
| EX01 [SharePoint 视图](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-change-or-delete-a-view-of-a-list-or-library) | 记录与视图配置解耦、个人/共享视图分域 | 不照搬 SharePoint 存储或权限；不混淆 2019 与 Microsoft 365 |
| EX02 [SharePoint 2019 限制](https://learn.microsoft.com/en-us/sharepoint/install/software-boundaries-limits-2019) | 服务端分页、筛选、查询预算 | 不将 5000 行阈值硬编码成 EVO 上限 |
| EX03 [Odoo 视图架构](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html) | 模型 / 视图 / 渲染分离 | 不引入 Odoo 的 XML/Python 系统，不自动承诺所有插件 Kanban/Chart |
| EX04 [Power Apps Grid](https://learn.microsoft.com/power-apps/maker/model-driven-apps/the-power-apps-grid-control) | 通用列控制、桌面与响应式密度 | 不复制高级单元格编辑 / 无限滚动 / 全套 Grid API |
| EX05 [SAP Fiori List Report](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html) | 列表→详情→返回的任务动线 | 不重建 Eidos 导航框架 |
| EX06 [明道云视图](https://help.mingdao.com/view/introduction/)；EX07 [应用](https://help.mingdao.com/application/introduction/) | 对象、权限、视图、分析分层 | 不把所有异构业务域收敛成万能表，不任意注入 HTML/JS |
| EX08 [W3C WAI-ARIA Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | 只读原生 table 语义与键盘、焦点正确性优先 | 不因 aria 属性存在就称读屏器/真人验收完成 |

具体内部权威：[Eidos×Platform ADR](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)、[唯一 CV-00～07 计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)、[Foundation List README](README.md)、[2026-11-17 #04/04 八部分 UI 评审](../../ui-design-reviews/CV02-20261117-COUNTERPARTY-OWNER-QUICK-FILTER-REVIEW.md)。

## 三、已完成的代码与工程源证（实查，不用聊天转述冒充 CI）

| 增量 | 代码证据 | 验证证据 / 合并 |
| --- | --- | --- |
| 安全同源路由 | Eidos [#211](https://github.com/jiangxng/eidos/pull/211)；Platform [#1331](https://github.com/jiangxng/EVO-App-Platform/pull/1331) | 均 MERGED；复用 Catalog search/sort/page 的统一 route guard |
| 排序方向可访问语义 | Eidos [#212](https://github.com/jiangxng/eidos/pull/212)；Platform [#1332](https://github.com/jiangxng/EVO-App-Platform/pull/1332) | 均 MERGED；原 th/aria-sort，不替 Owner 排序 |
| 受管列布局：Dictionary→Counterparty | Eidos [#213](https://github.com/jiangxng/eidos/pull/213)；Platform [#1333](https://github.com/jiangxng/EVO-App-Platform/pull/1333)、[#1334](https://github.com/jiangxng/EVO-App-Platform/pull/1334) | 均 MERGED；列白名单、不可隐藏主列/已排序列、当前页 CSV 对齐；不是持久 Saved View |
| Counterparty 服务端状态+搜索 | Eidos [#214](https://github.com/jiangxng/eidos/pull/214) MERGED 于 beef9960f2fa350887fa47500742563426f94a99；Platform [#1335](https://github.com/jiangxng/EVO-App-Platform/pull/1335) MERGED 于 **359114a5f021331bc7cbcd494104887ff0900987** | 四个原客户/供应商/我的客户/我的供应商视图；只读 status Core Schema；Agent/CSV 的 enum 合同；不新建 List 或 DB |

本窗口直接读取当前 Platform main：apps/counterparty/projection-query.ts 实现 status=ACTIVE|INACTIVE 且与 search AND，经过有权投影再筛选；拒绝无 status 字段授权，随后排序和 total/page；apps/counterparty/projection-actions.ts 拒绝伪造 Enterprise Scope（Collection 与 CSV 分别保持不同拒绝错误）。原 PR #1335 精确修改文件清单另见 PR Files changed。

### 精确 HEAD 与真实 Jobs

- PR #1335 最终 HEAD **216272d7eb8cf292e0579a724951803e8d4f2b51**：GitHub Check Runs 8 项实际业务/质量检查 SUCCESS（2 Continuity、UI、Template、Platform、real Chromium、supplier Chromium、lightweight）。原 [Platform protocol Job 133794349952](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44009967118/job/133794349952) 日志显示 **1438 tests / 1437 PASS / 0 FAIL / 1 SKIP**。这里不将另外 6 项非业务清理跳过检查计入失败。
- 原 [真实 Host Chromium Job 133794349116](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44009967119/job/133794349116) 实际含 `CV02_OWNER_COMBINED_FILTER_CHROMIUM_PASS` 四个标记：my-customers / my-suppliers × 1280 / 390，且 `...DESKTOP_PHONE_PASS=4`；实际点击、搜索 Beta、下载 CSV、INACTIVE 空结果和回到 ALL。不是实际客户登录。
- 合并后 main 的 [7 个 GitHub Check Runs](https://github.com/jiangxng/EVO-App-Platform/commit/359114a5f021331bc7cbcd494104887ff0900987/checks) 全为 SUCCESS（其中东京 Preview 两个 Job 属同一 Workflow）；原交接按 **6/6 Workflow** 统计。合并后真实 Chromium [Run 44010289035](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44010289035) 和 Platform [Run 44010289142](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44010289142) SUCCESS。
- 东京 DEV/PREVIEW [Run 44010328709 / deploy Job 133796180499](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44010328709/job/133796180499)：本窗口读取原日志核验了 **ghcr.io/jiangxng/evo-app-platform:359114a5f021331bc7cbcd494104887ff0900987**、容器 healthy、`EVO_TOKYO_DEV_LOCAL_HEALTH_PASS`（带准确 SHA）、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`。这是 DEV 预览及匿名 401，**非生产业务 Owner 授权**。
- [Branch Hygiene Run 44010289899 / Job 133795401525](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44010289899/job/133795401525) 原日志为 `DELETED_VERIFIED_MERGED_PR_BRANCH feat/cv02-owner-status-combined-filter-20261117 @ 216272d7...`；本窗口直接 GET 对应 Platform 与 Eidos #214 的过程分支均返回 404。**无需再次删除**。
- 当前查询时 Platform `main` 仍是上述 359114a5；Eidos `main` 是 beef9960。后续窗口须先重读 refs，不能将此固定 SHA 声称永久最新。

## 四、未完成、不能冒充通过的门禁

| 项目 | 当前可说的状态 | 下一步由谁/何种原证确认 |
| --- | --- | --- |
| CV02 受限状态与关键词 AND | **CODE MERGED + CI/isolated Chromium PASS + Tokyo DEV preview PASS** | 不重复开发 |
| 完整 List Foundation / 更多合法字段条件与异构第三插件复用 | **未认证整体完成** | 依唯一 CV 计划由所属 Domain Owner 逐项扩展并精确验收；此窗口不启动 |
| 真实登录企业用户 Human、真实实体手机、读屏器/键盘人体签署 | **NOT_SIGNED** | 实际账号/设备与 Human 回执；Chromium 1280/390 只是自动回归 |
| Saved Views 正式准入、CV03 Human SAVE | **N1 NOT_CERTIFIED / OFF** | [Owner #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 仍 OPEN；不自动解除 POST 403 / GET 404 |
| CV04 后台跨页正式 EXPORT | **OFF** | 正式 Host/DB/权限/Worker 安全门禁独立签收；不要把当前页 CSV 等同于正式 EXPORT |
| 生产 Operator / PA05 K0 | [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) **OPEN** | 独立生产身份/监督/原始签收，不借当前开发 CI 关单 |
| 旧聊天全文、无存档网页截图与未上传 Human/LLM 日志 | **UNRECOVERED** | 有真实来源时只对缺口定向核查；不可猜测历史逐字内容 |

## 五、下一窗口最小执行顺序（不扩范围）

1. 从当前 main、此交接、PR #1335 最终评论、#04/04 UI 评审开始；刷新 branch HEAD、未合并相关 PR 和 Owner 分工；无需再研究已复用 EX01–EX08 或重做已通过的排序、列管理、组合筛选、当前页 CSV。
2. 下一具体任务只能从已开放的 List Foundation 门禁选择**一个**最小真实 Owner 场景；先列现成契约与缺少的原证，再开 scoped owner PR；不得冒认 CV03 SAVE、CV04 正式 EXPORT 已上线或擅自关闭 #1212/#1092。
3. 按准确 PR HEAD 检查所有触发的 CI；合入受保护 main 后重新核对同 SHA Workflow、东京适用预览与 Actions 原证；沿现有 SHA-safe Branch Hygiene 清理**仅已合并的本轮过程分支**，保护并行 #1184 等工作。

## 来源等级说明

- **CHAT**：用户提供的本窗口旧聊天摘录；**DESIGN**：原 EX/H 系列研究和 UI 评审；**CODE**：GitHub 合并 PR / 当前 main 原码；**CI**：精确 SHA 的 GitHub Check Runs / Job 原日志；**DEPLOY**：东京 DEV/PREVIEW 容器/HTTPS/401；**HUMAN**：真实用户与 Owner 签收（目前未获得）。
- 本次恢复没有在本地重新跑协议/Chromium，也没有操作真实用户账户；引用的是可以逐项复查的原 Workflow 日志和实际 repo 代码。不得把这些不同级别折叠成单一“全部通过”。

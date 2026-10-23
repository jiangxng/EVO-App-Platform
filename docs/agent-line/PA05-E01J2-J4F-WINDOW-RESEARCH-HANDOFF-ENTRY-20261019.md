# PA-05｜E01J2–E01J4F 本窗口研究与决策交接入口（2026-10-19）

**文档类别：HISTORICAL_SNAPSHOT / AGENT_WINDOW_HANDOFF_ENTRY（简短接续入口）。** 仅记录本窗口已发生的事实，不是全局 CURRENT_STATUS。  
**配套详细资料索引：** [PA05-E01J2-J4F-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md](PA05-E01J2-J4F-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md)。  
**认证总账：** [PA05-CERTIFICATION-BASELINE-20261015.md](PA05-CERTIFICATION-BASELINE-20261015.md) §§54–61；**当前 Agent 线入口：** [HANDOFF.md](HANDOFF.md)。  
**上一窗口继承资料：** [E01J1 研究短入口](PA05-E01J-WINDOW-RESEARCH-HANDOFF-ENTRY-20261019.md)、[E01J1 原始来源索引](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md)、[D14C5–D14C12 历史原文索引](PA05-D14C5-D14C12-RESEARCH-REFERENCE-INDEX-20261016.md)。历史官网的“已读原文”不等于本窗口再次阅读。

## 一、接续事实：先核当前仓库

- **仓库：** https://github.com/jiangxng/EVO-App-Platform 。本交接文档分支从 **2026-10-19 核验 main `c2bfc43c6bf0ec2d11ce6697fd83294686190c4d`** 建立；main 会继续前进，**新窗口须重新读取 main、PR 和 CI**。本文档自己的最终合并 PR/SHA 以交付后核验记录为准，不预言未来 SHA。
- **已确证 MERGED：** E01J2 [#1024](https://github.com/jiangxng/EVO-App-Platform/pull/1024)（17/17）、E01J3 [#1026](https://github.com/jiangxng/EVO-App-Platform/pull/1026)（18/18）、E01J4A [#1029](https://github.com/jiangxng/EVO-App-Platform/pull/1029)（19/19）、J4B [#1031](https://github.com/jiangxng/EVO-App-Platform/pull/1031)（20/20）、J4C [#1036](https://github.com/jiangxng/EVO-App-Platform/pull/1036)（21/21）、J4D [#1040](https://github.com/jiangxng/EVO-App-Platform/pull/1040)（22/22）、J4E [#1042](https://github.com/jiangxng/EVO-App-Platform/pull/1042)（23/23）、J4F [#1044](https://github.com/jiangxng/EVO-App-Platform/pull/1044)（24/24）。这些是 **各自准确工程 HEAD 的真实三 PostgreSQL18 隔离测试、0 skipped**，不是全阶段/生产签收。各条完整 SHA、Actions、失败修正证据见详细索引。
- **最近工程合并：** [#1044](https://github.com/jiangxng/EVO-App-Platform/pull/1044) merge `9264e215496ab088b45a363453fe63bc9a5aae58`；对应证据归档 [#1045](https://github.com/jiangxng/EVO-App-Platform/pull/1045) merge `ec465d402c566513e15239077037f804cda7c8bd`。E01J4F 工程与归档原分支合并后均核验为不存在。
- **未关闭：** [#988](https://github.com/jiangxng/EVO-App-Platform/issues/988)、[#979](https://github.com/jiangxng/EVO-App-Platform/issues/979)、[#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) **OPEN**；PA05-05 **E01–E05 NOT_SIGNED**；PA-05/W06 **IN_PROGRESS / NOT_SIGNED**；Production material WRITE **OFF**。没有本线 Railway 部署授权/执行。
- **并行边界：** 本聊天只在 PA05 源码、测试、CI 与 `docs/agent-line/` 迭代；未修改 BEX/CP03/Eidos/2D，未触碰 `project.status.json`、自动生成 `docs/roadmap/HANDOFF-LATEST.md`。其当前 TR-01 主线快照不是 PA-05 认证状态，不得覆盖。

## 二、用户明确要求与已确认决定

坚持“**继续、保留详细里程碑表、避免需求偏移或扩展**”；不重做 E01A–J1、不重新搜索已经查阅的来源、不将 1 个测试标记或 PR 合并当作真实生产签收。每一独立闭环必须从最新 main、一个活动短分支/PR、实际 GitHub CI 精确 HEAD、合并与安全分支退役；并行窗口动了 main 时保留其他 owner 文件，不能直接推 main。**所有生产 Host 功能默认 OFF，E01D 管理员/Provider 门禁和 E01I 恢复状态启动隔离不得放宽**。投产和真实数据/密钥另需授权。

本轮证实并选择的逐级方案：SQL 认证 READ Handler → 真实 TCP 故障与撤权 → 多 Worker 的中央逐 Host 复认证 → SQL 先撤权/本地 JSON 后修改的可恢复过程 → Host 内部适配器 → 实际 HTTP/Action Host 路由 → DBA 函数 EXECUTE-only 最小权限 → **Host 无法启动时，外部受控、只允许已 FENCED UNINSTALL 的启动前恢复**。此序列不等于解决生产 SQL+JSON 分布式 ACID 原子事务。

## 三、固定里程碑状态

| 里程碑 | 当前结论 | 核验证据 |
| --- | --- | --- |
| E01A–J1 | 前窗口既定工程已完成；不重做 | 旧原始索引与认证基线 §53 |
| E01J2 | ENGINEERING_BOUNDED_PASS | #1024 / 17/17；SQL Host 身份、原 Purchase Attention/Trading Reference Handler |
| E01J3 | ENGINEERING_BOUNDED_PASS | #1026 / 18/18；真实 TCP 切断，原进程优雅恢复 **未签收** |
| E01J4A | ENGINEERING_BOUNDED_PASS | #1029 / 19/19；独立 Worker 状态文件、逐 Host 重认证 |
| E01J4B | ENGINEERING_BOUNDED_PASS | #1031 / 20/20；撤权先行、三次 SIGKILL、幂等 SQL 修复 |
| E01J4C | ENGINEERING_BOUNDED_PASS | #1036 / 21/21；默认不启用的 Host 内部适配器 |
| E01J4D | ENGINEERING_BOUNDED_PASS | #1040 / 22/22；真实 Host HTTP/Action 停用/卸载路由 |
| E01J4E | ENGINEERING_BOUNDED_PASS | #1042 / 23/23；PostgreSQL `session_user`、DBA SECURITY DEFINER 函数、仅 EXECUTE |
| E01J4F | ENGINEERING_BOUNDED_PASS | #1044 / 24/24；E01I 真实拒绝启动→受控 UNINSTALL→可重新启动但 READ 仍撤权 |
| **完整 E01J4** | **OPEN / NOT_SIGNED** | 生产可信操作员/凭据、自动恢复、跨 Worker 与跨存储一致性 |
| **PA05-05 E01–E05 / W06** | **NOT_SIGNED / IN_PROGRESS** | 企业实际数据、Human/Agent/Provider/浏览器/签署未具备 |
| **Production material WRITE** | **OFF** | 不部署、不放宽 |

## 四、新窗口下一步，只做一条既定缺口

**先重新验证 main、PR、总账 §61 和源文件，再选 E01J4 的下一最小真实安全门禁。** 首要是生产可信操作员身份与凭据/DBA 配置的**能力契约与安全证据**，以及 E01J4F 未交付的可正式操作/审计的启动前修复；与 E01I 隔离、E01J4E SQL 函数权限及 E01J4F 测试样机对齐。**不要**把 CI 测试里的环境变量模拟操作员视为 Human 身份，不要仅凭 SQL rollback 宣称 JSON 事务原子，不要把 postgres.js TCP 崩溃当成已解决，不要上线 Railway。做下一 PR 前先确认别的窗口是否已经完成同一缺口；无生产授权仅做隔离证据和默认 OFF 能力。

**窗口研究边界：** 本窗口实际读取的远程资料主要是 GitHub 仓库原文、PR 状态和 Actions 原始 job 日志；没有本窗口新打开的 PostgreSQL 官网网页或搜索摘要。官网 2026-10-16 已读原文章节严格注明“历史继承”，外部生产系统/截图未访问。详细地址、查阅日期、证据分级、失败日志、冲突与继续方向在配套详细索引。

**接续指令：** 新窗口先读 `AI-BOOTSTRAP.md → project.status.json → 其 handoff → LLM.md → llm.foundation-map.json → 开发交付规则`，然后本入口及详细索引、认证总账 §§54–61。只从核验后的最新 main 建新短分支；不得恢复已删工程分支。

# 企业业务应用通用体验框架与基础对象实施计划

日期：2026-10-12（香港）  
状态：**待评审实施计划；不是已实现能力，也不改变主线排期。**

## 2026-11-12 CV-04 Host/Worker 物理 SQL 独立身份及一次性租约（隔离验证）

[以现有 PostgreSQL 加密 Job 为基础的 Host SQL 许可签发、独立 Worker SQL 领取、epoch=1→2 有界租约、重放与撤权拒绝](CV04-SQL-HOST-WORKER-LEASE-20261112.md)：真实物理 SQL 登录和测试级租约 fence，与 Owner 的实际资源写入身份不等同；未完成生产签名 SQL Owner admission、后台清理、真实账号验收，仍不注册 EXPORT 产品入口。CV03 N1 SAVE OFF 不变。

## 2026-11-12 CV-04 Dictionary 独立 EXPORT Host Capability 受控装载（不进入正式 Host）

[独立 `dictionary.export` 能力描述符及现有 Manager/Capability Fabric/ActionRouter/真实 Dictionary Owner Human/Agent 拒绝和授权回归](CV04-DICTIONARY-EXPORT-HOST-CAPABILITY-20261112.md)：动态能力目录、授权、撤权与 Feature 停用均在隔离测试装载；**没有正式 Host 注册、没有 Eidos 或 Agent 真实下载入口**。只有 SQL 签名准入、审计、KMS 与真实会话通过后才能发布；生产 SAVE OFF 不变。

## 2026-11-12 CV-04 PostgreSQL 原子不可变审计与 SQL 角色隔离（隔离证明）

[Dictionary Export PG 原子审计触发器、独立 append-only 元数据表及真实低权限 SQL login 拒绝测试](CV04-PG-IMMUTABLE-EXPORT-AUDIT-20261112.md)：复用原 PG Enterprise Resource CAS，与任务 revision 在一个事务提交，不额外造业务 Store。审计触发器无法抵御 DB owner/superuser，实际 Host EXPORT Capability、生产 SQL gateway、数据加密密钥和多主机认证**尚未开放或完成**；保留 CV-03 N1 SAVE OFF。

## 2026-11-12 CV-04 真实隔离 PostgreSQL 加密导出任务 CAS（尚未注册 Host）

[Dictionary Owner 的异步 PG CAS + AES-GCM 私有快照/CSV + 元数据审计防篡改纵切与真实数据库 CI](CV04-ENCRYPTED-POSTGRES-EXPORT-JOB-20261112.md)：复用 CV-03 已有 PG 资源合同及同一 Dictionary Owner 状态机，不另造 Store/框架。**仅隔离测试 schema 与 test-only 加密适配器**，不可用作生产 SQL 准入、跨物理 Host/真实 OIDC 认证或独立导出 Capability 已上线的证据；N1 SAVE OFF。

## 2026-11-12 CV-04 Dictionary Owner 持久任务纵切（未注册生产接口）

[独立 `dictionary.export` 授权、持久 CAS Job/审计、幂等/TTL/租约恢复、取文件再授权的隔离工程验收](CV04-DICTIONARY-EXPORT-JOB-OWNER-20261112.md)：**已经有领域 Owner 服务和测试代码**，但无真实 Host 公开操作/产品入口；文件 CAS 不具备跨物理 Host 证明。必须补共享 Postgres / PA05 签收、持久加密与真实 Actor/企业/Agent 的端到端动作，才考虑正式部署。CV03 SAVE 仍 OFF。

## 2026-11-12 CV-04 有界跨页 EXPORT 安全合同（尚未开放产品导出）

[受独立 EXPORT 授权/固定快照/审计回执/行数、页数、字节和时间预算约束的跨页 CSV 合同](CV04-BOUNDED-EXPORT-CONTRACT-20261112.md)：复用原 `foundation/collection-query` 和当前页 CSV 安全序列化，新增真实代码与协议反例测试，但**未注册 ActionHost Operation、UI 下载按钮或持久 Job**；缺真实 Owner `dictionary.export` 策略与持久审计时对线上不可用。不能用此合同 CI 成功宣布 List 基础插件或跨页导出已上线。

## 2026-11-12 CV-04 Request-Bound 双 Human Principal 与真实 Governance 撤权

[真实 Host 请求身份、企业邀请/接受/撤权、已建立 Human/AI 会话导出拒绝与证据分层](CV04-REQUEST-BOUND-PRINCIPAL-REVOKE-20261112.md)：复用原 Bearer Session、Enterprise Governance Store/关系 Action、字典 Owner 和 ActionRouter，在两个不同 Human Subject 与 MEMBER AI 下运行隔离测试。它优于单一静态用户 A/B 切换，但仍不是东京 Google 登录、真实 PA05 PostgreSQL T0、外部 LLM 或物理手机验收；独立 EXPORT/跨页异步任务还需后续工程。生产 N1/SAVE 禁用不变。

## 2026-11-12 CV-04 后续真实 Host 双企业/Agent 导出自动验收（更新入口）

**[隔离真实 Host + Eidos + Chromium A→B→A CSV 12 次下载、Agent 工具 3/3 与插件停用拒绝的完整工程/主线证据](CV04-TWO-ENTERPRISE-AGENT-OWNER-CSV-ACCEPTANCE-20261112.md)**。工程 [#1266](https://github.com/jiangxng/EVO-App-Platform/pull/1266) 已合受保护 `main@ff569b2d7c930fa90e61ec28a07421057a4601aa`，主线 Chromium/Protocol/Continuity/Lightweight Host 成功，Branch Hygiene 已删除过程分支。**本验收仍是测试 Local Experience 静态身份，不是东京已登录真人、真实 PA05 授权撤回、外部 LLM 或物理手机签收**；独立 EXPORT 权限、跨页后台任务和整个 List 基础插件仍未完成。生产 N1 SAVE OFF。

## 2026-11-12 CV-04 最新长窗口恢复（本轮优先入口）

**[简短恢复交接入口](CV04-WINDOW-20261112-CONTEXT-RECOVERY-HANDOFF-ENTRY.md)** → **[详细研究资料、历史原始网址/阅读等级、采用与放弃方案、PR/Actions/真实体验证据分层](CV04-WINDOW-20261112-RESEARCH-DECISION-REFERENCE-INDEX.md)**。本轮核验的基线 `main@fd357d988df99602545655a457fe3d79a9b412e2`，#1263/#1264 MERGED，Dictionary/我的客户/我的供应商实际隔离 Host + 1280/390px Chromium CSV 6/6 自动验收。**这不是东京真实登录员工、物理手机或自然语言 Personal Agent 的 Human 签收**。CV-04 尚未做独立 EXPORT 权限/审计/预算的安全跨页 Job；CV-03 生产 SAVE 继续 `N1=NOT_CERTIFIED` / OFF / POST 403 / GET 404。该条是增量现状链接，不能覆盖下方历史各窗口本来日期的判断或并行 #1184 受管原计划。

## 2026-11-10 七轮窗口交接：研究资料与决策遗产（优先阅读）

**[简短窗口接续入口](CV03-N104D-WINDOW07-RESEARCH-HANDOFF-ENTRY-20261110.md)** → **[详细网络原始来源/阅读等级/方案取舍/源码与 CI 证据索引](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md)**。保留 EX01–EX08、H01–H10、N1-01～N1-04d 的最终验收边界，标注本次访问失败的官方文档和未保存的截图/附件；列出 N1-04e 最优先协议不一致与生产安全 Owner 门禁。正式 Saved View WRITE 仍 OFF；不覆盖并行 #1184 的权威计划。

## 2026-11-10 CV-03 N1-04d 真实 PA05 Manager 决策与隔离签名事件 / ACK 恢复

[N1-04d 真实 Capability Operation/AuthorizationProvider/Host Issuer → 试验性 PostgreSQL 签名事件、持久 outbox 与 ACK 重放](CV03-N104D-REAL-PA05-MANAGER-OUTBOX-ISOLATED-HANDOFF-20261110.md)：验证 Manager 实际安装/停用、撤权、切企业和 Human/AI 授权差异，**仍非真实生产事件源**。已发现实际 Domain Owner 使用的 Hash namespace 与试验性 SQL Gateway 不一致，数据库镜像也尚未按 actorType 独立授权。N1=NOT_CERTIFIED，正式 WRITE 仍 OFF。

## 2026-11-10 CV-03 N1-04c 已认证的隔离授权事件与短租约

[N1-04c PostgreSQL 签名事件入口、Human/Agent 授权镜像租约与断链拒绝](CV03-N104C-AUTHENTICATED-EVENT-LEASE-ISOLATED-HANDOFF-20261110.md)：在原 N1-04b epoch 镜像上加入受控的 SQL HMAC 验签事件投递与 DB clock 90 秒候选租约；模拟失联会拒绝受控写入和读取。**模拟来源不是真实 PA05；N1 仍 NOT_CERTIFIED，Saved View WRITE 继续 OFF。**

## 2026-11-10 CV-03 N1-04b 双企业只读隔离与撤权 epoch 顺序栅栏

[N1-04b 原 Provider SQL 登录绑定 get/list/receipt、隔离授权事件 epoch 防乱序](CV03-N104B-TENANT-SCOPED-SQL-READ-AUTHORITY-EPOCH-20261110.md)：独立 PostgreSQL 登录不允许跨企业/跨主体读取其他人的资源或回执；测试专用授权镜像只能按 epoch 顺序推进，缺事件即失败关闭。**尚未接入真实 PA05/Host 身份或事件源，N1=NOT_CERTIFIED、Saved View WRITE=OFF。**

## 2026-11-10 CV-03 N1-04a 隔离 SQL 签名时效与撤权物理门禁

[SQL Gateway 过期 permit、撤权竞态与不降级回归](CV03-N104-SQL-PERMIT-REVOCATION-ISOLATED-GATE-20261110.md)：在 N1-03 既有受控 SQL Provider 上，新增 PostgreSQL wall-clock 有效期、数据库物理撤权镜像 FOR SHARE 锁、Personal namespace 主体严格绑定、无 Gateway 函数时拒绝写入。**仅测试镜像；并非已接通 PA05 实时撤权；N1 生产准入和 Saved View WRITE 仍未开启。**

## 2026-11-10 CV-03 N1-03 显式 SQL-only Provider + 多 Worker / 丢 ACK

**[N1-03 实现、真实 PostgreSQL 18 回归、独立进程及正式准入门禁](CV03-N103-EXPLICIT-SQL-GATEWAY-PROVIDER-ISOLATED-HANDOFF-20261110.md)**。在原 Enterprise Resource Provider 中显式增加仅隔离 `SQL_GATEWAY_ISOLATED_V010`，不能回退 SQL 直写；真实 Host 仍未绑定，生产 Saved View WRITE 保持 OFF，正式数据库/签名人未验收。

## 2026-11-10 CV-03 N1-02 隔离 PG 强制签名写入纵切

[隔离 PostgreSQL 18 SQL 签名 Gateway 设计、测试与下一门禁](CV03-N102-SIGNED-SQL-GATEWAY-ISOLATED-PROOF-20261110.md)：继 N1-01 发现「普通 SQL 可绕过 Host」后，本次在独立不可登录数据库 Owner + 最小权限 runtime 下，试验由 PostgreSQL 自己验证 Host 的 HMAC/Digest、CAS 与回执同事务。**只是隔离证明，原回执摘要互操作、生产角色/密钥/迁移及正式 Feature 仍待验；Saved View WRITE 继续 OFF。**

## 2026-11-10 CV-03 N1 PostgreSQL 物理 SQL 准入负向验证

[最新 N1 PostgreSQL SQL Principal/签名强制边界审计](CV03-N1-POSTGRES-PHYSICAL-SQL-ADMISSION-NEGATIVE-PROOF-20261110.md)：发现普通 runtime 最小 DML 仍可绕开 Node-only HMAC 直接写入资源/新回执；新增 **只读 SQL 角色审计器**及隔离 PG18 的可执行拒绝/绕行负向证据。**NOT_CERTIFIED / WRITE 继续 OFF**，不修改生产库。该工程包不会覆盖 #1184 的 CV 计划。

## 2026-11-10 旧长聊天恢复与 GitHub 当前证据核对

**[增量恢复审计：明确需求、已研究网址与取舍、代码/CI/人验分层、生产门禁及 N1～N5](CV03-C302-LONGCHAT-RECOVERY-AUDIT-20261110.md)**。按 `main@14464232` 核对，复用 2026-11-06 与 11-09 研究索引；不重做竞品调研、不覆盖并行 #1184，真实 Host Saved View WRITE 仍默认关闭。本文仅文档与导航，不代表生产上线。

## 2026-11-09 CV-03 / C3-02 七次续跑最新工程交接（优先阅读）

**新入口：[C3-02 真实 PG、Host 签名、Eidos Human/HTTP 及正式生产门禁最终交接](CV03-C302-WINDOW07-FINAL-HANDOFF-20261109.md)**。截至 Platform `main` `8095f8c0709af58f661d3ed4d0ee1c1f67ed7cea`，#1180～#1191 中相关工程 PR 已按最终 CI 实证合并；最新 #1191 **45/45 PASS**，明确要求正式 Host WRITE/未注册 Human Page 仍保持拒绝。隔离 PG18/Human HTTP 正例 **10/10 PASS** 不代表生产上线。下方的旧窗口恢复、2026-11-06 计划与 2026-10-12 进展为历史快照，**不是本时点生产可用状态**。

下一窗口先核验真实 PostgreSQL 物理 SQL 权限、Host signer/verifier 密钥、PA05 Feature 与真实身份，再在现有 Eidos/Platform 中注册可用 Human 保存页和 Agent Write；最后补桌面/390px Human 签收。不得重复造第二套列表框架，也不得直接解除 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF` 的拒绝门禁。

## 2026-11-09 旧窗口恢复入口（本次更新）

本阶段保留了原有 CV-00～CV-07 单一计划、2026-11-06 原始研究来源与架构决策，补充了**明确要求、采用/放弃方案理由、PR/源码/CI/Human 不同证据等级以及 CV-03 条件写入门禁**的可追溯专项交接：

- [CV 旧窗口恢复与专项交接入口](CV-20261109-RECOVERY-HANDOFF-ENTRY.md)：先读此文件；含当前准确 main、已合并交付、未完成事项和下一窗口实施顺序。
- [CV 历史研究网址/取舍/源码证据交叉索引](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)：完整链接复用历史 EX01～EX08、H01～H10，不重复做竞品研究。
- [CV-03 保存视图原子存储与 Agent WRITE 门禁](CV03-SAVED-VIEW-STORAGE-AND-AGENT-WRITE-DECISION-20261109.md)：**保存视图尚未开发完成**；先证明 Provider 跨实例条件写入。

**截至 Platform main `d5eb20f1b7ef4a682855e857cc33681b56e40d82`：** #1169、#1170、#1172、#1173、#1175 均已合并；CV-02 仍缺真实用户/LLM/390px/Human，CV-03 为 PLANNED。下方 2026-11-06 与更早段落是其**当时的历史进度快照**，不能覆盖最新的[唯一 CV 八步状态表](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)。

## 2026-11-06 近期执行入口：Collection / 多视图 / Personal Agent（新增）

**方向已确认；CV-01 的 Dictionary + Counterparty 两个 owner READ 工程变更已合 main（#1163/#1165），真实 Agent 与 Human 验收未签；CV-02～CV-07 尚未开始实施。** 在已有 Eidos + EVO App Platform 能力上增量建设数据集合与多视图，**不创建第二套框架**；Personal Agent 通过受管 Capability Operations 执行有权 READ/PLAN，并通过 Host 现有治理渠道进行必要的 WRITE、回执和恢复。

1. [Eidos × Platform 数据集合与多视图架构设计](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)：职责边界、方案取舍、Agent/AI 原生权限与恢复、数据源/视图/渲染/动作划分。
2. [近期八步可验收工作计划（CV-00～CV-07）](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)：每步 owner、最小真实功能、自动测试、Agent/桌面/手机 Human 验收、CI、回滚。
3. [原始参考资料、历史研究与源码证据索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)：SharePoint 2019、Odoo、Power Apps、SAP、明道云、WAI-ARIA 及 EVO 内部研究与当前代码定位。

原有 2026-10-12 方案和 2026-10-30 Foundation 任务继续保留，不以本次计划文档合并标记业务功能完成。

## 建议采用的产品结构

统一“列表工作页 + 对象详情页 + 导入工作区”，列表支持紧凑列表和数据表格两种呈现。基础对象插件拥有业务语义；Eidos 提供共用页面布局与控件；LLM 在确定位置提供快捷辅助。高级分析通过“跳转独立页面”和“向受控插槽贡献页面部件”两条路径接入。

不要为每个对象重新开发一套列表，也不要把企业主数据管理变成一个万能表格插件。

## 阅读入口

1. [企业业务应用通用体验框架](BUSINESS-EXPERIENCE-FRAMEWORK.md)：基础对象、销售、采购、出库、调拨、报销、请假等页面模式与完整手机体验。
2. [完整建设与验收计划](PLAN.md)：页面布局、操作、AI、契约、权限、BI、开发批次。
3. [研究资料与代码证据](REFERENCES.md)：原始来源、查阅状态、结论适用范围、当前实现路径。
4. **[BEX-01 界面研究与治理交接入口](BEX-01-UI-RESEARCH-HANDOFF-ENTRY-20261015.md)**（2026-10-15，设计研究尚未验收）：衔接历史导入流程、Eidos 导航/颜色权威、视觉和认知研究。完整来源链接、已读/摘要状态及方案比较见 [详细参考索引](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)；不是正在运行的页面。
5. **[BEX-01 E4 / V3 旧窗口恢复与最新证据（2026-10-16）](BEX-01-E4-V3-RECOVERY-AND-EVIDENCE-20261016.md)**：从 #909 历史研究/原型恢复决策，核验 Eidos E1–E3、Platform #964/#966 和当前并行主线，明确剩余视觉及受权真实数据验收。**此页比 10 月 15 日交接快照更新，不替代原始研究索引。**
6. **[BEX-01 E4-01 真实 Host 与 V3 截图证据对照（2026-10-16）](BEX-01-E4-01-V3-TO-REAL-MAP-EVIDENCE-20261016.md)**：已取回原型与隔离 Host 的 Actions 截图，记录已验证的视觉差异和待获取的用户实际页面完整截图；不是用户正式视觉签收。
7. **[BEX-01 E4-02 线上部署与剩余签收门槛（2026-10-16）](BEX-01-E4-02-ONLINE-VERIFICATION-20261016.md)**：#973 的 Eidos/Platform 分工、隔离浏览器测试及 Railway 部署已核验；保留实际用户视觉签收与原客户 Excel 验证待办。
8. **[BEX-01 V3 最新窗口接续入口（2026-10-19）](BEX-01-V3-WINDOW-HANDOFF-ENTRY-20261019.md)**：#984/#989/#991/#993/#996 已实现范围、#999 草稿并行 PR、客户真数据/视觉签收仍缺；详细来源阅读状态、原始网址、取舍、截图与未保存资产见 [2026-10-19 详细参考索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)。**本条状态较上面 10-16 的历史快照更新。**
9. **[基础对象建模、字典与组织人员插件开发任务（2026-10-30）](FOUNDATION-MODELING-REFERENCE-IMPORT-TASKS-20261030.md)**：明确“字典→组织人员→基础对象建模→基础对象导入”的依赖、插件归属、任务编号与逐项验收；为新增计划，不表示功能已交付。
10. **[字典→组织人员→建模→导入：固定六步里程碑（2026-10-30）](FOUNDATION-SIX-MILESTONE-EXECUTION-20261030.md)**：本工作线唯一六步状态表、复用差距和准确开发/CI/Human 状态；字典只读契约不代表插件已交付。


## 已核对的基础

基线：`jiangxng/EVO-App-Platform` main `ccb5820b99d854e1e78f6c35bfb77e01e7d084f1`，2026-10-12。

已有往来对象、物料、仓库插件；已有有效字段 Schema、对象扩展、导入映射与 Recipe、职责投影和个人工作台组合。导入页面已有 AI 自动匹配操作，不应重复建设。

当前 `catalog-browser` 的 `grid` 是**卡片网格**，不是支持列定义、服务端分页和单元格编辑的数据表格。本次审阅路径未证实完整的通用数据表格或 BI 页内插槽已经实现，计划按新增能力处理。

## 本轮建议的优先级

- **第一批**：往来对象列表布局、真正的数据表格、搜索筛选、导入及已有 AI 匹配体验闭环；同时预留布局扩展区域和类型契约。
- **第二批**：复用到物料/仓库，保存视图、有限批量操作、自然语言筛选建议。
- **第三批**：一个真实分析插件，先实现分析链接，再证明一个只读页内部件；不预建完整 BI 平台。
- **以后**：高级透视、自由仪表盘、复杂表格编辑，根据实际业务证据排期。

首个最小验收：用户从“供应商”视图导入文件，AI 提议匹配，校验和确认后导入，返回保留筛选的列表，打开对象详情；同结构再次导入复用 Recipe，无需再次调用 LLM。

## 本轮交付范围

本目录现含四份计划文档。新增通用框架补足原列表计划对单据、执行、申请审批及手机任务的覆盖；这是设计范围扩展，不是业务功能已完成。未改业务代码、协议、全局状态、部署或其他开发线。所有新契约名称均为候选，不可当作现有 API 调用。

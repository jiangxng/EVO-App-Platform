# CV-03 / N1-04e～04l｜新窗口简短研究与决策交接入口

> **归档编制：2026-11-11；工程窗口日期：2026-11-10。** 原始工程收口 `main@560af7b5227194fb384d02de8fcd8396178a11b3`（PR #1209 已合并，安全分支清理已核验）。此文件基于该 `main` 的独立文档分支 `docs/cv03-n104l-window07-research-handoff-20261111` 编制；**文档 PR 合并后新窗口必须重新 fetch 最新 main**，不得继续已清理的过程分支。
>
> **详细来源表（官方网址/查阅日期/证据等级/事实与推论/冲突/章节/实施位置）**：[本次详细参考索引](CV03-N104L-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261111.md)。**生产 N1 仍为 NOT_CERTIFIED；`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`，正式 SAVE POST 403，未注册页面 GET 404。**

## 1. 用户明确目标与约束（不是“模型推测”）

- 沿用现有 **Eidos + EVO App Platform + PA05 + Domain Owner/AuthorizationProvider**，为数据字典、客户/供应商、后续业务列表抽象可复用的集合查询、列/搜索/筛选/排序/分页、个人/共享视图、表格/看板/图表与合法详情返回。**不要另起框架、万能 BaseList、万能业务表**，导入、权限和已建功能必须复用。
- Human 与 Personal Agent 访问**同一真实业务事实与字段权限**，通过实际有效的 Capability Operation/Host ActionRouter；AI 不直接写数据库。WRITE 要可信签名、授权、持久回执、幂等、撤权与失败恢复。
- 以 Eidos/V3 的功能/布局/颜色/导航为准；桌面、390px、键盘/焦点、实际 Human 登录与外部 LLM 回归单独验收，不能由纯代码或 CI 门禁替代。
- **持续实际开发，不止汇报**；独立分支/Draft PR、真实 PG18/Host/Platform CI 全绿后合并 main，使用 Branch Hygiene Actions 清理过程分支；不得直接 push main，不动其他窗口的文件。
- 当前交接要求：保留**已查阅网页的原网址、日期、层级、所读章节、相互冲突、方案采用/排除、易失资料与缺失附件**；简短入口与详细索引分开入库；禁止补造未访问原文、截图、生产验收。

## 2. 已确认架构决定

| 决定 | 适用边界/理由 |
| --- | --- |
| **业务事实由各 Domain Owner 持有，Eidos 做公共呈现，Platform/PA05 做受管发现与授权** | 避免把字典、往来、采购及财务对象挪进另一个通用数据库；沿用已有 Collection Query 与 Feature/Capability。 |
| **先个人 Saved View，企业共享视图另审** | Personal view 的企业、ownerSubject、ActorType 权限不能天然推广成共享视图；C3-03 仍需角色授权。 |
| **Human/Agent 共享受管业务操作，不共享未经认证的权限结果** | ActorType、subject、enterprise、epoch 独立；Feature 停用、切企业、撤权后必须拒绝。 |
| **数据库物理阻断 unsigned DML、正式权威与 outbox 必须同事务或经明确签收的等效失败关闭协议** | Node-only HMAC 可被 SQL 直接 DML 绕过；N1-04f/h 的 PG18 authority/outbox 为隔离试验，不是实际生产 PA05 事务。 |
| **正式 WRITE、未注册 Human 页面、生产部署全部继续关闭** | 缺生产 Primary/GRANT/KMS/Producer workload identity、真正 AuthorizationProvider 权威、全 Scope 恢复、Human/LLM 签收；不能依测试开关提升 READY。 |

## 3. 本工程窗口已合并 main 的交付（截至 PR #1209）

| 工程 PR / 合并 SHA | 实际修复与证据级别 |
| --- | --- |
| [#1202 N1-04e](https://github.com/jiangxng/EVO-App-Platform/pull/1202) · `cf5d1bf0909d89aad4fdd559af9f54f02fbcab02` | Domain Owner 实际 namespace hash 与 Actor-aware SQL WRITE 对齐，隔离 PG18 回归；**生产授权仍未认证**。 |
| [#1203 N1-04f](https://github.com/jiangxng/EVO-App-Platform/pull/1203) · `765aaf9344ac51a3c525533c16e61c104658ccb6` | 隔离 Actor READ + T0 SQL 原子测试 authority/outbox + T3 签名快照；[PG18 22/22](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42757377407)。 |
| [#1204 N1-04g](https://github.com/jiangxng/EVO-App-Platform/pull/1204) · `5c6e4868317b1d829c6e63ca2ab3812570c25251` | 事件须来自已提交**测试** authority/outbox；旧 ALLOW 不续租；[PG18 22/22](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42758775199)。 |
| [#1205 N1-04h](https://github.com/jiangxng/EVO-App-Platform/pull/1205) · `62a32723e177ff67464d7b83d7ff703e5777c7aa` | 隔离 SQL Producer 登录/generation fencing、原子 deny tombstones；[PG18 22/22](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42760537334)。 |
| [#1206 N1-04i](https://github.com/jiangxng/EVO-App-Platform/pull/1206) · `d9ad5dd2b669a656eb0b7d9b1f4c07fadac306c5` | **真实** PA05 FileLifecycleStore 候选先持久化再发布，写失败不污染当前内存；重启 PA05 DENY 但离线 SQL mirror 可仍旧 ALLOW；[PG18 23/23](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42762094767)。 |
| [#1207 N1-04j](https://github.com/jiangxng/EVO-App-Platform/pull/1207) · `104c1faf82e3ee80a9e27ef00d9e37d54f465ba3` | **真实 Host** 在 HTTP 前拒绝恢复未经认证的活跃 Saved View Feature，不影响正常基础 Feature；[PG18/Host 28/28](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42763429048)。 |
| [#1208 N1-04k](https://github.com/jiangxng/EVO-App-Platform/pull/1208) · `e53c27d4f04665c20ffdec1cac571fa60c5997a6` | **真实** FileLifecycleStore 协作写锁、旧写者拒绝、随机 nofollow 临时文件/fsync；[PG18/跨进程 33/33](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42765285750)。 |
| [#1209 N1-04l](https://github.com/jiangxng/EVO-App-Platform/pull/1209) · `560af7b5227194fb384d02de8fcd8396178a11b3` | **真实** FileLifecycleStore 读前版本核验；另一进程撤权后旧 Manager 直接 READ 不能保留 ALLOW；[PG18/Manager 38/38](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42767415315)。**N1-05a～f 生产验收决策已记录，未签收**。 |

对应重点模块：`manager/store.ts`、`manager/service.ts`、`manager/server.ts`、`manager/cv03-personal-saved-view-host-admission.ts`、`manager/cv03-personal-saved-view-host-issuer.ts`、`providers/enterprise-context/personal-saved-views.ts`、`providers/enterprise-context/resources-postgres.ts`、`tools/cv03-n104f-isolated-authority-tx-outbox.mjs`、`tools/cv03-n104h-isolated-producer-fence.mjs`、`.github/workflows/cv03-resource-postgres-atomic.yml`。精确测试路径及分支/PR/Actions 在[详细索引](CV03-N104L-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261111.md)。

## 4. 外部来源状态：**不能把历史资料冒称本次新阅读**

- **2026-11-06** 历史研究索引 [EX01–EX08](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) 记载当时阅读官方对应正文/章节（H-历史阅读）。
- **2026-11-10** 较早 N1-04d 研究窗口在[原详细索引 §1](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md) 记载 EX01/02/06/07/08 **R-正文选读**；EX03 Odoo19 超时、EX04 Power Apps Grid 来源访问失败、EX05 SAP 返回 HTML 壳而无正文，故这三项**U-待验证**。不能抹去 11-06 的历史阅读记录。
- **本次 N1-04e～04l 工程窗口（2026-11-10）**主要直接读取 **GitHub 源码/PR/Actions（G）**，**没有重新访问 EX 官方网页**；2026-11-11 交接整理也只从 GitHub 已保存的历史索引读取上述网页研究。旧 [2026-10-12 S01～S08](REFERENCES.md) 仍保持各自「已读章节 / 仅读摘要 / 打开失败」原等级，不能提升。
- 不存在本次新制作的厂商网页 PDF、完整 HTML、截图、产品操作视频或实际生产 PostgreSQL 认证附件。缺失清单见详细索引；动态 Actions 保留 run ID、精确 HEAD、关键测试 marker。

## 5. 尚存的重大矛盾与最优先的下一步

1. **真实生产一致性断裂（P0）**：`manager/service.ts` 先修改 FileLifecycleStore 再发 `onLifecycleEvent`；`manager/server.ts` 处理进程内事件，而隔离 PG18 的 T0/outbox 并不与真实 PA05/AuthorizationProvider 同一事务。N1-04i 已验证 PA05 DENY 与失联 SQL mirror ALLOW 可以共存。**本地文件读/写 fencing 和启动隔离都不能修复另一 Host 的旧 SQL 租约。**
2. **N1-05a（下个窗口第一任务）**：让 PA05 Owner、AuthorizationProvider Owner、DB/Security Owner 签收生产唯一权威/事务边界、真实 Producer/KMS/SQL Principal、scope 完整快照、撤权 SLO/错误恢复与回滚。不在缺 Owner 证据时自行部署测试 schema 或打开正式 WRITE。完整阶段 N1-05a～f 见[生产决策和可执行验收](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md)。
3. **N1-05b～f**：真实权威 T0/outbox → 最小 SQL 角色、Actor+Enterprise 身份及签名 DML → 冷启动和代际 fencing、完整快照 → 真正 Human/Agent 双通路/390px → 可回滚发布与安全签收；未实现的不要标 PASS。
4. **研究补查**：优先重开 EX03/04/05 官方原文并保存**可重复定位章节**；别重新全量做竞品调研。SharePoint 2019 与 M365 的功能差异、SAP/Odoo 原文不可访问、文件权限与 SQL 一致性边界是本轮关键冲突。

## 6. 进入新窗口前按顺序打开

1. [本简短入口](CV03-N104L-WINDOW07-RESEARCH-HANDOFF-ENTRY-20261111.md) → [本次详细参考索引](CV03-N104L-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261111.md)。
2. [N1-04l 实际工程最终交接](CV03-N104L-REAL-PA05-READ-FRESHNESS-AND-N1-RELEASE-HANDOFF-20261110.md) → [N1-05 生产权威决策/验收](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md)。
3. [原 N1-04d 七轮研究索引](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md)、[EX01～EX08 历史原索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)、[S01～S08 历史索引](REFERENCES.md)、[11-09 恢复审计](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)。
4. 最新 `main` 的 `manager/store.ts`、`manager/service.ts`、`manager/server.ts`、`tools/cv03-n1-postgres-role-audit.mjs`、真实测试和最新 PR/CI；**先 fetch 最新 SHA**。

**并行文件保护**：[#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 负责 `COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md`、`CV03-C302-ATOMIC-HOST-RECEIPT-POSTGRES-20261109.md`、`CV03-C302-PERSONAL-SAVED-VIEW-ISOLATED-HOST-20261109.md`。本交接不能覆盖它们。另有架构 docs PR #1161 等在途，勿将历史文档快照当最新 main。

> **未保存的原始材料**：早先超长聊天的完整逐字导出、未入库网页检索结果和原始截图、厂商页面完整离线快照、不可变 Actions 全量离线日志、生产 SQL/密钥/迁移/Owner 签收、实际桌面/390px Human 截图及外部 LLM 验收。不存在就不填写伪路径。最后一轮当前工程代码和决策文档已在 #1209 合 main；本次新增两份研究交接只有在本 Docs PR 合并后才视为 main 已保存。

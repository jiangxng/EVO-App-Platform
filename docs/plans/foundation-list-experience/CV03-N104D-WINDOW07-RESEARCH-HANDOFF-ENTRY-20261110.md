# CV-03 N1-04d — 七轮结束，新聊天接续入口（2026-11-10）

> **一句话结论**：已完成并合入 main 的 N1-01～N1-04d 是有真实 PostgreSQL 18 和现有 PA05/Host 代码支撑的**隔离工程安全证明**，**不是**正式生产 PostgreSQL / KMS / PA05 授权事件接线的验收；正式 Saved View WRITE=OFF，Page GET=404，Save POST=403，N1=NOT_CERTIFIED。
>
> **准确仓库 / 开发基线**：[`jiangxng/EVO-App-Platform`](https://github.com/jiangxng/EVO-App-Platform)，2026-11-10 本轮研究交接从 `main@a83d8594e7994601d5becb2348bd18a0d7575172` 建独立分支 `docs/cv03-n104d-window07-research-handoff-20261110`。交接合并后新窗口**先 fetch 最新 main 并检查本交接 PR 实际合并提交**，不要继续在已清理的 docs 过程分支开发。
>
> **详细资料及可追溯证据**：[原始网页、阅读等级、研究取舍、GitHub PR/源码/CI、资料冲突与未保存项](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md)。本短入口只保存可独立开工的约束。

## 1. 用户原始目标与本窗口明确要求

- 在现有 **Eidos + EVO App Platform + Domain Owner + PA05** 上，将业务字典、往来对象及以后列表型业务应用抽象为可复用的 **Collection Query / 表格 / 视图配置 / 搜索筛选排序分页 / 详情返回 / 可选看板与图表**；不开发第二套万能 List 框架，不重复数据导入、业务字典或对象权限。
- Human 与 Personal Agent 通过**同一个已安装/有效 Capability Operation** 操作同一真实业务数据与字段权限。需要受授权 READ/PLAN、受管 WRITE、持久回执、幂等、失败恢复和用户可监督。AI 不得直接接私有数据库或跳过 Host。
- 用户要**本地/真实代码实际推进**、逐项可验收、CI 全绿、独立分支/PR、尽量自动连续完成、合 main 后删过程分支；不只汇报研究成果、不捏造生产/人验；维护固定交接和可复用文档。
- UI 以现有 **Eidos/V3** 设计为权威，关注颜色、布局、导航、桌面和 390px、按钮与返回；真实 Human/移动/键盘/LLM 尚待单独验收。
- 本轮最后一项要求为**恢复研究资料与决策遗产**：记录原网址、阅读日期、正文/摘要/待验证等级、来源事实与工程判断、方案取舍、易丢资料、已实现代码及后续事项；两份文档分开写入 GitHub，不覆盖他窗口。

## 2. 已确认决定（继续沿用）

| 已确认决定 | 理由/边界 |
| --- | --- |
| **业务事实继续属于 Domain Owner，Eidos 只负责通用呈现，Platform Host 掌握授权与运行** | 引自 11-06 架构/EX01–08/H01–10；避免统一“大表”偷走业务真实性和字段权限 |
| **个人 Saved View 先于企业共享 View** | 私有 Owner/企业隔离与回执已能在隔离测试验证；C3-03 企业共享还需新的角色与授权设计 |
| **正式 WRITE 必须先通过数据库物理授权、签名及安全 Owner 签收** | #1194 实证 Node-only 签名不能阻断直接 SQL DML；#1195–#1200 只闭合隔离工程链路 |
| **隔离 Provider 的 SQL Gateway 强制无降级** | 无 Gateway、错 proof、失效授权、并发冲突、未知 ACK 必须拒绝或由历史 receipt 恢复；不能回退裸 INSERT |
| **Agent 与 Human 不因代码共用就自动同权** | 真实 PA05 对 actor 的授权结果可能不同；当前 PG mirror 缺 actorType 维度，正式实现必须单独修复 |
| **N1=NOT_CERTIFIED；生产 Saved View WRITE 继续 OFF** | 正式 Host `manager/cv03-personal-saved-view-host-admission.ts` 与测试保持 Page 404、SAVE 403；别动 Railway/生产 SQL/KMS |

**保留的竞争方案及舍弃理由**详见[详细索引 §4](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md)：不复制 SharePoint 的单库、Odoo XML、Dataverse 完整 Grid、明道云自由插件 JS、巨型 BaseList 继承树；引用厂商的是设计启发，不是授权/生产事实。

## 3. 已实施并经 GitHub 实际确认的七轮

| 轮次/合并 PR | 交付及验证 |
| --- | --- |
| 先行恢复 [#1193](https://github.com/jiangxng/EVO-App-Platform/pull/1193) | 恢复 11-06 外部来源 EX01–08、历史设计与当前生产门禁；旧聊天完整逐字记录仍缺 |
| #01 · N1-01 [#1194](https://github.com/jiangxng/EVO-App-Platform/pull/1194) | 用真实 PG18 隔离登录证明原 Node-only HMAC 可由 SQL 直接插入绕行；新增只读 SQL 审计器 |
| #02 · N1-02 [#1195](https://github.com/jiangxng/EVO-App-Platform/pull/1195) | PG `SECURITY DEFINER` 验 Host HMAC + 资源/回执 canonical SHA，NOLOGIN owner + 最小 runtime 权限 + CAS |
| #03 · N1-03 [#1196](https://github.com/jiangxng/EVO-App-Platform/pull/1196) | 原 Provider 显式受控模式；两独立 OS Worker 版本冲突、丢 ACK 后重启查询旧回执、回放不可降级 |
| #04 · N1-04a [#1197](https://github.com/jiangxng/EVO-App-Platform/pull/1197) | 隔离 SQL 短效 permit、Owner 撤权镜像、事务行锁和 namespace 绑定 |
| #05 · N1-04b [#1198](https://github.com/jiangxng/EVO-App-Platform/pull/1198) | 两企业/多主体真实 SQL 登录 get/list/receipt 隔离；旧事件忽略与 epoch 缺口失败关闭 |
| #06 · N1-04c [#1199](https://github.com/jiangxng/EVO-App-Platform/pull/1199) | 认证的**合成**授权事件独立 DB 验签、90 秒候选租约、事件失联后 READ/WRITE 失败关闭 |
| #07 · N1-04d [#1200](https://github.com/jiangxng/EVO-App-Platform/pull/1200) | **现有实际 PA05 Manager/AuthorizationProvider/Host Issuer** 在隔离测试中取决策；测试签名事件 outbox、丢 ACK 幂等重放、撤权、切企业及 Feature disable；真实生产事件流**未接通** |

最终工程证据：[#1200 最终 HEAD `92db2a8a9deb0ee46f1e6bbd4065b96eb60f4690`](https://github.com/jiangxng/EVO-App-Platform/pull/1200)；[PG18 Actions 运行 42750611281](https://github.com/jiangxng/EVO-App-Platform/actions/runs/42750611281) **20/20 PASS，0 FAIL、0 SKIPPED**；最终五项 GitHub checks **5/5 SUCCESS**；合并 main SHA **`a83d8594e7994601d5becb2348bd18a0d7575172`**。这不是部署和真实用户登录验收。

## 4. 下个窗口应优先处理的 N1-04e（明确工单，不需要重头搜索竞品）

1. **P0 / 真实命名空间互操作**：`providers/enterprise-context/personal-saved-views.ts` 使用 `evo.saved-view.personal.<sha256(JSON.stringify([enterpriseId,subjectId]))>`；隔离 SQL Gateway / scoped read 用原始 `subjectId`。先以实际 Domain Owner 计算的真实地址测试写入/读取/历史 receipt，再修改受控 SQL 检查为严格相同且不可跨企业/用户；**不能放宽所有 namespace 作为修复**。
2. **P0 / Actor 分权**：PG operation policy 现键只有 `contextId + principalSubjectId + operationId`，而 Human 与 AI 可能有不同许可；补 actorType、epoch、签名绑定和负例（Human 可写不自动赋予 AI 可写；AI 被撤权不能因同主体 Human 放行）。
3. **P1 / 真实 PA05 可信事件 outbox**：使用实际生命周期状态/授权变更的权威事务或经明确接受的一致性协议，决定事件认证、可靠序号/ACK/投递失败、过期 fail-closed、可信 snapshot 恢复；#1200 outbox 是测试演示，不与正式 store 原子提交。
4. **P1 / 生产安全准入签收**：先找到真正的 Platform Saved View Primary；请 DB/Host/安全 Owner 脱敏核验 runtime SQL 主体、schema/GRANT、最低只读权限/连接池身份、密钥 custody/rotation/KMS、migration + 备份/回滚、双真实 Host 和重启回读。不能拿其他 EVO Ledger Runtime 的 PG18 当已核准正式库。
5. **依赖 N1 的 N2–N5**：N2 正式 Feature/ActionRouter；N3 Eidos Human Form + Cookie/Origin/CSRF；N4 真实浏览器/桌面/390px 人验；N5 外部 LLM Personal Agent 与回执；C3-03 企业共享需独立权限验收。

## 5. 外部资料阅读状态、没有保存的东西

- **2026-11-06** 原官方研究索引：EX01–EX08 相关正文已由当时窗口检索阅读；不是逐页截图、也不是实际厂商账号验收。
- **2026-11-10** 本窗口重新取得可读官方正文：EX01 SharePoint 视图、EX02 SharePoint 2019 软件边界、EX06 明道云视图、EX07 明道云应用、EX08 W3C Grid。**本次待验证**：EX03 Odoo19 超时、EX04 Power Apps Grid 访问失败、EX05 SAPUI5 返回空正文。详细原始 URL、章节、阅读级别与取舍均在[详细索引 §1](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md)；不捏造“仅搜索摘要”带来的新结论。
- **未保存/未取得**：上一个超长聊天的完整逐字导出、当时临时未入库网络搜索结果、第三方网页全量 HTML/PDF/截图、厂商实操录屏、GitHub Actions 不可变离线日志附件、实际生产 SQL/权限/密钥和上线签收、真实 desktop/390px Human 截图、外部 LLM end-to-end 证据。它们不能被现有 Markdown、隔离 CI 或无效的 sandbox 链接替代。

## 6. 开新窗口必须读取的文件与并行归属

- **先读** [本窗口详细索引](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md) → [N1-04d 交接](CV03-N104D-REAL-PA05-MANAGER-OUTBOX-ISOLATED-HANDOFF-20261110.md) → [2026-11-06 原始网络研究索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) → [11-10 旧聊天恢复审计](CV03-C302-LONGCHAT-RECOVERY-AUDIT-20261110.md) → 原 `providers/enterprise-context/personal-saved-views.ts`、`resources-postgres.ts`、两 SQL Gateway builders、`manager/capability-operation-access.ts`、`manager/cv03-personal-saved-view-host-issuer.ts`、#1200 tests/workflow。
- **正式计划不要另写**：[CV-00～CV-07 唯一权威计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)、[Eidos × Platform 架构](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)。并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 仍为 Open；**不要修改**它所负责的 CV 计划、C3-02 原子回执及 Personal Saved View 隔离 Host 三份文档。
- **治理**：新窗口先核实 `main` 最新 SHA 和在途 PR；从最新 main 新建 N1-04e 实现分支，仅修改本次 Owner 指定文件，Draft PR → 真实 PG18/Host CI → 合并 main/清理分支 → 最终交接。没有生产 Owner 签收不开启 WRITE、没有 Human/LLM 实测不标验收完成。

> **准备好的新窗口接续指令**由当前聊天最终回复提供，引用该短入口/详细索引、准确 main 与交接 PR 合并 SHA；不要依赖一个可能被删除的 docs 过程分支。

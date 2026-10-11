# TR-01B2D3｜本窗口研究与决策交接入口（2026-10-11）

> **入口，不是状态权威。** 先读 `AI-BOOTSTRAP.md` → `project.status.json` → status.handoff 指向的机器生成 `docs/roadmap/HANDOFF-LATEST.md` → `LLM.md` → `llm.foundation-map.json`，然后读本文和两份详细文档。仓库证据高于聊天记忆。本交接独立于 Agent、Eidos/2D Designer 主线；**不修改** status 或 HANDOFF-LATEST。本包由独立 docs PR 自 `main` 分出。
>
> **与旧包关系：**先前 [TR01 旧窗口交接入口](TR01-RESEARCH-HANDOFF-ENTRY-20261010.md) → [旧来源索引](TR01-RESEARCH-SOURCE-INDEX-20261010.md) → [旧决定与缺口](TR01-RESEARCH-DECISIONS-AND-GAPS-20261010.md) 已由 [#592](https://github.com/jiangxng/EVO-App-Platform/pull/592) 合并；[主线恢复](TR01-MAINLINE-RECOVERY-TWO-EVO-20261010.md)由 [#603](https://github.com/jiangxng/EVO-App-Platform/pull/603) 合并。本包只记录之后的 CP/FO 与 B2D3 安全、插件归属等增量。不要将先前“未读外部网站”的旧包断言冒充本包最新访问情况。

## 必须继续保留的三个文档

1. **此短入口：** `docs/roadmap/TR01B2D3-WINDOW-RESEARCH-HANDOFF-ENTRY-20261011.md`。
2. **[本轮原始参考索引](TR01B2D3-WINDOW-RESEARCH-SOURCE-INDEX-20261011.md)：**每条的标题、原始 URL、访问日、已读层级、章节/日志位置、事实、用途；严格区分本轮独立打开的 PostgreSQL 官方原文、已读仓库源码/CI、只查运行结论、未读资料。
3. **[方案、取舍、冲突与下一步](TR01B2D3-WINDOW-RESEARCH-DECISIONS-GAPS-20261011.md)：**对比采用/排除/仅待验证方案，谁负责什么、可证明什么、禁止宣称什么，以及生产安全门槛和研究优先级。

## 用户已明确的目标、决策与工作方式

- **总方向：**让已导入的 Counterparty / Item / Warehouse/Location 基础对象服务于真实采购、销售、库存、财务业务；通过业务验证反向收敛通用对象模型。基础对象的**未知原始列保留**与**正式 Object Extension 值持久化**是两回事；企业扩展字段**不必等待整套 ERP 闭环完成**，但必须按业务含义归属对象、业务单据或派生指标。参见 [Human 验收矩阵](FO-IMPORT-EXTENSION-HUMAN-ACCEPTANCE-20261010.md)。
- **正式架构原则：**「**业务原则上通过插件增加**；采购、销售、库存、财务等业务由拥有该语义的业务/Owner 插件负责；App Platform Core 提供公共宿主、安装/授权/路由/上下文；EVO 最小 Runtime 拥有不可变 BusinessData、确定性的 Posting/Ledger/Balance/Replay；较高层 Cost/Valuation/Allocation 属于经正式准入的 EVO 侧 Owner 插件，不应悄悄塞入最小 Ledger Core。」当前 Trading Reference 是有界 Application 参考验证，**不是未来单体 ERP**。已由 [架构护栏 #605](https://github.com/jiangxng/EVO-App-Platform/pull/605) 合并到 main。
- **推进方式：**用户授权持续、连续小步执行，普通可逆决策无需询问；独立 branch/Draft PR、真实 CI、证据留存，安全后按相应开发分支合并；**不直接推 main**，不碰其他窗口的 Agent/2D Designer，不擅自修改 `project.status.json` 或生成 handoff，不把模拟 CI 当生产通过。**真实生产身份、凭据、不可逆/重大部署授权仍需相应 Human 权限。**

## 当前精确基线（2026-10-11 通过 GitHub 重新核对）

| 层级 | 确切位置 | 状态与界线 |
| --- | --- | --- |
| App Platform main | `a434d4b8c0737894a79864c1ad806000c87f53f6` | 包含 [#603](https://github.com/jiangxng/EVO-App-Platform/pull/603) 导入/扩展 Human 验收文档与未映射源值回归，和 [#605](https://github.com/jiangxng/EVO-App-Platform/pull/605) 插件归属静态护栏；**未包含 B2D3 Draft 功能** |
| EVO main | `d5ce051325c4572c7a5fd713560d7d7d06e4b401` | B2D2 可信但进程内只读验收基线，不包含 B2D3 新隔离 Owner 运行服务 |
| [App Platform Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) | branch `feat/tr01b2d3-host-owner-delegation-20261010`; head `527257976e16db954cab2aed1cc1be0b8e603ad4` | **未合 main / 仍 Draft**；本窗口 #609、#613、#616 均仅叠加合并到此功能分支；本 head **37/37 GitHub workflow SUCCESS**，包括原始销售事实 PostgreSQL |
| [EVO Draft #108](https://github.com/jiangxng/EVO/pull/108) | branch `feat/tr01b2d3-finance-owner-auth-readonly-20261010`; head `4e21327931c2db291d9a57619c64c9dc9da3f4e7` | **未合 main / 仍 Draft**；本窗口 #109、#110 仅叠加合并到该功能分支；[全套 CI #38068386910](https://github.com/jiangxng/EVO/actions/runs/38068386910) SUCCESS |
| 权威 milestone | `project.status.json.projectContinuity.current.openGate` | `tr01b2d3-trusted-host-to-evo-finance-owner-delegation` **OPEN**；不得以隔离 CI 把它写为生产 PASS；B2D4 财务写入、B2E Sales Human/Agent/Workbench 仍未解锁 |

## 本窗口已实现/已查验证据（一行一门槛）

1. **基础对象归位**：[#603](https://github.com/jiangxng/EVO-App-Platform/pull/603) merged `ed9c66a6f7eca885f0c45ed140a23a90342fbde3`；区分未知源列保存、正式扩展字段 sidecar 和未实现的“自动升格+历史回填” Human E2E。
2. **插件归属架构护栏**：[#605](https://github.com/jiangxng/EVO-App-Platform/pull/605) merged `a434d4b8c0737894a79864c1ad806000c87f53f6`；`architecture.boundary-policy.json`、`tools/tr01-business-plugin-ownership-guard.mjs`及正反测试；仅 TR01 局部静态检查，**不是全仓运行时隔离**。
3. **实际独立数据库身份**：App [#609](https://github.com/jiangxng/EVO-App-Platform/pull/609) + EVO [#109](https://github.com/jiangxng/EVO/pull/109)；两个不同 PostgreSQL `LOGIN NOINHERIT`、受控活跃公钥行锁、单次 nonce、Grant/Revoke 审计；原始签名 HTTP 真实 PASS；详细两次失败的权限发现保存在来源索引与取舍。
4. **两个 EVO 进程并发/撤销**：App [#613](https://github.com/jiangxng/EVO-App-Platform/pull/613)，同签名同时请求 **200+409**，撤销事务持锁时两个新请求等待，提交后 **401+401**，无新增 nonce，账本与成本 digest 不变；[CI #38067711812](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38067711812) SUCCESS。
5. **隔离的只读 Owner 进程**：EVO [#110](https://github.com/jiangxng/EVO/pull/110) + App [#616](https://github.com/jiangxng/EVO-App-Platform/pull/616)；EVO 仅暴露 finance-owner 签名验证与健康检查，其他命令/demo/BusinessData 接口 **404**；由真实受限数据库账号验证，撤销无须重启；[App CI #38068088650](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068088650) SUCCESS。
6. **父分支全量回归**：App #594 head 上 **37/37 成功**，含 [跨项目 TR01B #38068397253](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068397253)；EVO #108 head [CI #38068386910](https://github.com/jiangxng/EVO/actions/runs/38068386910) SUCCESS。**均为 CI，不是生产。**

## 下一个最小可执行任务与“不要重复”

**先审核下一生产门槛，不直接上线：**在现有 B2D3 Draft 独立小分支继续准备 **Finance Owner 隔离部署/最小数据库账户/密钥轮换与审批/私有 ingress 只读运行手册及可自动验证的 fail-closed 配置检查**；对生产 OIDC 身份与租户映射、真实 HTTPS/TLS、Host 与 EVO 分开部署、密钥托管及多机器/负载均衡逐项建立可验收清单。只有具备外部权限/凭据后才做真实生产验收。任何运行时新变更先检查已合并的 #609/#613/#616，避免重复实现或与并行窗口冲突。

**切勿**把 `SET LOCAL ROLE` 当真实独立 DB LOGIN，把本地 OIDC/TLS 和双进程当生产多机，把 `executionAllowed:false` 当可写财务许可，或让 Host/Agent 绕过 EVO Owner 直接调用私有 CostEngine、`/demo/*`、Ledger 表。下一窗口若更改已确认方案，记录新的原始证据与变更理由，再更新原决策索引。

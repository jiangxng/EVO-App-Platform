# TR-01 主线旧窗口恢复与双 EVO 实例证据增量 — 2026-10-10

> **性质：**旧窗口恢复的资料导航、进展核验和待办增量；不替代 `project.status.json` 与生成的 `docs/roadmap/HANDOFF-LATEST.md`。截至本次核验，B2D3 生产准入仍 OPEN。此文档独立于 2D Designer 和 Personal Agent 专项。本次只增加恢复/验收文档、脱敏样例 CSV 与导入协议回归；不修改财务运行时、权威项目状态或生产数据。是否合并以 PR 检查通过及独立评审为准。

## 1. 阅读顺序与已恢复内容

严格先读 `AI-BOOTSTRAP.md` → `project.status.json` → 其指向的 `docs/roadmap/HANDOFF-LATEST.md` → `LLM.md` → `llm.foundation-map.json`。

旧窗口的三份已合并交接（[PR #592](https://github.com/jiangxng/EVO-App-Platform/pull/592)，合并提交 `2d25e738e38f5e9330a5b083a4fd597d0fef93c9`）：
- [研究入口](TR01-RESEARCH-HANDOFF-ENTRY-20261010.md)：用户要求、TR01A→B2D2 的已闭环阶段、B2D3 未决、禁止越界事项。
- [原始来源索引](TR01-RESEARCH-SOURCE-INDEX-20261010.md)：33 项仓库代码/文档和 9 组 PR/CI 证据的原始 URL、查阅日期、阅读程度、发现与用途。该窗口**没有独立阅读外部网页/PDF 或截图**；不可将待验证链接伪称已读。
- [采用/排除与证据缺口](TR01-RESEARCH-DECISIONS-AND-GAPS-20261010.md)：来源事实与工程判断分列、冲突、排除理由及后续研究方向。

**核心用户要求（旧窗口记录 + 已合并交接）：**真实采购/销售业务闭环反推通用能力；Human/Agent 共用授权 Host 契约；EVO 独占不可变 BusinessData、Ledger/Work、成本与正式核销；财务账户对象待真实结算/对账需求；并行 Agent/2D Designer 独立；不直接推 main；增量 PR 与真实 CI 留证；只读阶段保持 `executionAllowed:false`，禁止把 /demo、兼容请求的自填 actor 当可信财务边界。

## 2. 当前状态：区分提出、实现、验证、生产

| 主题 | 聊天/文档决定 | 实现位置 | 验证等级 |
|---|---|---|---|
| TR01A→B2D2 真实业务链 | 采购与不可变冲销；销售→生产→发货→收款；FIFO 125 CNY COGS；单订单单笔同币种 1000 CNY 核销；逐资源授权和 EVO owner 事实/策略版本核验 | 主线此前合并 PR #567/#571/#574/#578/#582/#585/#588/#589；EVO #107 | 原始业务事实 + PostgreSQL CI 已通过，参见上面的交接索引；不等于开放财务写入或安装体验 |
| B2D3 可信只读委托 | Host 身份、Enterprise/Context、安装 Provider、签名、nonce/重放由独立边界检查，默认拒绝 | App [Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594)；EVO [Draft #108](https://github.com/jiangxng/EVO/pull/108) | 实际 Host Managed Session/Provider/加密 Secret、签名 HTTP/PostgreSQL CI PASS；PR 尚未合并，生产仍 OPEN |
| OIDC 与 HTTPS | PKCE/RS256、真实 TLS 握手及错误发行者/证书拒绝 | [并行证据文档](TR01B2D3-PARALLEL-OIDC-TLS-CERTIFICATION-20261010.md) | **仅 CI 本地测试 IdP 与本地 TLS ingress**；真实 Google 租户、生产证书/入口未验收 |
| EVO 密钥撤销与切换 | PostgreSQL 为统一动态公钥授权权威，不使用进程静态公钥缓存作为热撤销事实源 | [单 EVO 证据](TR01B2D3-LIVE-POSTGRES-KEY-ROTATION-20261010.md)；EVO #108 | 单实例动态撤销/新增及不可逆审计 PASS；进程无需重启 |
| Host signer 热切换与 DB 权限 | 操作员受控文件指针 + 加密私钥；运行时/操作员权限分离 | [Host/DB 增量](TR01B2D3-HOST-HOT-SIGNER-AND-DB-ROLES-20261010.md) | [CI #38049355866](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38049355866) PASS；DB 使用 CI `SET LOCAL ROLE`，不代表生产实际分离凭据 |
| **两个 EVO API 进程共享 PostgreSQL** | 不依赖每进程独立公钥缓存；各实例在已提交撤销后拒绝旧钥 | [双实例原始手册](TR01B2D3-TWO-EVO-INSTANCES-TRUST-20261010.md)；App PR #594 commit `0210efd2541a2e4a40032bf908a69e795207a04d` | **[CI #38056537802](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38056537802) SUCCESS；实际 job log `TR01B2D3_LIVE_POSTGRES_SIGNER_ROTATION_PROOF.status=PASS`，`twoIndependentEvoApiInstancesOnePostgres=true`，`revokeAndRegrantConsistentAcrossBothInstances=true`**；财务摘要、CostRun、AllocationInstruction 无变化，`executionAllowed:false` |
| 财务写入 / Sales Human-Agent-Workbench | 只在 B2D4 / B2E 的独立验收后考虑 | 目前不在本次 B2D3 Draft 准入范围 | **未实现为可用生产授权动作／未验收** |

双实例日志进一步记录 `oldKeyRevokedWithoutEvoRestart=true`、`newKeyAdmittedWithoutEvoRestart=true`、`newKeyRevokedWithoutEvoRestart=true`、4 条只追加的审计事件以及拒绝重新激活被撤销密钥。它证明**同一 PostgreSQL 下两个独立进程的热撤销可见性**，不证明多区域部署、读副本延迟、负载均衡、并发在途撤销序列化或真实生产部署。

## 3. 已研究与取舍（不重新杜撰外部资料）

- **采用** EVO 插件 Owner 只读核验、Host 逐资源准入、受限 Ed25519 assertion、单次 nonce、PostgreSQL 信任授权与追加式审计：保证 Host 输入无法自封身份/租户，撤销对独立进程生效，且阻断写入。
- **不采用** 仅启动时静态 JSON 公钥作为热撤销依据、前端/Agent 提供 actor 或 tenant、匿名 Owner API、直调私有 CostEngine、`/demo/*`、通过只读 verdict 偷渡写入。
- **暂缓** 财务账户基础对象、跨币种/部分核销、财务执行操作、真实 Sales UI/Agent 安装体验：都不属于此轮只读可信委托已证实范围。
- **资料级别**：上述项目文件为已读取的仓库原文/相关段落；GitHub PR 与 CI 是已核对的实际状态和日志；OIDC/TLS 仅本地模拟/测试环境；外部标准原文、Google 真实租户及生产安全部署均不能宣称在此轮已独立核验。更早窗口若存在未包含在这三份交接中的原始搜索/截图，当前未能完整恢复，不能补造其阅读深度。

## 基础对象原始目标的用户验收（2026-10-10 补充）

这条主线没有从 CP-03 导入/扩展字段偏离：TR-01 用 Counterparty/Item/Warehouse 已验证的业务对象执行真实业务回路。然而**未映射列的导入作业原始值保存**与**正式 Enterprise Extension sidecar 保存**必须分别验收；二者不可互代。见 [基础对象导入与扩展字段 Human 验收清单](FO-IMPORT-EXTENSION-HUMAN-ACCEPTANCE-20261010.md) 与独立测试 Supplier CSV fixtures。新增协议断言验证提交后的未映射值仍在 ImportJob.source，且不静默写入领域核心或扩展字段。该断言已在 [Platform CI #38059144873](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38059144873) 通过，恢复文档在 [Continuity CI #38059144872](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38059144872) 通过；既有 CP-03/CP-05/IT-01/WH-01 历史 Human/生产验收仍保持原证据级别。

## 4. 仍缺与下一个最小门槛

1. **部署身份与通道**：受权真实外部 OIDC 租户（非 CI 本地发行者）、真实生产 HTTPS ingress/证书/反代到 EVO 的服务身份、潜在 mTLS 验证。
2. **生产运维**：EVO 真实 runtime/operator 不同 DB 凭证与最小权限；Host operator key pointer 的部署审批/权限/多 Host 实例同步；KMS/HSM、变更审计、密钥备份恢复。
3. **分布式语义**：引入真实负载均衡/独立主机，验证在途撤销并发序列化、DB 拓扑及副本延迟；当前只证实同 DB 的双独立进程。
4. **交付治理**：B2D3 的 Draft #594/#108 不自动合并；先按验收证据与权限逐项复核，保证继续 `executionAllowed:false`。通过生产边界后另立 B2D4 写入和 B2E Human/Agent/Workbench 门槛。
5. **失联旧聊天研究**：目前保存的 33 项仓库原始资料和 9 组证据可复用；缺少被旧窗口实际独立打开的外部标准网页原文/截图的可追溯材料。下一步只针对以上关键生产缺口查一手权威来源并登记 URL、阅读程度、限制，不进行全面重复研究。

**2026-10-10 当前核验：**`main` 为先前 PR #592 合并提交 `2d25e738e38f5e9330a5b083a4fd597d0fef93c9`（查询时最新）；权威 `project.status.json.projectContinuity.current.openGate.id` 仍为 `tr01b2d3-trusted-host-to-evo-finance-owner-delegation`，状态 `OPEN`。本恢复报告不改变该权威结论。

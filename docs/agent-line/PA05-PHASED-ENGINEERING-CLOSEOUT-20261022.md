# PA05 阶段性收口决定｜工程建设与本地验收归档（2026-10-22）

## 最终合并实证（2026-10-22；**本节优先于下方历史 Draft 状态**）

- 项目负责人明确批准在插件化开发阶段将 PA05 已完成的工程源码合并 main，而不等生产安全认证；[PR #1104](https://github.com/jiangxng/EVO-App-Platform/pull/1104) **MERGED**，main 合并提交 `3bb68a6a6b2dcb11f1e10a9456a33e90f3440a85`；准确最终 PR HEAD `08ab0c14c38891bdfd81f83a0f1df3b9306c2655` 的 **46/46 GitHub checks SUCCESS**。此前“#1104 OPEN Draft / DO_NOT_MERGE”仅为合并前历史快照，**不再是当前状态**。
- [Branch Hygiene Run #39756394843](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39756394843) job `119749355229` 原始日志 `DELETED_VERIFIED_MERGED_AGENT_BRANCH agent/pa05-k0-consolidated-engineering-20261022 @ 08ab0c14...`；远端复查 PA05 工程过程分支为 **0**，未合并 PA05 工程 PR 为 **0**。以前关闭未合并的 #1074/#1081/#1082 只作为研究/负面测试溯源，不应重新打开。
- **注意部署差异：** 合并后只读 Railway 仍报告 Ledger Configurator 在线单实例的最新 SUCCESS deployment 为 `5cfce97b-9745-4e62-9b64-d2b1e0a2eedf` / 旧 commit `eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff`；**没有观察到 #1104 对应的新部署**。此为当时快照，不能作为未来持续部署状态证明，不主动干预共享在线服务。
- **仍不可签收：** [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) `OPEN`，R5-01 UNKNOWN、R5-02 PRODUCTION_UNVERIFIED、R5-03 BLOCKED；正式 K0/E01J4/PA05-05/W06 `NOT_SIGNED`，生产 material WRITE `OFF`。工程合并不等于全球 Worker 安全停止、Railway PID1/SIGTERM 链路或独立 Supervisor 验收。
- **执行恢复原则：** 新窗口从已合并 `main` 代码继续，不重新构建 PA05 Host/PROCESS 修复、不开重复工程 PR；仅针对尚未实证的外部 Operator/DBA/IdP/隔离 Supervisor 门禁继续调查及分层验收，不改动 BEX/CP/Eidos 主线。

> **Document class:** PA05_STAGE_CLOSEOUT_DECISION / AGENT_LINE_ONLY / OWNER_REQUESTED
>
> **Decision:** `PA05_ENGINEERING_SLICE = CLOSED_AND_ARCHIVED`；`PA05_FULL_CERTIFICATION = NOT_SIGNED`；`K0_PRODUCTION_GATE = BLOCKED_EXTERNAL_EVIDENCE`。
>
> **解释：** 本文件只结束 PA05 已完成的工程实施、文档整合、隔离 CI 和旧分支治理工作轮次；**不宣告整个 PA05 生产认证完成，不等于产品已发布**。外部证据恢复后继续原验收，而不重新进行已经完成的研究。
>
> **Decision date:** 2026-10-22；记录起始 main `b2f4f37b57eb5c7d9d44554f2e40077465445257`（非永久当前指针）。本决策基于项目负责人“可阶段性收口则先收口”的明确要求。

## 1. 这次正式收口的范围

| 工作领域 | 本轮可复核证据 | 当前结论 |
|---|---|---|
| 插件协议、跨业务 READ/Owner 与治理类阶段性工程 | [PA05 certification baseline](PA05-CERTIFICATION-BASELINE-20261015.md)；既有 PA05-01/02/03/04 局部工程与 CI 证据，已在 main 的内容保持原样 | **工程成果归档**，不转换为全认证通过 |
| Host 退出错误路径与 PROCESS 停机屏障 | [整合 Draft #1104](https://github.com/jiangxng/EVO-App-Platform/pull/1104) at `35b7f1e9d385d58a93302b7b6290e0a6c242683c`；原始 [45/45 checks](https://github.com/jiangxng/EVO-App-Platform/pull/1104/checks) 成功；Host/J4J 专项 6/6，隔离 PROCESS 正向回归实跑 | **工程候选测试通过，源码封存于仍开放 Draft**；**没有合并到 main** |
| 旧负面证据 | [#1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) 原竞态负面测试，CLOSED UNMERGED；其修复的正向回归已被 #1104 承接 | **负面证据归档**，不得误入有效回归 |
| 研究遗产和版本接续 | [#1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071) docs MERGED `73cbbc70be14708e2c2282c0409a8f4d64027b0c`；[#1099](https://github.com/jiangxng/EVO-App-Platform/pull/1099) docs MERGED `4495b0f5d2b52ada81286f585e649ac0fe692826` | **已进入 main** |
| 已合并/已被整合取代的过程分支 | [清理 #1103](https://github.com/jiangxng/EVO-App-Platform/pull/1103) / [Run #39719106363](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39719106363) 实删 3 refs；[清理 #1105](https://github.com/jiangxng/EVO-App-Platform/pull/1105) / [Run #39723079693](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39723079693) 实删 4 refs；两项均有原始 `DELETED` 日志并已核验远端缺席 | **旧过程分支清理完成，只有 #1104 的工作分支保留** |

上述检查数字属于特定源码和 CI 时间片；主线并行移动后，合并前须重新取得最新 merge candidate 的检查，不能复用旧数字作当前准入证明。原 [PA05 certification baseline](PA05-CERTIFICATION-BASELINE-20261015.md) 仍记录 `IN_PROGRESS / NOT_SIGNED` 的整体认证状态；**本收口只关闭其中已完成的工程轮次**，不覆写它。

## 2. 特意不签收／不关闭的内容

| 门禁或依赖 | 状态（2026-10-22） | 能做／不能做 |
|---|---|---|
| [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) R5-01：实际部署 Draining / Overlap 和来源 | `UNKNOWN`；尚无被指派的 Operator、无部署精确回执 | 只读获取现行部署配置；不得猜默认值 |
| #1092 R5-02：实际部署 PID1→Node / SIGTERM 到达与退出证据 | `PRODUCTION_UNVERIFIED` | 隔离直连 Node Host 测试不能替代 Railway 实例真实信号链 |
| #1092 R5-03：真正独立的隔离监督者，完整 Worker/Caller 清单与可独立核验的停机回执 | `BLOCKED`，待明确隔离环境和独立批准人 | 不能凭 synthetic 签名/本地子进程自述认定全局安全停机；未经许可不得对在线服务发 SIGKILL |
| [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) W06、[#979](https://github.com/jiangxng/EVO-App-Platform/issues/979) PA05-05、[#988](https://github.com/jiangxng/EVO-App-Platform/issues/988) 及 PA-04 C01–C06、PA-02 R10 [#879](https://github.com/jiangxng/EVO-App-Platform/issues/879) | **各自原 Gate/Owner 仍有效**，不得因本文件结案 | 不重分类、不替代正式 Human/DBA/IdP/Provider/金额成本等签字 |

**安全不变量：** `K0 / full E01J4 / PA05-05 E01–E05 / W06 = NOT_SIGNED`；`production material WRITE = OFF`；`PR #1104 = OPEN DRAFT / DO_NOT_MERGE / DO_NOT_DEPLOY`。本轮没有 Railway、SQL、Secrets、生产重启/停机/锁释放、全局项目状态文件修改。

> 项目负责人在本次对话中报告 Railway 官网维护中。本次阶段归档以此为外部暂缓原因；**不把维护报告当作平台事故的独立验证证据**。恢复后应重新核对准确的部署身份。

## 3. 下阶段责任与重启条件（避免长期工程窗口占用）

**现在：** 停止 PA05 追加性研究与重复造轮子；保留 #1104 唯一工程候选，冻结其已证实范围。平台/业务并行 main 不受影响，避免触碰 BEX/CP03/Eidos/2D 业务线。独立研究遗产可从 #1071/#1099 和其索引读取，不必重做。

**Railway 可用后：**
1. 指派有权限的 Railway Infra Operator 和 Runtime Operator，只读核对同一真实 deployment ID、commit、时间和来源；准确记录 `UNKNOWN` 项，而不是猜测。
2. 在完全隔离、无企业真实数据、获独立授权的测试环境内完成 Supervisor/stop/TTL/DB-session 证据，独立审核者验证；不擅自停止或部署线上服务。
3. Human/IdP/DBA/Owner 分别签收授权、凭据轮换与相同部署身份下的日志/会话证据。
4. 对 [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 原始回执进行独立评审；仅通过已由对应 Owner 签署的门禁。门禁齐备时重新校准 #1104 相对**当时**最新 main 的 CI、发布范围与可回滚性，再决定是否非 Draft、合入及清理最后过程分支。

**PA06 顺序：** 可另起独立 PA06 **准备、只读规划或非生产隔离研究**，不能借本轮“工程阶段收口”自动获得企业试点和生产 WRITE 许可；原定 `PA05 → PA06 → PA03 I01–I10（待 BEX/CP03 对象导入线完成）` 依赖保持不变。PA05 完整认证的剩余工作不因启动 PA06 而自动消失。

## 4. 定稿状态和可复核入口

- **管理意义：** PA05 当前工程建设轮次阶段性**收口**，不再占用持续研发窗口；后续外部授权和实证作为**受门禁约束的验收尾项**单独追踪。
- **工程：** 整合候选 #1104 原封保留；45/45 精确头 CI 是局部工程证据，**不是**生产认证。
- **外部验收：** #1092 保持 `OPEN / NOT_SIGNED`，直到真实合格外部证据和明确签署。
- **主线：** 无 `project.status.json`、全局 roadmap 或生成 handoff 权限变更；本文件只在 `docs/agent-line/` 为 PA05 专项提供新的入口和决策记录。

## 2026-10-22 追加决定：开发阶段工程合并授权（不改变生产认证）

项目负责人在阶段收口之后进一步明确：“合并吧，我们是插件模式开发、目前还在开发阶段，不想太多分支，防止跨窗口重复开发”。因此把本文件前述“#1104 保留 Draft、禁止合入”重新分类为**当时的历史审查状态**，而非永久阻断主线工程合并的有效规则。新执行决策：允许 [PR #1104](https://github.com/jiangxng/EVO-App-Platform/pull/1104) 在与最新 main 同步且准确最终 HEAD CI 通过后正式合并；仅该工程代码范围获授权，后续状态以 GitHub PR 原始合并记录为准。

注意：Railway 服务在名为 production 的环境下挂接 GitHub `main`，合并有触发既有自动部署的可能；**没有授权修改部署配置、重启/停机、开启 material WRITE 或将运行成功误认作 K0 验收**。原 [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 继续 OPEN，R5-01 UNKNOWN、R5-02 PRODUCTION_UNVERIFIED、R5-03 BLOCKED，PA05 完整认证与 W06 保持 NOT_SIGNED。不得重做已经封存的原始工程研究。

# PA05 / K0｜2026-10-22 合并后简短交接入口

> **Document class:** AGENT_LINE_HANDOFF_ENTRY / POSTMERGE / 2026-10-22  
> **配套详细遗产索引：** [研究与决策参考索引](PA05-K0-WINDOW-20261022-POSTMERGE-RESEARCH-REFERENCE-INDEX.md)  
> **文档起点：** `main@59d31034f4ad7fd2715e1ac26395abbba94a31d1`（本次写文档前的快照；每个新窗口必须重新核对）  
> **本入口优先于旧 HANDOFF 中“#1104 仍 Draft、不合并”的历史段落。**

## 一句话状态

**PA05 工程整合已经合并 main，旧 PA05 工程过程分支已实际删除；PA05 工程建设轮次阶段性收口，但完整安全认证没有签收。** 避免下一窗口误建新分支、重做 #1074/#1081/#1082 或重新实现 #1104 既有功能。

| 事项 | 权威结果 |
| --- | --- |
| Host + PROCESS 停机代码 | [PR #1104](https://github.com/jiangxng/EVO-App-Platform/pull/1104) **MERGED**，合并提交 `3bb68a6a6b2dcb11f1e10a9456a33e90f3440a85`；原分支 HEAD `08ab0c14c38891bdfd81f83a0f1df3b9306c2655` |
| 最终工程检查 | 在合并前准确 HEAD 上 **46/46 GitHub CI SUCCESS**；Host shutdown/J4J 专项 **6/6**；只证明本地/CI 的有界工程质量 |
| 最后一条过程分支 | `agent/pa05-k0-consolidated-engineering-20261022` 已从远端删除；[Branch Hygiene run #39756394843 / job #119749355229](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39756394843/job/119749355229) 原始记录 `DELETED_VERIFIED_MERGED_AGENT_BRANCH` |
| 旧工程/研究 | #1074、#1081、#1082 保留为 CLOSED UNMERGED 的 PR 证据；#1071、#1099 等历史文档交接已合入。旧引用的分支不应恢复 |
| 阶段收口 | [阶段性收口决定](PA05-PHASED-ENGINEERING-CLOSEOUT-20261022.md) 及 [Agent HANDOFF](HANDOFF.md) 首页最新增补，工程阶段 `CLOSED_AND_ARCHIVED` |
| 正式认证 | [#1092 R5-01/02/03](https://github.com/jiangxng/EVO-App-Platform/issues/1092) **OPEN**；`K0 / E01J4 / PA05-05 / W06 = NOT_SIGNED`；`production material WRITE = OFF` |
| Railway 最近只读观察 | Ledger Configurator 服务绑定 GitHub `main`，在线 1/1；服务最近 SUCCESS 部署 `5cfce97b-9745-4e62-9b64-d2b1e0a2eedf` 对应 `eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff`（**旧代码**）。**没有观察到 #1104 merge SHA 对应的真实部署**，不能宣称本次代码已上线 |

## 用户明确决策与适用边界

1. **插件模式 + 当前仍处于开发阶段**，不允许长期积累 Draft 和过程分支，尤其要避免跨聊天窗口因失忆重做已经完成的功能。
2. 先完成 PA05 **工程阶段性收口**；生产等级 K0 认证单独保留真实验收要求，不用假证据补齐。
3. 用户**进一步明确批准 #1104 合入 main**，知道 `main` 连接 Railway 名为 production 的在线服务、合并可能引发既有自动部署；不授权额外操作 Railway 配置、Secrets/SQL、生产停机/重启或开启 material WRITE。
4. 历史资料按 **短入口 + 详细索引** 保存。并行 BEX/CP03、Eidos、2D、插件治理工作继续正常推进；不修改 `project.status.json`、全局生成交接或其他 Owner 文件。

## 关键未决问题（不要假定通过）

- **R5-01**：同一生效 deployment 的 `drainingSeconds/overlapSeconds` 实际值、单位、来源、观察时间和独立核验人，**UNKNOWN**。
- **R5-02**：实际 Railway 运行部署的 PID1→Node 父子链、SIGTERM 能否到 Node handler、退出记录，**PRODUCTION_UNVERIFIED**。Railway 当前命令是 `npm start`；官方 NodeJS SIGTERM 排障页认为 package-manager 可能拦截信号，**属平台一般性文档，不是本服务的实证**。
- **R5-03**：独立授权的无真实数据测试环境、外部 Supervisor/cgroup、TTL/重启与完整 Worker/Caller/DBA/IdP 权限证据，**BLOCKED**。
- **Railway 发布关系**：读取到源分支 `main` 和 `checkSuites:false`，但自动部署实际开关、合并是否触发部署和为何部署 SHA 滞后，**未证实**；不能单凭“Online”当作最新代码已上线或安全验收通过。

## 新窗口应执行的最小任务

1. **先只读核对** GitHub 最新 main 是否包含合并 `3bb68a6a...`、#1104 MERGED、最后工程分支已删除；绝不恢复旧分支，不重新开发已经合入的 Host/PROCESS 修复。
2. **只读刷新 Railway** 目标服务的当前 deployment ID、commit SHA、源分支和健康状态；记录“main 与部署的差异”，不要为了消除差异未经许可主动 redeploy。
3. 按 [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 调用既有 R5 Operator 工作表收集 R5-01/R5-02；需要隔离实验时先取得真实 Owner/测试环境授权。确认 R5-03 独立监督者后再评估停机试验；禁用生产 parent SIGKILL。
4. **PA06** 可独立准备非生产研究/规划，不能因 PA05 工程合并而自动获得生产试点、WRITE 或全局安全签收。PA03 Agent 驱动导入 I01–I10 仍遵循 BEX/CP03 完成后的原依赖。
5. 查证细节和原始材料，优先读配套 [详细参考索引](PA05-K0-WINDOW-20261022-POSTMERGE-RESEARCH-REFERENCE-INDEX.md)，再读 [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 与 [旧研究索引](PA05-E01J4K-K0-WINDOW-FINAL-RESEARCH-REFERENCE-INDEX-20261021.md)，禁止凭聊天记忆补造来源。

**防复工规则：** CI 通过、已合并 main、已部署在线、生产认证完成是四种不同状态，必须分别找原始记录；不得相互推断。新窗口若只做接续，优先延续 #1092，不创建新的 PA05 代码 Draft。


## 2026-10-22 接续复核补充（动态只读快照，后续必须重新查）

- 最新 GitHub `main@23e391730c7606f3933fb31e8ffcb53c704aa191`，#1104/#1112/#1113 全部合入；最后 PA05 工程过程分支再次查询不存在，**不要复建**。
- Railway Ledger Configurator production 最新 SUCCESS/Online 仍为 deployment `5cfce97b-9745-4e62-9b64-d2b1e0a2eedf` / SHA `eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff`；当前 main 比在线 SHA 超前 **257 commits**。在线的不是可证实已合入的 #1104 版本；自动部署滞后原因 **UNKNOWN**。
- 此次仅用已连接 GitHub / Railway **直接只读 API** 核验，未重新查阅 Railway 官方原文；源级别和 R5-01/02/03 缺口详见[配套详细索引 §9](PA05-K0-WINDOW-20261022-POSTMERGE-RESEARCH-REFERENCE-INDEX.md)及 [#1092 新回执](https://github.com/jiangxng/EVO-App-Platform/issues/1092#issuecomment-6338734141)。
- K0、W06、PA05-05 仍 **NOT_SIGNED**，生产 material WRITE **OFF**。下一轮不重复调用同一受限接口幻想拿到 PID1/生效 drain；由实际 Railway Operator 提供部署关联脱敏只读回执，并在另行授权的独立非生产环境评估 R5-03。

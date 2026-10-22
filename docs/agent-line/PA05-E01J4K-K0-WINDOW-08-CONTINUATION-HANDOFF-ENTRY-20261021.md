# PA05 / E01J4J–E01J4K / K0 — WINDOW-08 换窗口简短交接入口

**日期：2026-10-21；状态：HANDOFF / K0 NOT_SIGNED；此为当时快照，不自动代表新窗口最新生产。**

> **新窗口先读本页，然后读 [WINDOW-08 详细研究、来源及决策索引](PA05-E01J4K-K0-WINDOW-08-CONTINUATION-RESEARCH-REFERENCE-INDEX-20261021.md)**。早期 WINDOW-07 及旧研究遗产全部保留，不从头研究 PG18/OAuth/Kubernetes Lease/NIST。
>
> **GitHub：** https://github.com/jiangxng/EVO-App-Platform ｜**文档分支：** docs/pa05-e01j4k-account-scope-20261020 ｜**Draft [PR #1071](https://github.com/jiangxng/EVO-App-Platform/pull/1071)**。本次详细索引的创建提交：d8e4b9b4dab776ca07f8742a790c771bd8823639；整个交接最终 HEAD 请以 GitHub 和本次最终回复为准。不要合并此 PR。

## 1. 一句话结论与安全边界

局部 PROCESS/Host shutdown 的工程证据已经充足到可停止重复补同类模拟测试；真正 K0 仍缺**权威完整 Worker/Runner/Caller 清单、独立于 Host 的 Supervisor、生产 deployment 生效 draining / PID1→Node SIGTERM 与停机收据、真实 PostgreSQL backend session 消失、Human IdP/DBA/凭据轮换与审计 Owner 原始签收**。切不可把 CI 绿灯、单 Host replica、合成签名或外部 Linux Runner 观察写成全域 STOP_CONFIRMED。

**K0、完整 E01J4、PA05-05 E01–E05、W06 均 NOT_SIGNED；production material WRITE 始终 OFF；#988 / #979 / #913 仍 OPEN。** 不启动生产 Validator、不读取生产 SQL/Secrets、不中断/重启/扩缩容/重部署、不更改 Railway draining/overlap、不清 stale lock、不故意 parent Host SIGKILL；四条活动 Draft 不合并/不删除；不改 project.status.json、docs/roadmap/HANDOFF-LATEST.md、BEX/CP03/Eidos/2D/其它并行 owner 文件。

## 2. 本窗口最后已核的具体快照（2026-10-21，下一窗口务必刷新）

| 对象 | 精确状态、来源 |
| --- | --- |
| GitHub main | 4e21fa8d0380168f9da0ae8a364020da1b9a3f90；来自其它窗口 [PR #1094](https://github.com/jiangxng/EVO-App-Platform/pull/1094) 的 identity-directory 初始化治理 |
| Railway Ledger Configurator | production deployment 7e794aba-21ec-4dab-b55c-601fa071e59d；与此 main SHA 相同；SUCCESS/Online、1 running/0 crashed、无 pending，**不是**本 K0 Draft 发布 |
| Railway IDs | project aee4643e-912b-4ca1-ae95-fe4ec64f5601；environment 98b8b20c-d791-4073-a11d-bb1f7f0a1cb3；service a8622238-480e-4da3-be6f-60fd0f3e18db；只读连接器可见仅 production，**不等于全组织无其它测试资源** |
| [#1071 文档](https://github.com/jiangxng/EVO-App-Platform/pull/1071) | 本交接写入前 HEAD 3da2fe8f49573f79a30dfca5e3803e9b5f516eda，**7/7 checks（一次单 job rerun 后）**；本次新增文件产生新 HEAD，需要以最新 commit 重新核查 |
| [#1074 Host shutdown](https://github.com/jiangxng/EVO-App-Platform/pull/1074) | e2e4af922c87b985f9834b592b86556d0e28abac，45/45 checks；Lightweight Host 新专项 6/6 PASS，304/304 原生 Host 测试 PASS。**Draft，不在生产** |
| [#1081 负面竞态](https://github.com/jiangxng/EVO-App-Platform/pull/1081) | a1e8a0941ff5b796816aaea0904b89533191a239，5/5 checks；PASS 表示旧缺陷被**正确复现**，**不得合并** |
| [#1082 PROCESS 正向](https://github.com/jiangxng/EVO-App-Platform/pull/1082) | eb4743e8ed34cf3cd748c3f79781d092c62712f4，5/5 checks；11 项真实本地 PROCESS 局部停机，外加只读/synthetic 不同等级测试，仍 Draft |
| [#1092 外部 Operator](https://github.com/jiangxng/EVO-App-Platform/issues/1092) | 本窗口新建并追加 GitHub Actions Caller 工作流源码证据；最后核为 OPEN、无独立 Operator 回执/assignee；不能据此认定已指派生产负责人 |

## 3. 本窗口真正完成的工作

1. [R5 Operator 取证文档 §7–8](PA05-E01J4K-K0-RAILWAY-DRAINING-PID1-OPERATOR-EVIDENCE-REQUEST-20261021.md)：直接核 Railway 官方 CLI/API 原文，纠正“假定 ServiceInstance 上存在 drain 字段”的草案；授权 Operator 须先用实时 schema，再核**指定 deployment** 的 effective draining/overlap 与来源。
2. [#1071 CI 正反证据](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39546299166/job/119045130566)：首轮 E01J2 子进程 readResult 20s timeout，6/7；[仅一次单 job rerun](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39546299166/job/119046162052) 28/28 PASS、0 skip，最终 7/7。**根因未确认**，不隐去首次失败。
3. [#1074 精确回归新增](https://github.com/jiangxng/EVO-App-Platform/commit/e2e4af922c87b985f9834b592b86556d0e28abac)：真实 Host server.ts 5s 兜底必须在第一个 await 之前、计时器 referenced、异常退出不报零；[原 job](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39547720712/job/119049576795) 6/6 PASS。既有 J4J 已实际对**非生产 Node Host** 发 SIGTERM 并验证临时锁释放，避免再次重复测试。**风险未消除**：PROCESS stop 放在顺序清理链末尾，早段 hang 可在执行 child stop 前发生 Host watchdog 非零退出。
4. #1081 是历史**反证**而非待合并修复；#1082 是正向候选但**与 #1074 未联合运行**。GitHub #1082 虚拟 merge SHA 833b8f06 的第一父提交仍是旧 main@4d291fb3，不能当作当前 main 合并证据；其单一生产文件在更早 main@192b1948 的 blob 与旧 base 相同，12 个新增文件无同路径碰撞。下次重查现时 main。
5. [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 明确 Infra/Runtime/Supervisor/IdP/DBA Owner 需交付的原始证据；本窗口又校验部分生产 GitHub Actions 调用者，EOG MOBILE_READ 确有源码断言的 POST /v1/actions **READ**，其它生产浏览器/缓存工作流受不同触发器重跑。**能访问生产路由 ≠ 有权 PA05 material WRITE**；153 个 workflow 不是 153 个生产调用者。完整 Caller 权威名单仍未签收。
6. 将所有本窗口来源的原始链接、日期、阅读级别、精确 SHA/CI、方案比较、相互冲突和未决责任集中到 [WINDOW-08 详细索引](PA05-E01J4K-K0-WINDOW-08-CONTINUATION-RESEARCH-REFERENCE-INDEX-20261021.md)，没有覆盖 WINDOW-07 或其它 owner 工作。

## 4. 下一窗口从哪里继续（严格优先级）

1. 按仓库 [AI-BOOTSTRAP.md](../../AI-BOOTSTRAP.md) 恢复项目权威：project.status.json → docs/roadmap/HANDOFF-LATEST.md → LLM.md → llm.foundation-map.json → [Agent HANDOFF](HANDOFF.md) → 本短入口与配套详细索引 → [PA05 认证基线](PA05-CERTIFICATION-BASELINE-20261015.md) / [K0 已选架构](PA05-E01J4K-TRUSTED-MULTIWORKER-STOP-AND-CREDENTIAL-GOVERNANCE-20261020.md) / [K0 证据表](PA05-E01J4K-K0-STOP-AUTHORITY-EVIDENCE-WORKSHEET-20261020.md)。
2. GitHub/Railway 只读刷新主线最新 HEAD、对应 deployment/SUCCESS 状态、#1071/#1074/#1081/#1082 的 Draft 与 CI；#1092 是否有新的**真实外部 Owner 回执**；切记别复用历史 deployment ID 签现值。
3. R5-01：Infra Operator 报具体 deployment 的 effective drainingSeconds/overlapSeconds 及来源；现场 GraphQL schema 先查再读。R5-02：真实同 deployment image/PID1/PPID/Node signal reachability，缺权威读数保持 UNVERIFIED。
4. R5-03：**只有取得合法独立非生产环境、专属 cgroup/进程隔离、在父 Host 死后仍存活并可执行 TTL 回收的 Supervisor/外部回执权威**，才可规划 parent Host SIGKILL。随后核冻结全 Worker/Runner/Caller、PG session/backend、IdP/DBA/credential/audit。
5. 联合工程门禁：当前 #1074 与 #1082 可以继续做**非生产、不合并**的源码/测试设计；必须先解决顶层清理顺序与真实进程回收兜底，刷新共同基线与双 PR 行为兼容证据；#1081 只保留负面研究，绝不可加入正常 CI 主线。
6. 继续用里程碑状态表沟通；达到两次无效同类尝试则写明假设/证据/选择/区分性下一测，别重做相同的本地 mock、Pg18/OAuth 研究或已有 J4J SIGTERM。

## 5. 本窗口没有取得/没有保存到 GitHub 的材料

没有生产 effective draining/overlap 生效值及来源截图、真实 Railway PID1→Node SIGTERM 原始回执、独立受信 Supervisor 对精确 Worker 终止签名、组织范围 Worker/Runner/Caller 冻结名单、production PostgreSQL session absence、Human IdP/DBA/MFA/credential rotation/audit 签收。**这些不是已完成却忘了保存，而是尚未由权威方提供**。本窗口没有真实截图/PDF/录屏附件路径可引用；原始 GitHub Actions job 只记录了可核 URL/sha/marker/统计，**没有将完整日志作为 Git 附件永久备份**，这些网页日后可能受保留期影响。不能虚构出处/路径。

**底线不变：** R5-01 UNKNOWN / R5-02 生产 UNVERIFIED / R5-03 BLOCKED；K0 / E01J4 / PA05-05 E01–E05 / W06 NOT_SIGNED；production material WRITE OFF。四条 Draft 不合并不部署。

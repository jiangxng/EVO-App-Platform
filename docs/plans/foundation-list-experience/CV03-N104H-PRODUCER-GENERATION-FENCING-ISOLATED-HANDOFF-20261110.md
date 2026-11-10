# CV-03 / N1-04h — Host Producer SQL 身份与 generation fencing：隔离工程交接

> 2026-11-10；从 `main@5c6e4868317b1d829c6e63ca2ab3812570c25251` 接续，[PR #1205](https://github.com/jiangxng/EVO-App-Platform/pull/1205)；**N1 = NOT_CERTIFIED / CI-ISOLATED ONLY**。
> 正式 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、SAVE 403、未注册页面 GET 404 均保持；不修改并行 PR #1184 的三个 Owner 文件，不创造独立权限/列表框架。

## 1. 已核对的事实 / 研究等级

本轮直接读取的 **G / 原仓库源码**：
- [N1-04f 测试授权 T0 + 单 Actor T3 快照](../../../tools/cv03-n104f-isolated-authority-tx-outbox.mjs)：原状态 `generation` 只允许固定 `CI_GENERATION_1`；测试 outbox 的 Authority Epoch 由 fixture 分配，真实 PA05 生命周期回调并不与 SQL 状态事务一致。
- [N1-04g SQL outbox-bound 事件闸门](../../../tools/cv03-n104g-isolated-outbox-bound-delivery.mjs)：能核验已持久 outbox 与授权行，但此前同样只接受固定 generation，缺少**物理 producer login / generation fencing**。
- [Manager 生命周期 store](../../../manager/store.ts)：当前 memory/file store 的单次操作与测试 PG18 outbox 无共同事务；[真实 Manager disable/enable](../../../manager/service.ts) 保留原 Feature/Capability Operation 路径。
- [前次隔离 PG18 测试](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs) 和 [原决策索引](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md)：N1-04g 在最终提交 22/22 PASS 只是 outbox-bound 证据，不是生产 Host 切换或跨进程生产者身份验收。

本轮**D / 工程推导**：如果新旧 Host 并存、旧进程保留测试签名凭证，仅靠单 Actor epoch 与测试 outbox 不足以证明旧生产者已失权；安全 Owner 应提供持久 generation / producer fencing，轮换时在已知授权事实与镜像间建立明确失败关闭时刻。本轮未重新访问外部 EX01–EX08 来源，不能宣称第三方新证据。

## 2. N1-04h 新增隔离协议与验收点

[新独立 SQL builder](../../../tools/cv03-n104h-isolated-producer-fence.mjs) 在随机 `cv03_` CI PostgreSQL18 schema 安装，复用原 N1-04f authority T0/outbox、N1-04g 事件闸门和原 Manager/Provider 校验：

| 步骤 | 必须成立的安全性质 | 试验限制 |
| --- | --- | --- |
| **P0 Producer 身份登记** | 持久 `source + active_generation + fence_epoch + producer_login`；`SECURITY DEFINER` 的 T0 函数使用数据库 `session_user` 与 Owner 所登记 SQL LOGIN 核对，不能由请求 JSON 伪造。 | 这只是受管 CI SQL LOGIN，不是正式 PA05 Host 身份证明/KMS。 |
| **P1 可信 T0 入口** | 旧 ProducerA 只有在 generation1/fence1 当选时可按真实 Manager 授权决策提交 T0；ProducerB、未匹配令牌、直接调用原 T0 或读表均拒绝；轮换与 T0 共享 fence 行锁，顺序明确。 | N1-04f 的基本事务函数仍属于隔离 Owner 内部受信步骤。 |
| **P2 Owner 轮换 CAS** | 只有 Owner 可将 generation1/fence1 轮换到 generation2/fence2、生产者登录 A→B。一个 PG 事务对**所有现有 Actor+Enterprise+Operation** 强制 DENY、`mirror_healthy=false`、移除旧租约、增加各自 authority epoch、生成不可变 DENY outbox tombstones；重复/旧期轮换拒绝。 | 本轮只验证两代，单来源/单 PG fixture；非生产全量迁移协议。 |
| **P3 投递 fencing** | 测试 Delivery SQL LOGIN 不能直调无 fencing 的旧 N1-04g/N1-04c；只能调用新 fenced 入口。旧世代完整合法事件也被拒绝，旧 ProducerA 即便知道旧凭证也不能再写入权威行。 | signer 仍为测试 HMAC；真实多 Host 受限身份凭证、轮换、重放窗口未签收。 |
| **P4 快照恢复** | 改动原 N1-04f/N1-04g 的 `generation` 校验以接受**仅两种测试 generation**，旧 generation 不允许在权威行回退；真实 Manager 重新 `enable()` 后新 ProducerB 发放新 generation2 ALLOW，镜像仍 unhealthy，须用经 HMAC 验签、与当前 authoritative state 相等的 actor/operation 完整快照才能解锁。 | 仅 `SINGLE_ACTOR_OPERATION` 快照，缺真实 PA05/授权中心全量 watermark、tombstones/fence 轮换证据。 |

### 真实 PG18 负例覆盖

- ProducerA/B 为不同真实 PostgreSQL LOGIN，只有经单独 GRANT 的新 `cv03_n104h_test_commit_fenced` 可调用；没有原始 T0、Owner 表权限。
- Source/Generation/Fence/SQL session 身份不一致则拒绝，包括旧 Host 在新代际仍尝试写入、由新 Host 冒用旧 generation、重复轮换 CAS。
- 模拟一个持有未来截止时间的旧 `enabled=true` Mirror，**生产者轮换提交时同步清零**，不等待 outbox 网络投递或 lease 过期。
- 跨企业与同主体 HUMAN/AI 的所有 scope 都有独立 epoch 增量和 DENY tombstone；旧世代事件不能在轮换后恢复旧 ALLOW；重启连接仍读取到 generation2。
- 新代际已持久的 DENY tombstone 因 DB epoch 已提高属于无副作用重投；新 generation2 ALLOW 要通过原签名完整快照恢复后才可允许下一次 WRITE。
- 原 N1-04f/04g：PG18 既有测试必须回归全绿，不引入新 skipped；日志中的 `CV03_N104H_*` 与 22/22 统计以**最终 PR HEAD Actions**为准。

## 3. 未解决的生产安全准入（不冒充已完成）

1. **权威事务未打通**：测试的 SQL `test_authority_state` 及轮换事务不是实际 PA05 `FileLifecycleStore`、AuthorizationProvider 的事实源；Manager 的 Feature 状态可变而测试 SQL 未必获知。把这个 SQL 模块在生产部署会引入错误的新权限权威。
2. **Producer Login/KMS 未签收**：生产 Host 真正多实例的身份凭证分发、不可转移认证、跨节点 lease、密钥保管轮换、SQL Primary/GRANT 和责任 Owner 均未完成。
3. **完整恢复未覆盖**：本轮 global generation 轮换对已知 scope 逐行 DENY，但真实系统需要完整主动登记、离线 Scope tombstones、源 generation/watermark、数据库重建和旧主脑 fencing；`SINGLE_ACTOR_OPERATION` 快照不等于企业权限全量快照。
4. **不可实现的即时保证**：在 SQL 还没有获知正常业务撤权且旧镜像租约未到期之前，本轮代码仍不能证明即时撤权；generation rotation 事务可在其提交时强制失败关闭，但**不能替代真实 PA05 撤权事件可靠到达/跨存储一致性**。
5. 正式 Saved View Feature、Human 390px、个人代理真实外部 LLM 与生产运行时仍 **OPEN**；正式 SAVE OFF/403 + GET 404 不变。

## 4. 证据、并行治理与下一轮接续

本分支新增 `tools/cv03-n104h-isolated-producer-fence.mjs`、更新 N1-04f/N1-04g SQL 构造器（两代 generation + 回退拒绝）、扩展原 [PG18 T0/T3 测试](../../../tests/agent-line/cv03-n104f-authority-tx-outbox-recovery.test.mjs)，只调整原 PG18 Workflow 触发路径，增补本交接和原 [决策索引](CV03-N104D-WINDOW07-RESEARCH-DECISION-REFERENCE-INDEX-20261110.md)。**不编辑 #1184 Owner 的文件**。不得直接 push main。

CI 未结束时不能写 PASS；仅最终 PR HEAD 全部相关检查成功、无测试 skipped 后可解除 Draft/合并，再用仓库自带 `branch-hygiene.yml` 进行 verified merged SHA 清理。正式 N1 的后续工作需先取得 PA05/AuthorizationProvider/DB 安全 Owner 对真实权威事实源、身份/密钥和全量恢复协议的决定与真实环境授权，不应在无依据时继续复制测试权限中心。

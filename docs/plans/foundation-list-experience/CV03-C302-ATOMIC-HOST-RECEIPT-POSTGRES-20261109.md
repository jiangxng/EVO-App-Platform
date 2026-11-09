# CV-03 / C3-02：同事务资源修订与不可变 Agent 回执（2026-11-09）

> **状态：ISOLATED_CODE_IN_PR / FINAL_CI_PENDING / REAL_HOST_ISSUER_OPEN / PRODUCTION_WRITE_OFF。** 工程为 [PR #1182](https://github.com/jiangxng/EVO-App-Platform/pull/1182)，继已合 [#1180](https://github.com/jiangxng/EVO-App-Platform/pull/1180) 和 [#1181](https://github.com/jiangxng/EVO-App-Platform/pull/1181)。**不得声称自然语言模型、Human UI、真实 Host 独立回执签发或生产部署已通过。**

## 决策与原因

单独在保存前 `await assertHostWriteReceipt()` 不是真正的 durable receipt：资源 CAS 成功而回执落盘失败，或者反向顺序写入，都会导致未知结果下错误重试。只有将**业务资源行修订与成功证据放在同一个原子事务**，才能证明“资源提交成功”与“历史成功回执存在”不可分离。原有 `AgentActionReceiptV010` 已有 `receiptId`、`idempotencyKey`、`inputDigest`、Principal/Context 和 `SUCCEEDED` 结构，因此**复用其事实模型**，不新增平行 Agent 回执标准、Saved View 数据库或通用列表框架。

## 真实代码责任

| 层 | 这次变更 | 明确边界 |
| --- | --- | --- |
| [资源条件契约](../../../contracts/enterprise-resource.ts) | 对现有 async 条件资源 Provider 增加**可选** `putIfRevisionWithReceipt(input, hostReceipt)` 与 `getCommittedWriteByIdempotencyKey(query)`；结果包括已提交 Resource、Agent Action Receipt 和是否 replayed | 不改现有同步 Host Repository；旧 `putIfRevision()` 仍能用于不需要回执的场景，但 Saved View WRITE **不再使用无回执后备路径** |
| [摘要算法](../../../providers/enterprise-context/resource-receipt-digest.ts) | canonical JSON 的 SHA-256，确保 `expectedRevision`、主体、来源配置和所有提交字段同一 `inputDigest` 绑定 | 输入 `idempotencyKey` / Digest **不来自模型或普通 Action values** |
| [PostgreSQL 资源 Provider](../../../providers/enterprise-context/resources-postgres.ts) | 同一隔离 `cv03_*` schema 显式创建 `cv03_resource_receipts`；唯一 `context_id+idempotency_hash` 与 `receipt_id`；`pg_advisory_xact_lock` 序列化同 key；单 PG 事务完成 CAS 与不可变回执 INSERT；数据库 trigger 拒绝回执 UPDATE/DELETE | 凭同一数据库共享事务，不依赖文件锁；未自动接入任何生产 Host、现有正式数据库或多数据库原子提交 |
| [私有视图 Host 操作](../../../providers/enterprise-context/personal-saved-views.ts) | 改为只接受由可信 Host 注入的 `issueHostWriteReceipt(ctx,request,{input,inputDigest})`，强制由数据库同事务提交、再返回有限的 `receiptId/status/resultDigest` 和 `replayed` | 无签发器、非 PG/缺同事务方法均 fail closed；**只有隔离测试中的 Host issuer，真实生产签发器尚未接线** |
| [真实 PostgreSQL 18 回归](../../../tests/agent-line/cv03-resource-postgres-atomic-receipt.test.mjs) | 验证同 key 两 OS 进程只提交一次、不同 key 同 revision 冲突、丢 ACK 后重连 readback、不变回执与后续资源编辑互不影响、直接改写/删除回执拒绝、回执 INSERT 失败则资源整笔回滚、伪造 actor/digest 拒绝 | 自测试的 Host 发行材料不等于真实登录、外部 LLM 运行或实际生产 SQL 权限证明 |

原 [C3-02 隔离 Host 测试](../../../tests/agent-line/cv03-personal-saved-view-postgres.test.mjs) 同步调整为**显式测试 Host 发行材料**，由真实 Business Dictionary Owner、Host ActionRouter、Personal Agent `invoke.write`、真实 PostgreSQL transaction 组成。不能因为这项测试使用了正式 `AgentActionReceiptV010` 的类型，就推论 PA05 Host 正式 permit issuer、实际生产 durable Agent receipt service 已参与。

## 重试与异常处理

- 同一可信 `receiptId+idempotencyKey+inputDigest+Principal/Context` 重试：如果事务已提交，返回已保存的**历史资源与回执**，不再次修改当前行；如果 key 被另一输入复用则 `CV03_RESOURCE_RECEIPT_IDEMPOTENCY_CONFLICT`，不覆盖。
- 客户端丢失 ACK：`getCommittedWriteByIdempotencyKey` 仅在资源地址、主体、actor、Digest、receiptId 同时匹配时返回历史成功证据；未找到或出现未知错误不能直接判定原写入失败，应由可信 Host 决定是否恢复/重试。
- 回执落库失败：整个 PostgreSQL 事务回滚，包括此前已执行的 Resource insert/update；数据库不可变 trigger 不允许事后抹除成功历史。
- **未解决**：多数据库不同写入权威、真实 Host-issued permit、强认证 Key/Secret、撤权/失效源在正式服务器的时序竞态、跨节点部署 PostgreSQL 主库认证和正式 Feature 注册；这些都继续阻止生产 Saved View WRITE。

## 阶段与下一轮

真实 PostgreSQL 18 新专项 + 原 C3-01/02 tests 必须以 #1182 **最终 SHA 的 CI**为准；核验后可以将“原子 Resource+Receipt 同事务”和“隔离 Host/Agent 调用”列为 CODE_TEST_PASS，不能将 **C3-02/HUMAN_PASS** 或 **CV-03/DONE**。下一步由现有 Host/PA05 Owner 接线真实签发器、应用级权限再校验与生产回执对账；随后由 Eidos Owner 做有权视图入口、桌面/390px Human 验收。共享视图 C3-03 与真实自然语言 C3-04 均未实现。

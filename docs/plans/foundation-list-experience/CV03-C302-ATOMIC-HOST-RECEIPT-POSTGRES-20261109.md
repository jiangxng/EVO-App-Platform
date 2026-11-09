# CV-03 / C3-02：同事务资源修订与不可变 Agent 回执（2026-11-09）

> **状态：ISOLATED_CODE_MERGED / REAL_PG18_7_OF_7_PASS / HOST_SIGNED_PATH_TESTED / PRODUCTION_HOST_ISSUER_UNWIRED / PRODUCTION_WRITE_OFF。** 工程为 [PR #1182](https://github.com/jiangxng/EVO-App-Platform/pull/1182)，继已合 [#1180](https://github.com/jiangxng/EVO-App-Platform/pull/1180) 和 [#1181](https://github.com/jiangxng/EVO-App-Platform/pull/1181)。**不得声称自然语言模型、Human UI、真实 Host 独立回执签发或生产部署已通过。**

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

## 5. Host 签名准入补充（PR #1183，2026-11-09）

初版 #1182 强制使用 `AgentActionReceiptBeginInputV010` 与 PG 同事务不可变证据，但此 Plain-Object 仍能由**未经授权的进程内调用方**构造，所以 **Host 身份准入没有自动解决**。后续 [PR #1183](https://github.com/jiangxng/EVO-App-Platform/pull/1183) 为这项隔离 Owner Write 增设：

- [Host 专用签发器](../../../manager/cv03-personal-saved-view-host-issuer.ts)：由当前 `AppManagerService` + `AuthorizationProviderV010` 复查已安装且激活的 `WRITE` Capability Operation、`writeSafety`、HUMAN/PERSONAL_AGENT exposure、真实 Principal/Enterprise 与完整 Input digest；按 `sourceInteractionId` 等上下文确定幂等身份，签出域隔离 HMAC-SHA256 proof。
- [原 PG 资源 Owner](../../../providers/enterprise-context/resources-postgres.ts) 只有注入可信 verifier key 后，才接受 `{receipt,proof}`；使用固定域、`keyId`、32 字节以上密钥下限与恒定时间签名比较，**缺密钥、未知 keyId、篡改签名均在数据库写入前 fail closed**。未影响原 C3-01 READ 或非回执版 CAS。
- [真实 PG18/Host 集成测试](../../../tests/agent-line/cv03-personal-saved-view-postgres.test.mjs) 验证当前授权、撤权、插件停用、跨主体和签名等负例；[原同事务测试](../../../tests/agent-line/cv03-resource-postgres-atomic-receipt.test.mjs) 也验证无 verifier 或伪造 proof 的拒绝；继续保留两个 OS 进程的同一事务竞赛与 lost ACK。
- [同 PR 的 Human UI 设计边界审核](../../ui-design-reviews/cv03-host-signed-receipt-admission-20261109.md) 明确 **未更改 UI、不能视为 Human 验收**。

**重要保留门禁**：`manager/server.ts` 当前正式 Agent Receipt Service 采用 JSONL/Memory（配置 `APP_PLATFORM_AGENT_ACTION_RECEIPT_FILE`），并**没有**与 CV-03 PostgreSQL 在一个数据库事务里自动关联；#1183 是隔离 Host 签名代码，不是生产签发许可/PA05 跨数据库物理授权。生产 secret/key rotation、业务 SQL 登录物理权限、正式 PG/备份/迁移、Eidos/390px/真实模型调用仍然 OPEN，生产 Feature 继续不注册。**#1182、#1183 的最终 HEAD CI 均已单独验证为 10/10 SUCCESS**；不能用隔离签名测试冒充生产真实 Host permit。

## 6. 两项 PR 的最终合并与测试证据（2026-11-09）

| 工程纵切 | 最终 HEAD（已核对） | GitHub CI（同 HEAD） | main merge commit |
| --- | --- | --- | --- |
| [#1182](https://github.com/jiangxng/EVO-App-Platform/pull/1182) — 资源 CAS 与不可变 Agent 回执同 PG 事务、历史 readback | `c3b10d37daf3840e8909895fa7a827d11cfd9049` | **10/10 SUCCESS**，含真实 PostgreSQL 18 专项 **7/7 PASS、0 SKIP** | `d982c1655a02260b309d401d52530dd7e5614c32` |
| [#1183](https://github.com/jiangxng/EVO-App-Platform/pull/1183) — Host live 授权复核 + HMAC-SHA256 签发准入、数据库验签 | `36801d9362f461fe101d6d12610268c8451f2ce3` | **10/10 SUCCESS**，含真实 PostgreSQL 18 专项 **7/7 PASS、0 SKIP**，新增签名/密钥/撤权/停用负例 | `91cef31fa6518f328b1480d897afe0ef47339f57` |

实际 GitHub 检查包括 Platform `protocol-and-core`、`lightweight-host`、`continuity`、`human-ui-design-review`、`isolated-postgres-resource-cas` 与相关插件 workflow；**机器 UI Review PASS 仅意味着审查文档合规，绝非浏览器/Human 签收**。

**最终判定：** 已交付可复用的隔离代码与真 PostgreSQL 交易/签名证据；`manager/server.ts` 正式 Host 未注册 C3-02 Feature、未接入签发密钥/实际生产数据库，也未完成数据库业务 LOGIN 的物理授权隔离。当前 Host 的 Agent receipt JSONL/Memory 与本 PG Owner 不是原子双写。跨数据权威一致性、生产身份/密钥轮换/迁移/回滚、真实 Eidos 保存/切换 UI、LLM Tool Run 和 390px Human 签收**仍全部 OPEN**。不得仅凭 #1182/#1183 已合就启用生产 WRITE。

# PA-02A — 正式Host接入前的受控异步桥接与Run兼容性验证（2026-10-13）

Document class: AGENT_LINE_INCREMENTAL_STAGING
Status: EXPERIMENTAL_BRIDGE_CI_PASS_MERGED_MAIN / FORMAL_HOST_V010_UNCHANGED

## 证据与目的

在PA-02A跨进程恢复、PA-02B执行租约和PA-02C取消屏障独立实验已经入main后，复核现行 `manager/server.ts`、`contracts/platform-services.ts`、`contracts/agent-run.ts`、`manager/agent-run-store.ts` 与后端Action/Run源码。正式Host一直在用Sync V010；数据库 proof 不支持直接替换同步端口。

本PR新增**从可信Host已解决的 Principal + Context 到 V020 scope 的窄桥**，并依靠现有V010 reducer复播数据库Run事件，使后续正式迁移设计能够验证旧Run状态的安全兼容。该模块没有进入任何启动路径或正式插件，默认不分配额外数据库连接，不影响轻量宿主。

## 隔离协议检查

1. 仅HUMAN/AI且真正Host resolved的Principal和ActiveContext能构造scope；其他actor、停用/归档企业、企业ID/Context不一致及非所有人的PERSONAL拒绝，不能让请求体自造企业权限。
2. Task digest基于版本化、稳定排序的完整任务和来源坐标，重试时新runId/eventId不触发重复创建；修改importJobId等字段必定拒绝，不能继续沿用list(100)扫描。
3. 读取数据库事件后用**现行V010 reducer**还原真实Run；事件追加前复播预校验终态不可改，随后交由Postgres revision CAS做最后写入竞争判断。
4. 在隔离Postgres服务上运行真实重新打开Repository、作用域负面测试、已终结Run重放/非法追加检查。CI需按最终PR head实际日志核证。
5. **明确不做**：manager/server.ts正式绑定、ActionReceipt完整JSON字段/合法状态的双向迁移、真实LLM执行、事务统一Outbox或worker租约、历史全量迁移、生产连接及部署。

## 设计缺口与决定（不能把桥接当完成）

- 现V020 proof Receipt仅存标识、摘要及状态，丢失V010返回要求的操作/Owner/结果实体明细；不得宣称可直接顶替ActionReceiptServiceV010。
- 异步Run Host适配必须修改Run Executor/回执/Thread send + Resume及Conversation呈现，不可用同步包装SQL Promise绕过异步。
- 写入协调器PA-02B必须和真正Run所有状态事件同原子纪律接通，并由业务Owner提供幂等与已写入核验；PA-02C必须把安全取消与Run终态联动并经真实多进程Browser/Host验收。
- 这个PR目标是新增可以稳定演进的**无副作用接线基件**，不将PA-02A/B/C标记为正式产品完成。原14外部参考仍H级，没重读其原文。

后续开发依赖需以GitHub合并后main准确SHA刷新；不动共享 `project.status.json`、TR/2D/生产。
## 合并后验收凭证

[#802](https://github.com/jiangxng/EVO-App-Platform/pull/802)准确head `fd5238dc1016b09c8514f45cfa81f6269eca5cbf` 的 [Host Bridge Postgres CI 38348081884](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38348081884) SUCCESS，Platform CI/Continuity/Lightweight Host均通过；merge `858e3119b68bce403b0b59b002a67c0b08b028ce`，临时branch已删。正式server仍用Sync V010。

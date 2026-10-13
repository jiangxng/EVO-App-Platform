# PA-02C — 持久取消请求与未知写入保护隔离验收（2026-10-13）

Document class: AGENT_LINE_INCREMENTAL_PROOF
Status: ISOLATED_CANCELLATION_GATE / CI_PENDING / NOT_FORMAL_RUN_CANCEL / NOT_PRODUCTION

## 先核实既有能力

- 现有 V010 的 Run reducer 已认识 `RUN_CANCELLED`，但执行器没有可被跨进程一致执行的取消意图/租约原子协议；`manager/server.ts` 仍使用同步Run/Receipt。不可只因类型有 `CANCELLED` 即宣称用户点击后一定安全取消。
- [PA-02A进程恢复](PA02A-CROSS-PROCESS-RECOVERY-20261013.md)和[PA-02B fencing](PA02B-FENCING-UNKNOWN-WRITE-20261013.md)是可靠性基础，真实业务owner核验与Host运行时绑定尚未到位。

## 本阶段实验性实现与精确语义

- 独立 PostgreSQL `pa02c_cancellations` 表按Host可信scope + runId保存首次取消请求人、原因、REQUESTED/CANCELLED状态；重复请求保留原始审计内容，不让重试覆盖。
- 取消请求已持久化后，PA-02B协调器拒绝新WRITE准备和启动，拒绝新的普通lease认领；失联旧Worker不再拥有完成权。取消请求前已经启动的WRITE仍可以凭有效fence完成真实已知结果；不能武断撤回外部系统中已生效的动作。
- `completeSafe` 检查Worker不再持有效租约、无INVOKING或UNKNOWN写入，才把**隔离协调器记录**置为CANCELLED。活跃Worker或未确认写入一律拒绝终态；UNKNOWN必须等业务owner核验，不可因取消按钮或时钟超时自动升级为成功。
- 隔离测试覆盖：空闲取消、重复取消审计、准备但未发送WRITE、取消中拒绝任何新WRITE、等候租约退出、未知写入阻塞终态、已完成业务WRITE不可逆、跨企业查询隔离和重新连接后持续状态。
- 此处 `CANCELLED` **仅是协调器请求事实**，不是正式Run的 `RUN_CANCELLED` Event；不存在正式Host操作按钮、Worker跨机器恢复或生产迁移的完成凭证。数据库测试使用一次性schema，不发外部业务命令。

## 尚需实际执行的最后门禁

1. 在正式Host的权威Run状态机里，将持久取消请求、Run事件、可恢复工作状态与fencing以同源协议集成，并证明异步process crash、lease过期和请求重复都不会让已取消Run复活。
2. 将真实在途模型推理、安全中断、外部写入与Receipt UNKNOWN和取消UX按真实浏览器和多worker集成验收；与已知已完成业务效应明确区分。
3. 完成安全迁移/保留策略、实际Host可信身份和跨租户攻击测试、性能、回滚及隔离部署；这些仍不是本实验的授权范围。
4. 没有完成上列验证，不准将PA-02C或整体PA-02标记为功能完成/生产可用。

## 后续证据记录

本次源代码PR与其最新commit、GitHub Actions build/PostgreSQL运行日志是可核证据；CI未通过前不得填写PASS。旧外部14个参考链接维持H级历史索引，不虚构已读网页原文。

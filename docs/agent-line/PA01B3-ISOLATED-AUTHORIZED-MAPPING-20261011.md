# PA-01B3：隔离真实 Agent 字段映射能力调用与回执 — 2026-10-11

Document class: HISTORICAL_SNAPSHOT

## 验收结论与边界

**状态：`PA01B3_ISOLATED_CAPABILITY_WRITE_BROWSER_PASS_DETERMINISTIC_TOOL_CALL`**。此结论独立于 PA-01B2 8/8 浏览器门禁；不代表真实外部模型自主语义推理、生产就绪、审批流程闭环或持久化恢复通过。

- 代码前提：Platform PA-01A/B1/B2 #575→#577→#579，B2固定源码head `db555162370b3c3c992c7aef88f605f9ebf2d0cd`；B2浏览器验收Draft PR [#638](https://github.com/jiangxng/EVO-App-Platform/pull/638) 实际通过head `56a18615efdd6029ddf9057b85510b43b835fe8c`。
- 本次专项 Draft [PR #691](https://github.com/jiangxng/EVO-App-Platform/pull/691)，分支 `agent/pa01b3-authorized-mapping-receipt-browser-20261011`，head `9091c96ea5a74a0d49cd8af51fedb2ba620895f8`，base 为 #638 测试分支。实现源文件保持 #579 不变。
- [完整 GitHub Actions 38097917163](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097917163)，job `114347592242` **SUCCESS**。先复跑真实 Host + Chromium B2 的 8/8 PASS，然后额外通过 PA-01B3 的真实 Capability WRITE 测试。[报告、浏览器截图与fixture artifact 11687201264](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097917163/artifacts/11687201264)。
- `127.0.0.1` 本地模型fixture只在当前业务作业注入一次规范化 OpenAI Responses `function_call`，模型名 `evo_capabilities_invoke_write`，目标是正式 `enterprise.data-import.mapping.apply`，而非模拟鼠标或直接调用存储。
- 隔离 Host 的授权overlay仅允许该测试主体作为 `AI` 在 `enterprise.data-import.job` 范围执行 `data-import.read/write`；仅测试runner设定，未修改产品授权代码或生产policy。
- Eidos页面按钮→Personal Agent线程/Run→Provider工具调用→平台授权Capability调用→Data Import对独立测试作业应用映射并执行 dry-run→Run回复包含结构化 `assistanceResult.actionReceiptIds`→页面刷新1次。不是通过解析模型成功文案判断结果。

## GitHub日志可核结果

```json
{
  "mappingOrigin": "AGENT",
  "jobState": "DRY_RUN_READY",
  "mappedColumns": ["往来编码", "往来名称", "主体类型"],
  "browserSourceRefresh": 1,
  "actionReceiptIds": [
    "agent-action-receipt:f648b1cd9a7edf5ac8083e208e0a88ac899bb27cde2c2af5251632f15024667d"
  ],
  "realHostCapabilityInvoke": true
}
```

作业ID及Receipt均为一次性测试实例，请勿用它们推断后续生产资源存在。这里的ActionReceipt记录 **一次 Agent 发起且被授权的映射更新与dry-run操作**，并非确认批次导入落地：`DRY_RUN_READY` 与 `COMMITTED` 不同。只有正式业务提交才会产生主数据改变，本次B3验证没有确认提交。

## 严格未覆盖

1. 真实外部大模型的语义映射质量、对陌生表头的零样本理解、模型多轮自检；此测试由确定性fixture提供已知字段。
2. 受权限拒绝/租户错配下的完全无副作用专项浏览器门禁，仍需另外的fail-closed例子；不能把当前正向授权证明等价于负向验收。
3. 富文本或图形Canvas草稿；首次落库前正式人审以及消息提案/回执的统一UX。
4. Run/Receipt跨进程数据库唯一键、租约、outbox、取消、迁移或生产恢复。

## 下一步

继续PA-01B3负向授权与隔离证明；PA-02A先从同步接口迁移到**并行异步端口**及PostgreSQL唯一性/恢复的独立proof，不改共享Host启动路径。追加研究如需要应补已读版本与证据级别，避免重新宣称旧外链已读。

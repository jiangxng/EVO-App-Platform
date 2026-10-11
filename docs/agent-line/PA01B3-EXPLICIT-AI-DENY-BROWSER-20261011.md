# PA-01B3 显式 AI 拒绝优先隔离浏览器验收 — 2026-10-11

Document class: HISTORICAL_SNAPSHOT

## 1. 结果

**`PA01B3_EXPLICIT_AI_DENY_BROWSER_PASS`**，只限隔离 Host / 本地确定性模型响应 / 临时导入作业。本文件补充 [PA01B3 正向授权与真实回执](PA01B3-ISOLATED-AUTHORIZED-MAPPING-20261011.md)；二者不得混淆。

- Draft 实现/验收 PR [#691](https://github.com/jiangxng/EVO-App-Platform/pull/691)，准确 head `4692555eaa730c013f7c044f1b25e2e61825e350`，base 为 #638（#579 B2实现的测试stack）。Eidos owner #142 没有改动。
- [GitHub Actions run 38098385340](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098385340)：**两项独立 Chromium jobs 都 SUCCESS**。`allow` job `114348983758` 与 `deny` job `114348983831` 在不同Runner、不同临时Enterprise和不同Host policy中执行。浏览器/业务数据均为隔离环境。
- allow artifact [11687112571](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098385340/artifacts/11687112571)；deny artifact [11686147677](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098385340/artifacts/11686147677)。

## 2. 先发现并纠正的假设错误

首次 [run 38098150694](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38098150694) 的 deny job FAILED：该测试仅删去了额外 AI 允许规则，结果 `mappingOrigin` 仍成为 `AGENT` 且 `DRY_RUN_READY`。原因**并非已证实 Host 绕过授权**；定向读取实际源码 [Data Import 授权基线](https://github.com/jiangxng/EVO-App-Platform/blob/db555162370b3c3c992c7aef88f605f9ebf2d0cd/apps/data-import/authorization.ts) 后发现 `evo.data-import.operator` 本来就明确允许 `HUMAN` 与 `AI` 对 Data Import 读写，并由业务handler再强制 ACTIVE OWNER/ADMIN 企业关系。因此“缺少overlay ALLOW”不能推导为“缺少AI权限”。

现行 [Static Authorization runtime](https://github.com/jiangxng/EVO-App-Platform/blob/db555162370b3c3c992c7aef88f605f9ebf2d0cd/providers/authorization/runtime.ts)明确 `DENY` 优先于 `ALLOW`。修复仅改**隔离测试 fixture**，添加精准 `DENY` overlay（动作 data-import.read/write、对象 enterprise.data-import.job、指定测试主体、actorType AI）；未改产品既有 operator 授权或企业owner门槛。

## 3. 真实运行证据与断言

`deny` job 原始日志末尾：

```json
{
  "status": "PASS",
  "beforeState": "STAGED",
  "afterState": "STAGED",
  "mappingOrigin": "DETERMINISTIC",
  "associatedReceiptIds": [
    "agent-action-receipt:807033428dbab54f2d4188d7fda377fbc197ce525dc9babf8240bef19c42ab4f"
  ],
  "threadResponseObserved": true,
  "productionUsed": false
}
```

除了状态和映射来源完全不变，测试还比较原始 `job.mapping` 前后相等。对应 receipt ID **只是存在可审计关联，不表示成功写入**；本次未独立查询该 receipt 的持久终态，不冒称已确认 DENIED 状态。真实业务的无副作用已由前后作业状态/映射对比证明。

## 4. 未覆盖

- 跨租户或伪造企业身份的独立浏览器端到端拒绝；要按 Host resolved context 与Owner边界专门测试。
- 大模型真正自行选取字段、自动审批、人审后提交、生产安全治理。
- Agent Run / Receipt 在不同进程、数据库恢复后的正式业务重新核验。本阶段未碰正式生产/迁移。

后续只在 Agent 专属 PR 增加跨租户拒绝、正式Receipt status查询、富文本dirty接口；不据本证据修改全局项目状态或其他窗口交接。

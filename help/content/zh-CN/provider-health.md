---
{
  "helpVersion": "0.1.0",
  "id": "evo.provider.health",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "reference",
  "title": "Provider 健康状态",
  "summary": "理解 HEALTHY、DEGRADED、UNAVAILABLE 与 UNKNOWN。",
  "audiences": ["admin", "operator", "support", "agent"],
  "tags": ["provider", "健康状态", "探测"],
  "contexts": {
    "actions": ["provider.health.probe"],
    "routes": ["/providers"],
    "errorCodes": ["EVO_OBSERVATORY_REQUEST_TIMEOUT"]
  },
  "related": ["evo.provider.binding", "evo.troubleshooting.provider-unavailable"],
  "lastReviewedAt": "2026-10-22"
}
---
Provider health 表示可观察到的 Runtime 当前状态。

## HEALTHY

Runtime 以及主动探测均报告正常。

## DEGRADED

Runtime 可访问，但存在可恢复或部分能力异常。

## UNAVAILABLE

Runtime 当前无法满足该 Capability，或主动健康探测失败。

## UNKNOWN

Runtime 存在，但当前没有可靠的主动健康结果。

> [!INFO] 显式探测
> P0 的健康探测只在明确的 Host 管理操作后运行，不会在启动时隐藏轮询。

## EVO 运行时观测期限

`evo.runtime-observatory` 的 readiness 探测默认限时 8 秒。超时报告 `UNAVAILABLE`，消息为 `EVO_OBSERVATORY_REQUEST_TIMEOUT`。检查已配置的 EVO 地址和网络，恢复后重新执行一次有权限的显式探测；系统不会后台轮询或自动重试。

一次观测查询另有 8 秒总预算，覆盖企业解析、全部请求目标、轨迹读取及响应正文。超时拒绝整次查询，不返回部分事实。readiness 依据 HTTP 状态并释放未结束的正文；`HEALTHY` 只证明地址可达，不表示业务事实完整。停用包会阻止新的有效选择，不会立即取消已开始的查询。

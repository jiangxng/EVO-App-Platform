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
    "routes": ["/providers"]
  },
  "related": ["evo.provider.binding", "evo.troubleshooting.provider-unavailable"],
  "lastReviewedAt": "2026-09-26"
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

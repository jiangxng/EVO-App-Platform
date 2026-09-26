---
{
  "helpVersion": "0.1.0",
  "id": "evo.extension-manager.overview",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "how-to",
  "title": "使用 Extension Manager",
  "summary": "检查插件生命周期、兼容性、信任、完整性和 Runtime 状态。",
  "audiences": ["user", "admin", "operator", "support", "agent"],
  "tags": ["extension-manager", "插件", "完整性", "runtime"],
  "contexts": { "routes": ["/store"] },
  "related": ["evo.plugin.lifecycle", "evo.troubleshooting.plugin-integrity", "evo.troubleshooting.runtime-unavailable"],
  "lastReviewedAt": "2026-09-26"
}
---
Extension Manager 是 Eidos 用于发现和操作扩展的标准界面。

## 可查看的信息

- 生命周期状态；
- Host 兼容性；
- Publisher 信任状态；
- 完整性与 Provenance；
- 请求的权限；
- Runtime 类型、健康状态与近期历史；
- 提供和依赖的 Capability。

## 操作

可用操作取决于生命周期和准入状态。不安全或不支持的状态转换会被阻止，而不是被模拟执行。

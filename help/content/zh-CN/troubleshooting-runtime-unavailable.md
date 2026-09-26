---
{
  "helpVersion": "0.1.0",
  "id": "evo.troubleshooting.runtime-unavailable",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "troubleshooting",
  "title": "插件 Runtime 不可用",
  "summary": "诊断插件 Runtime 的就绪、崩溃、超时或准入问题。",
  "audiences": ["admin", "operator", "support", "developer", "agent"],
  "tags": ["故障排查", "runtime", "process", "remote"],
  "contexts": {
    "errorCodes": ["PLUGIN_RUNTIME_UNSUPPORTED", "PLUGIN_RUNTIME_INACTIVE", "PLUGIN_RUNTIME_TIMEOUT"]
  },
  "related": ["evo.extension-manager.overview", "evo.plugin.lifecycle"],
  "lastReviewedAt": "2026-09-26"
}
---
Runtime 是否可用取决于生命周期状态、完整性准入以及声明的 Runtime 类型。

## 诊断

- 确认 Package 已安装。
- 确认至少一个所属 Feature 已激活。
- 在 Extension Manager 查看 Runtime diagnostics 与近期历史。
- PROCESS Runtime 检查可信签名和 entrypoint digest。
- REMOTE Runtime 检查 HTTPS endpoint 与 credential Provider 就绪状态。

Runtime 崩溃或超时应让当前调用确定性失败，不应破坏其他插件进程。

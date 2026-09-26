---
{
  "helpVersion": "0.1.0",
  "id": "evo.plugin.lifecycle",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "how-to",
  "title": "插件生命周期",
  "summary": "理解安装、启用、禁用与卸载的含义。",
  "audiences": ["user", "admin", "operator", "agent"],
  "tags": ["插件", "安装", "启用", "禁用", "卸载"],
  "contexts": {
    "routes": ["/store"],
    "actions": ["app-platform.install-package", "app-platform.enable-package", "app-platform.disable-package", "app-platform.uninstall-package"]
  },
  "related": ["evo.platform.package-feature-contribution", "evo.troubleshooting.runtime-unavailable"],
  "lastReviewedAt": "2026-09-26"
}
---
插件生命周期由 App Platform 管理，并通过 Eidos Extension Manager 呈现。

## 安装

安装会记录 Package，并只激活符合其激活策略的 Feature。

## 禁用

禁用会停用 Package 当前激活的 Feature，但保留 Package。为了修复配置，Settings 与故障排查 Help 可以继续存在。

## 启用

启用会在生命周期、兼容性与安全检查通过后重新激活符合条件的 Feature。

## 卸载

卸载会移除已安装 Package 及其有效 Contribution。

> [!WARNING] 生命周期控制执行
> 可执行插件 Runtime 不能绕过安装状态与 Feature 激活状态。

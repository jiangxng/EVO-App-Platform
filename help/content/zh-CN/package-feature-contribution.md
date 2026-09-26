---
{
  "helpVersion": "0.1.0",
  "id": "evo.platform.package-feature-contribution",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "concept",
  "title": "Package、Feature 与 Contribution",
  "summary": "理解平台安装、激活和扩展所使用的三层模型。",
  "audiences": ["admin", "developer", "agent"],
  "tags": ["package", "feature", "contribution", "插件"],
  "related": ["evo.plugin.lifecycle", "evo.provider.model"],
  "lastReviewedAt": "2026-09-26"
}
---
Package 是进入系统的安装与所有权边界；Feature 是实际被激活的能力单元；Contribution 是 Feature 向宿主界面或平台能力提供的扩展。

## Package

Package 是可安装、可分发、可治理的边界。

## Feature

Feature 声明激活作用域、依赖、Capability 与 Contribution。

## Contribution

Contribution 可以增加 Eidos Experience、本地化资源、Workbench Activity、Settings 或平台 Service Provider。

> [!WARNING] 不允许隐式激活
> 安装 Package 不代表其中所有 Feature 都已激活。生命周期状态必须显式。

---
{
  "helpVersion": "0.1.0",
  "id": "evo.workbench.overview",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "start",
  "title": "Workbench 概览",
  "summary": "了解活动栏、侧栏、主工作区和状态栏的职责。",
  "audiences": ["user", "admin", "agent"],
  "tags": ["workbench", "工作区", "导航"],
  "contexts": { "routes": ["/store", "/settings", "/providers", "/help"] },
  "related": ["evo.plugin.lifecycle", "evo.settings.secrets"],
  "lastReviewedAt": "2026-09-26"
}
---
EVO 使用 Eidos Workbench 作为主要的人机交互外壳。Workbench 将应用导航、上下文工具与当前工作内容保持分离。

## 主要区域

- 活动栏用于切换工作上下文。
- 侧栏用于显示导航、搜索或上下文视图。
- 主工作区承载当前主要任务和文档。
- 状态栏显示轻量的当前状态。

## 活动行为

再次选择当前侧栏 Activity 可以收起或展开侧栏。Workspace route 在主工作区打开，不会破坏 Activity 模型。

> [!INFO] 稳定外壳
> Workbench 布局属于界面状态，不属于业务事实、企业作用域或授权输入。

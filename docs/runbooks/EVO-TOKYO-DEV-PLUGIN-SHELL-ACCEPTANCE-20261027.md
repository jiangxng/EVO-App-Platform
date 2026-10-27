# EVO 东京：应用未关联企业时的工作区提示（2026-10-27）

**纠正既有判断**：用户截图同时有“暂无企业”、应用导航及空白主工作区。“应用入口已被声明并出现”不等于“已绑定企业/业务服务”，也不能凭此证明真实可执行。删除应用菜单并非对当前问题的正确修复，故本 PR 已撤回 Tokyo clean 启动设置并保留原安装策略。

## 实读原文与原因

- P1 [manager/server.ts](../../manager/server.ts)：客户、数据导入等业务页缺 Enterprise Context 时返回 HTTP 409 以及领域专用 ENTERPRISE_CONTEXT_REQUIRED 错误码；这是应保留的服务端边界。
- P1 [vendor/eidos/src/workbench/shell.ts](../../vendor/eidos/src/workbench/shell.ts)：主区加载新路由前清空页面，HTTP 错误沿异常抛出而不呈现 UI，因此出现空白，与截图吻合；当前缺少该次线上请求日志，故只可称源码解释而非该请求的日志复盘。
- P1 [docs/architecture/PLUGIN-PLATFORM-MAINLINE-v0.1.md](../architecture/PLUGIN-PLATFORM-MAINLINE-v0.1.md)：Package/Feature/Contribution、安装状态和企业运行准备度是不同层级，不能互相代替。
- P1 [docs/architecture/EVO-WORKBENCH-v0.1.md](../architecture/EVO-WORKBENCH-v0.1.md)：Apps 图标已可收起/展开 Side Panel，冗余独立 Workspace Activity 可以移除。

## 修复范围（Draft PR #1120）

1. 平台统一页面请求入口增加只读呈现适配：仅应用页面发生 409 且错误码明确为缺少 Enterprise Context 时，改以 Eidos 标准空状态表达“当前应用尚未关联企业，请先创建或关联企业并配置业务服务”，取代全白区域；支持中英日三语。
2. 企业上下文仍由 Host 确认。浏览器不能凭 UI 声明伪造 Context、跳过 409 或冒充业务服务在线；401、403、其他 409、成功业务页以及应用以外的请求保持原行为。
3. 后续建立企业后页面会重新从服务端取得原本业务内容，而不是停留在缓存错误卡片；附针对性测试。
4. 保留本 PR 的重复 Workspace icon 去除，不修改 vendored Eidos 通用框架；延续 Eidos Design Review 记录。

## 验收与未关闭事项

- 用户界面表现“暂无企业”不等同于实证后端应用绑定缺失；如后续还有业务服务未绑定的错误，需要依官方领域错误码针对性呈现，不能按推测标记为已解决。
- Exact-HEAD CI、合并、东京部署、实际 Human 页面验收互相独立；本文件不是上线签收。
- 本工作线不删除既有卷、不停用既有应用、不覆盖 PA05/BEX/Eidos/EC、不改动 Railway 或生产数据。

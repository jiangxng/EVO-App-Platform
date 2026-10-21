# BEX-01 V3 M06｜真实预检查「重新预检查」

批准的 [#909 V3 HTML/CSS/JS 原型](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) 的 `$("rerun").onclick=precheck` 是交互目标；真实 Host **不得复用原型的模拟预检**。

## 目标与交互
实际 `/data-import/jobs/:id/review` 的未提交状态 STAGED、DRY_RUN_FAILED、DRY_RUN_READY 显示「重新预检查」；点击走已有受权限管理的 `data-import.dry-run`，后端读取最新 Import Job 和企业 schema，保存新验证证据并路由返回同一 review 页面，刷新无效行、成功/失败状态与 commit 按钮。**COMMITTED 与 COMMITTED_WITH_ERRORS 不出现该入口**。失败仍不得导入，通过后也必须点击原先明确确认的 commit。

## 样式、信息和来源保留
只用 CatalogBrowser 通用 action，无新 CSS/全局主题；保留既有字段映射、Recipe、忽略列、原始 Excel 与已授权行更正；成功的 Host 命令返回原有 Job 结果；浏览器 Shell 的标准 `onActionResult` 会重新读取当前 review 路由，**不需要再叠加同一地址的 navigateTo**，以免发生双重重绘。桌面及 390px 响应式均复用原组件，不复制原型演示 localStorage 或假提交。

## 测试、安全与剩余
协议测试覆盖 READY/FAILED/COMMITTED 三态和按钮/最终提交隔离；真实隔离 Host Chromium 使用 172 行合成 XLSX 初始 3 条缺少主体类型的失败预检查，点击重新预检后仍必须呈现 3 行问题且没有 commit，之后依旧走原逐行纠错、自动重新校验和独立确认导入链路。以精确 HEAD CI 为证，不宣称人审功能/布局/颜色各 100% 或生产/客户 Excel 已验收。工作线 #1086 Draft。

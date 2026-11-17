# CV-02 Window15：Eidos Catalog 受管焦点恢复采用与验收

> 2026-11-17，Platform 基线 `main@dc670ca59a2b7936516a68ff87a77f1fca639b61`，上游 Eidos [PR #215](https://github.com/jiangxng/eidos/pull/215) 已合并 `main@62f7d481a89a1c00a7e3b7825474f616b88002ff`。本 PR 只定向采用上游 Browser Shell 的受限焦点恢复并做真正的隔离 Host Chromium 回归；**不是实际登录 Human、真实手机或读屏器签收**。

## 目标与完成条件

Counterparty 我的客户、我的供应商四组 1280px / 390px Chromium 操作，在已有状态快速筛选和服务器搜索的 Owner 再查询后，将焦点恢复到原状态按钮或搜索框，保留原 CSV/授权、分页、组合筛选和现有页面样式。不给无关页面注入焦点，不新增 Catalog、列表、权限或状态持久化。

## 流程与步骤

进入现有 Eidos Catalog → Tab 切到 ACTIVE 原生按钮并 Enter → 原 Owner/Host 有权查询 → Eidos Browser Shell 恢复 ACTIVE 控件焦点 → 搜索 Beta 输入框 Enter → 焦点回到搜索框 → 点击 INACTIVE 出现真实空列表、CSV 只有表头且焦点回到 INACTIVE → 点击 ALL 搜索仍保留并回到 ALL 焦点。两种宽度、两种我的角色均需自动断言；禁止 mock HTML 替代真实 Host。

## 导航与信息架构

继续采用原 `table.quickFilters`、`table.search`、`data-eidos-catalog-action`；跨页/切企业/停用插件不保留旧业务/字段/列授权，只有同一新页面中仍存在合法控件时才恢复焦点。此次只同步 Eidos 上游 **焦点 helper**，Platform `vendor/eidos/src/app-host/browser-shell.ts` 的其他覆盖与 Host 协议保持原样。

## 视觉与颜色

无新 CSS、按钮或颜色，沿用 Eidos 已批准的响应式原生 `:focus-visible` 规则。浏览器测试在 1280px 与 390px 校验当前页布局与下载，不能将截图自动检测替代实际用户视觉签收。

## 记忆与注意力

焦点连续性减少重查后的键盘重新寻路；状态选中仍由 Owner `aria-current=page` 提供，当前页搜索、CSV 列和实际业务数据仍保持一致。焦点意图是单次内存中的控件标识，不储存 Personal/Enterprise/Subject、敏感字段、URL 或 Saved View。

## 无障碍与跨年龄

原生 button/search 的键盘语义不变。新浏览器回归只核实焦点实际处于新 DOM 的对应控件、已有 Enter 和点击链路；实体键盘 Space、焦点历史、多步骤全键盘、真实用户、VoiceOver/NVDA 读屏和物理手机继续 `NOT_SIGNED`，不以自动化声明 HUMAN_PASS。

## 安全与数据修复

Owner 按既有企业/责任范围/字段权限先裁剪，再执行 status AND search 与 total/page；本次零政策、SQL、CSV、Agent 合同或静态 Host 装载变更。Helper 仅捕获真实聚焦的受限 Catalog 按钮/搜索框，按 exact actionId 定位原有按钮，不插入不受信任的 CSS selector，不执行隐藏动作，不跨主体持久化。CV03 `N1=NOT_CERTIFIED`、正式 Human SAVE OFF，CV04 正式后台 EXPORT OFF、#1212/#1092 OPEN。

## 证据与剩余问题

上游 [Eidos #215](https://github.com/jiangxng/eidos/pull/215) 的 release-check / Human UI Design Review 和本次 Platform 真正的 `tests/cv04/real_host_csv_download_chromium.py` 才是工程来源。要求同一个准确 PR HEAD 下真正 4/4 状态焦点与 CSV 端到端、Platform Continuity、Lightweight Host、Human UI Review、随后受保护 main 真实 Chromium 再过；东京 DEV 按实际 runtime diff 和一致 SHA 决策发布、Actions 精确 HEAD 清分支。此前 #1337–#1340 的“模拟多步键盘”失败原日志继续留在 PR #1340 评论，不改成已过。正式登录 Human、真实读屏器/手机与生产 Owner 签收仍是独立阻塞，不触碰并行 #1184。


## 2026-11-17 Eidos #216 实测纠偏（同范围）

真实 Host 首轮在 ACTIVE 已选中的情况下读到焦点 inactive，说明只在 `renderRoute` 捕获可能晚于 hash 导航时机。上游 [Eidos #216](https://github.com/jiangxng/eidos/pull/216) 已在 `e656d0442034d1a0585418361b019f761430f84d` 合并：先在合法同一 pathname 的 `navigate` 中捕获受管控件 ID，严格绑定目标完整 route，接受一次 Owner 重查后恢复；取消过期请求的渲染，且不跨页或持久化。Platform 不覆盖其他 Eidos vendor 定制，只移植此最小点。早期 Chromium `quick-filter-active` 焦点不恢复的失败是**真实未通过**，此 PR 最终验收必须以修正后的精确 HEAD 和合并后 main Chromium 实际原证为准。另有 PA01B2 Chromium 运行器固定 Ubuntu 24.04 仅为 Playwright 1.56 兼容；这不改变安全/功能门禁。#1212/#1092/Human 真实签收仍保持 OPEN/NOT_SIGNED。


## 2026-11-17 真实 Workbench Owner 修正与最终采用边界

更深入跟踪 `manager/app-host-client.ts` 与 `manager/desktop-workbench-runtime.ts`，确定 Counterparty 在桌面使用 Eidos `mountWorkbenchShell`，不是 `mountBrowserAppHostShell`。前者在 `vendor/eidos/src/workbench/shell.ts` 的 `navigateWorkspace`、`renderInternalWorkspace` 管理导航；因此先前 Browser Shell 试验不可能关闭本测试。上游已由 [Eidos #217](https://github.com/jiangxng/eidos/pull/217) 在准确 HEAD release-check + UI Review 通过后合并 `4c2bfea1eb21e4c10091b88aa033339a33c8d8cd`：抽出原有 `catalog-route-focus` 轻量共享 helper、修正实际 Workbench 导航并保留原有 superseding read gate。Platform 只增加共享 helper 和实际 Workbench 的受限焦点恢复；**主动撤回此前对非实际入口 vendor Browser Shell 的试验改动**。本次真实 Host CI 全绿前，不能将焦点恢复记为已验证。PA01B2 Chromium 原工作流需 Ubuntu 24.04 才能安装其 Playwright 1.56，固定 runner 不放松任何正反向用例。真实登录 Human、实体 390px 手机外接键盘、读屏器及全键盘完整链路继续未签。

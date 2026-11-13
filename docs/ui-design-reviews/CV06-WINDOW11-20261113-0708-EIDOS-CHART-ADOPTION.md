# CV-06 Window11 #07/08 — Eidos 正式 Owner 聚合柱状图采用 UI Review

> 日期 2026-11-13；Platform 受保护基线 `main@c32f493742fc399e829a0ea914e8f83bde3fa32f`，Eidos 上游固定 `jiangxng/eidos@64b171a8f6ed7ae34db595cb4a14f4134456cae2`（PR #210，原 release-check + UI Gate 全绿）。本 PR 只采用上游新部件与原业务 Host 数据。**真实 Human/生产 Google 登录仍待证据**。

## 目标与完成条件

字典列表除原有搜索、系统视图、分页与详情外，可额外看到合法 Domain Owner 的状态聚合柱状图；不是前端从当前页模拟“全集”。图表必须显示明确来源口径、读取时间、数值或被隐藏状态，390px 无横向溢出；撤权、换企业或禁用 Feature 后不得保留旧图。所有现有列表操作仍完整可用。

## 流程与步骤

Human 在原字典企业列表中操作 → Host 按原 Session/Enterprise 关系确认目录页 → 构造单独的受管 `dictionary.collection.aggregate.state` 命令 → `createPlatformRequestContextV010` 与 `actionRouter.execute` 做独立授权 → Owner 从合法全集做 DRAFT/PUBLISHED 聚合（已在 CV-06 #06 合并）→ 若结果与本页查询口径匹配且通过 Eidos 结构/抑制检查，才在原 `CatalogBrowser` 上挂 `authorizedChart`。失败时只省略图表，不中断原列表。企业切换、停用插件需重新请求，而非前端缓存图表。

## 导航与信息架构

没有新菜单、平行 List Framework、Dashboard/BI 微前端；仅扩展 `CatalogBrowserV010.authorizedChart?`。上游渲染/契约落到 `vendor/eidos/src/catalog-browser/{authorized-bars,contracts,render}.ts`，原 `vendor/eidos/src/app-host/page-renderer.ts` 仍负责所有 Eidos 页面；Host 适配在 `manager/cv06-dictionary-chart-presentation.ts`、目录加载入口 `manager/server.ts`。CV03 Saved View READ_ONLY 路由仍由其他 Owner 管理，本次不接入图表，避免未验证的私人视图条件与图表口径不一致。

## 视觉与颜色

使用 Eidos 上游新 CSS `vendor/eidos/src/design-language/productive-workbench-css.ts` 的 scoped 区块；只追加图表块，不覆盖 Platform 在 #1319 合并的 View 44px 或其他自定义样式。Eidos 既有主色 token 绘制 bar，隐藏桶只显示占位虚线，不暴露可能推测值的图宽；文案与精确数值用文字呈现。桌面维度/条/计数三列，390px 上下重排。状态颜色不带业务管理/发布权限含义。

## 记忆与注意力

系统视图仍在同一页，图表紧邻视图导航，标签「草稿」「已发布」，显示「授权总数」与「读取时间」；无需在表格分页后心算总数。小样本 1/2 计数显示「少于 3 条（已隐藏）」而非伪造零、半透明精确高度或‘未知很小’推断数字。没有闪烁或图表自动轮询；随真实 Host 刷新重新授权。

## 无障碍与跨年龄

Eidos Owner 输出 `section/h2/aria-labelledby/dl/ul/li`，可被读屏器按文字访问；纯视觉柱条 `aria-hidden`，不强迫依赖颜色/hover tooltip。小屏 390px 必须实际 Chromium 截图和 `scrollWidth<=390`，原列表仍支持触控卡片与键盘。没有虚假的拖拽看板；真实 VoiceOver/TalkBack、移动真机、不同放大/字号与 Human 现场签收仍在 OPEN。

## 安全与数据修复

图表只在 Host **实际授权 READ 成功**且 Scope、Schema、Metric、Query、PrivacyThreshold、countKind/total 合同时显示；当服务端统计与原列表完整计数不一致则隐藏（避免竞态误导），无单独提权通道。没有从 HTML 的当前页 DOM 推算聚合，没有 Eidos 自行访问 Owner repository 或任意 SQL，不允许图表触发保存/发布/导出。正文和标签 HTML escape，人数小于 3 的桶抑制；N1=NOT_CERTIFIED，CV03 Human SAVE OFF，正式 CV04 后台 EXPORT OFF，不得因新 UI 擅自放开。无数据库迁移。若图表异常，以关闭可选采用回到原列表，不改变企业事实。

## 证据与剩余问题

**原始上游：** Eidos PR #210 MERGED，合并 SHA `64b171a8f6ed7ae34db595cb4a14f4134456cae2`；源文件有 `src/catalog-browser/authorized-bars.ts`，上游原有 `src/visualization/series.ts` 只是语义数据转换，`bar-chart`/Kanban 能力计划目录不是已实现部件。本 PR 选择按固定 SHA 定向复制新文件和相关片段，不覆盖 Platform 已改的 Eidos 壳、View CSS、Chat 等。

**回归验收路径：** `tests/protocol/cv02-real-owner-agent-human-collection.test.mjs` 新增真实 ActionRouter → Chart 适配正负用例，检测当前页=1 行与完整 Owner 聚合不同、撤权/Feature 停用无 Chart、恶意数据被拒、旧列表照常；原 `tests/cv05/real_host_agent_list_chromium.py` 增加 1280/390 Dictionary 图表可见/企业 B 重新授权/390px 不溢出断言，保留之前全部 4/4 浏览器旅程。所有 CI/发布结果必须按精确 HEAD 原始 Actions 核验，本记录不预先宣布合并或成功。

**未完成：** Kanban 是另一种真实业务语义、需独立 Eidos Owner contract；柱状图不是完整 CV-06 的看板+图表验收。真实模型文字解释、Human Google 登录、真实移动端/读屏器、生产 Owner 签收均待独立证据。#1092、#1212、#1184 其他 Owner 文件保持不变。

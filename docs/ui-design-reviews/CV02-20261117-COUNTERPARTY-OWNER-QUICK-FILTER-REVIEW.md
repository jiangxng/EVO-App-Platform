# CV-02 Window14 · Owner 受限状态与关键词组合筛选 UI 评审

> 2026-11-17，采用 Eidos PR #214 和已有的 Counterparty List Owner / Human、Agent、CSV READ。此文件是工程设计与自动化范围评审，不代表真实用户 Human 验收。

## 目标与完成条件

在现有客户/供应商/我的客户/我的供应商四个原列表增加 ALL、ACTIVE、INACTIVE 快速状态筛选；服务端 Owner 在已授权的所有行上执行 status AND search，重算总数、排序和分页。列表、详情返回、当前页 CSV 和 Personal Agent READ 使用同一个有权查询。无状态时保留原有行为；不建立第二套 Grid 或 Client Query。

## 流程与步骤

用户展开原列表 → 点击状态导航（全部、启用或停用） → Host 路由传有界状态到 Domain Owner → 用户输入原有搜索文本 → Eidos 现有 server-search 提交 → Host 重新鉴权、Owner 先完成 Principal/Enterprise/Responsibility/Field READ 再按状态与文本过滤、排序和分页 → Table 及当前页 CSV 基于同一有权结果 → Agent 通过原 Capability Operation 对相同查询获取等价记录。

## 导航与信息架构

原全部/我的视图、受限列布局、表头排序、搜索、上一页/下一页、详情 returnTo 均保留。状态切换重置 page=0，但保留合法搜索、列顺序、排序、每页数量。状态为 ALL 不额外带 status。禁止重复 URL 参数、跨应用路由和外部导航。Eidos 是纯表现 Owner。

## 视觉与颜色

Eidos Catalog 在原搜索附近渲染三个清晰文字按钮，selected 使用原生 aria-current；沿用统一 Eidos 表格、移动卡片、按钮焦点、颜色 Token，不引入私有 CSS 或色彩。1280px、390px 都由现有真实 Chromium 工作流复核点击和溢出。

## 记忆与注意力

状态选择明确可见；点击原搜索后，状态仍由 Owner URL 保留，不需要重新选择。清除状态不会抹除原搜索；切换条件总从第 0 页开始，避免上个条件的旧页造成假空数据。CSV 只显示当前有权列的真实当前页。

## 无障碍与跨年龄

单组导航使用 nav、文字标签、原生 button 与 aria-current，不仅靠颜色。键盘 Tab/Enter/Space 保持，信息层级不变。没有真实读屏器、登录 Human 或物理手机验收，不得把自动化测试写为真人签署。

## 安全与数据修复

状态仅接受 ACTIVE 或 INACTIVE，明确拒绝空串、其他值和重复参数。Owner 如果未授予 status 字段读取权，筛选请求必须以 COUNTERPARTY_QUERY_STATUS_FORBIDDEN 拒绝，不能靠总数泄漏隐藏字段。服务端先按责任/企业/字段裁剪，再执行 AND 状态与原有搜索。CSV 与 Agent Operation 共享 enum 白名单，仍需每次重新认证，旧权限/停插件/跨企业拒绝不变。N1 NOT_CERTIFIED、CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF、#1212 Owner OPEN 与 #1092 Operator OPEN 保持。

## 证据与剩余问题

上游 Eidos #214 提供可选 quickFilters 导航和非法路线/重复选项/多选态校验。Platform 扩展原有 CV02 真实 Domain Query、CV04 Counterparty Owner ActionRouter/CSV 测试，核对 Human 和 Agent、授权行、撤权、无状态许可、非法参数。原 CV04 真实 Host Chromium 1280px/390px 对我的客户和我的供应商执行状态筛选加搜索、CSV 下载及空结果；最终只依 exact HEAD 原始 CI 与合并后真实回执。更多复杂条件、个人筛选保存、真实 Human/屏幕阅读器继续独立待办，不声称完整 List Foundation 完成。

## 页面模式与导航归属

Eidos CatalogBrowser 是唯一表现 Owner；Counterparty ProjectionService 管真实 Principal/Enterprise/Responsibility/字段 READ、状态 AND 搜索、分页。Host ActionRouter 审核命令且重新授权。不存在另一套筛选引擎或新 Production Write。

## 功能、布局、颜色对照

功能：状态 AND 搜索、授权 total/page、当前页 CSV、Agent READ 同一语义。
布局：使用原列表上方快速导航，与现有搜索和列管理共存。
颜色：延用 Eidos Tokens 与原状态焦点，未硬编码新 CSS。

## 入口、退出与恢复矩阵

入口：四种已有 Counterparty 列表。
退出：选择“全部状态”清除状态条件或点击原返回/工作台导航。
异常恢复：非法枚举、无字段授权、撤权、换企业和停用插件按原 Owner/Host fail closed，空结果保持总数与 CSV 表头。

## 浏览器与 Human 证据

桌面：1280px 隔离 Host Chromium 点击与下载回归，以真实 Job 日志为准。
移动：390px 隔离 Host Chromium 点击与下载回归，非真实手机。
Human：未签收；真实企业账号、物理设备和屏幕阅读器仍为独立验收。

## 精确源码和原测试路径

- apps/counterparty/page.ts
- apps/counterparty/projection-query.ts
- apps/counterparty/capability-manifest.ts
- vendor/eidos/src/catalog-browser/contracts.ts
- vendor/eidos/src/catalog-browser/render.ts
- tests/protocol/cv02-business-collection-views.test.mjs
- tests/protocol/cv04-counterparty-my-page-csv-export.test.mjs
- tests/cv04/real_host_csv_download_chromium.py

## 逐项可核验交付状态

功能：受管状态 AND 文本筛选及 Owner/Agent/CSV 同一协议
布局：原 Eidos 搜索、列表、列设置和快捷状态导航
颜色：无新硬编码颜色，沿用 Eidos 原设计
入口：客户、供应商、我的客户、我的供应商原路由
退出：选择全部状态或离开本列表
异常恢复：非法状态及失权情况一律拒绝，不回退伪结果
桌面：隔离 Chromium 1280px 自动化，精确 HEAD CI 后记最终结果
移动：隔离 Chromium 390px 自动化，精确 HEAD CI 后记最终结果
Human：未签收，生产用户和读屏器回执仍缺

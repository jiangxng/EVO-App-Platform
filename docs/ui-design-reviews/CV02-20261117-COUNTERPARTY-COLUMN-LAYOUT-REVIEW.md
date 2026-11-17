# CV-02 #03/04 — Counterparty 列显示与排序/导出一致性 UI 评审

> 2026-11-17。本文件为 Eidos 现有 Catalog 列控件在第二个真实 Domain Owner 的采用审查，不代表真人或生产签署。基线 Platform `main@fe80b84141c9dc4bd9fa04a77f5956c3f663c82e`；上游 Eidos 列控件已于 #213 合并，不另建 List 框架。

## 目标与完成条件

在客户、供应商、我的客户、我的供应商列表按本次企业及 Principal 已授权的 `readableFieldIds` 显示可选列，提供和字典一致的显示/隐藏、上下调整及恢复默认。已授权投影、搜索、排序、分页、列表详情返回与当前页 CSV 必须共享同一可见列集合，不得在浏览器本地隐藏未经授权的数据假装权限更新。真正的组合筛选需要 Domain Owner 扩展有界查询，不能通过 Eidos 在当前页本地过滤，本 PR 不声称其完成。

## 流程与步骤

用户进入真实 Counterparty 列表 → 展开原 Eidos `列设置` → 选择一个非身份、非当前排序列显示/隐藏或上下移动 → 通过原 ActionHost Navigate/Host 重新查询 → Owner 检查可读列并构造 Table、CSV fieldIds、返回详情链接 → 页面重新渲染。恢复默认只移除 UI 的 `columns` hint，不触发 Saved Views 写入。

## 导航与信息架构

只在现有 `/counterparties/{customers,suppliers,my-customers,my-suppliers}` 的允许 URL 参数新增受限 `columns`；查询路由仍由原 Counterparty parser 构建和校验。系统“全部/我的”视图切换、搜索和分页携带合法列设置，详情 `returnTo` 仍调用独立路由验证器，不继承来源权限或改变下级动作的 Authorize。

## 视觉与颜色

复用已在上游 Eidos 实现的原生 `details/summary` 折叠布局、按钮、标签及 390px 响应式结构，无新硬编码颜色、图标或私有 CSS。列状态与排序箭头沿用 Eidos；操作者可明确看见列名和状态。仍需检查实际桌面/390px 浏览器无横向溢出，但机器截图不能替代真人视觉签收。

## 记忆与注意力

默认折叠避免干扰日常检索；合法列布局跟随当前搜索、排序和分页，不需用户重新操作。第一主身份列固定，正在排序的字段不提供误导性的隐藏操作。恢复默认是可撤销的临时偏好，不会永久修改共享/个人视图配置。

## 无障碍与跨年龄

使用原生 `summary` 和 `button` 键盘可达语义；显示、隐藏、上移下移均为文字按钮，操作不能仅靠颜色理解。页面仍保留 `th scope=col` 和 `aria-sort`。未以真实读屏器、真人账户或物理手机执行独立 Human 签收。

## 安全与数据修复

`columns` 只准 `displayName/code/status/subjectType/countryOrRegion` 唯一有界列表，且首列必须为 `displayName`。Owner 对每次返回的 `readableFieldIds` 再次校验；Host 接收 URL 后显式从 Domain Query 移除 `columns`，防止 UI hint 被误当作 SQL、字段授权、Agent WRITE 或新的 Operation 入参。CSV 只消费当前 Table 的 fieldIds，Owner 原授权 CSV READ 重新计算有权记录，不能读取未授权字段或其他企业。保留 #1212、#1092、N1 NOT_CERTIFIED、CV03 SAVE OFF、CV04 正式跨页 EXPORT OFF。

## 证据与剩余问题

工程测试复用 `tests/protocol/cv02-business-collection-views.test.mjs`，覆盖两种真实 Owner 列变化、恶意字段拒绝、CSV 与详情返回状态。现有 `tests/cv04/real_host_csv_download_chromium.py` 的隔离真实 Host Chromium 1280/390px 将点击我的客户/我的供应商列控件并下载 CSV，沿用 A/B 企业切换和 Feature 停用拒绝验证；结果必须以精确 PR HEAD Actions 实际 Job 回执为准。尚缺真人登录、真实屏幕阅读器、组合筛选 UI 完整闭环；下一步单独做 Owner 有界组合筛选，不把本 PR 当作 CV02 全面完成。

## 页面模式与导航归属

Eidos CatalogBrowser 是统一 UI；Counterparty ProjectionService 是授权 READ、字段过滤、范围查询和排序的 Owner，Host ActionRouter 继续受控，CSV 同一 Domain Owner。无第二个 Grid 或新权限框架。

## 功能、布局、颜色对照

功能：显示/隐藏、列顺序与重置；实际字段保持基于本次授权。
布局：使用现有表格上方折叠菜单和现有移动视图，不改变导航、返回及搜索。
颜色：沿用 Eidos Token、原表头排序提示、焦点可见性，无新主题。

## 入口、退出与恢复矩阵

入口为已授权的四种 Counterparty 列表。用户可收起菜单或点击恢复默认；越权列、重复列、跨企业路径及禁用插件一律拒绝或按现有 Host fail-closed。没有本地表格回填绕过真实 Owner Query。

## 浏览器与 Human 证据

真实隔离 Host Chromium 在 1280px 和 390px 检验点击、列/CSV 一致性、无溢出与跨企业行隔离；这是自动化**非生产**测试，不是企业账号真人验收。结果只在真实 Actions success 后闭合。Human 仍为 **NOT_SIGNED**。

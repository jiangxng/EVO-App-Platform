# CV-06 Window11 #07/08 — Eidos 上游图表与 Platform 实际 Host 采用交接

## 明确前置及复用

- `EVO-App-Platform main@c32f493742fc399e829a0ea914e8f83bde3fa32f` 上 CV06 #06 已合并运行时 Domain Owner `dictionary.collection.aggregate.state`，完成全量有权集合、小样本隐藏、Host Agent/Human 同权、东京真实健康；不能重复构建查询或当前页统计。
- `jiangxng/eidos main@127150c30193b57b38d1d9cc62443ddfa90e2349` 原有 `src/visualization` 语义选择但无实际 bar chart；`capabilities/visualization/bar-chart/CAPABILITY.md`、`capabilities/data/kanban/CAPABILITY.md` maturity=planned，ECharts 只有备选 renderer 描述，不能冒充已支持。
- **Eidos 真 Owner PR [#210](https://github.com/jiangxng/eidos/pull/210)** 以 `release-check` 和八章节 Human UI Gate 2/2 完成，已合并 **`64b171a8f6ed7ae34db595cb4a14f4134456cae2`**。提供可选 `CatalogBrowserV010.authorizedChart`、展示与严格 admission、readable text 和 390px CSS；上游所有 changed 实际样式仍留 Owner，Platform 只固定其已合并 SHA。

## Platform 本 PR 实际代码

1. `vendor/eidos/src/catalog-browser/authorized-bars.ts` 直接复制 Eidos #210 的同名字节；`vendor/eidos/src/catalog-browser/{contracts,render}.ts` 定向吸收可选属性、验证与渲染钩子，保留 Platform 的既有导航与新图表之前 UI；`vendor/eidos/src/design-language/productive-workbench-css.ts` 只添加 scoped 图表 CSS，保留 #1319 44px View 按钮样式和已有 Portal/Chat 叠加。**不以整目录覆盖 vendor**。
2. `manager/cv06-dictionary-chart-presentation.ts` 只在真实 Human Enterprise Context、已有目录表格及无个人 View 猜测时，用原 `ActionRouter` 再调用 `dictionary.collection.aggregate.state`，校验 `collectionId/schemaRef/metricId/dimensionFieldId/scope/query/view/visibleFields/privacy`，将 AuthorizedAggregate 格式化为 Eidos-only 数据形状。拒绝/超限/停插件/版本不合时返回不带 Chart 的原目录，绝不换成异常占位图。
3. `manager/server.ts` 在原字典目录 GET source 身份、企业、Feature 和关系校验后启动第二次 Host command；使用原 `createPlatformRequestContextV010`，不信任 URL bearer 权限。CV03 只读 Saved View 仍按自己的独立 Owner 路径继续，避免在未经核准的私有列/筛选上显示不一致 Chart；SAVE 仍关闭。
4. `tests/protocol/cv02-real-owner-agent-human-collection.test.mjs`、`tests/cv05/real_host_agent_list_chromium.py` 在原 Host/CV05 夹具扩展，不创建第二个 Playwright Framework。成功矩阵、失败记录、主线 SHA、东京健康和 Branch Hygiene 后续只在该 PR 原始证据中最终追加，不预先填 SUCCESS。

## 后续未闭合项

这属于**CV06 首个 Chart 可视化纵切**，尚非 Kanban 或完整多视图；不应因本轮实现 Chart 就标 CV-06 所有条目 DONE。后续须先由业务 Owner 定义适合受管 Kanban 的枚举字段/无拖动写入，再由 Eidos Owner 审核可选表示；不允许把字典状态拖放直接触发发布草稿或修改事实。还需要真实登录 Human 的跨企业/移动端交互、读屏器和真实 LLM 语义解释检验。

#1092 Operator、#1212 Owner 仍独立 OPEN；`N1=NOT_CERTIFIED`，CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF；#1184 三份 Owner 文件与 Zhixing/Railway 主线均不更动。GitHub 原始 SHA/CI 是工程证据，不是生产签字。

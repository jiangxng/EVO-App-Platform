# CV-07 / 第三业务插件 Item Collection — 2026-11-19 最小纵切

> 阶段：**工程候选，PR 准确 HEAD CI/合并后回执另行记录**。本文件不是完整 List Foundation、第三插件 Human、正式个人 Saved View 或生产权限认证。

## 任务依据与取舍

依据 [近期八步计划 CV-07](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)（第三插件 Item/Warehouse、复用 Eidos/Platform/Owner/Agent、不引入第二套列表或权限引擎）。按当前工程事实，Dictionary / Counterparty 已采用既有 `foundation/collection-query` 和 Eidos CatalogBrowser `table`；Item 已有 `apps/item/{repository,projection-service,access,projection-actions,page,capability-manifest}`，但仅暴露无界的旧 My Items/Items Projection READ 与卡片列表，尚未采用标准授权分页查询。**选择 Item 而非新增第三套 UI、万能表或把 Warehouse 假设为已集成**。

## 本纵切代码职责

- `apps/item/collection-query.ts` 只在 **Item Owner 当前企业/主体/行级/字段授权之后** 调用公共 `parseDataCollectionQueryV010` 和 `pageAuthorizedCollectionRowsV010`，提供 `search/sort/direction/page/pageSize` 白名单和 `DataCollectionResultV010`；稳定排序 tie-break 为 itemId，不接受 SQL/任意字段。
- 搜索只在公开的 `displayName` 与有权 `code` 上进行；按未获授权的 `code` 排序失败关闭，不允许用隐含计数搜索隐藏字段。Collection cells 只投影 Item 当前 readable fields，不输出关联 Responsibility、Extension 内部对象。
- `ItemProjectionService.read({query})` 可选新增分页；**没有 query 的旧行为保持原样**（旧 projection/count/page 不改），并在新调用中将当前页与 owner Collection 结果一起返回。
- 在原 Item Feature 增加两条 `READ` Capability Operations，`item.collection.directory.query` / `item.collection.my-items.query`，同时供 Human 和内部 Personal Agent 发现；Operation 仍绑定当前 Item Action Host 和原 `item.read` 授权。责任人视图只在正常授权集合上交集 `ITEM_STEWARD`，不产生读授权。
- `createItemProjectionPageV010` 在收到当前 Owner `pageInfo + tableQuery` 时复用**原 Eidos CatalogBrowser table** 的 view 搜索、服务端排序、分页和可读字段列；未传新参数时继续渲染旧页面。路由只是展示坐标，任何点击须重新走 Host/Owner READ。
- 新协议测试使用真实 Item Enterprise Resource、Responsibility、Eidos Renderer、静态 Host Authorization、原 Item Capability 与 Action Handler；验证真实分页、My Items 责任交集、隐藏 code 搜索/排序拒绝、跨企业伪造、非法 SQL/URL、旧调用兼容。

## 当前不做 / 严格证据等级

此切片**不**证明 Tokyo 页面路由已经把 URL 查询传给 Owner，也不证明第三插件实际桌面/390px 浏览器和真人签收；补真实 Host→页面入口与 Chromium 后才能进入 CV-07 的更高验收等级。也不在此新增导出/导入引擎、数据聚合/看板、Saved View WRITE、生产 Host SQL、Agent 私有模型或新的 UI Renderer。CV03 Human SAVE、CV04 正式 EXPORT、Human OIDC 与 PA05 Operator 原安全门禁继续保持 OFF。

该切片通过 Platform CI 只可签 `CV07_ITEM_COLLECTION_THIRD_OWNER_CODE_AND_PROTOCOL_PASS`，**不能签** `LIST_FOUNDATION_HUMAN_PASS`。下一段是当前 Eidos/Host 路由的真实 1280/390px 浏览器授权分页与恢复，然后才是 Item/Warehouse 导入到列表的用户操作、1k/10k 性能证据、开发者接入教程/CI 与人验。业务用户验收入口应在这些可见功能打通后给出，不应因文档或合成数据完成就通知用户「已开发完成」。

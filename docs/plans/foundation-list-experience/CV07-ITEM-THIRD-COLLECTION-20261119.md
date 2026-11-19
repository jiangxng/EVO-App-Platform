# CV-07 / 第三业务插件 Item Collection — 2026-11-19 最小纵切

> 阶段：**CV07_ITEM_THIRD_OWNER_CODE_AND_DEV_PREVIEW_ACCEPTED / HUMAN_NOT_SIGNED**。本文件不是完整 List Foundation、第三插件 Human、正式个人 Saved View 或生产权限认证。

## 任务依据与取舍

依据 [近期八步计划 CV-07](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)（第三插件 Item/Warehouse、复用 Eidos/Platform/Owner/Agent、不引入第二套列表或权限引擎）。按当前工程事实，Dictionary / Counterparty 已采用既有 `foundation/collection-query` 和 Eidos CatalogBrowser `table`；Item 已有 `apps/item/{repository,projection-service,access,projection-actions,page,capability-manifest}`，但仅暴露无界的旧 My Items/Items Projection READ 与卡片列表，尚未采用标准授权分页查询。**选择 Item 而非新增第三套 UI、万能表或把 Warehouse 假设为已集成**。

## 本纵切代码职责

- `apps/item/collection-query.ts` 只在 **Item Owner 当前企业/主体/行级/字段授权之后** 调用公共 `parseDataCollectionQueryV010` 和 `pageAuthorizedCollectionRowsV010`，提供 `search/sort/direction/page/pageSize` 白名单和 `DataCollectionResultV010`；稳定排序 tie-break 为 itemId，不接受 SQL/任意字段。
- 搜索只在公开的 `displayName` 与有权 `code` 上进行；按未获授权的 `code` 排序失败关闭，不允许用隐含计数搜索隐藏字段。Collection cells 只投影 Item 当前 readable fields，不输出关联 Responsibility、Extension 内部对象。
- `ItemProjectionService.read({query})` 可选新增分页；**没有 query 的旧行为保持原样**（旧 projection/count/page 不改），并在新调用中将当前页与 owner Collection 结果一起返回。
- 在原 Item Feature 增加两条 `READ` Capability Operations，`item.collection.directory.query` / `item.collection.my-items.query`，同时供 Human 和内部 Personal Agent 发现；Operation 仍绑定当前 Item Action Host 和原 `item.read` 授权。责任人视图只在正常授权集合上交集 `ITEM_STEWARD`，不产生读授权。
- `createItemProjectionPageV010` 在收到当前 Owner `pageInfo + tableQuery` 时复用**原 Eidos CatalogBrowser table** 的 view 搜索、服务端排序、分页和可读字段列；未传新参数时继续渲染旧页面。路由只是展示坐标，任何点击须重新走 Host/Owner READ。
- `manager/server.ts` 复用现有 Item 页面分支，将 `/items`、`/items/my-items` 安全 URL Query 传给现有 `ItemProjectionService`，不再默认用旧无界列表，旧 Item Create 动作保持；详情 `returnTo` 只是通过 allowlist 的返回导航，任何重新打开列表仍再次调用 Domain Owner。
- 新协议测试使用真实 Item Enterprise Resource、Responsibility、Eidos Renderer、静态 Host Authorization、原 Item Capability 与 Action Handler；验证真实分页、My Items 责任交集、隐藏 code 搜索/排序拒绝、跨企业伪造、非法 SQL/URL、旧调用兼容。

## 当前不做 / 严格证据等级

此切片已新增当前 `manager/server.ts` Item 页面 URL→Owner query→Eidos Table 的受限接线，以及详情 `returnTo` 白名单验证和返回坐标；**但尚未由真实 Host HTTP/Chromium 1280/390px 验证该接线**，也不证明东京已部署或真人签收。通过实际 Host/浏览器验收后才能进入 CV-07 更高证据等级。也不在此新增导出/导入引擎、数据聚合/看板、Saved View WRITE、生产 Host SQL、Agent 私有模型或新的 UI Renderer。CV03 Human SAVE、CV04 正式 EXPORT、Human OIDC 与 PA05 Operator 原安全门禁继续保持 OFF。

该切片通过 Platform CI 只可签 `CV07_ITEM_COLLECTION_THIRD_OWNER_CODE_AND_PROTOCOL_PASS`，**不能签** `LIST_FOUNDATION_HUMAN_PASS`。下一段是当前 Eidos/Host 路由的真实 1280/390px 浏览器授权分页与恢复，然后才是 Item/Warehouse 导入到列表的用户操作、1k/10k 性能证据、开发者接入教程/CI 与人验。业务用户验收入口应在这些可见功能打通后给出，不应因文档或合成数据完成就通知用户「已开发完成」。


## 2026-11-19 最终工程/东京物理部署证据回执（新窗口先读）

- **第三插件实际范围：** [PR #1365](https://github.com/jiangxng/EVO-App-Platform/pull/1365) 在受保护 `main` 以普通 merge commit 合入；准确 PR HEAD `08b86f5e54e12335acae19a30c069932f1e8689b` → main merge **`206dee5290901884a3115b05a433bf8d1aec806c`**。Item Repository/Responsibility/Authorization 与 Platform `foundation/collection-query`/Eidos Table/Agent Capability 已复用，并且 `manager/server.ts` 真实 Host 页面路由已将严格查询重新交给当前 Owner；详情返回参数仅是安全白名单导航坐标。保留原 Item Create 操作，消除了重复本地搜索框和双重视图按钮。
- **PR HEAD 所有 Actions：50/50 SUCCESS**。原始关键 Run：[Platform #44461062262](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44461062262)、[Continuity #44461062331](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44461062331)、[Human UI Review #44461062268](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44461062268)、[Lightweight Host #44461062070](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44461062070)。
- **合并后 main 42/42 Actions SUCCESS，零 FAIL**；主线代码 SHA 是 `206dee5290901884a3115b05a433bf8d1aec806c`。
- **东京真实物理 DEV/PREVIEW 发布成功**：[Tokyo Actions #44461587505](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44461587505)，`preflight SUCCESS`、`deploy SUCCESS`（不是 SKIP）。实际远端 `docker compose ps` 的运行镜像：`ghcr.io/jiangxng/evo-app-platform:206dee5290901884a3115b05a433bf8d1aec806c`，`Up 6 seconds (healthy)`；原证标记 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=206dee...`、`EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、`EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`（未授权 401）。Build manifest digest `sha256:dd36f655850b954d0fb8ba19b3fdb5786c6ffab721da5e9dcb17c236ed4282bb` **仅为构建 manifest**，并未独立取得运行容器 digest。
- **过程分支已精确退役**：[Branch Hygiene #44461487553](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44461487553) 原始日志 `DELETED_VERIFIED_MERGED_PR_BRANCH feat/cv07-item-authorized-collection-v1-20261119 @ 08b86f5e54e12335acae19a30c069932f1e8689b`；后续直接查分支返回 404。没有广泛删除或碰并行 #1184。
- **阶段界线：** 这是第三插件 Item 的**代码+协议+真实东京 DEV/PREVIEW 部署**通过，**不是**真实 1280/390px Chromium、实机 Human、1k/10k 数据量压力、开发者第三方接入教程或整个 CV-07 的最终验收。下一切片应以同一 Item Host/Eidos 主线（不是新框架）执行浏览器点击“全部/我的 Item”→搜索/排序/分页→详情→返回原筛选→换企业/撤权的真负例、移动 390px 与键盘；再补 1k/10k 性能与开发者接入核验，达到可供业务用户操作时再通知。不得把自动协议回归提升成 Human PASS。
- **用户新增优先级决定（2026-11-19）：** 未来倾向部署私有模型；当前继续 List Foundation，DeepSeek 余额提醒和客户端费用估算**非本开发线关键阻塞**。今后的私有模型接现有 `llm.inference` Provider/Host/Agent；不要再次重造授权/意图/列表框架。单独 [#1359](https://github.com/jiangxng/EVO-App-Platform/issues/1359) 的付费模型 L01–L05 安全条件依然不放行，但不阻挡 DEV/PREVIEW 非收费展示。用户已要求并设置开发完成验收通知的定期条件监测。
- **既有独立门禁原样：** Human OIDC [#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343)、CV03 SAVE OFF [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、CV04 正式 EXPORT OFF、PA05 Operator [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 及生产 WRITE 不因本交付获得签收。

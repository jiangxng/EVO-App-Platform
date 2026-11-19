# CV-07 第三插件复用与新 Collection 接入清单（2026-11-19）

> **状态：工程开发者接入说明 / 需外部开发者实操签收。** 本文来自当前 `main` 的真实 Item、Dictionary、Counterparty 能力定位，不是第四个插件已经接入或 Human 验收完成。沿用 [八步原计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)，不启动第二套 Grid/Host/授权系统。

## 现有参考纵切（先复用，再扩展）

| 职责 | 现成源码路径 | 必须遵守 |
| --- | --- | --- |
| 公共受限查询 | `contracts/data-collection/query.ts`, `foundation/collection-query/index.ts` | `parseDataCollectionQueryV010` 白名单 search/sort/direction/page/pageSize；`pageAuthorizedCollectionRowsV010` **必须**置于 Domain Owner 逐行逐字段授权之后。公共 helper 只适合受限的小规模内存集合，不是远程数据库/100k 索引查询服务。 |
| 第三业务 Owner | `apps/item/repository.ts`, `apps/item/access.ts`, `apps/item/projection-service.ts`, `apps/item/collection-query.ts` | 当前 Principal + Enterprise Scope + 角色/行/字段权限先决定可读全集。授权后的搜索不能触及隐藏 code，非法排序失败关闭。新分页查询先选择页再装配当前页扩展，旧非分页调用保持原语义。 |
| Host/Agent | `apps/item/projection-actions.ts`, `apps/item/capability-manifest.ts` | 按原 `READ` Capability Operation 注册、发现、调用，现有 ActionRouter/AuthorizationProvider 统一接入；不把路由、责任人 ID、Agent 提示词当作额外授权。 |
| Eidos / Host UI | `apps/item/page.ts`, `manager/server.ts`, `vendor/eidos/src/catalog-browser/` | 使用已有 Eidos `CatalogBrowser.table`、受限 view/search/page 和详情 `returnTo`。URL 仅展示坐标，点开时重新查 Owner，不新写业务私有表格/颜色。 |
| 可验证回归 | `tests/protocol/cv07-item-authorized-collection.test.mjs`, `tests/cv07/real_host_item_chromium.py`, `tests/cv07/item-collection-scale.test.mjs` | 既有真实 Owner + Chromium 1280/390 的 Run 和新 1k/10k 隔离 Owner 性能 receipt 分开分级；不得把离线数据当成东京真实账号、真实用户或实际 PG 负载。 |

## 插件作者的最小接入步骤

1. **选现有业务主数据/Repository，不发明 BaseList。** 为新 Collection 指定稳定 `collectionId`、`schemaRef`、Domain Owner、可读字段，以及字段可否排序/搜索。沿用目标业务对象的导入和详情能力，不重新实现 Import Job/Recipe。
2. **在 Domain Owner 内强制授权再查询。** 由 Host 当前 `PlatformRequestContextV010`、企业关系、业务资源/字段策略获得允许的行和字段；缺 Principal/Scope、未安装或已停用能力、字段未授权全部拒绝。责任归属只能在有权集合上取交集，不能扩大权限。不得用当前页推断全量聚合。
3. **给旧调用保留行为，为新调用显式 opt-in 有界查询。** 根据 Item 示例实现 `DataCollectionQueryV010` 五项白名单、稳定 tie-break、后端合法全集搜索/排序/分页和精确/声明的 countKind。针对大量/远端数据，应由 Domain Owner 的索引数据库执行有权过滤、排序与分页，不能全量载入 Platform Host。
4. **使用现有 Eidos table 和两端路由。** 由业务 Owner 输出 `DataCollectionResultV010`，Eidos 只渲染读到的可见字段、当前页及用户有权的操作；桌面 1280 与手机 390 要覆盖搜索、分页、详情/返回、无权限、错误、禁用插件。
5. **为 Human 和 Personal Agent 暴露同一套 READ Operation。** 复用原 `Capability Operation` / ActionRouter / Agent search/describe/invoke，不引入任意 SQL、模型决定权限或新 Provider。对未来私有模型仍沿用现有 `llm.inference` 适配层。
6. **本地验收 → 准确 HEAD Actions → 受保护 main → 真实东京判定 → 分支清理。** 最小测试同时覆盖两企业的拒绝、隐藏字段、非法 query、责任归属、换企业、Feature 停用、详情返回、桌面/390px；对 1k/10k 记录写清 Fixture/Runner/p95/RSS，不设没有证据的固定 SLA。审计后才请人验收。

## CV-07 额外验收证据分层

| 验收层 | 可确认 | 不能自动声称 |
| --- | --- | --- |
| Owner 1k/10k 隔离内存 | 真实 Item Repository/EnterpriseResource、Host 静态 AuthorizationProvider、合法 Query/分页/扩展装配次数与 Runner 的 p95/RSS；专用 Actions artifact | 真 PostgreSQL 大规模延迟、生产 p95、100k 规模、真实 OIDC 用户或手机实机 |
| 当前 Item 真 Host + Chromium | 已有 [主线 #44466260336](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44466260336) 1280/390 自动浏览器授权与导航 PASS | 独立开发者照本文新接第四插件、业务用户实际签名确认 |
| 东京 DEV/PREVIEW | 已有 [发布 #44466291838](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44466291838) 当前代码 SHA、容器健康、HTTPS、401 边界 | 无需登录的公开演示、真实企业 OIDC、生产 WRITE 或 CV03 SAVE/CV04 EXPORT 已开启 |

**本轮计划保留的人工验收：** 非框架开发者按本清单在隔离分支完成一条新的合法 Collection 适配并出示准确 CI；业务用户在实际预览页面做 3–5 个交互签收。正式 CV03 Saved View、CV04 后台 Export、Human OIDC、PA05 Operator 和生产 WRITE 门禁独立保持关闭；并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 不改动。

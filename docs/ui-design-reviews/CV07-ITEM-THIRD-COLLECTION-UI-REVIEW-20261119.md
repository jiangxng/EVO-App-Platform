# CV-07 · Item 第三插件复用 Eidos Collection Table — Human UI Review（2026-11-19）

> 依据 `apps/item/page.ts` 的本次真实改动、既有 Item Owner 授权服务和 Eidos CatalogBrowser Table；**工程候选，不是用户实机或浏览器签收**。原开发计划见 [CV-07 近期里程碑](../plans/foundation-list-experience/COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)。

## 目标与完成条件

用户在原 Item/我的 Item 列表中使用同一个 Eidos Table 完成搜索、列标题排序、分页、切换“全部/我的 Item”，保留 Item 对象插件自己的数据/授权语义，不再复制一套列表。代码通过按权限裁剪的服务端 Collection 分页和 Eidos 交互回归后只能标记 `CODE_AND_PROTOCOL_PASS`；尚需真实 Host 路由、桌面/390px 和业务用户点击确认，才可通知用户进行 MVP 验收。

## 流程与步骤

入口是既有 `/items` 与 `/items/my-items`；在调用 Item Owner 的 `read({query})` 后，把当前授权分页结果、字段集、query 一起交给 `createItemProjectionPageV010`。用户搜索 Item 名称（有权时才包括编码）、点击受支持的列排序或选择分页后，在原路由携带白名单字段；下一次读取重新经过 Host、责任范围和 Item Owner。无需保存查询，不引入第二份 Store。旧调用没有 `pageInfo` 时仍保留历史卡片页，兼容现有入口。

## 导航与信息架构

页面共用“全部物料 / 我的 Item”两视图。切换视图重置页号为 0，但保留合法搜索、排序和页大小；当前项由 `selected` 标注，Eidos 再用 `aria-current` 表达。行激活保持原 Item Detail 入口，不让表格排序动作触发业务写入。**当前纵切还未完成**详情返回原筛选/焦点和真实 Host URL→Owner 绑定，下一小 PR 补齐后再做用户验收。安全 URL 仅限 `/items` 与 `/items/my-items`，重复字段、SQL/外部域等失败关闭。

## 视觉与颜色

严格继承 Eidos CatalogBrowser 的 `layout:list` / `density:compact`，沿用既有筛选、表格列、上一页/下一页和当前视图状态样式，不加入自定义 Item CSS、色板或第二套 DataGrid。详情页和创建/编辑页保持现状。无设计截图，不宣称已达到最终 V3 视觉一致性。

## 记忆与注意力

不在每个 Item 视图重复放一套新按钮，不显示只有当前页数据却声称“全量结果”的本地搜索框。列排序状态按查询显式提供，当前页 `start–end / authorized total` 给出明确范围。切换企业/用户后不能沿用旧页面响应，下一次操作必须重新取当前 Owner READ；对缺授权字段不显示列或排序入口。

## 无障碍与跨年龄

Eidos 负责原生 table、可见列标题及 sort direction、语义 `aria-current`、可点击触控目标与错误状态。新增页面不嵌私有交互或悬停才能操作的菜单。需要 Chromium 1280/390px、键盘 Tab/Enter、NVDA/VoiceOver 和真手机 Human 复验；**本 PR 不声称已跑物理设备**。

## 安全与数据修复

Scope: 行权限来自 Item 当前 Enterprise/Principal 与 `ITEM_STEWARD` 交集，列权限来自 `readableFieldIds`。隐藏的 Item code 不能参与搜索或排序；不能因 URL 上有 code 就恢复被拒列，禁止由客户端自行过滤授权结果或由模型猜测合法条件。非法 Query/Route 必须拒绝，而不是放宽筛选。旧 Item 页面显示的已授权详情不变，不引入 WRITE、CV03 Saved View 或正式 CV04 EXPORT。若返回结果不可用，由现有 Host 错误处理，禁止显示跨身份缓存。

## 证据与剩余问题

- 代码：`apps/item/page.ts`、`apps/item/collection-query.ts`、`apps/item/projection-service.ts`、`apps/item/projection-actions.ts`、`apps/item/capability-manifest.ts`。
- 同 PR 回归：`tests/protocol/cv07-item-authorized-collection.test.mjs`，覆盖 Eidos HTML server search、视图路由、真实授权 Item 页面、分页、隐藏 code 和非法输入；代码完成不等于真实浏览器结果。
- 待验证：Host 路由从 URL 解码的完整入口、详情返回原筛选和焦点、桌面 1280/390px 真实 Chromium、真实企业会话、用户签收。
- 不应以本次源文件、文档或 CI 通过代替 `HUMAN_PASS`。

## 页面模式与导航归属

Item 插件**只提供已有 Eidos 的 CatalogBrowser 声明**，Platform 负责 Context/Feature 授权与 Action Host，Item Owner 负责页数据、查询和责任范围；Eidos owner 保持表格/导航/颜色/键盘行为权威。新增表格是旧 Item 页面**可选的新投影展示**，不是强制重建或抢占原 Shell。

## 功能、布局、颜色对照

功能：旧 Item 卡片/详情/导入/创建入口保留，新 Table 模式只增加已授权搜索、排序、分页、全部/我的两视图。
布局：仍是 Eidos 管理列表；桌面展示紧凑列，窄屏由原 Eidos CatalogBrowser 响应式实现，不新建固定宽度面板。
颜色：沿用 Eidos token、原导航选中和按钮状态，Item 插件不添加品牌色/局部 CSS。

## 入口、退出与恢复矩阵

| 场景 | 入口 | 退出 | 异常恢复 |
| --- | --- | --- | --- |
| 有权 Item 列表 | /items + Host Owner READ | 打开 Item 详情 | 返回参数保留/焦点回归待真实 Host 补齐 |
| 我的 Item | /items/my-items + Item Owner、Responsibility | 切换全部 Item | 责任撤销后重新 READ 不显示已撤权行 |
| 搜索/排序/分页 | Eidos Table 受管链接 | 下一页/换视图 | 参数越界/隐藏字段拒绝，不静默降级 |
| 企业切换 | 当前 Host Enterprise Context | 原页失效重读 | 不允许跨企业缓存或从旧 URL 恢复权限 |

## 浏览器与 Human 证据

桌面：目前仅源代码和 Eidos HTML 测试，真实 1280px 浏览器尚未签收。
移动：目前仅复用原 Eidos 布局，390px 真浏览器/触摸测试待执行。
Human：**NOT_SIGNED**，不能从自动化测试推断使用者已经认可交互。
入口：既有 /items 和 /items/my-items，未追加独立业务路由。
退出：点击 Item 详情或切回原视图，详情返回保持查询未完成完整浏览器签收。
异常恢复：禁止字段/错误筛选/企业切换依赖 Owner 每次再授权；真实页面异常演示尚未通过。

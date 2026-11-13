# CV-05 Window11 #04/08 — Eidos Agent → 列表真实浏览器验收

> 2026-11-13。工程证据记录与测试范围，**不是 Human 签名，不是东京真实账号登录**。复用既有 Eidos Chat、Catalog Browser、Domain View/Return、真实隔离 Host 和上轮 CV04 Chromium Fixture；不新建 UI、平行 List 组件或 CSS。

## 目标与完成条件
用 Playwright 的真实 Chromium 运行原 Host 代码，在 1280×844 与 390×844 视口，对 My Suppliers / Business Dictionary 执行一次从聊天操作按钮到业务列表，再到详情和返回的可见操作；验证过滤/分页参数、企业 A/B 权限重新读取、按钮触达和页面水平溢出。浏览器和截图证据由同一 PR 的 GitHub Actions 生成，不能用静态 DOM 快照冒充点击。

## 入口、导航与交互
- 真实已安装的 EVO Host：沿用 \`tools/cv04/real-host-csv-browser-fixture.mjs\`，其本地静态 HUMAN 只是**隔离测试身份**，不代表真实企业用户。多企业真实 Repository 数据来自该夹具，保留 Host ActionRouter 与 Eidos 页面载入能力。
- 生产 \`presentPersonalAgentCollectionReadV010\` 接收来自当前企业真实 \`/v1/actions\` 的有权 Dictionary/My Supplier READ；\`presentPersonalAgentReplyV020\` 和原 Eidos Chat Renderer 转换为“在列表中打开”。测试通过仅在 Chat Transcript 中**插入真实渲染的消息 HTML**这一测试缝隙，绕过在线 LLM 推断而保留浏览器对真实按钮和导航回调的执行。
- 1280px 使用实际键盘 Enter；390px 使用 Chromium 触摸操作。浏览器点击后，从现有 Eidos Domain 重新加载有权列表、点击记录详情、通过原 context navigation 返回，比较 route 的搜索、排序与分页。不采纳复制前端业务路由或缓存 Owner 结果的方案。
- A 企业旧聊天消息在同一个浏览器切换至 B 企业后，再点击旧入口，必须呈现 B 当前 Owner 查询的数据、不能重新得到 A 企业行。切回 A 后，再次加载恢复 A 数据。

## 视觉与颜色
原 Productive Design Language 的 Chat Proposal、列表 Table 和 Detail Breadcrumb。没有添加按钮样式/应用私有 CSS；原始截图输出 4 组 × Chat/List/Enterprise B，并附每个 viewport 的 documentWidth 和按钮几何。390px 下要求页面无水平溢出，按钮处于 viewport 且本地键盘/触控可激活。不以“理论响应式”替代该 Chromium 证据。

## 无障碍及恢复
1280px 原生 Button 的 focus + Enter 走浏览器事件，390px 用 Playwright tap 触发 DOM；已有 App Host Delegation 和 Eidos 视图返回直接沿用。屏幕阅读器、Android/iOS 真机与真实登录依然为待验，Chromium 不能自动代表辅助技术。没有授权时目标页由 Host 重读控制，不根据 URL/前端按钮可见性放行。

## 证据等级、边界与归属
- G：已读 \`tests/cv04/real_host_csv_download_chromium.py\`、原 Host fixture、\`page-controller.ts\` 实际 Chat Action/列表行点击、既有 CV02 Detail Return、#1314-#1317 原 PR/Actions。
- D：增加新 \`tools/cv05/prepare-real-host-agent-list-browser.mjs\`、\`tests/cv05/real_host_agent_list_chromium.py\` 和隔离 Workflow；复用 CV04 的业务数据，避免修改其脚本。证据在 \`artifacts/cv05-agent-list-browser/\`（Actions upload-artifact），原始 PR SHA 和运行结果以实际 CI 为准。
- 未验：真实 LLM 自主工具选择准确率、真实 Google 登录、东京带权限人工点击、移动设备物理操作、屏幕阅读器、视觉截图人工审阅。CV03 Human SAVE 与 CV04 后台正式 EXPORT 继续 OFF，#1212 N1=NOT_CERTIFIED、#1092 不被视为已签署。

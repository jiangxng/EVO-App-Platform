# CV-04 / List 基础插件 — 实际 Host + Eidos Chromium CSV 下载验收

> 2026-11-12；本验收是一条 **不接触生产/东京真实数据** 的真实 Host + 真浏览器自动验收纵切。并非“真实登录员工/Human 点击过按钮”或“Tokyo 已经人工签收”。严格复用已合并 [字典下载](CV04-DICTIONARY-CURRENT-PAGE-EXPORT-HOST-EIDOS-20261112.md) 和 [Counterparty 下载](CV04-COUNTERPARTY-MY-PROJECTION-PAGE-CSV-20261112.md) 源码、现有 Eidos 及原 Host。

## 目标与无重复工作策略

- 此前原 Protocol 通过仅能证明 Owner ActionRouter/CSV envelope，现有 BEX01 Chromium 证明供应商页面但**没有点击本次 CSV**。故补真正 `Eidos UI Button → HTTP /v1/actions → ActionHost → 实际 Owner → Blob → Chromium 下载`，而不是新造 UI 或做另一轮假的协议测试。
- 使用 [独立真实 Host 初始化器](../../../tools/cv04/real-host-csv-browser-fixture.mjs)：启动 `dist/manager/server.js`（Local Experience **静态 HUMAN Session**，非真实用户凭据），随机临时 Enterprise 资源文件，正规安装 `evo-counterparty`、`evo-responsibility`、`evo-business-dictionary`，通过真实 Host `enterprise.context.create`、`counterparty.create`、`counterparty.role.assign`、`responsibility.assign`、`dictionary.draft.save` / `dictionary.publish` 创建无生产来源的测试数据。
- 两个“我的”投影分别创建本人 Alpha/Beta 与他人 Hidden；字典两条发布记录且隐藏 Options 文本。用于证明**第 2 页只一条**、不会输出第一页、其它责任人的行、字典 Option、email/taxIdentifier 等隐藏字段。
- [Chromium 脚本](../../../tests/cv04/real_host_csv_download_chromium.py) 用真实 `/?surface=desktop#...` 路由，读取页面真实 DOM 的 `data-eidos-command` 与 `data-eidos-action-values`，点击 `export-current-page`，监听浏览器真实 `download`、读取落地 CSV 的 UTF-8 BOM/列头/行数/行内容、验证 URL 和分页不变化、隔离其他范围的原始数据。桌面 1280px 和手机仿真 390px/触屏分别运行三种业务页面，共 **6 次真实 Chromium 下载**。
- [新增受限独立 Actions](../../../.github/workflows/cv04-real-host-browser-csv.yml) 只在 CV04/Owner/Eidos 下载关键源码变更时 PR/main 自动执行，可手动 dispatch；脚本启动失败/浏览器失败可下载 `artifacts/cv04-csv-browser` 的日志、六张 PNG 截图和机器报告。启动后清理临时数据，不依赖网络 UI 驱动/铁路或真实客户数据库。

## 接受条件（以原始 Actions / artifact 为准）

1. 单独 CSV 浏览器工作流必须真实执行（没有 SKIP），精确 PR HEAD 的 `real-host-desktop-phone-csv` SUCCESS，原始日志出现 `CV04_REAL_HOST_CHROMIUM_DESKTOP_PHONE_CSV_TERMINAL_PASS=6` 和六个单页标记；不是只靠 React/HTML Render 的伪浏览器。
2. 真实下载事件覆盖字典、我的客户、我的供应商 × 1280px、390px；各下载 CSV 只有表头+1行、文件名指明第 2 页、不含隐私、Page ID/搜索/排序和浏览器地址不丢失，页面无 JS Error，document 不横向溢出。截图/JSON 作为机器级证据，不能写成真人 Human PASS。
3. 原项目 Protocol/Lightweight Host/Continuity/既有多 CI 均需精确 HEAD 全绿后才合并 main，合并后继续跑主线；纯新增测试与 CI（不改运行时）时东京 **deploy SKIPPED 是正确行为**。
4. 如果底座真实 UI 点击失败，修复的是实际 Owner / Eidos Bug（必须保持原界面单一权威），而不是绕过真实浏览器脚本以求绿灯。修复要在同一 PR 并保留首个失败的链接。

## 阶段界限

- **G 源码已读（2026-11-12）**：仓库已合并的 Dictionary/Counterparty/Responsibility Owner、Eidos `action-download.ts` / `page-controller.ts`、`tools/bex01/isolated-host-fixture.mjs`、`tests/bex01/live_supplier_chromium.py`、`.github/workflows/bex01-real-browser.yml`。
- **D 本次设计**：独立 CI、真实 Host 非生产静态身份 + 真浏览器自动下载、6 路矩阵、未授权/隐藏数据不泄漏和实际 CSV Artifact。新增文件在 CI green 前均为待验证实现。
- **P 保留**：真实 Tokyo 登录用户、移动真机、手工键盘和屏幕阅读器、两个真实企业撤权、真实 LLM 自然语言 Agent 会话，及跨页安全 Export Job。不能称此条完成 CV04 或 List 基础插件。
- **N1 与生产安全不受影响**：`N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、SAVE POST 403 / 未注册 GET 404 保持；#1184 Owner 受管文档不改；User 免的是普通 List 开发逐步审批，不是突破数据库/KMS 生产安全。

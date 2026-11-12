# CV-04 / Counterparty My Customers & My Suppliers CSV — Eidos UI 设计审查

> 2026-11-12，同一 PR 真正变更源文件 `apps/counterparty/page.ts`。Eidos 仍是唯一 UI 权威；此设计审查不是实际用户或移动设备通过证明。详见 [工程记录](../plans/foundation-list-experience/CV04-COUNTERPARTY-MY-PROJECTION-PAGE-CSV-20261112.md)。

## 目标与完成条件

Human 在原有 My Customers / My Suppliers 表格按已有视图、搜索/排序、分页找到自己负责的行，点击次要「导出当前页 CSV」，获得**当前授权页、当前显示的列**，仍留在原列表。Personal Agent 经相同受管 READ Operation 获得同一范围；不是全库数据打包。

## 流程与步骤

选择企业→工作台「我的客户」或「我的供应商」→搜索/排序/翻页→次要「导出当前页 CSV」→原 Eidos ActionHost 返回 `download`→浏览器保存 CSV。操作不改变当前页 Query。取消下载、拒绝或权限变动后留在原页面，明确拒绝、可重试一次新授权读取。

## 导航与信息架构

保留现有 Counterparty 一级「客户 / 供应商」和工作台「我的客户 / 我的供应商」。只修改原分页 My Scope 页动作，不新增全局导航/第二列表页/第二个数据导出后台入口。详情继续用现有 `returnTo` 返回父级/列表，页面原 `contextNavigation` 保持。

## 视觉与颜色

复用 `CatalogBrowserV010` actions 的默认 Eidos 按钮和 CSS；导出属于非 primary 操作，不抢占 Import 原 primary，也不覆盖标题/视图导航；不改主题 tokens。对照既有 CV-02 表格和 CV-04 Dictionary 导出方式，一致不另建 V3 HTML/卡片。

## 记忆与注意力

标签明确写「当前页」避免“全部客户”误解。当前搜索、排序、分页已在 Action values 中传给原 Host，下载不触发导航；当前表格列过滤自动作为字段列表。出错留在当前页，避免重新选择对象；不把 CSV 全文复制到页面状态区。

## 无障碍与跨年龄

使用现成 Eidos 命令按钮的语义、键盘响应和下载状态，无新手势/自定义图标。桌面和 390px 需要验证可见性、焦点顺序、按钮触控大小及长标题换行，不能根据复用 Eidos 推断已 Human PASS。

## 安全与数据修复

操作只是呈现 intent；Host 每次重查登录 Principal、Enterprise Context、成员关系和 Feature；ProjectionService 逐行/逐字段授权后才进行排序、分页。下载列仅为 `displayName/code/status/subjectType/countryOrRegion` 的当前可见子集，拒绝 `email/taxIdentifier/notes`、非法字段、跨企业和 Feature 停用。CSV serializer 处理电子表格公式注入；不写入业务数据、不生成跨页 URL。

## 证据与剩余问题

机器代码测试在 `tests/protocol/cv04-counterparty-my-page-csv-export.test.mjs` 直接使用真实业务仓库、Role、Responsibility、Authorization、ProjectionService、ActionRouter、Eidos HTML、下载 envelope 和负例，结果以准确 HEAD CI 为准。桌面下载截图、390px 图片、登录身份真账号/Agent 自然语言调用尚未取得；发布以后继续实际 browser 验收。

## 页面模式与导航归属

页面模式是旧的 Counterparty Projection CatalogBrowser 表格，不新建页面。应用导航归属原业务领域和 My Workbench；后台导出不是全局工具页。现有 Filter/Sort/Read Scope 页级 Context 是唯一依据。

## 功能、布局、颜色对照

功能：现有 My Customers/My Suppliers 的筛选、表格、返回与 Agent READ 原样保留，新增按当前页导出 CSV；全量/敏感字段批量导出留待专门 Owner 权限设计。
布局：原表格顶部添加非主按钮，不挪动既有导航、搜索和主操作；窄屏是否溢出待 Chrome 390px 实测。
颜色：继承既有 Eidos Productive Design Language，不添加项目私有色彩/背景/边框；实际浏览器截图待取得。

## 入口、退出与恢复矩阵

| 入口 | 动作 | 目标与退出 | 异常恢复 |
| --- | --- | --- | --- |
| 登录企业 → 我的客户 | 搜索 / 排序 / 第 2 页 → 导出 CSV | 浏览器获取第二页可读列；留在原列表，详情返回 `returnTo` | 撤权 / 切企业 / 非法列时 Host 拒绝，不保存旧 CSV |
| 登录企业 → 我的供应商 | 当前分页导出 | 当前有权采购责任对象，不包含其他责任人 Supplier | Feature 停用直接拒绝，不唤醒未安装插件 |
| 业务管理员 → 全部客户/供应商 | 保持原操作 | 原全部视图不产生 My-scope 假导出 | 通过原 scope tab 去 My 页面 |
| 旧未分页页面 | 无导出入口 | 原责任范围导航保持 | 不默默把旧全量对象列表导出 |

入口：现有 My Customer / My Supplier 主工作台与对应 Counterparty 页。
退出：下载完成不离开本页，已有详情 → 上一级/返回仍走原 Eidos 链路。
异常恢复：保持搜索排序分页状态，在 Host 明确拒绝时不进行文件下载；合法授权恢复后再次点击。

## 浏览器与 Human 证据

桌面：真实东京登录 Chrome CSV 点击、下载内容和返回截图**待实测**；Protocol Render + Action Download 不等于浏览器 Human 验收。
移动：390px Chrome 布局/触控/回退截图**待实测**，不能凭 Eidos 复用宣称 PASS。
Human：真实企业成员及撤权后人员、个人 Agent 自然语言操作**未签收**；均标 `HUMAN_PENDING`。

## 证据源和边界

G：已读本仓库 Counterparty `access.ts`、`projection-service.ts`、`page.ts`、`projection-actions.ts`、Eidos 原 `action-download.ts`；D：当前页、列白名单和原 UI 次要按钮设计；P：最终 CI、真实截图、Human/Agent 登录流程。未访问新增外部设计网页。不修改 N1=NOT_CERTIFIED、SAVE OFF。

# CV07 第三插件 Item：Eidos 手机排序可达性与真实 Host 浏览器审查（2026-11-19）

> 阶段：**候选 / exact PR HEAD Chromium 尚未完成**，只有 GitHub Actions 真正通过后才能标为已验收；自动化真实 Chromium 不等于真人、OIDC 或生产发布。原 Item 授权集合第三插件已由 [PR #1365](https://github.com/jiangxng/EVO-App-Platform/pull/1365) 合入东京 DEV/PREVIEW；本轮只补漏掉的 1280/390px 人机可操作证据。

## 功能问题与原始证据

[本轮 Draft PR #1367](https://github.com/jiangxng/EVO-App-Platform/pull/1367) 第一次真实 Host/Chromium [#44463631481](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44463631481) 验证了安装 Item、两企业 Owner 数据和桌面表格搜索/排序/分页后，详情返回控件的测试等待过早（`CV07_RETURN_LINK_MISSING`）；改为等待异步 Eidos 真实可见返回控件。第二轮 [#44463808950](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44463808950) 通过了详情和搜索，但 A→B→A 切换只改 localStorage 并导航同路由，复用了旧 DOM；现强制 reload 后再次从 Host 读取，不能通过缓存冒充授权。

第三轮 [#44464422922](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44464422922) 首次到达 390px 手机布局时暴露真实产品缺口：Eidos 的 `[data-eidos-catalog-table-wrap]` 在 <=700px CSS 中 `display:none`，原本唯一的 `sort-displayName` 也在隐藏的 `thead` 内，无法由手机真实点击。不是合法的 UI 手工验收；不能用 URL 直接赋值掩盖。参考[同库 Eidos 现有 renderer](../../vendor/eidos/src/catalog-browser/render.ts) 与 [响应式 CSS](../../vendor/eidos/src/design-language/productive-workbench-css.ts)。

## 采取最小复用方案：与原表头相同的授权排序

**只改共享 Eidos**，新增响应式 `data-eidos-catalog-mobile-sort` 导航。它直接从 `model.table.columns[].sortRoute` 和 `sortDirection` 取得**同一个业务 Owner 生成并通过现有 Eidos route allowlist 验证**的排序动作；没有任何客户端重排、SQL、另一套视图或跨页合成数据。桌面保留原 table header 排序控件并隐藏 mobile-sort；<=700px 显示原生键盘 `button` 和文字列名/↑↓↕，44px 最小触控目标，`aria-current` 标明当前排序。使用既有主题 Token，无新增硬编码颜色/独立业务 CSS。屏幕阅读器和真实手机仍需 Human 后续确认。

## 原业务列表、权限与失败恢复

- **Host / Owner**：复用 Item 原 `item.collection.directory.query` / `item.collection.my-items.query`，企业、Principal、责任交集、字段授权、当前页总数和排序仍由 Item Owner 决定。按钮只是路由坐标。
- **Eidos**：同一 CatalogBrowser Table（1280px）/cards（390px）包含 `All / My Items`、搜索、分页及详情返回，点击后回到 Host 重新查询。手机版不能以隐藏桌面按钮取得成功。
- **无障碍/布局/颜色**：原生 button，44px、键盘 Enter/触摸、aria-current、焦点轮廓和无横向溢出；仅用 Token。
- **非法/撤权**：伪造 Query/跨企业不允许，旧路由重新执行 Owner READ，禁用 Item 插件后真实 `/v1/actions` 拒绝。CV03 SAVE、CV04 正式 EXPORT、Human OIDC、PA05 Operator/生产 WRITE 均保持 OFF。
- **浏览器证据**：新 `tests/cv07/real_host_item_chromium.py` 与 `.github/workflows/cv07-item-real-host-chromium.yml` 使用既有 `tools/cv04/real-host-csv-browser-fixture.mjs` 建立隔离 Host；通过 Node seeder 在其上安装第三插件并建 A/B Item；保存 1280/390 screenshots/JSON。没有私有模型或任何收费 API 参与。

## 验收与适用边界

仅当 **最新 HEAD** 主线/PR 上的 CV07 Chromium、CV04 CSV、CV05 Agent List、Platform、Lightweight、Continuity、Human UI、BEX 浏览器等由 Eidos 共用代码触发的 Actions 真正完成成功，且精确受保护 main 合并、东京 DEPLOY 或正确 SKIP、Actions 精确分支清理完成，才签本切片。即使如此，CV07 的 1k/10k 压测、开发者集成教程、实际企业 Human/读屏和完整 List Foundation 用户验收仍未完成；交给独立完成监测，不提前通知。

## V3/已确认设计三轴

| 轴 | 本次修复 | 排除 |
| --- | --- | --- |
| 功能 | 手机上同业务列可排序、显示当前方向；完整 Owner 再读 | 不允许本地 sort 或无权限列排序 |
| 布局 | 390px 卡片上方紧凑折行的排序按钮；桌面沿用原表头，44px 触控 | 不同时显示桌面和手机两套排序入口 |
| 颜色 | Eidos primary/border/background tokens、焦点轮廓 | 无插件 CSS 或新主题 |

**治理**：短分支 `test/cv07-item-real-host-chromium-20261119` → Draft PR #1367 → 精确 HEAD CI → Ready → 受保护 main 合并 → 主线 CI/东京判断 → Actions 精确 Branch Hygiene。不得触碰并行 PR #1184。


## 目标与完成条件

在原 `vendor/eidos/src/catalog-browser/render.ts` 的只读 Collection Table / 响应式卡片共用模型上补手机排序入口，保留现有 Domain Owner 的过滤和排序；必须在物理 Chromium 390px 点击而不是直接篡改 URL，且主线 CI 不回退。手机/桌面自动化不能算正式 Human 签署。

## 流程与步骤

操作员进入 Item 已授权列表（从原 Host 当前企业 READ）→ 在桌面列头或手机卡片上方原生排序按钮选择名称/方向 → Host 根据相同 Owner 允许的 sortRoute 重读有权分页 → 打开详情 → 返回原筛选/排序/页号 → 切换全部/我的 Items → 更换企业并强制页面重新拉取。撤权后旧查询必须拒绝。

## 导航与信息架构

排序控制仅使用受限的 `model.table.columns[].sortRoute`，原 Eidos 校验 URL 必须为合法本地 route；不把手机排序作为单独页面或持久个人视图。桌面使用原表头、手机使用 `data-eidos-catalog-mobile-sort`，二者映射到完全相同的 Item Owner ActionRouter/Collection Query。我的 Item 责任交集不等于授权提升。

## 视觉与颜色

保持原 Eidos 字体、圆角、间距及 `--eidos-primary`/`--eidos-border-strong`/`--eidos-bg` Token。宽屏隐藏手机排序 nav，窄屏展示紧凑可换行按钮，使用列名和方向箭头 ↑↓↕，禁止插件私有样式或硬编码色值。基于同仓响应式 CSS `vendor/eidos/src/design-language/productive-workbench-css.ts` 实现。

## 记忆与注意力

当前排序字段、方向、搜索、页号、每页大小均由 Owner route 表示，用户从详情返回不必重输搜索条件；手机能看到原本隐藏的操作。点击某排序列保持原有 Eidos 反馈（`aria-current`），没有本地状态存储或新增第二套查询记忆。

## 无障碍与跨年龄

原生语义 `nav` + `button`，键盘 Enter/手机 tap 可操作，最小 44×44px，排序列使用方向箭头并设置 `aria-current`、焦点可见轮廓；浏览器自动化只证明程序可达，不替代真实读屏器或各年龄段真人体验。

## 安全与数据修复

Eidos 按已验证 Owner 生成的 `sortRoute` 导航，绝不按浏览器卡片本地重排、探测隐藏字段或绕开企业重新授权。现有 Item READ SQL/非法排序字段拒绝、跨企业分页和禁用 Feature 后旧路由拒绝均在 Node seeder 与浏览器 Actions 真实测。原 OIDC、CV03 SAVE OFF、CV04 正式 EXPORT OFF、PA05 Operator 和生产 WRITE 未解除。

## 证据与剩余问题

原始失败：CV07 Chromium #44464422922 手机找不到隐藏的表头排序。共享 Eidos UI 修复后的 [CV07 Chromium #44465271229](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44465271229) 实际输出 `CV07_ITEM_REAL_HOST_CHROMIUM_PASS:1280`、`...PASS:390` 和 `...ACCEPTANCE_PASS=2`；该 HEAD 工作流末尾因 Node 的 `sort()` 默认字典序导致 Artifact summary gate FAIL，已在候选补为数字排序 `sort((a,b)=>a-b)`，必须以最新 HEAD 重新跑确认。重构同一共用 Eidos 会触发 CV04 CSV / CV05 Agent 列表 / BEX Chromium 等既有 CI；结果必须逐项核验，不能用“测试代码已提交”签收。

即使真实 Chromium 通过，CV07 仍需 1k/10k 性能数据、插件开发者教程与最终可操作 DEV/PREVIEW 测试路径；并保留 Human/OIDC 未签收。只在正式完整 List Foundation MVP 可供用户操作时才通过已有自动验收提醒通知。

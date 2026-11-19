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

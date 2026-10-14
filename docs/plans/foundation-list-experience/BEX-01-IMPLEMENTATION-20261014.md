# BEX-01｜供应商表格、分页与移动端闭环记录（2026-10-14）

状态（截至 2026-10-14）：**CODE_MERGED + DEV_RAILWAY_DEPLOYED + CHROMIUM_VERIFIED / HUMAN_PENDING**。原文早期“唯一待合并 #827/尚未部署”的描述是当时的历史开发快照，不能用于当前结论。专项最新状态与下一步优先以 [扩展字段与 BEX-01 窗口交接](BEX-01-EXTENSION-USER-CLOSURE-20261014.md) 为准。

**当前确认成果**：Platform #827（表格/分页）、#833（查询/手机链接）、#838（表格样式）、#840（导入返回/错误提示）、#843（CP-03 扩展字段从未匹配列创建、继续映射、确认导入、详情显示）均已合并；Eidos #178/#179/#180 已合并。PR #843 合并 SHA `70597a0e`，真实 Host Chromium [运行 #38516099332](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38516099332) **4/4 PASS**，原开发 Railway [供应商页](https://ledger-configurator-production.up.railway.app/#/counterparties/suppliers) 当前部署固定为 `70597a0e`（SUCCESS）。用户实际 XLSX 操作、真实物理手机、数据库物理分页性能仍未作为本次页面链路验证过；不要将开发部署视为正式生产/人工签收。

## Owner、唯一开发主线与复用

- Platform唯一BEX PR：[ #827 ](https://github.com/jiangxng/EVO-App-Platform/pull/827)，分支 `feat/bex01-supplier-table-paging-20261014`。
- 通用表格归Eidos正式owner：[ #178 ](https://github.com/jiangxng/eidos/pull/178)，已合并main，包含共享CatalogBrowser可选原生表格、分页操作、受控搜索、移动端记录列表及安全区/触摸目标。
- Platform沿用Pinned Eidos目录中的对应增量；不在业务插件另造独立UI渲染引擎。
- BEX-00与PR #787已经完成供应商管理者导入入口、SUPPLIER预选、导入任务Review后返回、Recipe复用及失败隔离。对应 `tests/protocol/bex01-supplier-import-journey.test.mjs` 继续作为回归，不在本批重写Data Import/EC Agent。

## 本次确实实现的增量

1. Counterparty投影查询加入有限的服务端分页（默认25，最大100）、字段白名单搜索和稳定排序，查询前验证参数与路由来源；跨页使用同一来源、角色、责任、Principal授权语义。
2. `counterparty.projection.my-suppliers.read` / My Customers动作显式接受分页输入，旧不带query的调用仍有兼容语义。Host页面渲染接入实际查询，不拿客户端已加载的25行伪称整批。
3. 服务端结果按当前字段读取授权裁剪JSON，不只隐藏UI列；没有字段授权时不可通过排序/搜索来推断隐藏字段。
4. Supplier / My Suppliers等投影在桌面由Eidos原生table表达，列和排序入口来自已允许字段；窄屏变为同一数据页的可操作记录卡片。搜索提交、排序与上下页沿当前投影Route经Host重新认证。
5. 安全校验拒绝非法参数、额外查询键、重复键、跨路由查询、超限分页，保持原有导入和领域权威不变。

## 验证与仍需现场确认的门禁

- 代码级：`bex01-authorized-projection-pagination.test.mjs`、`bex01-supplier-table-mobile.test.mjs`、既有`bex01-supplier-import-journey.test.mjs`；Eidos`catalog-browser-table.test.mjs`。以对应准确PR head CI为准；此文不预先声称最新head CI成功。
- **尚未证明：** iOS Safari/Android Chrome的真实手机旅程、软键盘/大字/弱网、页面回退后焦点/查询恢复；完整用户浏览器体验需要实际运行验证。本批的响应式CSS和模型测试不能替代该验收。
- **存储层分页仍有技术边界：** 当前Enterprise Resource Repository只提供list，授权查询发生在服务端但内部仍需读取当前上下文集合；不是数据库cursor pushdown。10k真实负载的p95和内存目标未因接口新增自动达成。
- **生产**未部署；代码入main不等于上线或人工验收。
- 其他业务（Item/Warehouse、BEX-02~06、Agent/2D/TR）不在本PR范围。

## 接续准则

先核对PR #827、main和Eidos #178实际状态。CI门禁通过则及时合main；若平台仍有页面/访问权限上的缺陷，继续用原PR修复，不另开替代PR。仅在真实设备/产品流程的缺口被关闭后，才将BEX-01标记完全PASS。


## 第二轮代码与真实浏览器闭环（2026-10-14）

- 既有 Eidos 公共表格与 Platform 投影继续复用，不另造表格引擎、不重新编写 Data Import。
- Platform PR [#833](https://github.com/jiangxng/EVO-App-Platform/pull/833) 将投影视图的 Host 入口提前分流，**取消原来先全表授权一轮、再进入同一授权分页服务的重复读取**。目录/详情的原有读取与权限路径保持不变。
- Eidos PR [#179](https://github.com/jiangxng/eidos/pull/179) 已合并 `7895eaf08cd47318f076b991ddec4e93d36e7b75`，修复手机直接打开业务链接时默认停留在侧面板、工作区隐藏，以及紧凑列表样式遮盖表格显示策略的问题。Platform 的 pinned Eidos 代码与该修复同步。
- **真实浏览器证据：** [BEX-01 Real Host Chromium Supplier Journey](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38504544536) 在隔离真实 Host 上通过 **2/2**：桌面搜索、三页导航、浏览器返回；390px 触摸 Chromium 模拟器下的记录卡、分页、搜索、无横向溢出、跳转导入并预选 `SUPPLIER`。测试环境使用原有真实 Data Import 命令导入并提交 **53 条隔离供应商**，并非静态 HTML 演示。浏览器为 Headless Chromium 141.0.7390.37，自动生成 `report.json`、截图与 Host 日志。
- **10k 诊断：** 同一次 CI 的领域服务使用 10,000 条*合成内存数据*，4 次分页读取耗时 41.1/32.5/24.0/33.8 ms；p95(四样本)=41.1 ms、每次仅一次领域列表读取、40016 次授权检查（四页合计）、每页最多 25 条。该数字 **不是** PostgreSQL / Enterprise Resource 物理分页证据，也 **不是**线上 p95 承诺。当前底层 `EnterpriseResourceRepositoryV010.list` 仍需读取全集，未来如规模指标需要，应由资源 owner 扩展物理查询，不在 BEX-01 伪造 DB cursor。

**收口分级：** BEX-01 的桌面与模拟触摸浏览器开发闭环已验证；还未在真实 iOS Safari、真实 Android Chrome（软键盘、大字号、弱网场景）及实际 10k 持久层负载上取得证据。因此只能标记 **DEV_VERIFIED_CHROMIUM / PHYSICAL_MOBILE_AND_DB_PERF_PENDING**，不得写成生产全面验收或擅自部署。

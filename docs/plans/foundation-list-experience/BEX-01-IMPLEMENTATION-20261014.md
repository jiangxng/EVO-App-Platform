# BEX-01｜供应商表格、分页与移动端闭环记录（2026-10-14）

状态：**开发集成候选 / 主线合并与真实浏览器验收分别核对**。这是可持续交接记录，不是生产验收签收文件。

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

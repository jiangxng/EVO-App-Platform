# B8x：同一页面双 2D Designer 实例的独立性（2026-10-10）

## 交接与职责

本轮仅验证原 [2D Designer §14 P02](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-handoff-20261010/docs/architecture/EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) 的一个**真实浏览器自动化子场景**，接续 [B8v+B8w](./DIAGRAM-B8VW-CONGESTION-POSTSELECT-INTEGRATION-20261010.md)；使用独立 [App Platform Draft #607](https://github.com/jiangxng/EVO-App-Platform/pull/607)，堆叠在 #606 之上，不改 main、TR-01、Host/Agent 授权、投影 CAS、业务关系端点、Eidos 通用源代码或 App vendor。未经专门部署/人工验收之前，**原 P02 与 §14 39 项的正式状态均仍为 NOT TESTED**。

## 动机与真实测试内容

B8v 新增每帧可见拥塞计数及非阻挡 `role=note`，但此前的 Chrome 900/1200 边压力测试只有**单个画布实例**。不能凭每条线上的 SVG marker ID 在源代码看似隔离，就推断同屏两个 2D Designer 的选择集、提示和图数据不会串线。

在原真实 Firefox/WebKit Playwright 实测工具内添加一个隔离 HTML fixture，**同一 DOM 页面**挂载两套真实 `mountDiagramEditorPageV010`：
- 第一个图：两端业务节点和 23 个局部障碍节点，自动正交边，特意命中原有 22 相关障碍安全预算，期望产生拥塞提示；不能修改路由预算以追求假成功。
- 第二个图：两个普通节点和一条无障碍曲线，期望全局拥塞计数为零、无拥塞提示。
- 两个 `definition.id`、`resourceId` 和 ActionHost 均独立，浏览器内保持相同源数据对象。每次挂载前使用项目实际 `validateDiagramEditorStateV010` 校验。
- Firefox/Linux 与 WebKit/Linux 真正挂载两个 Surface，等两边 DOM 都到 `Ready.`。分别检查两实例各自的 SVG 拥塞 hit 数、汇总文本、`role=note` 与 `pointer-events:none`，并且箭头 marker id 不能相同。
- 使用浏览器原生 Playwright 鼠标先点击**第二**实例的节点，再点击**第一**实例的节点。要求第二实例选中时第一仍未选中，随后第一被选中时第二保留自己的选择集；双方拥塞计数仍匹配各自实际 SVG，底层 fixture 节点边数量未被改写；JS 异常必须为空。

新增标记为 `B8X_MULTI_INSTANCE_RESULT`，工作流必须检到该行方可成功。保留 B8u/B8w 既有 14/14 国际文字、选中后重排、258 可见 RTL 标签/256 次昂贵测量上限测试；不得以新增一个 PASS 掩盖原失败。

## 证据等级与未验证事项

- **代码**：只改 `tools/diagram-cross-browser-label-proof.mjs` 和 `.github/workflows/diagram-rtl-cross-browser.yml`，运行时行为和现有保存/权限无变更。
- **已声明测试目标**：同屏双实例、浏览器引擎、原生鼠标选择和显示层隔离；最新 head 成功、失败及修复必须以 [App #607 Checks](https://github.com/jiangxng/EVO-App-Platform/pull/607) 实测为准。
- **未完成正式验收**：实际顾客使用的双独立投影、同页双图长期反复拖动、跨企业权限隔离、真实 iPhone/Android/macOS/Windows 操作、数据库重启/保存、全部系统样式及 P02 完整人工验收尚缺。现有 39 项正式验收矩阵仍标 `NOT TESTED`。

**下一小步**：如子场景失败，优先定位实例作用域选择器、计数 DOM 作用域、marker ID 与真实输入事件，修复后重新跑该 head；不通过修改原约束或跳过测试取得虚假绿色。

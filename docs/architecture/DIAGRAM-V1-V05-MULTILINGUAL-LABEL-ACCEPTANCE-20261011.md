# 2D Designer 商业 v1.0｜V05 中英文长标签专项验收

**需求**：原 v1.0 §14 V05，长中文/英文节点名和关系标签应当可读，不能溢出卡片、遮挡无故不可恢复；真实物理设备/业务人员正式验收仍为 NOT TESTED。

## 初次真实 Chromium 失败（保留红灯）
[Actions #38115115006](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38115115006) 使用原生 Chromium 装载应用真实 Eidos Surface，新增长中文节点名称、长英文名称、长中英关系标签；节点标题超过节点卡片高度，`AssertionError: V05: rendered long labels must not vertically escape the node card`。这是实际浏览器断言失败，不是只做源码猜测。

## 修复与目标
- Eidos owner [PR #162](https://github.com/jiangxng/eidos/pull/162)：多语言节点标题自动换行、最多两行可视截断、完整原始节点名称保留在 DOM 和原生 tooltip；不用改变业务数据、节点尺寸或图形几何。
- Platform [PR #726](https://github.com/jiangxng/EVO-App-Platform/pull/726)：仅 forward-port 通用语义到已经标记 Host overlay 的 vendor Surface；`source.manifest.json` 更新精确 blob，不覆盖 Host context-navigation。
- 自动 Chrome gate [tools/diagram-commercial-v01-v03-browser-proof.mjs](../../tools/diagram-commercial-v01-v03-browser-proof.mjs)：检查两种长语言节点文本完整、渲染 label 的视觉盒不超出卡片、overflow hidden、完整 tooltip 含未裁剪原文；关系标签可见且完整 accessible title；完整 V01–V04 保存、连线和缩放回归不退步。
- Eidos [CI #38115202407](https://github.com/jiangxng/eidos/actions/runs/38115202407) 当前在源功能分支通过（不等于 Portal 真实浏览器）。
- 当前 Chromium 自动化运行按 PR #726 Actions 的最新 head 及结果填入，不抢先声明 PASS。

## 仍然缺失
- Windows/Mac/iOS/Android 原生实体设备语言字体效果、屏幕缩放、真实业务拓扑与长名称资产、业务人员接受程度/签收。正式 39 项仍 0 项签署。

# 2D Designer 商业化 — B5a 研究增量与决策记录（2026-10-10）

> **基于既有研究，不替换交接包。** 入口 [交接说明](https://github.com/jiangxng/EVO-App-Platform/blob/f559ca0c1de5442a85572886b64e8d2da5f8c1db/docs/architecture/EOG-2D-DESIGNER-RESEARCH-HANDOFF-20261010.md) → [官方研究索引](https://github.com/jiangxng/EVO-App-Platform/blob/f559ca0c1de5442a85572886b64e8d2da5f8c1db/docs/architecture/EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md) → [原需求 §14](https://github.com/jiangxng/EVO-App-Platform/blob/f559ca0c1de5442a85572886b64e8d2da5f8c1db/docs/architecture/EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)。正式逐项结果见 [39 项验收矩阵](./DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md)。

## 本轮核查的事实与来源等级

- **已读 GitHub 文件原文（2026-10-10）：** Eidos 的 `src/diagram/surface.ts`、`edge-waypoints.ts`、现有测试及实施台账；App Platform 的内置 `vendor/eidos/src/diagram`、`definition-projection-editor.ts`、`definition-projection-store.ts`、投影编辑测试和图形 CI 配置。依据均为 feature/PR 分支，不冒充当前 main。
- **已读 GitHub 架构原文：** Eidos `CONSTITUTION.md`、`MOBILE-DESIGN-LANGUAGE.md` 与 App Platform `EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md`；Eidos 负责通用输入与图形，Host 负责业务语义、授权与持久化。
- **继承先前窗口原文复核记录（本次未重复访问外部网址）：** 官方研究索引 S1 Miro、S2 React Flow、S3–S5 draw.io、S6 WCAG 2.5.7、S7 MDN pointer events。此轮实际设计直接使用 S4 的路径点操作、S6 的单指针非拖动替代及 S7 的 pointercancel/捕获区分。不要把这等同于此窗口再次逐页浏览外站。
- **新证据：** GitHub 对两仓库 PR 元数据、stacked base/head 与 CI 工作流及失败日志的直接查阅。Eidos `main` 在核查时是 `df6b09c8b21f15bdd5b96c4983a54f21f49e7ccb`，App `main` 为 `7f50702502ef8ca17be0656f44f8416ddc2852f8`。未来进入下轮必须重新核查 SHA。

## B5a 工程决策（本轮新增判断，不冒充 S4 / S6 / S7 原文）

1. 只为 **已选中、显式含手工 waypoints** 的关系显示控制柄；正交/圆角正交的现有手工路径可拖动线段；旧直线、自动避障与自环不被隐式转换。
2. SVG 控制柄视觉半径 5–6 CSS px、命中半径 22 CSS px，随相机缩放换算并在只变换相机、不重建 DOM 时同步校正；约 44 px 命中直径是项目要求，不是来源统一规定。
3. 路径点自由拖动，正交线段仅允许垂直其方向移动；固定 source/target 端点保持不变。预览期间只更改 SVG 路径与标签位置，松手单次 `checkpoint` 写入展示 `edge.waypoints`，再由用户明确 Save。
4. `pointercancel`、`lostpointercapture`、失焦、Esc 或第二指取消尚未提交的编辑。触屏实机连续性尚未测试，不能把源码保护当作 T04/T05 PASS。
5. 用 Eidos 上游 **差分式**修改移植 App vendor：只改 `edge-waypoints.ts` 与 `surface.ts` 中 B5a 相关位置，保留 `renderContextNavigationV010`。不引入新包，不修改业务方向。
6. 本轮发现 Eidos `tests/**/*.test.mjs` 由 shell 展开，只覆盖一级子目录；新增测试置于 `tests/diagram/` 才会由已有 npm test 路径实际执行。另发现 TypeScript `NodeListOf` 在当前 DOM lib 下不可直接 `for...of`，改用 `Array.from`。这些是 CI 直接发现并修复的工程事实，不属于外部研究更新。

## 已创建的 PR 与可追溯任务

| 仓库 | PR | 前置依赖 | 本轮内容 |
| --- | --- | --- | --- |
| Eidos | [#137](https://github.com/jiangxng/eidos/pull/137) | #136（更早 #130–#135） | 纯几何、选中路径 SVG handle、取消/撤销、Node 测试、Eidos B5a 文档 |
| App Platform | [#553](https://github.com/jiangxng/EVO-App-Platform/pull/553) | #550（更早 #537/#547/#549）及 Eidos #137 | 定点 vendor 移植、集成和导航边界测试、独立 Diagram CI 接线、39 项矩阵、本研究增量 |

- 两 PR 均 **Draft**，不主动 merge / deploy。当前 main 与跨仓库可用性独立核对。
- **新增技术风险（二）：** Eidos `src/diagram/surface.ts` 的 `executeOperation()` 请求在异步 `await actionHost.execute(request)` 前捕获 viewState；失败时 `!result.ok` 返回并保留内存 state，这为手动重试提供基础，但成功时当前代码立即 `state = stateFromResult(result.result)` 并清空 undo/redo。若保存期间仍允许本地编辑，后续编辑可能被较早的保存响应覆盖。要实现 D03/D05，保存时还需提交快照序号、编辑世代判定、重复提交限制以及冲突提示，不能仅检查服务端 CAS。
- **新增技术风险：** App Platform SAVE 使用的是 business `definitionRevision`；`projectionStore.put` 直接按业务定义版本键替换 gallery。双窗口保存需要独立 projection ETag + 真正原子 CAS。下一实现 B7 之前审查 UI 保存期间快照、失败后草稿保护和独立存储实例的原子保证。
- **尚未执行：** Windows Chrome/Edge、macOS trackpad、iOS/iPadOS Safari、Android Chrome 的真实手势；自动路径段、标签移动、对齐吸附、并发恢复、大图 200/400、500/1000、100/200 FPS。验收矩阵仍全部 NOT TESTED。
- **未改变先前决定：** 既有 S1–S7 研究和方案对比继续有效，没有新的外部相反证据；本轮将其转化为更小粒度实施。

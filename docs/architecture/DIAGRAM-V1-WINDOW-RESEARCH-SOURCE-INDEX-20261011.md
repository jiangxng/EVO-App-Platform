# EVO 2D Designer｜网络研究与 GitHub 实验证据详细索引（2026-10-11）

> 证据等级不能混淆：**已读原文**只用于实际读取的原站或 GitHub 源文件/日志；**仅看搜索摘要**表示未查看正文；**待验证**用于外站当前版本、设备、生产或缺失的附件。本窗口直接读取了 GitHub 已归档的前序研究索引、原始 v1.0 §14/§16、当前源码、PR diff 和多次 CI 日志，**没有重新打开七个第三方官网，也没有凭空生成截图或录屏**。
>
> 官方来源的首次阅读 2026-10-09、复核 2026-10-10 来自 [原始 §16](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) 和 [前序详细参考索引](./EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md)。这些是前序窗口的**原文已读档案**；本窗口 2026-10-11 的阅读等级是“已读归档原文、官网未重新核实”。不能把前人已读转写成本窗口访问记录。

## A. 官方参考网页 S1–S7：原始 URL、章节、发现、采用场景

**S1 — Miro: Using Miro with a mouse, trackpad, or touchscreen**
- 原始网址：https://help.miro.com/hc/en-us/articles/360017731053-Using-Miro-with-a-mouse-trackpad-or-touchscreen
- 查阅：前序 2026-10-09 首读、2026-10-10 复核原文；本窗 2026-10-11 **已读项目归档，未重访官网**。
- 位置：Switching between the pan and select tool；Navigation on the board；FAQ。**[网页事实·前序记录]** 鼠标、触控板、触屏有不同平移/缩放入口，Space/右键可参与移视角，触控板双指平移和捏合。
- **[EVO 选择]** M01/M05/M07/T01/T06 的输入分类与显式手机选择工具。**不采用**长按为手机唯一多选/框选入口。
- 插图来源：外站 new-mouse-trackpad.png、select_and_hand_mode.gif、minimap.png；**未下载到 GitHub，无本地截图**。

**S2 — React Flow: Panning and Zooming**
- 原始网址：https://reactflow.dev/learn/concepts/the-viewport
- 查阅：前序 2026-10-09/10 已读原文；本窗只读归档。章节：Viewport configurations → Default viewport controls / Design tool viewport controls。
- **[来源事实·前序记录]** 区分地图式拖拽平移与设计工具式拖动选择、中/右键或 Space+拖动平移，支持滚动/捏合不同组合。
- **[EVO 选择]** 左键空白框选、右/中/Space 平移；参考交互模型，不引入 React Flow 或更换引擎。

**S3 — draw.io: Style connectors**
- 原始网址：https://www.drawio.com/docs/manual/styles/connector-styles/
- 查阅：前序 2026-10-09/10 已读原文；本窗只读归档。章节：Style connectors、Line style、Colour、Arrowheads。
- **[来源事实·前序记录]** 角度/弧线、颜色、箭头可分开控制，曲线标签应贴合实际路径而不是旧直线段。
- **[EVO 选择]** 独立 pathKind/style/arrow；V01/V03/E04/E07 对路径及业务方向分离。不擅自复制 draw.io 的版本迁移策略。插图在原网页，未归档。

**S4 — draw.io: Work with waypoints on connectors to change their path**
- 原始网址：https://www.drawio.com/docs/manual/connectors/waypoints-connectors/
- 查阅：前序 2026-10-09/10 已读原文；本窗只读归档。章节：Add waypoints、Enter exact position、Remove/Clear waypoints、Move waypoints with the connected shapes。
- **[来源事实·前序记录]** 控制点可增删、精确调整、清除；Follow Terminals 是可选策略。
- **[EVO 选择]** E05 单端点移动保留手工点的世界坐标、双端点共同移动时等量平移，E06 重置路径时先警告并能 Undo。原网页插图未单独保存。

**S5 — draw.io: Work with connectors in draw.io**
- 原始网址：https://www.drawio.com/docs/manual/connectors/
- 查阅：前序 2026-10-09/10 已读原文；本窗只读归档。章节：Floating and fixed connectors、Draw a floating connector、Draw a fixed connector。
- **[来源事实·前序记录]** 连线终端可动态吸附周界或固定到不同连接点。**[EVO 选择]** sourceAnchor/targetAnchor 仅改变显示连接点，绝不改动实际业务 source/target 或创造关系。

**S6 — W3C WAI: Understanding SC 2.5.7 Dragging Movements**
- 原始网址：https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- 查阅：前序 2026-10-09/10 已读原文；本窗只读归档。章节：Success Criterion、Intent、Relationship to keyboard accessibility requirements、Alternatives for dragging movements、Sufficient Techniques。
- **[来源事实·前序记录]** 拖动操作通常需要单指针、无拖动动作的替代路径；仅可用键盘不自动证明满足这一准则。**[EVO 选择]** A02 应检控件、键盘及非拖动替代；E07 现有标签拖动不等于 WCAG 整站符合。真实辅助技术尚待验证。

**S7 — MDN: Pointer events**
- 原始网址：https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- 查阅：前序 2026-10-09/10 已读原文；本窗只读归档。章节：Pointer events、Capturing the pointer、touch-action CSS property。
- **[来源事实·前序记录]** pointerup、pointercancel、lostpointercapture 与 capture 生命周期并不等价。**[EVO 选择]** M09 失焦回滚，T02–T05 双指导航取消/恢复，E07 drag 取消；具体 Safari/Android 系统派发顺序待实机验证。

## B. 项目源文档与实现：本窗口 2026-10-11 已读 GitHub 原文

| 标题、原始可访问路径 | 阅读状态及定位 | 具体发现和现在用途 |
| --- | --- | --- |
| [原始商业化 v1.0](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) | 已读，2026-10-11，§13–§16 | §14 是 39 项唯一验收清单，§13 A/B 必交、C 明确可延期；§16 保存 S1–S7 官网地址。 |
| [2026-10-10 原始研究详细索引](./EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md)、[研究入口](./EOG-2D-DESIGNER-RESEARCH-HANDOFF-20261010.md) | 已读项目归档，2026-10-11；不等于重访外网 | 含前序官方来源具体网页章节、图片名称、P1–P14 设计权威。里面旧 stacked Draft PR 是历史状态。 |
| [B9j 研究来源索引](./DIAGRAM-COMMERCIAL-RESEARCH-REFERENCE-INDEX-B9J-20261011.md)、[B9j 交接入口](./DIAGRAM-COMMERCIAL-RESEARCH-HANDOFF-B9J-20261011.md) | 已读/参考项目归档，2026-10-11 | 复杂语言、路由拥塞、保存 CAS、旧窗技术分歧；当时的“未合并”结论不能覆盖本窗已核实的合并。 |
| [39 项证据矩阵](./DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md) | 已读相关行，2026-10-11 | 保留历史子场景与正式人工 NOT TESTED 的区分，不为了进度覆盖。 |
| [正式签收执行台账](./DIAGRAM-V1-FORMAL-ACCEPTANCE-EXECUTION-20261011.md) | 已读，2026-10-11，“逐项验收与合并规则” | PR+CI 合并不等于用户签名；商业人工仍 0/39。 |
| [B9r 实机操作协议](./DIAGRAM-B9R-39-ITEM-DEVICE-ACCEPTANCE-PROTOCOL-20261011.md) | 已读，2026-10-11，证据分级、设备矩阵 | Windows 鼠标、Mac 触控板、iOS Safari、Android Chrome 的型号/浏览器/手势/授权数据/安全录像/签署要求。 |
| [B7 投影 CAS](./DIAGRAM-B7-PROJECTION-CAS-20261010.md) | 已读，2026-10-11，“Evidence and design” | 投影写版本独立于业务定义 revision；旧客户端无 write token 的兼容路径是 D05 待验证风险。 |
| [B8b 保存回读/Viewer](./DIAGRAM-B8B-SAVE-RELOAD-VIEWER-20261010.md) | 已读，2026-10-11，“实际浏览器/Host 回路” | [Actions #38017423084](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38017423084) 说明已有保存与新 Designer/Viewer 机器子证据，不能当 D04 全场景 PASS。 |
| [P01a 大图性能](./DIAGRAM-P01A-LARGE-GRAPH-PERFORMANCE-INTEGRATION-20261010.md) | 已读，2026-10-11，“配对数据”“反例” | 200/400 和 500/1000 的合成真实浏览器样例存在改善及退化，P01 不得只选成功值。 |
| [B8x 同页双实例](./DIAGRAM-B8X-TWO-INSTANCE-ISOLATION-20261010.md) | 已读，2026-10-11，双实例浏览器试验 | 两份 Surface 同页选择、箭头 marker 和拥塞摘要隔离有技术证据，但 P02 仍需用户要求的保存/快捷键/实际场景。 |
| [Eidos 插件/Host 边界](./DIAGRAM-EIDOS-PLUGIN-BOUNDARY-CLOSEOUT-20261011.md) | 已读，2026-10-11，Activation and demo limitation | 部署 Railway 不等于实际租户已安装激活 2D Designer/Viewer；留意 Platform vendor Host 受控前移。 |

**本窗源码已直接读取的精确 GitHub 版本：**
- [Eidos owner Surface (E07 merged)](https://github.com/jiangxng/eidos/blob/0930d43f2e443d4777486531d93bbc524da31123/src/diagram/surface.ts) 与 [Platform Host Surface](https://github.com/jiangxng/EVO-App-Platform/blob/3908d862c8a86d6a684907ac721066202c22b777/vendor/eidos/src/diagram/surface.ts)：关注 Pointer/Undo/Redo、标签 SVG 与拖动状态（约 1300–1600、2380–2580、2830–3065、3370–3450 行）；[pin manifest](https://github.com/jiangxng/EVO-App-Platform/blob/3908d862c8a86d6a684907ac721066202c22b777/vendor/eidos/source.manifest.json) 不能丢 Host 差异。
- [投影视图契约](https://github.com/jiangxng/EVO-App-Platform/blob/3908d862c8a86d6a684907ac721066202c22b777/contracts/template-projection-gallery.ts)（20–40、120–145 行）、[EOG Projection](https://github.com/jiangxng/EVO-App-Platform/blob/3908d862c8a86d6a684907ac721066202c22b777/eog/definition-projection.ts)（425–460 行）、[Designer Host/Save](https://github.com/jiangxng/EVO-App-Platform/blob/3908d862c8a86d6a684907ac721066202c22b777/apps/eog-2d-designer/definition-projection-editor.ts)（375–395、540–605、853–900 行）、[readonly Viewer 转换](https://github.com/jiangxng/EVO-App-Platform/blob/3908d862c8a86d6a684907ac721066202c22b777/apps/eog-2d-viewer/template-preview.ts)（155–175 行）。E07 的 labelOffset 只属于展示契约，不能进入真实业务关系语义。
- [本窗口浏览器用例](https://github.com/jiangxng/EVO-App-Platform/blob/3908d862c8a86d6a684907ac721066202c22b777/tools/diagram-commercial-v01-v03-browser-proof.mjs) 与 [Actions 工作流](https://github.com/jiangxng/EVO-App-Platform/blob/3908d862c8a86d6a684907ac721066202c22b777/.github/workflows/diagram-commercial-v01-v03-browser.yml) 使用 Chromium 154、合成合法企业图和临时 FileStore/CAS，而非真实生产数据库与实体设备。

## C. 本窗口已实际执行、查看 GitHub Actions 日志的五项（2026-10-11）

| 编号/工程结果 | 原始 PR、最终 Actions URL | 关键日志结果及 GitHub 合并提交 |
| --- | --- | --- |
| M06 原地右键菜单保留群组选中 | [Platform #739](https://github.com/jiangxng/EVO-App-Platform/pull/739)；[Actions #38144940045](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38144940045) | Chromium UI 右键选中群组，无位置改动、无隐式保存；合并 e2bd62b9915d42be0bd6d4e70a26346e6e59c4b7 |
| E04 真曲线命中且无旧直线幽灵热区 | [#756](https://github.com/jiangxng/EVO-App-Platform/pull/756)；[Actions #38145067276](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38145067276) | Chromium 154 真 SVG 点击，最大曲线-弦线偏离 19.27710461896316px；合并 70af9e2b9767ae2df26fea4fcdb97e6ab5798ed5 |
| E05 移动单个/两个业务端点后手工点规则 | [#758](https://github.com/jiangxng/EVO-App-Platform/pull/758)；[成功 Actions #38145372283](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38145372283) | 单端点不动手工点，双端点同步平移；合并 42e56b4c916a3379ce8bd4ec6d25b74fc55fa204；[首轮失败 #38145234901](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38145234901) 是 Inspector 布局后旧 E04 鼠标坐标过期，已修测试。 |
| E06 手工 Curve/Orthogonal → Straight 警告/取消/Undo | [Platform #760](https://github.com/jiangxng/EVO-App-Platform/pull/760)、[Eidos #168](https://github.com/jiangxng/eidos/pull/168)、[Actions #38145622059](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38145622059) | 真 JS 确认弹窗两种路径均通过；Eidos 合并 390d4f673624162fe0cd4e297cbdaebee8b7bfe9，Platform 合并 9235da00ec4e4d3070ddb3960bb31876a934e52c |
| E07 拖标签/Undo/Redo/节点移动/保存/独立 Viewer 回读 | [Platform #761](https://github.com/jiangxng/EVO-App-Platform/pull/761)、[Eidos #169](https://github.com/jiangxng/eidos/pull/169)、[最终 Actions #38146591211](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38146591211) | labelOffset 实测 x=41.49350649350649、y=-23.97402597402597，原生鼠标拖动/独立 Viewer 一致、业务 revision 未变。早期 [失败 #38146322271](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38146322271)：Viewer 映射漏字段，已修；[失败 #38146448032](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38146448032)：E07 Save 顺序打破旧 CAS 断言，已修。Eidos 合并 0930d43f2e443d4777486531d93bbc524da31123，Platform 合并 3908d862c8a86d6a684907ac721066202c22b777。 |

**可变材料保存**：上述 GitHub Actions run 文本日志含 DIAGRAM_M06/E04/E05/E06/E07_BROWSER_SUBGATE 标记；浏览器工件通常由工作流上传 diagram-commercial-v01-v03-chrome（是否仍能下载受 GitHub Actions 保留期限制）。本窗口**没有新增可提供的 PNG 截图、录屏、原站素材附件**，不编造本地或 GitHub 附件路径。

## D. 未核实与资料冲突

- **仅搜索摘要**：本窗口未新增这种来源；不把 PR 标题/搜索摘要包装成已读原文。
- **待验证**：2026-10-11 S1–S7 外站内容是否改版、原站图片下载位置；物理 Windows/Mac/iOS/Android、真实 S2C/P2P 授权图、签收人；真正公网当前 main 已部署与租户 EOG 2D 已激活；生产 CAS/跨主机并发；现场性能/FPS/无拖动单指针替代。
- **历史状态可能冲突**：2026-10-10 及 B9j 文档里“stacked Draft 未合并”是旧时快照，不可覆盖本窗口五个已核实合并的 PR。正式签收的 NOT TESTED/0/39 **与机器子场景 29/39 同时成立**。性能旧文档包含反例，不得筛选有利数据。
- **易丢信息已保留**：官方七页的标题、原始 URL、定位章节、前序阅读时间、必要外站图片名；源码 commit permalink；成功/失败 Actions run 和错误原因。没有网页原文永久截图、客户测试录像可引用。

# EVO 2D Designer｜新窗口简短交接入口（2026-10-11）

> 本文只用于快速恢复；详细网络资料、阅读等级和证据见 [详细资料索引](./DIAGRAM-V1-WINDOW-RESEARCH-SOURCE-INDEX-20261011.md)；方案比较、冲突、模块映射及任务计划见 [决策与差距](./DIAGRAM-V1-WINDOW-DECISIONS-GAPS-20261011.md)。**原始权威**始终是 [商业化要求 v1.0 §14](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)，不是聊天摘要。

保存日期：2026-10-11（UTC+08）。本交接独立分支：docs/diagram-v1-batch1-window-handoff-20261011；建分支时 Platform main：a35d68ddef5abbf1adfa3290317e9a069ddc449f。Eidos owner 仓库：https://github.com/jiangxng/eidos。具体交接 HEAD 以 GitHub 分支最新提交为准。

## 1. 不变目标与用户决定

- 只改善现有 **EVO EOG 2D Designer / 2D Viewer** 商业化体验，包括鼠标、触控、连线编辑、投影保存、撤销/重做、排版、性能、同页多实例；不得因为开发方便引入原定 v1.0 §14 之外的功能。§13 的 A/B 阶段原定目标不延期；C 才是明确允许延期的后续增强。
- §14 原始共 **39 个编号**。用户曾批准对剩余 34 项各建独立 PR，并确定最后 15 项分三批：① M06+E04–E07（5）；② D01–D06（6）；③ A01–A02+P01–P02（4）。各项验证通过立即合入 main，不堆积 Draft，不逐项暂停要求用户确认。
- **不做传统 ERP 或业务逻辑修改**：投影只决定展示/隐藏、位置、路径和标签；不改变业务关系的 source/target、真实箭头方向、应用、账本、业务定义 revision。Eidos 负责通用绘图和输入，Platform 负责投影、权限、CAS、Host 和 Viewer。
- 不抢主线或 Agent 窗口：不改全局 authority/status、账本运行时、Agent 源文件；独立分支和 PR；维护 Platform vendored Eidos 的 Host context-navigation 差异，禁止用上游整份 surface.ts 盲覆盖。
- **自动化/合并/部署/人工签收五层区分**：当前已有浏览器机器子场景对应 **29/39** 个编号；这不意味着 29 项获得正式商用 PASS。可核实的商业人工签收仍 **0/39**。

## 2. 本窗口完成第一批：5/5 已合并

| 原编号 | 浏览器已核验的行为（仍非实机人工签收） | Platform PR | Eidos PR |
| --- | --- | --- | --- |
| M06 | 原地右键菜单出现，已选两节点群组不被取消，视角与节点位置不变，不隐式保存 | [#739](https://github.com/jiangxng/EVO-App-Platform/pull/739) | 复用既有通用能力 |
| E04 | 鼠标命中真正三次曲线，约 19.277px 的偏离弦线曲线段可点击，旧直线走廊不误命中 | [#756](https://github.com/jiangxng/EVO-App-Platform/pull/756) | 复用既有通用能力 |
| E05 | 单端点移动时手工路径点世界位置不变；双端点共同移动时手工路径点随群组位移平移 | [#758](https://github.com/jiangxng/EVO-App-Platform/pull/758) | 复用既有通用能力 |
| E06 | Curve/Orthogonal 转 Straight 提示路径重置，取消不变、确认后一次撤销恢复手工点 | [#760](https://github.com/jiangxng/EVO-App-Platform/pull/760) | [#168](https://github.com/jiangxng/eidos/pull/168) |
| E07 | 标签鼠标拖动、Undo/Redo、随节点移动、显式 Save、重新打开 Designer 与独立 readonly Viewer 位置一致 | [#761](https://github.com/jiangxng/EVO-App-Platform/pull/761) | [#169](https://github.com/jiangxng/eidos/pull/169) |

五个 Platform PR 和两项配套 Eidos PR 经 GitHub 核实均已 merged。E07 Platform squash 提交 3908d862c8a86d6a684907ac721066202c22b777；Eidos #169 squash 提交 0930d43f2e443d4777486531d93bbc524da31123。交接建分支时 Platform main 又向前移动，其他新提交不归本窗口认领。

## 3. 待做仅 10 项：不要添加新工作包

- **第二批 D01–D06（6）**：隐藏后保存只影响投影；连续编辑/撤销/重做/保存基线；保存失败重试草稿完整；保存后刷新、Viewer、模板预览与缩略图；双窗口/Agent 写入冲突及恢复；切换另一个投影不串选择/历史/相机/样式。
- **第三批 A01–A02、P01–P02（4）**：隐藏/锁定节点自动排版与撤销；系统大字、键盘和非拖动替代；200/400、500/1000 等真实规模和持续交互性能；同页两个图实例箭头/选择/焦点/事件/保存隔离。
- 先读 [39 项累计机器证据](./DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md)、[CAS 旧证据](./DIAGRAM-B7-PROJECTION-CAS-20261010.md)、[保存与 Viewer](./DIAGRAM-B8B-SAVE-RELOAD-VIEWER-20261010.md)、[性能反例](./DIAGRAM-P01A-LARGE-GRAPH-PERFORMANCE-INTEGRATION-20261010.md)、[双实例已有实验](./DIAGRAM-B8X-TWO-INSTANCE-ISOLATION-20261010.md)。这些历史文件内的 Draft/open 状态不一定仍准确，必须刷新 GitHub。

## 4. 工作及研究阅读顺序

1. 本入口 → [资料索引](./DIAGRAM-V1-WINDOW-RESEARCH-SOURCE-INDEX-20261011.md) → [决策/差距](./DIAGRAM-V1-WINDOW-DECISIONS-GAPS-20261011.md) → [原需求 §14](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)。
2. 原始官方外部资料 S1–S7 的网址、2026-10-09/10 研究时间、章节与插图位置见 [先前已归档索引](./EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md)。**本窗口仅重新阅读 GitHub 归档，并没有重新打开七个官网**；不能宣称最新网页已复核。
3. 浏览器真实子门禁入口：[测试脚本](../../tools/diagram-commercial-v01-v03-browser-proof.mjs) 与 [CI 配置](../../.github/workflows/diagram-commercial-v01-v03-browser.yml)；产品模块：[Platform Host Eidos Surface](../../vendor/eidos/src/diagram/surface.ts)、[vendor manifest](../../vendor/eidos/source.manifest.json)、[投影 Editor](../../apps/eog-2d-designer/definition-projection-editor.ts)、[readonly Viewer 映射](../../apps/eog-2d-viewer/template-preview.ts)。
4. 正式人工签收须执行 [正式验收台账](./DIAGRAM-V1-FORMAL-ACCEPTANCE-EXECUTION-20261011.md) 和 [B9r 实机协议](./DIAGRAM-B9R-39-ITEM-DEVICE-ACCEPTANCE-PROTOCOL-20261011.md)：物理 Windows Chrome/Edge、macOS 触控板、iOS Safari、Android Chrome、授权真实 S2C/P2P 场景、设备/日期/录像安全位置/执行者签名。最新 main 是否已公网部署、租户插件是否激活，**本窗口未验证**。
5. 其他窗口的独立研究恢复 PR [#715](https://github.com/jiangxng/EVO-App-Platform/pull/715) 不属于本交接，不修改或关闭。当前三个新交接文件仅存在 docs-only 分支，不能据此推断已合并 main 或部署。

**新窗口接续动作**：刷新 Platform 与 Eidos main 和当前 PR → 先复用已有 B7/B8/B9 技术证据 → 第二批 D01–D06 六个独立 PR 逐项实际浏览器与必要 CI 后合并 → 第三批 A01/A02/P01/P02 四个独立 PR → 整体回归并另做实机/人工签收。技术细节留 GitHub 对应小 PR，向用户只汇报原要求完成情况与剩余数。

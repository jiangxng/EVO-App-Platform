# Diagram v1.0 D02 — 连续编辑、Undo/Redo 与 Save 基线（2026-10-11）

## 原始权威与范围
商业化要求 `EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md` §14 D02：连续编辑、逐笔 Undo/Redo、显式保存、保存基线及未保存状态正确。无需新编号或新功能。

## 复用与实际缺口
- 复用第一批 E07/D01 的浏览器 Designer→App Handler→临时 FileStore CAS→只读 Viewer 夹具；复用 B7 投影独立版本及 B8 保存证据，不修改企业原始业务定义。
- 2026-10-11 直接检查 Eidos `src/diagram/surface.ts`：此前每次 Undo 恢复均固定显示“View adjusted locally. Save to persist changes.”，即使已完全回到最近一次成功保存的状态。此为源代码发现，不冒充已完成浏览器结论。
- 通用修复在 Eidos owner [PR #170](https://github.com/jiangxng/eidos/pull/170)，合并提交 `89ca893f2aeec760bf29a7cabe4e8e6ef04a421b`；Platform 只受控移植相同的 presentation snapshot baseline 判断，不整份覆盖 Host `surface.ts`，并在 `vendor/eidos/source.manifest.json` 精确保留 Host overlay blob。
- 异步保存成功但用户仍有较新本地修改时，仅对同一资源记录已提交的编辑快照为基线，不覆盖较新草稿；CAS/Agent/企业账本契约不改。

## 真正产品浏览器可观察动作
在前一 D01 保存后重新打开 Designer，执行“Restore all”→原生鼠标节点拖动→选中真实关系改成 Orthogonal（三笔不同编辑），连续 Undo 三次、Redo 三次，检查每一步可见性、位置、路径和没有隐式保存。随后显式 Save：CAS 3→4、旧 Undo/Redo 历史失效；再原生鼠标拖节点，Undo 回到刚保存的位置，界面重新显示 `Saved.`。核对业务定义历史不增。

## 证据与限制
- 使用 `DIAGRAM_D02_BROWSER_SUBGATE` 标志并由专用 GitHub CI 强制出现；CI 结论及失败必须以当前准确 Platform PR head 和 Actions 日志为准。
- 合成合法业务图、Chrome CI、临时 FileStore 不代表用户物理 Windows/macOS/iOS/Android、真实企业场景或生产租户。
- 正式商业签收 **0/39**，原 D02 人工验收仍 NOT TESTED；不改原 39 项矩阵、Agent、Ledger Runtime、全局项目状态及其他窗口 PR。
